import React from "react";
import { useFlowContext } from "./FlowContext";

/**
 * FlowContext의 availableVariables를 기반으로 변수를 선택하는 셀렉트 컴포넌트
 */
export default function VariableSelect({
  value,
  onChange,
  placeholder = "Select variable",
}) {
  const { availableVariables } = useFlowContext();

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
    >
      <option value="" className="bg-theme-bg-primary">
        {placeholder}
      </option>
      {availableVariables.map((v) => (
        <option key={v.name} value={v.name} className="bg-theme-bg-primary">
          {v.name}
        </option>
      ))}
    </select>
  );
}
