// Supabase database type definitions — matches our migration schema.
// When you have a local Supabase instance running, regenerate with:
//   npx supabase gen types typescript --local > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string;
          mobile: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          email: string;
          mobile?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          email?: string;
          mobile?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          display_name: string;
          user_id: string | null;
          email: string | null;
          mobile: string | null;
          is_offline: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          user_id?: string | null;
          email?: string | null;
          mobile?: string | null;
          is_offline?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          user_id?: string | null;
          email?: string | null;
          mobile?: string | null;
          is_offline?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          invite_code: string;
          invite_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          invite_code?: string;
          invite_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          invite_code?: string;
          invite_active?: boolean;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          api_football_league_id: number | null;
          api_football_season: number | null;
          season_type: 'production' | 'test' | 'demo';
          status: 'setup' | 'active' | 'completed' | 'archived';
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          api_football_league_id?: number | null;
          api_football_season?: number | null;
          season_type?: 'production' | 'test' | 'demo';
          status?: 'setup' | 'active' | 'completed' | 'archived';
          created_at?: string;
        };
        Update: {
          name?: string;
          api_football_league_id?: number | null;
          api_football_season?: number | null;
          season_type?: 'production' | 'test' | 'demo';
          status?: 'setup' | 'active' | 'completed' | 'archived';
        };
        Relationships: [
          {
            foreignKeyName: 'seasons_league_id_fkey';
            columns: ['league_id'];
            referencedRelation: 'leagues';
            referencedColumns: ['id'];
          },
        ];
      };
      season_runtime_settings: {
        Row: {
          season_id: string;
          simulated_now: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          season_id: string;
          simulated_now?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          simulated_now?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'season_runtime_settings_season_id_fkey';
            columns: ['season_id'];
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      season_participants: {
        Row: { id: string; season_id: string; participant_id: string; joined_at: string };
        Insert: { id?: string; season_id: string; participant_id: string; joined_at?: string };
        Update: { joined_at?: string };
        Relationships: [];
      };
      league_roles: {
        Row: {
          id: string;
          league_id: string | null;
          user_id: string;
          role: 'super_admin' | 'league_admin';
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          id?: string;
          league_id?: string | null;
          user_id: string;
          role: 'super_admin' | 'league_admin';
          granted_at?: string;
          granted_by?: string | null;
        };
        Update: { role?: 'super_admin' | 'league_admin' };
        Relationships: [];
      };
      league_breakout_scores: {
        Row: {
          league_id: string;
          participant_id: string;
          score: number;
          duration_ms: number | null;
          lives_lost: number | null;
          max_combo: number | null;
          finished: boolean | null;
          achieved_at: string;
          updated_at: string;
        };
        Insert: {
          league_id: string;
          participant_id: string;
          score: number;
          duration_ms?: number | null;
          lives_lost?: number | null;
          max_combo?: number | null;
          finished?: boolean | null;
          achieved_at?: string;
          updated_at?: string;
        };
        Update: {
          score?: number;
          duration_ms?: number | null;
          lives_lost?: number | null;
          max_combo?: number | null;
          finished?: boolean | null;
          achieved_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'league_breakout_scores_league_id_fkey';
            columns: ['league_id'];
            referencedRelation: 'leagues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'league_breakout_scores_participant_id_fkey';
            columns: ['participant_id'];
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
        ];
      };
      league_breakout_runs: {
        Row: {
          id: string;
          league_id: string;
          participant_id: string;
          started_at: string;
          expires_at: string;
          submitted_at: string | null;
          summary: Json | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          participant_id: string;
          started_at?: string;
          expires_at?: string;
          submitted_at?: string | null;
          summary?: Json | null;
        };
        Update: {
          expires_at?: string;
          submitted_at?: string | null;
          summary?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'league_breakout_runs_league_id_fkey';
            columns: ['league_id'];
            referencedRelation: 'leagues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'league_breakout_runs_participant_id_fkey';
            columns: ['participant_id'];
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
        ];
      };
      join_requests: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      gameweeks: {
        Row: {
          id: string;
          season_id: string;
          gameweek_number: number;
          label: string | null;
          api_football_round: string | null;
          status: 'upcoming' | 'in_progress' | 'completed';
          first_kickoff: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          gameweek_number: number;
          label?: string | null;
          api_football_round?: string | null;
          status?: 'upcoming' | 'in_progress' | 'completed';
          first_kickoff?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string | null;
          api_football_round?: string | null;
          status?: 'upcoming' | 'in_progress' | 'completed';
          first_kickoff?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fixtures: {
        Row: {
          id: string;
          season_id: string;
          gameweek_id: string | null;
          api_football_fixture_id: number | null;
          home_team_name: string;
          away_team_name: string;
          home_team_api_id: number | null;
          away_team_api_id: number | null;
          kickoff: string;
          status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'abandoned';
          home_score: number | null;
          away_score: number | null;
          result_confirmed: boolean;
          api_football_status: string | null;
          api_football_data: Json | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          gameweek_id?: string | null;
          api_football_fixture_id?: number | null;
          home_team_name: string;
          away_team_name: string;
          home_team_api_id?: number | null;
          away_team_api_id?: number | null;
          kickoff: string;
          status?: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'abandoned';
          home_score?: number | null;
          away_score?: number | null;
          result_confirmed?: boolean;
          api_football_status?: string | null;
          api_football_data?: Json | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          gameweek_id?: string | null;
          kickoff?: string;
          status?: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'abandoned';
          home_score?: number | null;
          away_score?: number | null;
          result_confirmed?: boolean;
          api_football_status?: string | null;
          api_football_data?: Json | null;
          last_synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          fixture_id: string;
          participant_id: string;
          season_id: string;
          home_score: number;
          away_score: number;
          entered_by: string | null;
          is_admin_entered: boolean;
          points_awarded: number | null;
          points_reason: 'exact' | 'correct_result' | 'incorrect' | null;
          scored_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fixture_id: string;
          participant_id: string;
          season_id: string;
          home_score: number;
          away_score: number;
          entered_by?: string | null;
          is_admin_entered?: boolean;
          points_awarded?: number | null;
          points_reason?: 'exact' | 'correct_result' | 'incorrect' | null;
          scored_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          home_score?: number;
          away_score?: number;
          entered_by?: string | null;
          is_admin_entered?: boolean;
          points_awarded?: number | null;
          points_reason?: 'exact' | 'correct_result' | 'incorrect' | null;
          scored_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      prediction_audit: {
        Row: {
          id: string;
          prediction_id: string;
          actor_id: string | null;
          action: 'created' | 'edited' | 'admin_created' | 'admin_edited';
          previous_home_score: number | null;
          previous_away_score: number | null;
          new_home_score: number;
          new_away_score: number;
          is_admin_action: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          prediction_id: string;
          actor_id?: string | null;
          action: 'created' | 'edited' | 'admin_created' | 'admin_edited';
          previous_home_score?: number | null;
          previous_away_score?: number | null;
          new_home_score: number;
          new_away_score: number;
          is_admin_action?: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          participant_id: string;
          email_enabled: boolean;
          sms_enabled: boolean;
          remind_when_complete: boolean;
          opted_out: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          remind_when_complete?: boolean;
          opted_out?: boolean;
          updated_at?: string;
        };
        Update: {
          email_enabled?: boolean;
          sms_enabled?: boolean;
          remind_when_complete?: boolean;
          opted_out?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          delivery_key: string | null;
          participant_id: string;
          season_id: string | null;
          gameweek_id: string | null;
          channel: 'email' | 'sms';
          notification_type: 'reminder' | 'results' | 'welcome' | 'test';
          status: 'processing' | 'sent' | 'failed' | 'suppressed' | 'dry_run';
          sent_at: string;
          error_message: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          delivery_key?: string | null;
          participant_id: string;
          season_id?: string | null;
          gameweek_id?: string | null;
          channel: 'email' | 'sms';
          notification_type: 'reminder' | 'results' | 'welcome' | 'test';
          status: 'processing' | 'sent' | 'failed' | 'suppressed' | 'dry_run';
          sent_at?: string;
          error_message?: string | null;
          metadata?: Json | null;
        };
        Update: {
          delivery_key?: string | null;
          status?: 'processing' | 'sent' | 'failed' | 'suppressed' | 'dry_run';
          sent_at?: string;
          error_message?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      cron_job_runs: {
        Row: {
          id: string;
          job_name: 'sync-fixtures' | 'sync-results' | 'send-reminders';
          status: 'running' | 'success' | 'error';
          started_at: string;
          finished_at: string | null;
          duration_ms: number | null;
          summary: Json;
          error_details: Json | null;
        };
        Insert: {
          id?: string;
          job_name: 'sync-fixtures' | 'sync-results' | 'send-reminders';
          status?: 'running' | 'success' | 'error';
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
          summary?: Json;
          error_details?: Json | null;
        };
        Update: {
          status?: 'running' | 'success' | 'error';
          finished_at?: string | null;
          duration_ms?: number | null;
          summary?: Json;
          error_details?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      score_predictions: { Args: { p_fixture_id: string }; Returns: number };
      recalculate_fixture_scores: { Args: { p_fixture_id: string }; Returns: number };
      check_kickoff_lock: { Args: { p_fixture_id: string }; Returns: boolean };
      get_season_time: { Args: { p_season_id: string }; Returns: string };
      get_season_leaderboard: {
        Args: { p_season_id: string };
        Returns: {
          position: number;
          participant_id: string;
          display_name: string;
          total_points: number;
          exact_count: number;
          predictions_submitted: number;
        }[];
      };
      get_gameweek_leaderboard: {
        Args: { p_gameweek_id: string };
        Returns: {
          position: number;
          participant_id: string;
          display_name: string;
          total_points: number;
          exact_count: number;
          predictions_submitted: number;
          fixtures_in_gameweek: number;
        }[];
      };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      is_league_admin: { Args: { p_league_id: string }; Returns: boolean };
      is_league_breakout_member: { Args: { p_league_id: string }; Returns: boolean };
      get_participant_id: { Args: Record<string, never>; Returns: string };
      is_season_participant: { Args: { p_season_id: string }; Returns: boolean };
      get_breakout_leaderboard: {
        Args: { p_league_id: string };
        Returns: {
          rank_position: number;
          participant_id: string;
          display_name: string;
          score: number;
          achieved_at: string;
        }[];
      };
      start_breakout_run: {
        Args: { p_league_id: string };
        Returns: string;
      };
      submit_breakout_run: {
        Args: {
          p_run_id: string;
          p_league_id: string;
          p_hits_by_level: number[];
          p_combo_awards: number;
          p_lives_lost: number;
          p_max_combo: number;
          p_duration_ms: number;
          p_finished: boolean;
        };
        Returns: {
          rank_position: number;
          participant_id: string;
          display_name: string;
          score: number;
          achieved_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
