import React from "react";
import {
  ChatDots,
  Sparkle,
  Plus,
} from "@phosphor-icons/react";

/**
 * 툴바 고정 버튼 정의 (단일 소스)
 *
 * type "node"     → onAddNode(nodeType)
 * type "dropdown" → Generate / Add Assets 드롭다운 (TopToolbar 에서 id 로 분기)
 * type "action"   → onAction(id)
 * type "divider"  → 구분선
 */
export const TOOLBAR_ITEMS = [
  {
    id: "userInput",
    label: "User Input",
    icon: <ChatDots className="w-4 h-4" />,
    type: "node",
    nodeType: "userInput",
    draggable: true,
  },
  { type: "divider", id: "d1" },
  {
    id: "generate",
    label: "Generate",
    icon: <Sparkle className="w-4 h-4" weight="fill" />,
    type: "dropdown",
    draggable: false,
  },
  { type: "divider", id: "d3" },
  {
    id: "addAssets",
    label: "Add Assets",
    icon: <Plus className="w-4 h-4" />,
    type: "dropdown",
    draggable: false,
  },
];
