const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");
const { AgentFlows } = require("../lib/agentFlows");
const { StreamFlowExecutor } = require("../lib/agentFlows/streamExecutor");
const { MinimalAibitat } = require("../lib/minimalAibitat");
const { MAX_FILE_SIZE, SESSION_CLEANUP_TIMEOUT } = require("../lib/agentFlows/constants");

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || "upload").replace(/[^\w.\-]/g, "_");
      cb(null, `${uuidv4()}_${safe}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
});

const sessions = new Map();

function emitToSession(session, event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  session.events.push(event);
  for (const client of session.sseClients) {
    try {
      client.write(data);
      if (typeof client.flush === "function") client.flush();
    } catch (_) {}
  }
}

function createMinimalAibitat(onEvent) {
  return new MinimalAibitat({
    onLog: (msg) => onEvent({ type: "log", message: msg }),
  });
}

async function runFlowInBackground(session, flow) {
  session.status = "running";

  const executor = new StreamFlowExecutor({
    onEvent: (event) => emitToSession(session, event),
  });
  session.executor = executor;

  const aibitat = createMinimalAibitat((event) =>
    emitToSession(session, event)
  );
  executor.aibitat = aibitat;
  executor.attachLogging(
    (msg) => emitToSession(session, { type: "introspect", message: msg }),
    console.info
  );

  try {
    const result = await executor.executeFlow(flow, {}, aibitat);
    if (result.success) {
      session.status = "complete";
      emitToSession(session, {
        type: "flow_complete",
        output: result.directOutput ?? null,
        variables: result.variables,
        success: true,
      });
    } else {
      session.status = "error";
      const failed = (result.results || []).find((r) => !r.success);
      emitToSession(session, {
        type: "flow_error",
        error: failed?.error || "Flow execution failed.",
        variables: result.variables,
      });
    }
  } catch (error) {
    session.status = "error";
    emitToSession(session, { type: "flow_error", error: error.message });
  } finally {
    setTimeout(() => sessions.delete(session.sessionId), SESSION_CLEANUP_TIMEOUT);
  }
}

function allowAuthTokenFromQuery(req, _res, next) {
  next();
}

function registerAgentFlowRunRoutes(app) {
  app.post("/agent-flows/:uuid/run/start", async (req, res) => {
    try {
      const { uuid } = req.params;
      const flow = await AgentFlows.loadFlow(uuid);
      if (!flow)
        return res.status(404).json({ success: false, error: "Flow not found" });

      const sessionId = uuidv4();
      const session = {
        sessionId,
        flowUuid: uuid,
        status: "pending",
        sseClients: new Set(),
        executor: null,
        events: [],
      };
      sessions.set(sessionId, session);

      runFlowInBackground(session, flow).catch(console.error);

      return res.json({ success: true, sessionId });
    } catch (error) {
      console.error("Error starting flow run:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get(
    "/agent-flows/:uuid/run/:sessionId/stream",
    allowAuthTokenFromQuery,
    (req, res) => {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);
      if (!session)
        return res.status(404).json({ success: false, error: "Session not found" });

      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      try {
        if (res.socket) res.socket.setNoDelay(true);
      } catch (_) {}

      for (const event of session.events) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      if (session.status === "complete" || session.status === "error") {
        res.end();
        return;
      }

      session.sseClients.add(res);
      req.on("close", () => {
        session.sseClients.delete(res);
      });
    }
  );

  app.post("/agent-flows/:uuid/run/:sessionId/input", (req, res) => {
    const { sessionId } = req.params;
    const { value = "", nodeId = "" } = req.body;
    const session = sessions.get(sessionId);

    if (!session)
      return res.status(404).json({ success: false, error: "Session not found" });

    if (!nodeId || !session.executor?.inputResolvers?.has(nodeId)) {
      return res.status(400).json({
        success: false,
        error: "Not waiting for input on this node",
      });
    }

    session.executor.resolveInput(nodeId, value);
    return res.json({ success: true });
  });

  app.post(
    "/agent-flows/:uuid/run/:sessionId/input-file",
    upload.single("file"),
    async (req, res) => {
      const { sessionId } = req.params;
      const { nodeId = "", note = "" } = req.body || {};
      const session = sessions.get(sessionId);

      if (!session)
        return res.status(404).json({ success: false, error: "Session not found" });

      if (!nodeId || !session.executor?.inputResolvers?.has(nodeId)) {
        return res.status(400).json({
          success: false,
          error: "Not waiting for input on this node",
        });
      }

      if (!req.file?.path) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      try {
        const buf = fs.readFileSync(req.file.path);
        let extractedText = buf.toString("utf8");
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}

        if (!extractedText.trim()) {
          return res.status(500).json({
            success: false,
            error:
              "파일에서 UTF-8 텍스트를 읽지 못했습니다. .txt 등 텍스트 파일을 사용하세요.",
          });
        }

        const noteText = String(note || "").trim();
        const value = noteText
          ? `${extractedText}\n\n[사용자 메모]\n${noteText}`
          : extractedText;

        session.executor.resolveInput(nodeId, value);
        return res.json({ success: true, extractedChars: value.length });
      } catch (error) {
        console.error("[input-file]", error);
        return res.status(500).json({
          success: false,
          error: error.message || "Failed to process uploaded file.",
        });
      }
    }
  );

  app.delete("/agent-flows/:uuid/run/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    if (!session)
      return res.status(404).json({ success: false, error: "Session not found" });

    for (const nodeId of session.executor?.pendingInputNodeIds || []) {
      session.executor.resolveInput(nodeId, "__cancelled__");
    }

    for (const client of session.sseClients) {
      try {
        client.write(`data: ${JSON.stringify({ type: "flow_cancelled" })}\n\n`);
        client.end();
      } catch (_) {}
    }
    sessions.delete(sessionId);
    return res.json({ success: true });
  });
}

module.exports = { registerAgentFlowRunRoutes };
