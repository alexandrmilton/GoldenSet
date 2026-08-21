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
      equipment_kind: "racquet" | "string" | "balls" | "shoes"
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
export type CatalogItem = Database["public"]["Tables"]["equipment_catalog"]["Row"]
export type UserEquipment = Database["public"]["Tables"]["user_equipment"]["Row"]
export type EquipmentKind = Database["public"]["Enums"]["equipment_kind"]
export type RatingStatus = Database["public"]["Enums"]["rating_status"]
export type SeedMethod = Database["public"]["Enums"]["seed_method"]
export type PlayingHand = Database["public"]["Enums"]["playing_hand"]
export type PlayerSearchResult = Database["public"]["Functions"]["search_players"]["Returns"][number]
export type PlayerFilters = Database["public"]["Functions"]["search_players"]["Args"]
