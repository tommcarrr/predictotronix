'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  getBreakoutLeaderboard,
  startBreakoutRun,
  submitBreakoutRun,
} from '@/lib/breakout/actions';
import type { BreakoutLeaderboardEntry } from '@/lib/breakout/constants';
import {
  BREAKOUT_LEVELS,
  COMBO_BONUS,
  COMBO_SIZE,
  LIFE_LOSS_PENALTY,
  PERFECT_GAME_BONUS,
  TOTAL_BREAKOUT_LEVELS,
  brickHitPoints,
  type BreakoutRunSummary,
} from '@/lib/breakout/rules';
import styles from './CeefaxBreakout.module.css';

const WIDTH = 960;
const HEIGHT = 640;
const PADDLE_Y = 584;
const POWER_TYPES = ['WIDE', 'CATCH', 'LASER', 'SLOW', 'MULTI', 'LIFE'] as const;
type PowerType = (typeof POWER_TYPES)[number];
type Screen = 'splash' | 'playing' | 'paused' | 'gameover' | 'won';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  stuckOffset: number;
  comboHits: number;
}
interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  colour: string;
  hitsRemaining: number;
  maxHits: number;
  alive: boolean;
}
interface Drop {
  x: number;
  y: number;
  type: PowerType;
}
interface Shot {
  x: number;
  y: number;
}
interface Game {
  runId: string | null;
  balls: Ball[];
  bricks: Brick[];
  drops: Drop[];
  shots: Shot[];
  paddleX: number;
  paddleWidth: number;
  basePaddleWidth: number;
  keys: { left: boolean; right: boolean };
  score: number;
  lives: number;
  level: number;
  catchUntil: number;
  laserUntil: number;
  wideUntil: number;
  lastShotAt: number;
  hitsByLevel: number[];
  comboAwards: number;
  livesLost: number;
  maxCombo: number;
  activeDurationMs: number;
}

const POWER_COLOURS: Record<PowerType, string> = {
  WIDE: '#0000ff',
  CATCH: '#00ff00',
  LASER: '#ff0000',
  SLOW: '#ff8800',
  MULTI: '#00ffff',
  LIFE: '#ffff00',
};

function displayName(value: string) {
  const trimmed = value.trim();
  return (trimmed.includes('@') ? trimmed.split('@')[0] : trimmed || 'PLAYER 1').toUpperCase();
}

function createBricks(level: number): Brick[] {
  const colours = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
  const layout = BREAKOUT_LEVELS[Math.min(level, BREAKOUT_LEVELS.length) - 1].layout;
  const columns = 12;
  const gap = 8;
  const side = 42;
  const width = (WIDTH - side * 2 - gap * (columns - 1)) / columns;
  return layout.flatMap((rowPattern, row) =>
    [...rowPattern].flatMap((brickType, col) => {
      if (brickType === '.') return [];
      const maxHits = brickType === '#' ? 1 : Number(brickType);
      return [
        {
          x: side + col * (width + gap),
          y: 76 + row * 37,
          width,
          height: 25,
          colour: colours[(row + level - 1) % colours.length],
          hitsRemaining: maxHits,
          maxHits,
          alive: true,
        },
      ];
    })
  );
}

function freshBall(paddleX: number, level: number): Ball {
  const speed = BREAKOUT_LEVELS[level - 1].ballSpeedMultiplier;
  return {
    x: paddleX,
    y: PADDLE_Y - 18,
    vx: 245 * speed,
    vy: -315 * speed,
    stuck: true,
    stuckOffset: 0,
    comboHits: 0,
  };
}

function createGame(runId: string | null = null): Game {
  const firstLevel = BREAKOUT_LEVELS[0];
  return {
    runId,
    balls: [freshBall(WIDTH / 2, 1)],
    bricks: createBricks(1),
    drops: [],
    shots: [],
    paddleX: WIDTH / 2,
    paddleWidth: firstLevel.paddleWidth,
    basePaddleWidth: firstLevel.paddleWidth,
    keys: { left: false, right: false },
    score: 0,
    lives: 3,
    level: 1,
    catchUntil: 0,
    laserUntil: 0,
    wideUntil: 0,
    lastShotAt: 0,
    hitsByLevel: Array(TOTAL_BREAKOUT_LEVELS).fill(0),
    comboAwards: 0,
    livesLost: 0,
    maxCombo: 0,
    activeDurationMs: 0,
  };
}

