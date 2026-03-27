import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lightning, BookOpen, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";
import Sidebar from "./Sidebar";
import FlowCard from "./FlowCard";
import NewButton from "./NewButton";

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-[var(--theme-bg-secondary)] overflow-hidden animate-pulse">
      <div className="h-[3px] w-full bg-white/5" />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/5 rounded w-2/3" />
            <div className="h-2.5 bg-white/5 rounded w-1/2" />
          </div>
        </div>
        <div className="pt-3 border-t border-white/5">
          <div className="h-2.5 bg-white/5 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-24">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
        <Lightning size={26} weight="fill" className="text-[var(--theme-button-primary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--theme-text-primary)] mb-1.5">
        아직 플로우가 없어요
      </p>
      <p className="text-xs text-[var(--theme-text-secondary)] mb-6">
        첫 번째 AI 워크플로우를 만들어보세요
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "var(--theme-button-primary)", color: "#0e0f0f" }}
      >
        <Plus size={13} weight="bold" />
        새 Flow 만들기
      </button>
    </div>
  );
}

// ── Notebooks placeholder ────────────────────────────────────────────────────
function NotebooksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-24">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
        <BookOpen size={26} weight="fill" className="text-[var(--theme-text-secondary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--theme-text-primary)] mb-1.5">
        Notebooks
      </p>
      <p className="text-xs text-[var(--theme-text-secondary)]">
        곧 출시 예정이에요
      </p>
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
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

  // 최근 수정 순 정렬
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
    <div className="flex h-screen w-screen bg-[var(--theme-bg-primary)] overflow-hidden">
      <Sidebar activeSection={section} onSectionChange={setSection} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top bar ── */}
        <header className="flex items-center justify-between px-8 h-14 border-b border-white/5 shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              {section === "flows" ? "Flows" : "Notebooks"}
            </h1>
            {section === "flows" && !loading && (
              <p className="text-[11px] text-[var(--theme-text-secondary)]">
                {flows.length}개
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-text">
              <MagnifyingGlass
                size={13}
                className="text-[var(--theme-text-secondary)] shrink-0"
              />
              <input
                type="text"
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-[var(--theme-text-primary)] outline-none w-36"
                style={{ "::placeholder": { color: "var(--theme-text-secondary)" } }}
              />
            </label>

            <NewButton />
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
          {section === "flows" && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : flows.length === 0 ? (
                <EmptyState onNew={() => navigate(paths.agents.builder())} />
              ) : filtered.length === 0 ? (
                <p className="text-sm text-[var(--theme-text-secondary)] text-center mt-16">
                  &quot;{search}&quot;에 해당하는 플로우가 없어요
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
