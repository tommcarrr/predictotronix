import { execFileSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const supabaseCli = './node_modules/supabase/dist/supabase.js';
const nextCli = './node_modules/next/dist/bin/next';

function supabase(args, capture = false) {
  return execFileSync(process.execPath, [supabaseCli, ...args], {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
}

function status() {
  try {
    return JSON.parse(supabase(['status', '-o', 'json'], true));
  } catch {
    return null;
  }
}

let local = status();

if (!local?.API_URL) {
  supabase([
    'start',
    '--exclude',
    'studio,imgproxy,logflare,vector,supavisor,edge-runtime',
  ], true);
  local = status();
}

if (!local?.API_URL || !local.ANON_KEY || !local.SERVICE_ROLE_KEY) {
  throw new Error('Local Supabase did not report the URL and keys required by the app.');
}

writeFileSync(
  '.env.local',
  [
    `NEXT_PUBLIC_SUPABASE_URL=${local.API_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${local.ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${local.SERVICE_ROLE_KEY}`,
    'NEXT_PUBLIC_APP_URL=http://localhost:3000',
    'CRON_SECRET=local-development-secret',
    '',
  ].join('\n'),
  { mode: 0o600 },
);

const next = spawn(process.execPath, [nextCli, 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => next.kill(signal));
}

next.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

