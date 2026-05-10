'use client';

import { useState, useEffect, ReactNode } from 'react';

interface CollapsibleSectionProps {
  icon: string;
  title: string;
  badge?: string;
  children: ReactNode;
}

export default function CollapsibleSection({ icon, title, badge, children }: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = () => setCollapsed(!collapsed);

  return (
    <div className="lg:pointer-events-auto">
      {/* 收起的标题栏（仅移动端） */}
      {isMobile && (
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#EBE5DD] shadow-sm active:bg-[#FDF9F5] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{icon}</span>
            <span className="text-sm font-serif text-[#2D2420]">{title}</span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FDF9F5] text-[#D4A574] border border-[#F0E8DD]">
                {badge}
              </span>
            )}
          </div>
          <span className={`text-[11px] text-[#C4B8A8] transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}>
            ▼
          </span>
        </button>
      )}

      {/* 内容区 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isMobile
            ? collapsed
              ? 'max-h-0 opacity-0 mt-0'
              : 'max-h-[800px] opacity-100 mt-3'
            : 'max-h-none opacity-100'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
