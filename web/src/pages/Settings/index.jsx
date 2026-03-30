import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeSlash,
  FloppyDisk,
  CheckCircle,
  GithubLogo,
} from "@phosphor-icons/react";
import Settings from "@/models/settings";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";

const PAGE_BG    = "#13151c";
const CARD_BG    = "#1a1d27";
const BORDER     = "rgba(255,255,255,0.07)";
const TEXT_PRI   = "#e8eaf0";
const TEXT_SEC   = "#7b7f8e";
const TEXT_MUTED = "#4a4f5c";
const INDIGO     = "#6366f1";

const PROVIDERS = [
  { value: "openai",    label: "OpenAI"    },
  { value: "anthropic", label: "Anthropic" },
  { value: "ollama",    label: "Ollama (로컬)" },
];

const OPENAI_MODELS    = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
const ANTHROPIC_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-4 h-4" style={{ color: INDIGO }} weight="fill" />
        <h2 className="text-sm font-semibold" style={{ color: TEXT_PRI }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: TEXT_SEC }}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${BORDER}`,
        color: TEXT_PRI,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
      style={{
        background: "#1a1d27",
        border: `1px solid ${BORDER}`,
        color: TEXT_PRI,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      {options.map(({ value: v, label }) => (
        <option key={v} value={v} style={{ background: "#1a1d27" }}>{label}</option>
      ))}
    </select>
  );
}

function ApiKeyInput({ value, onChange, placeholder, isSet }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleFocus = () => {
    if (!editing) {
      setEditing(true);
      onChange("");
    }
  };

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={editing ? value : (isSet ? value : "")}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={isSet && !editing ? "설정됨 (변경하려면 클릭)" : placeholder}
        autoComplete="new-password"
        spellCheck={false}
        className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${isSet && !editing ? "rgba(16,185,129,0.3)" : BORDER}`,
          color: TEXT_PRI,
        }}
        onFocus={(e) => {
          handleFocus();
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
        }}
        onBlur={(e) => (e.currentTarget.style.borderColor = isSet && !editing ? "rgba(16,185,129,0.3)" : BORDER)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: TEXT_MUTED }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_SEC)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
      >
        {show ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [provider, setProvider]           = useState("openai");
  const [openAiKey, setOpenAiKey]         = useState("");
  const [openAiKeySet, setOpenAiKeySet]   = useState(false);
  const [openAiModel, setOpenAiModel]     = useState("gpt-4o");
  const [anthropicKey, setAnthropicKey]   = useState("");
  const [anthropicKeySet, setAnthropicKeySet] = useState(false);
  const [ollamaUrl, setOllamaUrl]         = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel]     = useState("");

  useEffect(() => {
    Settings.get().then(({ settings }) => {
      if (!settings) return;
      setProvider(settings.llmProvider);
      setOpenAiKeySet(settings.openAiKeySet);
      setOpenAiKey(settings.openAiKeyMasked || "");
      setOpenAiModel(settings.openAiModel);
      setAnthropicKeySet(settings.anthropicKeySet);
      setAnthropicKey(settings.anthropicKeyMasked || "");
      setOllamaUrl(settings.ollamaBasePath);
      setOllamaModel(settings.ollamaModel);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      llmProvider:    provider,
      openAiModel,
      ollamaBasePath: ollamaUrl,
      ollamaModel,
    };
    // 실제로 새로 입력된 키만 전송 (마스킹 값은 제외)
    if (openAiKey && !openAiKey.includes("•")) payload.openAiKey = openAiKey;
    if (anthropicKey && !anthropicKey.includes("•")) payload.anthropicKey = anthropicKey;

    const res = await Settings.save(payload);
    setSaving(false);
    if (res.success) {
      showToast("설정이 저장되었습니다.", "success");
    } else {
      showToast("저장 실패: " + res.error, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: PAGE_BG }}>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: PAGE_BG }}>
      {/* 좌측 패널 */}
      <div
        className="w-52 shrink-0 flex flex-col h-full"
        style={{ background: "#0f1117", borderRight: `1px solid rgba(255,255,255,0.06)` }}
      >
        <div
          className="flex items-center gap-2.5 px-5 h-14 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: INDIGO }}
          >
            <Brain className="w-3.5 h-3.5 text-white" weight="bold" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: TEXT_PRI }}>
            Agent Flow
          </span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <button
            onClick={() => navigate(paths.home())}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-sm transition-all duration-150"
            style={{ color: TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = TEXT_SEC;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = TEXT_MUTED;
            }}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            홈으로
          </button>
        </nav>
      </div>

      {/* 메인 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 */}
        <header
          className="flex items-center justify-between px-8 h-14 shrink-0"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}
        >
          <h1 className="text-sm font-semibold" style={{ color: TEXT_PRI }}>설정</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: INDIGO,
              color: "#ffffff",
              boxShadow: "0 1px 8px rgba(99,102,241,0.5)",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#5254cc")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = INDIGO)}
          >
            <FloppyDisk className="w-3.5 h-3.5" weight="bold" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </header>

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* LLM 설정 */}
            <SectionCard title="LLM 설정" icon={Brain}>
              <div className="space-y-4">
                <Field label="Provider">
                  <SelectInput
                    value={provider}
                    onChange={setProvider}
                    options={PROVIDERS}
                  />
                </Field>

                {/* OpenAI */}
                {provider === "openai" && (
                  <>
                    <Field
                      label="OpenAI API Key"
                      hint="platform.openai.com에서 발급"
                    >
                      <ApiKeyInput
                        value={openAiKey}
                        onChange={setOpenAiKey}
                        placeholder="sk-..."
                        isSet={openAiKeySet}
                      />
                    </Field>
                    <Field label="모델">
                      <SelectInput
                        value={openAiModel}
                        onChange={setOpenAiModel}
                        options={OPENAI_MODELS.map((m) => ({ value: m, label: m }))}
                      />
                    </Field>
                  </>
                )}

                {/* Anthropic */}
                {provider === "anthropic" && (
                  <>
                    <Field
                      label="Anthropic API Key"
                      hint="console.anthropic.com에서 발급"
                    >
                      <ApiKeyInput
                        value={anthropicKey}
                        onChange={setAnthropicKey}
                        placeholder="sk-ant-..."
                        isSet={anthropicKeySet}
                      />
                    </Field>
                    <Field label="모델">
                      <SelectInput
                        value={openAiModel}
                        onChange={setOpenAiModel}
                        options={ANTHROPIC_MODELS.map((m) => ({ value: m, label: m }))}
                      />
                    </Field>
                  </>
                )}

                {/* Ollama */}
                {provider === "ollama" && (
                  <>
                    <Field
                      label="Ollama Base URL"
                      hint="Ollama 서버 주소 (기본: http://localhost:11434)"
                    >
                      <TextInput
                        value={ollamaUrl}
                        onChange={setOllamaUrl}
                        placeholder="http://localhost:11434"
                      />
                    </Field>
                    <Field
                      label="모델명"
                      hint="예: llama3, mistral, gemma2"
                    >
                      <TextInput
                        value={ollamaModel}
                        onChange={setOllamaModel}
                        placeholder="llama3"
                      />
                    </Field>
                  </>
                )}
              </div>
            </SectionCard>

            {/* 정보 */}
            <SectionCard title="정보" icon={CheckCircle}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: TEXT_SEC }}>버전</span>
                  <span className="text-xs font-mono" style={{ color: TEXT_MUTED }}>v0.2.0</span>
                </div>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <span className="text-xs" style={{ color: TEXT_SEC }}>GitHub</span>
                  <a
                    href="https://github.com/wndaasa/Agent-Flow"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: TEXT_MUTED }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRI)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
                  >
                    <GithubLogo className="w-3.5 h-3.5" />
                    wndaasa/Agent-Flow
                  </a>
                </div>
              </div>
            </SectionCard>

          </div>
        </main>
      </div>
    </div>
  );
}
