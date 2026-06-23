// Handmatig geschreven database types voor Fase 2.
// Vervang dit bestand later door de output van:
// supabase gen types typescript --project-id [project-id] > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          avatar_url: string | null
          email: string | null
          theme: 'dark' | 'light'
          language: string
          accent_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          avatar_url?: string | null
          email?: string | null
          theme?: 'dark' | 'light'
          language?: string
          accent_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: never[]
      }
      trading_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['trading_sessions']['Insert']>
        Relationships: never[]
      }
      emotions: {
        Row: {
          id: string
          user_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['emotions']['Insert']>
        Relationships: never[]
      }
      pitfalls: {
        Row: {
          id: string
          user_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pitfalls']['Insert']>
        Relationships: never[]
      }
      screenshot_labels: {
        Row: {
          id: string
          user_id: string
          name: string
          context: 'trade' | 'backtest'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          context?: 'trade' | 'backtest'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['screenshot_labels']['Insert']>
        Relationships: never[]
      }
      custom_field_definitions: {
        Row: {
          id: string
          user_id: string
          name: string
          type:
            | 'text'
            | 'textarea'
            | 'number'
            | 'dropdown'
            | 'multiselect'
            | 'boolean'
            | 'date'
            | 'time'
            | 'rating'
          options: Json | null
          sort_order: number
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type:
            | 'text'
            | 'textarea'
            | 'number'
            | 'dropdown'
            | 'multiselect'
            | 'boolean'
            | 'date'
            | 'time'
            | 'rating'
          options?: Json | null
          sort_order?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['custom_field_definitions']['Insert']
        >
        Relationships: never[]
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          explanation: string | null
          setup_conditions: string | null
          entry_criteria: string | null
          exit_criteria: string | null
          trade_management_rules: string | null
          a_plus_criteria: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          explanation?: string | null
          setup_conditions?: string | null
          entry_criteria?: string | null
          exit_criteria?: string | null
          trade_management_rules?: string | null
          a_plus_criteria?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['strategies']['Insert']>
        Relationships: never[]
      }
      strategy_images: {
        Row: {
          id: string
          strategy_id: string
          storage_url: string
          label: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          strategy_id: string
          storage_url: string
          label?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['strategy_images']['Insert']>
        Relationships: never[]
      }
      trades: {
        Row: {
          id: string
          user_id: string
          date: string
          time: string | null
          session_id: string | null
          symbol: string
          strategy_id: string | null
          direction: 'long' | 'short'
          outcome: 'win' | 'loss' | 'breakeven'
          rr: number | null
          technical_analysis: string | null
          trade_management_notes: string | null
          emotion_id: string | null
          custom_field_values: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          time?: string | null
          session_id?: string | null
          symbol: string
          strategy_id?: string | null
          direction: 'long' | 'short'
          outcome: 'win' | 'loss' | 'breakeven'
          rr?: number | null
          technical_analysis?: string | null
          trade_management_notes?: string | null
          emotion_id?: string | null
          custom_field_values?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['trades']['Insert']>
        Relationships: never[]
      }
      trade_screenshots: {
        Row: {
          id: string
          trade_id: string
          storage_url: string
          label: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          storage_url: string
          label?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['trade_screenshots']['Insert']>
        Relationships: never[]
      }
      pre_market_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          session_id: string | null
          bias: string | null
          important_levels: string | null
          scenarios: string | null
          a_plus_criteria: string | null
          risk_plan: string | null
          mental_state: string | null
          focus_point: string | null
          avoid_today: string | null
          confidence_score: number | null
          stress_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          session_id?: string | null
          bias?: string | null
          important_levels?: string | null
          scenarios?: string | null
          a_plus_criteria?: string | null
          risk_plan?: string | null
          mental_state?: string | null
          focus_point?: string | null
          avoid_today?: string | null
          confidence_score?: number | null
          stress_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pre_market_entries']['Insert']>
        Relationships: never[]
      }
      post_market_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          day_start_feeling: string | null
          day_end_feeling: string | null
          followed_plan: 'yes' | 'partially' | 'no' | null
          what_went_well: string | null
          what_went_less_well: string | null
          mental_shifts: string | null
          pitfalls_present: Json
          take_forward: string | null
          free_reflection: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          day_start_feeling?: string | null
          day_end_feeling?: string | null
          followed_plan?: 'yes' | 'partially' | 'no' | null
          what_went_well?: string | null
          what_went_less_well?: string | null
          mental_shifts?: string | null
          pitfalls_present?: Json
          take_forward?: string | null
          free_reflection?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['post_market_entries']['Insert']>
        Relationships: never[]
      }
      daily_reviews: {
        Row: {
          id: string
          user_id: string
          date: string
          status: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content: Json | null
          approved_content: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          status?: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content?: Json | null
          approved_content?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['daily_reviews']['Insert']>
        Relationships: never[]
      }
      game_day_reviews: {
        Row: {
          id: string
          user_id: string
          date: string
          classification: 'A' | 'B' | 'C' | 'B→A' | 'A→B' | 'B→C' | null
          status: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content: Json | null
          approved_content: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          classification?: 'A' | 'B' | 'C' | 'B→A' | 'A→B' | 'B→C' | null
          status?: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content?: Json | null
          approved_content?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['game_day_reviews']['Insert']>
        Relationships: never[]
      }
      weekly_reflections: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          week_feelings: Json
          structural_good: string | null
          energy_cost: string | null
          recurring_pitfalls: Json
          proud_of: string | null
          improve_next_week: string | null
          free_reflection: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          week_feelings?: Json
          structural_good?: string | null
          energy_cost?: string | null
          recurring_pitfalls?: Json
          proud_of?: string | null
          improve_next_week?: string | null
          free_reflection?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['weekly_reflections']['Insert']>
        Relationships: never[]
      }
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          status: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content: Json | null
          approved_content: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          status?: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content?: Json | null
          approved_content?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['weekly_reviews']['Insert']>
        Relationships: never[]
      }
      monthly_reflections: {
        Row: {
          id: string
          user_id: string
          month_year: string
          month_feelings: Json
          visible_growth: string | null
          recurring_challenge: string | null
          lesson_learned: string | null
          improve_next_month: string | null
          personal_victory: string | null
          free_reflection: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          month_feelings?: Json
          visible_growth?: string | null
          recurring_challenge?: string | null
          lesson_learned?: string | null
          improve_next_month?: string | null
          personal_victory?: string | null
          free_reflection?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['monthly_reflections']['Insert']>
        Relationships: never[]
      }
      monthly_reviews: {
        Row: {
          id: string
          user_id: string
          month_year: string
          status: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content: Json | null
          approved_content: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          status?: 'generated' | 'draft' | 'approved' | 'stored'
          generated_content?: Json | null
          approved_content?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['monthly_reviews']['Insert']>
        Relationships: never[]
      }
      trader_identity: {
        Row: {
          id: string
          user_id: string
          a_game: Json
          b_game: Json
          c_game: Json
          mental_leaks: Json
          patterns: Json
          strengths: Json
          current_growth_phase: string | null
          week_focus: string | null
          last_updated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          a_game?: Json
          b_game?: Json
          c_game?: Json
          mental_leaks?: Json
          patterns?: Json
          strengths?: Json
          current_growth_phase?: string | null
          week_focus?: string | null
          last_updated_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['trader_identity']['Insert']>
        Relationships: never[]
      }
      identity_challenges: {
        Row: {
          id: string
          user_id: string
          description: string
          status: 'active' | 'resolved'
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          status?: 'active' | 'resolved'
          resolved_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['identity_challenges']['Insert']>
        Relationships: never[]
      }
      process_streaks: {
        Row: {
          id: string
          user_id: string
          streak_type: string
          current_count: number
          last_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_type: string
          current_count?: number
          last_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['process_streaks']['Insert']>
        Relationships: never[]
      }
      growth_timeline: {
        Row: {
          id: string
          user_id: string
          period_label: string
          focus_description: string | null
          status: 'active' | 'resolved'
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_label: string
          focus_description?: string | null
          status?: 'active' | 'resolved'
          resolved_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['growth_timeline']['Insert']>
        Relationships: never[]
      }
      backtests: {
        Row: {
          id: string
          user_id: string
          date: string
          symbol: string
          strategy_id: string | null
          hypothesis: string | null
          market_context: string | null
          setup_description: string | null
          entry_criteria: string | null
          exit_criteria: string | null
          rr: number | null
          what_worked: string | null
          what_didnt: string | null
          observations: string | null
          conclusion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          symbol: string
          strategy_id?: string | null
          hypothesis?: string | null
          market_context?: string | null
          setup_description?: string | null
          entry_criteria?: string | null
          exit_criteria?: string | null
          rr?: number | null
          what_worked?: string | null
          what_didnt?: string | null
          observations?: string | null
          conclusion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['backtests']['Insert']>
        Relationships: never[]
      }
      backtest_screenshots: {
        Row: {
          id: string
          backtest_id: string
          storage_url: string
          label: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          backtest_id: string
          storage_url: string
          label?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['backtest_screenshots']['Insert']>
        Relationships: never[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
