export type Direction = 0 | 1 | 2 | 3; // 0: Up, 1: Right, 2: Down, 3: Left

export interface Arrow {
  id: number;
  c: [number, number][]; // coordinates [x, y]
  d: Direction;          // slide direction
  color?: string;
}

export type GameMode = 'stage' | 'picture' | 'free' | 'daily';

export interface StageConfig {
  id: number;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  w: number;
  h: number;
  minLen: number;
  maxLen: number;
  parTime: number; // in seconds
  lives: number;
  hints: number;
  description: string;
  isSpecialStage?: 'easy' | 'difficult';
  shapeMask?: string;
}

export interface GameSnapshot {
  stageId: number;
  stageName: string;
  mode: GameMode;
  activeArrowIds: number[];
  arrows: Arrow[];
  w: number;
  h: number;
  elapsedSec: number;
  totalStageTime?: number;
  timeLeft?: number;
  score: number;
  mistakes: number;
  hints: number;
  combo: number;
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: GameMode;
  stageName: string;
  won: boolean;
  score: number;
  stars: number;
  timeSec: number;
  mistakes: number;
  arrowsCleared: number;
  totalArrows: number;
  maxCombo: number;
}

export interface StageRecord {
  stageId: number;
  completed: boolean;
  stars: number;
  bestScore: number;
  bestTimeSec: number;
}

export interface CareerScoreCard {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalArrowsEscaped: number;
  lifetimeScore: number;
  highestSingleScore: number;
  bestComboStreak: number;
  totalPlayTimeSec: number;
  totalCleanTaps: number;
  totalMistakes: number;
  stageProgress: Record<number, StageRecord>;
  recentMatches: MatchRecord[];
}

export interface PictureShape {
  n: string;
  w: number;
  h: number;
  o: (string | number)[][];
}

export interface FreeConfig {
  id: string;
  w: number;
  h: number;
  a: number;
  b: number;
  name: string;
}
