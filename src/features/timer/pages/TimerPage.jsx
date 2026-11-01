import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export function TimerPage() {
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'manual'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      alert('Pomodoro study interval complete! +25 XP awarded.');
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'pomodoro' ? 25 * 60 : 0);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <Clock className="w-6 h-6 text-brand-400" />
          <span>Study Timer</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Lock in focus sessions and earn verified study XP
        </p>
      </div>

      {/* Mode Selector */}
      <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => {
            setMode('pomodoro');
            setIsRunning(false);
            setSecondsLeft(25 * 60);
          }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'pomodoro' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Pomodoro (25m)
        </button>
        <button
          onClick={() => {
            setMode('manual');
            setIsRunning(false);
            setSecondsLeft(0);
          }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'manual' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Stopwatch (Manual)
        </button>
      </div>

      {/* Clock Face Card */}
      <div className="p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-6xl sm:text-7xl font-mono font-bold tracking-wider text-white">
          {timeFormatted}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-lg ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/25'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Pause Session' : 'Start Focus'}</span>
          </button>

          <button
            onClick={resetTimer}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Earn 10 XP for every 10 verified minutes studied</span>
        </p>
      </div>
    </div>
  );
}
