import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSimple, Play, X, Circle } from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";

// 플로우 이름 기반 액센트 색상 (일관성 유지)
const ACCENT_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#3b82f6",
];

function getAccentColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
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
  const [hovered, setHovered] = useState(false);
  const nodeCount = getNodeCount(flow.config);
  const updatedText = timeAgo(flow.updatedAt);
  const accent = getAccentColor(flow.name);

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
      className="relative cursor-pointer rounded-xl transition-all duration-200 overflow-hidden"
      style={{
        background: hovered ? "#1e2229" : "#1a1d27",
        border: `1px solid ${hovered ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={goEdit}
    >
      {/* 상단 액센트 바 */}
      <div className="h-0.5 w-full" style={{ background: accent }} />

      <div className="p-4">
        {/* 삭제 버튼 */}
        <button
          onClick={handleDelete}
          className="absolute top-3.5 right-3.5 w-6 h-6 flex items-center justify-center rounded-md transition-all"
          style={{
            opacity: hovered ? 1 : 0,
            background: "rgba(255,255,255,0.05)",
            color: "#7b7f8e",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#7b7f8e";
          }}
        >
          <X className="w-3 h-3" weight="bold" />
        </button>

        {/* 이름 + 메타 */}
        <div className="mb-4 pr-6">
          <p className="text-sm font-semibold truncate leading-snug mb-1" style={{ color: "#e8eaf0" }}>
            {flow.name}
          </p>
          <p className="text-[11px]" style={{ color: "#4a4f5c" }}>
            노드 {nodeCount}개
            {updatedText && <span> · {updatedText}</span>}
          </p>
        </div>

        {/* 푸터 */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* 활성 토글 */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: active ? "#6366f1" : "#4a4f5c" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = active ? "#818cf8" : "#7b7f8e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = active ? "#6366f1" : "#4a4f5c")}
          >
            <Circle className="w-2 h-2" weight={active ? "fill" : "regular"} />
            {active ? "활성" : "비활성"}
          </button>

          {/* 액션 버튼 */}
          <div
            className="flex items-center gap-1 transition-opacity duration-150"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <button
              onClick={goEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-all"
              style={{ color: "#7b7f8e", border: "1px solid rgba(255,255,255,0.08)", background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e8eaf0";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7b7f8e";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <PencilSimple className="w-3 h-3" />
              편집
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(paths.agents.editAgent(flow.uuid) + "?run=1");
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-all"
              style={{ color: "#7b7f8e", border: "1px solid rgba(255,255,255,0.08)", background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e8eaf0";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7b7f8e";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Play className="w-3 h-3" />
              실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
