import { Lightning, BookOpen } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { id: "flows", label: "Flows", icon: Lightning, available: true },
  { id: "notebooks", label: "Notebooks", icon: BookOpen, available: false },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-[var(--theme-bg-sidebar)] h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/5">
        <Lightning
          size={18}
          weight="fill"
          className="text-[var(--theme-button-primary)]"
        />
        <span className="font-semibold text-sm text-[var(--theme-text-primary)] tracking-tight">
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
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors
                ${isActive
                  ? "bg-white/10 text-[var(--theme-text-primary)] font-medium"
                  : available
                    ? "text-[var(--theme-text-secondary)] hover:bg-white/5 hover:text-[var(--theme-text-primary)]"
                    : "text-[var(--theme-text-secondary)] opacity-40 cursor-not-allowed"
                }
              `}
            >
              <Icon size={15} weight={isActive ? "fill" : "regular"} />
              <span>{label}</span>
              {!available && (
                <span className="ml-auto text-[9px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded-full leading-none">
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
