import { useState } from 'react';
import GameScreen from '@/components/GameScreen';
import MainMenu from '@/components/MainMenu';

export type GameState = 'menu' | 'playing' | 'victory' | 'defeat';

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);

  const startGame = () => {
    setCurrentLevel(1);
    setGameState('playing');
  };

  const handleVictory = () => {
    setGameState('victory');
    setTimeout(() => {
      setCurrentLevel(prev => prev + 1);
      setGameState('playing');
    }, 2500);
  };

  const handleDefeat = () => {
    setGameState('defeat');
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-mystic relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-900/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-3xl" />
      </div>

      {gameState === 'menu' && <MainMenu onStart={startGame} />}
      {(gameState === 'playing' || gameState === 'victory' || gameState === 'defeat') && (
        <GameScreen
          level={currentLevel}
          gameState={gameState}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onRestart={restartGame}
          onMenu={() => setGameState('menu')}
        />
      )}
    </div>
  );
}
