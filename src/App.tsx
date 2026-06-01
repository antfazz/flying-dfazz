/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GameState, GameSettings } from './types';
import GameCanvas from './components/GameCanvas';
import MenuOverlay from './components/MenuOverlay';
import { audio } from './utils/audio';
import { 
  Heart, 
  Settings, 
  HelpCircle, 
  Compass, 
  Sparkles,
  Info 
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  
  // Game settings synced at root
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    controlScheme: 'TOUCH_DIRECT',
    soundEnabled: true,
    shootingEnabled: true,
    scoreMultiplier: 1.0,
  });

  // Mutable reference to trigger canvas restart sequence from menu button handlers
  const triggerResetRef = useRef<(() => void) | null>(null);

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled !== undefined) {
        audio.setEnabled(newSettings.soundEnabled);
      }
      return updated;
    });
  };

  const handleStartGame = () => {
    setGameState('PLAYING');
    // Initialize sound systems on user tap
    audio.setEnabled(settings.soundEnabled);
    if (triggerResetRef.current) {
      triggerResetRef.current();
    }
  };

  const handleResetGame = () => {
    setGameState('PLAYING');
    if (triggerResetRef.current) {
      triggerResetRef.current();
    }
  };

  const handleToggleSound = () => {
    const val = !settings.soundEnabled;
    handleUpdateSettings({ soundEnabled: val });
  };

  const handleGameOver = (finalScore: number, finalDistance: number) => {
    setScore(finalScore);
    setDistance(finalDistance);
  };

  const updateScoreAndDistance = (newScore: number, newDistance: number) => {
    setScore(newScore);
    setDistance(newDistance);
  };

  return (
    <div 
      className="h-[100dvh] w-full bg-[#1e272e] flex flex-col items-center justify-center p-1.5 sm:p-4 overflow-hidden select-none"
      style={{
        // Give it an authentic student desk dark vinyl laminate or leather pad background
        backgroundColor: '#1c242c',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(255,255,255,0.03) 0%, transparent 60%),
          radial-gradient(circle at 90% 80%, rgba(255,255,255,0.02) 0%, transparent 60%)
        `,
      }}
    >
      
      {/* Page Layout Decorative Accents (Pencils, Crayons, Binder clips scattered on the desk!) */}
      <div className="absolute right-10 top-12 hidden lg:flex flex-col gap-1 items-end opacity-25">
        <div className="w-48 h-2.5 bg-[#fed330] rounded-r-sm transform rotate-12 border border-slate-700 shadow-sm" style={{ clipPath: 'polygon(0% 25%, 90% 25%, 100% 50%, 90% 75%, 0% 75%)' }} />
        <div className="w-40 h-2 bg-sky-500 rounded-r-sm transform -rotate-3 border border-slate-700 shadow-sm" style={{ clipPath: 'polygon(0% 25%, 90% 25%, 100% 50%, 90% 75%, 0% 75%)' }} />
        <div className="w-52 h-3 bg-rose-500 rounded-r-sm transform rotate-45 border border-slate-700 shadow-sm" style={{ clipPath: 'polygon(0% 25%, 90% 25%, 100% 50%, 90% 75%, 0% 75%)' }} />
      </div>

      <div className="absolute left-10 bottom-12 hidden lg:flex flex-col gap-1 items-start opacity-25">
        <div className="w-44 h-2.5 bg-emerald-500 rounded-r-sm transform -rotate-12 border border-slate-705 shadow-sm" style={{ clipPath: 'polygon(10% 50%, 0% 25%, 100% 25%, 100% 75%, 0% 75%)' }} />
        <hr className="w-32 border-slate-600 mt-2" />
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">CLASSROOM DESK</span>
      </div>

      {/* Main Assembly wrapper combining overlay card with actual interactive physics board */}
      <div className="w-full max-w-4xl flex flex-col relative rounded-2xl">
        
        {/* Core Canvas Play Board Wrapper */}
        <GameCanvas
          gameState={gameState}
          setGameState={setGameState}
          settings={settings}
          updateScoreAndDistance={updateScoreAndDistance}
          onGameOver={handleGameOver}
          triggerResetRef={triggerResetRef}
        />

        {/* Floating Menu Dialog Board (Locks screen on start or game over states) */}
        <MenuOverlay
          gameState={gameState}
          score={score}
          distance={distance}
          settings={settings}
          updateSettings={handleUpdateSettings}
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          onToggleSound={handleToggleSound}
        />
      </div>

      {/* FOOTER DESK CREDITS */}
      <div className="mt-2 sm:mt-4 text-center select-none opacity-40 text-slate-400 font-mono text-[9px] sm:text-[10px] max-w-sm px-4 flex flex-col gap-0.5 hidden sm:block">
        <p className="flex items-center justify-center gap-1">
          <span>✎ Handcrafted child drawing concept code.</span>
        </p>
        <p>Press <kbd className="bg-slate-800 text-slate-300 font-bold px-1 py-0.5 rounded text-[9px] border border-slate-700">Space</kbd> or tap bottom-right circle to activate the Pencil Blaster!</p>
      </div>

    </div>
  );
}
