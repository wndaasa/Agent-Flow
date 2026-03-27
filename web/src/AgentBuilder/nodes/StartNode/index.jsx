import React from "react";
import { Play } from "@phosphor-icons/react";
import { Handle, Position } from "@xyflow/react";

export default function StartNode({ selected }) {
  return (
    <div
      className={`
        rounded-xl border transition-all duration-200 min-w-[160px]
        bg-theme-action-menu-bg shadow-md
        ${selected
          ? "border-primary-button shadow-primary-button/20 shadow-lg"
          : "border-white/10 light:border-black/10"
        }
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Play weight="fill" className="w-4 h-4 text-primary-button opacity-80" />
        <span className="text-xs font-semibold text-theme-text-primary">Start</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary-button !border-2 !border-theme-bg-primary"
      />
    </div>
  );
}
