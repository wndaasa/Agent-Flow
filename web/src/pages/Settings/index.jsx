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
  PaintBrush,
} from "@phosphor-icons/react";
import Settings from "@/models/settings";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import { THEMES, getTheme, setTheme } from "@/utils/theme.js";

const PROVIDERS = [
  { value: "openai",    label: "OpenAI"    },
  { value: "anthropic", label: "Anthropic" },
  { value: "ollama",    label: "Ollama (로컬)" },
];

const OPENAI_MODELS    = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
const ANTHROPIC_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];

// ── 공통 카드 섹션 ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--af-card-bg)", border: "1px solid var(--af-border)" }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-4 h-4" style={{ color: "#6366f1" }} weight="fill" />
        <h2 className="text-sm font-semibold" style={{ color: "var(--af-text-primary)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── 필드 래퍼 ─────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--af-text-secondary)" }}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--af-text-muted)" }}>{hint}</p>}
    </div>
  );
}

// ── 텍스트 입력 ───────────────────────────────────────────────────────────────
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
        background: "var(--af-input-bg)",
        border: "1px solid var(--af-border-input)",
        color: "var(--af-text-primary)",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--af-border-input)")}
    />
  );
}

// ── 셀렉트 입력 ───────────────────────────────────────────────────────────────
function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
      style={{
        background: "var(--af-select-bg)",
        border: "1px solid var(--af-border-input)",
        color: "var(--af-text-primary)",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--af-border-input)")}
    >
      {options.map(({ value: v, label }) => (
        <option key={v} value={v} style={{ background: "var(--af-select-bg)" }}>{label}</option>
      ))}
    </select>
  );
}

