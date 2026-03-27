import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function getNodeCount(config) {
  try {
    const c = typeof config === "string" ? JSON.parse(config) : config;
    if (c?.nodes) return c.nodes.length;
    if (c?.steps) return c.steps.length;
    return 0;
  } catch {
    return 0;
  }
}

export default function FlowCard({ flow, onDelete, onToggleActive }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(flow.active);
  const nodeCount = getNodeCount(flow.config);
  const updatedText = timeAgo(flow.updatedAt);

  const goEdit = (e) => {
    e?.stopPropagation();
    navigate(paths.agents.editAgent(flow.uuid));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(flow.uuid);
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    const next = !active;
    setActive(next);
    await AgentFlows.toggleFlow(flow.uuid, next);
    onToggleActive?.(flow.uuid, next);
  };

  return (
    <div
      className="relative group cursor-pointer rounded-xl border border-white/5 bg-[var(--theme-bg-secondary)] transition-all duration-200 hover:border-white/12 hover:bg-white/[0.03]"
      onClick={goEdit}
    >
      <div className="p-4">
        {/* Delete — shown on hover */}
        <button
          onClick={handleDelete}
          className="absolute top-3.5 right-3.5 w-5 h-5 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100 text-xs"
        >
          ×
        </button>

        {/* Name + meta */}
        <div className="mb-4 pr-5">
          <p className="text-sm font-medium text-[var(--theme-text-primary)] truncate leading-snug">
            {flow.name}
          </p>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
            노드 {nodeCount}개
            {updatedText && <> · {updatedText}</>}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}
            />
            {active ? "활성" : "비활성"}
          </button>

          {/* Action buttons — shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={goEdit}
              className="px-2 py-1 text-[11px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-white/5 rounded-md transition-colors"
            >
              편집
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(paths.agents.editAgent(flow.uuid) + "?run=1");
              }}
              className="px-2 py-1 text-[11px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-white/5 rounded-md transition-colors"
            >
              실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
