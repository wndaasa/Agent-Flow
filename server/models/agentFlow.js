const { prisma } = require("../db");

const AgentFlow = {
  async get(uuid) {
    return prisma.agent_flows.findUnique({ where: { uuid } });
  },
  async list() {
    return prisma.agent_flows.findMany({ orderBy: { createdAt: "desc" } });
  },
  async upsert(name, config, uuid = null) {
    const configStr = JSON.stringify(config);
    const active = config.active !== false;
    if (uuid) {
      return prisma.agent_flows.upsert({
        where: { uuid },
        update: { name, config: configStr, active },
        create: { uuid, name, config: configStr, active },
      });
    }
    return prisma.agent_flows.create({
      data: { name, config: configStr, active },
    });
  },
  async delete(uuid) {
    return prisma.agent_flows.delete({ where: { uuid } });
  },
};

module.exports = { AgentFlow };
