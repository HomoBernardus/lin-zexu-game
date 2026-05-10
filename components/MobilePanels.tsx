'use client';

import { useState, ReactNode } from 'react';

interface PanelConfig {
  id: string;
  icon: string;
  content: ReactNode;
}

interface MobilePanelsProps {
  panels: PanelConfig[];
}

export default function MobilePanels({ panels }: MobilePanelsProps) {
  const [active, setActive] = useState<string | null>(null);

  const toggle = (id: string) => setActive(active === id ? null : id);

  return (
    <div className="lg:hidden">
      {/* 横向图标栏 */}
      <div className="flex gap-2">
        {panels.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`flex-1 flex items-center justify-center h-11 rounded-xl border transition-all active:scale-95 ${
              active === p.id
                ? 'bg-white border-[#D4A574] shadow-sm'
                : 'bg-white border-[#EBE5DD] shadow-sm'
            }`}
          >
            <span className="text-lg">{p.icon}</span>
          </button>
        ))}
      </div>

      {/* 展开内容 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          active ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        {panels.find(p => p.id === active)?.content}
      </div>
    </div>
  );
}
