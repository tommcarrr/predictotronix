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
  it('portals the overlay outside parent stacking contexts', () => {
    expect(component).toContain("import { createPortal } from 'react-dom'");
    expect(component).toContain('return createPortal(');
    expect(component).toContain('document.body');
  });

  it('moves continuously from keyboard and held direction buttons', () => {
    expect(component).toContain("event.key === 'ArrowLeft'");
    expect(component).toContain("event.key === 'ArrowRight'");
    expect(component).toContain('aria-label={`Move paddle ${direction}`}');
    expect(component).toContain('setPaddleDirection(direction, true)');
    expect(component).toContain('setPaddleDirection(direction, false)');
  });

  it('keeps the action control between the mobile direction controls', () => {
    const portraitControls = component.indexOf('<footer className={styles.controls}>');
    const leftControl = component.indexOf("renderDirectionButton('left')", portraitControls);
    const actionControl = component.indexOf('renderActionButton()', portraitControls);
    const rightControl = component.indexOf("renderDirectionButton('right')", portraitControls);

    expect(leftControl).toBeGreaterThan(-1);
    expect(actionControl).toBeGreaterThan(leftControl);
    expect(rightControl).toBeGreaterThan(actionControl);
  });

  it('reserves a fixed mobile HUD row for transient power-up messages', () => {
    expect(styles).toMatch(
      /@media \(max-width: 40rem\)[\s\S]*?\.power\s*\{[^}]*flex:\s*0 0 100%[^}]*white-space:\s*nowrap/
    );
  });

  it('uses the same direction-then-action order on both landscape sides', () => {
    const leftControls = component.indexOf('aria-label="Left-side game controls"');
    const leftDirection = component.indexOf("renderDirectionButton('left', true)", leftControls);
    const leftAction = component.indexOf('renderActionButton(true)', leftControls);
    const rightControls = component.indexOf('aria-label="Right-side game controls"');
    const rightDirection = component.indexOf("renderDirectionButton('right', true)", rightControls);
    const rightAction = component.indexOf('renderActionButton(true)', rightControls);

    expect(leftDirection).toBeGreaterThan(leftControls);
    expect(leftAction).toBeGreaterThan(leftDirection);
    expect(rightDirection).toBeGreaterThan(rightControls);
    expect(rightAction).toBeGreaterThan(rightDirection);
    expect(component.match(/renderActionButton\(true\)/g)).toHaveLength(2);
    expect(component).toContain('aria-label="Left-side game controls"');
    expect(component).toContain('aria-label="Right-side game controls"');
    expect(styles).toMatch(
      /@media \(orientation: landscape\) and \(max-height: 40rem\)[\s\S]*?\.playArea\s*\{[^}]*grid-template-columns:\s*minmax\(3\.75rem, 1fr\) auto minmax\(3\.75rem, 1fr\)/
    );
  });

  it('uses label-free action buttons with an accessible name', () => {
    expect(component).toContain('aria-label="Launch, release or fire"');
    expect(component).not.toMatch(/>\s*(?:Action|Fire)\s*</);
  });

  it('fits the canvas and overlay within a short landscape viewport', () => {
    expect(styles).toMatch(
      /@media \(orientation: landscape\) and \(max-height: 40rem\)[\s\S]*?\.viewport\s*\{[^}]*height:\s*min\(100%, calc\(\(100vw - 7\.5rem\) \* 2 \/ 3\)\)/
    );
    expect(styles).toMatch(
      /@media \(orientation: landscape\) and \(max-height: 40rem\)[\s\S]*?\.controls\s*\{[^}]*display:\s*none/
    );
    expect(styles).toMatch(
      /@media \(orientation: landscape\) and \(max-height: 40rem\)[\s\S]*?\.screen\s*\{[^}]*overflow:\s*auto/
    );
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
