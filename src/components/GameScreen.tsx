import { useState, useEffect, useCallback } from 'react';
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
}

interface LogEntry {
  id: number;
  text: string;
  type: 'hero' | 'enemy' | 'combo' | 'system';
}

interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  color: string;
}

const ENEMIES_BY_LEVEL: Enemy[] = [
  { name: 'Теневой Гоблин', title: 'Прислужник Тьмы', hp: 80, maxHp: 80, type: 'shadow', emoji: '👺' },
  { name: 'Костяной Рыцарь', title: 'Страж Некрополя', hp: 140, maxHp: 140, type: 'undead', emoji: '💀' },
  { name: 'Адский Пёс', title: 'Слуга Инферно', hp: 120, maxHp: 120, type: 'demon', emoji: '🐺' },
  { name: 'Теневой Колдун', title: 'Мастер Иллюзий', hp: 160, maxHp: 160, type: 'shadow', emoji: '🧙' },
  { name: 'Демон Хаоса', title: 'Вестник Апокалипсиса', hp: 200, maxHp: 200, type: 'demon', emoji: '👿' },
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

export default function GameScreen({ level, gameState, onVictory, onDefeat, onRestart, onMenu }: Props) {
  const [warrior, setWarrior] = useState<Hero>({
    name: 'Кайрос',
    title: 'Страж Теней',
    hp: 120,
    maxHp: 120,
    mp: 60,
    maxMp: 60,
    exp: 0,
    expNeeded: 100,
    level: 1,
    image: 'https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/4e0077fd-db5c-4751-8973-995b8f56767d.jpg',
  });

  const [fox, setFox] = useState<Hero>({
    name: 'Лирэн',
    title: 'Дух Рассвета',
    hp: 90,
    maxHp: 90,
    mp: 80,
    maxMp: 80,
    exp: 0,
    expNeeded: 100,
    level: 1,
    image: 'https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/653e4bf5-316c-474c-978f-63d1ea92a503.jpg',
  });

  const [enemy, setEnemy] = useState<Enemy>(() => getEnemy(level));
  const [log, setLog] = useState<LogEntry[]>([{ id: 0, text: `Глава ${level}: встреча с врагом!`, type: 'system' }]);
  const [damages, setDamages] = useState<DamageNumber[]>([]);
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [heroShake, setHeroShake] = useState<'warrior' | 'fox' | null>(null);
  const [comboCharge, setComboCharge] = useState(0);
  const [comboCooldown, setComboCooldown] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setEnemy(getEnemy(level));
    addLog(`Глава ${level}: ${getEnemy(level).name} появился!`, 'system');
  }, [level]);

  const addLog = (text: string, type: LogEntry['type']) => {
    setLog(prev => [...prev.slice(-6), { id: Date.now(), text, type }]);
  };

  const showDamage = (value: number, x: number, y: number, color: string) => {
    const id = Date.now() + Math.random();
    setDamages(prev => [...prev, { id, value, x, y, color }]);
    setTimeout(() => setDamages(prev => prev.filter(d => d.id !== id)), 1000);
  };

  const enemyAttack = useCallback(() => {
    const dmg = Math.round(10 + Math.random() * 15 + (level - 1) * 3);
    const target = Math.random() > 0.5 ? 'warrior' : 'fox';
    setHeroShake(target);
    setTimeout(() => setHeroShake(null), 400);

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
    showDamage(dmg, 25 + Math.random() * 10, 30 + Math.random() * 20, '#ef4444');
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
        break;
      case 'magic':
        mpCost = 20;
        if (warrior.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        dmg = Math.round(28 + Math.random() * 18 + warrior.level * 4);
        logText = `🌑 ${warrior.name}: Разрыв Теней — ${dmg} урона!`;
        setComboCharge(prev => Math.min(100, prev + 35));
        setWarrior(prev => ({ ...prev, mp: prev.mp - mpCost }));
        break;
      case 'arcane':
        mpCost = 25;
        if (fox.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        dmg = Math.round(32 + Math.random() * 20 + fox.level * 4);
        logText = `✨ ${fox.name}: Лисий Огонь — ${dmg} урона!`;
        setComboCharge(prev => Math.min(100, prev + 35));
        setFox(prev => ({ ...prev, mp: prev.mp - mpCost }));
        break;
      case 'heal': {
        mpCost = 20;
        if (fox.mp < mpCost) { addLog('Не хватает маны!', 'system'); return; }
        const healAmt = Math.round(20 + Math.random() * 15 + fox.level * 2);
        logText = `💚 ${fox.name}: Исцеление Духа — +${healAmt} HP!`;
        setWarrior(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmt) }));
        setFox(prev => ({ ...prev, mp: prev.mp - mpCost }));
        showDamage(healAmt, 15, 40, '#4ade80');
        addLog(logText, 'hero');
        setIsEnemyTurn(true);
        setStatusMessage(`${enemy.emoji} ${enemy.name} готовится к ответу...`);
        setTimeout(enemyAttack, 1200);
        return;
      }
    }

    setEnemyShake(true);
    setTimeout(() => setEnemyShake(false), 400);
    showDamage(dmg, 60 + Math.random() * 15, 30 + Math.random() * 20, type === 'magic' || type === 'arcane' ? '#a855f7' : '#f0d080');
    addLog(logText, 'hero');

    setEnemy(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        gainExp(40 + level * 15);
        setTimeout(() => onVictory(), 600);
      }
      return { ...prev, hp: newHp };
    });

    if (enemy.hp - dmg > 0) {
      setIsEnemyTurn(true);
      setStatusMessage(`${enemy.emoji} ${enemy.name} готовится к ответу...`);
      setTimeout(enemyAttack, 1200);
    }
  };

  const doComboAttack = () => {
    if (comboCooldown || comboCharge < 100) return;
    const dmg = Math.round(80 + Math.random() * 50 + (warrior.level + fox.level) * 8);
    addLog(`🔥✨ СОВМЕСТНАЯ АТАКА: ${warrior.name} и ${fox.name} — ${dmg} сокрушительного урона!`, 'combo');
    setComboCharge(0);
    setComboCooldown(true);
    setTimeout(() => setComboCooldown(false), 3000);
    setEnemyShake(true);
    setTimeout(() => setEnemyShake(false), 600);
    showDamage(dmg, 50, 25, '#f0d080');
    setTimeout(() => showDamage(Math.round(dmg * 0.3), 65, 45, '#a855f7'), 200);

    setEnemy(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        gainExp(80 + level * 20);
        setTimeout(() => onVictory(), 600);
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

  return (
    <div className="min-h-screen flex flex-col relative z-10 p-3 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onMenu} className="font-cinzel text-xs text-purple-400/60 hover:text-purple-300 transition-colors flex items-center gap-1">
          <Icon name="ChevronLeft" size={14} /> МЕНЮ
        </button>
        <div className="font-cinzel text-sm text-gold/70 tracking-widest glow-gold">
          ГЛАВА {level}
        </div>
        <div className="font-cinzel text-xs text-purple-400/60 tracking-wider">
          ᚠ {level * 100} МОНЕТ
        </div>
      </div>

      {/* Battle area */}
      <div
        className="relative rounded-lg overflow-hidden mb-4 flex-1 min-h-[240px] flex items-end justify-between px-6 pb-4"
        style={{
          backgroundImage: `url(https://cdn.poehali.dev/projects/7a89d103-b03d-4449-87f8-51925d94695f/files/c109ce20-ff2b-4a20-8912-8e3eea24702a.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#0d0618]/80" />

        {/* Damage numbers */}
        {damages.map(d => (
          <div
            key={d.id}
            className="absolute font-cinzel font-black text-2xl animate-damage-float pointer-events-none z-30"
            style={{ left: `${d.x}%`, top: `${d.y}%`, color: d.color, textShadow: `0 0 10px ${d.color}` }}
          >
            -{d.value}
          </div>
        ))}

        {/* Heroes */}
        <div className="relative z-10 flex gap-3">
          <HeroSprite hero={warrior} isShaking={heroShake === 'warrior'} side="left" />
          <HeroSprite hero={fox} isShaking={heroShake === 'fox'} side="left" />
        </div>

        {/* VS */}
        <div className="relative z-10 font-cinzel text-gold/40 text-lg">VS</div>

        {/* Enemy */}
        <div className={`relative z-10 text-center ${enemyShake ? 'animate-shake' : ''}`}>
          <div className="text-7xl mb-2 animate-float filter drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
            {enemy.emoji}
          </div>
          <div className="font-cinzel text-xs text-red-300/80 tracking-wide">{enemy.name}</div>
          <div className="font-cormorant text-xs text-red-200/50 italic">{enemy.title}</div>
          <div className="mt-1 w-24 h-2 bg-black/50 rounded-full overflow-hidden">
            <div className="hp-bar h-full rounded-full" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
          </div>
          <div className="font-cinzel text-xs text-red-300/70 mt-0.5">{enemy.hp}/{enemy.maxHp}</div>
        </div>

        {/* Status overlay */}
        {statusMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 font-cormorant text-sm text-red-200/80 italic bg-black/40 px-3 py-1 rounded">
            {statusMessage}
          </div>
        )}

        {/* Victory/Defeat overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
            <div className="text-center animate-scale-in">
              <div className="text-6xl mb-2">✨</div>
              <h2 className="font-cinzel text-3xl text-gold glow-gold">ПОБЕДА!</h2>
              <p className="font-cormorant text-purple-200/70 italic mt-1">Следующая глава...</p>
            </div>
          </div>
        )}
        {gameState === 'defeat' && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70">
            <div className="text-center animate-scale-in">
              <div className="text-6xl mb-2">💀</div>
              <h2 className="font-cinzel text-3xl text-red-400">ПОРАЖЕНИЕ</h2>
              <p className="font-cormorant text-purple-200/50 italic mt-1">Тьма поглотила героев...</p>
              <div className="flex gap-3 mt-4 justify-center">
                <button onClick={onRestart} className="skill-btn font-cinzel text-xs px-4 py-2 text-purple-200 rounded">
                  СНАЧАЛА
                </button>
                <button onClick={onMenu} className="combo-btn font-cinzel text-xs px-4 py-2 text-[#0d0618] font-bold rounded">
                  МЕНЮ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <HeroStats hero={warrior} color="purple" />
        <HeroStats hero={fox} color="gold" />
      </div>

      {/* Battle log */}
      <div className="rune-border rounded-lg p-3 mb-4 h-28 overflow-y-auto bg-black/30">
        {log.map(entry => (
          <p key={entry.id} className={`font-cormorant text-sm leading-snug mb-0.5 animate-fade-in ${
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
          {/* Individual skills */}
          <div className="grid grid-cols-4 gap-2">
            <SkillButton
              icon="Sword"
              label="Удар"
              sublabel={`${warrior.name}`}
              disabled={isEnemyTurn}
              onClick={() => doAttack('slash')}
              color="purple"
            />
            <SkillButton
              icon="Zap"
              label="Разрыв"
              sublabel="20 MP"
              disabled={isEnemyTurn || warrior.mp < 20}
              onClick={() => doAttack('magic')}
              color="purple"
            />
            <SkillButton
              icon="Flame"
              label="Огонь"
              sublabel="25 MP"
              disabled={isEnemyTurn || fox.mp < 25}
              onClick={() => doAttack('arcane')}
              color="gold"
            />
            <SkillButton
              icon="Heart"
              label="Лечение"
              sublabel="20 MP"
              disabled={isEnemyTurn || fox.mp < 20}
              onClick={() => doAttack('heal')}
              color="gold"
            />
          </div>

          {/* Combo attack */}
          <button
            onClick={doComboAttack}
            disabled={comboCharge < 100 || comboCooldown || isEnemyTurn}
            className="combo-btn w-full py-3 rounded-lg relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-xl">⚔️✨</span>
              <div>
                <p className="font-cinzel text-sm text-gold-light font-bold tracking-wider">СОВМЕСТНАЯ АТАКА</p>
                <p className="font-cormorant text-xs text-gold/60 italic">Кайрос & Лирэн наносят скоординированный удар</p>
              </div>
              <span className="text-xl">✨⚔️</span>
            </div>
            {/* Charge bar */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-gold transition-all duration-300" style={{ width: `${comboCharge}%` }} />
            {comboCharge < 100 && (
              <div className="absolute top-1 right-2 font-cinzel text-xs text-gold/40">{comboCharge}%</div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function HeroSprite({ hero, isShaking, side }: { hero: Hero; isShaking: boolean; side: 'left' | 'right' }) {
  return (
    <div className={`text-center ${isShaking ? 'animate-shake' : 'animate-float'}`} style={{ animationDelay: side === 'right' ? '1s' : '0s' }}>
      <div
        className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-purple-500/30 shadow-lg"
        style={{
          backgroundImage: `url(${hero.image})`,
          boxShadow: '0 0 15px rgba(168,85,247,0.4)',
        }}
      />
      <div className="font-cinzel text-xs text-purple-200/70 mt-1">{hero.name}</div>
    </div>
  );
}

function HeroStats({ hero, color }: { hero: Hero; color: 'purple' | 'gold' }) {
  const borderClass = color === 'purple' ? 'rune-border' : 'gold-border';
  const nameClass = color === 'purple' ? 'text-rune' : 'text-gold';
  return (
    <div className={`${borderClass} rounded-lg p-3 bg-black/30`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className={`font-cinzel text-xs font-bold ${nameClass}`}>{hero.name}</p>
          <p className="font-cormorant text-xs text-purple-300/50 italic">{hero.title} · Ур.{hero.level}</p>
        </div>
        <div
          className="w-10 h-10 rounded-full bg-cover bg-center border border-purple-500/20"
          style={{ backgroundImage: `url(${hero.image})` }}
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
      <span className="font-cinzel text-xs w-6 text-purple-300/50">{label}</span>
      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div className={`${barClass} h-full rounded-full`} style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
      </div>
      <span className="font-cormorant text-xs text-purple-300/40 w-14 text-right">{value}/{max}</span>
    </div>
  );
}

function SkillButton({
  icon, label, sublabel, disabled, onClick, color
}: {
  icon: string; label: string; sublabel: string; disabled: boolean; onClick: () => void; color: 'purple' | 'gold';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${color === 'gold' ? 'combo-btn' : 'skill-btn'} rounded-lg py-2 px-1 flex flex-col items-center gap-1`}
    >
      <Icon name={icon} fallback="Zap" size={16} className={color === 'gold' ? 'text-gold' : 'text-purple-400'} />
      <span className={`font-cinzel text-xs font-bold ${color === 'gold' ? 'text-gold-light' : 'text-purple-200'}`}>{label}</span>
      <span className="font-cormorant text-xs text-purple-300/50">{sublabel}</span>
    </button>
  );
}