import React from "react";
import {
  Brain,
  Export,
  BracketsCurly,
  ChatDots,
  Tag,
  Code,
} from "@phosphor-icons/react";

export const NODE_TYPES_MAP = {
  start: "start",
  userInput: "userInput",
  llmInstruction: "llmInstruction",
  setVariable: "setVariable",
  code: "code",
  output: "output",
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
  [NODE_TYPES_MAP.start]: {
    label: "Start",
    icon: <BracketsCurly className="w-4 h-4" />,
    description: "플로우 시작",
    defaultData: {},
    color: "#6b7280", // gray
    previewText: () => null,
  },

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

  [NODE_TYPES_MAP.llmInstruction]: {
    label: "LLM Instruction",
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

  [NODE_TYPES_MAP.setVariable]: {
    label: "Set Variable",
    icon: <Tag className="w-4 h-4" />,
    description: "변수 저장·변환",
    defaultData: {
      variableName: "",
      value: "",
    },
    color: "#f59e0b", // amber
    previewText: (data) =>
      data.variableName
        ? `${data.variableName} = ${data.value || "..."}`
        : null,
  },

  [NODE_TYPES_MAP.code]: {
    label: "Code",
    icon: <Code className="w-4 h-4" />,
    description: "JavaScript 코드로 데이터 변환",
    defaultData: {
      title: "",
      code: "",
      resultVariable: "",
    },
    color: "#ef4444", // red
    previewText: (data) => data.code?.trim()?.slice(0, 60) || null,
  },

  [NODE_TYPES_MAP.output]: {
    label: "Output",
    icon: <Export className="w-4 h-4" />,
    description: "최종 출력 템플릿",
    defaultData: {
      template: "",
    },
    color: "#10b981", // emerald
    previewText: (data) => data.template?.trim() || null,
  },
};

/**
 * TopToolbar 에서 버튼으로 표시할 노드 타입 목록 (start/output 제외)
 * 순서가 툴바 버튼 순서에 반영됨
 */
export const DRAGGABLE_NODE_TYPES = [
  NODE_TYPES_MAP.userInput,
  NODE_TYPES_MAP.llmInstruction,
  NODE_TYPES_MAP.setVariable,
];
