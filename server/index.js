require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { registerAgentFlowsCrud } = require("./routes/agentFlowsCrud");
const { registerAgentFlowRunRoutes } = require("./routes/agentFlowRun");
const { registerSettingsRoutes } = require("./routes/settings");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "agent-flow" });
});

registerAgentFlowsCrud(app);
registerAgentFlowRunRoutes(app);
registerSettingsRoutes(app);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[agent-flow] API http://localhost:${PORT}`);
});
