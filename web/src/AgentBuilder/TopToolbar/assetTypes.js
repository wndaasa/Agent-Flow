/**
 * assetTypes.js — Add Assets 드롭다운 항목 레지스트리
 *
 * 구조: 그룹(ASSET_GROUPS) → 항목(items)
 *
 * ── 새 항목 추가 방법 ──────────────────────────────────────
 * 1. 기존 그룹에 item 추가 (같은 카테고리)
 *    또는
 *    새 그룹 객체를 ASSET_GROUPS 배열에 추가 (새 카테고리)
 * 2. item.nodeType 이 새로운 노드 타입이면:
 *    - nodeConstants.jsx 에 NODE_INFO 항목 추가
 *    - RightPanel/panelRegistry.js 에 Panel 컴포넌트 등록
 *    - index.jsx 의 NODE_TYPES 에 등록
 *    - server/utils/agentFlows/executors/ 에 executor 추가
 *
 * ── item 필드 ──────────────────────────────────────────────
 * id          : 고유 식별자 (string)
 * label       : 표시 이름 (string)
 * description : 부연 설명 (string)
 * nodeType    : 추가할 ReactFlow 노드 타입 (string)
 * defaultData : 노드 생성 시 초기 data (object)
 */

export const ASSET_GROUPS = [
  /* ── 데이터 변환 ────────────────────────────────────────── */
  {
    id: "transform",
    label: "데이터 변환",
    items: [
      {
        id: "code",
        label: "Code",
        description: "JavaScript 코드로 데이터를 가공·분리·변환합니다",
        nodeType: "code",
        defaultData: { code: "", resultVariable: "" },
      },
    ],
  },

  /* ── 변수 ───────────────────────────────────────────────── */
  {
    id: "variable",
    label: "변수",
    items: [
      {
        id: "setVariable",
        label: "Set Variable",
        description: "플로우 변수에 값을 저장하거나 변환합니다",
        nodeType: "setVariable",
        defaultData: { variableName: "", value: "" },
      },
    ],
  },

  /* ── 향후 확장 예시 (주석 해제 후 nodeType 구현 시 사용) ────
  {
    id: "external",
    label: "외부 연동",
    items: [
      {
        id: "apiCall",
        label: "API Call",
        description: "외부 API를 호출합니다",
        nodeType: "apiCall",
        defaultData: { url: "", method: "GET" },
      },
      {
        id: "webScraping",
        label: "Web Scraping",
        description: "웹페이지 콘텐츠를 스크래핑합니다",
        nodeType: "webScraping",
        defaultData: { url: "" },
      },
    ],
  },
  ─────────────────────────────────────────────────────────── */
];
