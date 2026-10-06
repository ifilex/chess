export type LanguageCode = 'es' | 'en' | 'de' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja';

export type AIDifficulty = 'beginner' | 'casual' | 'intermediate' | 'master';

export interface AIDifficultyInfo {
  id: AIDifficulty;
  levelNumber: 1 | 2 | 3 | 4;
  nameKey: string;
  descKey: string;
  targetProfileKey: string;
  cognitiveFocusKey: string;
  color: string;
  rating: number;
}

export type BoardTheme = 'wood' | 'slate' | 'emerald' | 'cyber' | 'glass';

export interface CognitiveMetrics {
  executiveFunctionIndex: number; // 0 - 100
  accuracyScore: number;         // 0 - 100%
  decisionSpeedSec: number;       // Average seconds per move
  patternRecognitionScore: number;// 0 - 100
  memoryRetentionScore: number;   // 0 - 100
  attentionSpanScore: number;     // 0 - 100
}

export interface MoveAnalysisRecord {
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  player: 'w' | 'b';
  fen: string;
  evaluation: number; // centipawns (positive = white, negative = black)
  classification?: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  bestMoveSan?: string;
  timeTakenSec?: number;
}

export interface GameRecord {
  id: string;
  date: string;
  difficulty: AIDifficulty;
  userColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'draw_agreed' | 'insufficient_material';
  totalMoves: number;
  accuracy: number;
  avgTimePerMove: number;
  blundersCount: number;
  moves: MoveAnalysisRecord[];
  finalFen: string;
  cognitiveGain: number;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  byDifficulty: Record<AIDifficulty, { played: number; wins: number; avgAccuracy: number }>;
  cognitiveHistory: Array<{ date: string; score: number; accuracy: number; speed: number }>;
  puzzlesSolved: number;
  lessonsCompleted: string[];
  totalPlayTimeMinutes: number;
  lastUpdated: string;
}

export interface TutorialLesson {
  id: string;
  titleKey: string;
  categoryKey: string;
  descriptionKey: string;
  initialFen: string;
  targetMoves: string[]; // Expected SAN or move coordinates e.g. ["e2e4", "e7e5"]
  instructionKeys: string[];
  cognitiveBenefitKey: string;
}

export interface PuzzleItem {
  id: string;
  titleKey: string;
  difficulty: 'easy' | 'medium' | 'hard';
  initialFen: string;
  solutionMoves: string[]; // e.g. ["qxf7#"] or ["d1h5", "g7g6", "h5e5"]
  descriptionKey: string;
  cognitiveTheme: string;
}
