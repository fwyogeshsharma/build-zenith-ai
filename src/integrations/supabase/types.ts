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
      activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          project_id: string | null
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requirements: {
        Row: {
          certificate_id: string
          completion_date: string | null
          created_at: string
          evidence_documents: Json | null
          id: string
          is_completed: boolean | null
          is_mandatory: boolean | null
          notes: string | null
          requirement_category: string | null
          requirement_text: string
          updated_at: string
        }
        Insert: {
          certificate_id: string
          completion_date?: string | null
          created_at?: string
          evidence_documents?: Json | null
          id?: string
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          notes?: string | null
          requirement_category?: string | null
          requirement_text: string
          updated_at?: string
        }
        Update: {
          certificate_id?: string
          completion_date?: string | null
          created_at?: string
          evidence_documents?: Json | null
          id?: string
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          notes?: string | null
          requirement_category?: string | null
          requirement_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requirements_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string
          default_requirements: Json | null
          default_tasks: Json | null
          description: string | null
          estimated_duration_weeks: number | null
          id: string
          lifecycle_phases: string[] | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_requirements?: Json | null
          default_tasks?: Json | null
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          lifecycle_phases?: string[] | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_requirements?: Json | null
          default_tasks?: Json | null
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          lifecycle_phases?: string[] | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_versions: {
        Row: {
          certification_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          version: string
        }
        Insert: {
          certification_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          version: string
        }
        Update: {
          certification_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          version?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          achieved_date: string | null
          certification_body: string | null
          created_at: string
          current_status:
            | Database["public"]["Enums"]["certification_status"]
            | null
          documents: Json | null
          expected_date: string | null
          id: string
          progress_percentage: number | null
          project_id: string
          requirements: Json | null
          target_level: string | null
          type: Database["public"]["Enums"]["certification_type"]
          updated_at: string
          version: string | null
        }
        Insert: {
          achieved_date?: string | null
          certification_body?: string | null
          created_at?: string
          current_status?:
            | Database["public"]["Enums"]["certification_status"]
            | null
          documents?: Json | null
          expected_date?: string | null
          id?: string
          progress_percentage?: number | null
          project_id: string
          requirements?: Json | null
          target_level?: string | null
          type: Database["public"]["Enums"]["certification_type"]
          updated_at?: string
          version?: string | null
        }
        Update: {
          achieved_date?: string | null
          certification_body?: string | null
          created_at?: string
          current_status?:
            | Database["public"]["Enums"]["certification_status"]
            | null
          documents?: Json | null
          expected_date?: string | null
          id?: string
          progress_percentage?: number | null
          project_id?: string
          requirements?: Json | null
          target_level?: string | null
          type?: Database["public"]["Enums"]["certification_type"]
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          carbon_emission_factor: number | null
          chemical_composition: Json | null
          cost_per_unit: number | null
          created_at: string
          created_by: string
          density: number | null
          description: string | null
          id: string
          is_public: boolean | null
          material_category: string | null
          name: string
          properties: Json | null
          supplier_info: Json | null
          unit: string
          updated_at: string
        }
        Insert: {
          carbon_emission_factor?: number | null
          chemical_composition?: Json | null
          cost_per_unit?: number | null
          created_at?: string
          created_by: string
          density?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          material_category?: string | null
          name: string
          properties?: Json | null
          supplier_info?: Json | null
          unit?: string
          updated_at?: string
        }
        Update: {
          carbon_emission_factor?: number | null
          chemical_composition?: Json | null
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string
          density?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          material_category?: string | null
          name?: string
          properties?: Json | null
          supplier_info?: Json | null
          unit?: string
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
      progress_entries: {
        Row: {
          actual_value: number | null
          created_at: string
          created_by: string
          entry_type: string
          evidence_documents: Json | null
          id: string
          notes: string | null
          phase: string
          progress_percentage: number
          project_id: string
          target_value: number | null
          task_id: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          created_by: string
          entry_type: string
          evidence_documents?: Json | null
          id?: string
          notes?: string | null
          phase: string
          progress_percentage: number
          project_id: string
          target_value?: number | null
          task_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          created_by?: string
          entry_type?: string
          evidence_documents?: Json | null
          id?: string
          notes?: string | null
          phase?: string
          progress_percentage?: number
          project_id?: string
          target_value?: number | null
          task_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_metrics: {
        Row: {
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          phase: string | null
          project_id: string
          recorded_date: string
          target_value: number | null
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          phase?: string | null
          project_id: string
          recorded_date?: string
          target_value?: number | null
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          phase?: string | null
          project_id?: string
          recorded_date?: string
          target_value?: number | null
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "project_phases_project_id_fkey"
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
          {
            foreignKeyName: "project_team_members_project_id_fkey"
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
      task_resources: {
        Row: {
          allocated_hours: number | null
          cost_per_unit: number | null
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          material_id: string | null
          notes: string | null
          quantity: number
          resource_name: string
          resource_type: string
          start_date: string | null
          task_id: string
          total_cost: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          allocated_hours?: number | null
          cost_per_unit?: number | null
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          material_id?: string | null
          notes?: string | null
          quantity?: number
          resource_name: string
          resource_type: string
          start_date?: string | null
          task_id: string
          total_cost?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          allocated_hours?: number | null
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          material_id?: string | null
          notes?: string | null
          quantity?: number
          resource_name?: string
          resource_type?: string
          start_date?: string | null
          task_id?: string
          total_cost?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_resources_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_resources_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          ai_generated: boolean | null
          assigned_to: string | null
          certificate_id: string | null
          completed_date: string | null
          created_at: string
          created_by: string
          dependencies: Json | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          last_progress_update: string | null
          phase: Database["public"]["Enums"]["project_phase"]
          priority: string
          progress_notes: string | null
          progress_percentage: number | null
          project_id: string
          required_skills: Json | null
          status: string
          task_permissions: Json | null
          team_members: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          ai_generated?: boolean | null
          assigned_to?: string | null
          certificate_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          last_progress_update?: string | null
          phase: Database["public"]["Enums"]["project_phase"]
          priority?: string
          progress_notes?: string | null
          progress_percentage?: number | null
          project_id: string
          required_skills?: Json | null
          status?: string
          task_permissions?: Json | null
          team_members?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          ai_generated?: boolean | null
          assigned_to?: string | null
          certificate_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          last_progress_update?: string | null
          phase?: Database["public"]["Enums"]["project_phase"]
          priority?: string
          progress_notes?: string | null
          progress_percentage?: number | null
          project_id?: string
          required_skills?: Json | null
          status?: string
          task_permissions?: Json | null
          team_members?: Json | null
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
          {
            foreignKeyName: "tasks_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
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
      log_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
          p_project_id?: string
          p_task_id?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      certification_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "achieved"
        | "expired"
      certification_type:
        | "leed"
        | "igbc"
        | "breeam"
        | "iso"
        | "energy_star"
        | "well"
        | "other"
        | "griha"
        | "lbc"
        | "iso_9001"
        | "iso_45001"
        | "ohsas"
        | "green_globes"
        | "edge"
        | "sites"
        | "fitwel"
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
      certification_status: [
        "planning",
        "in_progress",
        "on_hold",
        "achieved",
        "expired",
      ],
      certification_type: [
        "leed",
        "igbc",
        "breeam",
        "iso",
        "energy_star",
        "well",
        "other",
        "griha",
        "lbc",
        "iso_9001",
        "iso_45001",
        "ohsas",
        "green_globes",
        "edge",
        "sites",
        "fitwel",
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
