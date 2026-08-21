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
          score: number
          sort_order: number
          step: number
        }
        Insert: {
          answer_key: string
          answer_value: string
          score: number
          sort_order?: number
          step: number
        }
        Update: {
          answer_key?: string
          answer_value?: string
          score?: number
          sort_order?: number
          step?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balls_preference: string | null
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
          balls_preference?: string | null
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
          balls_preference?: string | null
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
      points_to_level: { Args: { p: number }; Returns: number }
    }
    Enums: {
      external_rating_kind: "ntrp" | "utr" | "wtn"
      playing_hand: "right" | "left"
      rating_status: "seed" | "provisional" | "established" | "confirmed" | "dormant"
      seed_method: "questionnaire" | "anchor" | "external_rating" | "coach"
    }
    CompositeTypes: Record<never, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
export type OnboardingOption = Database["public"]["Tables"]["onboarding_options"]["Row"]
export type RatingStatus = Database["public"]["Enums"]["rating_status"]
export type SeedMethod = Database["public"]["Enums"]["seed_method"]
export type PlayingHand = Database["public"]["Enums"]["playing_hand"]
