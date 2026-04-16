import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  XCircle,
  CircleNotch,
  ChatDots,
  Brain,
  CaretDown,
  Sparkle,
  FileText,
} from "@phosphor-icons/react";
import { NODE_INFO } from "../nodeConstants.jsx";

const NODE_ICONS = {
  generate: Brain,
  userInput: ChatDots,
  output: FileText,
  finish: FileText,
};

function fmtSeconds(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

/** 실행 중 세부 단계 경과 시간 표시 */
function useLiveElapsed(active, startedAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active || !startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active, startedAt]);
  if (!active || !startedAt) return null;
  return Math.max(0, now - startedAt);
}

function computeLlmSubDurations(entry) {
  const started = entry.timestamp || 0;
  const firstAns = entry._firstAnswerAt;
  const total = entry.duration;
  if (!started) return { reasoningMs: null, answerMs: null };
  if (total != null && firstAns) {
    const end = started + total;
    return {
      reasoningMs: Math.max(0, firstAns - started),
      answerMs: Math.max(0, end - firstAns),
    };
  }
  if (total != null && (entry.reasoning || entry.streamingReasoning) && !firstAns) {
    return { reasoningMs: total, answerMs: null };
  }
  if (total != null) {
    return { reasoningMs: null, answerMs: total };
  }
  return { reasoningMs: null, answerMs: null };
}

function SubStep({
  icon: Icon,
  title,
  rightSlot,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-white/10 light:border-black/10 bg-white/[0.04] light:bg-black/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-white/5 light:hover:bg-black/5 transition-colors"
      >
        <CaretDown
          className={`w-3.5 h-3.5 text-theme-text-secondary/50 shrink-0 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
        <Icon className="w-3.5 h-3.5 text-theme-text-secondary/70 shrink-0" />
        <span className="flex-1 text-[11px] font-medium text-theme-text-primary">{title}</span>
        <span className="text-[10px] text-theme-text-secondary/55 tabular-nums shrink-0">{rightSlot}</span>
      </button>
      {open && children ? (
        <div className="px-2.5 pb-2.5 border-t border-white/5 light:border-black/5">{children}</div>
      ) : null}
    </div>
  );
}

function LogEntry({ entry }) {
  const color = NODE_INFO[entry.nodeType]?.color || "#6b7280";
  const IconCmp = NODE_ICONS[entry.nodeType] || FileText;
  const running = entry.status === "running";
  const isLlm = entry.nodeType === "generate";

  const [expanded, setExpanded] = useState(() => running || entry.status === "waiting_input");

  useEffect(() => {
    if (running) setExpanded(true);
  }, [running]);

  const hasDetail =
    entry.result ||
    entry.error ||
    entry.reasoning ||
    entry.streamingReasoning ||
    entry.streamingAnswer;

  const reasoningText =
    (entry.streamingReasoning && entry.streamingReasoning.trim()) ||
    (entry.reasoning && String(entry.reasoning).trim()) ||
    "";
  const answerText =
    (entry.streamingAnswer && entry.streamingAnswer.trim()) ||
    (entry.result && String(entry.result).trim()) ||
    "";

  const { reasoningMs, answerMs } = computeLlmSubDurations(entry);
  const liveReasoning = useLiveElapsed(
    running && isLlm && !!reasoningText && !entry._firstAnswerAt,
    entry.timestamp
  );
  const liveAnswer = useLiveElapsed(
    running && isLlm && !!entry._firstAnswerAt,
    entry._firstAnswerAt
  );

  const statusIcon = {
    running: <CircleNotch className="w-4 h-4 animate-spin text-blue-400" />,
    complete: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    waiting_input: <ChatDots className="w-4 h-4 text-amber-400 animate-pulse" />,
  }[entry.status] || null;

  return (
    <div
      className="mb-2 rounded-xl overflow-hidden border border-white/10 light:border-black/10 shadow-sm bg-theme-bg-secondary/30 light:bg-white/80"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 light:hover:bg-black/[0.03] transition-colors"
      >
        <CaretDown
          className={`w-4 h-4 text-theme-text-secondary/50 shrink-0 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
        />
        <span className="shrink-0" style={{ color }}>
          <IconCmp className="w-4 h-4" weight="duotone" />
        </span>
        <span className="flex-1 text-xs font-semibold text-theme-text-primary truncate">
          {entry.label}
        </span>
        {entry.duration != null && (
          <span className="text-[10px] text-theme-text-secondary/55 tabular-nums shrink-0">
            {fmtSeconds(entry.duration)}
          </span>
        )}
        <span className="shrink-0">{statusIcon}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2.5 space-y-2">
          {isLlm && (reasoningText || entry.hadReasoningStream) && (
            <SubStep
              icon={Sparkle}
              title="Thought"
              rightSlot={
                running && reasoningText && !entry._firstAnswerAt
                  ? fmtSeconds(liveReasoning)
                  : fmtSeconds(reasoningMs)
              }
              defaultOpen
            >
              <div className="mt-2 rounded-md border border-white/10 light:border-black/10 bg-theme-bg-primary/80 light:bg-white px-2.5 py-2 max-h-52 overflow-y-auto text-[11px] text-theme-text-secondary/90 leading-relaxed whitespace-pre-wrap break-words font-mono">
                {reasoningText || (running ? "…" : "")}
              </div>
            </SubStep>
          )}

          {isLlm &&
            (answerText ||
              running ||
              entry.status === "complete" ||
              entry.error) && (
            <SubStep
              icon={FileText}
              title="응답"
              rightSlot={
                running && entry._firstAnswerAt
                  ? fmtSeconds(liveAnswer)
                  : fmtSeconds(answerMs ?? (entry.duration != null && !reasoningText ? entry.duration : null))
              }
              defaultOpen
            >
              <div className="mt-2 rounded-md border border-white/10 light:border-black/10 bg-theme-bg-primary/80 light:bg-white px-2.5 py-2 max-h-52 overflow-y-auto text-[11px] text-theme-text-secondary/90 leading-relaxed whitespace-pre-wrap break-words">
                {entry.error ? (
                  <span className="text-red-400">{entry.error}</span>
                ) : (
                  answerText || (running ? "…" : "")
                )}
              </div>
            </SubStep>
          )}

          {!isLlm && hasDetail && (
            <SubStep
              icon={FileText}
              title="출력"
              rightSlot={entry.duration != null ? fmtSeconds(entry.duration) : "—"}
              defaultOpen
            >
              <div className="mt-2 text-[11px] text-theme-text-secondary/90 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {entry.error ? (
                  <span className="text-red-400">{entry.error}</span>
                ) : (
                  String(entry.result || "")
                )}
              </div>
            </SubStep>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConsoleLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-theme-text-secondary/50">
        실행 로그가 여기에 표시됩니다
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1.5 py-2">
      {logs.map((entry, i) => (
        <LogEntry key={`${entry.nodeId}-${i}`} entry={entry} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
