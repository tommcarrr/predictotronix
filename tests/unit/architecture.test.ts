/**
 * Architecture tests — enforce conventions that have previously caused production
 * build failures on Render.
 *
 * These tests read source files as text and assert structural invariants so that
 * violations are caught at `npm test` time rather than at deploy time.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';

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

  const AUTH_IMPORT_RE = /from ['"]@\/lib\/auth(\/[^'"]*)?['"]/;
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

// ---------------------------------------------------------------------------
// Rule 3: Every source file must be syntactically valid
//
// A malformed edit (e.g. `export const dynamic = 'force-dynamic';() {`) is a
// pure syntax error that `tsc --noEmit` and the production build both reject,
// but which the text-based rules above do not catch.  We run every source file
// through the TypeScript parser (transpile-only, no type checking — fast) and
// assert there are zero syntactic diagnostics.  This is the cheapest possible
// guard against a parse error reaching deploy.
// ---------------------------------------------------------------------------
describe('Every source file is syntactically valid', () => {
  const allFiles = collectFiles(ROOT);

  it('has no files with syntax errors', () => {
    const failures: string[] = [];

    for (const file of allFiles) {
      const src = readFileSync(file, 'utf8');
      const { diagnostics } = ts.transpileModule(src, {
        fileName: file,
        reportDiagnostics: true,
        compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
      });

      const syntaxErrors = (diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
      if (syntaxErrors.length > 0) {
        const messages = syntaxErrors
          .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
          .join('; ');
        failures.push(`${relative(ROOT, file)}: ${messages}`);
      }
    }

    expect(failures, `Syntax errors found in:\n  ${failures.join('\n  ')}`).toHaveLength(0);
  }, 15_000);
});

// ---------------------------------------------------------------------------
// Rule 4: app/global-error.tsx must exist, be a Client Component, and use the
//         correct Next.js 16 API (unstable_retry, not reset).
//
// Next.js App Router generates a /_global-error route at build time.  Without
// a custom global-error.tsx it tries to statically render the root layout,
// which calls useContext (via next/font/google) and throws at prerender time on
// Linux (Render / CI).  The file must have 'use client' so it is a client
// boundary, and must use the unstable_retry prop — not the old reset prop —
// which is the documented API in Next.js 16.
//
// NOTE: npm run build passes on Windows even without this file because the
// platform-specific prerender failure only occurs on Linux.  These tests are
// the authoritative local guard; GitHub Actions CI (ubuntu-latest) is the
// authoritative build-level guard.
// ---------------------------------------------------------------------------
describe('app/global-error.tsx must exist and be a correct Client Component', () => {
  const globalErrorPath = join(ROOT, 'app', 'global-error.tsx');

  it('src/app/global-error.tsx exists', () => {
    expect(
      existsSync(globalErrorPath),
      'src/app/global-error.tsx is missing — Next.js will fail to prerender /_global-error on Linux',
    ).toBe(true);
  });

  it('src/app/global-error.tsx starts with "use client"', () => {
    if (!existsSync(globalErrorPath)) return;
    const src = readFileSync(globalErrorPath, 'utf8').trimStart();
    expect(
      src.startsWith("'use client'") || src.startsWith('"use client"'),
      'src/app/global-error.tsx must have "use client" as its first directive',
    ).toBe(true);
  });

  it('src/app/global-error.tsx uses unstable_retry (Next.js 16 API), not the old reset prop', () => {
    if (!existsSync(globalErrorPath)) return;
    const src = readFileSync(globalErrorPath, 'utf8');
    expect(
      src.includes('unstable_retry'),
      'src/app/global-error.tsx must use unstable_retry — the reset prop was renamed in Next.js 16',
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule 5: Every page.tsx must have a default export
//
// Next.js requires each route segment's page file to default-export a React
// component.  A botched edit can destroy the `export default` (as happened to
// the leaderboard page), which only surfaces as a build failure.  This rule
// catches a missing default export at test time.
// ---------------------------------------------------------------------------
describe('Every page.tsx exports a default component', () => {
  const appDir = join(ROOT, 'app');
  const pageFiles = collectFiles(appDir).filter((f) => f.endsWith('page.tsx') || f.endsWith('page.ts'));

  const DEFAULT_EXPORT_RE = /export\s+default\b/;

  it('has no page files missing a default export', () => {
    const violations = pageFiles.filter((file) => !DEFAULT_EXPORT_RE.test(readFileSync(file, 'utf8')));
    const paths = violations.map((f) => relative(ROOT, f));
    expect(violations, `Missing default export in:\n  ${paths.join('\n  ')}`).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rule 6: Admin-entered predictions must be super-admin-only and unlocked
//
// The admin workflow deliberately permits corrections after kickoff, but uses
// the service-role client. Keep the authorization guard inside the Server
// Action and do not accidentally share the participant kickoff lock.
// ---------------------------------------------------------------------------
describe('Admin prediction entry remains privileged and unlocked', () => {
  const actionsPath = join(ROOT, 'lib', 'predictions', 'actions.ts');
  const source = readFileSync(actionsPath, 'utf8');
  const adminAction = source.slice(source.indexOf('export async function adminSubmitPredictions'));

  it('requires a super admin inside the Server Action', () => {
    expect(adminAction).toContain('await requireSuperAdmin()');
  });

  it('does not apply the participant kickoff lock', () => {
    expect(adminAction).not.toContain('isKickoffLocked(');
  });
});
