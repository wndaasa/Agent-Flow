/** Agent Flow 플랫폼 라우트 */
const paths = {
  home: () => "/",
  settings: () => "/settings",
  agents: {
    builder: () => "/builder",
    editAgent: (uuid) => `/builder/${uuid}`,
  },
  // 추후 Notebook 기능 추가 시 확장
  notebooks: {
    list: () => "/notebooks",
    view: (uuid) => `/notebooks/${uuid}`,
  },
};

export default paths;
