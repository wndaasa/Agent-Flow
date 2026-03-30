const fs = require("fs");
const path = require("path");

const ENV_PATH = path.resolve(__dirname, "../.env");

const ALLOWED_KEYS = new Set([
  "LLM_PROVIDER",
  "OPEN_AI_KEY",
  "OPEN_AI_MODEL_PREF",
  "ANTHROPIC_API_KEY",
  "OLLAMA_BASE_PATH",
  "OLLAMA_MODEL_PREF",
]);

function parseEnv(content) {
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = val;
  }
  return result;
}

function writeEnv(current, updates) {
  const merged = { ...current, ...updates };
  const lines = Object.entries(merged).map(([k, v]) => {
    const needsQuote = v.includes(" ") || v.includes("#");
    return `${k}=${needsQuote ? `"${v}"` : v}`;
  });
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf8");
}

function registerSettingsRoutes(app) {
  app.get("/api/settings", (_req, res) => {
    try {
      const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
      const env = parseEnv(content);

      // API 키는 마스킹해서 반환
      const mask = (val) => {
        if (!val || val.length < 8) return val ? "••••••••" : "";
        return val.slice(0, 4) + "•".repeat(Math.min(val.length - 8, 20)) + val.slice(-4);
      };

      return res.json({
        success: true,
        settings: {
          llmProvider: env.LLM_PROVIDER || "openai",
          openAiKeySet: !!env.OPEN_AI_KEY,
          openAiKeyMasked: mask(env.OPEN_AI_KEY),
          openAiModel: env.OPEN_AI_MODEL_PREF || "gpt-4o",
          anthropicKeySet: !!env.ANTHROPIC_API_KEY,
          anthropicKeyMasked: mask(env.ANTHROPIC_API_KEY),
          ollamaBasePath: env.OLLAMA_BASE_PATH || "http://localhost:11434",
          ollamaModel: env.OLLAMA_MODEL_PREF || "",
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const body = req.body || {};
      const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
      const current = parseEnv(content);

      const updates = {};
      const MAP = {
        llmProvider:    "LLM_PROVIDER",
        openAiKey:      "OPEN_AI_KEY",
        openAiModel:    "OPEN_AI_MODEL_PREF",
        anthropicKey:   "ANTHROPIC_API_KEY",
        ollamaBasePath: "OLLAMA_BASE_PATH",
        ollamaModel:    "OLLAMA_MODEL_PREF",
      };

      for (const [bodyKey, envKey] of Object.entries(MAP)) {
        if (!ALLOWED_KEYS.has(envKey)) continue;
        if (body[bodyKey] === undefined) continue;
        // 빈 문자열로 API 키를 덮어쓰는 것은 무시 (마스킹된 값 그대로 유지)
        if ((bodyKey === "openAiKey" || bodyKey === "anthropicKey") && body[bodyKey] === "") continue;
        updates[envKey] = String(body[bodyKey]);
      }

      writeEnv(current, updates);

      // 런타임 process.env 도 즉시 반영
      for (const [k, v] of Object.entries(updates)) {
        process.env[k] = v;
      }

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}

module.exports = { registerSettingsRoutes };
