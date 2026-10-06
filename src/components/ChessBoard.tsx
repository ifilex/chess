import React, { useState } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { BoardTheme } from '../types';

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square, promotion?: string) => boolean;
  flipped?: boolean;
  theme?: BoardTheme;
  showLegalMoves?: boolean;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
}

// Crisp Vector SVG Pieces for White and Black
const PIECE_SVGS: Record<string, React.ReactNode> = {
  wP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  wN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,26.23 10,26 C 11.5,25 10.15,23.03 12,23 C 13.5,23 16,21 16,20 C 16,19 15,16 18,13.5 C 20.31,11.58 22,10 22,10 z" fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" />
      <circle cx="27" cy="16" r="1.5" fill="#1c1917" />
    </svg>
  ),
  wB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="none" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round">
        <path d="M9 36c1.24-2.59 6.01-4.85 13.5-4.85 7.49 0 12.26 2.26 13.5 4.85M12 39c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5M28 39c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5" fill="#ffffff"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#ffffff"/>
        <circle cx="22.5" cy="8.5" r="2" fill="#ffffff"/>
      </g>
    </svg>
  ),
  wR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 18H13l-2-18zM9 10h5v4H9v-4zM16 10h4v4h-4v-4zM22 10h4v4h-4v-4zM28 10h8v4h-8v-4z"/>
      </g>
    </svg>
  ),
  wQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#ffffff" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 39h29v-3H8v3zM10.5 36h24l1-4h-26l1 4zM9 26l3 6h21l3-6L34 13l-5 11-6.5-11L16 24 11 13 9 26z"/>
        <circle cx="9" cy="12" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="22.5" cy="10" r="2"/><circle cx="29" cy="11" r="2"/><circle cx="36" cy="12" r="2"/>
      </g>
    </svg>
  ),
  wK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="none" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5M22.5 25c-4 0-7.5 2-7.5 6h15c0-4-3.5-6-7.5-6z" fill="#ffffff"/>
        <path d="M11.5 37c1.25-2.5 5.5-4.5 11-4.5s9.75 2 11 4.5M10.5 39.5h24" fill="#ffffff"/>
        <path d="M22.5 13c-4.5 0-8 3.5-8 8 0 4 3 6.5 8 11 5-4.5 8-7 8-11 0-4.5-3.5-8-8-8z" fill="#ffffff"/>
      </g>
    </svg>
  ),
  bP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#292524" stroke="#f5f5f4" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  bN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#292524" stroke="#f5f5f4" strokeWidth="1.5" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,26.23 10,26 C 11.5,25 10.15,23.03 12,23 C 13.5,23 16,21 16,20 C 16,19 15,16 18,13.5 C 20.31,11.58 22,10 22,10 z" fill="#292524" stroke="#f5f5f4" strokeWidth="1.5" />
      <circle cx="27" cy="16" r="1.5" fill="#f5f5f4" />
    </svg>
  ),
  bB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="none" stroke="#f5f5f4" strokeWidth="1.5" strokeLinecap="round">
        <path d="M9 36c1.24-2.59 6.01-4.85 13.5-4.85 7.49 0 12.26 2.26 13.5 4.85M12 39c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5M28 39c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5" fill="#292524"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#292524"/>
        <circle cx="22.5" cy="8.5" r="2" fill="#292524"/>
      </g>
    </svg>
  ),
  bR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#292524" stroke="#f5f5f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 18H13l-2-18zM9 10h5v4H9v-4zM16 10h4v4h-4v-4zM22 10h4v4h-4v-4zM28 10h8v4h-8v-4z"/>
      </g>
    </svg>
  ),
  bQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#292524" stroke="#f5f5f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 39h29v-3H8v3zM10.5 36h24l1-4h-26l1 4zM9 26l3 6h21l3-6L34 13l-5 11-6.5-11L16 24 11 13 9 26z"/>
        <circle cx="9" cy="12" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="22.5" cy="10" r="2"/><circle cx="29" cy="11" r="2"/><circle cx="36" cy="12" r="2"/>
      </g>
    </svg>
  ),
  bK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="none" stroke="#f5f5f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5M22.5 25c-4 0-7.5 2-7.5 6h15c0-4-3.5-6-7.5-6z" fill="#292524"/>
        <path d="M11.5 37c1.25-2.5 5.5-4.5 11-4.5s9.75 2 11 4.5M10.5 39.5h24" fill="#292524"/>
        <path d="M22.5 13c-4.5 0-8 3.5-8 8 0 4 3 6.5 8 11 5-4.5 8-7 8-11 0-4.5-3.5-8-8-8z" fill="#292524"/>
      </g>
    </svg>
  ),
};

