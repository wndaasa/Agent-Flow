import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const AgentFlows = {
  saveFlow: async (name, config, uuid = null) => {
    return await fetch(`${API_BASE}/agent-flows/save`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, config, uuid }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save flow");
        return res.json();
      })
      .catch((e) => ({
        success: false,
        error: e.message,
        flow: null,
      }));
  },

  listFlows: async () => {
    return await fetch(`${API_BASE}/agent-flows/list`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        flows: [],
      }));
  },

  getFlow: async (uuid) => {
    return await fetch(`${API_BASE}/agent-flows/${uuid}`, {
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        flow: null,
      }));
  },

  deleteFlow: async (uuid) => {
    return await fetch(`${API_BASE}/agent-flows/${uuid}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  toggleFlow: async (uuid, active) => {
    return await fetch(`${API_BASE}/agent-flows/${uuid}/toggle`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  startRun: async (flowUuid) => {
    return await fetch(`${API_BASE}/agent-flows/${flowUuid}/run/start`, {
      method: "POST",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  streamUrl: (flowUuid, sessionId) => {
    return `${API_BASE}/agent-flows/${flowUuid}/run/${sessionId}/stream`;
  },

  submitInput: async (flowUuid, sessionId, nodeId, value) => {
    return await fetch(
      `${API_BASE}/agent-flows/${flowUuid}/run/${sessionId}/input`,
      {
        method: "POST",
        headers: {
          ...baseHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodeId, value }),
      }
    )
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  submitInputFile: async (flowUuid, sessionId, nodeId, file, note = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("nodeId", nodeId);
    form.append("note", note);
    return await fetch(
      `${API_BASE}/agent-flows/${flowUuid}/run/${sessionId}/input-file`,
      {
        method: "POST",
        body: form,
      }
    )
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  cancelRun: async (flowUuid, sessionId) => {
    return await fetch(
      `${API_BASE}/agent-flows/${flowUuid}/run/${sessionId}`,
      {
        method: "DELETE",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },
};

export default AgentFlows;
