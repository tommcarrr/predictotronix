import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  path.resolve(process.cwd(), 'src/app/(admin)/admin/participants/page.tsx'),
  'utf8'
).replace(/\r\n/g, '\n');

describe('unattached users admin page', () => {
  it('does not query the optional cleanup RPC while viewing another tab', () => {
    expect(page).toContain("superAdmin && tab === 'unattached'");
  });

  it('renders an actionable error instead of crashing the server component', () => {
    expect(page).not.toContain('throw new Error(`Failed to load unattached users');
    expect(page).toContain('Unattached users are temporarily unavailable.');
    expect(page).toContain('database migration 021');
  });
});
