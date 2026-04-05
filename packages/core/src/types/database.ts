// Typed database schema for Supabase.
// Run `supabase gen types typescript` to regenerate after schema changes.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: 'owner' | 'member'
          invited_email: string | null
          accepted_at: string | null
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: 'owner' | 'member'
          invited_email?: string | null
          accepted_at?: string | null
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          invited_email?: string | null
          accepted_at?: string | null
        }
        Relationships: []
      }
      areas: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string
          name: string
          color: string | null
          icon: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id: string
          name: string
          color?: string | null
          icon?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string
          name?: string
          color?: string | null
          icon?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string
          area_id: string | null
          name: string
          description: string | null
          color: string | null
          icon: string | null
          status: 'active' | 'completed' | 'archived' | 'someday'
          due_date: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id: string
          area_id?: string | null
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          status?: 'active' | 'completed' | 'archived' | 'someday'
          due_date?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string
          area_id?: string | null
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          status?: 'active' | 'completed' | 'archived' | 'someday'
          due_date?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      task_sections: {
        Row: {
          id: string
          project_id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string
          project_id: string | null
          section_id: string | null
          parent_task_id: string | null
          assignee_id: string | null
          created_by: string
          blocked_by_task_id: string | null
          title: string
          notes: string | null
          status: 'open' | 'completed' | 'cancelled' | 'someday'
          priority: number
          due_date: string | null
          start_date: string | null
          reminder_at: string | null
          sort_order: number
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id: string
          project_id?: string | null
          section_id?: string | null
          parent_task_id?: string | null
          assignee_id?: string | null
          created_by: string
          blocked_by_task_id?: string | null
          title: string
          notes?: string | null
          status?: 'open' | 'completed' | 'cancelled' | 'someday'
          priority?: number
          due_date?: string | null
          start_date?: string | null
          reminder_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string
          project_id?: string | null
          section_id?: string | null
          parent_task_id?: string | null
          assignee_id?: string | null
          created_by?: string
          blocked_by_task_id?: string | null
          title?: string
          notes?: string | null
          status?: 'open' | 'completed' | 'cancelled' | 'someday'
          priority?: number
          due_date?: string | null
          start_date?: string | null
          reminder_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string
          name: string
          color: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id: string
          name: string
          color?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string
          name?: string
          color?: string | null
        }
        Relationships: []
      }
      task_tags: {
        Row: { task_id: string; tag_id: string }
        Insert: { task_id: string; tag_id: string }
        Update: { task_id?: string; tag_id?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
