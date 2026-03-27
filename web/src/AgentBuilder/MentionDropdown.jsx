import React from "react";

/**
 * @블록명 / @블록명.속성 자동완성 드롭다운
 * useAtMention 훅과 함께 사용
 */
export default function MentionDropdown({ items, selectedIndex, onSelect }) {
  if (!items.length) return null;
  return (
    <div className="absolute z-50 bottom-full left-0 mb-1 w-full bg-theme-bg-primary border border-white/10 light:border-black/10 rounded-lg shadow-xl overflow-hidden">
      {items.map((m, i) => (
        <button
          key={m.isProp ? `${m.nodeId}:${m.propKey}` : m.nodeId}
          onMouseDown={(e) => { e.preventDefault(); onSelect(m); }}
          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
            i === selectedIndex
              ? "bg-primary-button text-black light:text-white font-medium"
              : "text-theme-text-primary hover:bg-white/10 light:hover:bg-black/5"
          }`}
        >
          {m.isProp ? (
            <>
              <span className="font-medium text-theme-text-secondary/60">.{m.propKey}</span>
              <span className="ml-auto text-[10px] text-theme-text-secondary/50 font-mono">
                @{m.parentLabel}.{m.propKey}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium">@</span>
              {m.label}
              {m.subProps?.length > 0 && (
                <span className="text-[10px] text-theme-text-secondary/40 ml-1">
                  (.속성)
                </span>
              )}
              <span className="ml-auto text-[10px] text-theme-text-secondary/50 font-mono">{`\${${m.varName}}`}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
