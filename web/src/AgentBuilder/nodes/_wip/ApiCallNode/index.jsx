import React, { useRef, useState } from "react";
import { Plus, X, CaretDown } from "@phosphor-icons/react";
import BaseNode from "../../BaseNode";
import VariableSelect from "../../VariableSelect";
import { useFlowContext } from "../../FlowContext";
import {
  DEFAULT_HTTP_METHOD,
  HTTP_METHOD_OPTIONS,
  HTTP_METHODS_WITH_BODY,
} from "../../registries/fieldOptions";

export default function ApiCallNode({ id, data, selected }) {
  const { onDataChange } = useFlowContext();
  const urlInputRef = useRef(null);
  const [showVarMenu, setShowVarMenu] = useState(false);

  const update = (partial) => onDataChange(id, partial);

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...(data.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    update({ headers: newHeaders });
  };

  const insertVariableAtCursor = (variableName) => {
    if (!urlInputRef.current || !variableName) return;
    const input = urlInputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue =
      (data.url || "").substring(0, start) +
      "${" + variableName + "}" +
      (data.url || "").substring(end);
    update({ url: newValue });
    setShowVarMenu(false);
    setTimeout(() => {
      input.setSelectionRange(start + variableName.length + 3, start + variableName.length + 3);
      input.focus();
    }, 0);
  };

  return (
    <BaseNode id={id} type="apiCall" selected={selected}>
      <div className="space-y-3">
        {/* URL */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">URL</label>
          <div className="flex gap-1.5">
            <input
              ref={urlInputRef}
              type="text"
              placeholder="https://api.example.com/endpoint"
              value={data.url || ""}
              onChange={(e) => update({ url: e.target.value })}
              className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg focus:outline-primary-button outline-none p-2"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="relative">
              <button
                onClick={() => setShowVarMenu((v) => !v)}
                className="h-full px-2 rounded-lg bg-theme-settings-input-bg text-theme-text-secondary hover:text-theme-text-primary transition-colors flex items-center gap-0.5"
                title="변수 삽입"
              >
                <Plus className="w-3.5 h-3.5" />
                <CaretDown className="w-3 h-3" />
              </button>
              {showVarMenu && (
                <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-theme-action-menu-bg border border-white/10 rounded-lg shadow-lg z-50">
                  <VariableSelect
                    value=""
                    onChange={insertVariableAtCursor}
                    placeholder="삽입할 변수 선택"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">Method</label>
          <select
            value={data.method || DEFAULT_HTTP_METHOD}
            onChange={(e) => update({ method: e.target.value })}
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-xs rounded-lg focus:outline-primary-button outline-none p-2"
          >
            {HTTP_METHOD_OPTIONS.map((m) => (
              <option key={m} value={m} className="bg-theme-bg-primary">{m}</option>
            ))}
          </select>
        </div>

        {/* Headers */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-theme-text-primary">Headers</label>
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
                  className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg outline-none p-2"
                  autoComplete="off"
                  spellCheck={false}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                  className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg outline-none p-2"
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
            <label className="block text-xs font-medium text-theme-text-primary mb-1">Request Body</label>
            <select
              value={data.bodyType || "json"}
              onChange={(e) => update({ bodyType: e.target.value })}
              className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-xs rounded-lg outline-none p-2 mb-1.5"
            >
              <option value="json" className="bg-theme-bg-primary">JSON</option>
              <option value="text" className="bg-theme-bg-primary">Raw Text</option>
              <option value="form" className="bg-theme-bg-primary">Form Data</option>
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
                      className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg outline-none p-2"
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
                      className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg outline-none p-2"
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
                className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-xs rounded-lg outline-none p-2 font-mono"
                rows={3}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </div>
        )}

        {/* Response Variable */}
        <div>
          <label className="block text-xs font-medium text-theme-text-primary mb-1">응답 저장 변수</label>
          <VariableSelect
            value={data.responseVariable}
            onChange={(value) => update({ responseVariable: value })}
            placeholder="변수 선택"
          />
        </div>
      </div>
    </BaseNode>
  );
}
