const { FlowExecutor } = require("./executor");
const { autoVarName } = require("./autoVarNames");

/**
 * 스트리밍 실행기 - SSE 이벤트를 에밋하며 플로우를 실행
 * User Input 블록에서 일시정지 후 사용자 입력을 기다림
 */
class StreamFlowExecutor extends FlowExecutor {
  /**
   * @param {{ onEvent: (event: object) => void }} options
   */
  constructor({ onEvent }) {
    super();
    this.onEvent = onEvent;
    /** LLM 스트리밍 청크 → SSE (FlowExecutor context 로 전달) */
    this.emitAgentStream = (evt) => this.onEvent(evt);
    this.inputResolvers = new Map(); // nodeId → resolve 함수 (병렬 User Input 지원)
  }

  /**
   * 외부에서 특정 노드의 User Input 값을 주입해 실행 재개
   * @param {string} nodeId
   * @param {string} value
   */
  resolveInput(nodeId, value) {
    const fn = this.inputResolvers.get(nodeId);
    if (fn) {
      this.inputResolvers.delete(nodeId);
      fn(value);
    }
  }

  /** 현재 대기 중인 노드 ID 목록 반환 */
  get pendingInputNodeIds() {
    return [...this.inputResolvers.keys()];
  }

  /**
   * executeStep 오버라이드: 이벤트 에밋 + User Input 일시정지 추가
   */
  async executeStep(step) {
    const type = step.type;

    // start/finish/output는 instrumentation 없이 그대로 실행
    if (type === "start" || type === "finish" || type === "output") {
      return super.executeStep(step);
    }

    const startTime = Date.now();
    const nodeId = step.id || step.type;
    const label = this._getLabel(step);

    // ── User Input: 일시정지 후 대기 ──────────────────────────────
    if (type === "userInput") {
      const config = this.replaceVariables(step.config || step.data || {});
      const { prompt } = config;
      // 변수명은 노드 ID 기반 자동 생성 (프론트와 동일한 로직)
      const variableName = autoVarName(step.id);

      console.log(
        `[StreamExecutor] userInput node: id=${step.id}, nodeId=${nodeId}, variableName=${variableName}, hasValue=${this.variables[variableName] !== undefined}`
      );

      this.onEvent({
        type: "node_start",
        nodeId,
        nodeType: type,
        label: config.title || prompt || label,
      });

      let value;
      // 이미 variables에 값이 있으면 대기 없이 통과
      if (
        this.variables[variableName] !== undefined &&
        this.variables[variableName] !== ""
      ) {
        console.log(
          `[StreamExecutor] userInput: variable already set, skipping wait`
        );
        value = this.variables[variableName];
      } else {
        console.log(
          `[StreamExecutor] userInput: emitting waiting_for_input, waiting...`
        );
        // 프론트에 입력 요청 이벤트 에밋 후 대기 (nodeId별로 독립 관리)
        this.onEvent({
          type: "waiting_for_input",
          nodeId,
          variableName,
          prompt: prompt || "입력하세요",
          inputType: config.inputType || "any",
          required: config.required ?? false,
        });
        value = await new Promise((resolve) => {
          this.inputResolvers.set(nodeId, resolve);
        });
      }

      this.variables[variableName] = value;

      // 콘솔 표시용 미리보기 (전체 내용은 variables에 저장)
      const previewResult = (() => {
        if (!value || typeof value !== "string") return String(value || "");
        return value.length > 500
          ? `${value.slice(0, 500)}…(총 ${value.length.toLocaleString()}자)`
          : value;
      })();

      this.onEvent({
        type: "node_complete",
        nodeId,
        nodeType: type,
        label: prompt || label,
        result: previewResult,
        duration: Date.now() - startTime,
      });
      return value;
    }

    // ── 일반 노드: super.executeStep 래핑 ────────────────────────
    this.onEvent({ type: "node_start", nodeId, nodeType: type, label });

    try {
      const result = await super.executeStep(step);
      const resultStr =
        result === null || result === undefined
          ? ""
          : typeof result === "object"
            ? JSON.stringify(result)
            : String(result);

      const stepData = step.data || step.config || {};
      const completeEvent = {
        type: "node_complete",
        nodeId,
        nodeType: type,
        label,
        /** 플로우 빌더에서 지정한 노드 제목 — 산출 파일명·인덱스에 사용 */
        nodeTitle: stepData.title || null,
        result: resultStr,
        duration: Date.now() - startTime,
      };
      if (type === "generate" && this._pendingLlmReasoning) {
        completeEvent.reasoning = this._pendingLlmReasoning;
      }
      this.onEvent(completeEvent);
      return result;
    } catch (error) {
      this.onEvent({
        type: "node_error",
        nodeId,
        nodeType: type,
        label,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /** 노드 라벨 결정 (표시용) */
  _getLabel(step) {
    const data = step.data || step.config || {};
    switch (step.type) {
      case "generate":
        return data.instruction
          ? data.instruction.slice(0, 40) +
              (data.instruction.length > 40 ? "…" : "")
          : "Generate";
      case "setVariable":
        return data.variableName ? `Set: ${data.variableName}` : "Set Variable";
      case "userInput":
        return data.prompt || "User Input";
      case "code":
        return data.title || "Code";
      case "output":
      case "finish":
        return "Output";
      default:
        return step.type;
    }
  }
}

module.exports = { StreamFlowExecutor };
