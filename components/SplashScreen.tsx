'use client';

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    setVisible(false);
    setTimeout(() => {
      setStep(1);
      setVisible(true);
    }, 500);
  };

  const handleStart = () => {
    setLeaving(true);
    setTimeout(onStart, 600);
  };

  if (step === 0) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#F5F0EA] transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-lg w-full px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-serif text-[#2D2420] tracking-[0.15em] mb-2">
            林则徐
          </h1>
          <p className="text-lg md:text-xl font-serif text-[#8B7355] tracking-[0.3em] mb-16">
            都市销烟录
          </p>

          <p className="text-base md:text-lg text-[#9B8B7A] tracking-[0.2em] mb-16">
            刚者易折，柔者难立<br />
            唯有刚柔并济，方能销烟革新
          </p>

          <button onClick={handleNext} className="btn-primary text-base md:text-lg px-10 py-3">
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#F5F0EA] transition-opacity duration-500 ${
        visible && !leaving ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: leaving ? 'none' : 'auto' }}
    >
      <div className="max-w-lg w-full px-6 text-center">
        {/* 幕间标题 */}
        <p className="text-xs text-[#C4B8A8] tracking-[0.3em] mb-8">序</p>

        {/* 叙事文案 */}
        <div className="text-left space-y-5 mb-12">
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            我姓林，一家不大不小的公司里一个不起眼的白领。
          </p>
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            每天挤地铁打卡，坐在格子间里写文档、开周会、凑绩效。隔壁工位的兄弟一根接一根地抽烟，会议室里永远飘着灰蒙蒙的雾——二手烟熏得我眼睛发酸、胸口发闷，可大家都是这么过的。
          </p>
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            直到那天晚上，我做了一个很长很长的梦。
          </p>
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            梦里有个穿朝服的人站在虎门海滩上，身后是一箱箱被砸碎的鸦片，海风把他的袍角吹得猎猎作响。他转过身来，我看见了和我一模一样的脸。
          </p>
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            醒来之后我就知道，有些事不能再等了。
          </p>
          <p className="text-[#5C554D] leading-relaxed text-sm md:text-base">
            一个月后就是公司年终大会。我要在那之前，从我身边做起，把这片灰色的雾赶出去。不是为了什么伟大的理想——只是觉得，<strong className="text-[#2D2420]">上辈子做过的事，这辈子没道理袖手旁观。</strong>
          </p>
        </div>

        <button onClick={handleStart} className="btn-primary text-base md:text-lg px-10 py-3">
          进入游戏
        </button>
      </div>
    </div>
  );
}
