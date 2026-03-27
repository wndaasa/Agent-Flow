const { MAX_SCRAPED_TEXT_LENGTH } = require("../constants");

/**
 * Collector 없이 fetch로 HTML/텍스트만 가져옵니다 (포폴용 단순화).
 */
async function executeWebScraping(config, context) {
  const { url, captureAs = "text" } = config;
  const { introspect, logger } = context;
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing Web Scraping block (standalone)`
  );

  if (!url) {
    throw new Error("URL is required for web scraping");
  }

  introspect(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AgentFlowSite/1.0; +local demo)",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error("Empty response body");
  }

  if (captureAs === "html") {
    introspect(`Got HTML (${text.length} chars)`);
    return text;
  }

  // text: 태그 대략 제거 (완전 파서 없음)
  const stripped = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  introspect(`Extracted text (${stripped.length} chars)`);
  return stripped.slice(0, MAX_SCRAPED_TEXT_LENGTH);
}

module.exports = executeWebScraping;
