import React, { useState, useRef, useCallback, useEffect } from "react";
import AppView from "../AppView";
import ConsoleLog from "../AppView/ConsoleLog";
import StepEditor from "./StepEditor";
import { RIGHT_PANEL_TABS } from "../registries/rightPanelTabs";

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

/**
 * RightPanel — 에이전트 빌더 우측 패널
 *
 * 좌측 경계의 리사이즈 핸들을 드래그해 패널 너비를 조절할 수 있다.
 * 너비는 세션 중 상태로 유지된다 (새로고침 시 DEFAULT_WIDTH 로 초기화).
 *
 * Props:
 *   flowUuid    : 현재 저장된 플로우 UUID (Preview 탭 AppView 실행에 필요)
 *   flowName    : 플로우 표시 이름
 *   activeTab   : 외부 탭 제어 (선택)
 *   onTabChange : 탭 변경 콜백 (선택)
 *   appMode     : true면 상단 탭 바 숨김 (헤더 App 모드 전용)
 */
export default function RightPanel({
  flowUuid,
  flowName,
  activeTab: externalTab,
  onTabChange,
  width: controlledWidth,
  onWidthChange,
  appMode = false,
}) {
  const [internalTab, setInternalTab] = useState("step");
  const activeTab = externalTab ?? internalTab;

  const handleTabChange = (tabId) => {
    setInternalTab(tabId);
    onTabChange?.(tabId);
  };

  /* ── AppView 로그 공유 (Console 탭 표시용) ───────────── */
  const [sharedLogs, setSharedLogs] = useState([]);

  /* ── 리사이즈 로직 ──────────────────────────────────────── */
  // 외부에서 width 를 제어할 경우 controlled, 아니면 internal 상태 사용
  const [internalWidth, setInternalWidth] = useState(DEFAULT_WIDTH);
  const width    = controlledWidth ?? internalWidth;
  const setWidth = (w) => {
    setInternalWidth(w);
    onWidthChange?.(w);
  };

  const isDragging          = useRef(false);
  const startX              = useRef(0);
  const startWidth          = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current  = true;
    startX.current      = e.clientX;
    startWidth.current  = width;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      // 패널이 오른쪽에 있으므로 왼쪽으로 드래그할수록 너비가 커짐
      const delta   = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current             = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []); // 마운트 시 1회만 등록

  /* ── 렌더 ──────────────────────────────────────────────── */
  return (
    <div
      className="w-full h-full flex flex-row border-l border-white/10 light:border-black/10 bg-theme-bg-primary overflow-hidden"
    >
      {/* ── 리사이즈 핸들 ────────────────────────────────── */}
      <div
        onMouseDown={onMouseDown}
        className="
          w-1 shrink-0 cursor-col-resize
          hover:bg-primary-button/40
          active:bg-primary-button/60
          transition-colors duration-150
          group
        "
        title="드래그하여 패널 너비 조절"
      >
        {/* 시각적 그립 도트 */}
        <div className="
          h-full flex flex-col items-center justify-center gap-1
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
        ">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-0.5 h-0.5 rounded-full bg-primary-button"
            />
          ))}
        </div>
      </div>

      {/* ── 패널 본문 ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* 탭 헤더 — Editor 모드에서만 표시 (App 모드는 Preview 단일 화면) */}
        {!appMode && (
        <div className="flex shrink-0 border-b border-white/10 light:border-black/10">
          {RIGHT_PANEL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-1 py-2.5 text-xs font-medium transition-colors duration-150
                ${activeTab === tab.id
                  ? "text-primary-button border-b-2 border-primary-button"
                  : "text-theme-text-secondary hover:text-theme-text-primary border-b-2 border-transparent"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        )}

        {/* 탭 콘텐츠 — Preview(AppView)는 항상 마운트, display로 숨김 처리  */}
        {/* 탭 전환 시 SSE 연결·실행 상태가 유지되도록 언마운트하지 않는다 */}
        <div className="flex-1 min-h-0 overflow-hidden relative">

          {activeTab === "step" && <StepEditor />}

          {/* Preview: 항상 렌더, CSS로 숨김 → SSE 연결·상태 유지 */}
          <div
            className="absolute inset-0"
            style={{ display: activeTab === "preview" ? "block" : "none" }}
          >
            {flowUuid
              ? <AppView flowUuid={flowUuid} flowName={flowName} onLogsChange={setSharedLogs} />
              : (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <p className="text-sm text-theme-text-secondary">
                    플로우를 먼저 저장하면<br />여기서 실행할 수 있습니다
                  </p>
                </div>
              )
            }
          </div>

          {/* Console: AppView와 로그 공유 */}
          {activeTab === "console" && (
            <div className="h-full flex flex-col">
              <ConsoleLog logs={sharedLogs} />
            </div>
          )}

          {activeTab === "theme" && (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <p className="text-sm text-theme-text-secondary">
                테마 설정은 준비 중입니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
