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
  const [hovered, setHovered] = useState(false);
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
      className="relative cursor-pointer rounded-xl transition-all duration-200"
      style={{
        background: hovered ? "#1c1e21" : "#171a1d",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={goEdit}
    >
      <div className="p-4">
        {/* Delete */}
        <button
          onClick={handleDelete}
          className="absolute top-3.5 right-3.5 w-5 h-5 flex items-center justify-center text-xs rounded transition-all"
          style={{
            color: "#555",
            opacity: hovered ? 1 : 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#aaa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
        >
          ×
        </button>

        {/* Name + meta */}
        <div className="mb-4 pr-5">
          <p className="text-sm font-medium truncate leading-snug" style={{ color: "#f1f1f1" }}>
            {flow.name}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#666" }}>
            노드 {nodeCount}개
            {updatedText && <> · {updatedText}</>}
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: active ? "#aaa" : "#555" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)" }}
            />
            {active ? "활성" : "비활성"}
          </button>

          {/* Action buttons */}
          <div
            className="flex items-center gap-1.5 transition-opacity"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <button
              onClick={goEdit}
              className="px-2.5 py-1 text-[11px] rounded-md transition-colors"
              style={{
                color: "#aaa",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f1f1f1";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#aaa";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              편집
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(paths.agents.editAgent(flow.uuid) + "?run=1");
              }}
              className="px-2.5 py-1 text-[11px] rounded-md transition-colors"
              style={{
                color: "#aaa",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f1f1f1";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#aaa";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
