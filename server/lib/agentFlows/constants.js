/**
 * 플로우 실행 관련 상수
 */

/** Web Scraping 결과 최대 텍스트 길이 (chars) */
const MAX_SCRAPED_TEXT_LENGTH = 500_000;

/** 파일 업로드 최대 크기 (bytes) — agentFlowRun.js */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** 완료된 세션 정리 대기 시간 (ms) — agentFlowRun.js */
const SESSION_CLEANUP_TIMEOUT = 5 * 60 * 1000;

module.exports = {
  MAX_SCRAPED_TEXT_LENGTH,
  MAX_FILE_SIZE,
  SESSION_CLEANUP_TIMEOUT,
};
