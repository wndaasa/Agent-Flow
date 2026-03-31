import React, { useRef, useState } from "react";
import { Plus, X, CaretDown } from "@phosphor-icons/react";
import { useFlowContext } from "../FlowContext";
import {
  DEFAULT_HTTP_METHOD,
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS_WITH_BODY,
} from "../registries/fieldOptions";

/**
 * ApiCallPanel — API Call 노드의 우측 패널 편집 폼
 */
export default function ApiCallPanel({ id, data = {} }) {
  const { onDataChange } = useFlowContext();
  const urlInputRef = useRef(null);
  const [showVarMenu, setShowVarMenu] = useState(false);

  const update = (partial) => onDataChange(id, partial);

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...(data.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    update({ headers: newHeaders });
  };

  return (
    <div className="space-y-5">
      {/* URL */}
      <div>
        <label className="panel-label">URL</label>
        <input
          ref={urlInputRef}
          type="text"
          placeholder="https://api.example.com/endpoint"
          value={data.url || ""}
          onChange={(e) => update({ url: e.target.value })}
          className="panel-input"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Method */}
      <div>
        <label className="panel-label">Method</label>
        <select
          value={data.method || DEFAULT_HTTP_METHOD}
          onChange={(e) => update({ method: e.target.value })}
          className="panel-input"
        >
          {HTTP_METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="panel-label shrink-0">Headers</label>
          <button
            onClick={() => update({ headers: [...(data.headers || []), { key: "", value: "" }] })}
            className="p-1 rounded bg-theme-settings-input-bg text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-1.5">
          {(data.headers || []).map((header, index) => (
            <div key={index} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Key"
                value={header.key}
                onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                className="panel-input flex-1"
                autoComplete="off"
                spellCheck={false}
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                className="panel-input flex-1"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => update({ headers: (data.headers || []).filter((_, i) => i !== index) })}
                className="p-2 rounded-lg bg-theme-settings-input-bg text-theme-text-secondary hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Body (POST/PUT/PATCH) */}
      {HTTP_METHODS_WITH_BODY.includes(data.method) && (
        <div>
          <label className="panel-label">Request Body</label>
          <select
            value={data.bodyType || "json"}
            onChange={(e) => update({ bodyType: e.target.value })}
            className="panel-input mb-1.5"
          >
            <option value="json">JSON</option>
            <option value="text">Raw Text</option>
            <option value="form">Form Data</option>
          </select>
          {data.bodyType === "form" ? (
            <div className="space-y-1.5">
              {(data.formData || []).map((item, index) => (
                <div key={index} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Key"
                    value={item.key}
                    onChange={(e) => {
                      const newFD = [...(data.formData || [])];
                      newFD[index] = { ...item, key: e.target.value };
                      update({ formData: newFD });
                    }}
                    className="panel-input flex-1"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) => {
                      const newFD = [...(data.formData || [])];
                      newFD[index] = { ...item, value: e.target.value };
                      update({ formData: newFD });
                    }}
                    className="panel-input flex-1"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => update({ formData: (data.formData || []).filter((_, i) => i !== index) })}
                    className="p-2 rounded-lg bg-theme-settings-input-bg text-theme-text-secondary hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => update({ formData: [...(data.formData || []), { key: "", value: "" }] })}
                className="w-full p-1.5 rounded-lg bg-theme-settings-input-bg text-theme-text-secondary hover:text-theme-text-primary transition-colors text-xs"
              >
                + Add Field
              </button>
            </div>
          ) : (
            <textarea
              placeholder={data.bodyType === "json" ? '{"key": "value"}' : "Raw request body..."}
              value={data.body || ""}
              onChange={(e) => update({ body: e.target.value })}
              className="panel-input font-mono"
              rows={4}
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </div>
      )}

      {/* 응답 저장 변수명 */}
      <div>
        <label className="panel-label">응답 저장 변수명</label>
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
