import React from "react";
import BaseNode from "../BaseNode";

/**
 * BaseNode를 감싸는 캔버스 노드 컴포넌트를 생성하는 팩토리 함수.
 *
 * 새 노드 타입 추가 시:
 *   const MyNode = createNodeComponent("myType");
 *   export default MyNode;
 *
 * 노드별 커스텀 렌더링이 필요해지면 해당 파일에서 직접 컴포넌트를 작성한다.
 */
export function createNodeComponent(type) {
  function NodeComponent({ id, data = {}, selected }) {
    return <BaseNode id={id} type={type} data={data} selected={selected} />;
  }
  NodeComponent.displayName = `${type}Node`;
  return NodeComponent;
}
