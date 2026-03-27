import React from "react";
import { Cursor } from "@phosphor-icons/react";
import { useFlowContext } from "../FlowContext";
import { NODE_INFO } from "../nodeConstants.jsx";
import { PANEL_REGISTRY } from "./panelRegistry";

/**
 * StepEditor — 선택된 노드의 편집 폼을 우측 패널에 렌더링
 *
 * - selectedNodeId 가 null 이면 "노드를 선택하세요" 안내
 * - selectedNodeId 가 있으면 PANEL_REGISTRY[type] 컴포넌트를 렌더링
 */
export default function StepEditor() {
  const { selectedNodeId, nodes } = useFlowContext();

  /* ── 미선택 상태 ──────────────────────────────────────── */
  if (!selectedNodeId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full py-16 text-center">
        <div className="w-10 h-10 rounded-full bg-theme-action-menu-bg border border-white/10 flex items-center justify-center">
          <Cursor className="w-5 h-5 text-theme-text-secondary" />
        </div>
        <p className="text-sm font-medium text-theme-text-primary">노드를 선택하세요</p>
        <p className="text-xs text-theme-text-secondary leading-relaxed max-w-[200px]">
          캔버스에서 노드를 클릭하면 여기서 편집할 수 있습니다
        </p>
      </div>
    );
  }

  /* ── 선택된 노드 찾기 ─────────────────────────────────── */
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) return null;

  const PanelComponent = PANEL_REGISTRY[selectedNode.type];
  if (!PanelComponent) return null;

  const info = NODE_INFO[selectedNode.type];

  return (
    <div className="flex flex-col h-full">
      {/* 패널 헤더 — 노드 타입 표시 */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 light:border-black/5"
        style={{ borderLeftColor: info?.color, borderLeftWidth: 3 }}
      >
        <span className="text-theme-text-secondary shrink-0">{info?.icon}</span>
        <span className="text-sm font-semibold text-theme-text-primary">
          {info?.label || selectedNode.type}
        </span>
      </div>

      {/* 패널 폼 본문 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        <PanelComponent id={selectedNode.id} data={selectedNode.data} />
      </div>
    </div>
  );
}
