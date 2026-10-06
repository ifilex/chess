import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { AIDifficulty, GameRecord, LanguageCode, MoveAnalysisRecord } from '../types';
import { translations } from '../i18n/translations';
import { ChessBoard } from './ChessBoard';
import { getAIMove, getHintMove, evaluateBoard, classifyMoveQuality } from '../utils/chessEngine';
import { soundFX } from '../utils/audio';
import { saveGameRecord, AppSettings } from '../utils/storage';
import { Brain, RotateCcw, Lightbulb, RefreshCw, Flag, BarChart3, Trophy, Sparkles, AlertCircle } from 'lucide-react';

interface GameViewProps {
  settings: AppSettings;
  lang: LanguageCode;
  onGameFinished: (record: GameRecord) => void;
  onOpenAnalysis: (record: GameRecord) => void;
}

const DIFFICULTY_CONFIG: Array<{ id: AIDifficulty; level: number; nameKey: string; color: string }> = [
  { id: 'beginner', level: 1, nameKey: 'diff1Name', color: 'from-emerald-600 to-emerald-800' },
  { id: 'casual', level: 2, nameKey: 'diff2Name', color: 'from-blue-600 to-blue-800' },
  { id: 'intermediate', level: 3, nameKey: 'diff3Name', color: 'from-amber-600 to-amber-800' },
  { id: 'master', level: 4, nameKey: 'diff4Name', color: 'from-rose-600 to-rose-800' },
];

