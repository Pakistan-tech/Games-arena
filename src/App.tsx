/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Palette,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Sparkles,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Layers
} from 'lucide-react';
import { Arrow, Direction, GameMode, CareerScoreCard, GameSnapshot } from './types/game';
import {
  generateGuaranteedPuzzle,
  rayHit,
  getStageConfig,
  getShapeForStage,
  STAGE_CONFIGS,
  PICTURE_SHAPES,
  FREE_CONFIGS,
  raster,
  MYTHIC_DRAGON
} from './services/puzzleEngine';
import { sound } from './services/sound';
import { ScoreService } from './services/scoreService';
import { GameBoard } from './components/GameBoard';
import { HUD } from './components/HUD';
import { ScorecardModal } from './components/ScorecardModal';
import { StageSelectModal } from './components/StageSelectModal';
import { PictureSelectModal } from './components/PictureSelectModal';
import { VictoryModal } from './components/VictoryModal';
import { AdModal } from './components/AdModal';
import { AdminPanel } from './components/AdminPanel';
import { BrainTrainingModal } from './components/BrainTrainingModal';

export default function App() {
  // Theme & Sound state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ae_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [colorMode, setColorMode] = useState<boolean>(true);

  // Admin Testing Account State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ae_admin_tester') === 'true';
    }
    return false;
  });
  const [unlimitedLives, setUnlimitedLives] = useState<boolean>(false);
  const [revealFreeArrows, setRevealFreeArrows] = useState<boolean>(false);

  // Game Mode State
  const [mode, setMode] = useState<GameMode>('stage');
  const [stageId, setStageId] = useState<number>(1);
  const [picIndex, setPicIndex] = useState<number>(0);
  const [freeDiffIndex, setFreeDiffIndex] = useState<number>(1); // 1 = Medium

  // Active Puzzle State
  const [gridW, setGridW] = useState<number>(22);
  const [gridH, setGridH] = useState<number>(24);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [activeArrowIds, setActiveArrowIds] = useState<Set<number>>(new Set());
  const [ownGrid, setOwnGrid] = useState<Int16Array>(new Int16Array(0));
  const [depthRounds, setDepthRounds] = useState<number>(1);

  // Gameplay Run State - Three-Life Standard System
  const [lives, setLives] = useState<number>(3);
  const [maxLives] = useState<number>(3); // Fixed 3-life standard
  const [hints, setHints] = useState<number>(3);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [cleanTaps, setCleanTaps] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [parTimeSec, setParTimeSec] = useState<number>(75);
  // Total calculated stage time (Arrows * 1.5s) & high-precision countdown
  const [totalStageTime, setTotalStageTime] = useState<number>(75);
  const [timeLeft, setTimeLeft] = useState<number>(75);
  const [stageName, setStageName] = useState<string>('Harmonic Currents');

  // Ref to carry forward remaining lives to next stage upon completion
  const pendingCarryLivesRef = useRef<number | null>(null);

  // Position Remembrance Snapshot for Continue after loss
  const [lastDefeatSnapshot, setLastDefeatSnapshot] = useState<GameSnapshot | null>(null);

  // Combo System
  const [combo, setCombo] = useState<number>(1);
  const [maxComboRun, setMaxComboRun] = useState<number>(1);
  const [comboTimeLeftPercent, setComboTimeLeftPercent] = useState<number>(0);
  const comboTimerRef = useRef<number | null>(null);
  const comboStartTimeRef = useRef<number>(0);
  const COMBO_WINDOW_MS = 3500;

  // Zoom & UI state
  const [zoomLevel, setZoomLevel] = useState<number>(22);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isNewHighRecord, setIsNewHighRecord] = useState<boolean>(false);
  const [continueRevivedNotice, setContinueRevivedNotice] = useState<boolean>(false);

  // Recoil & Hint Visual States
  const [hintArrowId, setHintArrowId] = useState<number | null>(null);
  const [recoilArrowId, setRecoilArrowId] = useState<number | null>(null);
  const [hitBlockerId, setHitBlockerId] = useState<number | null>(null);
  const [recoilDirection, setRecoilDirection] = useState<Direction | null>(null);

  // Career Scorecard Data & Modals
  const [scoreCard, setScoreCard] = useState<CareerScoreCard>(() => ScoreService.getScoreCard());
  const [isScorecardOpen, setIsScorecardOpen] = useState<boolean>(false);
  const [isStageSelectOpen, setIsStageSelectOpen] = useState<boolean>(false);
  const [isPicSelectOpen, setIsPicSelectOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isBrainTrainingOpen, setIsBrainTrainingOpen] = useState<boolean>(false);
  const [isAdOpen, setIsAdOpen] = useState<boolean>(false);

  // Precision game timer
  const gameTimerRef = useRef<number | null>(null);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('ae_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ae_theme', 'light');
    }
  }, [isDark]);

  // Persist admin toggle
  useEffect(() => {
    localStorage.setItem('ae_admin_tester', isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  // Generate seed for puzzle
  const getPuzzleSeed = useCallback(() => {
    if (mode === 'daily') {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return parseInt(today, 10) + 777;
    }
    if (mode === 'stage') {
      return stageId * 7919 + 104729;
    }
    if (mode === 'picture') {
      return (picIndex + 50) * 104729 + 999;
    }
    return (freeDiffIndex + 1) * 31337 + 12345;
  }, [mode, stageId, picIndex, freeDiffIndex]);

  // Start / Load Puzzle
  const loadPuzzle = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (comboTimerRef.current) clearInterval(comboTimerRef.current);

    setCombo(1);
    setMaxComboRun(1);
    setComboTimeLeftPercent(0);
    setElapsedSec(0);
    setMistakes(0);
    setHintsUsed(0);
    setCleanTaps(0);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsNewHighRecord(false);
    setIsPaused(false);
    setHintArrowId(null);
    setRecoilArrowId(null);
    setHitBlockerId(null);
    setLastDefeatSnapshot(null);
    setContinueRevivedNotice(false);

    // Three-life system: Carry remaining lives forward if advancing stage, otherwise start with 3 lives
    const carry = pendingCarryLivesRef.current;
    pendingCarryLivesRef.current = null;
    const initialLives = carry !== null ? Math.min(3, Math.max(1, carry)) : 3;
    setLives(initialLives);

    let w = 22;
    let h = 24;
    let minL = 3;
    let maxL = 7;
    let parTime = 90;
    let stageHints = 3;
    let name = "Harmonic Currents";
    let mask: Uint8Array | null = null;

    if (mode === 'stage') {
      const cfg = getStageConfig(stageId);
      w = cfg.w;
      h = cfg.h;
      minL = cfg.minLen;
      maxL = cfg.maxLen;
      stageHints = cfg.hints;
      name = `Stage ${cfg.id}: ${cfg.name}`;

      // Animal and object shapes in every even-numbered stage!
      const shape = getShapeForStage(stageId);
      if (shape) {
        mask = raster(shape);
        w = shape.w;
        h = shape.h;
        name = `Stage ${stageId}: ${shape.n} (Shape)`;
      } else if (stageId === 1) {
        name = "Stage 1: Harmonic Currents (Easy)";
      }
    } else if (mode === 'picture') {
      const pic = PICTURE_SHAPES[picIndex];
      w = pic.w;
      h = pic.h;
      minL = 4;
      maxL = 20;
      parTime = 120;
      stageHints = 4;
      name = `Silhouette: ${pic.n}`;
      mask = raster(pic);
    } else if (mode === 'daily') {
      w = 20;
      h = 28;
      minL = 5;
      maxL = 24;
      parTime = 120;
      stageHints = 3;
      name = `Daily Challenge (${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
    } else {
      // free mode
      const cfg = FREE_CONFIGS[freeDiffIndex];
      w = cfg.w;
      h = cfg.h;
      minL = cfg.a;
      maxL = cfg.b;
      parTime = Math.round((w * h) / 4);
      stageHints = 3;
      name = `Free Play: ${cfg.name} (${w}×${h})`;
    }

    setGridW(w);
    setGridH(h);
    setHints(stageHints);
    setStageName(name);

    // Compute optimal responsive zoom based on window width
    if (typeof window !== 'undefined') {
      const availWidth = Math.min(window.innerWidth - 32, 880);
      const idealZoom = Math.floor(availWidth / w);
      setZoomLevel(Math.max(14, Math.min(26, idealZoom)));
    }

    // Generate guaranteed solvable puzzle
    const seed = getPuzzleSeed();
    const puzzle = generateGuaranteedPuzzle(w, h, seed, minL, maxL, mask);
    setArrows(puzzle.arrows);
    setDepthRounds(puzzle.depth);

    // Formula: Total stage time = Number of arrows × 1.5 seconds
    const arrowCount = puzzle.arrows.length;
    const calculatedStageTime = Math.round(arrowCount * 1.5 * 10) / 10;
    setTotalStageTime(calculatedStageTime);
    setTimeLeft(calculatedStageTime);
    setParTimeSec(calculatedStageTime);

    // Populate active IDs and ownership grid
    const initialActive = new Set<number>();
    const own = new Int16Array(w * h).fill(-1);
    puzzle.arrows.forEach((a) => {
      initialActive.add(a.id);
      a.c.forEach((q) => {
        own[q[1] * w + q[0]] = a.id;
      });
    });

    setActiveArrowIds(initialActive);
    setOwnGrid(own);
  }, [mode, stageId, picIndex, freeDiffIndex, getPuzzleSeed]);

  // Load puzzle when mode or level selection changes
  useEffect(() => {
    loadPuzzle();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (comboTimerRef.current) clearInterval(comboTimerRef.current);
    };
  }, [loadPuzzle]);

  // Handle countdown timer expiration (Time = 0.0s)
  const handleTimeExpired = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (comboTimerRef.current) clearInterval(comboTimerRef.current);

    sound.playDefeat();

    // Out of time: Remember exact position & save snapshot for Continue
    const snapshot: GameSnapshot = {
      stageId,
      stageName,
      mode,
      activeArrowIds: Array.from(activeArrowIds),
      arrows,
      w: gridW,
      h: gridH,
      elapsedSec,
      totalStageTime,
      timeLeft: 0,
      score,
      mistakes: mistakes + 1,
      hints,
      combo: maxComboRun
    };
    setLastDefeatSnapshot(snapshot);

    // Deduct one life (or trigger game over if 0 lives remain)
    setLives((l) => {
      const nextLives = Math.max(0, l - 1);
      const recordResult = ScoreService.recordGameEnd({
        mode,
        stageId: mode === 'stage' ? stageId : undefined,
        stageName,
        won: false,
        score,
        stars: 0,
        timeSec: Math.round(elapsedSec),
        mistakes: mistakes + 1,
        arrowsCleared: arrows.length - activeArrowIds.size,
        totalArrows: arrows.length,
        maxCombo: maxComboRun
      });

      setScoreCard(recordResult.card);
      setIsGameOver(true);
      return nextLives;
    });
  }, [
    stageId,
    stageName,
    mode,
    activeArrowIds,
    arrows,
    gridW,
    gridH,
    elapsedSec,
    totalStageTime,
    score,
    mistakes,
    hints,
    maxComboRun
  ]);

  // High-precision Countdown Timer: updates every 100ms with decimal seconds
  useEffect(() => {
    const isPausedOrModal = isPaused || isGameOver || isVictory || isAdOpen || isHelpOpen || isScorecardOpen || isBrainTrainingOpen || isStageSelectOpen || isPicSelectOpen;
    if (isPausedOrModal) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
        if (next <= 0) {
          handleTimeExpired();
        } else if (next <= 5.0 && Math.abs(next - Math.round(next)) < 0.05) {
          // Warning blip during final 5 seconds
          sound.playImpact();
        }
        return next;
      });
      setElapsedSec((prev) => prev + 0.1);
    }, 100);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [
    isPaused,
    isGameOver,
    isVictory,
    isAdOpen,
    isHelpOpen,
    isScorecardOpen,
    isBrainTrainingOpen,
    isStageSelectOpen,
    isPicSelectOpen,
    handleTimeExpired
  ]);

  // Reset or step down combo timer
  const triggerComboSuccess = useCallback(() => {
    setCombo((c) => {
      const next = Math.min(10, c + 1);
      setMaxComboRun((m) => Math.max(m, next));
      if (next >= 3) {
        sound.playComboStreak(next);
      }
      return next;
    });

    comboStartTimeRef.current = performance.now();
    setComboTimeLeftPercent(100);

    if (comboTimerRef.current) clearInterval(comboTimerRef.current);
    comboTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - comboStartTimeRef.current;
      const leftRatio = Math.max(0, 1 - elapsed / COMBO_WINDOW_MS);
      setComboTimeLeftPercent(leftRatio * 100);

      if (leftRatio <= 0) {
        if (comboTimerRef.current) clearInterval(comboTimerRef.current);
        setCombo(1);
      }
    }, 50);
  }, []);

  // Handle clicking an arrow
  const handleArrowClick = useCallback(
    (arrowId: number) => {
      if (isPaused || isGameOver || isVictory || isAdOpen) return;

      const arrow = arrows.find((a) => a.id === arrowId);
      if (!arrow || !activeArrowIds.has(arrowId)) return;

      // Raycast test: check if path to board boundary is blocked
      const blockerId = rayHit(ownGrid, gridW, gridH, arrow);

      if (blockerId < 0) {
        // === SUCCESS: PATH IS UNBLOCKED ===
        sound.playLaunch(combo);
        sound.playEscape(combo);

        const points = 100 * combo;
        setScore((s) => s + points);
        setCleanTaps((c) => c + 1);

        // Remove arrow cells immediately from grid ownership so other arrows can pass
        arrow.c.forEach((q) => {
          ownGrid[q[1] * gridW + q[0]] = -1;
        });

        // Trigger slide animation by removing from activeArrowIds
        const nextActive = new Set(activeArrowIds);
        nextActive.delete(arrowId);
        setActiveArrowIds(nextActive);

        // Progress combo streak
        triggerComboSuccess();

        if (hintArrowId === arrowId) {
          setHintArrowId(null);
        }

        // Check Victory
        if (nextActive.size === 0) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          if (comboTimerRef.current) clearInterval(comboTimerRef.current);

          sound.playVictory();

          const timeTaken = Math.max(0.1, Math.round((totalStageTime - timeLeft) * 10) / 10);
          const speedBonus = Math.max(0, Math.floor(timeLeft * 20));
          const comboBonus = maxComboRun > 1 ? maxComboRun * 100 : 0;
          const flawlessBonus = mistakes === 0 ? 500 : 0;
          const finalTotalScore = score + points + speedBonus + comboBonus + flawlessBonus;

          const penalty = mistakes + hintsUsed;
          let stars = 1;
          if (penalty === 0 && timeLeft >= totalStageTime * 0.3) {
            stars = 3;
          } else if (penalty <= 2 && timeLeft > 0) {
            stars = 2;
          }

          const recordResult = ScoreService.recordGameEnd({
            mode,
            stageId: mode === 'stage' ? stageId : undefined,
            stageName,
            won: true,
            score: finalTotalScore,
            stars,
            timeSec: timeTaken,
            mistakes,
            arrowsCleared: arrows.length,
            totalArrows: arrows.length,
            maxCombo: maxComboRun
          });

          setScore(finalTotalScore);
          setScoreCard(recordResult.card);
          setIsNewHighRecord(recordResult.isNewHighRecord);
          setIsVictory(true);
        }
      } else {
        // === BLOCKED: ELASTIC COLLISION IMPACT ===
        sound.playImpact();
        setMistakes((m) => m + 1);

        // If unlimited lives is enabled (admin test), don't decrement
        if (!unlimitedLives) {
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              // Out of lives: Remember exact position & save snapshot for Continue
              const snapshot: GameSnapshot = {
                stageId,
                stageName,
                mode,
                activeArrowIds: Array.from(activeArrowIds),
                arrows,
                w: gridW,
                h: gridH,
                elapsedSec,
                totalStageTime,
                timeLeft,
                score,
                mistakes: mistakes + 1,
                hints,
                combo: maxComboRun
              };
              setLastDefeatSnapshot(snapshot);

              if (gameTimerRef.current) clearInterval(gameTimerRef.current);
              if (comboTimerRef.current) clearInterval(comboTimerRef.current);
              sound.playDefeat();

              const recordResult = ScoreService.recordGameEnd({
                mode,
                stageId: mode === 'stage' ? stageId : undefined,
                stageName,
                won: false,
                score,
                stars: 0,
                timeSec: Math.round(elapsedSec),
                mistakes: mistakes + 1,
                arrowsCleared: arrows.length - activeArrowIds.size,
                totalArrows: arrows.length,
                maxCombo: maxComboRun
              });

              setScoreCard(recordResult.card);
              setIsGameOver(true);
            }
            return Math.max(0, nextLives);
          });
        }

        // Reset combo on collision
        setCombo(1);
        setComboTimeLeftPercent(0);
        if (comboTimerRef.current) clearInterval(comboTimerRef.current);

        // Trigger elastic recoil & blocker shockwave
        setRecoilArrowId(arrowId);
        setHitBlockerId(blockerId);
        setRecoilDirection(arrow.d);

        setTimeout(() => {
          setRecoilArrowId(null);
          setHitBlockerId(null);
          setRecoilDirection(null);
        }, 550);
      }
    },
    [
      isPaused,
      isGameOver,
      isVictory,
      isAdOpen,
      arrows,
      activeArrowIds,
      ownGrid,
      gridW,
      gridH,
      combo,
      score,
      mistakes,
      hints,
      hintsUsed,
      elapsedSec,
      parTimeSec,
      maxComboRun,
      mode,
      stageId,
      stageName,
      unlimitedLives,
      triggerComboSuccess,
      hintArrowId
    ]
  );

  // Continue After Loss via Watching Ad
  const handleContinueWithAd = () => {
    setIsAdOpen(true);
  };

  // Called when ad completes / reward granted
  const handleAdCompleted = () => {
    setIsAdOpen(false);
    setIsGameOver(false);

    // Restore exact position and board state
    if (lastDefeatSnapshot) {
      const remainingSet = new Set(lastDefeatSnapshot.activeArrowIds);
      setActiveArrowIds(remainingSet);

      const own = new Int16Array(gridW * gridH).fill(-1);
      arrows.forEach((a) => {
        if (remainingSet.has(a.id)) {
          a.c.forEach((q) => {
            own[q[1] * gridW + q[0]] = a.id;
          });
        }
      });
      setOwnGrid(own);
      setElapsedSec(lastDefeatSnapshot.elapsedSec);
      setScore(lastDefeatSnapshot.score);
    }

    // Restore full 3 lives without life deduction penalty
    setLives(3);
    setContinueRevivedNotice(true);
    sound.playVictory();

    setTimeout(() => {
      setContinueRevivedNotice(false);
    }, 4000);
  };

  // Restart current stage completely from the beginning (fresh 3 lives)
  const handleRestartStage = () => {
    setIsGameOver(false);
    setLastDefeatSnapshot(null);
    pendingCarryLivesRef.current = null; // Fresh 3 lives
    loadPuzzle();
  };

  // Hint activation
  const handleUseHint = useCallback(() => {
    if (hints <= 0 || isPaused || isGameOver || isVictory || isAdOpen) return;

    const freeArrows = arrows
      .filter((a) => activeArrowIds.has(a.id))
      .filter((a) => rayHit(ownGrid, gridW, gridH, a) < 0);

    if (freeArrows.length === 0) return;

    sound.playHint();
    const chosen = freeArrows[Math.floor(Math.random() * freeArrows.length)];
    setHintArrowId(chosen.id);
    setHints((h) => h - 1);
    setHintsUsed((u) => u + 1);

    setTimeout(() => {
      setHintArrowId(null);
    }, 2800);
  }, [hints, isPaused, isGameOver, isVictory, isAdOpen, arrows, activeArrowIds, ownGrid, gridW, gridH]);

  // Advance to next progressive stage: Carry remaining lives forward!
  const handleNextStage = () => {
    const carriedLives = Math.max(1, lives);
    pendingCarryLivesRef.current = carriedLives;
    if (mode === 'stage') {
      setStageId((prev) => Math.min(50, prev + 1));
    } else {
      loadPuzzle();
    }
  };

  // Admin Testing Simulator Actions
  const handleAdminSimulateDefeat = () => {
    const snapshot: GameSnapshot = {
      stageId,
      stageName,
      mode,
      activeArrowIds: Array.from(activeArrowIds),
      arrows,
      w: gridW,
      h: gridH,
      elapsedSec,
      score,
      mistakes: mistakes + 1,
      hints,
      combo: maxComboRun
    };
    setLastDefeatSnapshot(snapshot);
    setLives(0);
    setIsGameOver(true);
    sound.playDefeat();
  };

  const handleAdminSimulateAdContinue = () => {
    if (!lastDefeatSnapshot) {
      const snapshot: GameSnapshot = {
        stageId,
        stageName,
        mode,
        activeArrowIds: Array.from(activeArrowIds),
        arrows,
        w: gridW,
        h: gridH,
        elapsedSec,
        score,
        mistakes,
        hints,
        combo: maxComboRun
      };
      setLastDefeatSnapshot(snapshot);
    }
    setIsAdOpen(true);
  };

  const handleAdminSimulateVictory = () => {
    sound.playVictory();
    setIsVictory(true);
  };

  // God Mode: set of currently unblocked arrows
  const freeArrowIds = useMemo(() => {
    if (!revealFreeArrows) return new Set<number>();
    const free = new Set<number>();
    arrows.forEach((a) => {
      if (activeArrowIds.has(a.id) && rayHit(ownGrid, gridW, gridH, a) < 0) {
        free.add(a.id);
      }
    });
    return free;
  }, [revealFreeArrows, arrows, activeArrowIds, ownGrid, gridW, gridH]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isGameOver && !isVictory && !isAdOpen) {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        if (!isScorecardOpen && !isStageSelectOpen && !isPicSelectOpen && !isBrainTrainingOpen && !isAdOpen) {
          handleRestartStage();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        handleUseHint();
      } else if (e.key === 'Escape') {
        if (isScorecardOpen) setIsScorecardOpen(false);
        else if (isStageSelectOpen) setIsStageSelectOpen(false);
        else if (isPicSelectOpen) setIsPicSelectOpen(false);
        else if (isBrainTrainingOpen) setIsBrainTrainingOpen(false);
        else if (isHelpOpen) setIsHelpOpen(false);
        else if (isAdOpen) setIsAdOpen(false);
        else if (!isGameOver && !isVictory) setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGameOver,
    isVictory,
    isAdOpen,
    isScorecardOpen,
    isStageSelectOpen,
    isPicSelectOpen,
    isBrainTrainingOpen,
    isHelpOpen,
    handleRestartStage,
    handleUseHint
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Bar following §2 Top Bar Contract (Wordmark - 4 Nav Links - Primary Action) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setMode('stage');
              setStageId(1);
            }}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <Zap size={18} className="fill-white" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Arrow Escape
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links / Game Modes */}
        <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              setMode('stage');
              setStageId(1);
            }}
            className={`whitespace-nowrap transition-colors cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 ${
              mode === 'stage' && stageId === 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
            }`}
          >
            Stage 1 (Easy)
          </button>

          <button
            onClick={() => {
              setMode('stage');
              setStageId(2);
            }}
            className={`whitespace-nowrap transition-colors cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 ${
              mode === 'stage' && stageId === 2 ? 'text-purple-600 dark:text-purple-400 font-bold' : ''
            }`}
          >
            Stage 2 (Difficult)
          </button>

          <button
            onClick={() => {
              setMode('stage');
              setIsStageSelectOpen(true);
            }}
            className="flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Layers size={13} />
            <span>All 50 Stages</span>
          </button>

          <button
            onClick={() => setIsBrainTrainingOpen(true)}
            className="flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Brain size={13} />
            <span>Brain Training</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Admin Tester Mode Toggle */}
          <button
            onClick={() => setIsAdmin((a) => !a)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isAdmin
                ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono shadow-sm'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Toggle Admin Testing Mode"
          >
            <ShieldCheck size={14} className={isAdmin ? 'text-amber-500' : ''} />
            <span className="hidden sm:inline">{isAdmin ? 'Admin Tester: ON' : 'Admin'}</span>
          </button>

          {/* Lifetime Scorecard CTA Button */}
          <button
            onClick={() => setIsScorecardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Trophy size={13} />
            <span className="hidden sm:inline">Scorecard</span>
            <span className="font-mono tabular-nums text-xs font-normal opacity-90">
              {scoreCard.lifetimeScore.toLocaleString()}
            </span>
          </button>

          {/* Color Mode Toggle */}
          <button
            onClick={() => setColorMode((c) => !c)}
            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              colorMode ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Toggle arrow colors"
          >
            <Palette size={15} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark((d) => !d)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Game Shell */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 flex flex-col justify-start">
        
        {/* Prominent Two-Stage Switcher (Requirement 2 & 3) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40">
            {/* Stage 1 - Easy Button */}
            <button
              onClick={() => {
                setMode('stage');
                setStageId(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'stage' && stageId === 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap size={14} className={mode === 'stage' && stageId === 1 ? 'fill-white' : 'text-blue-500'} />
              <span>Stage 1 · Easy (Rhythmic Flow)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 text-current font-mono">
                {stageId === 1 ? arrows.length : '60+'}
              </span>
            </button>

            {/* Stage 2 - Difficult Button */}
            <button
              onClick={() => {
                setMode('stage');
                setStageId(2);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'stage' && stageId === 2
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} className={mode === 'stage' && stageId === 2 ? 'fill-white' : 'text-purple-500'} />
              <span>Stage 2 · Difficult (Cat Silhouette)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 text-current font-mono">
                {stageId === 2 ? arrows.length : '60+'}
              </span>
            </button>
          </div>

          {/* Quick Stage 1-50 Navigator and Brain Training Tag */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStageSelectOpen(true)}
              className="text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md bg-white dark:bg-slate-900 cursor-pointer"
            >
              <Layers size={13} />
              <span>Stage {stageId}/50</span>
            </button>

            <button
              onClick={() => setIsBrainTrainingOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 cursor-pointer"
            >
              <Brain size={13} />
              <span className="hidden sm:inline">Mental Skills</span>
            </button>
          </div>
        </div>

        {/* Continue Revived Notice */}
        {continueRevivedNotice && (
          <div className="mb-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Continued from exact board position! 3 Lives restored and timer replenished.</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              STATE RESTORED
            </span>
          </div>
        )}

        {/* HUD Cluster with 3-Life Standard & Emergency Warning */}
        <HUD
          lives={lives}
          maxLives={maxLives}
          arrowsRemaining={activeArrowIds.size}
          totalArrows={arrows.length}
          elapsedSec={elapsedSec}
          timeLeft={timeLeft}
          totalStageTime={totalStageTime}
          parTimeSec={parTimeSec}
          score={score}
          combo={combo}
          comboTimeLeftPercent={comboTimeLeftPercent}
          hintsRemaining={hints}
          onUseHint={handleUseHint}
          onRestart={handleRestartStage}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onOpenScorecard={() => setIsScorecardOpen(true)}
          onOpenBrainTraining={() => setIsBrainTrainingOpen(true)}
        />

        {/* Interactive Physics Board with Unobtrusive Emergency Warning Glow */}
        <div className={`relative transition-all duration-300 rounded-2xl ${
          (timeLeft <= totalStageTime * 0.1 || timeLeft <= 10) && timeLeft > 0
            ? 'ring-4 ring-rose-500/50 shadow-2xl shadow-rose-500/30'
            : ''
        }`}>
          <GameBoard
            w={gridW}
            h={gridH}
            arrows={arrows}
            activeArrowIds={activeArrowIds}
            hintArrowId={hintArrowId}
            recoilArrowId={recoilArrowId}
            hitBlockerId={hitBlockerId}
            recoilDirection={recoilDirection}
            recoilDistance={16}
            onArrowClick={handleArrowClick}
            colorMode={colorMode}
            zoomLevel={zoomLevel}
            isPaused={isPaused}
            revealFreeArrows={revealFreeArrows}
            freeArrowIds={freeArrowIds}
          />

          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 z-20">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center max-w-xs w-full shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Simulation Paused
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Timer stopped. Spacebar or Resume to continue.
                </p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play size={14} className="fill-white" />
                  <span>Resume Game</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Educational Brain Training Theme Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <span>Train your brain to keep looking for possibilities, even when the obvious path is blocked.</span>
          <span>Space: Pause · H: Hint · R: Restart</span>
        </div>

      </main>

      {/* Admin Testing Dock */}
      <AdminPanel
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(false)}
        currentStageId={stageId}
        onSelectStage={(id) => {
          setMode('stage');
          setStageId(id);
        }}
        onSimulateDefeat={handleAdminSimulateDefeat}
        onSimulateAdContinue={handleAdminSimulateAdContinue}
        onSimulateVictory={handleAdminSimulateVictory}
        unlimitedLives={unlimitedLives}
        onToggleUnlimitedLives={() => setUnlimitedLives((u) => !u)}
        revealFreeArrows={revealFreeArrows}
        onToggleRevealFreeArrows={() => setRevealFreeArrows((r) => !r)}
      />

      {/* Career Scorecard Modal */}
      <ScorecardModal
        scoreCard={scoreCard}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        onReset={() => {
          const fresh = ScoreService.resetScoreCard();
          setScoreCard(fresh);
        }}
      />

      {/* 50 Stages Selector Modal */}
      <StageSelectModal
        isOpen={isStageSelectOpen}
        onClose={() => setIsStageSelectOpen(false)}
        onSelectStage={(id) => {
          setMode('stage');
          setStageId(id);
        }}
        currentStageId={stageId}
        stageProgress={scoreCard.stageProgress || {}}
        isAdmin={isAdmin}
      />

      {/* Picture Silhouettes Modal */}
      <PictureSelectModal
        isOpen={isPicSelectOpen}
        onClose={() => setIsPicSelectOpen(false)}
        onSelectPicture={(idx) => {
          setMode('picture');
          setPicIndex(idx);
        }}
        currentPicIndex={picIndex}
      />

      {/* Brain Training & Mental Skills Explanation Modal */}
      <BrainTrainingModal
        isOpen={isBrainTrainingOpen}
        onClose={() => setIsBrainTrainingOpen(false)}
      />

      {/* Victory / Defeat Modal with Dynamic Performance Feedback & 30 Motivational Quotes */}
      <VictoryModal
        isOpen={isVictory || isGameOver}
        won={isVictory}
        stageId={stageId}
        stageName={stageName}
        score={score}
        stars={isVictory ? (mistakes === 0 && timeLeft >= totalStageTime * 0.3 ? 3 : mistakes <= 2 ? 2 : 1) : 0}
        timeSec={Math.max(0.1, Math.round((totalStageTime - timeLeft) * 10) / 10)}
        parTimeSec={totalStageTime}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        arrowsRemaining={activeArrowIds.size}
        totalArrows={arrows.length}
        livesRemaining={lives}
        maxCombo={maxComboRun}
        isNewHighRecord={isNewHighRecord}
        hasNextStage={mode === 'stage' && stageId < 50}
        onNextStage={handleNextStage}
        onRestart={handleRestartStage}
        onContinueWithAd={handleContinueWithAd}
        onOpenScorecard={() => {
          setIsVictory(false);
          setIsGameOver(false);
          setIsScorecardOpen(true);
        }}
      />

      {/* Simulated Rewarded Ad Modal for Continue */}
      <AdModal
        isOpen={isAdOpen}
        isAdmin={isAdmin}
        onAdCompleted={handleAdCompleted}
        onCancel={() => setIsAdOpen(false)}
      />

    </div>
  );
}
