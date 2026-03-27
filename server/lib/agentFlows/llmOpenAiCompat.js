const { splitLlmReasoningAndAnswer } = require("./splitLlmReasoning");
const {
  runAnthropicAgentFlowLlm,
  isAnthropicMessagesProvider,
} = require("./llmAnthropicCompat");

/**
 * OpenAI Chat Completions 호환 message / delta 에서 추론 텍스트 후보를 꺼낸다.
 * @param {object} msgOrDelta
 * @returns {string|null}
 */
function pickReasoningField(msgOrDelta) {
  if (!msgOrDelta || typeof msgOrDelta !== "object") return null;
  const r =
    msgOrDelta.reasoning_content ??
    msgOrDelta.reasoning ??
    (typeof msgOrDelta.thinking === "string" ? msgOrDelta.thinking : null);
  if (r == null) return null;
  const s = String(r);
  return s.length > 0 ? s : null;
}

/** Ollama 등 일부 스트림에서 message 객체에 thinking 이 올 때 */
function pickReasoningFromChunk(chunk) {
  const m = chunk?.message;
  if (!m) return null;
  return pickReasoningField(m);
}

/**
 * @param {import("openai").OpenAI} client
 * @param {string} model
 * @param {any[]} messages
 * @param {number} [maxTokens]
 */
async function chatCompletionsNonStream({
  client,
  model,
  messages,
  maxTokens,
}) {
  const req = { model, messages, stream: false };
  if (maxTokens != null && maxTokens > 0) req.max_tokens = maxTokens;
  const res = await client.chat.completions.create(req);
  return res?.choices?.[0]?.message ?? {};
}

/**
 * 스트리밍: delta 에서 추론 / 본문 청크를 구분해 콜백으로 넘긴다.
 * @param {(ev: { channel: 'reasoning'|'answer', chunk: string }) => void} onStream
 */
async function chatCompletionsStream({
  client,
  model,
  messages,
  maxTokens,
  onStream,
}) {
  const req = { model, messages, stream: true };
  if (maxTokens != null && maxTokens > 0) req.max_tokens = maxTokens;
  const stream = await client.chat.completions.create(req);

  let reasoningBuf = "";
  let answerBuf = "";

  for await (const chunk of stream) {
    const rMsg = pickReasoningFromChunk(chunk);
    if (rMsg) {
      reasoningBuf += rMsg;
      onStream({ channel: "reasoning", chunk: rMsg });
    }

    const delta = chunk?.choices?.[0]?.delta;
    if (delta) {
      const r = pickReasoningField(delta);
      if (r) {
        reasoningBuf += r;
        onStream({ channel: "reasoning", chunk: r });
      }
      if (delta.content) {
        answerBuf += delta.content;
        onStream({ channel: "answer", chunk: delta.content });
      }
    }
  }

  let merged = answerBuf;
  if (reasoningBuf.trim()) {
    merged = `<think>${reasoningBuf}</think>${answerBuf}`;
  }
  const split = splitLlmReasoningAndAnswer(merged);
  return {
    value: split.answer || answerBuf,
    reasoning:
      split.reasoning || (reasoningBuf.trim() ? reasoningBuf.trim() : null),
  };
}

/**
 * Agent Flow 전용: chat.completions 가 있으면 reasoning 필드를 살린다.
 * 없으면 provider.complete() 로 폴백한다.
 *
 * @param {object} opts
 * @param {object} opts.llmProvider aibitat provider (client, model, …)
 * @param {any[]} opts.messages
 * @param {boolean} opts.wantStream
 * @param {(ev: { type: string, nodeId: string } & Record<string, unknown>) => void} [opts.emit]
 * @param {string} opts.nodeId
 * @param {() => Promise<{ textResponse?: string, reasoning?: string }>} opts.fallbackComplete
 */
async function runAgentFlowLlmCompletion({
  llmProvider,
  messages,
  wantStream,
  emit,
  nodeId,
  fallbackComplete,
}) {
  const client = llmProvider.client;
  const model = llmProvider.model;
  const maxTokens = llmProvider.maxTokens;
  const hasChat =
    client && typeof client.chat?.completions?.create === "function";

  if (isAnthropicMessagesProvider(llmProvider)) {
    return runAnthropicAgentFlowLlm({
      llmProvider,
      messages,
      wantStream,
      emit,
      nodeId,
      fallbackComplete,
    });
  }

  if (!hasChat) {
    const completion = await fallbackComplete();
    const raw = completion.textResponse ?? "";
    let reasoning =
      typeof completion.reasoning === "string" && completion.reasoning.trim()
        ? completion.reasoning.trim()
        : null;
    const split = splitLlmReasoningAndAnswer(raw);
    if (!reasoning && split.reasoning) reasoning = split.reasoning;
    return { value: split.answer, reasoning };
  }

  if (wantStream && typeof emit === "function") {
    const out = await chatCompletionsStream({
      client,
      model,
      messages,
      maxTokens,
      onStream: ({ channel, chunk }) => {
        emit({
          type: "llm_stream",
          nodeId,
          channel,
          chunk,
        });
      },
    });
    return out;
  }

  const msg = await chatCompletionsNonStream({
    client,
    model,
    messages,
    maxTokens,
  });
  let reasoning = pickReasoningField(msg);
  let content = msg.content != null ? String(msg.content) : "";

  if (reasoning) {
    content = `<think>${reasoning}</think>${content}`;
  }
  const split = splitLlmReasoningAndAnswer(content);
  return {
    value: split.answer,
    reasoning: split.reasoning || (reasoning ? reasoning.trim() : null),
  };
}

module.exports = {
  runAgentFlowLlmCompletion,
  pickReasoningField,
};
