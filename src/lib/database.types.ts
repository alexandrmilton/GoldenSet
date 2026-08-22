// Generated from the Supabase schema. Do not edit by hand.
//
// Regenerate after every migration:
//   supabase login            (once)
//   npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      onboarding_answers: {
        Row: {
          answer_key: string
          answer_value: string
          created_at: string
          profile_id: string
          score: number
          step: number
        }
        Insert: {
          answer_key: string
          answer_value: string
          created_at?: string
          profile_id: string
          score?: number
          step: number
        }
        Update: {
          answer_key?: string
          answer_value?: string
          created_at?: string
          profile_id?: string
          score?: number
          step?: number
        }
        Relationships: []
      }
      onboarding_options: {
        Row: {
          answer_key: string
          answer_value: string
          question_order: number
          score: number
          sort_order: number
          step: number
        }
        Insert: {
          answer_key: string
          answer_value: string
          question_order?: number
          score: number
          sort_order?: number
          step: number
        }
        Update: {
          answer_key?: string
          answer_value?: string
          question_order?: number
          score?: number
          sort_order?: number
          step?: number
        }
        Relationships: []
      }
      equipment_catalog: {
        Row: {
          brand: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["equipment_kind"]
          model: string
          specs: Json
          year: number | null
        }
        Insert: {
          brand: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["equipment_kind"]
          model: string
          specs?: Json
          year?: number | null
        }
        Update: {
          brand?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["equipment_kind"]
          model?: string
          specs?: Json
          year?: number | null
        }
        Relationships: []
      }
      user_equipment: {
        Row: {
          catalog_id: string | null
          created_at: string
          custom_name: string | null
          grip_size: string | null
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["equipment_kind"]
          profile_id: string
          retired_at: string | null
          since: string | null
          string_model: string | null
          tension_kg: number | null
          weight_g: number | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string
          custom_name?: string | null
          grip_size?: string | null
          id?: string
          is_primary?: boolean
          kind: Database["public"]["Enums"]["equipment_kind"]
          profile_id: string
          retired_at?: string | null
          since?: string | null
          string_model?: string | null
          tension_kg?: number | null
          weight_g?: number | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string
          custom_name?: string | null
          grip_size?: string | null
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["equipment_kind"]
          profile_id?: string
          retired_at?: string | null
          since?: string | null
          string_model?: string | null
          tension_kg?: number | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "equipment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipment_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          balls_catalog_id: string | null
          balls_mode: Database["public"]["Enums"]["balls_mode"]
          court_id: string | null
          court_note: string | null
          created_at: string
          created_by: string
          duration_min: number
          forecast: Json | null
          format: Database["public"]["Enums"]["game_format"]
          id: string
          kind: Database["public"]["Enums"]["game_kind"]
          match_id: string | null
          message: string | null
          opponent_id: string
          responded_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["game_status"]
        }
        Insert: {
          balls_catalog_id?: string | null
          balls_mode?: Database["public"]["Enums"]["balls_mode"]
          court_id?: string | null
          court_note?: string | null
          created_at?: string
          created_by: string
          duration_min?: number
          forecast?: Json | null
          format?: Database["public"]["Enums"]["game_format"]
          id?: string
          kind?: Database["public"]["Enums"]["game_kind"]
          match_id?: string | null
          message?: string | null
          opponent_id: string
          responded_at?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["game_status"]
        }
        Update: {
          responded_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          match_id?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          court_id: string | null
          created_at: string
          format: Database["public"]["Enums"]["game_format"]
          id: string
          kind: Database["public"]["Enums"]["game_kind"]
          played_at: string
          rated_at: string | null
          reported_by: string
          source: Database["public"]["Enums"]["match_source"]
          status: Database["public"]["Enums"]["match_status"]
          winner_id: string | null
        }
        Insert: { id?: string; played_at?: string; reported_by: string }
        Update: { status?: Database["public"]["Enums"]["match_status"] }
        Relationships: []
      }
      match_players: {
        Row: { is_winner: boolean | null; match_id: string; profile_id: string; side: string }
        Insert: { match_id: string; profile_id: string; side: string; is_winner?: boolean | null }
        Update: { is_winner?: boolean | null }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sets: {
        Row: {
          games_a: number
          games_b: number
          match_id: string
          set_no: number
          tb_a: number | null
          tb_b: number | null
        }
        Insert: { games_a: number; games_b: number; match_id: string; set_no: number }
        Update: { games_a?: number; games_b?: number }
        Relationships: [
          {
            foreignKeyName: "match_sets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_confirms: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["confirm_decision"]
          match_id: string
          note: string | null
          profile_id: string
        }
        Insert: {
          decision: Database["public"]["Enums"]["confirm_decision"]
          match_id: string
          note?: string | null
          profile_id: string
        }
        Update: {
          decision?: Database["public"]["Enums"]["confirm_decision"]
          note?: string | null
        }
        Relationships: []
      }
      rating_events: {
        Row: {
          actual_share: number | null
          created_at: string
          delta: number
          expected_share: number | null
          id: string
          k_factor: number | null
          kind: Database["public"]["Enums"]["rating_event_kind"]
          match_id: string | null
          points_after: number
          points_before: number
          profile_id: string
          weight: number | null
        }
        Insert: { profile_id: string; points_before: number; points_after: number; delta: number }
        Update: { delta?: number }
        Relationships: []
      }
      match_equipment: {
        Row: { match_id: string; profile_id: string; equipment_id: string }
        Insert: { match_id: string; profile_id: string; equipment_id: string }
        Update: { equipment_id?: string }
        Relationships: []
      }
      threads: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          ref_id: string | null
          title: string | null
          created_at: string
        }
        Insert: { kind: Database["public"]["Enums"]["thread_kind"]; ref_id?: string | null }
        Update: { title?: string | null }
        Relationships: []
      }
      thread_members: {
        Row: {
          thread_id: string
          profile_id: string
          is_moderator: boolean
          last_read_at: string
          muted: boolean
          joined_at: string
        }
        Insert: { thread_id: string; profile_id: string }
        Update: { last_read_at?: string; muted?: boolean }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          body: string
          attachment_url: string | null
          reply_to: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: { thread_id: string; author_id: string; body: string; reply_to?: string | null }
        Update: { deleted_at?: string | null; deleted_by?: string | null; body?: string }
        Relationships: []
      }
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string }
        Insert: { blocker_id: string; blocked_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          target_id: string
          reason: string
          status: Database["public"]["Enums"]["report_status"]
          handled_by: string | null
          handled_at: string | null
          created_at: string
        }
        Insert: {
          reporter_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          target_id: string
          reason: string
        }
        Update: { status?: Database["public"]["Enums"]["report_status"] }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          district: string | null
          external_rating_kind: Database["public"]["Enums"]["external_rating_kind"] | null
          external_rating_value: number | null
          external_verified_at: string | null
          full_name: string | null
          gender: string | null
          hand: Database["public"]["Enums"]["playing_hand"] | null
          id: string
          is_coach: boolean
          level: number | null
          matches_played: number
          points: number
          rating_status: Database["public"]["Enums"]["rating_status"]
          region: string | null
          reliability: number
          seed_at: string | null
          seed_level: number | null
          seed_method: Database["public"]["Enums"]["seed_method"] | null
          seed_points: number | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          external_rating_kind?: Database["public"]["Enums"]["external_rating_kind"] | null
          external_rating_value?: number | null
          external_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          hand?: Database["public"]["Enums"]["playing_hand"] | null
          id: string
          is_coach?: boolean
          level?: number | null
          matches_played?: number
          points?: number
          rating_status?: Database["public"]["Enums"]["rating_status"]
          region?: string | null
          reliability?: number
          seed_at?: string | null
          seed_level?: number | null
          seed_method?: Database["public"]["Enums"]["seed_method"] | null
          seed_points?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          external_rating_kind?: Database["public"]["Enums"]["external_rating_kind"] | null
          external_rating_value?: number | null
          external_verified_at?: string | null
          full_name?: string | null
          gender?: string | null
          hand?: Database["public"]["Enums"]["playing_hand"] | null
          id?: string
          is_coach?: boolean
          level?: number | null
          matches_played?: number
          points?: number
          rating_status?: Database["public"]["Enums"]["rating_status"]
          region?: string | null
          reliability?: number
          seed_at?: string | null
          seed_level?: number | null
          seed_method?: Database["public"]["Enums"]["seed_method"] | null
          seed_points?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      apply_onboarding: {
        Args: { anchor_id?: string; anchor_outcome?: string; answers: Json }
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      forecast_game: {
        Args: { p_opponent: string; p_kind?: Database["public"]["Enums"]["game_kind"] }
        Returns: {
          scenario: string
          share: number
          delta_self: number
          delta_opponent: number
        }[]
      }
      report_match: {
        Args: {
          p_opponent: string
          p_sets: Json
          p_kind?: Database["public"]["Enums"]["game_kind"]
          p_format?: Database["public"]["Enums"]["game_format"]
          p_court_id?: string | null
          p_played_at?: string
          p_game_id?: string | null
        }
        Returns: Database["public"]["Tables"]["matches"]["Row"]
      }
      home_summary: {
        Args: Record<string, never>
        Returns: {
          points: number
          level: number | null
          rating_status: Database["public"]["Enums"]["rating_status"]
          reliability: number
          delta_week: number
          city_rank: number | null
          city_total: number | null
        }[]
      }
      rating_movers: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          profile_id: string
          username: string
          avatar_url: string | null
          city: string | null
          level: number | null
          points: number
          gained: number
        }[]
      }
      recent_matches: {
        Args: { p_limit?: number }
        Returns: {
          match_id: string
          played_at: string
          kind: Database["public"]["Enums"]["game_kind"]
          winner_id: string
          winner_name: string
          loser_id: string
          loser_name: string
          score: string | null
          winner_delta: number | null
        }[]
      }
      player_stats: {
        Args: { p_profile: string }
        Returns: {
          matches: number
          wins: number
          losses: number
          win_pct: number
          rated_matches: number
          friendly_matches: number
          current_streak: number
          best_win_name: string | null
          best_win_points: number | null
        }[]
      }
      rating_series: {
        Args: { p_profile: string }
        Returns: { at: string; points: number; is_seed: boolean }[]
      }
      match_history: {
        Args: { p_profile: string; p_limit?: number }
        Returns: {
          match_id: string
          played_at: string
          kind: Database["public"]["Enums"]["game_kind"]
          won: boolean | null
          opponent_id: string
          opponent_name: string
          score: string | null
          delta: number | null
          racquet_label: string | null
          court_name: string | null
          surface: string | null
        }[]
      }
      head_to_head: {
        Args: { p_profile: string; p_opponent: string }
        Returns: { played: number; won: number; lost: number }[]
      }
      racquet_stats: {
        Args: { p_profile: string }
        Returns: {
          equipment_id: string
          label: string | null
          matches: number
          wins: number
          win_pct: number
          avg_delta: number
        }[]
      }
      direct_thread: { Args: { p_other: string }; Returns: string }
      unread_threads: {
        Args: Record<string, never>
        Returns: { thread_id: string; unread: number }[]
      }
      points_to_level: { Args: { p: number }; Returns: number }
      player_cities: {
        Args: Record<string, never>
        Returns: { city: string; players: number }[]
      }
      search_players: {
        Args: {
          p_search?: string | null
          p_city?: string | null
          p_level_min?: number | null
          p_level_max?: number | null
          p_age_min?: number | null
          p_age_max?: number | null
          p_gender?: string | null
          p_hand?: Database["public"]["Enums"]["playing_hand"] | null
          p_statuses?: Database["public"]["Enums"]["rating_status"][] | null
          p_balls_id?: string | null
          p_court_id?: string | null
          p_weekday?: number | null
          p_sort?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          city: string | null
          district: string | null
          birth_year: number | null
          gender: string | null
          hand: Database["public"]["Enums"]["playing_hand"] | null
          points: number
          level: number | null
          rating_status: Database["public"]["Enums"]["rating_status"]
          reliability: number
          matches_played: number
          last_active_at: string
          balls_label: string | null
          racquet_label: string | null
        }[]
      }
    }
    Enums: {
      balls_mode: "mine" | "yours" | "agreed" | "catalog"
      confirm_decision: "confirmed" | "disputed"
      equipment_kind: "racquet" | "string" | "balls" | "shoes"
      external_rating_kind: "ntrp" | "utr" | "wtn"
      game_format: "best_of_3" | "pro_set_9" | "single_set" | "best_of_5"
      game_kind: "rated" | "friendly"
      game_status: "invited" | "accepted" | "declined" | "cancelled" | "expired" | "played"
      match_source: "casual" | "league" | "tournament"
      match_status: "pending" | "confirmed" | "disputed" | "void"
      playing_hand: "right" | "left"
      report_status: "open" | "actioned" | "dismissed"
      report_target: "message" | "profile" | "match"
      thread_kind: "direct" | "match" | "tournament" | "club" | "global"
      rating_event_kind: "match" | "tournament" | "recalculation" | "decay"
      rating_status: "seed" | "provisional" | "established" | "confirmed" | "dormant"
      seed_method: "questionnaire" | "anchor" | "external_rating" | "coach"
    }
    CompositeTypes: Record<never, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
