import React, { useRef, useMemo } from "react";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @블록명 멘션을 하이라이트로 표시하는 textarea
 *
 * 구조:
 *   wrapperDiv (relative, 배경색)
 *     ├─ backdropDiv (absolute inset-0, color:transparent) ← 하이라이트 배경만 표시
 *     └─ textarea    (relative, bg:transparent)            ← 실제 텍스트 표시
 *
 * @param {string}   wrapperClassName  외부 wrapper 스타일 (배경, 테두리, rounded 등)
 * @param {string}   className         backdrop + textarea 공통 스타일 (font, padding 등)
 * @param {string}   value
 * @param {Array}    mentions          [{ label, varName, nodeId }]
 */
export default function HighlightTextarea({
  value = "",
  mentions = [],
  wrapperClassName = "",
  className = "",
  rows,
  ...props
}) {
  const backdropRef = useRef(null);

  // textarea 스크롤 → backdrop 동기화
  const syncScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // 텍스트에서 @블록명 패턴을 찾아 하이라이트 span으로 감싼 HTML 생성
  const highlightedHtml = useMemo(() => {
    if (!value) return "";
    if (!mentions.length) return escapeHtml(value);

    const labels = [...mentions]
      .map((m) => m.label)
      .sort((a, b) => b.length - a.length); // 긴 레이블 우선 매칭

    const pattern = labels
      .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    // @블록명 뒤에 .속성.속성 경로가 올 수 있음 (한글 포함)
    const regex = new RegExp(`@(?:${pattern})(?:\\.[\\w\\u3131-\\uD79D\\[\\]]+)*`, "g");

    let result = "";
    let last = 0;
    for (const m of value.matchAll(regex)) {
      result += escapeHtml(value.slice(last, m.index));
      result +=
        `<span style="background:rgba(99,102,241,0.28);border-radius:4px;padding:0 1px;">` +
        escapeHtml(m[0]) +
        `</span>`;
      last = m.index + m[0].length;
    }
    result += escapeHtml(value.slice(last));
    return result;
  }, [value, mentions]);

  return (
    <div className={`relative ${wrapperClassName}`}>
      {/* 백드롭: 실제 글자색으로 본문을 그리고 @구간만 배경 강조 (textarea는 글자 투명이라 이 레이어가 보임) */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none overflow-hidden text-theme-text-primary ${className}`}
        style={{
          background: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      <textarea
        value={value}
        rows={rows}
        onScroll={syncScroll}
        className={`relative !bg-transparent no-scrollbar ${className}`}
        style={{
          color: "transparent",
          caretColor: "var(--theme-text-primary)",
          WebkitTextFillColor: "transparent",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        {...props}
      />
    </div>
  );
}
