import React from "react";
import {
  Brain,
  Export,
  ChatDots,
  Globe,
  Lightning,
} from "@phosphor-icons/react";

export const NODE_TYPES_MAP = {
  userInput: "userInput",
  generate: "generate",
  output: "output",
  apiCall: "apiCall",
  webScraping: "webScraping",
};

/**
 * NODE_INFO: 각 노드 타입의 메타데이터
 *
 * ── 필드 설명 ─────────────────────────────────────────────────
 * label        : 표시 이름
 * icon         : Phosphor 아이콘 (JSX)
 * description  : 한국어 설명 (TopToolbar 툴팁 등에 사용)
 * defaultData  : 노드 생성 시 기본 data 값
 * color        : 노드 헤더 액센트 색상 (Tailwind 불가 → hex 사용)
 * previewText  : 노드 카드에 표시할 요약 텍스트 추출 함수
 *                (data) => string | null
 *                null 이면 미리보기 영역 숨김
 *
 * ── 새 노드 타입 추가 방법 ──────────────────────────────────────
 * 1. NODE_TYPES_MAP 에 key 추가
 * 2. NODE_INFO 에 메타데이터 추가 (previewText 포함)
 * 3. panels/ 에 Panel 컴포넌트 생성
 * 4. RightPanel/panelRegistry.js 에 등록
 * 5. index.jsx 의 NODE_TYPES 에 등록
 * 6. DRAGGABLE_NODE_TYPES 에 추가 (선택)
 */
export const NODE_INFO = {
  [NODE_TYPES_MAP.userInput]: {
    label: "User Input",
    icon: <ChatDots className="w-4 h-4" />,
    description: "사용자 입력 수집",
    defaultData: {
      title: "",
      prompt: "",
      inputType: "any",
      required: false,
    },
    color: "#3b82f6", // blue
    previewText: (data) => data.prompt?.trim() || null,
  },

  [NODE_TYPES_MAP.generate]: {
    label: "Generate",
    icon: <Brain className="w-4 h-4" />,
    description: "LLM으로 데이터 처리",
    defaultData: {
      instruction: "",
      systemPrompt: "",
      provider: "",
      model: "",
    },
    color: "#8b5cf6", // purple
    previewText: (data) => data.instruction?.trim() || null,
  },

  [NODE_TYPES_MAP.output]: {
    label: "Output",
    icon: <Export className="w-4 h-4" />,
    description: "최종 출력 템플릿 (선택)",
    defaultData: {
      template: "",
    },
    color: "#10b981", // emerald
    previewText: (data) => data.template?.trim() || null,
  },

  [NODE_TYPES_MAP.apiCall]: {
    label: "API Call",
    icon: <Lightning className="w-4 h-4" />,
    description: "외부 HTTP API 호출",
    defaultData: {
      url: "",
      method: "GET",
      headers: [],
      body: "",
      bodyType: "json",
      resultVariable: "",
    },
    color: "#f97316", // orange
    previewText: (data) => data.url?.trim() || null,
  },

  [NODE_TYPES_MAP.webScraping]: {
    label: "Web Scraping",
    icon: <Globe className="w-4 h-4" />,
    description: "웹 페이지 콘텐츠 수집",
    defaultData: {
      url: "",
      captureAs: "text",
      querySelector: "",
      enableSummarization: true,
      resultVariable: "",
    },
    color: "#06b6d4", // cyan
    previewText: (data) => data.url?.trim() || null,
  },
};

/**
 * TopToolbar 에서 버튼으로 표시할 노드 타입 목록
 * 순서가 툴바 버튼 순서에 반영됨
 */
export const DRAGGABLE_NODE_TYPES = [
  NODE_TYPES_MAP.userInput,
  NODE_TYPES_MAP.generate,
  NODE_TYPES_MAP.apiCall,
  NODE_TYPES_MAP.webScraping,
  NODE_TYPES_MAP.output,
];
