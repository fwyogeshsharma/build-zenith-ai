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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      certifications: {
        Row: {
          achieved_date: string | null
          certification_body: string | null
          created_at: string
          current_status: string | null
          documents: Json | null
          expected_date: string | null
          id: string
          progress_percentage: number | null
          project_id: string
          requirements: Json | null
          target_level: string | null
          type: Database["public"]["Enums"]["certification_type"]
          updated_at: string
        }
        Insert: {
          achieved_date?: string | null
          certification_body?: string | null
          created_at?: string
          current_status?: string | null
          documents?: Json | null
          expected_date?: string | null
          id?: string
          progress_percentage?: number | null
          project_id: string
          requirements?: Json | null
          target_level?: string | null
          type: Database["public"]["Enums"]["certification_type"]
          updated_at?: string
        }
        Update: {
          achieved_date?: string | null
          certification_body?: string | null
          created_at?: string
          current_status?: string | null
          documents?: Json | null
          expected_date?: string | null
          id?: string
          progress_percentage?: number | null
          project_id?: string
          requirements?: Json | null
          target_level?: string | null
          type?: Database["public"]["Enums"]["certification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_certifications_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          certification_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          phase: Database["public"]["Enums"]["project_phase"] | null
          project_id: string
          tags: string[] | null
          task_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          certification_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          phase?: Database["public"]["Enums"]["project_phase"] | null
          project_id: string
          tags?: string[] | null
          task_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          certification_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          phase?: Database["public"]["Enums"]["project_phase"] | null
          project_id?: string
          tags?: string[] | null
          task_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_documents_certification_id"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          project_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          actual_cost: number | null
          ai_recommendations: Json | null
          budget: number | null
          created_at: string
          end_date: string | null
          id: string
          phase: Database["public"]["Enums"]["project_phase"]
          progress_percentage: number | null
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          ai_recommendations?: Json | null
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          phase: Database["public"]["Enums"]["project_phase"]
          progress_percentage?: number | null
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          ai_recommendations?: Json | null
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["project_phase"]
          progress_percentage?: number | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_phases_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          id: string
          joined_at: string
          permissions: Json | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          ai_insights: Json | null
          budget: number | null
          created_at: string
          current_phase: Database["public"]["Enums"]["project_phase"]
          description: string | null
          expected_completion_date: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          owner_id: string
          progress_percentage: number | null
          project_type: Database["public"]["Enums"]["project_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          ai_insights?: Json | null
          budget?: number | null
          created_at?: string
          current_phase?: Database["public"]["Enums"]["project_phase"]
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          owner_id: string
          progress_percentage?: number | null
          project_type: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          ai_insights?: Json | null
          budget?: number | null
          created_at?: string
          current_phase?: Database["public"]["Enums"]["project_phase"]
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          progress_percentage?: number | null
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_generated: boolean | null
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          created_by: string
          dependencies: Json | null
          description: string | null
          due_date: string | null
          id: string
          phase: Database["public"]["Enums"]["project_phase"]
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          created_by: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase: Database["public"]["Enums"]["project_phase"]
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["project_phase"]
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_project_team_member: {
        Args: { project_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      certification_type:
        | "leed"
        | "igbc"
        | "breeam"
        | "iso"
        | "energy_star"
        | "well"
        | "other"
      project_phase:
        | "concept"
        | "design"
        | "pre_construction"
        | "execution"
        | "handover"
        | "operations_maintenance"
        | "renovation_demolition"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      project_type:
        | "new_construction"
        | "renovation_repair"
        | "interior_fitout"
        | "land_development"
        | "sustainable_green"
        | "affordable_housing"
        | "luxury"
        | "mixed_use"
        | "co_living_working"
        | "redevelopment"
      user_role:
        | "admin"
        | "project_manager"
        | "contractor"
        | "architect"
        | "engineer"
        | "client"
        | "inspector"
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
      certification_type: [
        "leed",
        "igbc",
        "breeam",
        "iso",
        "energy_star",
        "well",
        "other",
      ],
      project_phase: [
        "concept",
        "design",
        "pre_construction",
        "execution",
        "handover",
        "operations_maintenance",
        "renovation_demolition",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      project_type: [
        "new_construction",
        "renovation_repair",
        "interior_fitout",
        "land_development",
        "sustainable_green",
        "affordable_housing",
        "luxury",
        "mixed_use",
        "co_living_working",
        "redevelopment",
      ],
      user_role: [
        "admin",
        "project_manager",
        "contractor",
        "architect",
        "engineer",
        "client",
        "inspector",
      ],
    },
  },
} as const