function drawFootball(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.save();
  ctx.translate(Math.round(ball.x), Math.round(ball.y));
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  for (let point = 0; point < 5; point += 1) {
    const angle = -Math.PI / 2 + point * Math.PI * 0.4;
    const radius = point % 2 === 0 ? 4.8 : 2.2;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  for (let patch = 0; patch < 5; patch += 1) {
    const angle = patch * Math.PI * 0.4;
    ctx.fillRect(Math.round(Math.cos(angle) * 7) - 2, Math.round(Math.sin(angle) * 7) - 2, 4, 4);
  }
  ctx.restore();
}

function drawGame(ctx: CanvasRenderingContext2D, game: Game, now: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = '#0000ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.colour;
    ctx.fillRect(Math.round(brick.x), Math.round(brick.y), Math.round(brick.width), brick.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(brick.x) + 5, Math.round(brick.y) + 5, Math.round(brick.width) - 10, 3);
    if (brick.maxHits > 1) {
      const undamaged = brick.hitsRemaining === brick.maxHits;
      ctx.strokeStyle = undamaged ? '#fff' : '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        Math.round(brick.x) + 2,
        Math.round(brick.y) + 2,
        Math.round(brick.width) - 4,
        brick.height - 4
      );
      ctx.fillStyle = undamaged ? '#fff' : '#00ffff';
      const pipY = Math.round(brick.y + brick.height - 7);
      for (let pip = 0; pip < brick.hitsRemaining; pip += 1) {
        const pipX = brick.x + brick.width / 2 + (pip - (brick.hitsRemaining - 1) / 2) * 12;
        ctx.fillRect(Math.round(pipX) - 2, pipY, 5, 3);
      }
      if (!undamaged) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(brick.x + brick.width * 0.35), Math.round(brick.y + 2));
        ctx.lineTo(
          Math.round(brick.x + brick.width * 0.55),
          Math.round(brick.y + brick.height - 2)
        );
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = now < game.laserUntil ? '#ff0000' : '#fff';
  ctx.fillRect(
    Math.round(game.paddleX - game.paddleWidth / 2),
    PADDLE_Y,
    Math.round(game.paddleWidth),
    16
  );
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(
    Math.round(game.paddleX - game.paddleWidth / 2) + 6,
    PADDLE_Y + 4,
    Math.round(game.paddleWidth) - 12,
    4
  );
  for (const ball of game.balls) drawFootball(ctx, ball);
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const drop of game.drops) {
    ctx.fillStyle = POWER_COLOURS[drop.type];
    ctx.fillRect(Math.round(drop.x - 24), Math.round(drop.y - 12), 48, 24);
    ctx.fillStyle = drop.type === 'LIFE' ? '#000' : '#fff';
    ctx.fillText(drop.type[0], Math.round(drop.x), Math.round(drop.y + 1));
  }
  ctx.fillStyle = '#ff0000';
  for (const shot of game.shots) ctx.fillRect(Math.round(shot.x - 3), Math.round(shot.y), 6, 18);
}

function hitsBrick(x: number, y: number, radius: number, brick: Brick) {
  return (
    x + radius >= brick.x &&
    x - radius <= brick.x + brick.width &&
    y + radius >= brick.y &&
    y - radius <= brick.y + brick.height
  );
}

