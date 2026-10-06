import { PuzzleItem } from '../types';

export const COGNITIVE_PUZZLES: PuzzleItem[] = [
  {
    id: 'puzzle_mate_1',
    titleKey: 'Mate de la Pasarela',
    difficulty: 'easy',
    initialFen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
    solutionMoves: ['b1b8'],
    descriptionKey: 'Encuentra la jugada que da Jaque Mate en la última fila.',
    cognitiveTheme: 'Visión en la última fila',
  },
  {
    id: 'puzzle_fork_1',
    titleKey: 'Doble Ataque de Caballo (Tenedor)',
    difficulty: 'easy',
    initialFen: 'r1b1k2r/pppp1ppp/8/4n3/2B1P3/8/PPP2PPP/RNB1K2R w KQkq - 0 1',
    solutionMoves: ['c4f7'],
    descriptionKey: 'Aprovecha la pieza indefensa y ataca dos puntos a la vez.',
    cognitiveTheme: 'Ataque doble y patrones relámpago',
  },
  {
    id: 'puzzle_back_rank_2',
    titleKey: 'Desviación y Mate',
    difficulty: 'medium',
    initialFen: '3r2k1/1p3ppp/8/8/8/8/1Q3PPP/6K1 w - - 0 1',
    solutionMoves: ['b2b8'],
    descriptionKey: 'Presiona el punto débil de la octava fila.',
    cognitiveTheme: 'Cálculo temático de desviaciones',
  },
  {
    id: 'puzzle_queen_sacrifice_1',
    titleKey: 'Ataque Descubierto en f7',
    difficulty: 'medium',
    initialFen: 'r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PPP2PPP/R1BQ1RK1 w kq - 0 1',
    solutionMoves: ['c4f7'],
    descriptionKey: 'Rompe la defensa del rey enemigo sacrificando la pieza en el momento oportuno.',
    cognitiveTheme: 'Cálculo inhibitorio e intuición',
  },
  {
    id: 'puzzle_smothered_mate',
    titleKey: 'Jaque Mate Ahogado',
    difficulty: 'hard',
    initialFen: '6rk/5Npp/8/8/8/8/8/6K1 w - - 0 1',
    solutionMoves: ['f7h6'],
    descriptionKey: 'Usa la agilidad del caballo para encerrar al rey rodeado de sus propias piezas.',
    cognitiveTheme: 'Atención a esquemas asimétricos',
  },
];
