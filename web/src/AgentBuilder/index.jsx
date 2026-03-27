import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import showToast from "@/utils/toast";
import AgentFlows from "@/models/agentFlows";
import paths from "@/utils/paths";
import { FlowContext } from "./FlowContext";
import { NODE_INFO } from "./nodeConstants.jsx";
import { useLocalField } from "./hooks/useLocalField";
import { autoVarName, autoLlmVarName, autoCodeVarName } from "./utils/autoVarNames";

import HeaderMenu   from "./HeaderMenu";
import TopToolbar   from "./TopToolbar";
import { NODE_TYPES_WITH_EDGE_MENTION_INSERT } from "./registries/flowConstants";
import RightPanel   from "./RightPanel";

import StartNode          from "./nodes/StartNode";
import UserInputNode      from "./nodes/UserInputNode";
import LLMInstructionNode from "./nodes/LLMInstructionNode";
import SetVariableNode    from "./nodes/SetVariableNode";
import CodeNode           from "./nodes/CodeNode";
import OutputNode         from "./nodes/OutputNode";

/** 엣지 목록에 (source → target) 을 추가하면 순환이 생기는지 검사 */
function wouldCreateCycle(source, target, existingEdges) {
  const successors = new Map();
  for (const e of existingEdges) {
    if (!successors.has(e.source)) successors.set(e.source, []);
    successors.get(e.source).push(e.target);
  }
  const visited = new Set();
  const stack = [target];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === source) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of (successors.get(node) || [])) stack.push(next);
  }
  return false;
}

/** 연결 삭제 시 instruction 등에서 해당 블록의 @멘션 문자열 제거 */
function stripMentionPatternsForLabel(text, sourceLabel) {
  if (typeof text !== "string" || !text || !sourceLabel) return text;
  const escaped = sourceLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`@${escaped}(?:\\.[\\w\\u3131-\\uD79D\\[\\]]+)*`, "g");
  return text.replace(re, "").replace(/\n{3,}/g, "\n\n");
}

/** 엣지 배열에서 순환을 만드는 엣지를 제거 (위상정렬 순서 유지) */
function removeCyclicEdges(edges) {
  const clean = [];
  for (const edge of edges) {
    if (wouldCreateCycle(edge.source, edge.target, clean)) {
      console.warn(`[loadFlow] 순환 엣지 자동 제거: ${edge.source} → ${edge.target}`);
    } else {
      clean.push(edge);
    }
  }
  return clean;
}

/** 연결 자체가 의미 없는 엣지인지 검사 */
function isInvalidConnection(params, nodeMap) {
  const srcNode = nodeMap.get(params?.source);
  const tgtNode = nodeMap.get(params?.target);
  if (!srcNode || !tgtNode) return true;
  // output/finish는 터미널 노드라 source가 될 수 없다.
  if (["output", "finish"].includes(srcNode.type)) return true;
  // start는 시작 노드라 target이 될 수 없다.
  if (srcNode.type === "start" && tgtNode.type === "start") return true;
  if (tgtNode.type === "start") return true;
  // 자기 자신으로의 연결은 금지
  if (srcNode.id === tgtNode.id) return true;
  return false;
}

/* ── ReactFlow 상수 (컴포넌트 밖에서 정의 → 리렌더 시 재생성 방지) ── */

/**
 * NODE_TYPES: ReactFlow 에 등록할 노드 타입 → 컴포넌트 매핑
 *
 * 새 노드 타입 추가 시 여기에도 등록 필요.
 * (nodeConstants.jsx 의 NODE_INFO 및 RightPanel/panelRegistry.js 도 함께 업데이트)
 */
const NODE_TYPES = {
  start:          StartNode,
  userInput:      UserInputNode,
  llmInstruction: LLMInstructionNode,
  setVariable:    SetVariableNode,
  code:           CodeNode,
  output:         OutputNode,
  finish:         OutputNode, // 구버전 저장 플로우 하위 호환
};

/** 엣지 스타일 — 실선 */
const EDGE_STYLE = {
  stroke: "#6366f1",
  strokeWidth: 2,
};

