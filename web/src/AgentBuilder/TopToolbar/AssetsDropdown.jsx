import React, { useEffect, useRef } from "react";
import { Plus, Code, Tag } from "@phosphor-icons/react";
import { ASSET_GROUPS } from "./assetTypes";

/**
 * 항목 ID → 아이콘 매핑
 *
 * 새 항목 추가 시 여기에도 아이콘 등록
 */
const ITEM_ICONS = {
  code:        <Code className="w-4 h-4" />,
  setVariable: <Tag  className="w-4 h-4" />,
};

const DEFAULT_ICON = <Plus className="w-4 h-4" />;

/**
 * AssetsDropdown — Add Assets 버튼 클릭 시 나타나는 드롭다운
 *
 * Props:
 *   onSelect(item) : 항목 선택 시 콜백 (item = assetTypes.js 의 item 객체)
 *   onClose()      : 드롭다운 닫기 콜백
 */
export default function AssetsDropdown({ onSelect, onClose }) {
  const ref = useRef(null);

  /* 외부 클릭 시 닫기 */
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="
        absolute top-full right-0 mt-2 z-50
        w-72
        bg-theme-action-menu-bg
        border border-white/10 light:border-black/10
        rounded-2xl shadow-2xl
        overflow-hidden
        animate-fadeUpIn
      "
    >
      {/* 드롭다운 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 light:border-black/5 bg-primary-button/10">
        <Plus className="w-4 h-4 text-primary-button" />
        <span className="text-sm font-semibold text-theme-text-primary">Add Assets</span>
      </div>

      {/* 그룹 목록 */}
      <div className="py-1.5 max-h-80 overflow-y-auto">
        {ASSET_GROUPS.map((group, gi) => (
          <div key={group.id}>
            {/* 그룹 구분선 (첫 번째 그룹 제외) */}
            {gi > 0 && (
              <div className="my-1 mx-3 border-t border-white/5 light:border-black/5" />
            )}

            {/* 그룹 레이블 */}
            {group.label && (
              <p className="px-4 pt-1.5 pb-0.5 text-[10px] font-semibold text-theme-text-secondary uppercase tracking-widest">
                {group.label}
              </p>
            )}

            {/* 항목 목록 */}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="
                  w-full flex items-start gap-3 px-4 py-2.5
                  hover:bg-white/5 light:hover:bg-black/5
                  transition-colors duration-100 text-left
                  border-none
                "
              >
                <span className="mt-0.5 shrink-0 text-theme-text-secondary">
                  {ITEM_ICONS[item.id] ?? DEFAULT_ICON}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-theme-text-primary truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-theme-text-secondary leading-snug mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
