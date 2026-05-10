'use client';

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';
import { GAME_CONFIG } from '@/lib/constants';
import { npcBios } from '@/data/npcBios';
import { NPC } from '@/types/game';

export default function NPCStatus() {
  const { npcs, activeFlags } = useGameStore();
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const mainNpcs = [npcs.wang, npcs.chen, npcs.li];
  const zhouFired = activeFlags.includes('zhou_fired');

  const getAffinityColor = (conquered: boolean, affinity: number) => {
    if (conquered) return '#8B7355';
    if (affinity >= 70) return '#6B9C6E';
    if (affinity >= 40) return '#D4956A';
    return '#9B8B7A';
  };

  return (
    <>
      <div className="card">
        <h3 className="text-sm font-serif text-[#2D2420] mb-3">同事关系</h3>

        <div className="space-y-0">
          {mainNpcs.map((npc) => (
            <button
              key={npc.id}
              onClick={() => setSelectedNpc(npc)}
              className="w-full flex items-center justify-between py-2 first:pt-0 last:pb-0 text-left hover:bg-[#FDF9F5] -mx-1 px-1 rounded-lg transition-colors"
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
            </button>
          ))}

          {/* 小周 · 老赵（非攻略NPC） */}
          <div className="border-t border-[#F0E8DD] mt-1 pt-2 flex flex-col gap-y-1">
            {([npcs.zhou, npcs.zhao] as NPC[]).map((npc) => (
              <button
                key={npc.id}
                onClick={() => setSelectedNpc(npc)}
                className="w-full flex items-center justify-between py-1.5 text-left hover:bg-[#FDF9F5] -mx-1 px-1 rounded-lg transition-colors"
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
                  {npc.id === 'zhou' && zhouFired ? (
                    <div className="text-sm font-semibold text-[#C46B5D]">已离职</div>
                  ) : (
                    <div
                      className="text-sm font-semibold"
                      style={{ color: getAffinityColor(false, npc.affinity) }}
                    >
                      {npc.affinity}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NPC 人设弹窗 */}
      {selectedNpc && (
        <div
          className="fixed inset-0 z-40 flex items-end lg:items-center justify-center"
          onClick={() => setSelectedNpc(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white rounded-t-2xl lg:rounded-2xl px-6 py-6 lg:max-w-sm lg:w-full shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* NPC 头像 + 基本信息 */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
                style={{
                  backgroundColor: `${selectedNpc.portraitColor}18`,
                  color: selectedNpc.portraitColor,
                }}
              >
                {selectedNpc.name[0]}
              </div>
              <div>
                <div className="text-base font-serif text-[#2D2420]">{selectedNpc.nickname}</div>
                <div className="text-xs text-[#9B8B7A]">{selectedNpc.title}</div>
              </div>
              <div className="ml-auto text-right">
                <div
                  className="text-sm font-semibold"
                  style={{ color: getAffinityColor(selectedNpc.isConquered, selectedNpc.affinity) }}
                >
                  {selectedNpc.isConquered ? '已攻略' : `好感 ${selectedNpc.affinity}`}
                </div>
              </div>
            </div>

            {/* 人设介绍 */}
            <p className="text-sm text-[#5C554D] leading-relaxed mb-4">
              {npcBios[selectedNpc.id]?.intro ?? '暂无介绍'}
            </p>

            {/* 台词 */}
            {npcBios[selectedNpc.id]?.quote && (
              <div className="bg-[#FDF9F5] rounded-xl px-4 py-3 border border-[#F0E8DD] mb-4">
                <p className="text-sm text-[#8B7355] italic leading-relaxed">
                  "{npcBios[selectedNpc.id]?.quote}"
                </p>
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedNpc(null)}
              className="w-full py-2 text-sm text-[#9B8B7A] hover:text-[#2D2420] transition-colors"
            >
              收起
            </button>
          </div>
        </div>
      )}
      </>
  );
}
