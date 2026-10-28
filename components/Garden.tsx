'use client';

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';
import { plants } from '@/data/garden';
import { ChoiceDelta } from '@/types/game';

function effectText(delta: ChoiceDelta): string {
  const parts: string[] = [];
  if (delta.health) parts.push(`${delta.health > 0 ? '+' : ''}${delta.health} 健康`);
  if (delta.popularity) parts.push(`${delta.popularity > 0 ? '+' : ''}${delta.popularity} 人缘`);
  if (delta.prestige) parts.push(`${delta.prestige > 0 ? '+' : ''}${delta.prestige} 名望`);
  if (delta.favor) parts.push(`${delta.favor > 0 ? '+' : ''}${delta.favor} 满意`);
  if (delta.risk) parts.push(`${delta.risk > 0 ? '+' : ''}${delta.risk} 风险`);
  return parts.join(' / ');
}

// 专属花形图标（SVG 由 data/garden.ts 提供，同色系底圈 + 白描花形）
function PlantIcon({ svg, size = 44, dim = false }: { svg: string; size?: number; dim?: boolean }) {
  return (
    <span
      className="inline-block shrink-0"
      style={{ width: size, height: size, opacity: dim ? 0.55 : 1, filter: dim ? 'saturate(0.6)' : undefined }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function Garden() {
  const { garden, day, plant, harvest } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);

  const handleHarvest = (index: number) => {
    const msg = harvest(index);
    if (msg) {
      setMessage(msg);
      setTimeout(() => setMessage(null), 2600);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-serif text-[#2D2420]">精神后花园</h3>
        <span className="text-[10px] text-[#C4B8A8]">已收成 {garden.harvested} 次</span>
      </div>
      <p className="text-[10px] text-[#9B8B7A] mb-3 leading-relaxed">种下花籽，几日盛开。收成可补气养神，偶尔还会遇见故人。</p>

      {/* 花盆 */}
      <div className="space-y-3">
        {garden.plots.map((plot, i) => {
          const plantDef = plot.plant ? plants.find((p) => p.id === plot.plant) : null;
          const ready = plantDef ? day - plot.plantedDay >= plantDef.daysToGrow : false;
          const remaining = plantDef ? plantDef.daysToGrow - (day - plot.plantedDay) : 0;
          const progress = plantDef && !ready
            ? Math.min(100, Math.round(((day - plot.plantedDay) / plantDef.daysToGrow) * 100))
            : ready ? 100 : 0;

          return (
            <div key={i} className="rounded-xl border border-[#EBE5DD] bg-[#FDF9F5] p-3">
              {!plot.plant ? (
                <div>
                  <div className="text-[11px] text-[#9B8B7A] mb-2">空花盆 · 种点什么</div>
                  <div className="grid grid-cols-3 gap-2">
                    {plants.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => plant(i, p.id)}
                        className="group rounded-lg border border-[#EBE5DD] bg-white px-1.5 py-2 text-center hover:border-[#D4A574] hover:bg-[#FFF8F2] transition-colors"
                      >
                        <PlantIcon svg={p.svg} size={28} />
                        <span className="block text-[10px] font-medium text-[#2D2420] mt-1">{p.name}</span>
                        <span className="block text-[9px] text-[#C4B8A8] leading-tight mt-0.5">
                          {p.daysToGrow}天 · {effectText(p.harvest)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <PlantIcon svg={plantDef!.svg} size={32} dim={!ready} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-[#2D2420]">{plantDef!.name}</span>
                      <span className="text-[9px] text-[#9B8B7A]">
                        {ready ? '盛开 · 可收成' : `还需 ${remaining} 天`}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#C4B8A8] mb-1.5">{plantDef!.desc}</div>
                    {!ready ? (
                      <div className="h-1.5 bg-[#EBE5DD] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: '#7CB518' }}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleHarvest(i)}
                        className="w-full rounded-lg bg-[#7CB518] text-white text-[11px] font-medium py-1.5 hover:bg-[#6BA812] transition-colors"
                      >
                        收成 · {effectText(plantDef!.harvest)}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 反馈消息 */}
      <div className="mt-3 min-h-[1.25rem] text-center">
        {message ? (
          <span className="animate-fade-in text-[11px] font-medium text-[#6B9C6E] leading-relaxed">{message}</span>
        ) : (
          <span className="text-[10px] text-[#C4B8A8]">空盆即种 · 花开即收 · 细水长流</span>
        )}
      </div>
    </div>
  );
}
