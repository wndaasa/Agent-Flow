/**
 * 노드 ID 기반 자동 변수명 생성 유틸
 *
 * 웹 프론트(web/src/AgentBuilder/utils/autoVarNames.js)와 동일한 로직을 유지해야 함.
 * 변경 시 양쪽 모두 수정할 것.
 */

const AUTO_VAR_NAME_LENGTH = 8;

function autoVarName(nodeId) {
  const tail = (nodeId || "input").split("_").pop();
  return `input_${tail.slice(-AUTO_VAR_NAME_LENGTH)}`;
}

function autoLlmVarName(nodeId) {
  const tail = (nodeId || "llm").split("_").pop();
  return `llm_${tail.slice(-AUTO_VAR_NAME_LENGTH)}`;
}

function autoApiVarName(nodeId) {
  const tail = (nodeId || "api").split("_").pop();
  return `api_${tail.slice(-AUTO_VAR_NAME_LENGTH)}`;
}

module.exports = { autoVarName, autoLlmVarName, autoApiVarName };
