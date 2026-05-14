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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_log: {
        Row: {
          content: string | null
          created_at: string | null
          direction: string | null
          id: string
          message_type: string | null
          reasoning: string | null
          reply_received_at: string | null
          sent_at: string | null
          task_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          message_type?: string | null
          reasoning?: string | null
          reply_received_at?: string | null
          sent_at?: string | null
          task_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          message_type?: string | null
          reasoning?: string | null
          reply_received_at?: string | null
          sent_at?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          reports_to: string | null
          role: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          reports_to?: string | null
          role?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          reports_to?: string | null
          role?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          project_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          delete_after: string | null
          description: string | null
          id: string
          name: string
          status: string
          summary: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          delete_after?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          summary?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          delete_after?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_tokens: {
        Row: {
          action: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          owner_email: string | null
          task_id: string | null
          token: string | null
          used: boolean | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_email?: string | null
          task_id?: string | null
          token?: string | null
          used?: boolean | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_email?: string | null
          task_id?: string | null
          token?: string | null
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reply_tokens_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          block_reason: string | null
          cluster: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          deleted_at: string | null
          id: string
          owner_email: string
          owner_name: string
          priority: string
          project_id: string
          source_quote: string | null
          state: string
          task_text: string
        }
        Insert: {
          block_reason?: string | null
          cluster?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          owner_email: string
          owner_name: string
          priority?: string
          project_id: string
          source_quote?: string | null
          state?: string
          task_text: string
        }
        Update: {
          block_reason?: string | null
          cluster?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          owner_email?: string
          owner_name?: string
          priority?: string
          project_id?: string
          source_quote?: string | null
          state?: string
          task_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          org_context: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_context?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_context?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
