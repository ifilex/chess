import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { GameRecord, LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { ChessBoard } from './ChessBoard';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles, Brain, Award, Play, Pause } from 'lucide-react';

interface AnalysisBoardProps {
  gameRecord: GameRecord | null;
  lang: LanguageCode;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ gameRecord, lang }) => {
  const t = translations[lang] || translations.es;

  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Initialize interactive analysis game instance
  const [analysisGame, setAnalysisGame] = useState<Chess>(() => new Chess());

  // Re-build board position up to currentMoveIndex
  useEffect(() => {
    if (!gameRecord) return;

    const game = new Chess();
    const limit = Math.min(currentMoveIndex, gameRecord.moves.length);
    for (let i = 0; i < limit; i++) {
      const moveRec = gameRecord.moves[i];
      try {
        game.move({ from: moveRec.from, to: moveRec.to });
      } catch {
        // Fallback
      }
    }
    setAnalysisGame(game);
  }, [gameRecord, currentMoveIndex]);

  // Auto playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && gameRecord) {
      interval = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= gameRecord.moves.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameRecord]);

  if (!gameRecord || gameRecord.moves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-stone-900/80 rounded-2xl border border-stone-800 text-center max-w-lg mx-auto shadow-xl my-8">
        <Brain className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-stone-100 mb-2">{t.analysisTitle}</h3>
        <p className="text-stone-400 text-sm mb-6">{t.noGamesToAnalyze}</p>
      </div>
    );
  }

  const currentMoveRecord = currentMoveIndex > 0 ? gameRecord.moves[currentMoveIndex - 1] : null;
  const evalScore = currentMoveRecord?.evaluation ?? 0;
  // Convert centipawns to pawn score formatted string e.g. +1.4 or -0.8
  const evalFormatted = (evalScore / 100).toFixed(1);
  const evalWidth = Math.min(Math.max(((evalScore + 1000) / 2000) * 100, 5), 95);

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    setAiInsight(null);
    try {
      const response = await fetch('/api/ai/analyze-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: analysisGame.fen(),
          moveHistory: gameRecord.moves.slice(0, currentMoveIndex).map((m) => m.san),
          currentEvaluation: evalScore,
          lang,
          userLevel: gameRecord.difficulty,
        }),
      });
      const data = await response.json();
      setAiInsight(data.insight || 'Análisis completado.');
    } catch {
      setAiInsight(
        lang === 'en'
          ? 'Maintain steady attention on piece coordination and king safety.'
          : 'Mantén la atención focalizada en la coordinación de piezas y la seguridad del rey.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Brain className="w-5 h-5" /> {t.analysisTitle}
          </h2>
          <p className="text-xs text-stone-400">{t.analysisSubtitle}</p>
        </div>
        <div className="flex items-center gap-4 bg-stone-800/80 px-4 py-2 rounded-lg border border-stone-700">
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-stone-300">{t.accuracyLabel}:</span>
            <span className="text-sm font-bold text-emerald-400">{gameRecord.accuracy}%</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <span className="text-xs font-semibold text-amber-300 capitalize">{gameRecord.difficulty}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chess Board & Eval Bar */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          {/* Evaluation Bar */}
          <div className="w-full max-w-xl bg-stone-800 rounded-full h-3.5 overflow-hidden border border-stone-700 relative shadow-inner flex items-center">
            <div
              className="bg-stone-100 h-full transition-all duration-300"
              style={{ width: `${evalWidth}%` }}
            />
            <div
              className="bg-stone-900 h-full transition-all duration-300"
              style={{ width: `${100 - evalWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-400 tracking-wider drop-shadow">
              EVAL: {evalScore > 0 ? `+${evalFormatted}` : evalFormatted}
            </span>
          </div>

          <ChessBoard
            game={analysisGame}
            onMove={() => false}
            disabled={true}
            lastMove={currentMoveRecord ? { from: currentMoveRecord.from as Square, to: currentMoveRecord.to as Square } : null}
          />

          {/* Timeline Navigation Controls */}
          <div className="flex items-center justify-center gap-2 bg-stone-900/90 p-3 rounded-xl border border-stone-800 shadow-md w-full max-w-xl">
            <button
              id="analysis-first-move"
              onClick={() => {
                setIsPlaying(false);
                setCurrentMoveIndex(0);
              }}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
              title="First move"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              id="analysis-prev-move"
              onClick={() => {
                setIsPlaying(false);
                setCurrentMoveIndex((prev) => Math.max(0, prev - 1));
              }}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
              title="Previous move"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="analysis-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-md"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              id="analysis-next-move"
              onClick={() => {
                setIsPlaying(false);
                setCurrentMoveIndex((prev) => Math.min(gameRecord.moves.length, prev + 1));
              }}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
              title="Next move"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              id="analysis-last-move"
              onClick={() => {
                setIsPlaying(false);
                setCurrentMoveIndex(gameRecord.moves.length);
              }}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
              title="Last move"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Move Quality Breakdown & AI Insights */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Move Info Badge */}
          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs text-stone-400 font-semibold">
                {t.moveNumber}: {currentMoveIndex} / {gameRecord.moves.length}
              </span>
              {currentMoveRecord?.classification && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-stone-800 text-amber-300 border border-amber-500/30">
                  {currentMoveRecord.classification === 'brilliant' && t.qualityBrilliant}
                  {currentMoveRecord.classification === 'great' && t.qualityGreat}
                  {currentMoveRecord.classification === 'good' && t.qualityGood}
                  {currentMoveRecord.classification === 'inaccuracy' && t.qualityInaccuracy}
                  {currentMoveRecord.classification === 'mistake' && t.qualityMistake}
                  {currentMoveRecord.classification === 'blunder' && t.qualityBlunder}
                </span>
              )}
            </div>

            {currentMoveRecord && (
              <div className="flex items-center justify-between text-stone-200">
                <span className="text-sm font-semibold">
                  Jugada: <span className="text-amber-400 font-bold">{currentMoveRecord.san}</span> ({currentMoveRecord.from} → {currentMoveRecord.to})
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {currentMoveRecord.player === 'w' ? t.whitePlayer : t.blackPlayer}
                </span>
              </div>
            )}
          </div>

          {/* AI Coach Insights Box */}
          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> {t.aiCommentary}
              </h3>
              <button
                id="request-ai-analysis-btn"
                onClick={fetchAiInsight}
                disabled={loadingAi}
                className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition shadow flex items-center gap-1 disabled:opacity-50"
              >
                <Brain className="w-3.5 h-3.5" />
                {loadingAi ? t.loadingAiInsights : t.requestAiInsights}
              </button>
            </div>

            <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700/60 min-h-[90px] text-xs leading-relaxed text-stone-300">
              {aiInsight ? (
                <p className="animate-fadeIn">{aiInsight}</p>
              ) : (
                <p className="text-stone-500 italic">
                  Presiona el botón para generar un informe cognitivo detallado de esta posición.
                </p>
              )}
            </div>
          </div>

          {/* Move SAN List Box */}
          <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 shadow-lg space-y-2 max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Secuencia de Jugadas</h4>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {gameRecord.moves.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentMoveIndex(idx + 1);
                  }}
                  className={`p-1.5 rounded text-left transition ${
                    currentMoveIndex === idx + 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'hover:bg-stone-800 text-stone-300'
                  }`}
                >
                  {Math.floor(idx / 2) + 1}. {m.player === 'w' ? '' : '... '}{m.san}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
