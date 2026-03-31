const { runAgentFlowLlmCompletion } = require("../llmOpenAiCompat");

/**
 * Execute an LLM instruction flow step
 * @param {Object} config Flow step configuration
 * @param {{introspect: Function, logger: Function, nodeId?: string, emitAgentStream?: Function}} context Execution context
 * @returns {Promise<{ value: string, reasoning: string | null }>} 본문(value)과 추론 텍스트(없으면 null)
 */
async function executeGenerate(config, context) {
  const { instruction, systemPrompt, provider, model, resultVariable } = config;
  const { introspect, logger, aibitat, nodeId, emitAgentStream } = context;
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - Generate 블록 실행 중`
  );
  introspect(`LLM 명령 처리 중...`);

  try {
    const providerConfig =
      provider || model
        ? {
            ...aibitat.defaultProvider,
            ...(provider ? { provider } : {}),
            ...(model ? { model } : {}),
          }
        : aibitat.defaultProvider;

    logger(
      `LLM 요청 전송 중 (${providerConfig.provider}::${providerConfig.model})`
    );
    introspect(`LLM에 요청 전송 중...`);

    let input = instruction;
    if (typeof input === "object") input = JSON.stringify(input);
    if (typeof input !== "string") input = String(input);

    const messages = [];
    if (
      systemPrompt &&
      typeof systemPrompt === "string" &&
      systemPrompt.trim()
    ) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }
    messages.push({ role: "user", content: input });

    const llmProvider = aibitat.getProviderForConfig(providerConfig);
    const nid = nodeId || "llm";
    const wantStream = typeof emitAgentStream === "function";

    const out = await runAgentFlowLlmCompletion({
      llmProvider,
      messages,
      wantStream,
      emit: emitAgentStream,
      nodeId: nid,
      fallbackComplete: () => llmProvider.complete(messages),
    });

    introspect(`LLM 응답 수신 완료`);
    if (resultVariable) config.resultVariable = resultVariable;

    return { value: out.value ?? "", reasoning: out.reasoning ?? null };
  } catch (error) {
    logger(`LLM 처리 실패: ${error.message}`, error);
    throw new Error(`LLM 처리 실패: ${error.message}`);
  }
}

module.exports = executeGenerate;
