import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightning, PencilSimple, Play, Trash } from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";

const CARD_COLORS = [
  { accent: "#3b82f6" },
  { accent: "#8b5cf6" },
  { accent: "#10b981" },
  { accent: "#f59e0b" },
  { accent: "#f43f5e" },
  { accent: "#06b6d4" },
  { accent: "#14b8a6" },
  { accent: "#6366f1" },
  { accent: "#ec4899" },
  { accent: "#84cc16" },
];

function getCardColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

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
  const { accent } = getCardColor(flow.name);
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
      className="relative group cursor-pointer rounded-xl border border-white/5 bg-[var(--theme-bg-secondary)] overflow-hidden transition-all duration-200 hover:border-white/15 hover:translate-y-[-1px] hover:shadow-xl hover:shadow-black/30"
      onClick={goEdit}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />

      <div className="p-4">
        {/* Delete — shown on hover */}
        <button
          onClick={handleDelete}
          className="absolute top-3.5 right-3 w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash size={12} />
        </button>

        {/* Icon + Name */}
        <div className="flex items-start gap-3 mb-4 pr-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{
              background: `${accent}1a`,
              border: `1px solid ${accent}33`,
            }}
          >
            <Lightning size={14} weight="fill" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--theme-text-primary)] truncate leading-snug">
              {flow.name}
            </p>
            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
              노드 {nodeCount}개
              {updatedText && <> · {updatedText}</>}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Active badge — click to toggle */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-[11px] transition-colors hover:opacity-80"
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: active ? "#34d399" : "rgba(255,255,255,0.2)" }}
            />
            <span style={{ color: active ? "#34d399" : "var(--theme-text-secondary)" }}>
              {active ? "활성" : "비활성"}
            </span>
          </button>

          {/* Action buttons — shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={goEdit}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-white/5 rounded-md transition-colors"
            >
              <PencilSimple size={11} />
              편집
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(paths.agents.editAgent(flow.uuid) + "?run=1");
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--theme-button-primary)_15%,transparent)]"
              style={{ color: "var(--theme-button-primary)" }}
            >
              <Play size={11} weight="fill" />
              실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
