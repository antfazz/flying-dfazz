/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Settings, 
  Award, 
  RotateCcw, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  Heart,
  Check,
  Plane
} from 'lucide-react';
import { GameState, GameSettings } from '../types';

interface MenuOverlayProps {
  gameState: GameState;
  score: number;
  distance: number;
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onResetGame: () => void;
  onToggleSound: () => void;
}

interface LocalHighScore {
  name: string;
  score: number;
  distance: number;
  date: string;
}

export default function MenuOverlay({
  gameState,
  score,
  distance,
  settings,
  updateSettings,
  onStartGame,
  onResetGame,
  onToggleSound,
}: MenuOverlayProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'scores' | 'help' | 'gameover'>('main');
  const [highScores, setHighScores] = useState<LocalHighScore[]>([]);
  const [newHighScoreName, setNewHighScoreName] = useState('');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Load High Scores or default them with cute names
  useEffect(() => {
    const scores = localStorage.getItem('doodle_plane_high_scores');
    if (scores) {
      setHighScores(JSON.parse(scores));
    } else {
      const defaultScores: LocalHighScore[] = [
        { name: "AeroKid (Son)", score: 2500, distance: 820, date: "2026-06-01" },
        { name: "SuperDad", score: 1800, distance: 580, date: "2026-05-30" },
        { name: "CloudRider Lucy", score: 1200, distance: 410, date: "2026-05-28" },
      ];
      localStorage.setItem('doodle_plane_high_scores', JSON.stringify(defaultScores));
      setHighScores(defaultScores);
    }
  }, []);

  // Sync activeTab with gameState changes to automatically route to GAMEOVER tab
  useEffect(() => {
    if (gameState === 'GAMEOVER') {
      setActiveTab('gameover');
      setHasSavedScore(false);
    } else if (gameState === 'MENU') {
      setActiveTab('main');
    }
  }, [gameState]);

  // Check if player earned a high score when game ends
  const isEligibleForHighScore = () => {
    if (score <= 0) return false;
    if (highScores.length < 5) return true;
    return score > highScores[highScores.length - 1].score;
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighScoreName.trim()) return;

    const newScoreItem: LocalHighScore = {
      name: newHighScoreName.trim().substring(0, 16),
      score,
      distance: Math.round(distance),
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [...highScores, newScoreItem]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    localStorage.setItem('doodle_plane_high_scores', JSON.stringify(updated));
    setHighScores(updated);
    setHasSavedScore(true);
    setNewHighScoreName('');
  };

  if (gameState === 'PLAYING' || gameState === 'PAUSED') {
    return null; // Don't show overlay while playing
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-3 sm:p-4 text-slate-800">
      
      {/* Notebook-styled dialog container */}
      <div 
        id="menu-container"
        className="relative w-full max-w-lg sm:max-w-xl bg-[#faf8f2] border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] sm:shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh]"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top left, rgba(230,240,255,0.4) 0%, transparent 70%)'
        }}
      >
        {/* Binder Holes decorative strip on the left side */}
        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around w-4 pointer-events-none opacity-60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
          ))}
        </div>

        {/* Highlight Banner / Top spiral design */}
        <div className="h-4 bg-amber-200 border-b-2 border-slate-800 flex items-center" />

        <div className="pl-8 sm:pl-10 pr-4 sm:pr-6 py-2 sm:py-4 flex-1 flex flex-col overflow-y-auto w-full">
          
          {/* Menu Title / Logo Area */}
          <div className="text-center mb-2 sm:mb-4 mt-0.5 sm:mt-1">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 select-none font-mono flex items-center justify-center gap-1.5 sm:gap-2 leading-none">
              <span className="text-sky-500 transform -rotate-2 inline-block text-base sm:text-2xl font-mono">The Flying</span>
              <span className="text-rose-500 transform rotate-1 inline-block text-2xl sm:text-4xl font-black font-sans">D-FAZZ</span>
            </h1>
            <p className="text-[9px] sm:text-xs text-slate-400 font-mono italic mt-0.5">"Flying through drawing clouds!"</p>
          </div>

          {/* TAB NAVIGATION PANEL - Hidden during gameover state to maximize space */}
          {activeTab !== 'gameover' && (
            <div className="flex border-b-2 border-slate-850 justify-between text-[11px] sm:text-xs font-bold font-mono mb-2 sm:mb-3 text-slate-500 select-none">
              <button 
                onClick={() => { setActiveTab(gameState === 'GAMEOVER' ? 'gameover' : 'main'); setHasSavedScore(false); }}
                className={`pb-1 px-1 transition border-b-2 -mb-[2px] ${activeTab === 'main' || activeTab === 'gameover' ? 'text-slate-900 border-rose-500 font-bold' : 'border-transparent hover:text-slate-800'}`}
              >
                PLAY
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`pb-1 px-1 transition border-b-2 -mb-[2px] ${activeTab === 'settings' ? 'text-slate-900 border-sky-500 font-bold' : 'border-transparent hover:text-slate-800'}`}
              >
                SETTINGS
              </button>
              <button 
                onClick={() => setActiveTab('scores')}
                className={`pb-1 px-1 transition border-b-2 -mb-[2px] ${activeTab === 'scores' ? 'text-slate-900 border-amber-500 font-bold' : 'border-transparent hover:text-slate-800'}`}
              >
                LEADERBOARD
              </button>
              <button 
                onClick={() => setActiveTab('help')}
                className={`pb-1 px-1 transition border-b-2 -mb-[2px] ${activeTab === 'help' ? 'text-slate-900 border-emerald-500 font-bold' : 'border-transparent hover:text-slate-800'}`}
              >
                HELP
              </button>
            </div>
          )}

          {/* TAB CONTENT: GAMEOVER */}
          {activeTab === 'gameover' && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Compact Game Over Card */}
                <div className="bg-red-50 border-2 border-rose-300 rounded-xl p-3 mb-2 text-center transform -rotate-0.5 shadow-xs">
                  <h2 className="text-base sm:text-lg font-extrabold font-mono text-rose-600 flex items-center justify-center gap-1 select-none">
                    <Heart className="w-4 h-4 animate-pulse fill-rose-500" /> CRASHED! <Heart className="w-4 h-4 animate-pulse fill-rose-500" />
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-2 my-1.5 text-slate-700">
                    <div className="p-1 bg-white border border-slate-300/80 rounded-md shadow-xs">
                      <div className="text-[9px] text-slate-400 uppercase font-mono">Distance Flown</div>
                      <div className="font-black text-sm sm:text-base text-slate-800">{Math.round(distance)}m</div>
                    </div>
                    <div className="p-1 bg-white border border-slate-300/80 rounded-md shadow-xs">
                      <div className="text-[9px] text-slate-400 uppercase font-mono">Final Score</div>
                      <div className="font-black text-sm sm:text-base text-rose-500">{score}</div>
                    </div>
                  </div>

                  {isEligibleForHighScore() && !hasSavedScore ? (
                    <form onSubmit={handleSaveScore} className="mt-1.5 bg-amber-100/70 border border-amber-300 rounded-lg p-1.5">
                      <span className="text-[9px] font-mono text-amber-800 font-semibold block mb-0.5">🎉 Brand New High Score!</span>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          placeholder="Your kid name..." 
                          value={newHighScoreName}
                          onChange={(e) => setNewHighScoreName(e.target.value)}
                          maxLength={16}
                          required
                          className="flex-1 bg-white border border-slate-400 px-2 py-0.5 text-xs rounded shadow-inner font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                        />
                        <button 
                          type="submit" 
                          className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-900 border border-slate-700 px-2.5 py-0.5 text-[10px] font-extrabold font-mono rounded shadow transition"
                        >
                          SAVE
                        </button>
                      </div>
                    </form>
                  ) : (
                    hasSavedScore && (
                      <div className="text-[10px] font-semibold text-emerald-600 font-mono mt-0.5">
                        ✓ Score written down in the notebook!
                      </div>
                    )
                  )}
                </div>

                {/* Quick settings check */}
                <div className="text-[10px] bg-slate-100 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                  <span>Difficulty: <strong className="text-sky-600 capitalize">{settings.difficulty}</strong></span>
                  <span>Sound: <strong className={settings.soundEnabled ? "text-emerald-600" : "text-rose-500"}>{settings.soundEnabled ? "ON" : "OFF"}</strong></span>
                </div>
              </div>

              {/* ACTION BUTTON START / RESTART */}
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={onResetGame}
                  className="w-full bg-[#fed330] hover:bg-[#f7b731] active:translate-y-0.5 select-none border-2 border-slate-800 rounded-xl py-2 px-4 font-bold text-sm sm:text-base text-slate-900 shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4 text-slate-900" /> RESTART GAME
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab('scores')}
                    className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-800 rounded-xl py-1 px-1 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    🏆 Leaderboard
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-800 rounded-xl py-1 px-1 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    ⚙ Settings
                  </button>

                  <button
                    onClick={() => setActiveTab('help')}
                    className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-800 rounded-xl py-1 px-1 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    ❓ Help
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: MAIN TABS */}
          {activeTab === 'main' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {/* Quick settings check */}
                <div className="text-[11px] sm:text-xs bg-slate-100 p-1.5 sm:p-2 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                  <span>Difficulty: <strong className="text-sky-600 capitalize">{settings.difficulty}</strong></span>
                  <span>Sound: <strong className={settings.soundEnabled ? "text-emerald-600" : "text-rose-500"}>{settings.soundEnabled ? "ON" : "OFF"}</strong></span>
                </div>
              </div>

              {/* ACTION BUTTON START / RESTART */}
              <div className="mt-3 sm:mt-6 space-y-2">
                <button
                  onClick={onStartGame}
                  className="w-full bg-[#fed330] hover:bg-[#f7b731] active:translate-y-0.5 select-none border-2 border-slate-800 rounded-xl py-2 sm:py-3 px-4 font-bold text-sm sm:text-lg text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-900" /> START FLYING
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={onToggleSound}
                    className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-800 rounded-xl py-1.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />}
                    {settings.soundEnabled ? "Mute" : "Unmute"}
                  </button>

                  <button
                    onClick={() => setActiveTab('help')}
                    className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-800 rounded-xl py-1.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    How to play
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1">Game Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => updateSettings({ difficulty: diff })}
                      className={`py-1 px-1 border-2 text-xs font-extrabold font-mono rounded-lg capitalize transition select-none ${
                        settings.difficulty === diff
                          ? 'bg-sky-100 border-sky-600 text-sky-800 shadow-inner'
                          : 'bg-white border-slate-500 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-mono leading-tight">
                  {settings.difficulty === 'easy' && '✎ Slow speed, gentle black clouds, 4 plane lives.'}
                  {settings.difficulty === 'medium' && '✎ Regular speed, standard obstacles, 3 plane lives.'}
                  {settings.difficulty === 'hard' && '✎ High speed, firing planes, only 2 lives. Try to make a high score!'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1">Sound Settings</label>
                <div className="flex items-center justify-between p-1.5 bg-white border border-slate-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                    <span className="text-xs font-mono font-semibold">Enable Pencil/Sputter Sound FX</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-3.5 h-3.5 accent-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1">Weapon Systems</label>
                <div className="flex items-center justify-between p-1.5 bg-white border border-slate-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="text-xs font-mono font-semibold">Enable Pencil-Blaster Gun</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.shootingEnabled} 
                    onChange={(e) => updateSettings({ shootingEnabled: e.target.checked })}
                    className="w-3.5 h-3.5 accent-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono leading-tight">
                  ✎ Fire pencil tips to dissolve black clouds. You get more ammo by picking up green stars!
                </p>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setActiveTab(gameState === 'GAMEOVER' ? 'gameover' : 'main')}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-1.5 px-3 text-xs font-mono font-semibold text-center select-none"
                >
                  Save & Return
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LEADERBOARD */}
          {activeTab === 'scores' && (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1.5">School Journal High Scores</h3>
                
                <div className="bg-white border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 text-[9px] text-slate-500 uppercase">
                        <th className="py-1 px-2.5 text-center">Rank</th>
                        <th className="py-1 px-1">Pilot Name</th>
                        <th className="py-1 px-2 text-right">Meters</th>
                        <th className="py-1 px-2.5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {highScores.map((h, i) => (
                        <tr key={i} className={i === 0 ? "bg-amber-50/70 font-bold text-xs" : "text-xs"}>
                          <td className="py-1.5 px-2.5 text-center text-slate-400">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                          </td>
                          <td className="py-1.5 px-1 text-slate-700 truncate max-w-[130px]">{h.name}</td>
                          <td className="py-1.5 px-2 text-right text-slate-500">{h.distance}m</td>
                          <td className="py-1.5 px-2.5 text-right text-slate-950 font-extrabold">{h.score}</td>
                        </tr>
                      ))}
                      {highScores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-3 text-center text-slate-400 italic">No scores yet! Take the plane up.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setActiveTab(gameState === 'GAMEOVER' ? 'gameover' : 'main')}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-1 px-3 text-xs font-mono font-semibold select-none"
                >
                  Return
                </button>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem('doodle_plane_high_scores');
                      const defaultScores = [
                        { name: "AeroKid (Son)", score: 2500, distance: 820, date: "2026-06-01" },
                        { name: "SuperDad", score: 1800, distance: 580, date: "2026-05-30" },
                        { name: "CloudRider Lucy", score: 1200, distance: 410, date: "2026-05-28" },
                      ];
                      localStorage.setItem('doodle_plane_high_scores', JSON.stringify(defaultScores));
                      setHighScores(defaultScores);
                    } catch (e) {}
                  }}
                  className="text-[10px] font-mono font-medium text-rose-500 underline hover:text-rose-600 select-none"
                >
                  Reset Default Scores
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: HELP / TUTORIAL */}
          {activeTab === 'help' && (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="overflow-y-auto max-h-[46vh] pr-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Crayon Plane Rules</h3>
                <ul className="text-[11px] space-y-1.5 list-disc pl-3 mt-1 text-slate-600 font-sans leading-relaxed">
                  <li><strong>Touch & Move:</strong> Touch anywhere on the screen and drag. The plane follows your finger vertically (Very intuitive on mobile/tablet!)</li>
                  <li><strong>Desktop Controls:</strong> Press keyboard <strong>W / Up Arrow</strong> to fly up, and <strong>S / Down Arrow</strong> to fly down. Or drag with cursor!</li>
                  <li><strong>White Clouds (☁) are fine:</strong> Fly through them safely to hide or gain speed!</li>
                  <li><strong className="text-slate-800 font-bold">Black Clouds (☁) break wings:</strong> If you touch scribbled black clouds, you lose a heart!</li>
                  <li><strong className="text-red-500 font-bold">Enemy Planes (✈):</strong> Angry red doodle gliders fly towards you. Avoid them or destroy them!</li>
                  <li><strong>Pencil-Blaster Trigger:</strong> Tap the <strong>"BLAST" button</strong> on mobile, or press <strong>SPACEBAR</strong> on desktop to shoot sharpened pencils!</li>
                  <li><strong>Collect Stars:</strong>
                    <div className="flex flex-col gap-0.5 mt-0.5 pl-1">
                      <span className="flex items-center gap-1 text-[10px]"><Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-100" /> Yellow: +100 bonus score!</span>
                      <span className="flex items-center gap-1 text-[10px]"><Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-100" /> Green: Adds 8 pencil ammo!</span>
                      <span className="flex items-center gap-1 text-[10px]"><Sparkles className="w-3 h-3 text-rose-500 fill-rose-100" /> Red: Heals 1 broken heart!</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab(gameState === 'GAMEOVER' ? 'gameover' : 'main')}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-1.5 px-3 text-xs font-mono font-semibold text-center select-none"
                >
                  Understood, Let's Fly!
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
