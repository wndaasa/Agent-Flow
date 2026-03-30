import { Atom, BookOpen, GearSix } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { id: "flows",     label: "Flows",     icon: Atom,     available: true  },
  { id: "notebooks", label: "Notebooks", icon: BookOpen, available: false },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside
      className="w-52 shrink-0 flex flex-col h-full"
      style={{
        background: "#0f1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#6366f1" }}
        >
          <Atom className="w-3.5 h-3.5 text-white" weight="bold" />
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: "#e8eaf0" }}>
          Agent Flow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, available }) => {
          const isActive = activeSection === id && available;
          return (
            <button
              key={id}
              onClick={() => available && onSectionChange(id)}
              disabled={!available}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm w-full text-left transition-all duration-150"
              style={{
                color: isActive ? "#e8eaf0" : available ? "#7b7f8e" : "#4a4f5c",
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                fontWeight: isActive ? 500 : 400,
                cursor: available ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (!isActive && available) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#c4c7d4";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = available ? "#7b7f8e" : "#4a4f5c";
                }
              }}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className="w-4 h-4 shrink-0"
                  weight={isActive ? "fill" : "regular"}
                  style={{ color: isActive ? "#6366f1" : "inherit" }}
                />
                {label}
              </span>
              {!available && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    color: "#4a4f5c",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-sm transition-all duration-150"
          style={{ color: "#4a4f5c" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#7b7f8e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#4a4f5c";
          }}
        >
          <GearSix className="w-4 h-4 shrink-0" />
          설정
        </button>
      </div>
    </aside>
  );
}
