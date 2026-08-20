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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          city: string | null
          created_at: string
          full_name: string | null
          gender: string | null
          hand: Database["public"]["Enums"]["playing_hand"] | null
          id: string
          is_coach: boolean
          level_scale: Database["public"]["Enums"]["level_scale"]
          level_source: Database["public"]["Enums"]["level_source"]
          level_value: number | null
          matches_played: number
          points: number
          region: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          hand?: Database["public"]["Enums"]["playing_hand"] | null
          id: string
          is_coach?: boolean
          level_scale?: Database["public"]["Enums"]["level_scale"]
          level_source?: Database["public"]["Enums"]["level_source"]
          level_value?: number | null
          matches_played?: number
          points?: number
          region?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          hand?: Database["public"]["Enums"]["playing_hand"] | null
          id?: string
          is_coach?: boolean
          level_scale?: Database["public"]["Enums"]["level_scale"]
          level_source?: Database["public"]["Enums"]["level_source"]
          level_value?: number | null
          matches_played?: number
          points?: number
          region?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      level_scale: "ntrp" | "utr"
      level_source: "self" | "verified"
      playing_hand: "right" | "left"
    }
    CompositeTypes: Record<never, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
export type LevelScale = Database["public"]["Enums"]["level_scale"]
export type LevelSource = Database["public"]["Enums"]["level_source"]
export type PlayingHand = Database["public"]["Enums"]["playing_hand"]
