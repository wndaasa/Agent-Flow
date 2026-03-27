/**
 * LLM 응답 문자열에서 추론(reasoning) 구간을 분리한다.
 * AnythingLLM / 각 AiProvider가 `<think>` … `</think>` 로 감싼 추론과 본문을 한 문자열로 돌려주는 패턴과 호환된다.
 * 추론이 없으면 reasoning 은 null 이다.
 *
 * @param {string} fullText
 * @returns {{ answer: string, reasoning: string | null }}
 */
function splitLlmReasoningAndAnswer(fullText) {
  const raw = fullText == null ? "" : String(fullText);
  if (!raw) {
    return { answer: "", reasoning: null };
  }

  const blocks = [];
  const re = /<think>([\s\S]*?)<\/think>/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    blocks.push(m[1].trim());
  }

  const reasoning =
    blocks.length > 0 ? blocks.filter(Boolean).join("\n\n") : null;
  const answer = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  return {
    answer: answer || (reasoning ? "" : raw.trim()),
    reasoning: reasoning && reasoning.length > 0 ? reasoning : null,
  };
}

module.exports = { splitLlmReasoningAndAnswer };
