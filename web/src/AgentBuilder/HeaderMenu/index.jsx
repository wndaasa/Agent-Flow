import { CaretDown, CaretUp, Plus, CaretLeft, FloppyDisk } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import paths from "@/utils/paths";

/**
 * HeaderMenu — 에이전트 빌더 최상단 네비게이션 바
 *
 * 레이아웃:
 *   [← | Builder 로고 | 이름 | 설명]   [Editor | App]   [New Flow | Save]
 *   좌측                                중앙(절대)        우측
 */
export default function HeaderMenu({
  flowName,
  flowNameField,
  flowDescField,
  availableFlows = [],
  onNewFlow,
  onSaveFlow,
  mode = "editor",
  onModeChange,
}) {
  const { flowId = null } = useParams();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate    = useNavigate();
  const dropdownRef = useRef(null);

  const otherFlows = availableFlows.filter((f) => f.uuid !== flowId);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex items-center h-full w-full">

        {/* ── 좌측: 뒤로가기 + Builder 로고 + 이름/설명 인풋 ── */}
        <div className="flex items-center gap-x-2">

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate(paths.home())}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-settings-input-bg border border-white/10 hover:bg-theme-action-menu-bg transition-colors duration-200 shrink-0"
            title="홈으로 돌아가기"
          >
            <CaretLeft weight="bold" className="w-5 h-5 text-theme-text-primary" />
          </button>

          {/* Builder 로고 + 이름/설명 + 플로우 전환 드롭다운 */}
          <div
            ref={dropdownRef}
            className="relative flex items-center bg-theme-settings-input-bg rounded-md border border-white/10"
          >
            {/* 이름 인풋 */}
            <input
              type="text"
              {...flowNameField}
              placeholder="플로우 이름"
              className="
                border-none bg-transparent text-theme-text-primary text-sm font-semibold
                focus:outline-none placeholder:text-theme-text-secondary/40
                px-3 py-2 w-36 min-w-0
              "
              autoComplete="off"
              spellCheck={false}
            />

            {/* 구분선 */}
            <span className="text-theme-text-secondary/30 select-none shrink-0">|</span>

            {/* 설명 인풋 */}
            <input
              type="text"
              {...flowDescField}
              placeholder="플로우 설명"
              className="
                border-none bg-transparent text-theme-text-primary text-sm
                focus:outline-none placeholder:text-theme-text-secondary/40
                px-3 py-2 w-52 min-w-0
              "
              autoComplete="off"
              spellCheck={false}
            />

            {/* 플로우 전환 드롭다운 토글 (다른 플로우가 있을 때만) */}
            {otherFlows.length > 0 && (
              <>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="
                    flex items-center px-2 py-2
                    border-l border-white/10
                    hover:bg-theme-action-menu-bg transition-colors duration-200
                    border-t-0 border-r-0 border-b-0
                  "
                  title="다른 플로우로 전환"
                >
                  <div className="flex flex-col">
                    <CaretUp size={10} />
                    <CaretDown size={10} />
                  </div>
                </button>

                {showDropdown && (
                  <div className="
                    absolute top-full left-0 mt-1
                    min-w-[200px] max-w-[320px]
                    bg-theme-settings-input-bg border border-white/10
                    rounded-md shadow-lg z-50 animate-fadeUpIn
                  ">
                    {otherFlows.map((flow, i) => (
                      <button
                        key={flow?.uuid || `flow-${i}`}
                        onClick={() => {
                          navigate(paths.agents.editAgent(flow.uuid));
                          setShowDropdown(false);
                        }}
                        className="border-none w-full text-left px-3 py-2 text-sm text-theme-text-primary hover:bg-theme-action-menu-bg transition-colors duration-200"
                      >
                        <span className="block truncate">{flow?.name || "Untitled Flow"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 중앙: Editor / App 토글 ──────────────────────── */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center bg-theme-settings-input-bg border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange?.("editor")}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${mode === "editor"
                  ? "bg-primary-button text-black light:text-white shadow-sm"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
                }
              `}
            >
              Editor
            </button>
            <button
              onClick={() => onModeChange?.("app")}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${mode === "app"
                  ? "bg-primary-button text-black light:text-white shadow-sm"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
                }
              `}
            >
              App
            </button>
          </div>
        </div>

        {/* ── 우측: New Flow + Save ─────────────────────────── */}
        <div className="flex items-center gap-x-2 ml-auto pr-0">
          {mode === "editor" && (
            <>
              <button
                onClick={onNewFlow}
                className="
                  flex items-center gap-x-1.5
                  text-theme-text-primary text-sm font-medium
                  px-3 py-2 rounded-lg
                  border border-white/10 bg-theme-settings-input-bg
                  hover:bg-theme-action-menu-bg transition-colors duration-200
                "
              >
                <Plus className="w-4 h-4" />
                New Flow
              </button>

              <button
                onClick={onSaveFlow}
                className="
                  border-none flex items-center gap-x-1.5
                  bg-primary-button hover:opacity-80
                  text-black light:text-white
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                "
              >
                <FloppyDisk className="w-4 h-4" />
                Save
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
