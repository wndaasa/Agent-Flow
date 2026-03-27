const vm = require("node:vm");

/**
 * Code 노드 실행기
 * - JavaScript 코드를 vm.runInNewContext 샌드박스에서 실행
 * - `variables` 객체를 통해 플로우 변수 읽기/쓰기 가능
 * - 코드의 return 값(또는 마지막 표현식 값)을 결과로 반환
 *
 * 보안:
 * - require, process, __dirname 등 Node 전역 접근 차단
 * - 실행 시간 제한 (기본 10초)
 */
async function executeCode(config, context) {
  const { code = "" } = config;
  if (!code.trim()) return "";

  // 코드를 즉시실행 async 함수로 감싸서 return 문 사용 가능하게 함
  const wrapped = `(async () => { ${code} })()`;

  const sandbox = {
    variables: context.variables,
    console: {
      log: (...args) => context.logger?.("[Code]", ...args),
      error: (...args) => context.logger?.("[Code:error]", ...args),
    },
    JSON,
    Math,
    Date,
    RegExp,
    Array,
    Object,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
  };

  const vmContext = vm.createContext(sandbox);

  try {
    const result = await vm.runInNewContext(wrapped, vmContext, {
      timeout: 10_000, // 10초 제한
      displayErrors: true,
    });

    // 결과를 문자열로 변환하여 반환 (다른 노드에서 사용 가능하도록)
    if (result === null || result === undefined) return "";
    if (typeof result === "object") return JSON.stringify(result);
    return String(result);
  } catch (error) {
    context.introspect?.(
      `Code 노드 실행 오류: ${error.message}`
    );
    throw new Error(`Code 실행 실패: ${error.message}`);
  }
}

module.exports = executeCode;
