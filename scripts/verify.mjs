#!/usr/bin/env node
/**
 * Local mirror of the CI pipeline (.github/workflows/ci.yml).
 *
 * Runs the same gates Render's deploy depends on — the test suite and a full
 * production build — so a broken commit (syntax error, type error, failing
 * test, broken build) is caught locally before it is ever pushed.
 *
 * Usage: `npm run verify`
 *
 * Cross-platform (PowerShell + bash) — it shells out via Node rather than
 * relying on shell-specific env-var syntax. Assumes dependencies are already
 * installed; CI additionally runs `npm ci` from the lockfile.
 */
import { spawnSync } from 'node:child_process';

// Placeholder values matching CI: auth-gated pages are force-dynamic, so no
// real backend is contacted at build time. These only need to exist so the
// NEXT_PUBLIC_* inlining matches a production build. Real local values in
// .env take precedence and are left untouched.
const PLACEHOLDER_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
};

const env = { ...process.env };
for (const [key, value] of Object.entries(PLACEHOLDER_ENV)) {
  if (!env[key]) env[key] = value;
}

// Run each step as a single shell command string. shell:true lets the shell
// resolve `npm` (npm.cmd on Windows); passing one string rather than an args
// array sidesteps Node's DEP0190 warning.
const steps = [
  { name: 'Test', command: 'npm test' },
  { name: 'Build', command: 'npm run build' },
];

for (const step of steps) {
  console.log(`\n=== ${step.name}: ${step.command} ===\n`);
  const result = spawnSync(step.command, {
    stdio: 'inherit',
    env,
    shell: true,
  });
  if (result.error) {
    console.error(`\n✗ ${step.name} could not start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${step.name} failed (exit ${result.status}). Verification aborted.`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n✓ Verification passed — test suite and production build both succeeded.');
