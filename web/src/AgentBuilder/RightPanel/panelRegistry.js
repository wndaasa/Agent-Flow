/**
 * panelRegistry: 노드 타입 → 우측 패널 컴포넌트 매핑
 *
 * ── 새 노드 타입 추가 방법 ──────────────────────────────────
 * 1. panels/ 에 새 Panel 컴포넌트 생성
 * 2. 여기에 { nodeType: PanelComponent } 항목 추가
 * 3. nodeConstants.jsx 의 NODE_INFO 에 메타데이터 추가
 * 4. index.jsx 의 NODE_TYPES 에 등록
 */
import StartPanel from "../panels/StartPanel";
import UserInputPanel from "../panels/UserInputPanel";
import LLMInstructionPanel from "../panels/LLMInstructionPanel";
import SetVariablePanel from "../panels/SetVariablePanel";
import CodePanel from "../panels/CodePanel";
import OutputPanel from "../panels/OutputPanel";

export const PANEL_REGISTRY = {
  start: StartPanel,
  userInput: UserInputPanel,
  llmInstruction: LLMInstructionPanel,
  setVariable: SetVariablePanel,
  code: CodePanel,
  output: OutputPanel,
  finish: OutputPanel, // 하위 호환 (구버전 플로우)
};
