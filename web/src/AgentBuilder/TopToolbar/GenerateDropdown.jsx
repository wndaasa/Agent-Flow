import React, { useEffect, useRef, useState } from "react";
import { Sparkle, Brain, CircleNotch } from "@phosphor-icons/react";
import { STATIC_GROUPS, DYNAMIC_PROVIDERS } from "./generateTypes";
import { fetchCustomModelsForProvider } from "../registries/dynamicModels";

/**
 * 그룹 ID → 아이콘 매핑
 *
 * 새 그룹 추가 시 여기에도 아이콘 등록
 */
const GROUP_ICONS = {
  default: <Sparkle className="w-4 h-4" weight="fill" />,
  claude: <Brain className="w-4 h-4" />,
  openai: <Sparkle className="w-4 h-4" weight="fill" />,
  ollama: <Brain className="w-4 h-4" />,
};

const DEFAULT_ICON = <Brain className="w-4 h-4" />;

/**
 * 동적 프로바이더의 모델 목록을 서버에서 가져와 그룹으로 변환
 */
async function fetchDynamicGroups() {
  const groups = [];
  for (const dp of DYNAMIC_PROVIDERS) {
    try {
      const models = await fetchCustomModelsForProvider(dp.provider, 5000);
      if (models.length === 0) continue;
      groups.push({
        id: dp.groupId,
        label: dp.label,
        items: models.map((m) => ({
          id: `${dp.provider}-${m.id}`,
          label: m.id,
          description: `${dp.label} 로컬 모델`,
          nodeType: "llmInstruction",
          defaultData: { provider: dp.provider, model: m.id },
        })),
      });
    } catch {
      // 연결 실패 시 해당 프로바이더 건너뜀
    }
  }
  return groups;
}

/**
 * GenerateDropdown — Generate 버튼 클릭 시 나타나는 모델 선택 드롭다운
 *
 * Props:
 *   onSelect(item) : 항목 선택 시 콜백 (item = generateTypes.js 의 item 객체)
 *   onClose()      : 드롭다운 닫기 콜백
 */
export default function GenerateDropdown({ onSelect, onClose }) {
  const ref = useRef(null);
  const [dynamicGroups, setDynamicGroups] = useState([]);
  const [loading, setLoading] = useState(DYNAMIC_PROVIDERS.length > 0);

  /* 동적 모델 로딩 */
  useEffect(() => {
    if (DYNAMIC_PROVIDERS.length === 0) return;
    let cancelled = false;
    fetchDynamicGroups().then((groups) => {
      if (!cancelled) {
        setDynamicGroups(groups);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  /* 외부 클릭 시 닫기 */
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const allGroups = [...STATIC_GROUPS, ...dynamicGroups];

  return (
    <div
      ref={ref}
      className="
        absolute top-full left-0 mt-2 z-50
        w-72
        bg-theme-action-menu-bg
        border border-white/10 light:border-black/10
        rounded-2xl shadow-2xl
        overflow-hidden
        animate-fadeUpIn
      "
    >
      {/* 드롭다운 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 light:border-black/5 bg-primary-button/10">
        <Sparkle className="w-4 h-4 text-primary-button" weight="fill" />
        <span className="text-sm font-semibold text-theme-text-primary">Generate</span>
      </div>

      {/* 그룹 목록 */}
      <div className="py-1.5 max-h-80 overflow-y-auto">
        {allGroups.map((group, gi) => (
          <div key={group.id}>
            {/* 그룹 구분선 (첫 번째 그룹 제외) */}
            {gi > 0 && (
              <div className="my-1 mx-3 border-t border-white/5 light:border-black/5" />
            )}

            {/* 그룹 레이블 */}
            {group.label && (
              <p className="px-4 pt-1.5 pb-0.5 text-[10px] font-semibold text-theme-text-secondary uppercase tracking-widest">
                {group.label}
              </p>
            )}

            {/* 항목 목록 */}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="
                  w-full flex items-start gap-3 px-4 py-2.5
                  hover:bg-white/5 light:hover:bg-black/5
                  transition-colors duration-100 text-left
                  border-none
                "
              >
                <span className="mt-0.5 shrink-0 text-theme-text-secondary">
                  {GROUP_ICONS[group.id] ?? DEFAULT_ICON}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-theme-text-primary truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-theme-text-secondary leading-snug mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}

        {/* 동적 모델 로딩 중 표시 */}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 text-theme-text-secondary">
            <CircleNotch className="w-4 h-4 animate-spin" />
            <span className="text-xs">모델 목록 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}
