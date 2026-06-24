/**
 * Architecture tests — enforce conventions that have previously caused production
 * build failures on Render.
 *
 * These tests read source files as text and assert structural invariants so that
 * violations are caught at `npm test` time rather than at deploy time.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '../../src');

/** Recursively collect all .ts / .tsx files under a directory. */
function collectFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Rule 1: Auth-gated pages must opt out of static prerendering
//
// Any page.tsx that imports getUser / isSuperAdmin / isLeagueAdmin / requireSuperAdmin
// from @/lib/auth must export `dynamic = 'force-dynamic'`.  Without this, Next.js
// attempts to statically prerender the route at build time, which fails because
// auth helpers and client-component hooks (useContext) have no React tree.
// ---------------------------------------------------------------------------
describe('Auth-gated pages must export dynamic = "force-dynamic"', () => {
  const appDir = join(ROOT, 'app');
  const pageFiles = collectFiles(appDir).filter((f) => f.endsWith('page.tsx') || f.endsWith('page.ts'));

  const AUTH_IMPORT_RE = /from ['"]@\/lib\/auth['"]/;
  const FORCE_DYNAMIC_RE = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/;

  const violations = pageFiles.filter((file) => {
    const src = readFileSync(file, 'utf8');
    return AUTH_IMPORT_RE.test(src) && !FORCE_DYNAMIC_RE.test(src);
  });

  it('has no pages that import auth helpers without force-dynamic', () => {
    const paths = violations.map((f) => relative(ROOT, f));
    expect(violations, `Missing force-dynamic in:\n  ${paths.join('\n  ')}`).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rule 2: Third-party API clients must not be instantiated at module level
//
// Initialising Resend / Twilio clients at the top of a module causes the
// constructor to run during Next.js build-time page collection.  If the
// required env vars are absent in the build environment the constructor throws,
// failing the build.  Clients must be instantiated inside functions so they
// are only constructed at request time.
//
// Heuristic: a line that starts at column 0 (no leading whitespace) and
// matches the instantiation pattern is almost certainly module-level.
// ---------------------------------------------------------------------------
describe('Third-party API clients must not be instantiated at module level', () => {
  const allFiles = collectFiles(ROOT);

  // [label, import pattern, module-level instantiation pattern]
  const RULES: Array<{ label: string; importRe: RegExp; instantiationRe: RegExp }> = [
    {
      label: 'Resend',
      importRe: /from ['"]resend['"]/,
      // Matches: `const foo = new Resend(` at column 0
      instantiationRe: /^const\s+\w+\s*=\s*new\s+Resend\s*\(/m,
    },
    {
      label: 'Twilio',
      importRe: /from ['"]twilio['"]/,
      // Matches: `const foo = twilio(` at column 0
      instantiationRe: /^const\s+\w+\s*=\s*twilio\s*\(/m,
    },
  ];

  for (const rule of RULES) {
    it(`${rule.label} client is not constructed at module level`, () => {
      const violations = allFiles.filter((file) => {
        const src = readFileSync(file, 'utf8');
        return rule.importRe.test(src) && rule.instantiationRe.test(src);
      });

      const paths = violations.map((f) => relative(ROOT, f));
      expect(violations, `${rule.label} module-level instantiation in:\n  ${paths.join('\n  ')}`).toHaveLength(0);
    });
  }
});
