import React from "react";
import { Play } from "@phosphor-icons/react";

/**
 * StartPanel — Start 노드 우측 패널
 * Start 노드는 설정 항목이 없으므로 안내 메시지만 표시
 */
export default function StartPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-theme-action-menu-bg border border-white/10 flex items-center justify-center">
        <Play className="w-5 h-5 text-theme-text-secondary" />
      </div>
      <p className="text-sm font-medium text-theme-text-primary">플로우 시작점</p>
      <p className="text-xs text-theme-text-secondary leading-relaxed max-w-[220px]">
        Start 노드는 별도 설정이 없습니다.
        <br />
        아래 노드를 연결해 플로우를 구성하세요.
      </p>
    </div>
  );
}
