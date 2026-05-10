'use client';

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameState';
import { props as propDefs } from '@/data/props';
import { PropType } from '@/types/game';

export default function PropPanel() {
  const { inventory, equippedProp, stats, equipProp, unequipProp, gameOver } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = (propType: PropType) => {
    if (gameOver) return;
    if (!inventory[propType]) return;

    if (equippedProp === propType) {
      unequipProp();
      setMessage('已卸下');
    } else {
      equipProp(propType);
      const prop = propDefs.find(p => p.id === propType);
      setMessage(prop?.flavor ?? null);
    }
    setTimeout(() => setMessage(null), 2500);
  };

  const currentProp = equippedProp ? propDefs.find(p => p.id === equippedProp) : null;
  const drainBonus = (stats.health ?? 100) < 30
    ? 'text-[#C46B5D]'
    : (stats.health ?? 100) < 60
    ? 'text-[#D4956A]'
    : 'text-[#6B9C6E]';

  return (
    <div className="card">
      {/* 标题行 + 状态指示 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-serif text-[#2D2420]">防身利器</h3>
        {currentProp && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDF9F5] text-[#D4A574] border border-[#F0E8DD] font-medium">
            {currentProp.icon} 防护 {currentProp.protection}/天
          </span>
        )}
      </div>

      {/* 道具网格 */}
      <div className="grid grid-cols-2 gap-2">
        {propDefs.map((prop) => {
          const owned = inventory[prop.id];
          const equipped = equippedProp === prop.id;

          return (
            <button
              key={prop.id}
              onClick={() => handleToggle(prop.id)}
              disabled={!owned}
              className={`prop-button group ${equipped ? 'prop-equipped' : ''} ${!owned ? 'prop-locked' : ''}`}
            >
              {/* 锁定标记 */}
              {!owned && (
                <span className="absolute top-1.5 right-1.5 text-xs opacity-30">🔒</span>
              )}

              {/* 装备标记 */}
              {equipped && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4A574] rounded-full flex items-center justify-center -mt-0.5 -mr-0.5">
                  <span className="text-white text-[8px] leading-none">✓</span>
                </span>
              )}

              {/* 图标 */}
              <span className={`text-2xl mb-1 ${!owned ? 'grayscale' : ''}`}>
                {prop.icon}
              </span>

              {/* 名称 */}
              <span className="text-xs font-medium text-[#2D2420] mb-0.5">
                {prop.name}
              </span>

              {/* 描述 */}
              <span className="text-[10px] text-[#9B8B7A] leading-tight text-center mb-1">
                {prop.description.slice(0, 12)}...
              </span>

              {/* 装备代价或状态 */}
              {owned ? (
                equipped ? (
                  <span className="text-[10px] text-[#D4A574] font-medium">● 装备中</span>
                ) : (
                  <span className="text-[10px] text-[#6B9C6E] font-medium">点击装备</span>
                )
              ) : (
                <span className="text-[10px] text-[#C4B8A8]">尚未获得</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 健康状态条 */}
      <div className="mt-3 pt-3 border-t border-[#F0E8DD]">
        <div className="flex items-center justify-between text-[10px] text-[#9B8B7A] mb-1">
          <span>今日健康衰减估算</span>
          <span className={`font-mono font-medium ${drainBonus}`}>
            {currentProp ? `-${Math.max(0, 5 - currentProp.protection)} ~ -${Math.max(0, 9 - currentProp.protection)}` : '-5 ~ -9'}
          </span>
        </div>

        {/* 反馈消息 */}
        {message ? (
          <p className="text-[11px] text-[#6B9C6E] leading-relaxed animate-fade-in">{message}</p>
        ) : (
          <p className="text-[10px] text-[#C4B8A8] leading-relaxed">
            {equippedProp
              ? `${currentProp?.description}`
              : '选择已获得的道具装备，降低每日健康衰减'}
          </p>
        )}
      </div>
    </div>
  );
}
