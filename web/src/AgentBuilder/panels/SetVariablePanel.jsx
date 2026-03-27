import React from "react";
import MentionTextarea from "../components/MentionTextarea";
import { useFlowContext } from "../FlowContext";
import { useLocalField } from "../hooks/useLocalField";
import { useAtMention } from "../hooks/useAtMention";

/**
 * SetVariablePanel — Set Variable 노드의 우측 패널 편집 폼
 *
 * Props:
 *   id   : 노드 ID
 *   data : 노드 data 객체
 */
export default function SetVariablePanel({ id, data = {} }) {
  const { onDataChange, availableMentions, onMentionUsed } = useFlowContext();

  const update = (partial) => onDataChange(id, partial);

  // 노드 제목
  const titleField = useLocalField(data.title ?? "", (v) => update({ title: v }));

  // 변수명
  const varField = useLocalField(data.variableName ?? "", (v) => update({ variableName: v }));

  // 변수 값 + @mention
  const valueField = useLocalField(data.value ?? "", (v) => update({ value: v }));
  const valueMention = useAtMention(
    valueField.value,
    (newVal) => {
      valueField.onChange({ target: { value: newVal } });
      update({ value: newVal });
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

      {/* 변수명 */}
      <div>
        <label className="panel-label">
          변수명
        </label>
        <input
          type="text"
          {...varField}
          placeholder="예: result"
          autoComplete="off"
          spellCheck={false}
          className="panel-input"
        />
      </div>

      {/* 변수 값 */}
      <div>
        <label className="panel-label">
          값{" "}
          <span className="normal-case font-normal opacity-60">
            (@블록명 또는 {"${변수명}"} 참조 가능)
          </span>
        </label>
        <MentionTextarea
          field={valueField}
          mention={valueMention}
          mentions={availableMentions}
          placeholder={"예: @블록명 또는 ${변수명}"}
          rows={4}
        />
      </div>
    </div>
  );
}
