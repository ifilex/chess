import { GameRecord, UserStats, BoardTheme, LanguageCode, AIDifficulty } from '../types';

const STATS_STORAGE_KEY = 'cognichess_user_stats_v1';
const GAMES_STORAGE_KEY = 'cognichess_game_records_v1';
const SETTINGS_STORAGE_KEY = 'cognichess_settings_v1';

export interface AppSettings {
  boardTheme: BoardTheme;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showLegalMoves: boolean;
  language: LanguageCode;
}

const DEFAULT_SETTINGS: AppSettings = {
  boardTheme: 'wood',
  soundEnabled: true,
  hapticsEnabled: true,
  showLegalMoves: true,
  language: 'es',
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  byDifficulty: {
    beginner: { played: 0, wins: 0, avgAccuracy: 0 },
    casual: { played: 0, wins: 0, avgAccuracy: 0 },
    intermediate: { played: 0, wins: 0, avgAccuracy: 0 },
    master: { played: 0, wins: 0, avgAccuracy: 0 },
  },
  cognitiveHistory: [],
  puzzlesSolved: 0,
  lessonsCompleted: [],
  totalPlayTimeMinutes: 0,
  lastUpdated: new Date().toISOString(),
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    stats.lastUpdated = new Date().toISOString();
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats:', e);
  }
}

export function loadGameRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGameRecord(record: GameRecord): UserStats {
  const records = loadGameRecords();
  records.unshift(record);
  // Keep max 50 recent games locally
  if (records.length > 50) records.pop();

  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save game records:', e);
  }

  // Update user stats
  const stats = loadUserStats();
  stats.gamesPlayed += 1;

  if (record.result === 'win') {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else if (record.result === 'loss') {
    stats.losses += 1;
    stats.currentStreak = 0;
  } else {
    stats.draws += 1;
  }

  // Difficulty breakdown
  const diffStats = stats.byDifficulty[record.difficulty] || { played: 0, wins: 0, avgAccuracy: 0 };
  const prevPlayed = diffStats.played;
  diffStats.played += 1;
  if (record.result === 'win') diffStats.wins += 1;
  diffStats.avgAccuracy = Math.round((diffStats.avgAccuracy * prevPlayed + record.accuracy) / diffStats.played);
  stats.byDifficulty[record.difficulty] = diffStats;

  // Add cognitive timeline point
  const todayStr = new Date().toLocaleDateString();
  const overallCognitiveScore = Math.min(
    100,
    Math.round(
      record.accuracy * 0.4 +
        (100 - Math.min(record.avgTimePerMove * 5, 60)) * 0.3 +
        (record.result === 'win' ? 30 : 15)
    )
  );

  stats.cognitiveHistory.push({
    date: todayStr,
    score: overallCognitiveScore,
    accuracy: record.accuracy,
    speed: record.avgTimePerMove,
  });

  if (stats.cognitiveHistory.length > 30) {
    stats.cognitiveHistory.shift();
  }

  saveUserStats(stats);
  return stats;
}

export function recordPuzzleSolved(): UserStats {
  const stats = loadUserStats();
  stats.puzzlesSolved += 1;
  saveUserStats(stats);
  return stats;
}

export function recordLessonCompleted(lessonId: string): UserStats {
  const stats = loadUserStats();
  if (!stats.lessonsCompleted.includes(lessonId)) {
    stats.lessonsCompleted.push(lessonId);
    saveUserStats(stats);
  }
  return stats;
}

export function resetAllData(): void {
  localStorage.removeItem(STATS_STORAGE_KEY);
  localStorage.removeItem(GAMES_STORAGE_KEY);
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
}
