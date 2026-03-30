import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CaretDown } from "@phosphor-icons/react";
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          background: open ? "#5254cc" : "#6366f1",
          color: "#ffffff",
          boxShadow: "0 1px 6px rgba(99,102,241,0.35)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#5254cc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "#5254cc" : "#6366f1")}
      >
        <Plus className="w-3.5 h-3.5" weight="bold" />
        New
        <CaretDown
          className="w-3 h-3 transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50 py-1"
          style={{
            background: "#1a1d27",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {MENU_ITEMS.map(({ id, label, available, action }) =>
            available ? (
              <button
                key={id}
                onClick={() => {
                  action(navigate);
                  setOpen(false);
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm transition-colors"
                style={{ color: "#e8eaf0" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {label}
              </button>
            ) : (
              <div
                key={id}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm cursor-not-allowed"
                style={{ color: "#4a4f5c" }}
              >
                <span>{label}</span>
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
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
