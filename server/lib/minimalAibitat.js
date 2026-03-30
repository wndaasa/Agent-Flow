const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");

/**
 * Agent Flow LLMInstruction 전용 최소 어댑터.
 * OpenAI(기본) / Anthropic / Ollama 지원.
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

    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY 가 설정되어 있지 않습니다.");
      }
      const client = new Anthropic({ apiKey });
      return { client, model: model || "claude-opus-4-6", maxTokens: undefined, _isAnthropic: true };
    }

    if (provider === "openai" || provider === "ollama") {
      const apiKey = process.env.OPEN_AI_KEY;
      if (provider === "openai" && !apiKey) {
        throw new Error("OPEN_AI_KEY 가 설정되어 있지 않습니다.");
      }
      const clientOpts = { apiKey: apiKey || "ollama" };
      if (provider === "ollama") {
        clientOpts.baseURL = process.env.OLLAMA_BASE_PATH || "http://localhost:11434/v1";
      }
      const client = new OpenAI(clientOpts);
      return { client, model, maxTokens: undefined };
    }

    throw new Error(
      `[agent-flow] 지원하지 않는 LLM provider입니다. (provider=${provider})`
    );
  }
}

module.exports = { MinimalAibitat };
