/**
 * User Input 실행기
 * - 플로우 실행 시 initialVariables에 해당 변수가 미리 제공된 경우 그 값을 사용
 * - 없으면 블록에 설정된 defaultValue 사용
 * - 향후 빌더 내 실행 모달에서 사용자 입력값을 initialVariables로 전달하는 방식으로 확장 예정
 */
async function executeUserInput(config, context) {
  const { variableName, defaultValue = "" } = config;

  // initialVariables로 미리 제공된 값 우선 사용
  const value =
    variableName && context.variables[variableName] !== undefined
      ? context.variables[variableName]
      : defaultValue;

  if (variableName) context.variables[variableName] = value;
  return value;
}

module.exports = executeUserInput;
