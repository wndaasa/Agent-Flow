# Agent Flow

노드를 캔버스에 배치해 에이전트 플로우를 설계하고, 저장·실행할 수 있는 **노코드형 에이전트 빌더**입니다. React Flow(`@xyflow/react`) 기반 에디터와 Express API, SQLite(Prisma)로 구성되어 있습니다.

## 구성

| 디렉터리 | 역할 |
|----------|------|
| `web/` | Vite + React 18 프론트엔드 (플로우 에디터, 앱 미리보기 UI) |
| `server/` | Express API, Prisma, 플로우 CRUD·실행 라우트 |

루트 `package.json`은 두 패키지를 한 번에 설치·실행하도록 묶어 둡니다.

## 요구 사항

- **Node.js** 18+ 권장  
- **npm** (또는 호환 패키지 매니저)

## 빠른 시작

### 1. 의존성 설치

저장소 루트에서:

```bash
npm install
```

`postinstall`로 `server/`, `web/` 의존성이 함께 설치됩니다.

### 2. 서버 환경 변수

```bash
cp server/.env.example server/.env
```

`server/.env`에서 최소한 다음을 확인합니다.

- `DATABASE_URL` — SQLite 파일 경로 (기본 예시: `file:./data/agent-flow.db` 등, Prisma 설정과 일치해야 함)
- `PORT` — API 포트 (기본 `3001`)
- `OPEN_AI_KEY` — LLM 호출 시 필요 (로컬 개발·실행에 따라 설정)

### 3. 데이터베이스 마이그레이션 (최초 1회)

```bash
npm run prisma:migrate --prefix server
```

스키마는 `server/prisma/schema.prisma`를 참고합니다.

### 4. 개발 서버 실행

루트에서:

```bash
npm run dev
```

- **프론트엔드**: Vite 기본 포트 **5175** (`web/vite.config.js`)
- **API**: `http://localhost:3001` (환경 변수 `PORT`에 따름)  
  - 헬스 체크: `GET /api/health`

브라우저에서 프론트 URL로 접속해 빌더(`/builder` 등 라우트)를 사용합니다.

### 개별 실행

```bash
npm run dev --prefix server
npm run dev --prefix web
```

## 프로덕션 빌드 (프론트)

```bash
npm run build --prefix web
npm run preview --prefix web   # 로컬에서 빌드 결과 미리보기
```

API는 별도 배포/프로세스 관리가 필요합니다.

## 주요 기능 (요약)

- **플로우 에디터**: Start, User Input, LLM Instruction, Code, Output 등 블록을 연결해 그래프 정의
- **저장**: SQLite에 플로우 정의(JSON) 영속화
- **실행**: 서버에서 플로우 실행·스트리밍 등 API 제공 (세부는 `server/routes/` 참고)
- **LLM**: OpenAI 등 설정은 `server/.env` 및 노드의 provider/model 옵션과 연동

## 프로젝트 구조 참고

```
agent-flow/
├── package.json          # 루트 스크립트 (concurrently로 server+web 동시 실행)
├── server/
│   ├── index.js          # Express 진입점
│   ├── prisma/           # Prisma 스키마·마이그레이션
│   ├── routes/           # REST 라우트
│   └── lib/              # 플로우 실행·도메인 로직
└── web/
    ├── vite.config.js
    └── src/
        ├── AgentBuilder/ # 플로우 빌더 UI
        └── ...
```

## 라이선스

이 저장소에 `LICENSE`가 없다면 내부/개인 프로젝트 정책에 맞게 추가하세요.
