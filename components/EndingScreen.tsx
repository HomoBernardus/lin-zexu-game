'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';
import { determineEnding } from '@/lib/gameLogic';
import { endings } from '@/data/ending';
import { Ending } from '@/types/game';

interface EndingScreenProps {
  onRestart: () => void;
}

export default function EndingScreen({ onRestart }: EndingScreenProps) {
  const state = useGameStore();
  const [ending, setEnding] = useState<Ending | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const endingType = determineEnding(state);
    setEnding(endings[endingType]);
    setTimeout(() => setVisible(true), 100);
  }, [state]);

  if (!ending) return null;

  return (
    <div className={`ending-screen transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-xl w-full">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-[#2D2420] mb-2 tracking-wide">{ending.title}</h1>
          <p className="text-sm text-[#8B7355] tracking-widest">{ending.subtitle}</p>
        </div>

        {/* 结局文案 */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#EBE5DD] mb-6">
          {ending.description.split('\n\n').map((para, idx) => (
            <p key={idx} className="text-[#5C554D] leading-relaxed mb-4 last:mb-0 text-sm md:text-base">
              {para}
            </p>
          ))}
        </div>

        {/* 数据回顾 */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div>
            <div className="text-2xl font-serif text-[#8B7355]">
              {Math.floor(state.stats.prestige * 0.25 + state.stats.popularity * 0.25 + 20)}%
            </div>
            <div className="text-[11px] text-[#9B8B7A] mt-1">最终支持率</div>
          </div>
          <div>
            <div className="text-2xl font-serif text-[#8B7355]">
              {[state.npcs.wang.isConquered, state.npcs.chen.isConquered, state.npcs.li.isConquered].filter(Boolean).length}/3
            </div>
            <div className="text-[11px] text-[#9B8B7A] mt-1">攻略同事</div>
          </div>
          <div>
            <div className="text-2xl font-serif text-[#8B7355]">
              {state.activeFlags.length}
            </div>
            <div className="text-[11px] text-[#9B8B7A] mt-1">蝴蝶效应</div>
          </div>
        </div>

        {/* 重启按钮 */}
        <div className="flex justify-center">
          <button onClick={onRestart} className="btn-primary">
            开始新游戏
          </button>
        </div>
      </div>
    </div>
  );
}
