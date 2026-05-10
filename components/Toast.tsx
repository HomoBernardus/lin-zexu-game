'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameState';

export default function Toast() {
  const notification = useGameStore((s) => s.notification);
  const clearNotification = useGameStore((s) => s.clearNotification);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(clearNotification, 3000);
    return () => clearTimeout(timer);
  }, [notification, clearNotification]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-toast-in pointer-events-none">
      <div className="bg-[#2D2420] text-white rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 max-w-sm">
        <span className="text-2xl">{notification.icon}</span>
        <div>
          <p className="text-xs font-medium text-[#D4A574]">{notification.title}</p>
          <p className="text-sm text-[#EBE5DD] leading-snug mt-0.5">{notification.message}</p>
        </div>
      </div>
    </div>
  );
}
