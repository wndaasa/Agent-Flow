# Agent Flow — CLAUDE.md

이 파일은 Claude가 이 프로젝트를 이해하고 작업하기 위한 컨텍스트 문서입니다.

**중요:** 작업 중 새로 알게 된 사실(경로, 컨벤션, 주의사항 등)이 생기면 즉시 이 파일을 업데이트한다. 다음 대화에서도 컨텍스트가 유지되도록 하는 것이 목적이다.

## 프로젝트 개요

Google OPAL을 레퍼런스로 만드는 **노코드 AI 에이전트 빌더**.
노드를 캔버스에 연결해 LLM 기반 워크플로우를 정의하고 서버에서 실행한다.

- GitHub: https://github.com/wndaasa/Agent-Flow
- 개발자: 솔로 개인 프로젝트

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Vite + React 18, `@xyflow/react`, Tailwind CSS, Phosphor Icons |
| 백엔드 | Express (Node.js), Prisma ORM, SQLite |
| LLM | OpenAI SDK (`openai` 패키지) — OpenAI / Anthropic / Ollama 호환 |

## 모노레포 구조

```
agent-flow/
├── package.json          # 루트 (concurrently로 server+web 동시 실행)
├── server/
│   ├── index.js          # Express 진입점
│   ├── db.js             # Prisma client 싱글턴
│   ├── prisma/
│   │   └── schema.prisma # 유일한 모델: agent_flows (id, uuid, name, config, active)
│   ├── routes/
│   │   ├── agentFlowsCrud.js   # CRUD API
│   │   └── agentFlowRun.js     # 플로우 실행 API (스트리밍)
│   └── lib/
│       ├── http.js             # 공통 HTTP 유틸 (safeJsonParse 등)
│       ├── models/telemetry.js # 텔레메트리
│       └── agentFlows/
│           ├── flowTypes.js        # 노드 타입 상수 정의 (FLOW_TYPES)
│           ├── executor.js         # FlowExecutor 클래스 (핵심 실행 엔진)
│           ├── streamExecutor.js   # SSE 스트리밍 래퍼
│           ├── autoVarNames.js     # 자동 변수명 생성 유틸 (서버/웹 동일 로직)
│           ├── constants.js        # 실행 관련 상수 (타임아웃, 파일 크기 등)
│           ├── llmOpenAiCompat.js  # OpenAI 호환 LLM 어댑터
│           ├── llmAnthropicCompat.js
│           ├── splitLlmReasoning.js
│           └── executors/          # 노드 타입별 실행 로직
│               ├── llm-instruction.js
│               ├── code.js
│               ├── api-call.js
│               ├── web-scraping.js
│               ├── user-input.js
│               └── set-variable.js
└── web/
    ├── vite.config.js    # 프록시: /api → localhost:3001
    └── src/
        ├── AgentBuilder/
        │   ├── index.jsx               # React Flow 캔버스 진입점, NODE_TYPES 등록
        │   ├── nodeConstants.jsx       # NODE_INFO, NODE_TYPES_MAP, DRAGGABLE_NODE_TYPES
        │   ├── BaseNode.jsx            # 모든 노드가 상속하는 공통 노드 컴포넌트
        │   ├── FlowContext.jsx         # 플로우 전역 상태 Context
        │   ├── RightPanel/
        │   │   ├── panelRegistry.js    # 노드 타입 → Panel 컴포넌트 매핑
        │   │   └── StepEditor.jsx
        │   ├── panels/                 # 노드별 우측 편집 패널
        │   ├── nodes/
        │   │   ├── createNodeComponent.jsx  # BaseNode 팩토리 함수
        │   │   ├── StartNode/          # 커스텀 UI (팩토리 미사용)
        │   │   ├── [기타 노드]/        # createNodeComponent(type) 한 줄
        │   │   └── _wip/              # 미등록 WIP 노드 (ApiCall, WebScraping 등)
        │   ├── utils/
        │   │   └── autoVarNames.js    # 자동 변수명 생성 유틸 (서버와 동일 로직)
        │   ├── components/
        │   │   └── MentionTextarea.jsx # @mention 텍스트에리어 공통 컴포넌트
        │   ├── AppView/                # 플로우 실행 뷰 (ConsoleLog 등)
        │   ├── TopToolbar/
        │   ├── HeaderMenu/
        │   └── AddBlockMenu/
        ├── models/
        │   └── agentFlows.js       # 프론트 API 클라이언트
        └── utils/
```

## 플로우 실행 모델

### 데이터 포맷
플로우는 DB에 JSON으로 저장된다. 두 가지 포맷 지원:
- **Graph 포맷** (현재): `{ nodes: [...], edges: [...] }` — React Flow 형식 그대로
- **Legacy 포맷** (하위 호환): `{ steps: [...] }` — 순차 배열

### FlowExecutor (`server/lib/agentFlows/executor.js`)
- `executeFlow()` → 포맷 자동 감지 후 분기
- `executeGraphFlow()` → 위상정렬(BFS)로 실행 레벨 계산, 같은 레벨은 `Promise.all` 병렬 실행
- `replaceVariables()` → `${varName}` 및 `@블록명` 패턴을 변수값으로 치환
- `getValueFromPath()` → dot notation + array index 경로 탐색 (`data.items[0].name` 형식)

