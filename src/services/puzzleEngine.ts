import { Arrow, Direction, FreeConfig, PictureShape, StageConfig } from '../types/game';

export const D: [number, number][] = [
  [0, -1], // 0: Up
  [1, 0],  // 1: Right
  [0, 1],  // 2: Down
  [-1, 0]  // 3: Left
];

export const PALETTE = [
  "#2563eb", // blue-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#e11d48", // rose-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#c026d3", // fuchsia-600
  "#ea580c"  // orange-600
];

export function rng(s: number) {
  return function () {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rayHit(own: Int16Array, w: number, h: number, a: Arrow): number {
  const e = a.c[a.c.length - 1];
  let x = e[0] + D[a.d][0];
  let y = e[1] + D[a.d][1];
  while (x >= 0 && y >= 0 && x < w && y < h) {
    const o = own[y * w + x];
    if (o >= 0) return o;
    x += D[a.d][0];
    y += D[a.d][1];
  }
  return -1;
}

export function solve(A: Arrow[], w: number, h: number, R?: () => number): { ok: boolean; rounds: number; left?: number } {
  const own = new Int16Array(w * h).fill(-1);
  A.forEach((a, i) => a.c.forEach(q => (own[q[1] * w + q[0]] = i)));
  let alive = A.map((_, i) => i);
  let rounds = 0;

  while (alive.length) {
    let fr = alive.filter(i => rayHit(own, w, h, A[i]) < 0);
    if (!fr.length) return { ok: false, rounds, left: alive.length };
    if (R) fr = [fr[Math.floor(R() * fr.length)]];
    const f = new Set(fr);
    fr.forEach(i => A[i].c.forEach(q => (own[q[1] * w + q[0]] = -1)));
    alive = alive.filter(i => !f.has(i));
    rounds++;
  }
  return { ok: true, rounds };
}

export function gen(w: number, h: number, seed: number, mn: number, mx: number, mask?: Uint8Array | null): Arrow[] {
  const R = rng(seed);
  const N = w * h;
  const own = new Int16Array(N).fill(-1);
  const A: Arrow[] = [];
  const validMask = mask || new Uint8Array(N).fill(1);

  let mx0 = 0, my0 = 0, mc = 0;
  for (let k = 0; k < N; k++) {
    if (validMask[k]) {
      mx0 += k % w;
      my0 += (k / w) | 0;
      mc++;
    }
  }

  const cx = mx0 / (mc || 1) + (R() - 0.5) * w * 0.12;
  const cy = my0 / (mc || 1) + (R() - 0.5) * h * 0.12;
  const ord = Array.from({ length: N }, (_, k) => k)
    .filter(k => validMask[k])
    .map(k => [k, Math.hypot((k % w - cx) / w, (((k / w) | 0) - cy) / h) + R() * 0.015] as [number, number])
    .sort((a, b) => a[1] - b[1])
    .map(a => a[0]);

  const rank = new Int32Array(N);
  ord.forEach((k, i) => (rank[k] = i));

  const nb = (k: number, d: number) => {
    const x = (k % w) + D[d][0];
    const y = ((k / w) | 0) + D[d][1];
    return x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x;
  };

  const dirOf = (a: number, b: number) => {
    for (let d = 0; d < 4; d++) if (nb(a, d) === b) return d;
    return -1;
  };

  const rayOK = (k: number, d: number, S: Set<number>) => {
    for (let c = nb(k, d); c >= 0; c = nb(c, d)) {
      if (own[c] >= 0 || S.has(c)) return false;
    }
    return true;
  };

  const orient = (p: number[], S: Set<number>): [number, Direction] | null => {
    const m = p.length;
    const o: [number, Direction][] = [];
    const dA = dirOf(p[m - 2], p[m - 1]);
    const dB = dirOf(p[1], p[0]);
    if (dA >= 0 && rayOK(p[m - 1], dA, S)) o.push([0, dA as Direction]);
    if (dB >= 0 && rayOK(p[0], dB, S)) o.push([1, dB as Direction]);
    return o.length ? o[(R() * o.length) | 0] : null;
  };

  const put = (p: number[], rev: boolean | number, d: Direction) => {
    const id = A.length;
    const path = rev ? [...p].reverse() : p;
    path.forEach(k => (own[k] = id));
    A.push({
      id,
      c: path.map(k => [(k % w), (k / w) | 0]),
      d,
      color: PALETTE[id % PALETTE.length]
    });
  };

  const bw = (w + h) * 0.25;

  const walk = (s: number) => {
    const L = mn + ((R() * (mx - mn + 1)) | 0);
    const p = [s];
    const S = new Set(p);
    let best: { p: number[]; o: [number, Direction]; sc?: number } | null = null;
    let last = -1;

    for (;;) {
      const m = p.length;
      if (m >= 2) {
        const o = orient(p, S);
        if (o) {
          best = { p: [...p], o };
          if (m >= mn && R() < 0.03) break;
        }
      }
      if (m >= L) break;

      const e = p[m - 1];
      const cs: [number, number, number][] = [];
      let tw = 0;

      for (let d = 0; d < 4; d++) {
        const c = nb(e, d);
        if (c < 0 || !validMask[c] || own[c] >= 0 || S.has(c)) continue;
        let wt = (d === last ? 2.5 : 1) * Math.exp(-Math.max(0, rank[c] - rank[s]) / bw);
        if (m >= mn && rayOK(c, d, S)) wt *= 6;
        cs.push([d, c, wt]);
        tw += wt;
      }

      if (!cs.length) break;
      let r = R() * tw;
      let q = cs[0];
      for (const x of cs) {
        r -= x[2];
        if (r <= 0) {
          q = x;
          break;
        }
      }
      p.push(q[1]);
      S.add(q[1]);
      last = q[0];
    }

    if (!best) return null;
    const S2 = new Set(best.p);
    let dang = 0;
    for (const k of best.p) {
      for (let d = 0; d < 4; d++) {
        const c = nb(k, d);
        if (c < 0 || !validMask[c] || own[c] >= 0 || S2.has(c)) continue;
        let f = 0;
        for (let e = 0; e < 4; e++) {
          const z = nb(c, e);
          if (z >= 0 && validMask[z] && own[z] < 0 && !S2.has(z)) f++;
        }
        if (f < 2) dang++;
      }
    }
    best.sc = best.p.length - 40 * dang;
    return best;
  };

  for (const s of ord) {
    if (own[s] >= 0) continue;
    let best: { p: number[]; o: [number, Direction]; sc?: number } | null = null;
    for (let t = 0; t < 20; t++) {
      const b = walk(s);
      if (b && (!best || (b.sc ?? 0) > (best.sc ?? 0))) best = b;
    }
    if (best && best.p.length >= 2) {
      put(best.p, best.o[0], best.o[1]);
    } else {
      // Try to find an adjacent available cell to form at least a 2-cell arrow with a visible tail
      let placed = false;
      for (let d = 0; d < 4; d++) {
        const next = nb(s, d);
        if (next >= 0 && validMask[next] && own[next] < 0) {
          for (let exitD = 0; exitD < 4; exitD++) {
            if (rayOK(next, exitD, new Set([s, next]))) {
              put([s, next], 0, exitD as Direction);
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
      }
      if (!placed) {
        for (let d = 0; d < 4; d++) {
          if (rayOK(s, d, new Set([s]))) {
            const backD = (d + 2) % 4;
            const back = nb(s, backD);
            if (back >= 0 && validMask[back] && own[back] < 0) {
              put([back, s], 0, d as Direction);
              placed = true;
              break;
            }
          }
        }
      }
      if (!placed) {
        // Fallback with exit ray
        for (let d = 0; d < 4; d++) {
          if (rayOK(s, d, new Set([s]))) {
            put([s], 0, d as Direction);
            break;
          }
        }
      }
    }
  }

  // Post-processing: Extend any isolated arrows to ensure visible tails
  for (let ch = 1, g = 0; ch && g < 8; g++) {
    ch = 0;
    for (let k = 0; k < N; k++) {
      if (own[k] >= 0 || !validMask[k]) continue;
      for (let d = 0; d < 4; d++) {
        const n = nb(k, d);
        if (n < 0 || own[n] < 0) continue;
        const i = own[n];
        const a = A[i];
        const t = a.c[0];
        if (t[1] * w + t[0] !== n || (a.c.length === 1 && dirOf(k, n) !== a.d)) continue;
        a.c.unshift([k % w, (k / w) | 0]);
        own[k] = i;
        if (solve(A, w, h).ok) {
          ch = 1;
          break;
        }
        a.c.shift();
        own[k] = -1;
      }
    }
  }

  // Ensure every single arrow has at least 2 coordinate points so all have clear tails
  for (let i = 0; i < A.length; i++) {
    const a = A[i];
    if (a.c.length === 1) {
      const hd = a.c[0];
      const backD = (a.d + 2) % 4;
      const bx = hd[0] + D[backD][0];
      const by = hd[1] + D[backD][1];
      if (bx >= 0 && by >= 0 && bx < w && by < h && validMask[by * w + bx] && own[by * w + bx] < 0) {
        a.c.unshift([bx, by]);
        own[by * w + bx] = a.id;
      }
    }
  }

  return A;
}

export function generateGuaranteedPuzzle(
  w: number,
  h: number,
  seed: number,
  minLen: number,
  maxLen: number,
  mask?: Uint8Array | null
): { arrows: Arrow[]; depth: number } {
  let curSeed = seed;
  let attempts = 0;
  while (attempts < 50) {
    const arrows = gen(w, h, curSeed, minLen, maxLen, mask);
    const result = solve(arrows, w, h);
    if (result.ok) {
      return { arrows, depth: result.rounds };
    }
    curSeed = (curSeed + 37) | 0;
    attempts++;
  }
  // Fallback to simple parameters if ultra-tight
  const fallback = gen(w, h, curSeed + 999, Math.max(2, minLen - 1), Math.max(3, maxLen - 2), mask);
  const fallbackResult = solve(fallback, w, h);
  return { arrows: fallback, depth: fallbackResult.rounds || 5 };
}

import {
  EVEN_STAGE_SHAPES,
  getShapeForStage,
  CAT_SHAPE,
  DOG_SHAPE,
  OFFICE_CHAIR_SHAPE,
  BRAIN_SHAPE,
  BUTTERFLY_SHAPE,
  COFFEE_MUG_SHAPE,
  ANCHOR_SHAPE,
  HEART_SHAPE,
  GUITAR_SHAPE,
  CROWN_SHAPE,
  ROCKET_SHAPE,
  OWL_SHAPE,
  PINE_TREE_SHAPE,
  CAR_SHAPE,
  SHARK_SHAPE,
  LIGHTBULB_SHAPE,
  ELEPHANT_SHAPE,
  HOURGLASS_SHAPE,
  SHIELD_SWORD_SHAPE,
  OCTOPUS_SHAPE,
  AIRPLANE_SHAPE,
  CASTLE_SHAPE,
  WOLF_SHAPE,
  MICROSCOPE_SHAPE,
  MYTHIC_DRAGON_SHAPE
} from './shapeDefinitions';

export {
  EVEN_STAGE_SHAPES,
  getShapeForStage,
  CAT_SHAPE,
  DOG_SHAPE,
  OFFICE_CHAIR_SHAPE,
  BRAIN_SHAPE,
  BUTTERFLY_SHAPE,
  COFFEE_MUG_SHAPE,
  ANCHOR_SHAPE,
  HEART_SHAPE,
  GUITAR_SHAPE,
  CROWN_SHAPE,
  ROCKET_SHAPE,
  OWL_SHAPE,
  PINE_TREE_SHAPE,
  CAR_SHAPE,
  SHARK_SHAPE,
  LIGHTBULB_SHAPE,
  ELEPHANT_SHAPE,
  HOURGLASS_SHAPE,
  SHIELD_SWORD_SHAPE,
  OCTOPUS_SHAPE,
  AIRPLANE_SHAPE,
  CASTLE_SHAPE,
  WOLF_SHAPE,
  MICROSCOPE_SHAPE,
  MYTHIC_DRAGON_SHAPE
};

export const MYTHIC_DRAGON = MYTHIC_DRAGON_SHAPE;

export const PICTURE_SHAPES: PictureShape[] = Object.values(EVEN_STAGE_SHAPES);

export function raster(sh: PictureShape): Uint8Array {
  const m = new Uint8Array(sh.w * sh.h);
  const ins = (o: (string | number)[], x: number, y: number) => {
    const t = String(o[0]).replace("-", "");
    if (t === "e") return (((x - (o[1] as number)) / (o[3] as number)) ** 2 + ((y - (o[2] as number)) / (o[4] as number)) ** 2) <= 1;
    if (t === "r") return x >= (o[1] as number) && x <= (o[3] as number) && y >= (o[2] as number) && y <= (o[4] as number);
    let c = false;
    const p = o.slice(1) as number[];
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      if ((p[i + 1] > y) !== (p[j + 1] > y) && x < ((p[j] - p[i]) * (y - p[i + 1])) / (p[j + 1] - p[i + 1]) + p[i]) {
        c = !c;
      }
    }
    return c;
  };

  for (let y = 0; y < sh.h; y++) {
    for (let x = 0; x < sh.w; x++) {
      let v = 0;
      for (const o of sh.o) {
        if (ins(o, x + 0.5, y + 0.5)) {
          v = String(o[0])[0] === "-" ? 0 : 1;
        }
      }
      m[y * sh.w + x] = v;
    }
  }
  return m;
}

export const FREE_CONFIGS: FreeConfig[] = [
  { id: 'easy', name: 'Easy', w: 12, h: 18, a: 6, b: 16 },
  { id: 'medium', name: 'Medium', w: 18, h: 26, a: 8, b: 24 },
  { id: 'hard', name: 'Hard', w: 24, h: 36, a: 10, b: 32 },
  { id: 'expert', name: 'Expert', w: 30, h: 44, a: 12, b: 40 },
  { id: 'master', name: 'Master', w: 34, h: 48, a: 14, b: 48 },
];

/**
 * 50 Progressive Escalating Stages:
 * - Every even-numbered stage features a recognizable animal, object, or creature shape
 *   constructed 100% out of gameplay arrows!
 * - Odd-numbered stages feature large, intricate, progressive geometric labyrinths.
 * - Stage timer is calculated automatically: Total stage time = Number of arrows × 1.5 seconds.
 */
export const STAGE_CONFIGS: StageConfig[] = [
  // --- Tier 1: Novice Flow (Stages 1-10) ---
  {
    id: 1,
    name: "Harmonic Currents",
    tier: 1,
    tierName: "Novice",
    w: 22,
    h: 24,
    minLen: 3,
    maxLen: 7,
    parTime: 90,
    lives: 3,
    hints: 3,
    description: "Stage 1 (Easy): Over 60 slim arrows in a rhythmic, readable outward flow pattern.",
    isSpecialStage: 'easy'
  },
  {
    id: 2,
    name: "The Cat",
    tier: 1,
    tierName: "Novice",
    w: CAT_SHAPE.w,
    h: CAT_SHAPE.h,
    minLen: 3,
    maxLen: 9,
    parTime: 105,
    lives: 3,
    hints: 3,
    description: "Stage 2: Recognizable Cat silhouette created entirely from slim arrows.",
    shapeMask: "cat"
  },
  { id: 3, name: "Gentle Convergence", tier: 1, tierName: "Novice", w: 16, h: 20, minLen: 3, maxLen: 7, parTime: 75, lives: 3, hints: 3, description: "Parallel outer tracks with simple interior crossings." },
  {
    id: 4,
    name: "Playful Dog",
    tier: 1,
    tierName: "Novice",
    w: DOG_SHAPE.w,
    h: DOG_SHAPE.h,
    minLen: 3,
    maxLen: 9,
    parTime: 105,
    lives: 3,
    hints: 3,
    description: "Stage 4: Playful Dog silhouette created entirely from slim arrows.",
    shapeMask: "dog"
  },
  { id: 5, name: "The Quiet River", tier: 1, tierName: "Novice", w: 18, h: 22, minLen: 4, maxLen: 8, parTime: 90, lives: 3, hints: 3, description: "Smooth winding currents with intuitive unblocked candidates." },
  {
    id: 6,
    name: "Office Chair",
    tier: 1,
    tierName: "Novice",
    w: OFFICE_CHAIR_SHAPE.w,
    h: OFFICE_CHAIR_SHAPE.h,
    minLen: 3,
    maxLen: 9,
    parTime: 105,
    lives: 3,
    hints: 3,
    description: "Stage 6: Ergonomic Office Chair created entirely from slim arrows.",
    shapeMask: "office chair"
  },
  { id: 7, name: "Cascade Corridor", tier: 1, tierName: "Novice", w: 19, h: 23, minLen: 4, maxLen: 9, parTime: 95, lives: 3, hints: 3, description: "Step-by-step dependencies where each escape unlocks two more." },
  {
    id: 8,
    name: "Cognitive Brain",
    tier: 1,
    tierName: "Novice",
    w: BRAIN_SHAPE.w,
    h: BRAIN_SHAPE.h,
    minLen: 4,
    maxLen: 10,
    parTime: 115,
    lives: 3,
    hints: 3,
    description: "Stage 8: Human Brain silhouette created entirely from slim arrows.",
    shapeMask: "brain"
  },
  { id: 9, name: "Concentric Shell", tier: 1, tierName: "Novice", w: 20, h: 24, minLen: 4, maxLen: 10, parTime: 100, lives: 3, hints: 3, description: "Concentric arrow borders guarding a dense core." },
  {
    id: 10,
    name: "Monarch Butterfly",
    tier: 1,
    tierName: "Novice",
    w: BUTTERFLY_SHAPE.w,
    h: BUTTERFLY_SHAPE.h,
    minLen: 4,
    maxLen: 10,
    parTime: 115,
    lives: 3,
    hints: 3,
    description: "Stage 10 Milestone: Monarch Butterfly created entirely from slim arrows.",
    shapeMask: "butterfly"
  },

  // --- Tier 2: Apprentice Currents (Stages 11-20) ---
  { id: 11, name: "Serpentine Weave", tier: 2, tierName: "Apprentice", w: 21, h: 25, minLen: 4, maxLen: 11, parTime: 110, lives: 3, hints: 3, description: "Longer bodies winding through narrow gaps." },
  {
    id: 12,
    name: "Steaming Coffee Mug",
    tier: 2,
    tierName: "Apprentice",
    w: COFFEE_MUG_SHAPE.w,
    h: COFFEE_MUG_SHAPE.h,
    minLen: 4,
    maxLen: 11,
    parTime: 120,
    lives: 3,
    hints: 3,
    description: "Stage 12: Steaming Coffee Mug created entirely from slim arrows.",
    shapeMask: "coffee mug"
  },
  { id: 13, name: "Interlocked Lattice", tier: 2, tierName: "Apprentice", w: 22, h: 26, minLen: 5, maxLen: 12, parTime: 120, lives: 3, hints: 3, description: "Tight tolerances with interlocking perpendicular tails." },
  {
    id: 14,
    name: "Mariner Anchor",
    tier: 2,
    tierName: "Apprentice",
    w: ANCHOR_SHAPE.w,
    h: ANCHOR_SHAPE.h,
    minLen: 4,
    maxLen: 11,
    parTime: 125,
    lives: 3,
    hints: 3,
    description: "Stage 14: Mariner Anchor created entirely from slim arrows.",
    shapeMask: "anchor"
  },
  { id: 15, name: "The Gateway", tier: 2, tierName: "Apprentice", w: 23, h: 27, minLen: 5, maxLen: 13, parTime: 130, lives: 3, hints: 3, description: "Central choke points require finding the single unblocked keystone." },
  {
    id: 16,
    name: "Sacred Heart",
    tier: 2,
    tierName: "Apprentice",
    w: HEART_SHAPE.w,
    h: HEART_SHAPE.h,
    minLen: 4,
    maxLen: 12,
    parTime: 125,
    lives: 3,
    hints: 2,
    description: "Stage 16: Sacred Heart created entirely from slim arrows.",
    shapeMask: "heart"
  },
  { id: 17, name: "Tangled Delta", tier: 2, tierName: "Apprentice", w: 24, h: 28, minLen: 5, maxLen: 14, parTime: 135, lives: 3, hints: 2, description: "Branching channels that merge into tight bottleneck exits." },
  {
    id: 18,
    name: "Acoustic Guitar",
    tier: 2,
    tierName: "Apprentice",
    w: GUITAR_SHAPE.w,
    h: GUITAR_SHAPE.h,
    minLen: 4,
    maxLen: 12,
    parTime: 130,
    lives: 3,
    hints: 2,
    description: "Stage 18: Acoustic Guitar created entirely from slim arrows.",
    shapeMask: "guitar"
  },
  { id: 19, name: "The Coiled Knot", tier: 2, tierName: "Apprentice", w: 24, h: 29, minLen: 5, maxLen: 14, parTime: 140, lives: 3, hints: 2, description: "Complex spiral requiring methodical outside-in unraveling." },
  {
    id: 20,
    name: "Royal Crown",
    tier: 2,
    tierName: "Apprentice",
    w: CROWN_SHAPE.w,
    h: CROWN_SHAPE.h,
    minLen: 5,
    maxLen: 13,
    parTime: 135,
    lives: 3,
    hints: 2,
    description: "Stage 20 Milestone: Royal Crown created entirely from slim arrows.",
    shapeMask: "crown"
  },

  // --- Tier 3: Adept Labyrinths (Stages 21-30) ---
  { id: 21, name: "Labyrinth Spire", tier: 3, tierName: "Adept", w: 25, h: 30, minLen: 5, maxLen: 15, parTime: 145, lives: 3, hints: 2, description: "Tall vertical corridors with tight turnarounds." },
  {
    id: 22,
    name: "Cosmic Rocket",
    tier: 3,
    tierName: "Adept",
    w: ROCKET_SHAPE.w,
    h: ROCKET_SHAPE.h,
    minLen: 5,
    maxLen: 14,
    parTime: 140,
    lives: 3,
    hints: 2,
    description: "Stage 22: Cosmic Rocket Ship created entirely from slim arrows.",
    shapeMask: "rocket"
  },
  { id: 23, name: "Chrono Maze", tier: 3, tierName: "Adept", w: 25, h: 31, minLen: 6, maxLen: 16, parTime: 150, lives: 3, hints: 2, description: "Balancing time pressure with deliberate verification." },
  {
    id: 24,
    name: "Wise Owl",
    tier: 3,
    tierName: "Adept",
    w: OWL_SHAPE.w,
    h: OWL_SHAPE.h,
    minLen: 5,
    maxLen: 14,
    parTime: 145,
    lives: 3,
    hints: 2,
    description: "Stage 24: Wise Owl silhouette created entirely from slim arrows.",
    shapeMask: "owl"
  },
  { id: 25, name: "The Sovereign", tier: 3, tierName: "Adept", w: 26, h: 32, minLen: 6, maxLen: 16, parTime: 155, lives: 3, hints: 2, description: "Over 70 arrows with narrow clearance gaps." },
  {
    id: 26,
    name: "Alpine Pine Tree",
    tier: 3,
    tierName: "Adept",
    w: PINE_TREE_SHAPE.w,
    h: PINE_TREE_SHAPE.h,
    minLen: 5,
    maxLen: 14,
    parTime: 145,
    lives: 3,
    hints: 2,
    description: "Stage 26: Evergreen Pine Tree created entirely from slim arrows.",
    shapeMask: "tree"
  },
  { id: 27, name: "Pressure Web", tier: 3, tierName: "Adept", w: 26, h: 33, minLen: 6, maxLen: 17, parTime: 160, lives: 3, hints: 2, description: "Every move impacts adjacent lines; plan ahead carefully." },
  {
    id: 28,
    name: "Turbo Sports Car",
    tier: 3,
    tierName: "Adept",
    w: CAR_SHAPE.w,
    h: CAR_SHAPE.h,
    minLen: 5,
    maxLen: 15,
    parTime: 150,
    lives: 3,
    hints: 2,
    description: "Stage 28: Sleek Sports Car created entirely from slim arrows.",
    shapeMask: "car"
  },
  { id: 29, name: "Cascade Abyss", tier: 3, tierName: "Adept", w: 27, h: 34, minLen: 6, maxLen: 17, parTime: 165, lives: 3, hints: 2, description: "Deep backwards deduction required from the bottom up." },
  {
    id: 30,
    name: "Apex Shark",
    tier: 3,
    tierName: "Adept",
    w: SHARK_SHAPE.w,
    h: SHARK_SHAPE.h,
    minLen: 5,
    maxLen: 15,
    parTime: 155,
    lives: 3,
    hints: 2,
    description: "Stage 30 Milestone: Oceanic Shark created entirely from slim arrows.",
    shapeMask: "shark"
  },

  // --- Tier 4: Master Tactician (Stages 31-40) ---
  { id: 31, name: "Vector Storm", tier: 4, tierName: "Master", w: 27, h: 35, minLen: 6, maxLen: 18, parTime: 175, lives: 3, hints: 2, description: "Dense arrow clusters testing calm composure." },
  {
    id: 32,
    name: "Eureka Lightbulb",
    tier: 4,
    tierName: "Master",
    w: LIGHTBULB_SHAPE.w,
    h: LIGHTBULB_SHAPE.h,
    minLen: 5,
    maxLen: 16,
    parTime: 160,
    lives: 3,
    hints: 2,
    description: "Stage 32: Incandescent Lightbulb created entirely from slim arrows.",
    shapeMask: "lightbulb"
  },
  { id: 33, name: "Knot of Gordium", tier: 4, tierName: "Master", w: 28, h: 35, minLen: 7, maxLen: 19, parTime: 180, lives: 3, hints: 1, description: "Multiple fake exit lines; verify the entire flight path." },
  {
    id: 34,
    name: "Majestic Elephant",
    tier: 4,
    tierName: "Master",
    w: ELEPHANT_SHAPE.w,
    h: ELEPHANT_SHAPE.h,
    minLen: 6,
    maxLen: 17,
    parTime: 165,
    lives: 3,
    hints: 1,
    description: "Stage 34: Royal Elephant silhouette created entirely from slim arrows.",
    shapeMask: "elephant"
  },
  { id: 35, name: "The Grand Labyrinth", tier: 4, tierName: "Master", w: 28, h: 36, minLen: 7, maxLen: 20, parTime: 190, lives: 3, hints: 1, description: "Over 80 slim arrows intertwined in serpentine paths." },
  {
    id: 36,
    name: "Chrono Hourglass",
    tier: 4,
    tierName: "Master",
    w: HOURGLASS_SHAPE.w,
    h: HOURGLASS_SHAPE.h,
    minLen: 6,
    maxLen: 17,
    parTime: 170,
    lives: 3,
    hints: 1,
    description: "Stage 36: Sands of Time Hourglass created entirely from slim arrows.",
    shapeMask: "hourglass"
  },
  { id: 37, name: "Abyss Run", tier: 4, tierName: "Master", w: 29, h: 37, minLen: 7, maxLen: 20, parTime: 195, lives: 3, hints: 1, description: "Long winding tails that cross through multiple sectors." },
  {
    id: 38,
    name: "Knight's Shield & Sword",
    tier: 4,
    tierName: "Master",
    w: SHIELD_SWORD_SHAPE.w,
    h: SHIELD_SWORD_SHAPE.h,
    minLen: 6,
    maxLen: 18,
    parTime: 175,
    lives: 3,
    hints: 1,
    description: "Stage 38: Heraldic Shield & Sword created entirely from slim arrows.",
    shapeMask: "shield"
  },
  { id: 39, name: "Convergence Point", tier: 4, tierName: "Master", w: 29, h: 38, minLen: 7, maxLen: 21, parTime: 200, lives: 3, hints: 1, description: "Four corner streams merging into one critical sequence." },
  {
    id: 40,
    name: "Deep-Sea Octopus",
    tier: 4,
    tierName: "Master",
    w: OCTOPUS_SHAPE.w,
    h: OCTOPUS_SHAPE.h,
    minLen: 6,
    maxLen: 18,
    parTime: 180,
    lives: 3,
    hints: 1,
    description: "Stage 40 Milestone: Undulating Octopus created entirely from slim arrows.",
    shapeMask: "octopus"
  },

  // --- Tier 5: Grandmaster Apex (Stages 41-50) ---
  { id: 41, name: "Singularity Core", tier: 5, tierName: "Grandmaster", w: 30, h: 39, minLen: 7, maxLen: 22, parTime: 210, lives: 3, hints: 1, description: "Extreme density with arrows curving around every obstacle." },
  {
    id: 42,
    name: "Supersonic Jet",
    tier: 5,
    tierName: "Grandmaster",
    w: AIRPLANE_SHAPE.w,
    h: AIRPLANE_SHAPE.h,
    minLen: 6,
    maxLen: 19,
    parTime: 185,
    lives: 3,
    hints: 1,
    description: "Stage 42: Swept-wing Jet Interceptor created entirely from slim arrows.",
    shapeMask: "airplane"
  },
  { id: 43, name: "The Monolith", tier: 5, tierName: "Grandmaster", w: 30, h: 40, minLen: 8, maxLen: 23, parTime: 215, lives: 3, hints: 1, description: "Exacting solver depth requiring absolute precision." },
  {
    id: 44,
    name: "Citadel Castle",
    tier: 5,
    tierName: "Grandmaster",
    w: CASTLE_SHAPE.w,
    h: CASTLE_SHAPE.h,
    minLen: 6,
    maxLen: 19,
    parTime: 190,
    lives: 3,
    hints: 1,
    description: "Stage 44: Battlement Castle Keep created entirely from slim arrows.",
    shapeMask: "castle"
  },
  { id: 45, name: "Ouroboros", tier: 5, tierName: "Grandmaster", w: 31, h: 41, minLen: 8, maxLen: 24, parTime: 225, lives: 3, hints: 1, description: "Circular dependencies untangled step by step." },
  {
    id: 46,
    name: "Dire Wolf",
    tier: 5,
    tierName: "Grandmaster",
    w: WOLF_SHAPE.w,
    h: WOLF_SHAPE.h,
    minLen: 6,
    maxLen: 20,
    parTime: 195,
    lives: 3,
    hints: 1,
    description: "Stage 46: Noble Dire Wolf silhouette created entirely from slim arrows.",
    shapeMask: "wolf"
  },
  { id: 47, name: "The Infinite Spiral", tier: 5, tierName: "Grandmaster", w: 31, h: 42, minLen: 8, maxLen: 25, parTime: 235, lives: 3, hints: 1, description: "Continuous inward coiling path demanding patience." },
  {
    id: 48,
    name: "Research Microscope",
    tier: 5,
    tierName: "Grandmaster",
    w: MICROSCOPE_SHAPE.w,
    h: MICROSCOPE_SHAPE.h,
    minLen: 6,
    maxLen: 20,
    parTime: 200,
    lives: 3, hints: 1,
    description: "Stage 48: Precision Microscope created entirely from slim arrows.",
    shapeMask: "microscope"
  },
  { id: 49, name: "Apex Pinnacle", tier: 5, tierName: "Grandmaster", w: 32, h: 43, minLen: 8, maxLen: 26, parTime: 245, lives: 3, hints: 1, description: "The penultimate tactical trial before the Zenith." },
  {
    id: 50,
    name: "The Mythic Dragon",
    tier: 5,
    tierName: "Grandmaster",
    w: MYTHIC_DRAGON_SHAPE.w,
    h: MYTHIC_DRAGON_SHAPE.h,
    minLen: 6,
    maxLen: 22,
    parTime: 220,
    lives: 3,
    hints: 1,
    description: "Stage 50 Grandmaster Apex: The legendary Mythic Dragon silhouette created entirely from slim arrows.",
    shapeMask: "dragon"
  }
];

/**
 * Returns stage configuration for any stage id 1..50+
 */
export function getStageConfig(stageId: number): StageConfig {
  if (stageId <= STAGE_CONFIGS.length) {
    const base = STAGE_CONFIGS[stageId - 1];
    // If even stage, ensure shape is linked
    if (stageId % 2 === 0) {
      const sh = getShapeForStage(stageId);
      if (sh) {
        return {
          ...base,
          w: sh.w,
          h: sh.h,
          shapeMask: sh.n.toLowerCase()
        };
      }
    }
    return base;
  }
  const extra = stageId - STAGE_CONFIGS.length;
  const isEven = stageId % 2 === 0;
  const sh = isEven ? getShapeForStage(stageId) : undefined;
  const w = sh ? sh.w : Math.min(36, 32 + Math.floor(extra / 2));
  const h = sh ? sh.h : Math.min(48, 42 + extra);
  return {
    id: stageId,
    name: sh ? `${sh.n} (Exosphere ${extra})` : `Exosphere ${extra}`,
    tier: 5,
    tierName: "Grandmaster",
    w,
    h,
    minLen: 8,
    maxLen: 28,
    parTime: Math.min(360, 240 + extra * 10),
    lives: 3,
    hints: 1,
    description: `Procedural Infinite Grandmaster Stage ${stageId}.`,
    shapeMask: sh ? sh.n.toLowerCase() : undefined
  };
}
