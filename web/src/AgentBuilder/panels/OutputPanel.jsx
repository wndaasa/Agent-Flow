import React from "react";
import MentionTextarea from "../components/MentionTextarea";
import { useFlowContext } from "../FlowContext";
import { useLocalField } from "../hooks/useLocalField";
import { useAtMention } from "../hooks/useAtMention";

/**
 * OutputPanel — Output 노드의 우측 패널 편집 폼
 *
 * Props:
 *   id   : 노드 ID
 *   data : 노드 data 객체
 */
export default function OutputPanel({ id, data = {} }) {
  const { onDataChange, availableMentions, onMentionUsed } = useFlowContext();

  const update = (partial) => onDataChange(id, partial);

  // 출력 템플릿 + @mention
  const templateField = useLocalField(data.template ?? "", (v) => update({ template: v }));
  const templateMention = useAtMention(
    templateField.value,
    (newVal) => {
      templateField.onChange({ target: { value: newVal } });
      update({ template: newVal });
    },
    availableMentions,
    { onMentionSelected: (mention) => onMentionUsed(id, mention?.nodeId) }
  );

  return (
    <div className="space-y-5">
      {/* 안내 텍스트 */}
      <p className="text-xs text-theme-text-secondary leading-relaxed">
        @블록명으로 각 블록의 결과를 참조하세요.
        <br />
        HTML·마크다운 형식으로 구성할 수 있습니다.
      </p>

      {/* 출력 템플릿 */}
      <div>
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
          출력 템플릿
        </label>
        <MentionTextarea
          field={templateField}
          mention={templateMention}
          mentions={availableMentions}
          placeholder={"# 제목\n\n@블록명\n\n---\n\n@다른블록명"}
          rows={10}
        />
      </div>
    </div>
  );
}
