import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import paths from "@/utils/paths";

const MENU_ITEMS = [
  {
    id: "flow",
    label: "New Flow",
    available: true,
    action: (navigate) => navigate(paths.agents.builder()),
  },
  {
    id: "notebook",
    label: "New Notebook",
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 text-[var(--theme-text-primary)] bg-white/5 hover:bg-white/10 transition-colors"
      >
        + New
        <span
          className="text-[10px] text-[var(--theme-text-secondary)] transition-transform duration-150 inline-block"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--theme-bg-secondary)] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 py-1">
          {MENU_ITEMS.map(({ id, label, available, action }) =>
            available ? (
              <button
                key={id}
                onClick={() => {
                  action(navigate);
                  setOpen(false);
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-[var(--theme-text-primary)] hover:bg-white/5 transition-colors"
              >
                {label}
              </button>
            ) : (
              <div
                key={id}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[var(--theme-text-secondary)] opacity-35 cursor-not-allowed"
              >
                <span>{label}</span>
                <span className="text-[9px] text-white/25">Soon</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
