import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const component = readFileSync(
  path.resolve(process.cwd(), 'src/components/admin/CeefaxBreakout.tsx'),
  'utf8',
);

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
});
