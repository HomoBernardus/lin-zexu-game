'use client';

import { STAT_LABELS, GAME_CONFIG } from '@/lib/constants';
import { useGameStore } from '@/hooks/useGameState';

export default function Dashboard() {
  const { stats, weeklyModifier, day, week } = useGameStore();
  const statsArray = Object.entries(stats) as [keyof typeof stats, number][];

  return (
    <div className="card">
      {/* 周关键词 */}
      {weeklyModifier && (
        <div className="mb-4 bg-[#FDF9F5] rounded-xl p-3 flex items-start gap-3 border border-[#F0E8DD]">
          <span className="text-xl shrink-0 mt-0.5">{weeklyModifier.icon}</span>
          <div>
            <div className="text-xs font-semibold text-[#8B7355] tracking-wide">
              {weeklyModifier.name}
            </div>
            <p className="text-[11px] text-[#9B8B7A] mt-1 leading-relaxed">{weeklyModifier.description}</p>
          </div>
        </div>
      )}

      {/* 属性数值 */}
      <div className="space-y-3">
        {statsArray.map(([key, value]) => {
          const config = STAT_LABELS[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#9B8B7A] flex items-center gap-1.5">
                  <span className="text-sm">{config.icon}</span>
                  {config.name}
                </span>
                <span className="text-xs font-mono text-[#9B8B7A] tabular-nums">{value}</span>
              </div>
              <div className="h-1.5 bg-[#F0E8DD] rounded-full overflow-hidden">
                <div
                  className="stat-bar"
                  style={{
                    width: `${Math.min(value, 100)}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 进度 */}
      <div className="mt-4 pt-3 border-t border-[#F0E8DD] flex justify-between text-[11px] text-[#C4B8A8]">
        <span>第 {day} / {GAME_CONFIG.TOTAL_DAYS} 天</span>
        <span>第 {week} / {GAME_CONFIG.TOTAL_WEEKS} 周</span>
      </div>
    </div>
  );
}