export const GameView: React.FC<GameViewProps> = ({
  settings,
  lang,
  onGameFinished,
  onOpenAnalysis,
}) => {
  const t = translations[lang] || translations.es;

  const [difficulty, setDifficulty] = useState<AIDifficulty>('casual');
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveAnalysisRecord[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [gameOverResult, setGameOverResult] = useState<{
    result: 'win' | 'loss' | 'draw';
    reason: 'checkmate' | 'stalemate' | 'resignation' | 'draw_agreed' | 'insufficient_material';
  } | null>(null);

  const moveStartTimeRef = useRef<number>(Date.now());
  const [lastGameRecord, setLastGameRecord] = useState<GameRecord | null>(null);

  // Start a fresh new game
  const startNewGame = () => {
    const newG = new Chess();
    setGame(newG);
    setMoveHistory([]);
    setLastMove(null);
    setGameOverResult(null);
    setLastGameRecord(null);
    setIsAiThinking(false);
    moveStartTimeRef.current = Date.now();
  };

  // AI Turn Trigger
  useEffect(() => {
    if (gameOverResult || isAiThinking) return;

    // Check if game is over
    if (game.isGameOver()) {
      handleGameOver();
      return;
    }

    // If it's Black's turn (AI), trigger AI move
    if (game.turn() === 'b') {
      setIsAiThinking(true);
      const aiDelay = difficulty === 'beginner' ? 700 : 400;

      const timer = setTimeout(() => {
        const prevEval = evaluateBoard(game);
        const aiMove = getAIMove(game, difficulty);

        if (aiMove) {
          try {
            const executed = game.move(aiMove);
            if (executed) {
              const currEval = evaluateBoard(game);
              const quality = classifyMoveQuality(prevEval, currEval, 'b');

              if (executed.captured) {
                soundFX.playCapture();
              } else {
                soundFX.playMove();
              }

              if (game.inCheck()) {
                soundFX.playCheck();
              }

              setLastMove({ from: executed.from as Square, to: executed.to as Square });

              const newRecord: MoveAnalysisRecord = {
                moveNumber: moveHistory.length + 1,
                san: executed.san,
                from: executed.from,
                to: executed.to,
                player: 'b',
                fen: game.fen(),
                evaluation: currEval,
                classification: quality,
                timeTakenSec: 1,
              };

              setMoveHistory((prev) => [...prev, newRecord]);
              setGame(new Chess(game.fen()));
            }
          } catch (e) {
            console.error('AI move execution error:', e);
          }
        }

        setIsAiThinking(false);
        moveStartTimeRef.current = Date.now();

        if (game.isGameOver()) {
          handleGameOver();
        }
      }, aiDelay);

      return () => clearTimeout(timer);
    }
  }, [game, difficulty, isAiThinking, gameOverResult]);

  // Handle Player Move
  const handlePlayerMove = (from: Square, to: Square, promotion: string = 'q'): boolean => {
    if (game.turn() !== 'w' || isAiThinking || gameOverResult) return false;

    const prevEval = evaluateBoard(game);
    const timeTaken = Math.max(1, Math.round((Date.now() - moveStartTimeRef.current) / 1000));

    try {
      const executed = game.move({ from, to, promotion });
      if (!executed) return false;

      const currEval = evaluateBoard(game);
      const quality = classifyMoveQuality(prevEval, currEval, 'w');

      if (executed.captured) {
        soundFX.playCapture();
      } else {
        soundFX.playMove();
      }

      if (game.inCheck()) {
        soundFX.playCheck();
      }

      setLastMove({ from: executed.from as Square, to: executed.to as Square });

      const newRecord: MoveAnalysisRecord = {
        moveNumber: moveHistory.length + 1,
        san: executed.san,
        from: executed.from,
        to: executed.to,
        player: 'w',
        fen: game.fen(),
        evaluation: currEval,
        classification: quality,
        timeTakenSec: timeTaken,
      };

      setMoveHistory((prev) => [...prev, newRecord]);
      setGame(new Chess(game.fen()));

      if (game.isGameOver()) {
        handleGameOver();
      }

      return true;
    } catch {
      return false;
    }
  };

  // Undo Move (undo both player move and AI move)
  const handleUndo = () => {
    if (moveHistory.length < 2 || isAiThinking || gameOverResult) return;

    game.undo(); // Undo AI move
    game.undo(); // Undo Player move

    const updatedHistory = moveHistory.slice(0, -2);
    setMoveHistory(updatedHistory);
    setLastMove(
      updatedHistory.length > 0
        ? { from: updatedHistory[updatedHistory.length - 1].from as Square, to: updatedHistory[updatedHistory.length - 1].to as Square }
        : null
    );
    setGame(new Chess(game.fen()));
    soundFX.playMove();
  };

  // Give Hint
  const handleHint = () => {
    if (game.turn() !== 'w' || isAiThinking || gameOverResult) return;
    const hint = getHintMove(game);
    if (hint) {
      soundFX.playHint();
      setLastMove({ from: hint.from as Square, to: hint.to as Square });
    }
  };

  // Resign Game
  const handleResign = () => {
    if (gameOverResult) return;
    setGameOverResult({ result: 'loss', reason: 'resignation' });
    soundFX.playLoss();
    finalizeRecord('loss', 'resignation');
  };

  // Game Over Handler
  const handleGameOver = () => {
    if (gameOverResult) return;

    let res: 'win' | 'loss' | 'draw' = 'draw';
    let reas: 'checkmate' | 'stalemate' | 'resignation' | 'draw_agreed' | 'insufficient_material' = 'draw_agreed';

    if (game.isCheckmate()) {
      reas = 'checkmate';
      res = game.turn() === 'b' ? 'win' : 'loss'; // If Black's turn, White (Player) delivered mate!
    } else if (game.isStalemate()) {
      reas = 'stalemate';
      res = 'draw';
    } else if (game.isInsufficientMaterial()) {
      reas = 'insufficient_material';
      res = 'draw';
    }

    setGameOverResult({ result: res, reason: reas });

    if (res === 'win') {
      soundFX.playWin();
    } else if (res === 'loss') {
      soundFX.playLoss();
    }

    finalizeRecord(res, reas);
  };

  const finalizeRecord = (
    res: 'win' | 'loss' | 'draw',
    reas: 'checkmate' | 'stalemate' | 'resignation' | 'draw_agreed' | 'insufficient_material'
  ) => {
    // Calculate player accuracy score based on non-blunder moves
    const playerMoves = moveHistory.filter((m) => m.player === 'w');
    const goodMoves = playerMoves.filter((m) => m.classification === 'brilliant' || m.classification === 'great' || m.classification === 'good');
    const accuracy = playerMoves.length > 0 ? Math.round((goodMoves.length / playerMoves.length) * 100) : 80;

    const blunders = playerMoves.filter((m) => m.classification === 'blunder').length;
    const avgTime = playerMoves.length > 0 ? Math.round(playerMoves.reduce((a, b) => a + (b.timeTakenSec || 3), 0) / playerMoves.length) : 3;

    const record: GameRecord = {
      id: `game_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      difficulty,
      userColor: 'w',
      result: res,
      reason: reas,
      totalMoves: moveHistory.length,
      accuracy,
      avgTimePerMove: avgTime,
      blundersCount: blunders,
      moves: moveHistory,
      finalFen: game.fen(),
      cognitiveGain: res === 'win' ? 15 : 5,
    };

    saveGameRecord(record);
    setLastGameRecord(record);
    onGameFinished(record);
  };

  // Captured pieces calculation
  const board = game.board();
  const capturedWhitePieces: string[] = [];
  const capturedBlackPieces: string[] = [];
  // Standard piece counts
  const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const currentCounts: Record<string, number> = { wp: 0, wn: 0, wb: 0, wr: 0, wq: 0, bp: 0, bn: 0, bb: 0, br: 0, bq: 0 };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type !== 'k') {
        const key = `${p.color}${p.type}`;
        currentCounts[key] = (currentCounts[key] || 0) + 1;
      }
    }
  }

  Object.keys(initialCounts).forEach((pt) => {
    const missingWhite = initialCounts[pt] - (currentCounts[`w${pt}`] || 0);
    for (let i = 0; i < missingWhite; i++) capturedWhitePieces.push(pt.toUpperCase());

    const missingBlack = initialCounts[pt] - (currentCounts[`b${pt}`] || 0);
    for (let i = 0; i < missingBlack; i++) capturedBlackPieces.push(pt);
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* AI Difficulty Selector Bar */}
      <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4" /> Nivel de Dificultad de la IA
          </span>
          <span className="text-[11px] text-stone-400 font-medium">
            Entrenamiento de Estimulación Cognitiva
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {DIFFICULTY_CONFIG.map((d) => {
            const isActive = difficulty === d.id;
            const labelStr = t[d.nameKey as keyof typeof t] || d.nameKey;

            return (
              <button
                key={d.id}
                onClick={() => {
                  setDifficulty(d.id);
                  if (moveHistory.length === 0) startNewGame();
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{labelStr.split('•')[0]}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700">
                    Nivel {d.level}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 line-clamp-1">{labelStr.split('•')[1] || ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Chess Board */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          {/* Top Status Bar (Opponent / Turn) */}
          <div className="w-full max-w-xl flex items-center justify-between bg-stone-900/90 px-4 py-2.5 rounded-xl border border-stone-800 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-100 border border-stone-400" />
              <span className="text-xs font-bold text-stone-200">{t.aiOpponent}</span>
              {isAiThinking && (
                <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
                  ({t.aiThinking})
                </span>
              )}
            </div>
            {/* Captured Black Pieces */}
            <div className="flex items-center gap-0.5 text-stone-400 text-xs font-mono">
              {capturedBlackPieces.map((p, idx) => (
                <span key={idx} className="opacity-80">{p}</span>
              ))}
            </div>
          </div>

          <ChessBoard
            game={game}
            onMove={handlePlayerMove}
            flipped={boardFlipped}
            theme={settings.boardTheme}
            showLegalMoves={settings.showLegalMoves}
            disabled={isAiThinking || !!gameOverResult}
            lastMove={lastMove}
          />

          {/* Bottom Status Bar (Player) */}
          <div className="w-full max-w-xl flex items-center justify-between bg-stone-900/90 px-4 py-2.5 rounded-xl border border-stone-800 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow" />
              <span className="text-xs font-bold text-stone-200">{t.you} ({t.whitePlayer})</span>
              {game.turn() === 'w' && !gameOverResult && (
                <span className="text-[10px] text-emerald-400 font-semibold">
                  ({t.yourTurn})
                </span>
              )}
            </div>
            {/* Captured White Pieces */}
            <div className="flex items-center gap-0.5 text-stone-400 text-xs font-mono">
              {capturedWhitePieces.map((p, idx) => (
                <span key={idx} className="opacity-80">{p}</span>
              ))}
            </div>
          </div>

          {/* Check Notification Banner */}
          {game.inCheck() && !gameOverResult && (
            <div className="w-full max-w-xl bg-rose-950/80 border border-rose-500/50 p-2.5 rounded-xl text-center flex items-center justify-center gap-2 text-rose-300 font-bold text-xs animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-400" /> {t.checkNotice}
            </div>
          )}
        </div>

        {/* Right: Game Action Controls & History Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Action Buttons Panel */}
          <div className="bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl space-y-3">
            <button
              id="start-new-game-btn"
              onClick={startNewGame}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> {t.newGame}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="undo-move-btn"
                onClick={handleUndo}
                disabled={moveHistory.length < 2 || isAiThinking || !!gameOverResult}
                className="py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.undo}
              </button>

              <button
                id="get-hint-btn"
                onClick={handleHint}
                disabled={game.turn() !== 'w' || isAiThinking || !!gameOverResult}
                className="py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs rounded-xl border border-stone-700 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {t.hint}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="flip-board-btn"
                onClick={() => setBoardFlipped(!boardFlipped)}
                className="py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-xl border border-stone-700 transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t.flipBoard}
              </button>

              <button
                id="resign-game-btn"
                onClick={handleResign}
                disabled={!!gameOverResult}
                className="py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs rounded-xl border border-rose-500/40 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Flag className="w-3.5 h-3.5" /> {t.resign}
              </button>
            </div>
          </div>

          {/* Live Move History List */}
          <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl space-y-2 max-h-[260px] overflow-y-auto">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Historial de Jugadas</h4>
            {moveHistory.length === 0 ? (
              <p className="text-xs text-stone-500 italic text-center py-4">Haz tu primera jugada para iniciar la partida.</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {moveHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-stone-800/60 rounded text-stone-300 flex items-center justify-between"
                  >
                    <span>
                      {Math.floor(idx / 2) + 1}. {m.player === 'w' ? '' : '... '}{m.san}
                    </span>
                    {m.classification === 'brilliant' && <span className="text-[10px]">⭐</span>}
                    {m.classification === 'blunder' && <span className="text-[10px]">🔴</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Over Dialog Modal */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-stone-100">
                {gameOverResult.result === 'win' && t.checkmateWin}
                {gameOverResult.result === 'loss' && t.checkmateLoss}
                {gameOverResult.result === 'draw' && (gameOverResult.reason === 'stalemate' ? t.stalemateDraw : t.drawAgreed)}
              </h3>
              <p className="text-xs text-stone-400 mt-1">Partida guardada en tu historial de progreso cognitivo.</p>
            </div>

            {lastGameRecord && (
              <div className="bg-stone-800/80 p-3.5 rounded-xl border border-stone-700/60 grid grid-cols-2 gap-3 text-left text-xs">
                <div>
                  <span className="text-stone-400 block">{t.accuracyLabel}</span>
                  <span className="text-sm font-bold text-emerald-400">{lastGameRecord.accuracy}%</span>
                </div>
                <div>
                  <span className="text-stone-400 block">{t.avgSpeed}</span>
                  <span className="text-sm font-bold text-amber-400">{lastGameRecord.avgTimePerMove}s</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (lastGameRecord) onOpenAnalysis(lastGameRecord);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4" /> {t.analyze}
              </button>
              <button
                onClick={startNewGame}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> {t.newGame}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
