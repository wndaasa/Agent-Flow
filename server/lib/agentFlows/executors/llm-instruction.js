const { runAgentFlowLlmCompletion } = require("../llmOpenAiCompat");

/**
 * Execute an LLM instruction flow step
 * @param {Object} config Flow step configuration
 * @param {{introspect: Function, logger: Function, nodeId?: string, emitAgentStream?: Function}} context Execution context
 * @returns {Promise<{ value: string, reasoning: string | null }>} 본문(value)과 추론 텍스트(없으면 null)
 */
async function executeLLMInstruction(config, context) {
  const { instruction, systemPrompt, provider, model, resultVariable } = config;
  const { introspect, logger, aibitat, nodeId, emitAgentStream } = context;
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing LLM Instruction block`
  );
  introspect(`Processing data with LLM instruction...`);

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
      `Sending request to LLM (${providerConfig.provider}::${providerConfig.model})`
    );
    introspect(`Sending request to LLM...`);

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

    introspect(`Successfully received LLM response`);
    if (resultVariable) config.resultVariable = resultVariable;

    return { value: out.value ?? "", reasoning: out.reasoning ?? null };
  } catch (error) {
    logger(`LLM processing failed: ${error.message}`, error);
    throw new Error(`LLM processing failed: ${error.message}`);
  }
}

module.exports = executeLLMInstruction;
