import React, { useState, useEffect, useMemo } from "react";
import { CaretDown } from "@phosphor-icons/react";
import MentionTextarea from "../components/MentionTextarea";
import { useFlowContext } from "../FlowContext";
import { useLocalField } from "../hooks/useLocalField";
import { useAtMention } from "../hooks/useAtMention";
import {
  getProviderSelectOptions,
  getStaticModelOptionsForProvider,
} from "../TopToolbar/generateTypes";
import { fetchCustomModelsForProvider } from "../registries/dynamicModels";

/**
 * LLMInstructionPanel — LLM Instruction 노드의 우측 패널 편집 폼
 *
 * Props:
 *   id   : 노드 ID
 *   data : 노드 data 객체
 */
export default function LLMInstructionPanel({ id, data = {} }) {
  const { onDataChange, availableMentions, onMentionUsed } = useFlowContext();
  // 시스템 프롬프트 또는 모델 설정이 있으면 고급 옵션 기본 펼침
  const [showAdvanced, setShowAdvanced] = useState(
    !!(data.systemPrompt || data.provider || data.model)
  );

  const providerOptions = useMemo(() => getProviderSelectOptions(), []);

  const staticModelOptions = useMemo(
    () => getStaticModelOptionsForProvider(data.provider ?? ""),
    [data.provider]
  );

  const [ollamaModelOptions, setOllamaModelOptions] = useState([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  useEffect(() => {
    if ((data.provider ?? "") !== "ollama") {
      setOllamaModelOptions([]);
      setOllamaLoading(false);
      return;
    }
    let cancelled = false;
    setOllamaLoading(true);
    fetchCustomModelsForProvider("ollama", 5000)
      .then((models) => {
        if (!cancelled) {
          setOllamaModelOptions(models.map((m) => ({ label: m.id, value: m.id })));
        }
      })
      .finally(() => {
        if (!cancelled) setOllamaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data.provider]);

  const modelOptions =
    (data.provider ?? "") === "ollama" ? ollamaModelOptions : staticModelOptions;

  const isCustomModel = (model) => {
    if (model == null || model === "") return false;
    if (ollamaLoading && (data.provider ?? "") === "ollama") return false;
    return !modelOptions.some((m) => m.value === model);
  };

  const update = (partial) => onDataChange(id, partial);

  // 노드 제목
  const titleField = useLocalField(data.title ?? "", (v) => update({ title: v }));

  // Instruction 편집 + @mention
  const instructionField = useLocalField(data.instruction ?? "", (v) => update({ instruction: v }));
  const instMention = useAtMention(
    instructionField.value,
    (newVal) => {
      instructionField.onChange({ target: { value: newVal } });
      update({ instruction: newVal });
    },
    availableMentions,
    { onMentionSelected: (mention) => onMentionUsed(id, mention?.nodeId) }
  );

  // 시스템 프롬프트 편집 + @mention
  const systemPromptField = useLocalField(data.systemPrompt ?? "", (v) => update({ systemPrompt: v }));
  const spMention = useAtMention(
    systemPromptField.value,
    (newVal) => {
      systemPromptField.onChange({ target: { value: newVal } });
      update({ systemPrompt: newVal });
    },
    availableMentions,
    { onMentionSelected: (mention) => onMentionUsed(id, mention?.nodeId) }
  );

  // 커스텀 모델 직접 입력
  const customModelField = useLocalField(
    isCustomModel(data.model) ? data.model : "",
    (v) => update({ model: v })
  );

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 노드 이름 */}
      <div className="shrink-0">
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
          이름
        </label>
        <input
          type="text"
          {...titleField}
          placeholder="노드 이름 (선택)"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-theme-settings-input-bg border border-white/10 light:border-black/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50 placeholder:text-theme-text-secondary/40"
        />
      </div>

      {/* Instruction — 남은 공간을 전부 채움 */}
      <div className="flex-1 flex flex-col min-h-0">
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium shrink-0">
          Instruction
        </label>
        <MentionTextarea
          field={instructionField}
          mention={instMention}
          mentions={availableMentions}
          placeholder={"LLM에게 전달할 지시사항&#10;@블록명 또는 ${변수명} 으로 참조 가능"}
          grow
        />
      </div>

      {/* 고급 옵션 토글 */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="shrink-0 flex items-center gap-1.5 text-xs text-theme-text-secondary hover:text-theme-text-primary transition-colors w-full"
      >
        <CaretDown
          className={`w-3 h-3 shrink-0 transition-transform duration-150 ${showAdvanced ? "rotate-0" : "-rotate-90"}`}
        />
        고급 옵션 (모델 · 시스템 프롬프트)
      </button>

      {showAdvanced && (
        <div className="shrink-0 space-y-4 border border-white/5 light:border-black/5 rounded-lg p-3">
          {/* 프로바이더 선택 */}
          <div>
            <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
              Provider
            </label>
            <select
              value={data.provider ?? ""}
              onChange={(e) => {
                const nextProvider = e.target.value;
                const nextStatic = getStaticModelOptionsForProvider(nextProvider);
                const firstModel = nextStatic[0]?.value ?? "";
                update({
                  provider: nextProvider,
                  model: nextProvider === "ollama" ? "" : firstModel,
                });
              }}
              className="w-full bg-theme-settings-input-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50"
            >
              {providerOptions.map((p) => (
                <option key={p.value === "" ? "__default__" : p.value} value={p.value} className="bg-theme-bg-primary">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 모델 선택 */}
          <div>
            <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
              모델
            </label>
            <select
              value={isCustomModel(data.model) ? "__custom__" : (data.model ?? "")}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  update({ model: "" });
                } else {
                  update({ model: e.target.value });
                }
              }}
              className="w-full bg-theme-settings-input-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50"
            >
              {(data.provider ?? "") === "ollama" && ollamaLoading && (
                <option value="" className="bg-theme-bg-primary">
                  모델 목록 불러오는 중...
                </option>
              )}
              {modelOptions.map((m) => (
                <option
                  key={`${m.value}-${m.label}`}
                  value={m.value}
                  className="bg-theme-bg-primary"
                >
                  {m.label}
                </option>
              ))}
              <option value="__custom__" className="bg-theme-bg-primary">
                직접 입력...
              </option>
            </select>

            {/* 커스텀 모델 ID 입력 */}
            {isCustomModel(data.model) && (
              <input
                type="text"
                {...customModelField}
                placeholder="모델 ID 직접 입력"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 w-full bg-theme-settings-input-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50 placeholder:text-theme-text-secondary/40"
              />
            )}
          </div>

          {/* 시스템 프롬프트 */}
          <div>
            <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
              시스템 프롬프트{" "}
              <span className="normal-case opacity-60 font-normal">(선택)</span>
            </label>
            <MentionTextarea
              field={systemPromptField}
              mention={spMention}
              mentions={availableMentions}
              placeholder="AI의 역할·맥락 지정 (선택)&#10;@블록명으로 참조 가능"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
