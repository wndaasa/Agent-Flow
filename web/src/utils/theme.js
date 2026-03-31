/**
 * Agent Flow — 테마 시스템
 *
 * 새 테마 추가 방법:
 * 1. THEMES 객체에 항목 추가
 * 2. index.css에 [data-theme="<id>"] 블록에 --af-* 변수 정의
 */

export const THEMES = {
  light: { id: "light", label: "라이트" },
  dark:  { id: "dark",  label: "다크"  },
};

const DEFAULT_THEME = "light";
const STORAGE_KEY   = "af-theme";

/** 저장된 테마 ID를 반환한다. 없으면 기본값(라이트). */
export function getTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return THEMES[saved] ? saved : DEFAULT_THEME;
}

/** 테마를 저장하고 즉시 DOM에 반영한다. */
export function setTheme(themeId) {
  if (!THEMES[themeId]) return;
  localStorage.setItem(STORAGE_KEY, themeId);
  _apply(themeId);
}

/** 저장된 테마를 DOM에 반영한다. 앱 초기화 시 1회 호출. */
export function applyTheme() {
  _apply(getTheme());
}

function _apply(themeId) {
  document.documentElement.setAttribute("data-theme", themeId);
}
