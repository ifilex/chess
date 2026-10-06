import { Chess, Square, Move } from 'chess.js';
import { AIDifficulty, MoveAnalysisRecord } from '../types';

// Standard piece values in centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables for Positional AI evaluation (White's perspective; flipped for Black)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let totalEvaluation = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const pieceVal = PIECE_VALUES[piece.type] || 0;
        const squareIndex = r * 8 + c;
        let pstVal = 0;

        switch (piece.type) {
          case 'p':
            pstVal = piece.color === 'w' ? PAWN_TABLE[squareIndex] : PAWN_TABLE[63 - squareIndex];
            break;
          case 'n':
            pstVal = piece.color === 'w' ? KNIGHT_TABLE[squareIndex] : KNIGHT_TABLE[63 - squareIndex];
            break;
          case 'b':
            pstVal = piece.color === 'w' ? BISHOP_TABLE[squareIndex] : BISHOP_TABLE[63 - squareIndex];
            break;
          case 'r':
            pstVal = piece.color === 'w' ? ROOK_TABLE[squareIndex] : ROOK_TABLE[63 - squareIndex];
            break;
          case 'q':
            pstVal = piece.color === 'w' ? QUEEN_TABLE[squareIndex] : QUEEN_TABLE[63 - squareIndex];
            break;
        }

        const score = pieceVal + pstVal;
        if (piece.color === 'w') {
          totalEvaluation += score;
        } else {
          totalEvaluation -= score;
        }
      }
    }
  }

  return totalEvaluation;
}

// Alpha-Beta Minimax Search Engine
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Select move based on AI difficulty level
export function getAIMove(game: Chess, difficulty: AIDifficulty): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Level 1: Beginner / Mild Cognitive (Random + soft captures)
  if (difficulty === 'beginner') {
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Level 2: Casual / Active Focus (Depth 2 Minimax)
  if (difficulty === 'casual') {
    const isMaximizing = game.turn() === 'w';
    let bestMove: Move | null = null;
    let bestVal = isMaximizing ? -Infinity : Infinity;

    // Add small random noise to prevent identical games
    for (const move of moves) {
      game.move(move);
      const val = minimax(game, 1, -Infinity, Infinity, !isMaximizing) + (Math.random() * 20 - 10);
      game.undo();

      if (isMaximizing ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestMove = move;
      }
    }
    return bestMove || moves[0];
  }

  // Level 3: Intermediate / Tactical Challenge (Depth 3 Alpha-Beta)
  if (difficulty === 'intermediate') {
    const isMaximizing = game.turn() === 'w';
    let bestMove: Move | null = null;
    let bestVal = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
      game.move(move);
      const val = minimax(game, 2, -Infinity, Infinity, !isMaximizing);
      game.undo();

      if (isMaximizing ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestMove = move;
      }
    }
    return bestMove || moves[0];
  }

  // Level 4: Master / Executive Peak (Depth 3-4 with Move Ordering)
  const isMaximizing = game.turn() === 'w';
  let bestMove: Move | null = null;
  let bestVal = isMaximizing ? -Infinity : Infinity;

  // Sort captures first for alpha-beta efficiency
  const sortedMoves = [...moves].sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  for (const move of sortedMoves) {
    game.move(move);
    const val = minimax(game, 3, -Infinity, Infinity, !isMaximizing);
    game.undo();

    if (isMaximizing ? val > bestVal : val < bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}

// Generate best hint move for player
export function getHintMove(game: Chess): Move | null {
  return getAIMove(game, 'master');
}

// Classify move quality for Analysis Mode
export function classifyMoveQuality(
  prevEval: number,
  currEval: number,
  playerTurn: 'w' | 'b'
): 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
  // Positive eval = White advantage, Negative eval = Black advantage
  const delta = playerTurn === 'w' ? currEval - prevEval : prevEval - currEval;

  if (delta >= 150) return 'brilliant';
  if (delta >= 50) return 'great';
  if (delta >= -30) return 'good';
  if (delta >= -100) return 'inaccuracy';
  if (delta >= -250) return 'mistake';
  return 'blunder';
}

// Helper to make move safely on chess.js instance
export function makeSafeMove(game: Chess, move: { from: string; to: string; promotion?: string }): Move | null {
  try {
    return game.move(move);
  } catch {
    return null;
  }
}
