import React from "react";
import { useFlowContext } from "../FlowContext";

/**
 * WebScrapingPanel — Web Scraping 노드의 우측 패널 편집 폼
 */
export default function WebScrapingPanel({ id, data = {} }) {
  const { onDataChange } = useFlowContext();
  const update = (partial) => onDataChange(id, partial);

  return (
    <div className="space-y-5">
      {/* URL */}
      <div>
        <label className="panel-label">URL</label>
        <input
          type="url"
          value={data.url || ""}
          onChange={(e) => update({ url: e.target.value })}
          className="panel-input"
          placeholder="https://example.com"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* 수집 방식 */}
      <div>
        <label className="panel-label">수집 방식</label>
        <select
          value={data.captureAs || "text"}
          onChange={(e) => update({ captureAs: e.target.value })}
          className="panel-input"
        >
          <option value="text">텍스트만</option>
          <option value="html">Raw HTML</option>
          <option value="querySelector">CSS 선택자</option>
        </select>
      </div>

      {/* CSS Selector (조건부) */}
      {data.captureAs === "querySelector" && (
        <div>
          <label className="panel-label">CSS Selector</label>
          <input
            value={data.querySelector || ""}
            onChange={(e) => update({ querySelector: e.target.value })}
            placeholder=".article-content, #content, ..."
            className="panel-input"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      {/* 자동 요약 */}
      <div className="flex items-center justify-between">
        <label className="panel-label shrink-0">콘텐츠 자동 요약</label>
        <button
          type="button"
          onClick={() => update({ enableSummarization: !(data.enableSummarization ?? true) })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            (data.enableSummarization ?? true) ? "bg-primary-button" : "bg-theme-settings-input-bg"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              (data.enableSummarization ?? true) ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* 결과 저장 변수명 */}
      <div>
        <label className="panel-label">결과 저장 변수명</label>
        <input
          type="text"
          placeholder="미지정 시 자동 생성"
          value={data.resultVariable || ""}
          onChange={(e) => update({ resultVariable: e.target.value })}
          className="panel-input"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
