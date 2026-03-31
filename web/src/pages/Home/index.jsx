import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Plus, Atom } from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";
import Sidebar from "./Sidebar";
import FlowCard from "./FlowCard";
import NewButton from "./NewButton";

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-xl animate-pulse overflow-hidden"
      style={{ background: "var(--af-card-bg)", border: "1px solid var(--af-border)" }}
    >
      <div className="h-0.5 w-full" style={{ background: "var(--af-border-input)" }} />
      <div className="p-4">
        <div className="mb-4 space-y-2">
          <div className="h-3.5 rounded w-2/3" style={{ background: "var(--af-border-input)" }} />
          <div className="h-2.5 rounded w-1/3" style={{ background: "var(--af-border)" }} />
        </div>
        <div className="pt-3" style={{ borderTop: "1px solid var(--af-border-subtle)" }}>
          <div className="h-2.5 rounded w-1/4" style={{ background: "var(--af-border)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-24">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <Atom className="w-7 h-7" style={{ color: "#6366f1" }} weight="duotone" />
      </div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--af-text-primary)" }}>
        아직 플로우가 없어요
      </p>
      <p className="text-xs mb-6" style={{ color: "var(--af-text-muted)" }}>
        첫 번째 AI 워크플로우를 만들어보세요
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          background: "#6366f1",
          color: "#ffffff",
          boxShadow: "0 1px 6px rgba(99,102,241,0.35)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#5254cc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
      >
        <Plus className="w-3.5 h-3.5" weight="bold" />
        New Flow
      </button>
    </div>
  );
}

// ── Notebooks placeholder ─────────────────────────────────────────────────────
function NotebooksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-24">
      <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--af-text-primary)" }}>
        Notebooks
      </p>
      <p className="text-xs" style={{ color: "var(--af-text-muted)" }}>
        곧 출시 예정이에요
      </p>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [section, setSection] = useState("flows");
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    AgentFlows.listFlows().then((res) => {
      setFlows(res.flows ?? []);
      setLoading(false);
    });
  }, []);

  const sorted = [...flows].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const filtered = sorted.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleDelete = async (uuid) => {
    setFlows((prev) => prev.filter((f) => f.uuid !== uuid));
    await AgentFlows.deleteFlow(uuid);
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--af-page-bg)" }}
    >
      <Sidebar activeSection={section} onSectionChange={setSection} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top bar ── */}
        <header
          className="flex items-center justify-between px-8 h-14 shrink-0"
          style={{ borderBottom: "1px solid var(--af-border)" }}
        >
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold" style={{ color: "var(--af-text-primary)" }}>
              {section === "flows" ? "Flows" : "Notebooks"}
            </h1>
            {section === "flows" && !loading && (
              <span
                className="text-[11px] px-1.5 py-0.5 rounded"
                style={{
                  color: "var(--af-text-muted)",
                  background: "var(--af-hover-bg)",
                }}
              >
                {flows.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "var(--af-text-muted)" }}
              />
              <input
                type="text"
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none transition-all w-40"
                style={{
                  background: "var(--af-input-bg)",
                  border: "1px solid var(--af-border-input)",
                  color: "var(--af-text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--af-border-input)")}
              />
            </div>
            <NewButton />
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
          {section === "flows" && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : flows.length === 0 ? (
                <EmptyState onNew={() => navigate(paths.agents.builder())} />
              ) : filtered.length === 0 ? (
                <p className="text-sm text-center mt-16" style={{ color: "var(--af-text-muted)" }}>
                  &quot;{search}&quot;에 해당하는 플로우가 없어요
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered.map((flow) => (
                    <FlowCard
                      key={flow.uuid}
                      flow={flow}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {section === "notebooks" && <NotebooksPlaceholder />}
        </main>
      </div>
    </div>
  );
}
