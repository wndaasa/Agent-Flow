/**
 * Claude (Anthropic Messages API) — Extended thinking 블록 추출
 * OpenAI chat.completions 와 달리 `client.messages` + `thinking` 파라미터가 필요하다.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
 */

const { splitLlmReasoningAndAnswer } = require("./splitLlmReasoning");

const DEFAULT_THINKING_BUDGET = 10000;
const DEFAULT_MAX_OUTPUT = 16000;

function envInt(name, fallback) {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function extendedThinkingEnabled() {
  return process.env.ANTHROPIC_AGENT_FLOW_EXTENDED_THINKING !== "false";
}

/**
 * llm-instruction 이 넘기는 OpenAI 스타일 messages → [system 문자열, Anthropic messages]
 */
function prepareAnthropicMessages(messages) {
  let systemPrompt =
    "You are a helpful ai assistant who can assist the user and use tools available to help answer the users prompts and questions.";
  const chats = [];

  for (const msg of messages || []) {
    if (msg.role === "system") {
      systemPrompt =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      continue;
    }
    if (msg.role === "user" || msg.role === "assistant") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      chats.push({
        role: msg.role,
        content: [{ type: "text", text }],
      });
    }
  }

  if (chats.length > 0 && chats[0].role !== "user") {
    chats.shift();
  }

  return [systemPrompt, chats];
}

function parseAnthropicContentBlocks(content) {
  let thinking = "";
  let text = "";
  for (const block of content || []) {
    if (block.type === "thinking" && block.thinking) {
      thinking += String(block.thinking);
    }
    if (block.type === "text" && block.text) {
      text += String(block.text);
    }
  }
  return {
    value: text,
    reasoning: thinking.trim() ? thinking.trim() : null,
  };
}

/** 스트림 델타에서 thinking / text 조각 추출 (SDK·모델 버전별 필드명 차이 대응) */
function extractThinkingDeltaPiece(delta) {
  if (!delta || typeof delta !== "object") return null;
  if (delta.thinking != null && String(delta.thinking).length > 0) {
    return String(delta.thinking);
  }
  const t = delta.type;
  if (t === "thinking_delta" || t === "thinking") {
    const piece = delta.text;
    if (piece != null && String(piece).length > 0) return String(piece);
  }
  return null;
}

function extractTextDeltaPiece(delta) {
  if (!delta || typeof delta !== "object") return null;
  if (delta.type === "text_delta" && delta.text != null)
    return String(delta.text);
  return null;
}

async function anthropicMessagesStream({ client, baseParams, emit, nodeId }) {
  const stream = await client.messages.create(
    { ...baseParams, stream: true },
    { headers: { "anthropic-beta": "tools-2024-04-04" } }
  );

  let reasoningBuf = "";
  let answerBuf = "";

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta) {
      const td = extractThinkingDeltaPiece(chunk.delta);
      if (td) {
        reasoningBuf += td;
        emit({ type: "llm_stream", nodeId, channel: "reasoning", chunk: td });
      }
      const tx = extractTextDeltaPiece(chunk.delta);
      if (tx) {
        answerBuf += tx;
        emit({ type: "llm_stream", nodeId, channel: "answer", chunk: tx });
      }
    }
  }

  return {
    value: answerBuf,
    reasoning: reasoningBuf.trim() ? reasoningBuf.trim() : null,
  };
}

async function anthropicMessagesComplete({ client, baseParams }) {
  const response = await client.messages.create(
    { ...baseParams, stream: false },
    { headers: { "anthropic-beta": "tools-2024-04-04" } }
  );
  return parseAnthropicContentBlocks(response.content);
}

/**
 * @param {object} opts
 * @param {import("../agents/aibitat/providers/anthropic")} opts.llmProvider
 */
async function runAnthropicAgentFlowLlm({
  llmProvider,
  messages,
  wantStream,
  emit,
  nodeId,
  fallbackComplete,
}) {
  const client = llmProvider.client;
  const model = llmProvider.model;
  const [systemPrompt, chats] = prepareAnthropicMessages(messages);

  const budget = envInt(
    "ANTHROPIC_AGENT_FLOW_THINKING_BUDGET_TOKENS",
    DEFAULT_THINKING_BUDGET
  );
  let maxOutput = envInt("ANTHROPIC_AGENT_FLOW_MAX_TOKENS", DEFAULT_MAX_OUTPUT);
  if (maxOutput <= budget) maxOutput = budget + 4096;

  const baseThinking = extendedThinkingEnabled()
    ? {
        thinking: { type: "enabled", budget_tokens: budget },
        max_tokens: maxOutput,
        model,
        system: systemPrompt,
        messages: chats,
      }
    : {
        max_tokens: Math.min(maxOutput, 8192),
        model,
        system: systemPrompt,
        messages: chats,
      };

  const runWithThinking = async () => {
    if (wantStream && typeof emit === "function" && extendedThinkingEnabled()) {
      return anthropicMessagesStream({
        client,
        baseParams: baseThinking,
        emit,
        nodeId,
      });
    }
    if (extendedThinkingEnabled()) {
      return anthropicMessagesComplete({ client, baseParams: baseThinking });
    }
    const completion = await fallbackComplete();
    const raw = completion.textResponse ?? "";
    const split = splitLlmReasoningAndAnswer(raw);
    return { value: split.answer, reasoning: split.reasoning };
  };

  try {
    return await runWithThinking();
  } catch (err) {
    const msg = err?.message || String(err);
    console.warn(
      `[llmAnthropicCompat] extended thinking / messages 경로 실패, complete 폴백: ${msg}`
    );
    const completion = await fallbackComplete();
    const raw = completion.textResponse ?? "";
    const split = splitLlmReasoningAndAnswer(raw);
    return { value: split.answer, reasoning: split.reasoning };
  }
}

function isAnthropicMessagesProvider(llmProvider) {
  const c = llmProvider?.client;
  return (
    llmProvider?.constructor?.name === "AnthropicProvider" &&
    c &&
    typeof c.messages?.create === "function" &&
    typeof c.chat?.completions?.create !== "function"
  );
}

module.exports = {
  runAnthropicAgentFlowLlm,
  isAnthropicMessagesProvider,
};
