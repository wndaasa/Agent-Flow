const Settings = {
  async get() {
    const res = await fetch("/api/settings");
    return res.json();
  },

  async save(updates) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};

export default Settings;
