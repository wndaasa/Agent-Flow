import React from "react";
import Toggle from "@/components/lib/Toggle";
import BaseNode from "../../BaseNode";
import VariableSelect from "../../VariableSelect";
import { useFlowContext } from "../../FlowContext";

export default function WebScrapingNode({ id, data, selected }) {
  const { onDataChange } = useFlowContext();
  const update = (partial) => onDataChange(id, partial);

  return (
    <BaseNode id={id} type="webScraping" selected={selected}>
      <div className="space-y-3">
        {/* URL */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">
            URL
          </label>
          <input
            type="url"
            value={data.url || ""}
            onChange={(e) => update({ url: e.target.value })}
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg focus:outline-primary-button outline-none p-2"
            placeholder="https://example.com"
          />
        </div>

        {/* Capture As */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">
            수집 방식
          </label>
          <select
            value={data.captureAs || "text"}
            onChange={(e) => update({ captureAs: e.target.value })}
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-xs rounded-lg focus:outline-primary-button outline-none p-2"
          >
            <option value="text" className="bg-theme-settings-input-bg">텍스트만</option>
            <option value="html" className="bg-theme-settings-input-bg">Raw HTML</option>
            <option value="querySelector" className="bg-theme-settings-input-bg">CSS 선택자</option>
          </select>
        </div>

        {/* Query Selector (조건부) */}
        {data.captureAs === "querySelector" && (
          <div>
            <label className="block text-xs font-medium text-theme-text-primary mb-1">
              CSS Selector
            </label>
            <input
              value={data.querySelector || ""}
              onChange={(e) => update({ querySelector: e.target.value })}
              placeholder=".article-content, #content, ..."
              className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-xs rounded-lg focus:outline-primary-button outline-none p-2"
            />
          </div>
        )}

        {/* 자동 요약 토글 */}
        <Toggle
          size="md"
          variant="horizontal"
          label="콘텐츠 자동 요약"
          hint="content-summarization-tooltip"
          enabled={data.enableSummarization ?? true}
          onChange={(checked) => update({ enableSummarization: checked })}
        />

        {/* Result Variable */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">
            결과 저장 변수
          </label>
          <VariableSelect
            value={data.resultVariable}
            onChange={(value) => update({ resultVariable: value })}
            placeholder="변수 선택"
          />
        </div>
      </div>
    </BaseNode>
  );
}
