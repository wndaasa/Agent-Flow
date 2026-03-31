const { FlowExecutor, FLOW_TYPES } = require("./executor");
const { AgentFlow } = require("../../models/agentFlow");

/**
 * @typedef {Object} LoadedFlow
 * @property {string} name - The name of the flow
 * @property {string} uuid - The UUID of the flow
 * @property {Object} config - The flow configuration details
 * @property {string} config.description - The description of the flow
 * @property {Array<{type: string, config: Object, [key: string]: any}>} config.steps - The steps of the flow. Each step has at least a type and config
 */

class AgentFlows {
  constructor() {}

  /**
   * Load a flow configuration by UUID
   * @param {string} uuid
   * @returns {Promise<LoadedFlow|null>}
   */
  static async loadFlow(uuid) {
    try {
      if (!uuid) return null;
      const row = await AgentFlow.get(uuid);
      if (!row) return null;
      const config = JSON.parse(row.config);
      return { name: row.name, uuid: row.uuid, config };
    } catch (error) {
      console.error("Failed to load flow:", error);
      return null;
    }
  }

  /**
   * Save a flow configuration
   * @param {string} name
   * @param {Object} config
   * @param {string|null} uuid
   * @returns {Promise<Object>}
   */
  static async saveFlow(name, config, uuid = null) {
    try {
      const supportedFlowTypes = Object.values(FLOW_TYPES).map(
        (definition) => definition.type
      );

      // nodes+edges 포맷과 레거시 steps[] 포맷 모두 지원
      const isGraphFormat =
        Array.isArray(config.nodes) && Array.isArray(config.edges);
      const blockTypes = isGraphFormat
        ? config.nodes.map((n) => n.type)
        : (config.steps || []).map((s) => s.type);

      // finish/output 노드는 터미널 노드이므로 FLOW_TYPES 검증에서 제외
      // - "finish" : 레거시 타입
      // - "output" : 신규 타입 (프론트엔드 리팩토링 이후)
      const filteredTypes = blockTypes.filter(
        (t) => t !== "finish" && t !== "output"
      );
      const supportsAllBlocks = filteredTypes.every((t) =>
        supportedFlowTypes.includes(t)
      );
      if (!supportsAllBlocks)
        throw new Error(
          "This flow includes unsupported blocks. They may not be supported by your version of AnythingLLM or are not available on this platform."
        );

      const row = await AgentFlow.upsert(name, { ...config, name }, uuid);
      return { success: true, uuid: row.uuid };
    } catch (error) {
      console.error("Failed to save flow:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all available flows
   * @returns {Promise<Array>}
   */
  static async listFlows() {
    try {
      const rows = await AgentFlow.list();
      const out = [];
      for (const row of rows) {
        try {
          const config = JSON.parse(row.config);
          out.push({
            name: row.name,
            uuid: row.uuid,
            description: config.description,
            active: row.active,
            updatedAt: row.updatedAt,
            config,
          });
        } catch (e) {
          console.warn(
            `[AgentFlows.listFlows] invalid config JSON (uuid=${row?.uuid}):`,
            e?.message || e
          );
          // 깨진 행 1개 때문에 전체 목록이 비는 것을 방지한다.
          continue;
        }
      }
      return out;
    } catch (error) {
      console.error("Failed to list flows:", error);
      return [];
    }
  }

  /**
   * Delete a flow by UUID
   * @param {string} uuid
   * @returns {Promise<Object>}
   */
  static async deleteFlow(uuid) {
    try {
      await AgentFlow.delete(uuid);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete flow:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a flow by UUID
   * @param {string} uuid - The UUID of the flow to execute
   * @param {Object} variables - Initial variables for the flow
   * @param {Object} aibitat - The aibitat instance from the agent handler
   * @returns {Promise<Object>} Result of flow execution
   */
  static async executeFlow(uuid, variables = {}, aibitat = null) {
    const flow = await AgentFlows.loadFlow(uuid);
    if (!flow) throw new Error(`Flow ${uuid} not found`);
    const flowExecutor = new FlowExecutor();
    return await flowExecutor.executeFlow(flow, variables, aibitat);
  }

  /**
   * Get all active flows as plugins that can be loaded into the agent
   * @returns {Promise<string[]>} Array of flow names in @@flow_{uuid} format
   */
  static async activeFlowPlugins() {
    const rows = await AgentFlow.list();
    return rows.filter((row) => row.active).map((row) => `@@flow_${row.uuid}`);
  }

  /**
   * Sanitize a flow name into a valid OpenAI-compatible tool name.
   * Must match ^[a-zA-Z0-9_-]{1,64}$
   * @param {string} flowName - The human-readable flow name
   * @returns {string|null} Sanitized tool name, or null if empty after sanitization
   */
  static sanitizeToolName(flowName) {
    const sanitized = flowName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/_+/g, "_")
      .replace(/^[-_]+|[-_]+$/g, "");
    if (!sanitized) return null;
    return sanitized.slice(0, 64);
  }

  /**
   * Load a flow plugin by its UUID
   * @param {string} uuid - The UUID of the flow to load
   * @returns {Object|null} Plugin configuration or null if not found
   */
  static async loadFlowPlugin(uuid) {
    const flow = await AgentFlows.loadFlow(uuid);
    if (!flow) return null;

    // nodes+edges 포맷과 레거시 steps[] 포맷 모두 지원
    const isGraphFormat =
      Array.isArray(flow.config.nodes) && Array.isArray(flow.config.edges);
    const startBlock = isGraphFormat
      ? flow.config.nodes?.find((n) => n.type === "start")
      : flow.config.steps?.find((s) => s.type === "start");
    // 그래프 포맷은 data 필드, 레거시는 config 필드 사용
    const variables = isGraphFormat
      ? startBlock?.data?.variables || []
      : startBlock?.config?.variables || [];
    const toolName = AgentFlows.sanitizeToolName(flow.name) || `flow_${uuid}`;

    return {
      name: toolName,
      description: `Execute agent flow: ${flow.name}`,
      plugin: (_runtimeArgs = {}) => ({
        name: toolName,
        description:
          flow.config.description || `Execute agent flow: ${flow.name}`,
        setup: (aibitat) => {
          aibitat.function({
            name: toolName,
            description:
              flow.config.description || `Execute agent flow: ${flow.name}`,
            parameters: {
              type: "object",
              properties: variables.reduce((acc, v) => {
                if (v.name) {
                  acc[v.name] = {
                    type: "string",
                    description:
                      v.description || `Value for variable ${v.name}`,
                  };
                }
                return acc;
              }, {}),
            },
            handler: async (args) => {
              aibitat.introspect(`Executing flow: ${flow.name}`);
              const result = await AgentFlows.executeFlow(uuid, args, aibitat);
              if (!result.success) {
                aibitat.introspect(
                  `Flow failed: ${result.results[0]?.error || "Unknown error"}`
                );
                return `Flow execution failed: ${result.results[0]?.error || "Unknown error"}`;
              }
              aibitat.introspect(`${flow.name} completed successfully`);

              // If the flow result has directOutput, return it
              // as the aibitat result so that no other processing is done
              if (!!result.directOutput) {
                aibitat.skipHandleExecution = true;
                return AgentFlows.stringifyResult(result.directOutput);
              }

              return AgentFlows.stringifyResult(result);
            },
          });
        },
      }),
      flowName: flow.name,
    };
  }

  /**
   * Stringify the result of a flow execution or return the input as is
   * @param {Object|string} input - The result to stringify
   * @returns {string} The stringified result
   */
  static stringifyResult(input) {
    return typeof input === "object" ? JSON.stringify(input) : String(input);
  }
}

module.exports.AgentFlows = AgentFlows;
