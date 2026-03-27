const NAV_ITEMS = [
  { id: "flows", label: "Flows", available: true },
  { id: "notebooks", label: "Notebooks", available: false },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-52 shrink-0 flex flex-col h-full" style={{ background: "#111214", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Logo */}
      <div className="flex items-center px-5 h-14" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="font-semibold text-sm tracking-tight" style={{ color: "#f1f1f1" }}>
          Agent Flow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, available }) => {
          const isActive = activeSection === id && available;
          return (
            <button
              key={id}
              onClick={() => available && onSectionChange(id)}
              disabled={!available}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm w-full text-left transition-colors"
              style={{
                color: isActive ? "#f1f1f1" : available ? "#888" : "#555",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                fontWeight: isActive ? 500 : 400,
                cursor: available ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (!isActive && available) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{label}</span>
              {!available && (
                <span className="text-[9px]" style={{ color: "#444" }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
