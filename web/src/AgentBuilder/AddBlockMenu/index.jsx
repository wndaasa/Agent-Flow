import React from "react";
import { NODE_INFO, DRAGGABLE_NODE_TYPES } from "../nodeConstants.jsx";

/**
 * 좌측 사이드패널: 캔버스로 드래그해 블록 추가
 */
export default function AddBlockMenu() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-52 shrink-0 flex flex-col border-r border-white/5 light:border-black/5 bg-theme-bg-primary/50 backdrop-blur-sm">
      {/* 패널 헤더 */}
      <div className="px-3 py-3 border-b border-white/5 light:border-black/5">
        <p className="text-xs font-semibold text-theme-text-primary">블록</p>
        <p className="text-[11px] text-theme-text-secondary mt-0.5">
          드래그해서 캔버스에 추가
        </p>
      </div>

      {/* 드래그 가능한 블록 목록 */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {DRAGGABLE_NODE_TYPES.map((type) => {
          const info = NODE_INFO[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="
                flex items-start gap-2.5 p-2.5 rounded-lg cursor-grab active:cursor-grabbing
                bg-theme-action-menu-bg border border-white/5 light:border-black/5
                hover:border-primary-button/40 hover:bg-primary-button/5
                transition-all duration-150 select-none
              "
            >
              <span className="mt-0.5 text-theme-text-primary opacity-60 shrink-0">
                {info.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-theme-text-primary truncate">
                  {info.label}
                </p>
                <p className="text-[11px] text-theme-text-secondary mt-0.5 leading-tight">
                  {info.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 사용 팁 */}
      <div className="px-3 py-3 border-t border-white/5 light:border-black/5">
        <p className="text-[11px] text-theme-text-secondary leading-relaxed">
          노드를 연결해 순서나 병렬 실행을 구성하세요.
          <br />
          연결선을 클릭하면 삭제됩니다.
        </p>
      </div>
    </div>
  );
}
