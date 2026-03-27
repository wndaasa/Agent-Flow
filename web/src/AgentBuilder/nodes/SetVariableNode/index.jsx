import React from "react";
import BaseNode from "../../BaseNode";

/**
 * SetVariableNode — 캔버스 표시용 compact 노드
 *
 * 편집 UI는 RightPanel > panels/SetVariablePanel.jsx 에서 처리한다.
 */
export default function SetVariableNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="setVariable" data={data} selected={selected} />;
}