/** Output/finish: RF 래퍼(.react-flow__node) 너비를 명시해 선택 박스·핸들과 카드 시각을 맞춘다. */
const OUTPUT_NODE_WIDTH = 260;

/**
 * 저장본·API에 실수로 포함된 RF 런타임 필드 제거 + output 너비 고정
 */
function normalizeNodesForEditor(rawNodes) {
  return rawNodes.map((n) => {
    const {
      width: _w,
      height: _h,
      measured: _m,
      selected: _sel,
      dragging: _drag,
      resizing: _res,
      ...rest
    } = n;
    if (rest.type === "output" || rest.type === "finish") {
      return { ...rest, width: OUTPUT_NODE_WIDTH };
    }
    return { ...rest };
  });
}

/** 노드 타입별 @멘션 참조 필드 정의 */
const MENTION_FIELDS_BY_TYPE = {
  userInput: ["prompt"],
  llmInstruction: ["instruction", "systemPrompt"],
  setVariable: ["value"],
  code: ["code"],
  output: ["template"],
  finish: ["template"],
};

const INITIAL_NODES = [
  {
    id: "start",
    type: "start",
    position: { x: 250, y: 80 },
    data: {},
    deletable: false,
  },
  {
    id: "output",
    type: "output",
    position: { x: 250, y: 350 },
    data: { template: "" },
    deletable: false,
    width: OUTPUT_NODE_WIDTH,
  },
];

const INITIAL_EDGES = [
  {
    id: "e-start-output",
    source: "start",
    target: "output",
    type: "smoothstep",
    style: EDGE_STYLE,
  },
];

/* ── 레거시 플로우 마이그레이션 ────────────────────────────── */
function convertLegacySteps(steps) {
  const xCenter = 250;
  const yGap    = 200;
  const newNodes = steps.map((step, i) => {
    const isOut = step.type === "finish" || step.type === "output";
    const type = step.type === "finish" ? "output" : step.type;
    const node = {
      id: i === 0 ? "start" : (isOut ? "output" : `node_${i}`),
      type,
      position: { x: xCenter, y: 80 + i * yGap },
      data: step.config || {},
      deletable:
        step.type !== "start" && step.type !== "finish" && step.type !== "output",
    };
    if (type === "output") node.width = OUTPUT_NODE_WIDTH;
    return node;
  });
  const newEdges = newNodes.slice(0, -1).map((n, i) => ({
    id: `e-${n.id}-${newNodes[i + 1].id}`,
    source: n.id,
    target: newNodes[i + 1].id,
    type: "smoothstep",
    style: EDGE_STYLE,
  }));
  return { nodes: newNodes, edges: newEdges };
}

