import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/pages/Index';
import Icon from '@/components/ui/icon';

interface Hero {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  expNeeded: number;
  level: number;
  image: string;
}

interface Enemy {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  type: 'demon' | 'undead' | 'beast' | 'shadow';
  emoji: string;
  color: string;
}

interface LogEntry {
  id: number;
  text: string;
  type: 'hero' | 'enemy' | 'combo' | 'system';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const ENEMIES_BY_LEVEL: Enemy[] = [
  { name: 'Теневой Гоблин', title: 'Прислужник Тьмы', hp: 80, maxHp: 80, type: 'shadow', emoji: '👺', color: '#7c3aed' },
  { name: 'Костяной Рыцарь', title: 'Страж Некрополя', hp: 140, maxHp: 140, type: 'undead', emoji: '💀', color: '#6b7280' },
  { name: 'Адский Пёс', title: 'Слуга Инферно', hp: 120, maxHp: 120, type: 'demon', emoji: '🐺', color: '#dc2626' },
  { name: 'Теневой Колдун', title: 'Мастер Иллюзий', hp: 160, maxHp: 160, type: 'shadow', emoji: '🧙', color: '#7c3aed' },
  { name: 'Демон Хаоса', title: 'Вестник Апокалипсиса', hp: 200, maxHp: 200, type: 'demon', emoji: '👿', color: '#b91c1c' },
];

const getEnemy = (level: number): Enemy => {
  const base = ENEMIES_BY_LEVEL[(level - 1) % ENEMIES_BY_LEVEL.length];
  const scale = 1 + (level - 1) * 0.3;
  const hp = Math.round(base.maxHp * scale);
  return { ...base, hp, maxHp: hp };
};

interface Props {
  level: number;
  gameState: GameState;
  onVictory: () => void;
  onDefeat: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

let damageCounter = 0;

export default function GameScreen({ level, gameState, onVictory, onDefeat, onRestart, onMenu }: Props) {
  const [warrior, setWarrior] = useState<Hero>({
    name: 'Кайрос', title: 'Страж Теней',
    hp: 120, maxHp: 120, mp: 60, maxMp: 60,
    exp: 0, expNeeded: 100, level: 1,
    image: 'https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/4e0077fd-db5c-4751-8973-995b8f56767d.jpg',
  });
  const [fox, setFox] = useState<Hero>({
    name: 'Лирэн', title: 'Дух Рассвета',
    hp: 90, maxHp: 90, mp: 80, maxMp: 80,
    exp: 0, expNeeded: 100, level: 1,
    image: 'https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/653e4bf5-316c-474c-978f-63d1ea92a503.jpg',
  });

  const [enemy, setEnemy] = useState<Enemy>(() => getEnemy(level));
  const [log, setLog] = useState<LogEntry[]>([{ id: 0, text: `Глава ${level}: встреча с врагом!`, type: 'system' }]);
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [heroShake, setHeroShake] = useState<'warrior' | 'fox' | null>(null);
  const [comboCharge, setComboCharge] = useState(0);
  const [comboCooldown, setComboCooldown] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [damageTexts, setDamageTexts] = useState<{ id: number; value: number; x: number; y: number; color: string; isHeal?: boolean }[]>([]);
  const [attackerPos, setAttackerPos] = useState<'warrior' | 'fox' | null>(null);
  const [warriorAttacking, setWarriorAttacking] = useState(false);
  const [foxAttacking, setFoxAttacking] = useState(false);
  const [enemyRecoil, setEnemyRecoil] = useState(false);
  const [screenFlash, setScreenFlash] = useState<string | null>(null);
  const [comboActive, setComboActive] = useState(false);
  const [floatingRunes, setFloatingRunes] = useState<{ id: number; x: number; y: number; rune: string; color: string }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setEnemy(getEnemy(level));
    addLog(`Глава ${level}: ${getEnemy(level).name} появился!`, 'system');
  }, [level]);

