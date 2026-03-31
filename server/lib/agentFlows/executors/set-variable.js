/**
 * Set Variable 실행기
 * - 지정한 변수명에 값을 저장
 * - value 필드는 replaceVariables를 통해 ${varName} 치환이 이미 완료된 상태로 전달됨
 */
async function executeSetVariable(config, context) {
  const { variableName, value = "" } = config;
  if (!variableName) throw new Error("Set Variable 노드: variableName이 지정되지 않았습니다.");
  context.variables[variableName] = value;
  return value;
}

module.exports = executeSetVariable;
