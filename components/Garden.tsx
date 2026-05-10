'use client';

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';

export default function Garden() {
  const { gardenAction, stats, gardenUsedToday } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    { id: 'prune' as const, name: '修剪枝叶', icon: '✂️', desc: '静心修剪，恢复健康', effect: '+5 健康 / -2 风险' },
    { id: 'water' as const, name: '浇水灌溉', icon: '💧', desc: '悉心照料，洗涤心灵', effect: '+5 健康 / -3 风险' },
    { id: 'meditate' as const, name: '静坐冥想', icon: '🧘', desc: '思考得失，修身养性', effect: '+3 健康 / +5 人缘' },
  ];

  const handleAction = (actionId: 'prune' | 'water' | 'meditate') => {
    gardenAction(actionId);
    setActiveAction(actionId);
    setMessage(actions.find(a => a.id === actionId)?.effect ?? null);
    setTimeout(() => {
      setMessage(null);
      setActiveAction(null);
    }, 2000);
  };

  return (
    <div className="card">
      <h3 className="text-sm font-serif text-[#2D2420] mb-3">精神后花园</h3>

      {/* 健康值 */}
      <div className="text-center mb-4">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-3xl">🌸</span>
          <span className="text-2xl font-serif" style={{ color: '#D4956A' }}>{stats.health}</span>
        </div>
        <div className="text-[11px] text-[#C4B8A8] mt-1">当前肺部健康</div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            disabled={gardenUsedToday}
            className={`garden-button group ${gardenUsedToday ? 'opacity-50 cursor-not-allowed' : ''} ${activeAction === action.id && !gardenUsedToday ? 'border-[#D4A574] bg-[#FFF8F2]' : ''}`}
          >
            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <span className="text-xs font-medium text-[#2D2420] mb-0.5">{action.name}</span>
            <span className="text-[10px] text-[#9B8B7A] leading-tight text-center">
              {action.desc}
            </span>
          </button>
        ))}
      </div>

      {/* 反馈消息 */}
      <div className="mt-3 h-5 text-center">
        {gardenUsedToday ? (
          <span className="text-[10px] text-[#C4B8A8]">今日已在此休憩，明日再来</span>
        ) : message ? (
          <span className="animate-fade-in text-xs font-medium text-[#6B9C6E]">{message}</span>
        ) : (
          <span className="text-[10px] text-[#C4B8A8]">选择一项行动来恢复健康</span>
        )}
      </div>
    </div>
  );
}
