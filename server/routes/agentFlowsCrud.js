const { AgentFlows } = require("../lib/agentFlows");

function registerAgentFlowsCrud(app) {
  app.post("/agent-flows/save", async (req, res) => {
    try {
      const { name, config, uuid } = req.body;
      if (!name || !config) {
        return res.status(400).json({
          success: false,
          error: "Name and config are required",
        });
      }
      const flow = await AgentFlows.saveFlow(name, config, uuid);
      if (!flow || !flow.success) {
        return res.status(500).json({
          success: false,
          error: flow?.error || "플로우 저장에 실패했습니다",
        });
      }
      return res.status(200).json({ success: true, flow });
    } catch (error) {
      console.error("Error saving flow:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/agent-flows/list", async (_req, res) => {
    try {
      const flows = await AgentFlows.listFlows();
      return res.status(200).json({ success: true, flows });
    } catch (error) {
      console.error("Error listing flows:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/agent-flows/:uuid", async (req, res) => {
    try {
      const { uuid } = req.params;
      const flow = await AgentFlows.loadFlow(uuid);
      if (!flow) {
        return res.status(404).json({ success: false, error: "Flow not found" });
      }
      return res.status(200).json({ success: true, flow });
    } catch (error) {
      console.error("Error getting flow:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/agent-flows/:uuid", async (req, res) => {
    try {
      const { uuid } = req.params;
      const { success } = await AgentFlows.deleteFlow(uuid);
      if (!success) {
        return res.status(500).json({
          success: false,
          error: "Failed to delete flow",
        });
      }
      return res.status(200).json({ success });
    } catch (error) {
      console.error("Error deleting flow:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/agent-flows/:uuid/toggle", async (req, res) => {
    try {
      const { uuid } = req.params;
      const { active } = req.body;
      const flow = await AgentFlows.loadFlow(uuid);
      if (!flow) {
        return res.status(404).json({ success: false, error: "Flow not found" });
      }
      flow.config.active = active;
      const { success } = await AgentFlows.saveFlow(flow.name, flow.config, uuid);
      if (!success) {
        return res.status(500).json({ success: false, error: "Failed to update flow" });
      }
      return res.json({ success: true, flow });
    } catch (error) {
      console.error("Error toggling flow:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = { registerAgentFlowsCrud };
