import React from 'react';
import { UserStats, LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { Brain, Trophy, Zap, Target, Award, Clock, Activity, Flame, RotateCcw } from 'lucide-react';

interface CognitiveStatsProps {
  stats: UserStats;
  lang: LanguageCode;
  onResetStats: () => void;
}

export const CognitiveStats: React.FC<CognitiveStatsProps> = ({ stats, lang, onResetStats }) => {
  const t = translations[lang] || translations.es;

  // Calculate Cognitive Health Index (0 - 100)
  const total = stats.gamesPlayed;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

  // Overall average accuracy across all difficulties
  let totalAcc = 0;
  let accCount = 0;
  (Object.values(stats.byDifficulty) as Array<{ played: number; wins: number; avgAccuracy: number }>).forEach((d) => {
    if (d.played > 0) {
      totalAcc += d.avgAccuracy * d.played;
      accCount += d.played;
    }
  });
  const overallAvgAccuracy = accCount > 0 ? Math.round(totalAcc / accCount) : 75;

  const cognitiveIndexScore = Math.min(
    100,
    Math.max(
      20,
      Math.round(overallAvgAccuracy * 0.4 + winRate * 0.35 + Math.min(stats.gamesPlayed * 2, 25))
    )
  );

  // Sub-scores for radar/bars
  const executiveFunction = Math.min(100, Math.round(overallAvgAccuracy * 0.9 + 10));
  const patternRecognition = Math.min(100, Math.round(stats.puzzlesSolved * 8 + 60));
  const spatialMemory = Math.min(100, Math.round(overallAvgAccuracy * 0.85 + stats.bestStreak * 3));
  const attentionSpan = Math.min(100, Math.round(85 + (total > 5 ? 10 : 0)));
  const tacticalIndex = Math.min(100, Math.round(overallAvgAccuracy * 0.95));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Activity className="w-6 h-6" /> {t.statsTitle}
          </h2>
          <p className="text-xs text-stone-400 mt-1">{t.statsSubtitle}</p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('¿Seguro que deseas reiniciar tus estadísticas?')) {
              onResetStats();
            }
          }}
          className="px-3.5 py-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl border border-stone-700 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t.resetStats}
        </button>
      </div>

      {/* Main Cognitive Index Gauge Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 p-6 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-3 right-3 text-amber-500/20">
            <Brain className="w-28 h-28" />
          </div>

          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-2">
            {t.cognitiveIndex}
          </span>

          <div className="relative my-4 flex items-center justify-center">
            {/* SVG Ring Gauge */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="12"
                className="text-stone-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="12"
                className="text-amber-400 transition-all duration-1000"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * cognitiveIndexScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-stone-100">{cognitiveIndexScore}</span>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">pts / 100</span>
            </div>
          </div>

          <p className="text-xs text-stone-300 max-w-xs leading-relaxed">
            Evaluación basada en precisión táctica, patrones resueltos y consistencia de partidas.
          </p>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">{t.totalGames}</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-stone-100 my-2">{stats.gamesPlayed}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {stats.wins}W / {stats.losses}L / {stats.draws}D
            </span>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">{t.winRate}</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-stone-100 my-2">{winRate}%</span>
            <span className="text-[10px] text-stone-400 font-semibold">Soporte contra IA</span>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">{t.avgAccuracy}</span>
              <Award className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-2xl font-bold text-stone-100 my-2">{overallAvgAccuracy}%</span>
            <span className="text-[10px] text-cyan-400 font-semibold">Precisión en jugadas</span>
          </div>

          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">{t.streaks}</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-2xl font-bold text-stone-100 my-2">
              {stats.currentStreak} <span className="text-sm text-stone-500">/ {stats.bestStreak}</span>
            </span>
            <span className="text-[10px] text-orange-400 font-semibold">Victorias seguidas</span>
          </div>
        </div>
      </div>

      {/* Cognitive Skill Bars */}
      <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
          <Brain className="w-5 h-5" /> Desglose de Capacidades Cognitivas
        </h3>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1">
              <span>{t.executiveFunction}</span>
              <span className="text-amber-400">{executiveFunction}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${executiveFunction}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1">
              <span>{t.patternRecognition}</span>
              <span className="text-emerald-400">{patternRecognition}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${patternRecognition}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1">
              <span>{t.spatialMemory}</span>
              <span className="text-cyan-400">{spatialMemory}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${spatialMemory}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1">
              <span>{t.attentionSpan}</span>
              <span className="text-purple-400">{attentionSpan}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${attentionSpan}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-300 mb-1">
              <span>{t.tacticalIndex}</span>
              <span className="text-rose-400">{tacticalIndex}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all duration-700" style={{ width: `${tacticalIndex}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Performance Breakdown */}
      <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-stone-200">{t.difficultyBreakdown}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['beginner', 'casual', 'intermediate', 'master'] as const).map((diffKey) => {
            const data = stats.byDifficulty[diffKey] || { played: 0, wins: 0, avgAccuracy: 0 };
            const diffWinRate = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0;
            return (
              <div key={diffKey} className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-2">
                <span className="text-xs font-bold uppercase text-amber-400 block">{diffKey}</span>
                <div className="text-xl font-bold text-stone-100">{data.played} <span className="text-xs font-normal text-stone-400">partidas</span></div>
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Victorias:</span>
                  <span className="font-semibold text-emerald-400">{diffWinRate}%</span>
                </div>
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Precisión:</span>
                  <span className="font-semibold text-cyan-400">{data.avgAccuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
