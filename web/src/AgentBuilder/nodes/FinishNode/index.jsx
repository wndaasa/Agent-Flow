import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Flag } from "@phosphor-icons/react";
import { useFlowContext } from "../../FlowContext";

export default function FinishNode({ id, data = {}, selected }) {
  const { availableVariables, onDataChange } = useFlowContext();

  return (
    <div
      className={`
        rounded-xl border transition-all duration-200 min-w-[220px]
        bg-theme-action-menu-bg shadow-md
        ${selected
          ? "border-primary-button shadow-primary-button/20 shadow-lg"
          : "border-white/10 light:border-black/10"
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary-button !border-2 !border-theme-bg-primary"
      />
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${availableVariables.length > 0 ? "border-b border-white/5 light:border-black/5" : ""}`}
      >
        <Flag className="w-4 h-4 text-theme-text-primary opacity-70" />
        <span className="text-xs font-semibold text-theme-text-primary">
          Flow Complete
        </span>
      </div>

      {availableVariables.length > 0 && (
        <div className="p-3">
          <label className="text-[10px] text-theme-text-secondary uppercase tracking-wide mb-1 block">
            최종 출력 변수
          </label>
          <select
            value={data.outputVariable || ""}
            onChange={(e) => onDataChange(id, { outputVariable: e.target.value })}
            className="w-full bg-theme-settings-input-bg border border-white/10 rounded-lg px-2 py-1.5 text-xs text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50"
          >
            <option value="">-- 없음 (마지막 실행 결과) --</option>
            {availableVariables.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-theme-text-secondary/60 mt-1">
            선택한 변수 값이 채팅 응답으로 전달됩니다
          </p>
        </div>
      )}
    </div>
  );
}
