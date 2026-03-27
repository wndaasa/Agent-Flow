/**
 * 필드 옵션 레지스트리 — 패널·노드에서 드롭다운으로 쓰는 정적 목록 (한 곳에서만 정의)
 */

/** User Input 노드 — 입력 유형 */
export const USER_INPUT_TYPE_OPTIONS = [
  { value: "any", label: "Any (텍스트 + 파일 선택)" },
  { value: "text", label: "Text only" },
  { value: "file", label: "File upload" },
];

/** API Call / HTTP 블록 — 기본 메서드 */
export const DEFAULT_HTTP_METHOD = "GET";

/** API Call — Method 셀렉트 */
export const HTTP_METHOD_OPTIONS = ["GET", "POST", "DELETE", "PUT", "PATCH"];

/** Body(JSON/폼)를 쓰는 메서드 (ApiCallNode 등에서 공통 사용) */
export const HTTP_METHODS_WITH_BODY = ["POST", "PUT", "PATCH"];
