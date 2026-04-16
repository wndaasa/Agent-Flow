import React from "react";
import { TOOLBAR_ITEMS } from "./toolbarConfig";

/**
 * TopToolbar — 캔버스 중앙 상단에 오버레이되는 Opal 스타일 필 툴바
 *
 * Props:
 *   onAddNode(type, defaultData?)  : 노드를 캔버스에 추가하는 콜백
 *   onAction(actionId)             : 버튼 type="action" 클릭 콜백 (선택)
 */
export default function TopToolbar({ onAddNode, onAction }) {
  /** 드래그 시작 — 툴바에서 캔버스로 드래그 앤 드롭 지원 */
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="
        inline-flex items-center
        bg-theme-action-menu-bg
        border border-white/10 light:border-black/10
        rounded-full shadow-lg
        px-1 py-1
        gap-0
      "
    >
      {TOOLBAR_ITEMS.map((item) => {
        /* 구분선 */
        if (item.type === "divider") {
          return (
            <div
              key={item.id}
              className="w-px h-5 mx-1 bg-white/10 light:bg-black/10 shrink-0"
            />
          );
        }

        /* 일반 노드 버튼 */
        if (item.type === "node") {
          return (
            <button
              key={item.id}
              title={`${item.label} 노드 추가`}
              draggable={item.draggable}
              onDragStart={item.draggable ? (e) => handleDragStart(e, item.nodeType) : undefined}
              onClick={() => onAddNode?.(item.nodeType)}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-full
                text-sm font-medium
                text-theme-text-secondary hover:text-theme-text-primary
                hover:bg-white/8 light:hover:bg-black/5
                transition-all duration-150
                cursor-pointer select-none
                border-none
              "
            >
              {item.icon}
              {item.label}
            </button>
          );
        }

        /* 액션 버튼 (Add Assets 등 — 백엔드 없는 UI 전용) */
        if (item.type === "action") {
          return (
            <button
              key={item.id}
              title={`${item.label} (준비 중)`}
              onClick={() => onAction?.(item.id)}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-full
                text-sm font-medium
                text-theme-text-secondary/50
                hover:text-theme-text-secondary
                hover:bg-white/5 light:hover:bg-black/5
                transition-all duration-150
                cursor-not-allowed
                border-none select-none
              "
            >
              {item.icon}
              {item.label}
            </button>
          );
        }

        return null;
      })}
    </div>
  );
}
