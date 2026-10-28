'use client';

import { STAT_LABELS, GAME_CONFIG } from '@/lib/constants';
import { useGameStore } from '@/hooks/useGameState';
import { calculateSupport } from '@/lib/gameLogic';

export default function Dashboard() {
  const { stats, weeklyModifier, day, week } = useGameStore();
  const statsArray = Object.entries(stats) as [keyof typeof stats, number][];

  const store = useGameStore.getState();
  const conqueredCount = [store.npcs.wang, store.npcs.chen, store.npcs.li].filter((n) => n.isConquered).length;
  const support = calculateSupport(store);

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

      {/* 通关目标 */}
      <div className="mt-4 pt-3 border-t border-[#F0E8DD]">
        <div className="flex justify-between text-[11px] text-[#8B7355]">
          <span className="font-semibold">通关目标</span>
          <span>已攻略 {conqueredCount}/2 · 支持率 {support}/65</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-[#F0E8DD] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min((support / 65) * 100, 100)}%`, backgroundColor: '#7CB518' }}
          />
        </div>
        <p className="text-[10px] text-[#C4B8A8] mt-1">推动禁烟：攻略 2 位同事，支持率 ≥65</p>
      </div>

      {/* 进度 */}
      <div className="mt-4 pt-3 border-t border-[#F0E8DD] flex justify-between text-[11px] text-[#C4B8A8]">
        <span>第 {day} / {GAME_CONFIG.TOTAL_DAYS} 天</span>
        <span>第 {week} / {GAME_CONFIG.TOTAL_WEEKS} 周</span>
      </div>
    </div>
  );
}