// Theme Color Classes
const THEME_STYLES: Record<BoardTheme, { lightSquare: string; darkSquare: string; border: string }> = {
  wood: {
    lightSquare: 'bg-[#f0d9b5] text-[#b58863]',
    darkSquare: 'bg-[#b58863] text-[#f0d9b5]',
    border: 'border-[#8a5d3b]',
  },
  slate: {
    lightSquare: 'bg-[#e2e8f0] text-[#475569]',
    darkSquare: 'bg-[#64748b] text-[#e2e8f0]',
    border: 'border-[#334155]',
  },
  emerald: {
    lightSquare: 'bg-[#eeeed2] text-[#769656]',
    darkSquare: 'bg-[#769656] text-[#eeeed2]',
    border: 'border-[#4b6b32]',
  },
  cyber: {
    lightSquare: 'bg-[#1e293b] text-[#06b6d4]',
    darkSquare: 'bg-[#0f172a] text-[#38bdf8]',
    border: 'border-[#0284c7]',
  },
  glass: {
    lightSquare: 'bg-white/80 text-stone-700',
    darkSquare: 'bg-stone-300/80 text-stone-100',
    border: 'border-stone-400',
  },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  onMove,
  flipped = false,
  theme = 'wood',
  showLegalMoves = true,
  disabled = false,
  lastMove = null,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);

  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.wood;

  // Compute ranks and files order based on orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  // Handle click or tap on square
  const handleSquareClick = (square: Square) => {
    if (disabled) return;

    // If square already selected, check if clicking a valid move square
    if (selectedSquare) {
      if (validMoves.includes(square)) {
        // Attempt move
        const success = onMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      }
    }

    // Otherwise, select piece on current square if it belongs to current player turn
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      if (showLegalMoves) {
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to));
      } else {
        setValidMoves([]);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Find King square if in check
  let checkKingSquare: Square | null = null;
  if (game.inCheck()) {
    const turnColor = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turnColor) {
          checkKingSquare = `${files[c]}${ranks[r]}` as Square;
        }
      }
    }
  }

  return (
    <div className={`relative w-full aspect-square max-w-xl mx-auto rounded-xl shadow-2xl p-2 md:p-3 border-4 ${themeStyle.border} bg-stone-900 select-none touch-none`}>
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden border border-stone-700">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = game.get(square);
            const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;

            const isSelected = selectedSquare === square;
            const isValidDestination = validMoves.includes(square);
            const isLastMoveOrigin = lastMove?.from === square;
            const isLastMoveTarget = lastMove?.to === square;
            const isKingInCheck = checkKingSquare === square;

            const key = `${piece?.color}${piece?.type?.toUpperCase()}`;

            return (
              <button
                key={square}
                id={`square-${square}`}
                type="button"
                onClick={() => handleSquareClick(square)}
                className={`relative flex items-center justify-center transition-all duration-150 ${
                  isLight ? themeStyle.lightSquare : themeStyle.darkSquare
                } ${
                  isSelected
                    ? 'ring-4 ring-amber-400 ring-inset z-20 brightness-110'
                    : ''
                } ${
                  isLastMoveOrigin || isLastMoveTarget
                    ? 'bg-amber-300/40 dark:bg-amber-600/40'
                    : ''
                } ${
                  isKingInCheck
                    ? 'bg-red-500/80 animate-pulse ring-4 ring-red-600 ring-inset z-20'
                    : ''
                }`}
              >
                {/* Coordinates labels on edges */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] md:text-xs font-semibold opacity-70 pointer-events-none`}
                  >
                    {rank}
                  </span>
                )}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] md:text-xs font-semibold opacity-70 pointer-events-none`}
                  >
                    {file}
                  </span>
                )}

                {/* Valid move indicator dot or capture ring */}
                {isValidDestination && (
                  <div
                    className={`absolute z-10 pointer-events-none ${
                      piece
                        ? 'w-full h-full border-4 border-amber-500/80 rounded-full animate-ping'
                        : 'w-3 h-3 md:w-4 md:h-4 bg-amber-500/80 rounded-full shadow-md'
                    }`}
                  />
                )}

                {/* Render Piece SVG */}
                {piece && (
                  <div className="w-[82%] h-[82%] pointer-events-none transition-transform duration-100 transform hover:scale-105 active:scale-95">
                    {PIECE_SVGS[key]}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
