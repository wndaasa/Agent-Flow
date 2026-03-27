import React from "react";
import MentionTextarea from "../components/MentionTextarea";
import { useFlowContext } from "../FlowContext";
import { useLocalField } from "../hooks/useLocalField";
import { useAtMention } from "../hooks/useAtMention";

/**
 * CodePanel — Code 노드의 우측 패널 편집 폼
 *
 * Props:
 *   id   : 노드 ID
 *   data : 노드 data 객체
 */
export default function CodePanel({ id, data = {} }) {
  const { onDataChange, availableMentions, onMentionUsed } = useFlowContext();

  const update = (partial) => onDataChange(id, partial);

  // 노드 제목
  const titleField = useLocalField(data.title ?? "", (v) => update({ title: v }));

  // 결과 변수명
  const resultVarField = useLocalField(data.resultVariable ?? "", (v) => update({ resultVariable: v }));

  // 코드 편집 + @mention (코드 안에서 @블록명으로 변수 참조 가능)
  const codeField = useLocalField(data.code ?? "", (v) => update({ code: v }));
  const codeMention = useAtMention(
    codeField.value,
    (newVal) => {
      codeField.onChange({ target: { value: newVal } });
      update({ code: newVal });
    },
    availableMentions,
    { onMentionSelected: (mention) => onMentionUsed(id, mention?.nodeId) }
  );

  return (
    <div className="space-y-5">
      {/* 노드 이름 */}
      <div>
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

      {/* 코드 입력 */}
      <div>
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
          JavaScript 코드
        </label>
        <p className="text-[10px] text-theme-text-secondary/60 mb-2 leading-relaxed">
          <code>variables</code> 객체로 플로우 변수를 읽고 쓸 수 있습니다.
          <code>return</code> 값이 결과로 저장됩니다.
        </p>
        <MentionTextarea
          field={codeField}
          mention={codeMention}
          mentions={availableMentions}
          placeholder={"// 예시: NIA 문서 분리\nconst text = variables.양식텍스트;\nconst parts = text.split(/\\[붙임 \\d+\\]/);\nreturn { 수행계획서: parts[0], 구축계획서: parts[1], 품질관리: parts[2] };"}
          rows={10}
          textareaClassName="font-mono"
        />
      </div>

      {/* 결과 저장 변수명 */}
      <div>
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
          결과 저장 변수명{" "}
          <span className="normal-case opacity-60 font-normal">(선택)</span>
        </label>
        <input
          type="text"
          {...resultVarField}
          placeholder="미지정 시 자동 생성 (code_xxxxxxxx)"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-theme-settings-input-bg border border-white/10 light:border-black/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50 placeholder:text-theme-text-secondary/40"
        />
      </div>

      {/* 출력 속성 키 (JSON 반환 시 @블록명.속성 자동완성용) */}
      <div>
        <label className="text-[11px] text-theme-text-secondary uppercase tracking-wide mb-1.5 block font-medium">
          출력 속성 키{" "}
          <span className="normal-case opacity-60 font-normal">(JSON 반환 시)</span>
        </label>
        <p className="text-[10px] text-theme-text-secondary/60 mb-2 leading-relaxed">
          쉼표로 구분하여 입력하면 다른 블록에서 <code>@블록명.속성</code>으로 참조할 수 있습니다.
        </p>
        <input
          type="text"
          value={(data.outputKeys || []).join(", ")}
          onChange={(e) => {
            const keys = e.target.value
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
            update({ outputKeys: keys });
          }}
          placeholder="예: 수행계획서, 구축계획서, 품질관리계획서"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-theme-settings-input-bg border border-white/10 light:border-black/10 rounded-lg px-3 py-2 text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary-button/50 placeholder:text-theme-text-secondary/40"
        />
      </div>
    </div>
  );
}