  // Ambient particle loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingRunes(prev => {
        const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚷ', 'ᚹ', 'ᛁ', 'ᛊ'];
        const colors = ['rgba(168,85,247,0.3)', 'rgba(200,168,75,0.25)', 'rgba(99,102,241,0.3)'];
        const newRune = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: 90 + Math.random() * 10,
          rune: runes[Math.floor(Math.random() * runes.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
        };
        return [...prev.filter(r => r.id > Date.now() - 3000), newRune];
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const addLog = (text: string, type: LogEntry['type']) => {
    setLog(prev => [...prev.slice(-6), { id: Date.now() + Math.random(), text, type }]);
  };

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: ++damageCounter * 1000 + i,
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      color,
      size: 3 + Math.random() * 5,
      life: 1,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
    }, 800);
  };

  const showDamageText = (value: number, x: number, y: number, color: string, isHeal = false) => {
    const id = ++damageCounter;
    setDamageTexts(prev => [...prev, { id, value, x, y, color, isHeal }]);
    setTimeout(() => setDamageTexts(prev => prev.filter(d => d.id !== id)), 1100);
  };

  const flashScreen = (color: string) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), 300);
  };

  const enemyAttack = useCallback(() => {
    const dmg = Math.round(10 + Math.random() * 15 + (level - 1) * 3);
    const target = Math.random() > 0.5 ? 'warrior' : 'fox';
    setHeroShake(target);
    flashScreen('rgba(220,38,38,0.15)');
    setTimeout(() => setHeroShake(null), 500);

    spawnParticles(target === 'warrior' ? 20 : 30, 55, '#ef4444', 8);
    showDamageText(dmg, target === 'warrior' ? 15 : 28, 40, '#ff6b6b');

    if (target === 'warrior') {
      setWarrior(prev => {
        const newHp = Math.max(0, prev.hp - dmg);
        if (newHp === 0) setTimeout(() => onDefeat(), 500);
        return { ...prev, hp: newHp };
      });
    } else {
      setFox(prev => {
        const newHp = Math.max(0, prev.hp - dmg);
        if (newHp === 0) setTimeout(() => onDefeat(), 500);
        return { ...prev, hp: newHp };
      });
    }

    addLog(`${enemy.emoji} ${enemy.name} атакует ${target === 'warrior' ? warrior.name : fox.name} на ${dmg} урона!`, 'enemy');
    setIsEnemyTurn(false);
    setStatusMessage('');
  }, [enemy, warrior.name, fox.name, level, onDefeat]);

  const doAttack = (type: 'slash' | 'magic' | 'arcane' | 'heal') => {
    if (isEnemyTurn) return;

    let dmg = 0;
    let mpCost = 0;
    let logText = '';

    switch (type) {
      case 'slash':
        dmg = Math.round(18 + Math.random() * 12 + warrior.level * 3);
        logText = `⚔️ ${warrior.name}: Удар Теней — ${dmg} урона!`;
        setComboCharge(prev => Math.min(100, prev + 25));
        setWarriorAttacking(true);
        setTimeout(() => setWarriorAttacking(false), 500);
        flashScreen('rgba(200,168,75,0.1)');
        spawnParticles(72, 35, '#c8a84b', 10);
        showDamageText(dmg, 65, 25, '#f0d080');
        break;

      case 'magic':
        mpCost = 20;
        if (warrior.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        dmg = Math.round(28 + Math.random() * 18 + warrior.level * 4);
        logText = `🌑 ${warrior.name}: Разрыв Теней — ${dmg} урона!`;
        setComboCharge(prev => Math.min(100, prev + 35));
        setWarrior(prev => ({ ...prev, mp: prev.mp - mpCost }));
        setWarriorAttacking(true);
        setTimeout(() => setWarriorAttacking(false), 600);
        flashScreen('rgba(107,33,168,0.2)');
        spawnParticles(72, 35, '#a855f7', 18);
        spawnParticles(65, 45, '#7c3aed', 10);
        showDamageText(dmg, 60, 20, '#c084fc');
        break;

      case 'arcane':
        mpCost = 25;
        if (fox.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        dmg = Math.round(32 + Math.random() * 20 + fox.level * 4);
        logText = `✨ ${fox.name}: Лисий Огонь — ${dmg} урона!`;
        setComboCharge(prev => Math.min(100, prev + 35));
        setFox(prev => ({ ...prev, mp: prev.mp - mpCost }));
        setFoxAttacking(true);
        setTimeout(() => setFoxAttacking(false), 600);
        flashScreen('rgba(251,191,36,0.12)');
        spawnParticles(72, 35, '#f59e0b', 20);
        spawnParticles(68, 28, '#fbbf24', 8);
        showDamageText(dmg, 63, 18, '#fbbf24');
        break;

      case 'heal': {
        mpCost = 20;
        if (fox.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        const healAmt = Math.round(20 + Math.random() * 15 + fox.level * 2);
        logText = `💚 ${fox.name}: Исцеление Духа — +${healAmt} HP!`;
        setWarrior(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmt) }));
        setFox(prev => ({ ...prev, mp: prev.mp - mpCost }));
        setFoxAttacking(true);
        setTimeout(() => setFoxAttacking(false), 500);
        flashScreen('rgba(74,222,128,0.1)');
        spawnParticles(18, 40, '#4ade80', 14);
        showDamageText(healAmt, 12, 30, '#4ade80', true);
        addLog(logText, 'hero');
        setIsEnemyTurn(true);
        setStatusMessage(`${enemy.emoji} ${enemy.name} готовится к ответу...`);
        setTimeout(enemyAttack, 1300);
        return;
      }
    }

    setEnemyRecoil(true);
    setTimeout(() => setEnemyRecoil(false), 500);
    addLog(logText, 'hero');

    setEnemy(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        gainExp(40 + level * 15);
        setTimeout(() => onVictory(), 700);
      }
      return { ...prev, hp: newHp };
    });

    if (enemy.hp - dmg > 0) {
      setIsEnemyTurn(true);
      setStatusMessage(`${enemy.emoji} ${enemy.name} готовится к ответу...`);
      setTimeout(enemyAttack, 1300);
    }
  };

  const doComboAttack = () => {
    if (comboCooldown || comboCharge < 100 || isEnemyTurn) return;
    const dmg = Math.round(80 + Math.random() * 50 + (warrior.level + fox.level) * 8);

    setComboActive(true);
    setTimeout(() => setComboActive(false), 1000);
    setWarriorAttacking(true);
    setFoxAttacking(true);
    setTimeout(() => { setWarriorAttacking(false); setFoxAttacking(false); }, 700);

    flashScreen('rgba(200,168,75,0.3)');
    setTimeout(() => flashScreen('rgba(168,85,247,0.25)'), 200);
    setTimeout(() => flashScreen('rgba(200,168,75,0.2)'), 400);

    spawnParticles(70, 35, '#f0d080', 25);
    spawnParticles(65, 30, '#a855f7', 20);
    spawnParticles(75, 40, '#fbbf24', 15);
    setTimeout(() => spawnParticles(68, 25, '#c084fc', 18), 150);

    showDamageText(dmg, 55, 15, '#f0d080');
    setTimeout(() => showDamageText(Math.round(dmg * 0.3), 70, 30, '#a855f7'), 200);

    addLog(`🔥✨ СОВМЕСТНАЯ АТАКА: ${warrior.name} и ${fox.name} — ${dmg} сокрушительного урона!`, 'combo');
    setComboCharge(0);
    setComboCooldown(true);
    setTimeout(() => setComboCooldown(false), 4000);

    setEnemyRecoil(true);
    setTimeout(() => setEnemyRecoil(false), 700);

    setEnemy(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        gainExp(80 + level * 20);
        setTimeout(() => onVictory(), 800);
      }
      return { ...prev, hp: newHp };
    });
  };

  const gainExp = (amount: number) => {
    setWarrior(prev => {
      const newExp = prev.exp + amount;
      if (newExp >= prev.expNeeded) {
        const newLevel = prev.level + 1;
        addLog(`⭐ ${prev.name} достиг ${newLevel} уровня!`, 'system');
        return { ...prev, exp: newExp - prev.expNeeded, level: newLevel, maxHp: prev.maxHp + 20, hp: prev.maxHp + 20, expNeeded: prev.expNeeded + 50 };
      }
      return { ...prev, exp: newExp };
    });
    setFox(prev => {
      const newExp = prev.exp + Math.round(amount * 0.8);
      if (newExp >= prev.expNeeded) {
        const newLevel = prev.level + 1;
        addLog(`⭐ ${prev.name} достигла ${newLevel} уровня!`, 'system');
        return { ...prev, exp: newExp - prev.expNeeded, level: newLevel, maxMp: prev.maxMp + 15, mp: prev.maxMp + 15, expNeeded: prev.expNeeded + 50 };
      }
      return { ...prev, exp: newExp };
    });
  };

  const isOver = gameState === 'victory' || gameState === 'defeat';
  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div className="min-h-screen flex flex-col relative z-10 p-3 md:p-5 max-w-4xl mx-auto">
      {/* Screen flash */}
      {screenFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none transition-opacity" style={{ background: screenFlash }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onMenu} className="font-cinzel text-xs text-purple-400/60 hover:text-purple-300 transition-colors flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> МЕНЮ
        </button>
        <div className="font-cinzel text-sm text-gold/80 tracking-widest glow-gold">
          ✦ ГЛАВА {level} ✦
        </div>
        <div className="font-cinzel text-xs text-purple-400/60 tracking-wider">
          ᚠ {level * 100}
        </div>
      </div>

      {/* 3D Battle Arena */}
      <div
        className="relative rounded-xl overflow-hidden mb-4"
        style={{
          minHeight: '300px',
          backgroundImage: `url(https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/c109ce20-ff2b-4a20-8912-8e3eea24702a.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          perspective: '800px',
        }}
      >
        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0d0618]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0618]/40 via-transparent to-[#0d0618]/40" />

        {/* Animated ground glow */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(107,33,168,0.3) 0%, transparent 70%)' }} />

        {/* Floating runes in battle area */}
        {floatingRunes.map(r => (
          <div
            key={r.id}
            className="absolute font-cinzel text-sm pointer-events-none"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              color: r.color,
              animation: 'particle-float 3s ease-out forwards',
            }}
          >
            {r.rune}
          </div>
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particle-float 0.8s ease-out forwards`,
            }}
          />
        ))}

        {/* Damage texts */}
        {damageTexts.map(d => (
          <div
            key={d.id}
            className="absolute font-cinzel font-black pointer-events-none z-30 animate-damage-float"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: d.isHeal ? '1.1rem' : '1.4rem',
              color: d.color,
              textShadow: `0 0 15px ${d.color}, 0 0 30px ${d.color}`,
            }}
          >
            {d.isHeal ? `+${d.value}` : `-${d.value}`}
          </div>
        ))}

        {/* === BATTLE STAGE (3D perspective floor) === */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(107,33,168,0.08))',
            transform: 'perspective(200px) rotateX(5deg)',
            transformOrigin: 'bottom center',
          }}
        />

        {/* 3D decorative pillars */}
        <div className="absolute bottom-6 left-8 w-6 opacity-40 pointer-events-none" style={{ transform: 'perspective(300px) rotateY(20deg)' }}>
          <div className="w-6 h-20 bg-gradient-to-b from-purple-800/60 to-purple-900/80 rounded-sm border border-purple-700/30" />
          <div className="w-8 h-2 bg-purple-700/50 rounded-sm -ml-1 -mt-1" />
          <div className="w-8 h-2 bg-purple-700/50 rounded-sm -ml-1 mt-16" />
        </div>
        <div className="absolute bottom-6 right-8 w-6 opacity-40 pointer-events-none" style={{ transform: 'perspective(300px) rotateY(-20deg)' }}>
          <div className="w-6 h-20 bg-gradient-to-b from-red-900/60 to-red-950/80 rounded-sm border border-red-800/30" />
          <div className="w-8 h-2 bg-red-800/50 rounded-sm -ml-1 -mt-1" />
          <div className="w-8 h-2 bg-red-800/50 rounded-sm -ml-1 mt-16" />
        </div>

        {/* 3D Magical orbs floating */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-6 pointer-events-none">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="rounded-full opacity-60"
              style={{
                width: 8 + i * 4,
                height: 8 + i * 4,
                background: `radial-gradient(circle at 30% 30%, ${i === 0 ? '#c084fc' : i === 1 ? '#60a5fa' : '#f0d080'}, transparent)`,
                boxShadow: `0 0 ${12 + i * 8}px ${i === 0 ? '#a855f7' : i === 1 ? '#3b82f6' : '#c8a84b'}`,
                animation: `float ${2 + i * 0.7}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Combo flash ring */}
        {comboActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-64 h-64 rounded-full border-4 border-gold animate-magic-burst opacity-80" />
            <div className="absolute w-48 h-48 rounded-full border-2 border-purple-400 animate-magic-burst opacity-60" style={{ animationDelay: '0.1s' }} />
          </div>
        )}

        {/* === HEROES (left side) 3D cards === */}
        <div className="absolute bottom-6 left-10 flex gap-4 items-end">
          {/* Warrior */}
          <div
            className="relative transition-all duration-300"
            style={{
              transform: warriorAttacking
                ? 'translateX(60px) translateY(-15px) rotateY(-15deg) scale(1.1)'
                : heroShake === 'warrior'
                ? `translateX(${Math.sin(Date.now() / 50) * 8}px) rotateZ(-3deg)`
                : 'translateX(0) rotateY(5deg) scale(1)',
              transformStyle: 'preserve-3d',
              filter: warriorAttacking ? 'drop-shadow(0 0 20px rgba(200,168,75,0.9))' : 'drop-shadow(0 0 10px rgba(168,85,247,0.5))',
            }}
          >
            {/* 3D card shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-purple-900/40 rounded-full blur-md" />
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-cover bg-center border-2 border-purple-500/60"
              style={{
                backgroundImage: `url(${warrior.image})`,
                boxShadow: warriorAttacking
                  ? '0 0 30px rgba(200,168,75,0.8), 0 0 60px rgba(200,168,75,0.4), inset 0 0 20px rgba(200,168,75,0.2)'
                  : '0 0 20px rgba(168,85,247,0.5), 4px 4px 0 rgba(0,0,0,0.5)',
                transform: 'rotateY(5deg)',
              }}
            />
            {/* MP glow ring when attacking */}
            {warriorAttacking && (
              <div className="absolute inset-0 rounded-xl border-2 border-gold/80 animate-pulse-glow" />
            )}
            <div className="font-cinzel text-xs text-purple-300/80 text-center mt-1" style={{ fontSize: '9px' }}>
              {warrior.name} · {warrior.level}ур
            </div>
          </div>

          {/* Fox */}
          <div
            className="relative transition-all duration-300"
            style={{
              transform: foxAttacking
                ? 'translateX(50px) translateY(-20px) rotateY(-10deg) scale(1.1)'
                : heroShake === 'fox'
                ? 'rotateZ(-3deg) translateX(-4px)'
                : 'rotateY(5deg) scale(1)',
              transformStyle: 'preserve-3d',
              filter: foxAttacking ? 'drop-shadow(0 0 20px rgba(251,191,36,0.9))' : 'drop-shadow(0 0 10px rgba(200,168,75,0.4))',
            }}
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-amber-900/40 rounded-full blur-md" />
            <div
              className="w-14 h-14 md:w-18 md:h-18 rounded-xl bg-cover bg-center border-2 border-amber-500/60"
              style={{
                backgroundImage: `url(${fox.image})`,
                width: '60px', height: '60px',
                boxShadow: foxAttacking
                  ? '0 0 30px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.4)'
                  : '0 0 15px rgba(200,168,75,0.4), 4px 4px 0 rgba(0,0,0,0.5)',
                transform: 'rotateY(5deg)',
              }}
            />
            {foxAttacking && (
              <div className="absolute inset-0 rounded-xl border-2 border-amber-400/80 animate-gold-glow" />
            )}
            <div className="font-cinzel text-xs text-amber-300/80 text-center mt-1" style={{ fontSize: '9px' }}>
              {fox.name} · {fox.level}ур
            </div>
          </div>
        </div>

        {/* VS badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="font-cinzel text-xs text-gold/40 tracking-widest">✦VS✦</div>
        </div>

        {/* === ENEMY (right side) 3D === */}
        <div
          className="absolute bottom-4 right-8 text-center transition-all duration-300"
          style={{
            transform: enemyRecoil
              ? 'translateX(20px) rotateY(20deg) scale(0.92)'
              : 'rotateY(-8deg) scale(1)',
            transformStyle: 'preserve-3d',
            filter: `drop-shadow(0 0 20px ${enemy.color}88)`,
          }}
        >
          {/* Enemy 3D platform */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full opacity-60"
            style={{ background: `radial-gradient(ellipse, ${enemy.color}50, transparent)`, filter: 'blur(4px)' }}
          />

          {/* Enemy body */}
          <div
            className="text-6xl md:text-7xl mb-1 select-none"
            style={{
              animation: 'float 2.5s ease-in-out infinite',
              filter: `drop-shadow(0 0 15px ${enemy.color}) drop-shadow(0 0 30px ${enemy.color}66)`,
              transform: `rotateY(-8deg)`,
            }}
          >
            {enemy.emoji}
          </div>

          {/* Enemy name plate — 3D style */}
          <div
            className="px-3 py-1 rounded mb-1 mx-auto"
            style={{
              background: `linear-gradient(135deg, ${enemy.color}30, rgba(13,6,24,0.8))`,
              border: `1px solid ${enemy.color}50`,
              boxShadow: `0 4px 12px ${enemy.color}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
              transform: 'perspective(200px) rotateX(5deg)',
            }}
          >
            <div className="font-cinzel text-xs font-bold tracking-wide" style={{ color: enemy.color }}>
              {enemy.name}
            </div>
            <div className="font-cormorant text-xs italic" style={{ color: `${enemy.color}80` }}>
              {enemy.title}
            </div>
          </div>

          {/* HP bar */}
          <div className="w-28 mx-auto">
            <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-red-900/40"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
              <div
                className="hp-bar h-full rounded-full transition-all duration-500"
                style={{ width: `${enemyHpPct}%` }}
              />
            </div>
            <div className="font-cinzel text-xs text-red-300/60 mt-0.5">{enemy.hp}/{enemy.maxHp}</div>
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 font-cormorant text-sm text-red-200/80 italic bg-black/50 px-4 py-1 rounded-full border border-red-900/30 backdrop-blur-sm">
            {statusMessage}
          </div>
        )}

        {/* Victory overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/60 backdrop-blur-sm">
            <div className="text-center animate-scale-in">
              <div className="text-7xl mb-3" style={{ filter: 'drop-shadow(0 0 20px gold)' }}>✨</div>
              <h2 className="font-cinzel text-4xl text-gold glow-gold tracking-widest">ПОБЕДА!</h2>
              <p className="font-cormorant text-lg text-purple-200/70 italic mt-2">Следующая глава открывается...</p>
            </div>
          </div>
        )}

        {/* Defeat overlay */}
        {gameState === 'defeat' && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-sm">
            <div className="text-center animate-scale-in">
              <div className="text-7xl mb-3" style={{ filter: 'drop-shadow(0 0 20px #dc2626)' }}>💀</div>
              <h2 className="font-cinzel text-4xl text-red-400 tracking-widest">ПОРАЖЕНИЕ</h2>
              <p className="font-cormorant text-lg text-purple-200/50 italic mt-2">Тьма поглотила героев...</p>
              <div className="flex gap-4 mt-5 justify-center">
                <button onClick={onRestart} className="skill-btn font-cinzel text-sm px-6 py-2.5 text-purple-200 rounded-lg">
                  СНОВА
                </button>
                <button onClick={onMenu} className="combo-btn font-cinzel text-sm px-6 py-2.5 text-[#0d0618] font-bold rounded-lg">
                  МЕНЮ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero stats — 3D cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <HeroStats hero={warrior} color="purple" />
        <HeroStats hero={fox} color="gold" />
      </div>

      {/* Battle log */}
      <div
        className="rounded-lg p-3 mb-3 h-24 overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(13,6,24,0.8), rgba(26,10,46,0.6))',
          border: '1px solid rgba(107,33,168,0.2)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
        }}
      >
        {log.map(entry => (
          <p key={entry.id} className={`font-cormorant text-sm leading-snug mb-0.5 ${
            entry.type === 'combo' ? 'text-gold glow-gold font-bold text-base' :
            entry.type === 'enemy' ? 'text-red-300/80' :
            entry.type === 'system' ? 'text-purple-300/70 italic' :
            'text-purple-100/80'
          }`}>
            {entry.text}
          </p>
        ))}
      </div>

      {/* Skills */}
      {!isOver && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <SkillButton icon="Sword" label="Удар" sublabel={warrior.name} disabled={isEnemyTurn} onClick={() => doAttack('slash')} color="purple" />
            <SkillButton icon="Zap" label="Разрыв" sublabel="20 MP" disabled={isEnemyTurn || warrior.mp < 20} onClick={() => doAttack('magic')} color="purple" />
            <SkillButton icon="Flame" label="Огонь" sublabel="25 MP" disabled={isEnemyTurn || fox.mp < 25} onClick={() => doAttack('arcane')} color="gold" />
            <SkillButton icon="Heart" label="Лечение" sublabel="20 MP" disabled={isEnemyTurn || fox.mp < 20} onClick={() => doAttack('heal')} color="gold" />
          </div>

          {/* Combo button — 3D */}
          <button
            onClick={doComboAttack}
            disabled={comboCharge < 100 || comboCooldown || isEnemyTurn}
            className="w-full py-3 rounded-xl relative overflow-hidden transition-all duration-200"
            style={{
              background: comboCharge >= 100
                ? 'linear-gradient(135deg, rgba(200,168,75,0.35), rgba(107,33,168,0.4), rgba(200,168,75,0.25))'
                : 'linear-gradient(135deg, rgba(200,168,75,0.1), rgba(30,10,50,0.8))',
              border: comboCharge >= 100 ? '1px solid rgba(200,168,75,0.7)' : '1px solid rgba(200,168,75,0.2)',
              boxShadow: comboCharge >= 100 ? '0 0 25px rgba(200,168,75,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
              transform: comboCharge >= 100 && !comboCooldown ? 'scale(1.01)' : 'scale(1)',
              opacity: (comboCooldown || isEnemyTurn) && comboCharge < 100 ? 0.45 : 1,
            }}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-lg">{comboCharge >= 100 ? '🔥' : '⚔️'}</span>
              <div>
                <p className="font-cinzel text-sm text-gold-light font-bold tracking-wider">
                  СОВМЕСТНАЯ АТАКА
                </p>
                <p className="font-cormorant text-xs text-gold/50 italic">
                  Кайрос & Лирэн — скоординированный удар
                </p>
              </div>
              <span className="text-lg">{comboCharge >= 100 ? '✨' : '💫'}</span>
            </div>
            {/* Charge indicator */}
            <div className="absolute bottom-0 left-0 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${comboCharge}%`,
                background: comboCharge >= 100
                  ? 'linear-gradient(90deg, #7c3aed, #c8a84b, #a855f7)'
                  : 'linear-gradient(90deg, #6b21a8, #c8a84b)',
                boxShadow: comboCharge >= 100 ? '0 0 10px rgba(200,168,75,0.8)' : 'none',
              }}
            />
            {comboCharge < 100 && (
              <div className="absolute top-1 right-2 font-cinzel text-xs text-gold/30">{comboCharge}%</div>
            )}
            {comboCooldown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                <span className="font-cinzel text-xs text-gold/40">ПЕРЕЗАРЯДКА...</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function HeroStats({ hero, color }: { hero: Hero; color: 'purple' | 'gold' }) {
  const isPurple = color === 'purple';
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: isPurple
          ? 'linear-gradient(135deg, rgba(107,33,168,0.15), rgba(13,6,24,0.8))'
          : 'linear-gradient(135deg, rgba(200,168,75,0.1), rgba(13,6,24,0.8))',
        border: isPurple ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(200,168,75,0.2)',
        boxShadow: isPurple
          ? '0 4px 20px rgba(107,33,168,0.15), inset 0 1px 0 rgba(168,85,247,0.05)'
          : '0 4px 20px rgba(200,168,75,0.1), inset 0 1px 0 rgba(200,168,75,0.05)',
        transform: isPurple ? 'perspective(400px) rotateY(2deg)' : 'perspective(400px) rotateY(-2deg)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className={`font-cinzel text-xs font-bold ${isPurple ? 'text-purple-300' : 'text-gold'}`}>{hero.name}</p>
          <p className="font-cormorant text-xs italic" style={{ color: isPurple ? 'rgba(168,85,247,0.5)' : 'rgba(200,168,75,0.5)' }}>
            {hero.title} · Ур.{hero.level}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: `url(${hero.image})`,
            border: isPurple ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(200,168,75,0.4)',
            boxShadow: isPurple ? '0 0 8px rgba(168,85,247,0.3)' : '0 0 8px rgba(200,168,75,0.3)',
          }}
        />
      </div>
      <StatBar label="HP" value={hero.hp} max={hero.maxHp} barClass="hp-bar" />
      <StatBar label="MP" value={hero.mp} max={hero.maxMp} barClass="mp-bar" />
      <StatBar label="EXP" value={hero.exp} max={hero.expNeeded} barClass="exp-bar" />
    </div>
  );
}

