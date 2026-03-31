const { FLOW_TYPES } = require("./flowTypes");
const { autoVarName, autoLlmVarName, autoCodeVarName, autoApiVarName } = require("./autoVarNames");

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const executeApiCall = require("./executors/api-call");
const executeGenerate = require("./executors/generate");
const executeWebScraping = require("./executors/web-scraping");
const executeUserInput = require("./executors/user-input");
const executeSetVariable = require("./executors/set-variable");
const executeCode = require("./executors/code");
const { Telemetry } = require("../../models/telemetry");
const { safeJsonParse } = require("../http");

class FlowExecutor {
  constructor() {
    this.variables = {};
    this.introspect = (...args) => console.log("[introspect] ", ...args);
    this.logger = console.info;
    this.aibitat = null;
  }

  attachLogging(introspectFn = null, loggerFn = null) {
    this.introspect =
      introspectFn || ((...args) => console.log("[introspect] ", ...args));
    this.logger = loggerFn || console.info;
  }

  /**
   * Resolves nested values from objects using dot notation and array indices
   * Supports paths like "data.items[0].name" or "response.users[2].address.city"
   * @param {Object|string} obj
   * @param {string} path
   * @returns {string} The resolved value
   */
  getValueFromPath(obj = {}, path = "") {
    if (typeof obj === "string") obj = safeJsonParse(obj, {});

    if (
      !obj ||
      !path ||
      typeof obj !== "object" ||
      Object.keys(obj).length === 0 ||
      typeof path !== "string"
    )
      return "";

    const parts = [];
    let currentPart = "";
    let inBrackets = false;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char === "[") {
        inBrackets = true;
        if (currentPart) {
          parts.push(currentPart);
          currentPart = "";
        }
        currentPart += char;
      } else if (char === "]") {
        inBrackets = false;
        currentPart += char;
        parts.push(currentPart);
        currentPart = "";
      } else if (char === "." && !inBrackets) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = "";
        }
      } else {
        currentPart += char;
      }
    }

    if (currentPart) parts.push(currentPart);

    // 프로토타입 오염 방지: 위험 키 차단
    const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
    if (parts.some((p) => DANGEROUS_KEYS.has(p))) return "";

    let current = obj;

    for (const part of parts) {
      if (current === null || typeof current !== "object") return undefined;

      if (part.startsWith("[") && part.endsWith("]")) {
        const key = part.slice(1, -1);
        const cleanKey = key.replace(/^['"]|['"]$/g, "");

        if (DANGEROUS_KEYS.has(cleanKey)) return "";

        if (!isNaN(cleanKey)) {
          if (!Array.isArray(current)) return undefined;
          current = current[parseInt(cleanKey)];
        } else {
          if (!Object.prototype.hasOwnProperty.call(current, cleanKey)) return undefined;
          current = current[cleanKey];
        }
      } else {
        if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
        current = current[part];
      }

      if (current === undefined || current === null) return undefined;
    }

    return typeof current === "object" ? JSON.stringify(current) : current;
  }

  /**
   * 설정 객체 내 ${varName} 패턴을 변수 값으로 치환
   */
  replaceVariables(config) {
    const deepReplace = (obj) => {
      if (typeof obj === "string") {
        // ${변수명} 치환
        let result = obj.replace(/\${([^}]+)}/g, (match, varName) => {
          const value = this.getValueFromPath(this.variables, varName);
          return value !== undefined ? value : match;
        });
        // @블록명 또는 @블록명.속성.속성 치환 (긴 레이블 우선 매칭)
        if (this._labelToVar) {
          const labels = Object.keys(this._labelToVar).sort(
            (a, b) => b.length - a.length
          );
          for (const label of labels) {
            // @블록명.path.to.field 형태 지원 (path 없으면 전체 값)
            const re = new RegExp(
              `@${escapeRegExp(label)}(?:\\.([\\w\\u3131-\\uD79D.\\[\\]]+))?`,
              "g"
            );
            result = result.replace(re, (_match, path) => {
              const varName = this._labelToVar[label];
              const raw = this.variables[varName];
              if (raw === undefined) return _match;
              if (!path) return typeof raw === "object" ? JSON.stringify(raw) : raw;
              // path가 있으면 JSON 파싱 후 경로 탐색
              const obj =
                typeof raw === "string" ? safeJsonParse(raw, null) : raw;
              if (!obj || typeof obj !== "object") return _match;
              const val = this.getValueFromPath(obj, path);
              return val !== undefined ? val : _match;
            });
          }
        }
        return result;
      }
      if (Array.isArray(obj)) return obj.map((item) => deepReplace(item));
      if (obj && typeof obj === "object") {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = deepReplace(value);
        }
        return result;
      }
      return obj;
    };
    return deepReplace(config);
  }

  /**
   * 단일 노드(스텝) 실행
   */
  async executeStep(step) {
    this._pendingLlmReasoning = null;
    const config = this.replaceVariables(step.config || step.data || {});
    let result;
    const context = {
      introspect: this.introspect,
      variables: this.variables,
      logger: this.logger,
      aibitat: this.aibitat,
      nodeId: step.id,
      emitAgentStream:
        typeof this.emitAgentStream === "function"
          ? this.emitAgentStream.bind(this)
          : undefined,
    };

    const type = step.type;
    switch (type) {
      case FLOW_TYPES.START.type:
        if (config.variables) {
          config.variables.forEach((v) => {
            if (v.name && !this.variables[v.name]) {
              this.variables[v.name] = v.value || "";
            }
          });
        }
        result = this.variables;
        break;
      case FLOW_TYPES.API_CALL.type:
        result = await executeApiCall(config, context);
        break;
      case FLOW_TYPES.GENERATE.type: {
        const llmOut = await executeGenerate(config, context);
        result = llmOut.value;
        this._pendingLlmReasoning = llmOut.reasoning || null;
        break;
      }
      case FLOW_TYPES.WEB_SCRAPING.type:
        result = await executeWebScraping(config, context);
        break;
      case FLOW_TYPES.USER_INPUT.type:
        result = await executeUserInput(config, context);
        break;
      case FLOW_TYPES.SET_VARIABLE.type:
        result = await executeSetVariable(config, context);
        break;
      case FLOW_TYPES.CODE.type:
        result = await executeCode(config, context);
        break;
      case "output":
      case "finish": // 하위 호환
        // template 안의 @멘션·${변수} 는 replaceVariables로 이미 치환됨
        result = config.template || this.variables[config.outputVariable] || "";
        return { directOutput: true, result };
      default:
        throw new Error(`Unknown flow type: ${type}`);
    }

    // 결과 변수 저장: resultVariable 미지정 시 노드 ID 기반 자동 변수명으로 저장
    if (type === FLOW_TYPES.GENERATE.type) {
      const varName = config.resultVariable || autoLlmVarName(step.id);
      this.variables[varName] = result;
    } else if (type === FLOW_TYPES.CODE.type) {
      const varName = config.resultVariable || autoCodeVarName(step.id);
      this.variables[varName] = result;
    } else if (type === FLOW_TYPES.API_CALL.type) {
      const varName = config.resultVariable || autoApiVarName(step.id);
      this.variables[varName] = result;
    } else if (config.resultVariable) {
      this.variables[config.resultVariable] = result;
    }

    if (config.directOutput) result = { directOutput: true, result };
    return result;
  }

  // ─── 그래프 실행 ───────────────────────────────────────────────

  /**
   * nodes + edges 포맷의 그래프에서 위상정렬로 실행 레벨 배열을 만든다.
   * 같은 레벨의 노드는 병렬 실행 대상.
   * @param {Array} nodes  ReactFlow 노드 배열
   * @param {Array} edges  ReactFlow 엣지 배열
   * @returns {Array<Array>} 레벨별 노드 배열 [[level0], [level1], ...]
   */
  buildExecutionLevels(nodes, edges) {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // 각 노드의 in-degree(들어오는 엣지 수) 계산
    const inDegree = new Map(nodes.map((n) => [n.id, 0]));
    const successors = new Map(nodes.map((n) => [n.id, []]));

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      successors.get(edge.source)?.push(edge.target);
    }

    // in-degree=0인 노드부터 BFS
    const levels = [];
    let currentLevel = [...inDegree.entries()]
      .filter(([, deg]) => deg === 0)
      .map(([id]) => id);

    while (currentLevel.length > 0) {
      levels.push(currentLevel.map((id) => nodeMap.get(id)).filter(Boolean));
      const nextLevel = [];
      for (const id of currentLevel) {
        for (const nextId of successors.get(id) || []) {
          const newDeg = inDegree.get(nextId) - 1;
          inDegree.set(nextId, newDeg);
          if (newDeg === 0) nextLevel.push(nextId);
        }
      }
      currentLevel = nextLevel;
    }

    // 순환 감지: 레벨에 포함되지 못한 노드가 있으면 순환 존재
    const visitedCount = levels.reduce((sum, lvl) => sum + lvl.length, 0);
    if (visitedCount < nodes.length) {
      const visitedIds = new Set(levels.flat().map((n) => n.id));
      const cycleNodes = nodes.filter((n) => !visitedIds.has(n.id));
      console.error(
        `[FlowExecutor] ⚠ 순환 엣지 감지! 실행 불가 노드: ${cycleNodes.map((n) => `${n.id}(${n.type})`).join(", ")}`
      );
    }

    return levels;
  }

  /**
   * 그래프 기반 flow 실행 (nodes + edges 포맷)
   * 같은 레벨의 노드는 Promise.all로 병렬 실행
   */
  async executeGraphFlow(flow, initialVariables = {}) {
    const { nodes, edges } = flow.config;

    // 노드 타입별 기본 레이블 (프론트 NODE_INFO.label과 동일하게 유지)
    const DEFAULT_NODE_LABELS = {
      userInput: "User Input",
      generate: "Generate",
      setVariable: "Set Variable",
      code: "Code",
    };

    // @블록명 참조를 위한 레이블 → 변수명 매핑 구성
    this._labelToVar = {};
    for (const node of nodes) {
      if (["start", "finish", "output"].includes(node.type)) continue;
      const label = node.data?.title?.trim() || DEFAULT_NODE_LABELS[node.type] || node.type;
      if (!label) continue;
      if (node.type === "userInput") {
        this._labelToVar[label] = autoVarName(node.id);
      } else if (node.type === "generate") {
        this._labelToVar[label] =
          node.data?.resultVariable || autoLlmVarName(node.id);
      } else if (node.type === "code") {
        this._labelToVar[label] =
          node.data?.resultVariable || autoCodeVarName(node.id);
      } else if (node.type === "apiCall") {
        this._labelToVar[label] =
          node.data?.resultVariable || autoApiVarName(node.id);
      } else if (node.data?.variableName) {
        this._labelToVar[label] = node.data.variableName;
      }
    }

    // start 노드에서 기본 변수 초기화
    const startNode = nodes.find((n) => n.type === "start");
    const startVars = (startNode?.data?.variables || []).reduce(
      (acc, v) => ({ ...acc, [v.name]: v.value || "" }),
      {}
    );
    this.variables = { ...startVars, ...initialVariables };

    const levels = this.buildExecutionLevels(nodes, edges);
    console.log(
      `[FlowExecutor] 노드 ${nodes.length}개, 엣지 ${edges.length}개 → 레벨 ${levels.length}개`
    );
    console.log(
      `[FlowExecutor] 엣지: ${edges.map((e) => `${e.source} → ${e.target}`).join(", ")}`
    );
    levels.forEach((lvl, i) => {
      console.log(
        `[FlowExecutor]   Level ${i}: ${lvl.map((n) => `${n.id}(${n.type})`).join(", ")}`
      );
    });

    const results = [];
    let directOutputResult = null;

    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      const level = levels[levelIdx];
      // output/finish 노드는 일반 레벨에서 실행 (directOutput 반환)
      const executableNodes = level.filter((n) => n.type !== "start");
      if (executableNodes.length === 0) continue;

      console.log(
        `[FlowExecutor] ▶ Level ${levelIdx} 실행: ${executableNodes.map((n) => `${n.id}(${n.type})`).join(", ")}`
      );

      // 병렬 실행 (각 노드는 현재 variables 스냅샷 기준으로 실행)
      const levelResults = await Promise.allSettled(
        executableNodes.map((node) =>
          this.executeStep({
            id: node.id,
            type: node.type,
            config: node.data || {},
          })
        )
      );

      for (let i = 0; i < levelResults.length; i++) {
        const res = levelResults[i];
        const nodeId = executableNodes[i]?.id;
        if (res.status === "rejected") {
          console.log(
            `[FlowExecutor]   ✗ ${nodeId} 실패: ${res.reason?.message}`
          );
          results.push({
            success: false,
            error: res.reason?.message || "Unknown error",
          });
        } else {
          if (res.value?.directOutput) {
            console.log(`[FlowExecutor]   ◆ ${nodeId} directOutput 감지`);
            directOutputResult = res.value.result;
          }
          results.push({ success: true, result: res.value });
        }
      }

      // 병렬 레벨 중 하나라도 directOutput이면 중단
      if (directOutputResult !== null) {
        console.log(`[FlowExecutor] directOutput으로 플로우 종료`);
        break;
      }

      // 실패한 노드가 있으면 중단
      const failed = results.find((r) => !r.success);
      if (failed) {
        console.log(
          `[FlowExecutor] 실패 노드 감지, 플로우 중단: ${failed.error}`
        );
        break;
      }
    }

    // Finish 노드의 outputVariable이 지정된 경우 해당 변수 값을 최종 출력으로 사용
    if (!directOutputResult) {
      const finishNode = nodes.find((n) => n.type === "finish");
      const outputVar = finishNode?.data?.outputVariable;
      if (outputVar && this.variables[outputVar] !== undefined) {
        directOutputResult = this.variables[outputVar];
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      variables: this.variables,
      directOutput: directOutputResult,
    };
  }

  // ─── 레거시(steps[]) 실행 ─────────────────────────────────────

  /**
   * 기존 steps[] 포맷 순차 실행 (하위 호환)
   * @deprecated steps[] 포맷은 더 이상 사용하지 않습니다. nodes+edges 포맷으로 마이그레이션하세요.
   *   향후 버전에서 제거될 예정입니다.
   */
  async executeLegacyFlow(flow, initialVariables = {}) {
    console.warn(
      `[executor] 레거시 steps[] 포맷으로 실행 중 (flow id=${flow.id ?? "?"}, uuid=${flow.uuid ?? "?"}). ` +
      `이 포맷은 deprecated되었으며 향후 제거됩니다. nodes+edges 포맷으로 전환하세요.`
    );
    this.variables = {
      ...(
        flow.config.steps.find((s) => s.type === "start")?.config?.variables ||
        []
      ).reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
      ...initialVariables,
    };

    const results = [];
    let directOutputResult = null;

    for (const step of flow.config.steps) {
      try {
        const result = await this.executeStep(step);
        if (result?.directOutput) {
          directOutputResult = result.result;
          break;
        }
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
        break;
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      variables: this.variables,
      directOutput: directOutputResult,
    };
  }

  // ─── 진입점 ───────────────────────────────────────────────────

  /**
   * flow 실행 - nodes+edges 포맷과 steps[] 포맷 모두 지원
   */
  async executeFlow(flow, initialVariables = {}, aibitat) {
    await Telemetry.sendTelemetry("agent_flow_execution_started");
    this.aibitat = aibitat;
    this.attachLogging(aibitat?.introspect, aibitat?.handlerProps?.log);

    const isGraphFormat =
      Array.isArray(flow.config.nodes) && Array.isArray(flow.config.edges);

    if (isGraphFormat) {
      return await this.executeGraphFlow(flow, initialVariables);
    } else {
      return await this.executeLegacyFlow(flow, initialVariables);
    }
  }
}

module.exports = {
  FlowExecutor,
  FLOW_TYPES,
};