### 변수 시스템
- Start 노드에서 초기화
- `${varName}` — 변수 직접 참조
- `@블록명` — 노드 title 기반 참조 (title이 없는 노드는 매핑 안 됨)
- `@블록명.path.to.field` — JSON 응답의 nested 값 참조

## 노드 타입 현황

| 노드 | type 문자열 | 위치 |
|------|------------|------|
| Start | `start` | 변수 초기화 |
| User Input | `userInput` | 런타임 사용자 입력 |
| LLM Instruction | `llmInstruction` | LLM 호출 |
| Set Variable | `setVariable` | 변수 설정·변환 |
| Code | `code` | JavaScript 실행 |
| Output | `output` | 최종 출력 (directOutput) |
| API Call | `apiCall` | HTTP 요청 (executor만 있음, 노드 UI 미완성) |
| Web Scraping | `webScraping` | 웹 콘텐츠 수집 (executor만 있음, 노드 UI 미완성) |

## 새 노드 추가 체크리스트

1. `server/lib/agentFlows/flowTypes.js` — `FLOW_TYPES`에 타입 상수 추가
2. `server/lib/agentFlows/executors/` — 실행 로직 파일 생성
3. `server/lib/agentFlows/executor.js` — `executeStep()` switch문에 케이스 추가
4. `web/src/AgentBuilder/nodeConstants.jsx` — `NODE_TYPES_MAP`, `NODE_INFO`에 추가
5. `web/src/AgentBuilder/panels/` — 우측 편집 패널 컴포넌트 생성
6. `web/src/AgentBuilder/RightPanel/panelRegistry.js` — 패널 등록
7. `web/src/AgentBuilder/index.jsx` — `NODE_TYPES`에 노드 컴포넌트 등록
8. (선택) `DRAGGABLE_NODE_TYPES`에 추가 — 툴바에 드래그 버튼 표시

## Git 관리

Claude가 git을 직접 관리한다. 아래 규칙을 따른다.

### 브랜치 구조

```
main    ← 안정 릴리즈만 (태그 붙임)
dev     ← 평소 작업 베이스
feat/   ← 큰 기능 작업 시 dev에서 분기 → dev로 머지
fix/    ← 버그 수정
chore/  ← 설정·의존성·리팩토링
```

### 커밋 타이밍
- 작업 단위가 완결되면 커밋한다 (파일 저장할 때마다 X, 기능/수정이 완성됐을 때 O)
- 사용자가 명시적으로 요청하지 않아도 작업 완료 후 커밋까지 처리한다
- 단, push는 항상 사용자에게 확인 후 진행한다

### 커밋 메시지 형식

```
<type>: <한국어 또는 영어 설명>
```

| type | 사용 시점 |
|------|----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `chore` | 설정·의존성·리팩토링·문서 |
| `style` | UI/CSS 변경 |
| `refactor` | 로직 변경 없는 코드 구조 개선 |

예시:
```
feat: API Call 노드 UI 추가
fix: LLM 스트리밍 중단 시 변수 누락 버그 수정
chore: CLAUDE.md git 관리 지침 추가
```

### 브랜치 운용
- 소소한 수정은 `dev`에 직접 커밋
- 한 세션에서 큰 기능을 만들 때는 `feat/기능명` 브랜치를 따서 작업 후 `dev`로 머지
- `main` 머지는 사용자가 "배포 가능 수준"이라고 판단할 때만, 반드시 버전 태그 붙이기

### 릴리즈 태그
- Semantic Versioning: `v주.부.수`
- 현재 버전: `v0.1.0` (초기 개발 중)
- main 머지 시: `git tag v0.x.x -m "설명"` + `git push origin v0.x.x`

## 환경 변수 (`server/.env`)

```env
DATABASE_URL="file:./data/agent-flow.db"
PORT=3001
LLM_PROVIDER=openai          # openai | anthropic | ollama
OPEN_AI_KEY=sk-...
OPEN_AI_MODEL_PREF=gpt-4o
```

## 도구 경로

bash 세션에서 PATH가 제한되므로 아래 툴은 풀 경로로 실행해야 함:

```bash
# GitHub CLI
"/c/Program Files/GitHub CLI/gh.exe" <command>
```

## 개발 명령어

```bash
npm install                          # 전체 의존성 설치 (server + web 포함)
npm run dev                          # server + web 동시 실행
npm run prisma:migrate --prefix server  # DB 마이그레이션 (스키마 변경 시)
npm run build --prefix web           # 프론트 프로덕션 빌드
```

- 프론트: http://localhost:5175
- API: http://localhost:3001
- 헬스체크: GET /api/health

## 공통 스타일 유틸 (web/src/index.css)

패널 UI에는 아래 Tailwind 유틸 클래스를 사용한다. 인라인 className 반복 금지.

| 클래스 | 용도 |
|--------|------|
| `panel-input` | 패널 내 text input / select 공통 스타일 |
| `panel-label` | 패널 내 label 공통 스타일 (`shrink-0` 등 레이아웃 클래스는 추가 가능) |

## 주의사항

- `server/node_modules`는 gitignore — `npm install` 필요
- Prisma 스키마 변경 시 `prisma:migrate` 재실행 필수
- `server/data/` 디렉토리 (SQLite DB 파일)는 gitignore
- Code 노드는 서버에서 `eval()` 방식으로 실행됨 — 보안 주의
- Legacy steps[] 포맷 플로우가 DB에 남아있을 수 있음 — 삭제 말것
