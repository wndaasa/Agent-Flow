const NAV_ITEMS = [
  { id: "flows", label: "Flows", available: true },
  { id: "notebooks", label: "Notebooks", available: false },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-[var(--theme-bg-sidebar)] h-full">
      {/* Logo */}
      <div className="flex items-center px-5 h-14 border-b border-white/5">
        <span className="font-semibold text-sm text-[var(--theme-text-primary)] tracking-tight">
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
              className={`
                flex items-center justify-between px-3 py-2 rounded-lg text-sm w-full text-left transition-colors
                ${isActive
                  ? "bg-white/8 text-[var(--theme-text-primary)] font-medium"
                  : available
                    ? "text-[var(--theme-text-secondary)] hover:bg-white/5 hover:text-[var(--theme-text-primary)]"
                    : "text-[var(--theme-text-secondary)] opacity-35 cursor-not-allowed"
                }
              `}
            >
              <span>{label}</span>
              {!available && (
                <span className="text-[9px] text-white/25 leading-none">
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
