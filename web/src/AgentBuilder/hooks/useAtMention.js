import { useState, useCallback } from "react";

/**
 * @블록명 / @블록명.속성 자동완성 훅
 * 텍스트에어리어에서 @ 입력 시 mention 드롭다운을 표시
 * - ArrowUp/ArrowDown으로 항목 이동
 * - Enter/Tab으로 선택 완성
 * - @블록명. 입력 시 해당 블록의 하위 속성 드롭다운 표시
 *
 * @param {string} value - 현재 텍스트 값
 * @param {(newVal: string) => void} onValueChange - 값 변경 콜백
 * @param {{ label: string, varName: string, nodeId: string, subProps?: string[] }[]} mentions
 * @param {{ onMentionSelected?: (mention) => void }} options
 */
export function useAtMention(value, onValueChange, mentions, options = {}) {
  // { start: number, query: string, mode: "base" | "prop", baseLabel: string } | null
  const [atState, setAtState] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /** textarea onChange / onKeyUp 후 호출: @ 패턴 감지 */
  const detectMention = useCallback((text, cursorPos) => {
    const before = text.slice(0, cursorPos);
    // cursor 바로 앞 @ 위치 찾기 (줄바꿈 없는 범위)
    const lastNewline = before.lastIndexOf("\n");
    const lineSegment = before.slice(lastNewline + 1);
    const atIdx = lineSegment.lastIndexOf("@");

    if (atIdx < 0) {
      setAtState(null);
      setSelectedIndex(0);
      return;
    }

    const afterAt = lineSegment.slice(atIdx + 1); // @ 뒤 전체 문자열
    const absoluteStart = lastNewline + 1 + atIdx; // 텍스트 전체에서 @ 위치

    // @블록명.속성 패턴 감지: 완성된 label 뒤에 . 이 있는지 확인
    const matchedMention = mentions
      .slice()
      .sort((a, b) => b.label.length - a.label.length) // 긴 레이블 우선
      .find((m) => afterAt.startsWith(m.label + "."));

    if (matchedMention) {
      // "prop" 모드: @블록명. 뒤의 속성 쿼리
      const propQuery = afterAt.slice(matchedMention.label.length + 1); // . 뒤
      setAtState((prev) => {
        if (!prev || prev.query !== propQuery || prev.mode !== "prop") setSelectedIndex(0);
        return {
          start: absoluteStart,
          query: propQuery,
          mode: "prop",
          baseLabel: matchedMention.label,
          baseMention: matchedMention,
        };
      });
    } else {
      // "base" 모드: 일반 @블록명 검색
      setAtState((prev) => {
        if (!prev || prev.query !== afterAt || prev.mode !== "base") setSelectedIndex(0);
        return { start: absoluteStart, query: afterAt, mode: "base", baseLabel: null, baseMention: null };
      });
    }
  }, [mentions]);

  const onTextareaChange = useCallback(
    (e) => detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length),
    [detectMention]
  );

  const onTextareaKeyUp = useCallback(
    (e) => {
      // ArrowUp/Down/Enter/Tab은 keyDown에서 처리하므로 여기서는 건너뜀
      if (["ArrowUp", "ArrowDown", "Enter", "Tab"].includes(e.key)) return;
      detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
    },
    [detectMention]
  );

  /** mention 선택 시 치환 */
  const selectMention = useCallback(
    (mention) => {
      if (!atState) return;
      const selectedMention =
        typeof mention === "string"
          ? mentions.find((m) => m.label === mention)
          : mention;
      if (!selectedMention) return;

      if (atState.mode === "prop") {
        // @블록명.속성 형태로 치환: @ 부터 커서까지 전부 대체
        const fullText = `@${atState.baseLabel}.${selectedMention.propKey || selectedMention.label}`;
        const before = value.slice(0, atState.start);
        const replaceLen = 1 + atState.baseLabel.length + 1 + atState.query.length; // @label.query
        const after = value.slice(atState.start + replaceLen);
        onValueChange(`${before}${fullText}${after}`);
        // 엣지 연결은 base 블록에 대해 수행
        if (atState.baseMention) {
          options.onMentionSelected?.(atState.baseMention);
        }
      } else {
        // 기존 @블록명 치환
        const label = selectedMention.label;
        if (!label) return;
        const before = value.slice(0, atState.start);
        const after = value.slice(atState.start + 1 + atState.query.length);
        onValueChange(`${before}@${label}${after}`);
        options.onMentionSelected?.(selectedMention);
      }

      setAtState(null);
      setSelectedIndex(0);
    },
    [value, atState, onValueChange, mentions, options]
  );

  const closeMention = useCallback(() => {
    setAtState(null);
    setSelectedIndex(0);
  }, []);

  // 필터링: mode에 따라 다른 목록 반환
  const filtered = (() => {
    if (!atState) return [];
    if (atState.mode === "prop") {
      // 해당 블록의 subProps에서 필터
      const baseMention = atState.baseMention;
      if (!baseMention?.subProps?.length) return [];
      return baseMention.subProps
        .filter((prop) => prop.toLowerCase().includes(atState.query.toLowerCase()))
        .map((prop) => ({
          label: prop,
          propKey: prop,
          varName: `${baseMention.varName}.${prop}`,
          nodeId: baseMention.nodeId,
          isProp: true,
          parentLabel: baseMention.label,
        }));
    }
    // base 모드: 기존 필터링
    return mentions.filter((m) =>
      m.label.toLowerCase().includes(atState.query.toLowerCase())
    );
  })();

  /**
   * textarea onKeyDown 핸들러 — 드롭다운 열려 있을 때 키보드 네비게이션 처리
   */
  const onTextareaKeyDown = useCallback(
    (e) => {
      if (!atState || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        closeMention();
      }
    },
    [atState, filtered, selectedIndex, selectMention, closeMention]
  );

  return {
    atState,
    filtered,
    selectedIndex,
    onTextareaChange,
    onTextareaKeyUp,
    onTextareaKeyDown,
    selectMention,
    closeMention,
  };
}
