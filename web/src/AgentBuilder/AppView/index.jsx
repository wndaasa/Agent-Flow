import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  ArrowCounterClockwise,
  X,
  PaperPlaneRight,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Paperclip,
} from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import { baseHeaders } from "@/utils/request";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";

/** Preview 본문 영역 — 얇은 커스텀 스크롤바 (WebKit + Firefox) */
const PRETTY_SCROLL_CLASS =
  "overflow-y-auto min-h-0 " +
  "[scrollbar-width:thin] " +
  "[scrollbar-color:rgba(148,163,184,0.45)_transparent] " +
  "[&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-white/20 " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-white/35 " +
  "light:[&::-webkit-scrollbar-thumb]:bg-black/12 " +
  "light:hover:[&::-webkit-scrollbar-thumb]:bg-black/24";

/** fetch + ReadableStream 기반 SSE 수신 (EventSource 대체 - 커스텀 헤더 지원) */
async function readSSEStream(url, onMessage, abortSignal) {
  const response = await fetch(url, {
    headers: baseHeaders(),
    signal: abortSignal,
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            onMessage(JSON.parse(line.slice(6)));
          } catch (_) {}
        }
      }
    }
  }
}

/** Preview "실행 중" 라벨 — 마지막 로그 한 줄이 아니라 아직 진행 중인 스텝 기준 (완료된 이전 단계 라벨이 계속 보이는 문제 방지) */
function getActiveStepLabel(logs) {
  if (!logs?.length) return null;
  const active = [...logs].reverse().find(
    (l) => l.status === "running" || l.status === "waiting_input"
  );
  if (active?.label) return active.label;
  const last = logs[logs.length - 1];
  if (last?.status === "complete") return "다음 단계 처리 중…";
  return last?.label || "…";
}

/** 진행 상태 */
const PHASE = {
  IDLE: "idle",           // 시작 전
  RUNNING: "running",     // 실행 중
  WAITING: "waiting",     // User Input 대기
  COMPLETE: "complete",   // 완료
  ERROR: "error",         // 오류
};

