'use client';

import { useEffect, useState } from 'react';
import { GameEvent } from '@/types/game';
import { useGameStore } from '@/hooks/useGameState';
import { determineEnding } from '@/lib/gameLogic';
import Dashboard from '@/components/Dashboard';
import EventCard from '@/components/EventCard';
import Garden from '@/components/Garden';
import NPCStatus from '@/components/NPCStatus';
import PropPanel from '@/components/PropPanel';
import EndingScreen from '@/components/EndingScreen';
import SplashScreen from '@/components/SplashScreen';
import Toast from '@/components/Toast';
import MobilePanels from '@/components/MobilePanels';
import { week1Events, week2Events, week3Events, week4Events } from '@/data/events';

const allEvents = [...week1Events, ...week2Events, ...week3Events, ...week4Events];

export default function Home() {
  const { day, completedEvents, activeFlags, gameOver, ending, nextDay, initializeGame, resetGame } = useGameStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    const hasSave = localStorage.getItem('linzexu-game-storage');
    if (!hasSave) initializeGame();
    setGameStarted(true);
  }, []);

  const eventIsAvailable = (e: GameEvent) => {
    const cond = (e as unknown as Record<string, unknown>).conditions as { requiresFlag?: string[] } | undefined;
    if (cond?.requiresFlag) return cond.requiresFlag.every(f => activeFlags.includes(f));
    return true;
  };

  const dayEvents = allEvents.filter(e => e.day === day && eventIsAvailable(e));
  const currentEvent = dayEvents.find(e => !completedEvents.includes(e.id)) ?? null;

  useEffect(() => {
    if (day >= 29 && !gameOver) {
      const store = useGameStore.getState();
      const endingType = determineEnding(store);
      useGameStore.setState({ ending: endingType, gameOver: true });
    }
  }, [day, gameOver]);

  const handleEventComplete = () => {
    const state = useGameStore.getState();
    const remaining = allEvents.filter(
      e => e.day === state.day && eventIsAvailable(e) && !state.completedEvents.includes(e.id)
    );
    if (remaining.length === 0) state.nextDay();
  };

  const handleSkipDay = () => nextDay();

  const handleRestart = () => {
    resetGame();
    setGameStarted(false);
    setShowSplash(true);
    setPageVisible(false);
    setTimeout(() => {
      setGameStarted(true);
    }, 100);
  };

  if (gameOver || ending) {
    return <EndingScreen onRestart={handleRestart} />;
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EA]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#EBE5DD] border-t-[#8B7355] animate-spin mb-4" />
          <p className="text-sm text-[#9B8B7A]">加载中...</p>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onStart={() => { setShowSplash(false); setTimeout(() => setPageVisible(true), 50); }} />;
  }

  return (
    <main className={`game-container transition-opacity duration-500 ${pageVisible ? 'opacity-100' : 'opacity-0'}`}>
      <Toast />
      {/* 标题 */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-serif text-[#2D2420] tracking-wider text-center">
          林则徐 · 都市销烟录
        </h1>
        <p className="text-xs text-[#9B8B7A] mt-1.5 tracking-widest text-center">
          28天 · 决定一家公司的命运
        </p>
      </header>

      {/* 主体布局 */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-5">
        {/* 事件卡片：移动端置顶 */}
        <section className="lg:col-span-2 lg:order-last">
          <div className="animate-fade-in">
            {currentEvent ? (
              <EventCard key={currentEvent.id} event={currentEvent} onComplete={handleEventComplete} />
            ) : (
              <div className="event-card text-center py-10 md:py-16">
                <p className="text-[#2D2420] font-serif text-xl md:text-2xl mb-2">今日无事，岁月静好</p>
                <p className="text-sm text-[#9B8B7A] mb-8">
                  除了工作，没什么特别的事发生。休息一下也是必要的。
                </p>
                <button onClick={handleSkipDay} className="btn-primary">
                  下一天
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 左侧面板 */}
        <aside className="lg:col-span-1">
          {/* 移动端：横向图标 + 可展开 */}
          <MobilePanels
            panels={[
              { id: 'dashboard', icon: '📊', content: <Dashboard /> },
              { id: 'npcs', icon: '👥', content: <NPCStatus /> },
              { id: 'garden', icon: '🌸', content: <Garden /> },
              { id: 'props', icon: '🛡️', content: <PropPanel /> },
            ]}
          />

          {/* 桌面端：完整面板 */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4">
            <div className="animate-fade-in">
              <Dashboard />
            </div>
            <div className="animate-fade-in-delayed">
              <NPCStatus />
            </div>
            <div className="animate-fade-in-delayed">
              <Garden />
            </div>
            <div className="animate-fade-in-delayed">
              <PropPanel />
            </div>
          </div>
        </aside>
      </div>

      {/* 底部 */}
      <footer className="mt-8 md:mt-10 text-center">
        <p className="text-xs text-[#C4B8A8] tracking-widest">
          刚者易折，柔者难立。唯有刚柔并济，方能销烟革新。
        </p>
      </footer>
    </main>
  );
}
