import React from "react";
import BaseNode from "../../BaseNode";

/**
 * LLMInstructionNode — 캔버스 표시용 compact 노드
 *
 * 편집 UI는 RightPanel > panels/LLMInstructionPanel.jsx 에서 처리한다.
 */
export default function LLMInstructionNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="llmInstruction" data={data} selected={selected} />;
}
