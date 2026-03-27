export function baseHeaders() {
  return {};
}

export function safeJsonParse(jsonString, fallback = null) {
  try {
    if (jsonString === null || jsonString === undefined) return fallback;
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}
