export const CRON_JOBS = [
  {
    id: 'sync-fixtures',
    label: 'Sync fixtures',
    description: 'Imports fixture dates, teams, and gameweeks from API-Football.',
    schedule: '0 6 * * *',
    scheduleLabel: 'Daily at 06:00 UTC',
    endpoint: '/api/cron/sync-fixtures',
  },
  {
    id: 'sync-results',
    label: 'Sync results',
    description: 'Imports completed scores and recalculates prediction points.',
    schedule: '*/15 * * * *',
    scheduleLabel: 'Every 15 minutes',
    endpoint: '/api/cron/sync-results',
  },
  {
    id: 'send-reminders',
    label: 'Send reminders',
    description: 'Sends due gameweek reminder emails and text messages.',
    schedule: '*/15 * * * *',
    scheduleLabel: 'Every 15 minutes',
    endpoint: '/api/cron/send-reminders',
  },
] as const;

export type CronJobName = (typeof CRON_JOBS)[number]['id'];

export function getCronJob(jobName: CronJobName) {
  return CRON_JOBS.find((job) => job.id === jobName)!;
}

