import React, { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import MentionTextarea from "../components/MentionTextarea";
import { useFlowContext } from "../FlowContext";
import { useLocalField } from "../hooks/useLocalField";
import { useAtMention } from "../hooks/useAtMention";
import { USER_INPUT_TYPE_OPTIONS } from "../registries/fieldOptions";

/**
 * UserInputPanel — User Input 노드의 우측 패널 편집 폼
 *
 * Props:
 *   id   : 노드 ID
 *   data : 노드 data 객체
 */
export default function UserInputPanel({ id, data = {} }) {
  const { onDataChange, availableMentions, onMentionUsed } = useFlowContext();
  const [showAdvanced, setShowAdvanced] = useState(true);

  const update = (partial) => onDataChange(id, partial);

  // 노드 제목 편집
  const titleField = useLocalField(data.title ?? "", (v) => update({ title: v }));

  // 프롬프트 (메시지) 편집 + @mention
  const promptField = useLocalField(data.prompt ?? "", (v) => update({ prompt: v }));
  const promptMention = useAtMention(
    promptField.value,
    (newVal) => {
      promptField.onChange({ target: { value: newVal } });
      update({ prompt: newVal });
    },
    availableMentions,
    { onMentionSelected: (mention) => onMentionUsed(id, mention?.nodeId) }
  );

  return (
    <div className="space-y-5">
      {/* 노드 이름 */}
      <div>
        <label className="panel-label">
          이름
        </label>
        <input
          type="text"
          {...titleField}
          placeholder="노드 이름 (선택)"
          autoComplete="off"
          spellCheck={false}
          className="panel-input"
        />
      </div>

      {/* 메시지 (사용자에게 보여줄 안내문) */}
      <div>
        <label className="panel-label">
          메시지
        </label>
        <MentionTextarea
          field={promptField}
          mention={promptMention}
          mentions={availableMentions}
          placeholder="사용자에게 보여줄 안내 문구&#10;@블록명으로 이전 결과를 참조할 수 있습니다"
          rows={4}
        />
      </div>

      {/* 고급 설정 토글 */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-theme-text-secondary hover:text-theme-text-primary transition-colors w-full"
      >
        {showAdvanced
          ? <CaretUp className="w-3 h-3 shrink-0" />
          : <CaretDown className="w-3 h-3 shrink-0" />
        }
        고급 설정
      </button>

      {showAdvanced && (
        <div className="space-y-4 border border-white/5 light:border-black/5 rounded-lg p-3">
          {/* 입력 타입 */}
          <div>
            <label className="panel-label">
              Input Type
            </label>
            <select
              value={data.inputType || "any"}
              onChange={(e) => update({ inputType: e.target.value })}
              className="panel-input"
            >
              {USER_INPUT_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-theme-bg-primary">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 필수 여부 */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.required ?? false}
              onChange={(e) => update({ required: e.target.checked })}
              className="w-4 h-4 rounded accent-primary-button"
            />
            <span className="text-sm text-theme-text-secondary">Input is required</span>
          </label>
        </div>
      )}
    </div>
  );
}
