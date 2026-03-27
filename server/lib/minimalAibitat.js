const OpenAI = require("openai");

/**
 * Agent Flow LLMInstruction 전용 최소 어댑터 (OpenAI chat.completions).
 * Anthropic 등은 미구현 — 노드에서 provider 비우면 env 기본값 사용.
 */
class MinimalAibitat {
  constructor({ onLog } = {}) {
    this.handlerProps = { log: onLog || (() => {}) };
    this.introspect = () => {};
    this.defaultProvider = {
      provider: process.env.LLM_PROVIDER || "openai",
      model: process.env.OPEN_AI_MODEL_PREF || "gpt-4o",
    };
  }

  introspect() {}

  getProviderForConfig(config) {
    const provider =
      (typeof config.provider === "string" && config.provider) ||
      this.defaultProvider.provider;
    const model = config.model || this.defaultProvider.model;

    if (provider !== "openai") {
      throw new Error(
        `[agent-flow] 현재 LLM Instruction은 OpenAI만 지원합니다. (provider=${provider})`
      );
    }
    const apiKey = process.env.OPEN_AI_KEY;
    if (!apiKey) {
      throw new Error("OPEN_AI_KEY 가 설정되어 있지 않습니다.");
    }
    const client = new OpenAI({ apiKey });
    return { client, model, maxTokens: undefined };
  }
}

module.exports = { MinimalAibitat };
