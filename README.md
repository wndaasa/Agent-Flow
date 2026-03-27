# Agent Flow

> Google [OPAL](https://developers.google.com/opal) inspired no-code agent builder — 노드를 캔버스에 연결하는 것만으로 LLM 기반 에이전트 플로우를 설계하고 실행할 수 있습니다.

## 개요

Agent Flow는 노코드 방식의 AI 에이전트 빌더입니다. Start → LLM Instruction → Code → Output 등의 블록을 드래그 앤 드롭으로 연결해 에이전트 워크플로우를 정의하고, 서버에서 실행·스트리밍합니다.

**핵심 기술 스택**

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Vite + React 18, `@xyflow/react`, Tailwind CSS |
| 백엔드 | Express, Prisma, SQLite |
| LLM | OpenAI / Anthropic 호환 |

## 프로젝트 구조

```
agent-flow/
├── package.json          # 루트 스크립트 (concurrently로 server+web 동시 실행)
├── server/
│   ├── index.js          # Express 진입점
│   ├── prisma/           # Prisma 스키마·마이그레이션
│   ├── routes/           # REST 라우트 (CRUD, 플로우 실행)
│   └── lib/
│       └── agentFlows/   # 플로우 실행 엔진, LLM 어댑터
└── web/
    ├── vite.config.js
    └── src/
        └── AgentBuilder/ # 플로우 빌더 UI (노드, 패널, 툴바)
```

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

루트의 `postinstall`로 `server/`, `web/` 의존성이 함께 설치됩니다.

### 2. 환경 변수 설정

```bash
cp server/.env.example server/.env
```

`server/.env` 에서 필수 항목을 입력합니다.

```env
DATABASE_URL="file:./data/agent-flow.db"
PORT=3001
LLM_PROVIDER=openai
OPEN_AI_KEY=sk-...
OPEN_AI_MODEL_PREF=gpt-4o
```

### 3. 데이터베이스 초기화 (최초 1회)

```bash
npm run prisma:migrate --prefix server
```

### 4. 개발 서버 실행

```bash
npm run dev
```

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:5175 |
| API | http://localhost:3001 |
| 헬스 체크 | GET /api/health |

## 지원 노드

| 노드 | 설명 |
|------|------|
| Start | 플로우 시작점, 초기 변수 정의 |
| User Input | 런타임에 사용자 입력 대기 |
| LLM Instruction | LLM 호출 및 응답 처리 |
| Code | 커스텀 JavaScript 코드 실행 |
| Set Variable | 변수 값 설정 |
| Output | 결과 출력 |
| File | 파일 입력 |
| Website / Web Scraping | URL 기반 웹 콘텐츠 수집 |

## 개발

```bash
# 서버만 실행
npm run dev --prefix server

# 프론트만 실행
npm run dev --prefix web

# 프론트 프로덕션 빌드
npm run build --prefix web
```

## 라이선스

Personal project — All rights reserved.
