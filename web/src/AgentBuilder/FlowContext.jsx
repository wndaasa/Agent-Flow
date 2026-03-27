import { createContext, useContext } from "react";

/**
 * FlowContext: AgentBuilder 내 모든 Custom Node + RightPanel이 공유하는 컨텍스트
 *
 * ── 변수·멘션 ──────────────────────────────────────────────────
 * availableVariables : 노드에서 정의된 변수 목록 [{ name }]
 * availableMentions  : @블록명 자동완성 목록 [{ label, varName, nodeId }]
 *
 * ── 노드 조작 ──────────────────────────────────────────────────
 * onDataChange(nodeId, data) : 노드 data 업데이트 콜백
 * onDeleteNode(nodeId)       : 노드 삭제 콜백
 * onMentionUsed(targetNodeId, sourceNodeId) : @멘션 선택 시 자동 엣지 연결 콜백
 * nodes                      : 전체 노드 배열 (RightPanel에서 읽기 전용 접근)
 *
 * ── 선택 상태 ──────────────────────────────────────────────────
 * selectedNodeId             : 현재 단일 선택된 노드 ID (null = 미선택 또는 다중 선택)
 * onSelectNode(nodeId|null)  : 선택 노드 변경 콜백
 */
export const FlowContext = createContext({
  availableVariables: [],
  availableMentions: [],
  onDataChange: () => {},
  onDeleteNode: () => {},
  onMentionUsed: () => {},
  nodes: [],
  selectedNodeId: null,
  onSelectNode: () => {},
});

export function useFlowContext() {
  return useContext(FlowContext);
}
