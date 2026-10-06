import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { COGNITIVE_PUZZLES } from '../data/puzzles';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { ChessBoard } from './ChessBoard';
import { soundFX } from '../utils/audio';
import { recordPuzzleSolved } from '../utils/storage';
import { Zap, CheckCircle2, RotateCcw, ChevronRight, Eye, Brain } from 'lucide-react';

interface PuzzleTrainerProps {
  lang: LanguageCode;
  onPuzzleSolved: () => void;
}

export const PuzzleTrainer: React.FC<PuzzleTrainerProps> = ({ lang, onPuzzleSolved }) => {
  const t = translations[lang] || translations.es;

  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const currentPuzzle = COGNITIVE_PUZZLES[puzzleIndex] || COGNITIVE_PUZZLES[0];

  const [puzzleGame, setPuzzleGame] = useState<Chess>(() => new Chess(currentPuzzle.initialFen));
  const [moveStep, setMoveStep] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);

  const loadPuzzle = (index: number) => {
    const p = COGNITIVE_PUZZLES[index];
    if (!p) return;
    setPuzzleIndex(index);
    setPuzzleGame(new Chess(p.initialFen));
    setMoveStep(0);
    setIsSolved(false);
    setFeedback(null);
    setShowingSolution(false);
  };

  const handlePuzzleMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (isSolved) return false;

    const expectedMove = currentPuzzle.solutionMoves[moveStep];
    const moveStr = `${from}${to}${promotion || ''}`;

    try {
      const move = puzzleGame.move({ from, to, promotion });
      if (!move) return false;

      if (moveStr === expectedMove || move.san === expectedMove) {
        soundFX.playHint();
        setFeedback(t.correctMove);

        if (moveStep + 1 >= currentPuzzle.solutionMoves.length) {
          setIsSolved(true);
          soundFX.playWin();
          recordPuzzleSolved();
          onPuzzleSolved();
        } else {
          setMoveStep(moveStep + 1);
        }
      } else {
        soundFX.playMove();
        setFeedback(t.incorrectMove);
      }

      setPuzzleGame(new Chess(puzzleGame.fen()));
      return true;
    } catch {
      return false;
    }
  };

  const revealSolution = () => {
    setShowingSolution(true);
    const game = new Chess(currentPuzzle.initialFen);
    currentPuzzle.solutionMoves.forEach((m) => {
      try {
        game.move(m);
      } catch {
        // Fallback
      }
    });
    setPuzzleGame(game);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> {t.puzzleTitle}
          </h2>
          <p className="text-xs text-stone-400 mt-1">{t.puzzleSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-stone-800 px-3.5 py-1.5 rounded-xl border border-stone-700 text-xs font-semibold text-stone-300">
          <span>Puzle {puzzleIndex + 1} / {COGNITIVE_PUZZLES.length}</span>
        </div>
      </div>

      <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-6 flex flex-col items-center">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            {currentPuzzle.cognitiveTheme}
          </span>
          <h3 className="text-lg font-bold text-stone-100">{currentPuzzle.titleKey}</h3>
          <p className="text-xs text-stone-400">{currentPuzzle.descriptionKey}</p>
        </div>

        <ChessBoard
          game={puzzleGame}
          onMove={handlePuzzleMove}
          showLegalMoves={true}
        />

        {/* Feedback Bar */}
        {feedback && (
          <div
            className={`text-xs font-bold px-4 py-2 rounded-lg ${
              feedback === t.correctMove
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {feedback}
          </div>
        )}

        {isSolved && (
          <div className="w-full max-w-md bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl text-center space-y-3 shadow-lg">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {t.puzzleSolved}
            </h4>
            {puzzleIndex + 1 < COGNITIVE_PUZZLES.length && (
              <button
                onClick={() => loadPuzzle(puzzleIndex + 1)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow flex items-center gap-1 mx-auto text-xs"
              >
                {t.nextPuzzle} <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPuzzle(puzzleIndex)}
            className="px-3.5 py-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl border border-stone-700 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.tryAgain}
          </button>
          {!showingSolution && !isSolved && (
            <button
              onClick={revealSolution}
              className="px-3.5 py-2 text-xs bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 font-semibold rounded-xl border border-amber-500/40 transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> {t.showSolution}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
