import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const component = readFileSync(
  path.resolve(process.cwd(), 'src/components/admin/CeefaxBreakout.tsx'),
  'utf8'
);
const styles = readFileSync(
  path.resolve(process.cwd(), 'src/components/admin/CeefaxBreakout.module.css'),
  'utf8'
);
const rules = readFileSync(path.resolve(process.cwd(), 'src/lib/breakout/rules.ts'), 'utf8');

describe('Ceefax Breakout controls', () => {
  it('moves continuously from keyboard and held direction buttons', () => {
    expect(component).toContain("event.key === 'ArrowLeft'");
    expect(component).toContain("event.key === 'ArrowRight'");
    expect(component).toContain('aria-label={`Move paddle ${direction}`}');
    expect(component).toContain('setPaddleDirection(direction, true)');
    expect(component).toContain('setPaddleDirection(direction, false)');
  });

  it('does not teleport the paddle from canvas pointer coordinates', () => {
    expect(component).not.toContain('onPointerMove');
    expect(component).not.toContain('clientX');
    expect(component).not.toContain('getBoundingClientRect');
  });

  it('prevents game button labels from being selected during play', () => {
    expect(styles).toMatch(
      /\.close,\s*\.direction,\s*\.action,\s*\.start\s*\{[^}]*user-select: none/
    );
    expect(styles).toContain('-webkit-user-select: none');
  });

  it('uses fewer power-ups and does not include a level skip', () => {
    expect(rules).toContain('powerDropChance: 0.055');
    expect(component).not.toContain("'BREAK'");
    expect(component).not.toContain('LEVEL BREAK');
  });

  it('defines distinct layouts with stronger bricks in later rounds', () => {
    expect(rules).toContain('export const TOTAL_BREAKOUT_LEVELS = 10');
    expect(rules).toContain("'333333333333'");
    expect(component).toContain("const maxHits = brickType === '#' ? 1 : Number(brickType)");
    expect(component).toContain('brick.hitsRemaining -= 1');
    expect(component).toContain("ctx.strokeStyle = undamaged ? '#fff' : '#00ffff'");
  });

  it('rewards combos and penalises lost balls', () => {
    expect(component).toContain('ball.comboHits % COMBO_SIZE === 0');
    expect(component).toContain('game.score += COMBO_BONUS');
    expect(component).toContain('game.score -= LIFE_LOSS_PENALTY');
  });
});
