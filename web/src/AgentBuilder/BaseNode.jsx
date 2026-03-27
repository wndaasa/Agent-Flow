import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import { X } from "@phosphor-icons/react";
import { useFlowContext } from "./FlowContext";
import { NODE_INFO } from "./nodeConstants.jsx";

/**
 * BaseNode — 캔버스에 표시되는 노드 카드 (compact 표시 전용)
 *
 * 이 컴포넌트는 노드를 캔버스에 "표시"만 한다.
 * 편집은 RightPanel > StepEditor > 각 Panel 컴포넌트에서 이루어진다.
 *
 * ── 구조 ──────────────────────────────────────────────────────
 * ┌─[colored left border]─────────────────────────────────────┐
 * │  [icon]  [title (더블클릭으로 인라인 편집)]  [삭제 버튼]  │  ← 헤더
 * ├───────────────────────────────────────────────────────────┤
 * │  previewText (최대 2줄 말줄임)                            │  ← 미리보기
 * └───────────────────────────────────────────────────────────┘
 *
 * Props:
 *   id        : 노드 ID
 *   type      : 노드 타입 (NODE_INFO 키)
 *   data      : 노드 data 객체
 *   selected  : ReactFlow 선택 상태
 *   deletable : 삭제 버튼 표시 여부 (기본 true)
 */
export default function BaseNode({
  id,
  type,
  data = {},
  selected,
  deletable = true,
}) {
  const { onDeleteNode, onDataChange } = useFlowContext();
  const updateNodeInternals = useUpdateNodeInternals();

  const [editing, setEditing]     = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef                  = useRef(null);
  const rootRef                   = useRef(null);

  const info      = NODE_INFO[type] || { label: type, icon: null, color: "#6b7280" };
  const isStart   = type === "start";
  const isFinish  = type === "finish" || type === "output";
  const isOutput  = type === "output" || type === "finish";

  const displayLabel = data.title?.trim() || info.label;
  const previewText  = info.previewText?.(data) || null;

  // ReactFlow는 노드 래퍼 크기를 캐싱한다.
  // min-width만 지정하면 첫 측정값이 좁게 잡혀 카드가 밖으로 비치거나(selection 박스와 불일치),
  // 반대로 캐시가 커진 채로 남는 경우가 있어 DOM 실측 + ResizeObserver로 동기화한다.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, previewText, displayLabel, isOutput]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const schedule = () => {
      requestAnimationFrame(() => {
        updateNodeInternals(id);
      });
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    schedule();
    return () => {
      ro.disconnect();
    };
  }, [id, updateNodeInternals]);

  /* ── 인라인 제목 편집 ──────────────────────────────────── */
  const startEdit = (e) => {
    if (isStart || isOutput) return;
    e.stopPropagation();
    setEditValue(data.title?.trim() || "");
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    onDataChange(id, { title: editValue.trim() });
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const widthClass = isOutput
    ? "w-full min-w-0"
    : "min-w-[220px] max-w-[280px] shrink-0";

  return (
    <div
      ref={rootRef}
      className={`
        rounded-xl border transition-all duration-150
        ${widthClass} box-border
        bg-theme-action-menu-bg shadow-md
        overflow-hidden
        ${selected
          ? "border-primary-button shadow-primary-button/20 shadow-lg"
          : "border-white/10 light:border-black/10"
        }
      `}
    >
      {/* 상단 연결 Handle (Start 노드 제외) */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-primary-button !border-2 !border-theme-bg-primary"
        />
      )}

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 light:border-black/5"
        style={{ borderLeftColor: info.color, borderLeftWidth: 3, borderLeftStyle: "solid" }}
      >
        {/* 아이콘 */}
        <span className="shrink-0" style={{ color: info.color }}>
          {info.icon}
        </span>

        {/* 제목 — 더블클릭으로 인라인 편집 */}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { setEditing(false); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-b border-primary-button/60 text-xs font-semibold text-theme-text-primary focus:outline-none min-w-0"
            autoComplete="off"
            spellCheck={false}
          />
        ) : (
          <span
            className={`
              flex-1 text-xs font-semibold text-theme-text-primary truncate
              ${!isStart && !isOutput ? "cursor-text" : ""}
            `}
            onDoubleClick={!isStart && !isOutput ? startEdit : undefined}
            title={!isStart && !isOutput ? "더블클릭으로 이름 편집" : undefined}
          >
            {displayLabel}
          </span>
        )}

        {/* 삭제 버튼 (Start/Output 제외) */}
        {deletable && !isStart && !isOutput && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteNode(id); }}
            className="text-theme-text-secondary hover:text-red-400 transition-colors shrink-0"
            title="노드 삭제"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── 미리보기 텍스트 ───────────────────────────────── */}
      {previewText && (
        <div className="px-3 py-2">
          <p className="text-[11px] text-theme-text-secondary/70 line-clamp-2 leading-relaxed">
            {previewText}
          </p>
        </div>
      )}

      {/* 하단 연결 Handle (Output/Finish 노드 제외) */}
      {!isOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary-button !border-2 !border-theme-bg-primary"
        />
      )}
    </div>
  );
}
