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
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'scores' | 'help'>('main');
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
        className="relative w-full max-w-md bg-[#faf8f2] border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] sm:shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top left, rgba(230,240,255,0.4) 0%, transparent 70%)'
        }}
      >
        {/* Binder Holes decorative strip on the left side */}
        <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around w-4 pointer-events-none opacity-60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
          ))}
        </div>

        {/* Highlight Banner / Top spiral design */}
        <div className="h-4 bg-amber-200 border-b-2 border-slate-800 flex items-center" />

        <div className="pl-9 pr-6 py-3 sm:py-5 flex-1 flex flex-col overflow-y-auto">
          
          {/* Menu Title / Logo Area */}
          <div className="text-center mb-3 sm:mb-5 mt-1 sm:mt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 select-none font-mono flex flex-col items-center justify-center">
              <span className="text-sky-500 transform -rotate-3 inline-block text-xl sm:text-2xl">The Flying</span>
              <span className="text-rose-500 transform rotate-2 inline-block text-3xl sm:text-4xl font-black font-sans leading-none mt-1">D-FAZZ</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-mono italic mt-1">"Flying through drawing clouds!"</p>
          </div>

          {/* GAME OVER CARD VIEW */}
          {gameState === 'GAMEOVER' && (
            <div className="bg-red-50 border-2 border-rose-300 rounded-xl p-4 mb-4 text-center transform -rotate-1 shadow-sm">
              <h2 className="text-xl font-bold font-mono text-rose-600 flex items-center justify-center gap-1 select-none">
                <Heart className="w-5 h-5 animate-pulse fill-rose-500" /> CRASHED! <Heart className="w-5 h-5 animate-pulse fill-rose-500" />
              </h2>
              
              <div className="grid grid-cols-2 gap-2 my-2 text-slate-700">
                <div className="p-1.5 bg-white border border-slate-300/80 rounded-md shadow-xs">
                  <div className="text-xs text-slate-400 uppercase font-mono">Distance Flown</div>
                  <div className="font-extrabold text-lg text-slate-800">{Math.round(distance)}m</div>
                </div>
                <div className="p-1.5 bg-white border border-slate-300/80 rounded-md shadow-xs">
                  <div className="text-xs text-slate-400 uppercase font-mono">Final Score</div>
                  <div className="font-extrabold text-lg text-rose-500">{score}</div>
                </div>
              </div>

              {isEligibleForHighScore() && !hasSavedScore ? (
                <form onSubmit={handleSaveScore} className="mt-3 bg-amber-100/70 border border-amber-300 rounded-lg p-2.5">
                  <span className="text-xs font-mono text-amber-800 font-semibold block mb-1">🎉 Brand New High Score!</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Your kid name..." 
                      value={newHighScoreName}
                      onChange={(e) => setNewHighScoreName(e.target.value)}
                      maxLength={16}
                      required
                      className="flex-1 bg-white border border-slate-400 px-2 py-1 text-sm rounded shadow-inner font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <button 
                      type="submit" 
                      className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-900 border border-slate-700 px-3 py-1 text-xs font-extrabold font-mono rounded shadow transition"
                    >
                      SAVE
                    </button>
                  </div>
                </form>
              ) : (
                hasSavedScore && (
                  <div className="text-xs font-semibold text-emerald-600 font-mono mt-1">
                    ✓ Score written down in the notebook!
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB NAVIGATION PANEL */}
          <div className="flex border-b-2 border-slate-850 justify-between text-[11px] sm:text-xs font-bold font-mono mb-2.5 sm:mb-4 text-slate-500 select-none">
            <button 
              onClick={() => { setActiveTab('main'); setHasSavedScore(false); }}
              className={`pb-1 px-0.5 transition border-b-2 -mb-[2px] ${activeTab === 'main' ? 'text-slate-900 border-rose-500' : 'border-transparent hover:text-slate-800'}`}
            >
              PLAY
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-1 px-0.5 transition border-b-2 -mb-[2px] ${activeTab === 'settings' ? 'text-slate-900 border-sky-500' : 'border-transparent hover:text-slate-800'}`}
            >
              SETTINGS
            </button>
            <button 
              onClick={() => setActiveTab('scores')}
              className={`pb-1 px-0.5 transition border-b-2 -mb-[2px] ${activeTab === 'scores' ? 'text-slate-900 border-amber-500' : 'border-transparent hover:text-slate-800'}`}
            >
              LEADERBOARD
            </button>
            <button 
              onClick={() => setActiveTab('help')}
              className={`pb-1 px-0.5 transition border-b-2 -mb-[2px] ${activeTab === 'help' ? 'text-slate-900 border-emerald-500' : 'border-transparent hover:text-slate-800'}`}
            >
              HELP
            </button>
          </div>

          {/* TAB CONTENT: MAIN TABS */}
          {activeTab === 'main' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-4">
                {/* Visual sketch promo */}
                <div className="border border-slate-300 rounded-xl p-2 sm:p-3 bg-white shadow-xs flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg text-slate-700 shadow-xs">
                    <Plane className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">10-Year-Old's Dream!</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Pilot standard code 3 - flying through clouds and shooting pencils to erase black clouds!</p>
                  </div>
                </div>

                {/* Quick settings check */}
                <div className="text-[11px] sm:text-xs bg-slate-100 p-1.5 sm:p-2 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                  <span>Difficulty: <strong className="text-sky-600 capitalize">{settings.difficulty}</strong></span>
                  <span>Sound: <strong className={settings.soundEnabled ? "text-emerald-600" : "text-rose-500"}>{settings.soundEnabled ? "ON" : "OFF"}</strong></span>
                </div>
              </div>

              {/* ACTION BUTTON START / RESTART */}
              <div className="mt-4 sm:mt-8 space-y-2">
                {gameState === 'MENU' ? (
                  <button
                    onClick={onStartGame}
                    className="w-full bg-[#fed330] hover:bg-[#f7b731] active:translate-y-0.5 select-none border-2 border-slate-800 rounded-xl py-2 sm:py-3 px-4 font-bold text-sm sm:text-lg text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-900" /> START FLYING
                  </button>
                ) : (
                  <button
                    onClick={onResetGame}
                    className="w-full bg-[#fed330] hover:bg-[#f7b731] active:translate-y-0.5 select-none border-2 border-slate-800 rounded-xl py-2 sm:py-3 px-4 font-bold text-sm sm:text-lg text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-2 transition"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> RESTART GAME
                  </button>
                )}

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
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1.5">Game Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => updateSettings({ difficulty: diff })}
                      className={`py-1.5 px-1 border-2 text-xs font-extrabold font-mono rounded-lg capitalize transition select-none ${
                        settings.difficulty === diff
                          ? 'bg-sky-100 border-sky-600 text-sky-800 shadow-inner'
                          : 'bg-white border-slate-500 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {settings.difficulty === 'easy' && '✎ Slow speed, gentle black clouds, 4 plane lives.'}
                  {settings.difficulty === 'medium' && '✎ Regular speed, standard obstacles, 3 plane lives.'}
                  {settings.difficulty === 'hard' && '✎ High speed, firing planes, only 2 lives. Try to make a high score!'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1.5">Sound Settings</label>
                <div className="flex items-center justify-between p-2 bg-white border border-slate-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
                    <span className="text-xs font-mono font-semibold">Enable Pencil/Sputter Sound FX</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-500 uppercase block mb-1.5">Weapon Systems</label>
                <div className="flex items-center justify-between p-2 bg-white border border-slate-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-xs font-mono font-semibold">Enable Pencil-Blaster Gun</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.shootingEnabled} 
                    onChange={(e) => updateSettings({ shootingEnabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  ✎ Fire pencil tips to dissolve black clouds and make a neat crash-free escape. You get more rockets by picking up green stars!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('main')}
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
                <h3 className="text-xs font-bold font-mono text-slate-500 uppercase block mb-2">School Journal High Scores</h3>
                
                <div className="bg-white border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                        <th className="py-2 px-3 text-center">Rank</th>
                        <th className="py-2 px-1">Pilot Name</th>
                        <th className="py-2 px-2 text-right">Meters</th>
                        <th className="py-2 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {highScores.map((h, i) => (
                        <tr key={i} className={i === 0 ? "bg-amber-50/70 font-bold" : ""}>
                          <td className="py-2 px-3 text-center text-slate-400">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                          </td>
                          <td className="py-2 px-1 text-slate-700 truncate max-w-[130px]">{h.name}</td>
                          <td className="py-2 px-2 text-right text-slate-500">{h.distance}m</td>
                          <td className="py-2 px-3 text-right text-slate-950 font-extrabold">{h.score}</td>
                        </tr>
                      ))}
                      {highScores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">No scores yet! Take the plane up.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

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
                className="text-[10px] font-mono font-medium text-rose-500 underline text-right hover:text-rose-600 self-end mt-2"
              >
                Reset Default Scores
              </button>
            </div>
          )}

          {/* TAB CONTENT: HELP / TUTORIAL */}
          {activeTab === 'help' && (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Crayon Plane Rules:</h3>
                <ul className="text-xs space-y-1.5 list-disc pl-4 mt-1 text-slate-600 font-sans">
                  <li><strong>Touch & Move:</strong> Touch anywhere on the screen and drag. The plane follows your vertical position smoothly! (Very intuitive for tablets!)</li>
                  <li><strong>Desktop Controls:</strong> Press keyboard <strong>W / Up Arrow</strong> to fly up, and <strong>S / Down Arrow</strong> to fly down. Or drag the plane with your cursor!</li>
                  <li><strong>White Clouds (☁) are fine:</strong> Fly through them safely to hide or gain speed!</li>
                  <li><strong className="text-slate-800 font-bold">Black Clouds (☁) break wings:</strong> If you touch scribbled black clouds, you lose a heart!</li>
                  <li><strong className="text-red-500 font-bold">Enemy Planes (✈):</strong> Angry red doodle gliders fly towards you. Avoid them or destroy them!</li>
                  <li><strong>Pencil-Blaster Trigger:</strong> Tap the <strong>"BLAST" button</strong> on the right side of the mobile screen, or press the <strong>SPACEBAR</strong> on desktop to shoot sharpened pencils and erase obstacles!</li>
                  <li><strong>Collect Stars:</strong>
                    <div className="flex flex-col gap-1 mt-1 pl-1">
                      <span className="flex items-center gap-1 text-[11px]"><Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-100" /> Yellow Star: Gives +100 bonus score!</span>
                      <span className="flex items-center gap-1 text-[11px]"><Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" /> Green Star: Adds 8 pencil ammo!</span>
                      <span className="flex items-center gap-1 text-[11px]"><Sparkles className="w-3.5 h-3.5 text-rose-500 fill-rose-100" /> Red Star: Heals 1 broken heart fuel cell!</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('main')}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-1.5 px-3 text-xs font-mono font-semibold text-center select-none"
                >
                  Understood, Let's Fly!
                </button>
              </div>
            </div>
          )}

        </div>

        {/* School Folder Bottom Border design */}
        <div className="py-2.5 bg-slate-100 border-t border-slate-350 text-center font-mono opacity-80 flex items-center justify-center gap-1">
          <Award className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] text-slate-500 tracking-wider font-semibold">100% OFFLINE PWA CAPBABLE</span>
        </div>
      </div>

    </div>
  );
}
