import React from "react";
import BaseNode from "../../BaseNode";

/**
 * OutputNode — 캔버스 표시용 compact 노드 (플로우 최종 출력)
 *
 * 편집 UI는 RightPanel > panels/OutputPanel.jsx 에서 처리한다.
 *
 * BaseNode 의 isOutput 판단 로직에 의해 자동으로:
 * - 하단 source Handle 없음
 * - 삭제 버튼 없음
 * - 제목 더블클릭 편집 없음
 */
export default function OutputNode({ id, data = {}, selected }) {
  return <BaseNode id={id} type="output" data={data} selected={selected} />;
}
