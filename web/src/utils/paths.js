/** Agent Flow 단독 사이트 라우트 */
const paths = {
  home: () => "/",
  agents: {
    builder: () => "/builder",
    editAgent: (uuid) => `/builder/${uuid}`,
  },
  settings: {
    agentSkills: () => "/",
  },
};

export default paths;
