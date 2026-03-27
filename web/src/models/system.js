/**
 * 추후 ollama 등 동적 모델 추가 시 구현
 */
const System = {
  customModels: async (_provider, _a, _b, _timeout) => {
    return { models: [], error: null };
  },
};

export default System;
