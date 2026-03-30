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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgb(0, 0, 0)",
          color: "#000000",
        }}
      >
        + New
        <span
          className="text-[10px] transition-transform duration-150 inline-block"
          style={{
            color: "#ffffff",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50 py-1"
          style={{
            background: "#1a1c1f",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
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
                style={{ color: "#f1f1f1" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {label}
              </button>
            ) : (
              <div
                key={id}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm cursor-not-allowed"
                style={{ color: "#555" }}
              >
                <span>{label}</span>
                <span className="text-[9px]" style={{ color: "#444" }}>Soon</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
