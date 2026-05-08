import { useState, useEffect } from 'react';

interface Props {
  onStart: () => void;
}

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];

export default function MainMenu({ onStart }: Props) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; rune: string }[]>([]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const interval = setInterval(() => {
      setParticles(prev => {
        const filtered = prev.filter(p => p.id > Date.now() - 2000);
        return [...filtered, {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          rune: RUNES[Math.floor(Math.random() * RUNES.length)]
        }];
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Floating runes */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed text-purple-500/30 text-2xl font-cinzel pointer-events-none particle"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.rune}
        </div>
      ))}

      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/c109ce20-ff2b-4a20-8912-8e3eea24702a.jpg)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d0618]/70 via-transparent to-[#0d0618]/90" />

      <div className={`relative z-10 text-center transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Decorative top rune line */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-purple-500/60" />
          <span className="text-purple-400/70 text-lg font-cinzel">ᚠ ᚢ ᚦ</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-purple-500/60" />
        </div>

        <h1 className="font-cinzel text-6xl md:text-8xl font-black text-gold-light glow-gold mb-2 tracking-widest">
          ТЕНЕВЫЕ
        </h1>
        <h1 className="font-cinzel text-6xl md:text-8xl font-black text-gold glow-gold mb-6 tracking-widest">
          ХРОНИКИ
        </h1>

        <p className="font-cormorant text-xl md:text-2xl text-purple-200/70 italic mb-12 max-w-md mx-auto leading-relaxed">
          Древнее зло пробудилось. Только союз воина и лиса-духа способен остановить тьму.
        </p>

        {/* Characters preview */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="text-center animate-float" style={{ animationDelay: '0s' }}>
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-cover bg-center mx-auto mb-2 rune-border animate-pulse-glow"
              style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/4e0077fd-db5c-4751-8973-995b8f56767d.jpg)` }}
            />
            <p className="font-cinzel text-sm text-gold-light/80">КАЙРОС</p>
            <p className="font-cormorant text-xs text-purple-300/60 italic">Страж Теней</p>
          </div>
          <div className="flex items-center">
            <span className="text-4xl text-gold/60 font-cinzel">&</span>
          </div>
          <div className="text-center animate-float" style={{ animationDelay: '1.5s' }}>
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-cover bg-center mx-auto mb-2 gold-border animate-gold-glow"
              style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/653e4bf5-316c-474c-978f-63d1ea92a503.jpg)` }}
            />
            <p className="font-cinzel text-sm text-gold-light/80">ЛИРЭН</p>
            <p className="font-cormorant text-xs text-purple-300/60 italic">Дух Рассвета</p>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="relative group font-cinzel text-xl tracking-widest px-12 py-4 text-[#0d0618] font-bold transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #f0d080, #c8a84b, #8b6914)',
            boxShadow: '0 0 30px rgba(200,168,75,0.4), 0 0 60px rgba(200,168,75,0.2)',
            clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
          }}
        >
          <span className="relative z-10">НАЧАТЬ СТРАНСТВИЕ</span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" style={{ clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)' }} />
        </button>

        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/40" />
          <span className="text-purple-400/40 text-xs font-cinzel tracking-widest">ГЛАВА I</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/40" />
        </div>
      </div>
    </div>
  );
}
