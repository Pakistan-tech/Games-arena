import { CareerScoreCard, MatchRecord, StageRecord } from '../types/game';

const SCORECARD_KEY = 'ae_career_scorecard_v2';

const DEFAULT_SCORECARD: CareerScoreCard = {
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  totalArrowsEscaped: 0,
  lifetimeScore: 0,
  highestSingleScore: 0,
  bestComboStreak: 0,
  totalPlayTimeSec: 0,
  totalCleanTaps: 0,
  totalMistakes: 0,
  stageProgress: {
    1: { stageId: 1, completed: false, stars: 0, bestScore: 0, bestTimeSec: 0 }
  },
  recentMatches: []
};

export class ScoreService {
  private static cached: CareerScoreCard | null = null;

  public static getScoreCard(): CareerScoreCard {
    if (this.cached) return this.cached;
    try {
      const data = localStorage.getItem(SCORECARD_KEY);
      if (data) {
        const parsed = JSON.parse(data) as CareerScoreCard;
        // Ensure default structure
        this.cached = {
          ...DEFAULT_SCORECARD,
          ...parsed,
          stageProgress: parsed.stageProgress || DEFAULT_SCORECARD.stageProgress,
          recentMatches: parsed.recentMatches || []
        };
        // Ensure Stage 1 is at least unlocked
        if (!this.cached.stageProgress[1]) {
          this.cached.stageProgress[1] = { stageId: 1, completed: false, stars: 0, bestScore: 0, bestTimeSec: 0 };
        }
        return this.cached;
      }
    } catch {
      // fallback
    }
    this.cached = { ...DEFAULT_SCORECARD };
    return this.cached;
  }

  public static saveScoreCard(card: CareerScoreCard): void {
    this.cached = card;
    try {
      localStorage.setItem(SCORECARD_KEY, JSON.stringify(card));
    } catch (e) {
      console.warn("Failed to persist scorecard", e);
    }
  }

  public static recordGameEnd(params: {
    mode: 'stage' | 'picture' | 'free' | 'daily';
    stageId?: number;
    stageName: string;
    won: boolean;
    score: number;
    stars: number;
    timeSec: number;
    mistakes: number;
    arrowsCleared: number;
    totalArrows: number;
    maxCombo: number;
  }): { card: CareerScoreCard; isNewHighRecord: boolean; unlockedNextStage: boolean } {
    const card = this.getScoreCard();

    card.totalGamesPlayed += 1;
    card.totalArrowsEscaped += params.arrowsCleared;
    card.totalPlayTimeSec += params.timeSec;
    card.totalCleanTaps += params.arrowsCleared;
    card.totalMistakes += params.mistakes;

    let isNewHighRecord = false;
    let unlockedNextStage = false;

    if (params.won) {
      card.totalGamesWon += 1;
      card.lifetimeScore += params.score;

      if (params.score > card.highestSingleScore) {
        card.highestSingleScore = params.score;
        isNewHighRecord = true;
      }

      if (params.maxCombo > card.bestComboStreak) {
        card.bestComboStreak = params.maxCombo;
      }

      // If in stage mode, update stage record & unlock next stage
      if (params.mode === 'stage' && params.stageId) {
        const stageId = params.stageId;
        const currentStageRec = card.stageProgress[stageId] || {
          stageId,
          completed: false,
          stars: 0,
          bestScore: 0,
          bestTimeSec: 0
        };

        const newStars = Math.max(currentStageRec.stars, params.stars);
        const newBestScore = Math.max(currentStageRec.bestScore, params.score);
        const newBestTime = currentStageRec.bestTimeSec === 0 
          ? params.timeSec 
          : Math.min(currentStageRec.bestTimeSec, params.timeSec);

        card.stageProgress[stageId] = {
          stageId,
          completed: true,
          stars: newStars,
          bestScore: newBestScore,
          bestTimeSec: newBestTime
        };

        // Unlock next stage if not already available
        const nextStageId = stageId + 1;
        if (!card.stageProgress[nextStageId]) {
          card.stageProgress[nextStageId] = {
            stageId: nextStageId,
            completed: false,
            stars: 0,
            bestScore: 0,
            bestTimeSec: 0
          };
          unlockedNextStage = true;
        }
      }
    }

    // Add to recent matches log (limit to 50)
    const matchRecord: MatchRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      mode: params.mode,
      stageName: params.stageName,
      won: params.won,
      score: params.score,
      stars: params.stars,
      timeSec: params.timeSec,
      mistakes: params.mistakes,
      arrowsCleared: params.arrowsCleared,
      totalArrows: params.totalArrows,
      maxCombo: params.maxCombo
    };

    card.recentMatches = [matchRecord, ...card.recentMatches].slice(0, 50);

    this.saveScoreCard(card);
    return { card, isNewHighRecord, unlockedNextStage };
  }

  public static getRank(card: CareerScoreCard): { title: string; tier: number; progress: number; nextThreshold: number } {
    const score = card.lifetimeScore;
    const ranks = [
      { title: "Novice Escapee", threshold: 0 },
      { title: "Apprentice Pathfinder", threshold: 2500 },
      { title: "Vector Tactician", threshold: 8000 },
      { title: "Kinetic Strategist", threshold: 18000 },
      { title: "Labyrinth Master", threshold: 35000 },
      { title: "Arrow Virtuoso", threshold: 60000 },
      { title: "Grandmaster Navigator", threshold: 100000 },
      { title: "Apex Chrono-Master", threshold: 180000 },
    ];

    let currentRankIdx = 0;
    for (let i = 0; i < ranks.length; i++) {
      if (score >= ranks[i].threshold) {
        currentRankIdx = i;
      } else {
        break;
      }
    }

    const currentRank = ranks[currentRankIdx];
    const nextRank = ranks[currentRankIdx + 1];

    if (!nextRank) {
      return {
        title: currentRank.title,
        tier: currentRankIdx + 1,
        progress: 100,
        nextThreshold: currentRank.threshold
      };
    }

    const span = nextRank.threshold - currentRank.threshold;
    const gained = score - currentRank.threshold;
    const progress = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));

    return {
      title: currentRank.title,
      tier: currentRankIdx + 1,
      progress,
      nextThreshold: nextRank.threshold
    };
  }

  public static resetScoreCard(): CareerScoreCard {
    const card: CareerScoreCard = {
      ...DEFAULT_SCORECARD,
      stageProgress: {
        1: { stageId: 1, completed: false, stars: 0, bestScore: 0, bestTimeSec: 0 }
      },
      recentMatches: []
    };
    this.saveScoreCard(card);
    return card;
  }
}