export type OnboardingOption = Database["public"]["Tables"]["onboarding_options"]["Row"]
export type CatalogItem = Database["public"]["Tables"]["equipment_catalog"]["Row"]
export type UserEquipment = Database["public"]["Tables"]["user_equipment"]["Row"]
export type EquipmentKind = Database["public"]["Enums"]["equipment_kind"]
export type RatingStatus = Database["public"]["Enums"]["rating_status"]
export type SeedMethod = Database["public"]["Enums"]["seed_method"]
export type PlayingHand = Database["public"]["Enums"]["playing_hand"]
export type PlayerSearchResult = Database["public"]["Functions"]["search_players"]["Returns"][number]
export type PlayerFilters = Database["public"]["Functions"]["search_players"]["Args"]
export type Game = Database["public"]["Tables"]["games"]["Row"]
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type MatchSet = Database["public"]["Tables"]["match_sets"]["Row"]
export type RatingEvent = Database["public"]["Tables"]["rating_events"]["Row"]
export type GameKind = Database["public"]["Enums"]["game_kind"]
export type GameFormat = Database["public"]["Enums"]["game_format"]
export type GameStatus = Database["public"]["Enums"]["game_status"]
export type BallsMode = Database["public"]["Enums"]["balls_mode"]
export type ForecastRow = Database["public"]["Functions"]["forecast_game"]["Returns"][number]
export type HomeSummary = Database["public"]["Functions"]["home_summary"]["Returns"][number]
export type Mover = Database["public"]["Functions"]["rating_movers"]["Returns"][number]
export type FeedMatch = Database["public"]["Functions"]["recent_matches"]["Returns"][number]
export type PlayerStats = Database["public"]["Functions"]["player_stats"]["Returns"][number]
export type RatingPoint = Database["public"]["Functions"]["rating_series"]["Returns"][number]
export type HistoryRow = Database["public"]["Functions"]["match_history"]["Returns"][number]
export type RacquetStat = Database["public"]["Functions"]["racquet_stats"]["Returns"][number]
export type Thread = Database["public"]["Tables"]["threads"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type ThreadKind = Database["public"]["Enums"]["thread_kind"]
export type ReportTarget = Database["public"]["Enums"]["report_target"]
