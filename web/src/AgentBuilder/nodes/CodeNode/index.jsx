import React from "react";
import BaseNode from "../../BaseNode";

/**
 * CodeNode — 캔버스 표시용 compact 노드
 *
 * 편집 UI는 RightPanel > panels/CodePanel.jsx 에서 처리한다.
 */
export default function CodeNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="code" data={data} selected={selected} />;
}
