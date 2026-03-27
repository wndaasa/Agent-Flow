/**
 * 동적 모델 목록 — System.customModels 와 Generate / LLM 패널 공통
 */
import System from "@/models/system";

/**
 * @param {string} provider  DYNAMIC_PROVIDERS 의 provider 값 (예: "ollama")
 * @param {number} [timeoutMs]
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function fetchCustomModelsForProvider(provider, timeoutMs = 5000) {
  const { models = [], error } = await System.customModels(
    provider,
    null,
    null,
    timeoutMs
  );
  if (error) return [];
  return models;
}
