'use client';

import { useGameStore } from '@/hooks/useGameState';
import { GAME_CONFIG } from '@/lib/constants';

export default function NPCStatus() {
  const { npcs, activeFlags } = useGameStore();
  const mainNpcs = [npcs.wang, npcs.chen, npcs.li];
  const zhouFired = activeFlags.includes('zhou_fired');

  const getAffinityColor = (conquered: boolean, affinity: number) => {
    if (conquered) return '#8B7355';
    if (affinity >= 70) return '#6B9C6E';
    if (affinity >= 40) return '#D4956A';
    return '#9B8B7A';
  };

  return (
    <div className="card">
      <h3 className="text-sm font-serif text-[#2D2420] mb-3">同事关系</h3>

      <div className="space-y-0">
        {mainNpcs.map((npc) => (
          <div
            key={npc.id}
            className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: `${npc.portraitColor}18`,
                  color: npc.portraitColor,
                }}
              >
                {npc.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#2D2420] truncate">{npc.nickname}</div>
                <div className="text-[11px] text-[#9B8B7A] truncate">{npc.title}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div
                className="text-sm font-semibold"
                style={{ color: getAffinityColor(npc.isConquered, npc.affinity) }}
              >
                {npc.isConquered ? '✓ 已攻略' : npc.affinity}
              </div>
              {!npc.isConquered && (
                <div className="text-[11px] text-[#C4B8A8] mt-0.5">
                  影响力 {npc.prestigePath}/{GAME_CONFIG.CONQUEST_THRESHOLD} · 人缘 {npc.popularityPath}/{GAME_CONFIG.CONQUEST_THRESHOLD}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 小周 */}
        <div className="border-t border-[#F0E8DD] mt-1 pt-2">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: `${npcs.zhou.portraitColor}18`,
                  color: npcs.zhou.portraitColor,
                }}
              >
                {npcs.zhou.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#2D2420] truncate">{npcs.zhou.name}</div>
                <div className="text-[11px] text-[#9B8B7A] truncate">{npcs.zhou.title}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              {zhouFired ? (
                <div className="text-sm font-semibold text-[#C46B5D]">已离职</div>
              ) : (
                <div
                  className="text-sm font-semibold"
                  style={{ color: getAffinityColor(false, npcs.zhou.affinity) }}
                >
                  {npcs.zhou.affinity}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
