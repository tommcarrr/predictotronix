export type { Database, Tables, Enums } from './database';

export type UserRole = 'super_admin' | 'league_admin' | 'participant';

export type SeasonType = 'production' | 'test' | 'demo';

export type SeasonStatus = 'setup' | 'active' | 'completed' | 'archived';

export type FixtureStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'abandoned';

export type GameweekStatus = 'upcoming' | 'in_progress' | 'completed';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type PredictionAuditAction =
  | 'created'
  | 'edited'
  | 'admin_created'
  | 'admin_edited';

export type PointsReason = 'exact' | 'correct_result' | 'incorrect';

export type NotificationChannel = 'email' | 'sms';

export type NotificationType = 'reminder' | 'results' | 'welcome';

export type NotificationStatus = 'sent' | 'failed' | 'suppressed' | 'dry_run';