/* ── 메인 컴포넌트 ──────────────────────────────────────────── */
export default function AgentBuilder() {
  const { flowId } = useParams();
  const navigate   = useNavigate();
  const rfInstance   = useRef(null);

  /* ── 플로우 메타데이터 ─────────────────────────────────── */
  const [flowName,        setFlowName]        = useState("");
  const [flowDescription, setFlowDescription] = useState("");
  const [currentFlowUuid, setCurrentFlowUuid] = useState(null);
  const [active,          setActive]          = useState(true);
  const [availableFlows,  setAvailableFlows]  = useState([]);

  /* IME(한국어 입력) 안전 필드 */
  const flowNameField = useLocalField(flowName, setFlowName);
  const flowDescField = useLocalField(flowDescription, setFlowDescription);

  /* ── UI 상태 ───────────────────────────────────────────── */
  const [mode,           setMode]           = useState("editor"); // "editor" | "app"
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [clipboard,      setClipboard]      = useState([]);
  const [panelWidth,     setPanelWidth]     = useState(360); // RightPanel 너비 (공유 상태)
  const prevPanelWidth = useRef(360); // 뷰포트 보정용 이전 패널 너비
  const [rightPanelTab, setRightPanelTab]   = useState("step"); // RightPanel 탭 (app 모드 연동)

  /* ── ReactFlow 상태 ────────────────────────────────────── */
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(INITIAL_EDGES);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  /** Output 노드는 dimensions 측정이 좁게 잡히는 경우가 있어 너비를 고정 유지 */
  const handleNodesChange = useCallback(
    (changes) => {
      const next = changes.map((ch) => {
        if (ch.type !== "dimensions" || !ch.dimensions) return ch;
        const n = nodesRef.current.find((x) => x.id === ch.id);
        if (!n || (n.type !== "output" && n.type !== "finish")) return ch;
        return {
          ...ch,
          dimensions: { ...ch.dimensions, width: OUTPUT_NODE_WIDTH },
        };
      });
      onNodesChange(next);
    },
    [onNodesChange]
  );

  /* ── 초기 로드 ─────────────────────────────────────────── */
  useEffect(() => { loadAvailableFlows(); }, []);
  useEffect(() => { if (flowId) loadFlow(flowId); }, [flowId]);

  /* ── app 모드 전환 시 Preview 탭 자동 선택 ───────────── */
  useEffect(() => {
    if (mode === "app") setRightPanelTab("preview");
  }, [mode]);

  /* ── 패널 리사이즈 시 뷰포트 보정 ────────────────────── */
  // 패널 너비가 변하면 에디터 영역이 줄거나 늘어남
  // 노드가 시각적으로 중앙을 유지하도록 뷰포트 x 를 보정
  useEffect(() => {
    const delta = panelWidth - prevPanelWidth.current;
    prevPanelWidth.current = panelWidth;
    if (delta !== 0 && rfInstance.current) {
      const { x, y, zoom } = rfInstance.current.getViewport();
      rfInstance.current.setViewport({ x: x - delta / 2, y, zoom });
    }
  }, [panelWidth]);


  /* ── Ctrl+C / Ctrl+V 복붙 ─────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // input/textarea 포커스 중에는 기본 동작 유지
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!(e.ctrlKey || e.metaKey)) return;

      if (e.key === "c") {
        const selected = nodes.filter(
          (n) => n.selected && n.type !== "start" && n.type !== "finish" && n.type !== "output"
        );
        if (selected.length > 0) setClipboard(selected);
      }

      if (e.key === "v" && clipboard.length > 0) {
        e.preventDefault();
        const now = Date.now();
        const newNodes = clipboard.map((n, i) => ({
          ...n,
          id: `${n.type}_${now + i}`,
          position: { x: n.position.x + 30, y: n.position.y + 30 },
          selected: true,
        }));
        setNodes((prev) => [
          ...prev.map((n) => ({ ...n, selected: false })),
          ...newNodes,
        ]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, clipboard, setNodes]);

  /* ── API 호출 ──────────────────────────────────────────── */
  const loadAvailableFlows = async () => {
    try {
      const { success, error, flows } = await AgentFlows.listFlows();
      if (!success) throw new Error(error);
      setAvailableFlows(flows);
    } catch {
      showToast("플로우 목록을 불러오지 못했습니다", "error", { clear: true });
    }
  };

  const loadFlow = async (uuid) => {
    try {
      const { success, error, flow } = await AgentFlows.getFlow(uuid);
      if (!success) throw new Error(error);
      setFlowName(flow.config.name || "");
      setFlowDescription(flow.config.description || "");
      setActive(flow.config.active ?? true);
      setCurrentFlowUuid(flow.uuid);

      const cfg = flow.config;
      if (Array.isArray(cfg.nodes) && Array.isArray(cfg.edges)) {
        // 구버전 finish 노드 → output 마이그레이션
        const migratedNodes = cfg.nodes.map((n) =>
          n.type === "finish"
            ? { ...n, type: "output", data: { template: "", ...n.data } }
            : n
        );
        setNodes(normalizeNodesForEditor(migratedNodes));

        // 무효 엣지 제거: source handle이 없는 노드(start, output/finish)에서 나가는 엣지,
        // target handle이 없는 노드에서 들어오는 엣지, 존재하지 않는 노드 참조 등
        const nodeMap = new Map(migratedNodes.map((n) => [n.id, n]));
        const noSourceTypes = new Set(["output", "finish"]); // source handle 없는 타입
        const validEdges = cfg.edges.filter((e) => {
          const srcNode = nodeMap.get(e.source);
          const tgtNode = nodeMap.get(e.target);
          if (!srcNode || !tgtNode) return false; // 존재하지 않는 노드
          if (noSourceTypes.has(srcNode.type)) return false; // output에서 나가는 엣지 무효
          return true;
        });
        // 순환 엣지 추가 제거
        const sanitized = removeCyclicEdges(validEdges);
        setEdges(sanitized.map((e) => ({
          ...e,
          style: EDGE_STYLE,
        })));
      } else if (Array.isArray(cfg.steps)) {
        const converted = convertLegacySteps(cfg.steps);
        setNodes(normalizeNodesForEditor(converted.nodes));
        setEdges(converted.edges);
      }
    } catch {
        showToast("플로우를 불러오지 못했습니다", "error", { clear: true });
    }
  };

  const saveFlow = async () => {
    if (!flowName.trim()) {
        showToast("플로우 이름을 입력해주세요", "error", { clear: true });
      return;
    }
    if (!flowDescription.trim()) {
      showToast("플로우 설명을 입력해주세요", "error", { clear: true });
      return;
    }
    try {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const validEdges = edges.filter((e) => {
        const srcNode = nodeMap.get(e.source);
        const tgtNode = nodeMap.get(e.target);
        if (!srcNode || !tgtNode) return false;
        if (["output", "finish"].includes(srcNode.type)) return false;
        if (tgtNode.type === "start") return false;
        return true;
      });
      const sanitizedEdges = removeCyclicEdges(validEdges);

      const flowConfig = {
        name: flowName,
        description: flowDescription,
        active,
        nodes: nodes.map((n) => ({
          id: n.id, type: n.type, position: n.position, data: n.data,
        })),
        edges: sanitizedEdges.map((e) => ({
          id: e.id, source: e.source, target: e.target,
          type: e.type || "smoothstep",
        })),
      };
      const { success, error, flow } = await AgentFlows.saveFlow(
        flowName, flowConfig, currentFlowUuid
      );
      if (!success) throw new Error(error);
      setCurrentFlowUuid(flow.uuid);
      showToast("플로우가 저장되었습니다", "success", { clear: true });
      await loadAvailableFlows();
    } catch (err) {
      showToast(`저장 실패: ${err.message}`, "error", { clear: true });
    }
  };

  const clearFlow = () => {
    if (flowId) navigate(paths.agents.builder());
    setFlowName("");
    setFlowDescription("");
    setCurrentFlowUuid(null);
    setActive(true);
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNodeId(null);
  };

  /* ── FlowContext 콜백 ──────────────────────────────────── */

  // 각 target 노드에 대해 "이전 시점에 @로 참조되던 source 노드 집합"을 저장
  // (이를 기반으로 @ 삭제 시 해당 의존 엣지만 제거)
  const mentionSourcesRef = useRef(new Map()); // Map<targetNodeId, Set<sourceNodeId>>

  /** 노드 데이터에서 @멘션으로 참조 중인 source nodeId 집합 계산 */
  const getMentionSourceIds = useCallback((nodeType, nodeData) => {
    const fields = MENTION_FIELDS_BY_TYPE[nodeType] || [];
    if (fields.length === 0) return new Set();
    const texts = fields
      .map((field) => (typeof nodeData?.[field] === "string" ? nodeData[field] : ""))
      .filter(Boolean);
    if (texts.length === 0) return new Set();
    const mentionableNodes = nodes
      .filter((n) => n.type !== "finish")
      .map((n) => ({
        nodeId: n.id,
        label: n.data?.title?.trim() || NODE_INFO[n.type]?.label || n.type,
      }));
    // @블록명 또는 @블록명.속성 패턴 모두 감지 (긴 레이블 우선)
    const sortedNodes = [...mentionableNodes].sort((a, b) => b.label.length - a.label.length);
    return new Set(
      sortedNodes
        .filter((m) => {
          const escaped = m.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(`@${escaped}(?:\\.[\\w\\u3131-\\uD79D\\[\\]]+)*`, "g");
          return texts.some((text) => re.test(text));
        })
        .map((m) => m.nodeId)
    );
  }, [nodes]);

  // 로드된 플로우 초기 상태에서도 "@로 참조되던 의존 엣지" 제거/유지를 위해
  // mentionSourcesRef를 먼저 프리셋으로 채운다.
  useEffect(() => {
    const next = new Map();
    for (const n of nodes) {
      next.set(n.id, getMentionSourceIds(n.type, n.data));
    }
    mentionSourcesRef.current = next;
  }, [nodes, getMentionSourceIds]);

  /** target 노드의 @멘션 의존 엣지를 현재 @멘션 상태와 동기화 */
  const syncMentionEdgesForNode = useCallback((targetNodeId, targetNodeType, targetNodeData) => {
    const desiredSources = getMentionSourceIds(targetNodeType, targetNodeData);
    const prevSources = mentionSourcesRef.current.get(targetNodeId) || new Set();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    setEdges((prevEdges) => {
      // 1) @에서 빠진 source 의존 엣지 제거
      let nextEdges = prevEdges.filter((e) => {
        if (e.target !== targetNodeId) return true;
        // prev엔 @로 참조되던 source인데 현재 @에서 빠졌다면 제거
        if (prevSources.has(e.source) && !desiredSources.has(e.source)) return false;
        return true;
      });

      // 2) 새롭게 @에 들어온 source 의존 엣지 추가
      for (const sourceNodeId of desiredSources) {
        if (prevSources.has(sourceNodeId)) continue; // 이미 prev에선 @로 참조되던 것
        const connection = { source: sourceNodeId, target: targetNodeId };
        if (isInvalidConnection(connection, nodeMap)) continue;
        if (nextEdges.some((e) => e.source === sourceNodeId && e.target === targetNodeId)) continue;
        if (wouldCreateCycle(sourceNodeId, targetNodeId, nextEdges)) continue;
        nextEdges = addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: EDGE_STYLE,
            data: { autoMention: true },
          },
          nextEdges
        );
      }

      return nextEdges;
    });

    // 3) 다음 sync를 위해 reference 업데이트
    mentionSourcesRef.current = new Map(mentionSourcesRef.current).set(
      targetNodeId,
      new Set(desiredSources)
    );
  }, [getMentionSourceIds, nodes, setEdges]);

  /** 노드 data 업데이트 (변수 삭제 시 연쇄 정리 포함) */
  const onDataChange = useCallback((nodeId, newData) => {
    if (newData._deleteVar) {
      const varName = newData._deleteVar;
      setNodes((prev) => prev.map((n) => {
        if (n.id === nodeId) return n;
        const data = { ...n.data };
        if (data.responseVariable === varName) data.responseVariable = "";
        if (data.resultVariable   === varName) data.resultVariable   = "";
        if (data.variableName     === varName) data.variableName     = "";
        if (data.outputVariable   === varName) data.outputVariable   = "";
        return { ...n, data };
      }));
      return;
    }
    const targetNode = nodes.find((n) => n.id === nodeId);
    const mergedData = { ...(targetNode?.data || {}), ...newData };
    const targetType = targetNode?.type;
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, data: mergedData } : n
    ));
    if (targetType) {
      syncMentionEdgesForNode(nodeId, targetType, mergedData);
    }
  }, [setNodes, nodes, syncMentionEdgesForNode]);

  /** 노드 삭제 (연결된 엣지도 함께 제거) */
  const onDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId((prev) => prev === nodeId ? null : prev);
  }, [setNodes, setEdges]);

  /** @멘션 선택 시 source(멘션된 노드) -> target(현재 편집 노드) 자동 연결 */
  const onMentionUsed = useCallback((targetNodeId, sourceNodeId) => {
    if (!targetNodeId || !sourceNodeId || targetNodeId === sourceNodeId) return;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const connection = { source: sourceNodeId, target: targetNodeId };
    if (isInvalidConnection(connection, nodeMap)) return;
    const hasExistingEdge = edgesRef.current.some(
      (e) => e.source === sourceNodeId && e.target === targetNodeId
    );
    if (hasExistingEdge) return;
    if (wouldCreateCycle(sourceNodeId, targetNodeId, edgesRef.current)) return;
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
          style: EDGE_STYLE,
          data: { autoMention: true },
        },
        eds
      )
    );
  }, [nodes, setEdges]);

  /* ── 변수·멘션 수집 (메모이제이션) ────────────────────── */

  /** 모든 노드의 결과 변수명 목록 */
  const availableVariables = useMemo(() => {
    const names = new Set();
    nodes.forEach((n) => {
      if (n.type === "userInput")      names.add(autoVarName(n.id));
      if (n.data?.resultVariable)      names.add(n.data.resultVariable);
      if (n.data?.responseVariable)    names.add(n.data.responseVariable);
      if (n.data?.variableName)        names.add(n.data.variableName);
    });
    return [...names].filter(Boolean).map((name) => ({ name }));
  }, [nodes]);

  /** @블록명 자동완성·하이라이트용 (Start/Output 포함 — HighlightTextarea 정규식에 필요) */
  const availableMentions = useMemo(() => {
    return nodes
      .filter((n) => n.type !== "finish")
      .flatMap((n) => {
        const label = n.data?.title?.trim() || NODE_INFO[n.type]?.label || n.type;
        if (n.type === "start")
          return [{ label, varName: "__start__", nodeId: n.id }];
        if (n.type === "output")
          return [{ label, varName: "output", nodeId: n.id }];
        if (n.type === "userInput")
          return [{ label, varName: autoVarName(n.id), nodeId: n.id }];
        if (n.type === "llmInstruction")
          return [{ label, varName: n.data?.resultVariable || autoLlmVarName(n.id), nodeId: n.id }];
        if (n.type === "code") {
          // Code 노드: outputKeys가 지정되어 있으면 subProps로 전달
          const subProps = Array.isArray(n.data?.outputKeys) && n.data.outputKeys.length > 0
            ? n.data.outputKeys.filter(Boolean)
            : [];
          return [{ label, varName: n.data?.resultVariable || autoCodeVarName(n.id), nodeId: n.id, subProps }];
        }
        if (n.data?.variableName)
          return [{ label, varName: n.data.variableName, nodeId: n.id }];
        return [];
      });
  }, [nodes]);

  /** FlowContext 값 (메모이제이션으로 불필요한 리렌더 방지) */
  const flowContextValue = useMemo(
    () => ({
      availableVariables,
      availableMentions,
      onDataChange,
      onDeleteNode,
      onMentionUsed,
      nodes,
      selectedNodeId,
      onSelectNode: setSelectedNodeId,
    }),
    [availableVariables, availableMentions, onDataChange, onDeleteNode, onMentionUsed, nodes, selectedNodeId]
  );

  /* ── ReactFlow 이벤트 ──────────────────────────────────── */

  // edges 최신 값을 항상 참조하는 ref (stale closure 방지)
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  /** 엣지 삭제 시 해당 연결로 자동 삽입된 @블록명을 텍스트에서 제거 */
  const handleEdgesChange = useCallback(
    (changes) => {
      const removeIds = changes
        .filter((c) => c.type === "remove")
        .map((c) => c.id);
      const removedEdges =
        removeIds.length > 0
          ? edgesRef.current.filter((e) => removeIds.includes(e.id))
          : [];
      onEdgesChangeInternal(changes);
      if (!removedEdges.length) return;

      const targetsToSync = [];
      setNodes((prev) => {
        let next = prev;
        for (const edge of removedEdges) {
          const targetNode = next.find((n) => n.id === edge.target);
          const sourceNode = next.find((n) => n.id === edge.source);
          if (!targetNode || !sourceNode) continue;
          const sourceLabel =
            sourceNode.data?.title?.trim() ||
            NODE_INFO[sourceNode.type]?.label ||
            sourceNode.type;
          const fields = MENTION_FIELDS_BY_TYPE[targetNode.type] || [];
          const updates = {};
          for (const f of fields) {
            const t = targetNode.data?.[f];
            if (typeof t !== "string") continue;
            const stripped = stripMentionPatternsForLabel(t, sourceLabel);
            if (stripped !== t) updates[f] = stripped;
          }
          if (Object.keys(updates).length === 0) continue;
          const mergedNode = {
            ...targetNode,
            data: { ...targetNode.data, ...updates },
          };
          next = next.map((n) => (n.id === edge.target ? mergedNode : n));
          targetsToSync.push({ targetId: edge.target, mergedNode });
        }
        return next;
      });
      targetsToSync.forEach(({ targetId, mergedNode }) => {
        syncMentionEdgesForNode(targetId, mergedNode.type, mergedNode.data);
      });
    },
    [onEdgesChangeInternal, setNodes, syncMentionEdgesForNode]
  );

  /** 노드 연결 — 순환 엣지 방지 */
  const onConnect = useCallback(
    (params) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      if (isInvalidConnection(params, nodeMap)) {
        showToast("유효하지 않은 연결입니다", "error", { clear: true });
        return;
      }
      if (wouldCreateCycle(params.source, params.target, edgesRef.current)) {
        showToast("순환 연결은 허용되지 않습니다", "error", { clear: true });
        return;
      }
      setEdges((eds) => addEdge({ ...params, type: "smoothstep", style: EDGE_STYLE }, eds));

      // 연결 시 target이 LLM/Code 노드이면 source의 @mention을 자동 삽입
      const targetNode = nodeMap.get(params.target);
      const sourceNode = nodeMap.get(params.source);
      if (targetNode && sourceNode) {
        const acceptsMention = NODE_TYPES_WITH_EDGE_MENTION_INSERT.includes(
          targetNode.type
        );
        const sourceLabel = sourceNode.data?.title?.trim() || NODE_INFO[sourceNode.type]?.label;
        if (acceptsMention && sourceLabel) {
          const fieldKey = targetNode.type === "llmInstruction" ? "instruction" : "code";
          const currentText = targetNode.data?.[fieldKey] || "";
          const mentionTag = `@${sourceLabel}`;
          // 이미 포함되어 있으면 중복 삽입하지 않음
          if (!currentText.includes(mentionTag)) {
            const separator = currentText && !currentText.endsWith("\n") ? "\n" : "";
            onDataChange(params.target, {
              [fieldKey]: currentText + separator + mentionTag,
            });
          }
        }
      }
    },
    [setEdges, nodes, onDataChange]
  );

  /** 엣지 재연결 — 순환 엣지 방지 */
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      if (isInvalidConnection(newConnection, nodeMap)) {
        showToast("유효하지 않은 연결입니다", "error", { clear: true });
        return;
      }
      const without = edgesRef.current.filter((e) => e.id !== oldEdge.id);
      if (wouldCreateCycle(newConnection.source, newConnection.target, without)) {
        showToast("순환 연결은 허용되지 않습니다", "error", { clear: true });
        return;
      }
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges, nodes]
  );

  /** 드래그 오버 */
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  /** 드롭 — 사이드바/툴바에서 캔버스로 노드 추가 */
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow");
    if (!type || !rfInstance.current) return;
    const position = rfInstance.current.screenToFlowPosition({
      x: e.clientX, y: e.clientY,
    });
    const info = NODE_INFO[type];
    setNodes((nds) => [
      ...nds,
      {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { ...(info?.defaultData || {}) },
        deletable: true,
      },
    ]);
  }, [setNodes]);

  /**
   * TopToolbar 버튼 클릭 — 캔버스 중앙에 노드 추가
   *
   * @param {string} type        노드 타입 (nodeConstants 키)
   * @param {object} defaultData 추가 초기 data (Generate 드롭다운에서 모델 프리셋 전달)
   *                             NODE_INFO.defaultData 와 merge 됨
   */
  const onAddNode = useCallback((type, defaultData = {}) => {
    const info = NODE_INFO[type];
    const position = rfInstance.current
      ? rfInstance.current.screenToFlowPosition({
          x: window.innerWidth  / 2,
          y: window.innerHeight / 2,
        })
      : { x: 400, y: 300 };
    const id = `${type}_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type,
        position,
        data: { ...(info?.defaultData || {}), ...defaultData },
        deletable: true,
      },
    ]);
    // 추가 즉시 선택 → Step 탭에서 바로 편집
    setSelectedNodeId(id);
    setRightPanelTab("step");
  }, [setNodes]);

  /**
   * ReactFlow 선택 변경 — 단일 선택 시 selectedNodeId 업데이트 + Step 탭으로 전환(미리보기/콘솔 등 어디서든 편집 가능)
   */
  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
      setRightPanelTab("step");
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  /* ── 엣지 렌더 (선택 시 강조) ─────────────────────────── */
  const renderedEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        style: e.selected
          ? { stroke: "#a5b4fc", strokeWidth: 3 }
          : EDGE_STYLE,
        animated: e.selected ?? false,
        reconnectable: true,
      })),
    [edges]
  );

  /* ── 렌더 ──────────────────────────────────────────────── */
  return (
    <FlowContext.Provider value={flowContextValue}>
      <div className="relative w-screen h-screen flex flex-col bg-theme-bg-primary overflow-hidden">

        {/* ── 헤더 바 ─────────────────────────────────────── */}
        <div className="shrink-0 h-[60px] bg-theme-bg-secondary border-b border-white/10 light:border-black/10 flex items-center px-4 z-20">
          <HeaderMenu
            flowName={flowName}
            flowDescription={flowDescription}
            flowNameField={flowNameField}
            flowDescField={flowDescField}
            availableFlows={availableFlows}
            onNewFlow={clearFlow}
            onSaveFlow={saveFlow}
            mode={mode}
            onModeChange={setMode}
          />
        </div>

        {/* ── 콘텐츠 영역 ─────────────────────────────────── */}
        {/* app 모드: 캔버스 숨기고 RightPanel 전체 너비 (AppView 단일 인스턴스) */}
        {/* editor 모드: 캔버스 + RightPanel 사이드바                            */}
        <div className="flex-1 min-h-0 relative">
          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              /* app 모드: 캔버스를 마운트하지 않음(단일 열 1fr). display:none 자식은 그리드에서 빠져
                 우측 패널만 남으면 첫 열(0px)에 붙어 너비 0 → 흰 화면이 되므로 이렇게 분기한다. */
              gridTemplateColumns:
                mode === "app" ? "1fr" : `1fr ${panelWidth}px`,
              gridTemplateRows: "1fr",
            }}
          >
            {/* 캔버스 셀 — editor 모드에서만 마운트 (app에서는 그리드가 1열이라 미렌더) */}
            {mode !== "app" && (
            <div
              className="relative w-full h-full overflow-hidden"
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              {/* 중앙 상단 툴바 오버레이 */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="pointer-events-auto">
                  <TopToolbar onAddNode={onAddNode} />
                </div>
              </div>
              <ReactFlow
                nodes={nodes}
                edges={renderedEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                onSelectionChange={onSelectionChange}
                /* Loose는 다른 노드끼리 source→source도 허용되어, 가까운 핸들(아래 source)로 미리보기가 붙는다. Strict는 target만 끝점으로 인정 */
                connectionMode={ConnectionMode.Strict}
                onInit={(instance) => { rfInstance.current = instance; }}
                nodeTypes={NODE_TYPES}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                deleteKeyCode={["Backspace", "Delete"]}
                className="bg-transparent"
                defaultEdgeOptions={{ type: "smoothstep", style: EDGE_STYLE }}
                connectionLineStyle={EDGE_STYLE}
                selectionOnDrag
                panOnDrag={[1]}
                selectionMode="partial"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={15}
                  size={1}
                  color="rgba(255,255,255,0.08)"
                />
                <Controls
                  className="!bg-theme-action-menu-bg !border !border-white/10 !rounded-xl !shadow-md"
                  showInteractive={false}
                />
              </ReactFlow>
            </div>
            )}

            {/* 패널 셀 — AppView 단일 인스턴스 유지 */}
            <RightPanel
              flowUuid={currentFlowUuid}
              flowName={flowName}
              width={panelWidth}
              onWidthChange={setPanelWidth}
              activeTab={rightPanelTab}
              onTabChange={setRightPanelTab}
              appMode={mode === "app"}
            />
          </div>
        </div>

      </div>
    </FlowContext.Provider>
  );
}