function StatBar({ label, value, max, barClass }: { label: string; value: number; max: number; barClass: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="font-cinzel text-purple-400/40" style={{ fontSize: '9px', width: '20px' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)' }}>
        <div className={`${barClass} h-full rounded-full`} style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
      </div>
      <span className="font-cormorant text-purple-300/30" style={{ fontSize: '10px', width: '52px', textAlign: 'right' }}>{value}/{max}</span>
    </div>
  );
}

function SkillButton({ icon, label, sublabel, disabled, onClick, color }: {
  icon: string; label: string; sublabel: string; disabled: boolean; onClick: () => void; color: 'purple' | 'gold';
}) {
  const isPurple = color === 'purple';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all duration-150"
      style={{
        background: isPurple
          ? 'linear-gradient(135deg, rgba(107,33,168,0.35), rgba(30,10,50,0.9))'
          : 'linear-gradient(135deg, rgba(200,168,75,0.2), rgba(30,10,50,0.9))',
        border: isPurple ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(200,168,75,0.35)',
        boxShadow: isPurple ? '0 2px 8px rgba(107,33,168,0.2), inset 0 1px 0 rgba(168,85,247,0.05)' : '0 2px 8px rgba(200,168,75,0.1)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: disabled ? 'none' : 'perspective(200px) rotateX(5deg)',
      }}
    >
      <Icon name={icon} fallback="Zap" size={15} className={isPurple ? 'text-purple-400' : 'text-amber-400'} />
      <span className={`font-cinzel font-bold ${isPurple ? 'text-purple-200' : 'text-amber-300'}`} style={{ fontSize: '10px' }}>{label}</span>
      <span className="font-cormorant text-purple-400/40" style={{ fontSize: '10px' }}>{sublabel}</span>
    </button>
  );
}