export default function AppView({ flowUuid, flowName, onLogsChange }) {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [logs, setLogs] = useState([]);
  // 병렬 UserInput 노드 대응: 큐로 관리, waitingInput은 큐[0]에서 파생
  const [inputQueue, setInputQueue] = useState([]); // [{ nodeId, prompt, variableName, inputType, required }, ...]
  const [inputValue, setInputValue] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // { name, file } for "any"/"file" type
  const fileInputRef = useRef(null);
  const [finalOutput, setFinalOutput] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const sessionIdRef = useRef(null);
  const abortCtrlRef = useRef(null); // fetch AbortController

  // ── SSE 이벤트 처리 ──────────────────────────────────────────────
  // phase 의존성 없이 항상 최신 상태를 참조하도록 functional updater 사용
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case "node_start":
        setLogs((prev) => [
          ...prev,
          {
            nodeId: data.nodeId,
            nodeType: data.nodeType,
            label: data.label,
            status: "running",
            timestamp: Date.now(),
          },
        ]);
        break;

      case "waiting_for_input":
        setInputQueue((prev) => [
          ...prev,
          {
            nodeId: data.nodeId,
            prompt: data.prompt,
            variableName: data.variableName,
            inputType: data.inputType || "any",
            required: data.required ?? false,
          },
        ]);
        setPhase(PHASE.WAITING);
        setLogs((prev) =>
          prev.map((l) =>
            l.nodeId === data.nodeId ? { ...l, status: "waiting_input" } : l
          )
        );
        break;

      case "llm_stream": {
        const chunk = data.chunk != null ? String(data.chunk) : "";
        setLogs((prev) =>
          prev.map((l) => {
            if (l.nodeId !== data.nodeId) return l;
            const next = { ...l };
            if (data.channel === "reasoning") {
              next.streamingReasoning = (l.streamingReasoning || "") + chunk;
              next.hadReasoningStream = true;
            } else if (data.channel === "answer") {
              if (l._firstAnswerAt == null) next._firstAnswerAt = Date.now();
              next.streamingAnswer = (l.streamingAnswer || "") + chunk;
            }
            return next;
          })
        );
        break;
      }

      case "node_complete":
        setLogs((prev) =>
          prev.map((l) =>
            l.nodeId === data.nodeId
              ? {
                  ...l,
                  status: "complete",
                  result: data.result,
                  duration: data.duration,
                  ...(data.reasoning != null && String(data.reasoning).trim() !== ""
                    ? { reasoning: data.reasoning }
                    : {}),
                  streamingReasoning: undefined,
                  streamingAnswer: undefined,
                }
              : l
          )
        );
        // functional updater로 최신 phase 참조 (stale closure 방지)
        setPhase((prev) => (prev !== PHASE.WAITING ? PHASE.RUNNING : prev));
        break;

      case "node_error":
        setLogs((prev) =>
          prev.map((l) =>
            l.nodeId === data.nodeId
              ? { ...l, status: "error", error: data.error, duration: data.duration }
              : l
          )
        );
        setPhase(PHASE.ERROR);
        setErrorMessage(data.error || "실행 중 오류가 발생했습니다.");
        abortCtrlRef.current?.abort();
        break;

      case "flow_complete":
        setPhase(PHASE.COMPLETE);
        setFinalOutput(data.output || null);
        abortCtrlRef.current?.abort();
        break;

      case "flow_error":
        setPhase(PHASE.ERROR);
        setErrorMessage(data.error);
        abortCtrlRef.current?.abort();
        break;

      case "flow_cancelled":
        setPhase(PHASE.IDLE);
        abortCtrlRef.current?.abort();
        break;

      default:
        break;
    }
  }, []);

  // ── 플로우 시작 ───────────────────────────────────────────────────
  const startFlow = useCallback(async () => {
    setPhase(PHASE.RUNNING);
    setLogs([]);
    setFinalOutput(null);
    setErrorMessage(null);
    setInputQueue([]);
    setInputValue("");
    setAttachedFile(null);

    // 세션 생성
    const { success, sessionId, error } = await AgentFlows.startRun(flowUuid);
    if (!success) {
      setPhase(PHASE.ERROR);
      setErrorMessage(error || "세션 생성 실패");
      return;
    }
    sessionIdRef.current = sessionId;

    // SSE 스트림 연결 (fetch 기반)
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;
    const streamUrl = AgentFlows.streamUrl(flowUuid, sessionId);

    readSSEStream(streamUrl, handleSSEEvent, ctrl.signal).catch((err) => {
      if (err.name === "AbortError") return; // 의도적 취소
      setPhase(PHASE.ERROR);
      setErrorMessage(err.message);
    });
  }, [flowUuid]);

  // ── User Input 제출 ───────────────────────────────────────────────
  const submitInput = useCallback(async () => {
    if (!sessionIdRef.current || inputQueue.length === 0) return;
    const current = inputQueue[0];
    const textValue = inputValue.trim();
    const hasValue = !!attachedFile || !!textValue;

    setLogs((prev) =>
      prev.map((l) =>
        l.nodeId === current.nodeId
          ? {
              ...l,
              status: "complete",
              result: attachedFile ? attachedFile.name : (textValue || "(skip)"),
              duration: 0,
            }
          : l
      )
    );

    // 큐에서 제거; 남은 항목 있으면 WAITING 유지, 없으면 RUNNING으로
    setInputQueue((prev) => prev.slice(1));
    setInputValue("");
    setAttachedFile(null);
    if (inputQueue.length <= 1) setPhase(PHASE.RUNNING);

    if (attachedFile?.file) {
      const resp = await AgentFlows.submitInputFile(
        flowUuid,
        sessionIdRef.current,
        current.nodeId,
        attachedFile.file,
        textValue
      );
      if (!resp?.success) {
        setPhase(PHASE.ERROR);
        setErrorMessage(resp?.error || "파일 파싱 중 오류가 발생했습니다.");
      }
      return;
    }

    await AgentFlows.submitInput(
      flowUuid,
      sessionIdRef.current,
      current.nodeId,
      hasValue ? textValue : ""
    );
  }, [flowUuid, inputQueue, inputValue, attachedFile]);

  // ── 리셋 ─────────────────────────────────────────────────────────
  const resetFlow = useCallback(async () => {
    abortCtrlRef.current?.abort();
    if (sessionIdRef.current) {
      await AgentFlows.cancelRun(flowUuid, sessionIdRef.current);
      sessionIdRef.current = null;
    }
    setPhase(PHASE.IDLE);
    setLogs([]);
    setFinalOutput(null);
    setErrorMessage(null);
    setInputQueue([]);
    setInputValue("");
    setAttachedFile(null);
  }, [flowUuid]);

  // 로그 변경 시 부모에게 알림 (Console 탭 공유용)
  useEffect(() => {
    onLogsChange?.(logs);
  }, [logs, onLogsChange]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      abortCtrlRef.current?.abort();
    };
  }, []);

  // ── 렌더 ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-theme-bg-primary min-h-0">
      {(phase === PHASE.RUNNING || phase === PHASE.WAITING) && (
        <div className="shrink-0 flex items-center justify-end px-3 py-2">
          <button
            type="button"
            onClick={resetFlow}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-theme-text-secondary hover:bg-white/8 light:hover:bg-black/6 hover:text-theme-text-primary transition-colors"
            title="실행 중단"
          >
            <X className="w-4 h-4" />
            중단
          </button>
        </div>
      )}

      {phase === PHASE.COMPLETE && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-emerald-500 shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0" weight="fill" />
            <span className="text-xs font-semibold tracking-tight">완료</span>
          </div>
          <button
            type="button"
            onClick={resetFlow}
            className="flex items-center justify-center rounded-xl p-2.5 text-theme-text-secondary hover:bg-white/8 light:hover:bg-black/6 hover:text-primary-button transition-colors"
            title="다시 실행"
          >
            <ArrowCounterClockwise className="w-5 h-5" />
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col min-h-0 relative ${
          phase === PHASE.IDLE || phase === PHASE.ERROR ? "items-center justify-center px-8" : ""
        } ${phase === PHASE.COMPLETE ? "min-h-0 px-3 pb-3 pt-2" : phase === PHASE.RUNNING || phase === PHASE.WAITING ? "flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-0" : ""}`}
      >

          {/* IDLE: Start 버튼 */}
          {phase === PHASE.IDLE && (
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="text-theme-text-secondary text-sm max-w-sm">
                플로우를 실행하려면 Start를 누르세요
              </p>
              <button
                onClick={startFlow}
                className="flex items-center gap-2 bg-primary-button hover:opacity-80 text-black light:text-white px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary-button/30"
              >
                <Play weight="fill" className="w-4 h-4" />
                Start
              </button>
            </div>
          )}

          {/* RUNNING: 로딩 */}
          {phase === PHASE.RUNNING && (
            <div className="flex flex-col items-center gap-4 text-center">
              <CircleNotch className="w-10 h-10 text-primary-button animate-spin" />
              <p className="text-theme-text-secondary text-sm">
                {logs.length > 0
                  ? `실행 중: ${getActiveStepLabel(logs) || "..."}`
                  : "플로우 시작 중..."}
              </p>
            </div>
          )}

          {/* WAITING: User Input (큐의 첫 번째 항목 표시) */}
          {phase === PHASE.WAITING && inputQueue.length > 0 && (() => {
            const currentInput = inputQueue[0];
            return (
            <div className="w-full max-w-lg flex flex-col gap-6 shrink-0">
              {/* 여러 입력 대기 중일 때 진행 표시 */}
              {inputQueue.length > 1 && (
                <p className="text-center text-xs text-theme-text-secondary/60">
                  {inputQueue.length}개 입력 필요 · 1 / {inputQueue.length}
                </p>
              )}
              <p className="text-theme-text-primary text-xl font-medium text-center leading-relaxed whitespace-pre-wrap">
                {currentInput.prompt}
              </p>

              {/* file 전용: 파일 업로드만 */}
              {currentInput.inputType === "file" ? (
                <div className="flex flex-col items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-primary-button/50 hover:bg-primary-button/5 transition-all">
                    <span className="text-sm text-theme-text-secondary">
                      {attachedFile ? "✓ 파일 선택됨" : "클릭하여 파일 선택"}
                    </span>
                    <span className="text-xs text-theme-text-secondary/50 mt-1">
                      서버에서 문서를 파싱해 텍스트로 변환합니다
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAttachedFile({ name: file.name, file });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={submitInput}
                    disabled={currentInput.required && !attachedFile}
                    className="w-full py-2.5 rounded-xl bg-primary-button hover:opacity-80 disabled:opacity-40 text-black light:text-white text-sm font-medium transition-opacity"
                  >
                    제출
                  </button>
                </div>
              ) : (
                /* text / any: 텍스트 입력 + 파일 첨부 버튼 */
                <div className="flex flex-col gap-2">
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-button/10 border border-primary-button/20 rounded-xl text-xs text-primary-button">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">{attachedFile.name}</span>
                      <button onClick={() => setAttachedFile(null)} className="shrink-0 hover:opacity-60">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-nowrap items-center gap-2 bg-theme-settings-input-bg border border-white/10 rounded-2xl px-3 py-2 min-h-[2.75rem]">
                    {currentInput.inputType !== "text" && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setAttachedFile({ name: file.name, file });
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`shrink-0 self-center w-9 h-9 flex items-center justify-center rounded-full transition-opacity ${attachedFile ? "bg-primary-button/20 text-primary-button" : "bg-white/10 light:bg-black/10 text-theme-text-secondary hover:opacity-80"}`}
                          title="파일 첨부"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <textarea
                      autoFocus={!attachedFile}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const hasValue = attachedFile || inputValue.trim();
                          if (!currentInput.required || hasValue) submitInput();
                        }
                      }}
                      placeholder={attachedFile ? "추가 메모 입력 (선택)" : "응답을 입력하세요..."}
                      rows={1}
                      className="flex-1 min-w-0 self-center min-h-9 max-h-32 bg-transparent text-sm text-theme-text-primary resize-none focus:outline-none placeholder:text-theme-text-secondary/40 leading-5 py-2 overflow-y-auto"
                    />
                    <button
                      type="button"
                      onClick={submitInput}
                      disabled={currentInput.required && !attachedFile && !inputValue.trim()}
                      className="shrink-0 self-center w-9 h-9 flex items-center justify-center rounded-full bg-primary-button hover:opacity-80 disabled:opacity-40 transition-opacity"
                      title="전송"
                    >
                      <PaperPlaneRight weight="fill" className="w-4 h-4 text-black light:text-white" />
                    </button>
                  </div>
                </div>
              )}

              {!currentInput.required && (
                <button
                  onClick={() => { setInputValue(""); setAttachedFile(null); submitInput(); }}
                  className="self-end text-xs text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
                >
                  건너뛰기
                </button>
              )}
            </div>
            );
          })()}

          {/* COMPLETE: 결과 — 본문이 패널 하단까지 채움 + 스크롤 */}
          {phase === PHASE.COMPLETE && (
            <div className="flex flex-1 flex-col min-h-0 w-full max-w-none">
              {finalOutput ? (
                <div className="flex flex-1 flex-col min-h-0 rounded-xl border border-white/10 light:border-black/10 bg-theme-action-menu-bg/80 light:bg-white shadow-sm overflow-hidden">
                  <div
                    className={`flex-1 px-4 py-4 text-sm text-theme-text-primary leading-relaxed markdown break-words [&_strong]:text-theme-text-primary ${PRETTY_SCROLL_CLASS}`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        renderMarkdown(
                          typeof finalOutput === "string"
                            ? finalOutput
                            : finalOutput != null
                              ? JSON.stringify(finalOutput, null, 2)
                              : ""
                        )
                      ),
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-theme-text-secondary text-sm px-6 text-center">
                  결과가 없습니다. Console 탭에서 로그를 확인하세요.
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="mt-4 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs hover:bg-white/5 transition-colors"
                  >
                    <ArrowCounterClockwise className="w-4 h-4" />
                    다시 실행
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ERROR: 오류 */}
          {phase === PHASE.ERROR && (
            <div className="flex flex-col items-center gap-4 text-center">
              <WarningCircle className="w-10 h-10 text-red-400" />
              <p className="text-red-400 text-sm">{errorMessage || "실행 중 오류가 발생했습니다"}</p>
              <button
                onClick={resetFlow}
                className="flex items-center gap-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              >
                <ArrowCounterClockwise className="w-4 h-4" />
                다시 시도
              </button>
            </div>
          )}

      </div>
    </div>
  );
}
