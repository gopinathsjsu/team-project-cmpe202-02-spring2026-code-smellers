export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      events: {
        Row: {
          approval_status:
            | Database["public"]["Enums"]["event_approval_status"]
            | null
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"] | null
          created_at: string
          description: string | null
          end_date_time: string | null
          id: number
          image_url: string | null
          location_id: number | null
          organizer_id: string
          rsvp_count: number | null
          start_date_time: string | null
          title: string
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["event_approval_status"]
            | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          id?: number
          image_url?: string | null
          location_id?: number | null
          organizer_id: string
          rsvp_count?: number | null
          start_date_time?: string | null
          title: string
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["event_approval_status"]
            | null
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          id?: number
          image_url?: string | null
          location_id?: number | null
          organizer_id?: string
          rsvp_count?: number | null
          start_date_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_location_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: number
          latitutde: number | null
          longitude: number | null
          type: Database["public"]["Enums"]["location_type"] | null
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          latitutde?: number | null
          longitude?: number | null
          type?: Database["public"]["Enums"]["location_type"] | null
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          latitutde?: number | null
          longitude?: number | null
          type?: Database["public"]["Enums"]["location_type"] | null
          venue_name?: string | null
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          customer_id: string | null
          event_id: number
          id: number
          is_email_sent: boolean | null
          rsvp_status: Database["public"]["Enums"]["ticket_rsvp_status"] | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          event_id: number
          id?: number
          is_email_sent?: boolean | null
          rsvp_status?: Database["public"]["Enums"]["ticket_rsvp_status"] | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          event_id?: number
          id?: number
          is_email_sent?: boolean | null
          rsvp_status?: Database["public"]["Enums"]["ticket_rsvp_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_approval_status: "pending" | "approved" | "rejected"
      event_category:
        | "music"
        | "nightlife"
        | "art"
        | "holidays"
        | "sports"
        | "hobbies"
        | "business"
        | "food"
        | "charity"
      location_type: "in-person" | "virtual"
      ticket_rsvp_status: "pending" | "confirmed" | "canceled" | "attended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_approval_status: ["pending", "approved", "rejected"],
      event_category: [
        "music",
        "nightlife",
        "art",
        "holidays",
        "sports",
        "hobbies",
        "business",
        "food",
        "charity",
      ],
      location_type: ["in-person", "virtual"],
      ticket_rsvp_status: ["pending", "confirmed", "canceled", "attended"],
    },
  },
} as const
