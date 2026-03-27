import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Lightning, BookOpen, CaretDown } from "@phosphor-icons/react";
import paths from "@/utils/paths";

const MENU_ITEMS = [
  {
    id: "flow",
    label: "New Flow",
    icon: Lightning,
    available: true,
    action: (navigate) => navigate(paths.agents.builder()),
  },
  {
    id: "notebook",
    label: "New Notebook",
    icon: BookOpen,
    available: false,
  },
];

export default function NewButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
        style={{ background: "var(--theme-button-primary)", color: "#0e0f0f" }}
      >
        <Plus size={13} weight="bold" />
        New
        <CaretDown
          size={11}
          weight="bold"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--theme-bg-secondary)] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 py-1">
          {MENU_ITEMS.map(({ id, label, icon: Icon, available, action }) =>
            available ? (
              <button
                key={id}
                onClick={() => {
                  action(navigate);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--theme-text-primary)] hover:bg-white/5 transition-colors"
              >
                <Icon size={14} weight="fill" className="text-[var(--theme-button-primary)]" />
                {label}
              </button>
            ) : (
              <div
                key={id}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--theme-text-secondary)] opacity-40 cursor-not-allowed"
              >
                <Icon size={14} weight="fill" />
                {label}
                <span className="ml-auto text-[9px] bg-white/5 px-1.5 py-0.5 rounded-full leading-none">
                  Soon
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
