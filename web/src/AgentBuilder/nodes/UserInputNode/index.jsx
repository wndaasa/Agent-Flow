import React from "react";
import BaseNode from "../../BaseNode";

/** 노드 ID에서 짧은 자동 변수명 생성 (백엔드와 동일한 로직) */
export function autoVarName(nodeId) {
  const tail = nodeId?.split("_").pop() ?? nodeId ?? "input";
  return `input_${tail.slice(-8)}`;
}

/**
 * UserInputNode — 캔버스 표시용 compact 노드
 *
 * 편집 UI는 RightPanel > panels/UserInputPanel.jsx 에서 처리한다.
 * autoVarName 은 index.jsx(availableMentions 수집)에서 import 하므로 유지.
 */
export default function UserInputNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="userInput" data={data} selected={selected} />;
}
