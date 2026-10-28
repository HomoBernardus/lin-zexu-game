'use client';

import { useState } from 'react';
import { GameEvent, Choice } from '@/types/game';
import { useGameStore } from '@/hooks/useGameState';

interface EventCardProps {
  event: GameEvent;
  onComplete: () => void;
}

export default function EventCard({ event, onComplete }: EventCardProps) {
  const [selected, setSelected] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { applyChoice } = useGameStore();

  const handleChoice = (choice: Choice) => {
    setAnimating(true);
    applyChoice(choice, event);
    setTimeout(() => {
      setSelected(true);
      setAnimating(false);
    }, 400);
  };

  const weekNames = ['', '第一周', '第二周', '第三周', '第四周'];
  const phaseMap: Record<string, string> = { morning: '晨', noon: '午', afternoon: '暮', evening: '晚', night: '夜' };

  if (selected) {
    return (
      <div className="event-card text-center animate-fade-in">
        <p className="text-[#9B8B7A] mb-7 text-sm md:text-base">这一天结束了。新的选择在明天等你。</p>
        <button onClick={onComplete} className="btn-primary">
          继续
        </button>
      </div>
    );
  }

  return (
    <div className={`event-card ${animating ? 'opacity-40 scale-[0.98]' : ''}`}>
      {/* 元数据行 */}
      <div className="flex items-center gap-2 mb-4 text-xs text-[#C4B8A8]">
        <span className="text-[#8B7355] font-medium">{weekNames[event.week]}</span>
        <span>·</span>
        <span>第 {event.day} 天</span>
        <span>·</span>
        <span>{phaseMap[event.phase] ?? event.phase}</span>
      </div>

      {/* 标题 */}
      <h2 className="text-xl md:text-2xl font-serif text-[#2D2420] mb-4">{event.title}</h2>

      {/* 描述 */}
      <p className="text-sm md:text-base text-[#5C554D] leading-relaxed mb-6">
        {event.description}
      </p>

      {/* 选项 */}
      <div className="space-y-2.5">
        {event.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice)}
            className="choice-button"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
