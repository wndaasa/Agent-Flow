/**
 * generateTypes.js — Generate 드롭다운 항목 레지스트리
 *
 * 구조: 그룹(GENERATE_GROUPS) → 항목(items)
 *
 * ── 새 모델/타입 추가 방법 ──────────────────────────────────────
 * 1. 기존 그룹에 item 추가  (같은 계열 모델)
 *    또는
 *    새 그룹 객체를 GENERATE_GROUPS 배열에 추가  (새 카테고리: 이미지, 오디오 등)
 * 2. item.nodeType 이 새로운 노드 타입이면:
 *    - nodeConstants.jsx 에 NODE_INFO 항목 추가
 *    - RightPanel/panelRegistry.js 에 Panel 컴포넌트 등록
 *    - index.jsx 의 NODE_TYPES 에 등록
 *
 * ── item 필드 ──────────────────────────────────────────────────
 * id          : 고유 식별자 (string)
 * label       : 표시 이름 (string)
 * description : 부연 설명 (string)
 * nodeType    : 추가할 ReactFlow 노드 타입 (string) — nodeConstants 키
 * defaultData : 노드 생성 시 초기 data (object)
 */

/**
 * 정적 그룹 — 모델이 고정된 프로바이더
 */
export const STATIC_GROUPS = [
  /* ── 기본 (Agent) ─────────────────────────────────────────── */
  {
    id: "default",
    label: null, // 그룹 헤더 없음
    items: [
      {
        id: "agent",
        label: "Agent",
        description: "시스템 기본 모델을 자동으로 사용합니다",
        nodeType: "llmInstruction",
        defaultData: { model: "" },
      },
    ],
  },

  /* ── Claude ───────────────────────────────────────────────── */
  {
    id: "claude",
    label: "Claude",
    items: [
      {
        id: "claude-opus",
        label: "claude-opus-4-6",
        description: "가장 강력한 Claude 모델",
        nodeType: "llmInstruction",
        defaultData: { provider: "anthropic", model: "claude-opus-4-6" },
      },
      {
        id: "claude-sonnet",
        label: "claude-sonnet-4-6",
        description: "속도와 성능의 최적 균형",
        nodeType: "llmInstruction",
        defaultData: { provider: "anthropic", model: "claude-sonnet-4-6" },
      },
    ],
  },

  /* ── OpenAI ───────────────────────────────────────────────── */
  {
    id: "openai",
    label: "OpenAI",
    items: [
      {
        id: "openai-gpt-4o",
        label: "gpt-4o",
        description: "실시간으로 오디오, 시각, 텍스트를 추론할 수 있는 새로운 플래그십 모델",
        nodeType: "llmInstruction",
        defaultData: { provider: "openai", model: "gpt-4o" }, 
      },
    ],
  },
];

/**
 * 동적 그룹 정의 — 서버에서 모델 목록을 가져오는 프로바이더
 *
 * ── 새 동적 프로바이더 추가 방법 ──────────────────────────────
 * DYNAMIC_PROVIDERS 배열에 항목 추가:
 *   provider  : POST /system/custom-models 에 전달할 프로바이더명
 *   groupId   : 그룹 식별자
 *   label     : 드롭다운에 표시할 그룹 헤더
 */
export const DYNAMIC_PROVIDERS = [
  { provider: "ollama", groupId: "ollama", label: "Ollama" },
];

/* ── LLM Instruction 패널(고급 옵션) — Generate 레지스트리와 동일 소스 ───────── */

const PROVIDER_LABEL_FALLBACK = {
  "": "시스템 기본값 사용",
  anthropic: "anthropic",
  openai: "openai",
  ollama: "ollama",
};

const PROVIDER_ORDER = ["", "anthropic", "openai", "ollama"];

/**
 * Generate STATIC_GROUPS 에서 llmInstruction 프리셋만 추출 (provider / model 정렬용)
 */
export function getStaticLlmPresets() {
  const out = [];
  for (const group of STATIC_GROUPS) {
    for (const item of group.items) {
      if (item.nodeType !== "llmInstruction") continue;
      const dd = item.defaultData || {};
      out.push({
        id: item.id,
        label: item.label,
        provider: dd.provider ?? "",
        model: dd.model ?? "",
      });
    }
  }
  return out;
}

/**
 * Provider 셀렉트 옵션 — STATIC_GROUPS + DYNAMIC_PROVIDERS 기준 (Generate와 동기화)
 */
export function getProviderSelectOptions() {
  const seen = new Set();
  const list = [];
  for (const p of getStaticLlmPresets()) {
    const v = p.provider ?? "";
    if (!seen.has(v)) {
      seen.add(v);
      list.push(v);
    }
  }
  for (const dp of DYNAMIC_PROVIDERS) {
    if (!seen.has(dp.provider)) {
      seen.add(dp.provider);
      list.push(dp.provider);
    }
  }
  list.sort((a, b) => {
    const ia = PROVIDER_ORDER.indexOf(a);
    const ib = PROVIDER_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return list.map((value) => ({
    value,
    label: PROVIDER_LABEL_FALLBACK[value] ?? value,
  }));
}

/**
 * 특정 provider 에 해당하는 정적 모델 옵션 (ollama 는 서버 조회 → 빈 배열)
 */
export function getStaticModelOptionsForProvider(provider) {
  const pr = provider ?? "";
  return getStaticLlmPresets()
    .filter((p) => (p.provider ?? "") === pr)
    .map((p) => ({ label: p.label, value: p.model }));
}
