import React from "react";
import HighlightTextarea from "../HighlightTextarea";
import MentionDropdown from "../MentionDropdown";

/**
 * @mention 기능이 있는 텍스트에리어 공통 컴포넌트.
 *
 * Props:
 *   field       - useLocalField 반환값 (value, onChange, onCompositionStart, onCompositionEnd)
 *   mention     - useAtMention 반환값 (filtered, selectedIndex, selectMention, ...)
 *   mentions    - 멘션 목록 (FlowContext.availableMentions)
 *   placeholder - 플레이스홀더 문자열
 *   rows        - 행 수 (grow=true면 무시됨, 기본값 4)
 *   grow        - true면 부모 flex 컨테이너에 맞게 높이 확장 (기본값 false)
 *   wrapperClassName  - 외부 relative div에 추가할 클래스
 *   textareaClassName - textarea에 추가할 클래스 (예: "font-mono")
 */
export default function MentionTextarea({
  field,
  mention,
  mentions,
  placeholder,
  rows = 4,
  grow = false,
  wrapperClassName = "",
  textareaClassName = "",
}) {
  return (
    <div className={`relative ${grow ? "flex-1 flex flex-col min-h-0" : ""} ${wrapperClassName}`}>
      <HighlightTextarea
        value={field.value}
        mentions={mentions}
        wrapperClassName={`bg-theme-settings-input-bg border border-white/10 light:border-black/10 rounded-lg${grow ? " h-full" : ""}`}
        className={`w-full text-sm text-theme-text-primary placeholder:text-theme-text-secondary/40 px-3 py-2 outline-none border-none focus:ring-1 focus:ring-primary-button/50 resize-none${grow ? " h-full" : ""}${textareaClassName ? ` ${textareaClassName}` : ""}`}
        rows={grow ? undefined : rows}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => {
          field.onChange(e);
          mention.onTextareaChange(e);
        }}
        onKeyDown={mention.onTextareaKeyDown}
        onKeyUp={mention.onTextareaKeyUp}
        onBlur={() => setTimeout(mention.closeMention, 150)}
        onCompositionStart={field.onCompositionStart}
        onCompositionEnd={field.onCompositionEnd}
      />
      <MentionDropdown
        items={mention.filtered}
        selectedIndex={mention.selectedIndex}
        onSelect={mention.selectMention}
      />
    </div>
  );
}
