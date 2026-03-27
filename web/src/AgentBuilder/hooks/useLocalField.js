import { useState, useRef, useEffect } from "react";

/**
 * 한국어 IME 이슈 해결용 훅
 * - 조합 중(onCompositionStart~End)에는 부모 state 업데이트를 막아
 *   React 재렌더링이 IME 입력을 끊는 현상을 방지
 *
 * @param {string} externalValue - 부모 노드 data에서 내려오는 현재 값
 * @param {(value: string) => void} onCommit - 부모 state를 업데이트하는 콜백
 */
export function useLocalField(externalValue, onCommit) {
  const [local, setLocal] = useState(externalValue ?? "");
  const composing = useRef(false);

  // 외부 값이 바뀌면(노드 로드, 초기화 등) 로컬 동기화
  useEffect(() => {
    if (!composing.current) setLocal(externalValue ?? "");
  }, [externalValue]);

  return {
    value: local,
    onChange: (e) => {
      setLocal(e.target.value);
      if (!composing.current) onCommit(e.target.value);
    },
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (e) => {
      composing.current = false;
      setLocal(e.target.value);
      onCommit(e.target.value);
    },
  };
}
