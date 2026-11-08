import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Arrow, Direction } from '../types/game';
import { D } from '../services/puzzleEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface GameBoardProps {
  w: number;
  h: number;
  arrows: Arrow[];
  activeArrowIds: Set<number>;
  hintArrowId: number | null;
  recoilArrowId: number | null;
  hitBlockerId: number | null;
  recoilDirection: Direction | null;
  recoilDistance: number;
  onArrowClick: (id: number) => void;
  colorMode: boolean;
  zoomLevel: number;
  isPaused: boolean;
  onArrowExitDone?: (id: number) => void;
  revealFreeArrows?: boolean;
  freeArrowIds?: Set<number>;
}

const CELL_SIZE = 40;
const SLIM_STROKE_WIDTH = 5.5; // Slim, small, clean arrow bodies

export const GameBoard: React.FC<GameBoardProps> = ({
  w,
  h,
  arrows,
  activeArrowIds,
  hintArrowId,
  recoilArrowId,
  hitBlockerId,
  recoilDirection,
  onArrowClick,
  colorMode,
  zoomLevel,
  isPaused,
  onArrowExitDone,
  revealFreeArrows = false,
  freeArrowIds = new Set()
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Keep track of sliding arrows currently in flight
  const slidingArrowsRef = useRef<Map<number, {
    arrow: Arrow;
    trajectory: [number, number][];
    totalLen: number;
    bodyLen: number;
    startTime: number;
    duration: number;
  }>>(new Map());

  // Force re-render during active slide animations
  const [, setTick] = useState(0);

  // Spawn spark particle burst at specific board pixel coordinate
  const spawnSparkBurst = useCallback((bx: number, by: number, count: number = 18, color: string = '#f59e0b') => {
    const particles = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 5.5;
      particles.push({
        x: bx,
        y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        size: 2 + Math.random() * 3.5,
        color: i % 2 === 0 ? color : '#ef4444'
      });
    }
  }, []);

  // Spawn kinetic trail particles
  const spawnTrailParticles = useCallback((bx: number, by: number, dir: Direction, color: string) => {
    const particles = particlesRef.current;
    const [dx, dy] = D[dir];
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: bx + (Math.random() - 0.5) * 10,
        y: by + (Math.random() - 0.5) * 10,
        vx: -dx * (1.5 + Math.random() * 2) + (Math.random() - 0.5) * 1.5,
        vy: -dy * (1.5 + Math.random() * 2) + (Math.random() - 0.5) * 1.5,
        life: 1,
        maxLife: 15 + Math.random() * 10,
        size: 2 + Math.random() * 2,
        color
      });
    }
  }, []);

  // Canvas particle loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Check if sliding arrows need frame updates
      if (slidingArrowsRef.current.size > 0) {
        setTick(t => (t + 1) % 100000);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Sync canvas dimensions with board SVG
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w * CELL_SIZE;
      canvas.height = h * CELL_SIZE;
    }
  }, [w, h]);

  // When recoil happens, trigger impact sparks at arrowhead position
  useEffect(() => {
    if (recoilArrowId !== null && recoilDirection !== null) {
      const arrow = arrows.find(a => a.id === recoilArrowId);
      if (arrow) {
        const head = arrow.c[arrow.c.length - 1];
        const [dx, dy] = D[recoilDirection];
        const hx = (head[0] + 0.5 + dx * 0.7) * CELL_SIZE;
        const hy = (head[1] + 0.5 + dy * 0.7) * CELL_SIZE;
        spawnSparkBurst(hx, hy, 24, '#f59e0b');
      }
    }
  }, [recoilArrowId, recoilDirection, arrows, spawnSparkBurst]);

  // Launch arrow slide animation
  const startSlideAnimation = useCallback((arrow: Arrow) => {
    const m = arrow.c.length;
    const bodyLen = Math.max(1, m - 1);
    const E: [number, number][] = arrow.c.map(q => [q[0], q[1]]);
    const dv = D[arrow.d];

    let x = E[m - 1][0];
    let y = E[m - 1][1];

    // Extend line off board
    do {
      x += dv[0];
      y += dv[1];
      E.push([x, y]);
    } while (x >= -1 && y >= -1 && x <= w && y <= h);

    for (let k = 0; k < bodyLen + 2; k++) {
      x += dv[0];
      y += dv[1];
      E.push([x, y]);
    }

    const totalLen = E.length - 1;
    const umax = totalLen - bodyLen;
    const duration = Math.max(0.35, Math.min(0.95, umax / 34)) * 1000;

    slidingArrowsRef.current.set(arrow.id, {
      arrow,
      trajectory: E,
      totalLen,
      bodyLen,
      startTime: performance.now(),
      duration
    });

    setTick(t => t + 1);
  }, [w, h]);

  // Handle click on arrow
  const handleArrowClick = (arrow: Arrow) => {
    if (isPaused) return;
    if (!activeArrowIds.has(arrow.id)) return;
    if (slidingArrowsRef.current.has(arrow.id)) return;

    onArrowClick(arrow.id);
  };

  // Expose slide animation trigger
  useEffect(() => {
    arrows.forEach(a => {
      if (!activeArrowIds.has(a.id) && !slidingArrowsRef.current.has(a.id)) {
        startSlideAnimation(a);
      }
    });
  }, [activeArrowIds, arrows, startSlideAnimation]);

  // Helper to construct a sleek, sharp, slim arrowhead polygon
  const createSlimArrowheadPoints = (
    hpx: number,
    hpy: number,
    dx: number,
    dy: number
  ) => {
    const px = -dy;
    const py = dx;

    // Slim, sharp proportions matching the 5.5px stroke
    const tipX = hpx + dx * 0.44 * CELL_SIZE;
    const tipY = hpy + dy * 0.44 * CELL_SIZE;

    const baseX = hpx + dx * 0.08 * CELL_SIZE;
    const baseY = hpy + dy * 0.08 * CELL_SIZE;

    const wing1X = baseX + px * 0.22 * CELL_SIZE;
    const wing1Y = baseY + py * 0.22 * CELL_SIZE;

    const wing2X = baseX - px * 0.22 * CELL_SIZE;
    const wing2Y = baseY - py * 0.22 * CELL_SIZE;

    const notchX = baseX + dx * 0.04 * CELL_SIZE;
    const notchY = baseY + dy * 0.04 * CELL_SIZE;

    return `${tipX.toFixed(1)},${tipY.toFixed(1)} ${wing1X.toFixed(1)},${wing1Y.toFixed(1)} ${notchX.toFixed(1)},${notchY.toFixed(1)} ${wing2X.toFixed(1)},${wing2Y.toFixed(1)}`;
  };

  // Interpolation helper for sliding arrow paths
  const getSlidingArrowRender = (slideInfo: {
    arrow: Arrow;
    trajectory: [number, number][];
    totalLen: number;
    bodyLen: number;
    startTime: number;
    duration: number;
  }) => {
    const { arrow, trajectory, totalLen, bodyLen, startTime, duration } = slideInfo;
    const now = performance.now();
    const progress = Math.min(1, (now - startTime) / duration);
    const umax = totalLen - bodyLen;

    const ease = progress * 0.35 + progress * progress * 0.65;
    const u = umax * ease;
    const e = u + bodyLen;

    const at = (t: number): [number, number] => {
      const i = Math.min(Math.floor(t), totalLen - 1);
      const f = t - i;
      const p1 = trajectory[i];
      const p2 = trajectory[i + 1] || p1;
      return [p1[0] + (p2[0] - p1[0]) * f, p1[1] + (p2[1] - p1[1]) * f];
    };

    const pts: [number, number][] = [at(u)];
    for (let k = Math.floor(u) + 1; k < e; k++) {
      if (k < trajectory.length) {
        pts.push(trajectory[k]);
      }
    }
    pts.push(at(e));

    const hi = Math.min(Math.floor(e), totalLen - 1);
    const nextPt = trajectory[hi + 1] || trajectory[hi];
    const curPt = trajectory[hi];
    const dx = Math.sign(nextPt[0] - curPt[0]) || D[arrow.d][0];
    const dy = Math.sign(nextPt[1] - curPt[1]) || D[arrow.d][1];
    const hp = pts[pts.length - 1];

    const pathD = "M" + pts.map(p => `${((p[0] + 0.5) * CELL_SIZE).toFixed(1)},${((p[1] + 0.5) * CELL_SIZE).toFixed(1)}`).join("L");
    const hpx = (hp[0] + 0.5) * CELL_SIZE;
    const hpy = (hp[1] + 0.5) * CELL_SIZE;

    const tri = createSlimArrowheadPoints(hpx, hpy, dx, dy);

    if (Math.random() < 0.35) {
      spawnTrailParticles(hpx, hpy, arrow.d, colorMode ? (arrow.color || '#3b82f6') : '#3b82f6');
    }

    if (progress >= 1) {
      slidingArrowsRef.current.delete(arrow.id);
      if (onArrowExitDone) onArrowExitDone(arrow.id);
    }

    return { pathD, tri, arrow };
  };

  const boardWidthPx = w * zoomLevel;
  const boardHeightPx = h * zoomLevel;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-2 sm:p-5 overflow-auto max-h-[72vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm shadow-inner transition-colors"
      style={{ minHeight: '380px' }}
    >
      <div
        className="relative transition-all duration-150 ease-out flex-shrink-0"
        style={{ width: `${boardWidthPx}px`, height: `${boardHeightPx}px` }}
      >
        {/* Particle Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20"
          style={{ width: `${boardWidthPx}px`, height: `${boardHeightPx}px` }}
        />

        {/* SVG Board Rendering */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w * CELL_SIZE} ${h * CELL_SIZE}`}
          className="w-full h-full select-none"
          role="application"
          aria-label="Arrow Escape puzzle board"
        >
          {/* Subtle Grid dots */}
          <pattern id="gridDots" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={CELL_SIZE / 2} cy={CELL_SIZE / 2} r="1.2" className="fill-slate-300/50 dark:fill-slate-700/50" />
          </pattern>
          <rect width={w * CELL_SIZE} height={h * CELL_SIZE} fill="url(#gridDots)" />

          {/* Render Active Stationary Arrows */}
          {arrows.map(a => {
            const isAlive = activeArrowIds.has(a.id);
            const isSliding = slidingArrowsRef.current.has(a.id);
            if (!isAlive && !isSliding) return null;

            // If arrow is sliding, render animated interpolation
            if (isSliding) {
              const slide = slidingArrowsRef.current.get(a.id);
              if (!slide) return null;
              const rendered = getSlidingArrowRender(slide);
              const color = colorMode ? (a.color || '#3b82f6') : 'currentColor';

              return (
                <g
                  key={`sliding-${a.id}`}
                  className="pointer-events-none opacity-90 transition-opacity"
                  style={{ color }}
                >
                  <path
                    d={rendered.pathD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={SLIM_STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points={rendered.tri}
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                  />
                </g>
              );
            }

            // Normal stationary arrow
            const pts = a.c.map(q => [(q[0] + 0.5) * CELL_SIZE, (q[1] + 0.5) * CELL_SIZE]);
            const hd = pts[pts.length - 1];
            const [dx, dy] = D[a.d];

            // Always guarantee a visible tail! If single point, synthesize tail backwards
            let dPath = "";
            if (pts.length > 1) {
              dPath = "M" + pts.map(q => q.join(",")).join("L");
            } else {
              // 1-cell fallback: synthesize a visible tail segment extending backwards from hd
              const tailX = hd[0] - dx * 0.42 * CELL_SIZE;
              const tailY = hd[1] - dy * 0.42 * CELL_SIZE;
              dPath = `M${tailX.toFixed(1)},${tailY.toFixed(1)}L${hd[0].toFixed(1)},${hd[1].toFixed(1)}`;
            }

            // Slim, sleek arrowhead points
            const tri = createSlimArrowheadPoints(hd[0], hd[1], dx, dy);

            const isHinted = hintArrowId === a.id;
            const isRecoil = recoilArrowId === a.id;
            const isHitBlocker = hitBlockerId === a.id;
            const isFreeAdmin = revealFreeArrows && freeArrowIds.has(a.id);

            const baseColor = colorMode ? (a.color || '#3b82f6') : '#0f172a';
            let arrowColor = baseColor;
            if (isHitBlocker) arrowColor = '#ef4444';
            else if (isFreeAdmin) arrowColor = '#10b981';

            // Recoil vector
            const recoilStyle = isRecoil && recoilDirection !== null ? {
              '--recoil-x': `${D[recoilDirection][0] * 16}px`,
              '--recoil-y': `${D[recoilDirection][1] * 16}px`,
            } as React.CSSProperties : undefined;

            return (
              <g
                key={`arrow-${a.id}`}
                id={`arrow-${a.id}`}
                onClick={() => handleArrowClick(a)}
                className={`cursor-pointer transition-transform duration-100 ease-out group ${
                  isRecoil ? 'arrow-recoil' : ''
                } ${isHinted ? 'arrow-hint' : ''} ${
                  isHitBlocker ? 'scale-105' : 'hover:scale-[1.01]'
                }`}
                style={{
                  color: arrowColor,
                  ...recoilStyle
                }}
              >
                {/* Slim, elegant body tail */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={arrowColor}
                  strokeWidth={SLIM_STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-150 group-hover:brightness-125"
                />

                {/* Generous invisible hit zone for easy clicking on mobile & desktop */}
                <path
                  d={dPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={30}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Slim, sharp arrowhead */}
                <polygon
                  points={tri}
                  fill={arrowColor}
                  stroke={arrowColor}
                  strokeWidth={0.8}
                  strokeLinejoin="round"
                  className="transition-colors duration-150 group-hover:brightness-125"
                />

                {/* Head circle hit target */}
                <circle
                  cx={hd[0]}
                  cy={hd[1]}
                  r={CELL_SIZE * 0.42}
                  fill="transparent"
                />

                {/* Ethereal hint ring */}
                {isHinted && (
                  <circle
                    cx={hd[0]}
                    cy={hd[1]}
                    r={CELL_SIZE * 0.65}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    className="animate-spin"
                    style={{ transformOrigin: `${hd[0]}px ${hd[1]}px` }}
                  />
                )}

                {/* Admin God Mode halo */}
                {isFreeAdmin && (
                  <circle
                    cx={hd[0]}
                    cy={hd[1]}
                    r={CELL_SIZE * 0.55}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={1.8}
                    opacity={0.8}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