export function CeefaxBreakout({
  playerName,
  leagueId,
  leagueName,
  onClose,
}: {
  playerName: string;
  leagueId: string;
  leagueName: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(createGame());
  const screenRef = useRef<Screen>('splash');
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const submittedScoreRef = useRef<string | null>(null);
  const player = displayName(playerName);
  const [screen, setScreen] = useState<Screen>('splash');
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, combo: 0 });
  const [leaderboard, setLeaderboard] = useState<BreakoutLeaderboardEntry[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [scoreStatus, setScoreStatus] = useState('Loading league table…');
  const [leaderboardPending, startLeaderboardTransition] = useTransition();
  const [powerMessage, setPowerMessage] = useState('');

  const changeScreen = useCallback((next: Screen) => {
    screenRef.current = next;
    setScreen(next);
  }, []);

  const publishHud = useCallback(() => {
    const game = gameRef.current;
    setHud({
      score: game.score,
      lives: game.lives,
      level: game.level,
      combo: Math.max(0, ...game.balls.map((ball) => ball.comboHits)),
    });
  }, []);

  const announcePower = useCallback((type: PowerType) => {
    const labels: Record<PowerType, string> = {
      WIDE: 'WIDE PADDLE',
      CATCH: 'CATCH',
      LASER: 'LASER',
      SLOW: 'SLOW BALL',
      MULTI: 'MULTIBALL',
      LIFE: 'EXTRA LIFE',
    };
    setPowerMessage(labels[type]);
    window.setTimeout(() => setPowerMessage(''), 1700);
  }, []);

  const applyPower = useCallback(
    (type: PowerType, now: number) => {
      const game = gameRef.current;
      if (type === 'WIDE') {
        game.wideUntil = now + 15000;
        game.paddleWidth = 230;
      }
      if (type === 'CATCH') game.catchUntil = now + 12000;
      if (type === 'LASER') game.laserUntil = now + 12000;
      if (type === 'SLOW')
        game.balls.forEach((ball) => {
          ball.vx *= 0.72;
          ball.vy *= 0.72;
        });
      if (type === 'MULTI') {
        const source = game.balls[0];
        if (source) {
          game.balls.push(
            {
              ...source,
              vx: -Math.abs(source.vx || 250),
              vy: -Math.abs(source.vy || 300),
              stuck: false,
              comboHits: 0,
            },
            {
              ...source,
              vx: Math.abs(source.vx || 250) * 0.7,
              vy: -Math.abs(source.vy || 300),
              stuck: false,
              comboHits: 0,
            }
          );
        }
      }
      if (type === 'LIFE') game.lives += 1;
      announcePower(type);
      publishHud();
    },
    [announcePower, publishHud]
  );

  const fireAction = useCallback(() => {
    const game = gameRef.current;
    if (
      screenRef.current === 'splash' ||
      screenRef.current === 'gameover' ||
      screenRef.current === 'won'
    )
      return;
    if (screenRef.current === 'paused') {
      changeScreen('playing');
      return;
    }
    const stuck = game.balls.filter((ball) => ball.stuck);
    if (stuck.length) {
      stuck.forEach((ball, index) => {
        ball.stuck = false;
        ball.vx = (index % 2 ? -1 : 1) * Math.abs(ball.vx);
        ball.vy = -Math.abs(ball.vy);
      });
      return;
    }
    const now = performance.now();
    if (now < game.laserUntil && now - game.lastShotAt > 240) {
      game.shots.push(
        { x: game.paddleX - game.paddleWidth * 0.36, y: PADDLE_Y - 16 },
        { x: game.paddleX + game.paddleWidth * 0.36, y: PADDLE_Y - 16 }
      );
      game.lastShotAt = now;
    }
  }, [changeScreen]);

  const startGame = useCallback(() => {
    startLeaderboardTransition(async () => {
      setScoreStatus('Starting a verified game…');
      const result = await startBreakoutRun(leagueId);
      if (!result.success || !result.runId) {
        setScoreStatus(result.error ?? 'A verified game could not be started.');
        return;
      }
      gameRef.current = createGame(result.runId);
      submittedScoreRef.current = null;
      setPowerMessage('');
      setScoreStatus('');
      publishHud();
      changeScreen('playing');
    });
  }, [changeScreen, leagueId, publishHud]);

  useEffect(() => {
    startLeaderboardTransition(async () => {
      const result = await getBreakoutLeaderboard(leagueId);
      setLeaderboard(result.leaderboard);
      setParticipantId(result.participantId);
      setScoreStatus(result.success ? '' : (result.error ?? 'League table unavailable.'));
    });
  }, [leagueId]);

  useEffect(() => {
    if (screen !== 'gameover' && screen !== 'won') return;
    const game = gameRef.current;
    const submissionKey = `${game.runId}:${screen}:${hud.score}`;
    if (submittedScoreRef.current === submissionKey) return;
    submittedScoreRef.current = submissionKey;
    startLeaderboardTransition(async () => {
      setScoreStatus('Saving your score…');
      if (!game.runId) {
        setScoreStatus('This game did not have a verified run ticket.');
        return;
      }
      const summary: BreakoutRunSummary = {
        hitsByLevel: [...game.hitsByLevel],
        comboAwards: game.comboAwards,
        livesLost: game.livesLost,
        maxCombo: game.maxCombo,
        durationMs: Math.round(game.activeDurationMs),
        finished: screen === 'won',
      };
      const result = await submitBreakoutRun(leagueId, game.runId, summary);
      setLeaderboard(result.leaderboard);
      setParticipantId(result.participantId);
      setScoreStatus(
        result.success
          ? 'League table updated.'
          : (result.error ?? 'Your score could not be saved.')
      );
    });
  }, [hud.score, leagueId, screen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    context.imageSmoothingEnabled = false;

    const nextLevel = () => {
      const game = gameRef.current;
      if (screenRef.current !== 'playing') return;
      if (game.level >= TOTAL_BREAKOUT_LEVELS) {
        if (game.livesLost === 0) game.score += PERFECT_GAME_BONUS;
        game.score = Math.max(0, game.score);
        changeScreen('won');
        publishHud();
        return;
      }
      game.level += 1;
      const definition = BREAKOUT_LEVELS[game.level - 1];
      game.bricks = createBricks(game.level);
      game.drops = [];
      game.shots = [];
      game.basePaddleWidth = definition.paddleWidth;
      game.paddleWidth = definition.paddleWidth;
      game.catchUntil = 0;
      game.laserUntil = 0;
      game.wideUntil = 0;
      game.balls = [freshBall(game.paddleX, game.level)];
      publishHud();
    };
    const hitBrick = (brick: Brick, x: number, y: number, ball?: Ball) => {
      if (!brick.alive) return;
      brick.hitsRemaining -= 1;
      const game = gameRef.current;
      game.hitsByLevel[game.level - 1] += 1;
      game.score += brickHitPoints(game.level);
      if (ball) {
        ball.comboHits += 1;
        game.maxCombo = Math.max(game.maxCombo, ball.comboHits);
        if (ball.comboHits % COMBO_SIZE === 0) {
          game.comboAwards += 1;
          game.score += COMBO_BONUS;
          setPowerMessage(`COMBO ${ball.comboHits} +${COMBO_BONUS}`);
          window.setTimeout(() => setPowerMessage(''), 1200);
        }
      }
      if (brick.hitsRemaining > 0) {
        publishHud();
        return;
      }
      brick.alive = false;
      if (Math.random() < BREAKOUT_LEVELS[game.level - 1].powerDropChance) {
        game.drops.push({
          x,
          y,
          type: POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)],
        });
      }
      publishHud();
      if (!game.bricks.some((candidate) => candidate.alive)) nextLevel();
    };
    const update = (dt: number, now: number) => {
      const game = gameRef.current;
      game.activeDurationMs += dt * 1000;
      if (now > game.wideUntil) game.paddleWidth = game.basePaddleWidth;
      const direction = Number(game.keys.right) - Number(game.keys.left);
      game.paddleX += direction * 520 * dt;
      game.paddleX = Math.max(
        game.paddleWidth / 2 + 18,
        Math.min(WIDTH - game.paddleWidth / 2 - 18, game.paddleX)
      );
      for (const ball of game.balls) {
        if (ball.stuck) {
          ball.x = game.paddleX + ball.stuckOffset;
          ball.y = PADDLE_Y - 15;
          continue;
        }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < 24) {
          ball.x = 24;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > WIDTH - 24) {
          ball.x = WIDTH - 24;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < 24) {
          ball.y = 24;
          ball.vy = Math.abs(ball.vy);
        }
        if (
          ball.vy > 0 &&
          ball.y + 11 >= PADDLE_Y &&
          ball.y < PADDLE_Y + 18 &&
          Math.abs(ball.x - game.paddleX) <= game.paddleWidth / 2 + 8
        ) {
          ball.y = PADDLE_Y - 12;
          const offset = (ball.x - game.paddleX) / (game.paddleWidth / 2);
          const speed = Math.max(360, Math.hypot(ball.vx, ball.vy));
          ball.vx = speed * 0.78 * offset;
          ball.vy = -Math.sqrt(Math.max(1, speed * speed - ball.vx * ball.vx));
          ball.comboHits = 0;
          if (now < game.catchUntil) {
            ball.stuck = true;
            ball.stuckOffset = ball.x - game.paddleX;
          }
          publishHud();
        }
        for (const brick of game.bricks) {
          if (!brick.alive || !hitsBrick(ball.x, ball.y, 11, brick)) continue;
          hitBrick(brick, ball.x, ball.y, ball);
          const fromSide = ball.x < brick.x + 5 || ball.x > brick.x + brick.width - 5;
          if (fromSide) ball.vx *= -1;
          else ball.vy *= -1;
          break;
        }
      }
      game.balls = game.balls.filter((ball) => ball.y < HEIGHT + 30);
      if (!game.balls.length) {
        game.lives -= 1;
        game.livesLost += 1;
        game.score -= LIFE_LOSS_PENALTY;
        setPowerMessage(`BALL LOST -${LIFE_LOSS_PENALTY}`);
        window.setTimeout(() => setPowerMessage(''), 1400);
        if (game.lives <= 0) {
          game.score = Math.max(0, game.score);
          changeScreen('gameover');
        } else {
          game.balls = [freshBall(game.paddleX, game.level)];
        }
        publishHud();
      }
      for (const drop of game.drops) drop.y += 120 * dt;
      const caught = game.drops.filter(
        (drop) =>
          drop.y + 12 >= PADDLE_Y &&
          drop.y < PADDLE_Y + 20 &&
          Math.abs(drop.x - game.paddleX) <= game.paddleWidth / 2 + 20
      );
      caught.forEach((drop) => applyPower(drop.type, now));
      game.drops = game.drops.filter((drop) => !caught.includes(drop) && drop.y < HEIGHT + 20);
      if (!game.bricks.some((brick) => brick.alive)) nextLevel();
      for (const shot of game.shots) {
        shot.y -= 520 * dt;
        const brick = game.bricks.find(
          (candidate) =>
            candidate.alive &&
            shot.x >= candidate.x &&
            shot.x <= candidate.x + candidate.width &&
            shot.y <= candidate.y + candidate.height &&
            shot.y >= candidate.y
        );
        if (brick) {
          hitBrick(brick, shot.x, shot.y);
          shot.y = -100;
        }
      }
      game.shots = game.shots.filter((shot) => shot.y > 0);
    };
    const frame = (now: number) => {
      const dt = Math.min((now - lastFrameRef.current) / 1000 || 0, 1 / 30);
      lastFrameRef.current = now;
      if (screenRef.current === 'playing') update(dt, now);
      drawGame(context, gameRef.current, now);
      frameRef.current = requestAnimationFrame(frame);
    };
    frameRef.current = requestAnimationFrame(frame);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [applyPower, changeScreen, publishHud]);

  useEffect(() => {
    const key = (pressed: boolean) => (event: KeyboardEvent) => {
      const canMove = screenRef.current === 'playing';
      if (event.key === 'ArrowLeft') gameRef.current.keys.left = pressed && canMove;
      if (event.key === 'ArrowRight') gameRef.current.keys.right = pressed && canMove;
      if (pressed && (event.key === ' ' || event.key === 'Enter')) fireAction();
      if (pressed && event.key.toLowerCase() === 'p' && screenRef.current === 'playing')
        changeScreen('paused');
      if (pressed && event.key === 'Escape') onClose();
      if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) event.preventDefault();
    };
    const releasePaddle = () => {
      gameRef.current.keys.left = false;
      gameRef.current.keys.right = false;
    };
    const down = key(true);
    const up = key(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releasePaddle);
    return () => {
      releasePaddle();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releasePaddle);
    };
  }, [changeScreen, fireAction, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const setPaddleDirection = (direction: 'left' | 'right', pressed: boolean) => {
    gameRef.current.keys[direction] = pressed;
  };

  const renderDirectionButton = (direction: 'left' | 'right') => (
    <button
      className={styles.direction}
      type="button"
      aria-label={`Move paddle ${direction}`}
      disabled={screen !== 'playing'}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setPaddleDirection(direction, true);
      }}
      onPointerUp={() => setPaddleDirection(direction, false)}
      onPointerCancel={() => setPaddleDirection(direction, false)}
      onLostPointerCapture={() => setPaddleDirection(direction, false)}
    >
      {direction === 'left' ? '← LEFT' : 'RIGHT →'}
    </button>
  );

  const personalBest = leaderboard.find((entry) => entry.participantId === participantId);
  const visibleLeaders = leaderboard.slice(0, 5);
  const overlay =
    screen !== 'playing' ? (
      <div className={styles.screen} role={screen === 'splash' ? 'document' : 'status'}>
        <div className={styles.screenPanel}>
          <p className={styles.screenKicker}>PREDICTOTRONIX PAGE 302</p>
          <h2 className={styles.screenTitle}>
            {screen === 'splash'
              ? 'FOOTBALL BREAKOUT'
              : screen === 'paused'
                ? 'HOLD'
                : screen === 'won'
                  ? 'CHAMPION!'
                  : 'FULL TIME'}
          </h2>
          <p className={styles.leagueName}>{leagueName.toUpperCase()}</p>
          <div className={styles.leaderboard} aria-label={`${leagueName} high scores`}>
            {visibleLeaders.length ? (
              visibleLeaders.map((entry) => (
                <div
                  className={`${styles.leaderboardRow} ${entry.participantId === participantId ? styles.leaderboardCurrent : ''}`}
                  key={entry.participantId}
                >
                  <strong>{entry.position}</strong>
                  <span>{entry.displayName.toUpperCase()}</span>
                  <strong>{String(entry.score).padStart(6, '0')}</strong>
                </div>
              ))
            ) : (
              <div className={styles.leaderboardRow}>
                <strong>1</strong>
                <span>{player}</span>
                <strong>000000</strong>
              </div>
            )}
          </div>
          <p className={styles.personalBest}>
            YOUR BEST {String(personalBest?.score ?? 0).padStart(6, '0')}
          </p>
          <p className={styles.scoreStatus} role="status">
            {leaderboardPending ? 'Updating league table…' : scoreStatus}
          </p>
          <button
            className={styles.start}
            type="button"
            disabled={leaderboardPending}
            onClick={screen === 'paused' ? () => changeScreen('playing') : startGame}
          >
            {screen === 'splash' ? 'Press to start' : screen === 'paused' ? 'Resume' : 'Play again'}
          </button>
          <p className={styles.help}>
            Move with the ← → keys or hold the on-screen arrows. SPACE / ACTION launches, catches
            and fires. Every {COMBO_SIZE} hits before the ball returns earns +{COMBO_BONUS}; losing
            a ball costs {LIFE_LOSS_PENALTY}. P pauses.
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Football Breakout">
      <section className={styles.shell}>
        <header className={styles.masthead}>
          <strong className={styles.title}>CEEFAX SPORT · 302</strong>
          <button className={styles.close} type="button" onClick={onClose} aria-label="Close game">
            ×
          </button>
        </header>
        <div className={styles.hud} aria-live="polite">
          <span>
            SCORE <strong>{String(hud.score).padStart(6, '0')}</strong>
          </span>
          <span>
            PLAYER <strong>{player}</strong>
          </span>
          <span>
            BALLS <strong>{hud.lives}</strong>
          </span>
          <span>
            ROUND{' '}
            <strong>
              {hud.level}/{TOTAL_BREAKOUT_LEVELS}
            </strong>
          </span>
          <span>
            COMBO <strong>{hud.combo}</strong>
          </span>
          <span className={styles.power}>{powerMessage}</span>
        </div>
        <div className={styles.viewport}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Breakout play field" />
          {overlay}
        </div>
        <footer className={styles.controls}>
          <div className={styles.directionControls} aria-label="Game controls">
            {renderDirectionButton('left')}
            <button className={styles.action} type="button" onClick={fireAction}>
              Action
            </button>
            {renderDirectionButton('right')}
          </div>
          <span className={styles.controlHint}>Hold to move</span>
        </footer>
      </section>
    </div>
  );
}