// ── API 키 입력 ───────────────────────────────────────────────────────────────
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
        placeholder={isSet && !editing ? "설정됨 (변경하려면 클릭)" : placeholder}
        autoComplete="new-password"
        spellCheck={false}
        className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none transition-all"
        style={{
          background: "var(--af-input-bg)",
          border: `1px solid ${isSet && !editing ? "rgba(16,185,129,0.3)" : "var(--af-border-input)"}`,
          color: "var(--af-text-primary)",
        }}
        onFocus={(e) => {
          handleFocus();
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
        }}
        onBlur={(e) => (e.currentTarget.style.borderColor = isSet && !editing ? "rgba(16,185,129,0.3)" : "var(--af-border-input)")}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: "var(--af-text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--af-text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--af-text-muted)")}
      >
        {show ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── 테마 피커 ─────────────────────────────────────────────────────────────────
// THEMES 레지스트리를 순회하므로 새 테마 추가 시 자동으로 버튼이 늘어난다.
function ThemePicker() {
  const [current, setCurrent] = useState(getTheme());

  const handleSelect = (themeId) => {
    setTheme(themeId);
    setCurrent(themeId);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {Object.values(THEMES).map(({ id, label }) => {
        const isActive = current === id;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: isActive ? "#6366f1" : "var(--af-input-bg)",
              color: isActive ? "#ffffff" : "var(--af-text-secondary)",
              border: `1px solid ${isActive ? "#6366f1" : "var(--af-border-input)"}`,
              boxShadow: isActive ? "0 1px 8px rgba(99,102,241,0.4)" : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [provider, setProvider]               = useState("openai");
  const [openAiKey, setOpenAiKey]             = useState("");
  const [openAiKeySet, setOpenAiKeySet]       = useState(false);
  const [openAiModel, setOpenAiModel]         = useState("gpt-4o");
  const [anthropicKey, setAnthropicKey]       = useState("");
  const [anthropicKeySet, setAnthropicKeySet] = useState(false);
  const [ollamaUrl, setOllamaUrl]             = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel]         = useState("");

  useEffect(() => {
    Settings.get()
      .then(({ settings }) => {
        if (!settings) return;
        setProvider(settings.llmProvider);
        setOpenAiKeySet(settings.openAiKeySet);
        setOpenAiKey(settings.openAiKeyMasked || "");
        setOpenAiModel(settings.openAiModel);
        setAnthropicKeySet(settings.anthropicKeySet);
        setAnthropicKey(settings.anthropicKeyMasked || "");
        setOllamaUrl(settings.ollamaBasePath);
        setOllamaModel(settings.ollamaModel);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        llmProvider:    provider,
        openAiModel,
        ollamaBasePath: ollamaUrl,
        ollamaModel,
      };
      if (openAiKey && !openAiKey.includes("•")) payload.openAiKey = openAiKey;
      if (anthropicKey && !anthropicKey.includes("•")) payload.anthropicKey = anthropicKey;

      const res = await Settings.save(payload);
      if (res.success) {
        showToast("설정이 저장되었습니다.", "success");
      } else {
        showToast("저장 실패: " + (res.error ?? "알 수 없는 오류"), "error");
      }
    } catch (e) {
      showToast("저장 실패: 서버에 연결할 수 없어요.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--af-page-bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--af-text-muted)" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--af-page-bg)" }}
    >
      {/* ── 좌측 패널 ── */}
      <div
        className="w-52 shrink-0 flex flex-col h-full"
        style={{ background: "var(--af-sidebar-bg)", borderRight: "1px solid var(--af-border)" }}
      >
        <div
          className="flex items-center gap-2.5 px-5 h-14 shrink-0"
          style={{ borderBottom: "1px solid var(--af-border)" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#6366f1" }}
          >
            <Brain className="w-3.5 h-3.5 text-white" weight="bold" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--af-text-primary)" }}>
            Agent Flow
          </span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <button
            onClick={() => navigate(paths.home())}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-sm transition-all duration-150"
            style={{ color: "var(--af-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--af-hover-bg)";
              e.currentTarget.style.color = "var(--af-text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--af-text-muted)";
            }}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            홈으로
          </button>
        </nav>
      </div>

      {/* ── 메인 ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 */}
        <header
          className="flex items-center justify-between px-8 h-14 shrink-0"
          style={{ borderBottom: "1px solid var(--af-border)" }}
        >
          <h1 className="text-sm font-semibold" style={{ color: "var(--af-text-primary)" }}>설정</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "#6366f1",
              color: "#ffffff",
              boxShadow: "0 1px 8px rgba(99,102,241,0.5)",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#5254cc")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "#6366f1")}
          >
            <FloppyDisk className="w-3.5 h-3.5" weight="bold" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </header>

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* 외관 */}
            <SectionCard title="외관" icon={PaintBrush}>
              <Field label="테마">
                <ThemePicker />
              </Field>
            </SectionCard>

            {/* LLM 설정 */}
            <SectionCard title="LLM 설정" icon={Brain}>
              <div className="space-y-4">
                <Field label="Provider">
                  <SelectInput value={provider} onChange={setProvider} options={PROVIDERS} />
                </Field>

                {provider === "openai" && (
                  <>
                    <Field label="OpenAI API Key" hint="platform.openai.com에서 발급">
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

                {provider === "anthropic" && (
                  <>
                    <Field label="Anthropic API Key" hint="console.anthropic.com에서 발급">
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

                {provider === "ollama" && (
                  <>
                    <Field label="Ollama Base URL" hint="Ollama 서버 주소 (기본: http://localhost:11434)">
                      <TextInput value={ollamaUrl} onChange={setOllamaUrl} placeholder="http://localhost:11434" />
                    </Field>
                    <Field label="모델명" hint="예: llama3, mistral, gemma2">
                      <TextInput value={ollamaModel} onChange={setOllamaModel} placeholder="llama3" />
                    </Field>
                  </>
                )}
              </div>
            </SectionCard>

            {/* 정보 */}
            <SectionCard title="정보" icon={CheckCircle}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--af-text-secondary)" }}>버전</span>
                  <span className="text-xs font-mono" style={{ color: "var(--af-text-muted)" }}>v0.4.0</span>
                </div>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: "1px solid var(--af-border-subtle)" }}
                >
                  <span className="text-xs" style={{ color: "var(--af-text-secondary)" }}>GitHub</span>
                  <a
                    href="https://github.com/wndaasa/Agent-Flow"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: "var(--af-text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--af-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--af-text-muted)")}
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
