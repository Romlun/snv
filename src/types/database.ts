export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budget_contributions: {
        Row: {
          amount: number
          budget_entry_id: string
          contribution_date: string
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
          org_id: string | null
        }
        Insert: {
          amount: number
          budget_entry_id: string
          contribution_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          org_id?: string | null
        }
        Update: {
          amount?: number
          budget_entry_id?: string
          contribution_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_contributions_budget_entry_id_fkey"
            columns: ["budget_entry_id"]
            isOneToOne: false
            referencedRelation: "budget_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_contributions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_contributions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_project_based: boolean | null
          name: string
          needed: number | null
          org_id: string | null
          project_id: string | null
          raised: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_project_based?: boolean | null
          name: string
          needed?: number | null
          org_id?: string | null
          project_id?: string | null
          raised?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_project_based?: boolean | null
          name?: string
          needed?: number | null
          org_id?: string | null
          project_id?: string | null
          raised?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string | null
          assigned_staff_id: string | null
          created_at: string | null
          denomination: string | null
          email: string | null
          engagement_score: number | null
          id: string
          name: string
          next_step: string | null
          next_visit_date: string | null
          notes: string | null
          org_id: string | null
          pastor: string | null
          phone: string | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          total_giving: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_staff_id?: string | null
          created_at?: string | null
          denomination?: string | null
          email?: string | null
          engagement_score?: number | null
          id?: string
          name: string
          next_step?: string | null
          next_visit_date?: string | null
          notes?: string | null
          org_id?: string | null
          pastor?: string | null
          phone?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          total_giving?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_staff_id?: string | null
          created_at?: string | null
          denomination?: string | null
          email?: string | null
          engagement_score?: number | null
          id?: string
          name?: string
          next_step?: string | null
          next_visit_date?: string | null
          notes?: string | null
          org_id?: string | null
          pastor?: string | null
          phone?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          total_giving?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churches_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_logs: {
        Row: {
          church_id: string | null
          contact_date: string | null
          created_at: string | null
          donor_id: string | null
          id: string
          language_school_id: string | null
          next_follow_up_date: string | null
          next_step: string | null
          notes: string | null
          org_id: string | null
          outcome: string | null
          staff_id: string | null
          type: Database["public"]["Enums"]["contact_type"]
        }
        Insert: {
          church_id?: string | null
          contact_date?: string | null
          created_at?: string | null
          donor_id?: string | null
          id?: string
          language_school_id?: string | null
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          outcome?: string | null
          staff_id?: string | null
          type: Database["public"]["Enums"]["contact_type"]
        }
        Update: {
          church_id?: string | null
          contact_date?: string | null
          created_at?: string | null
          donor_id?: string | null
          id?: string
          language_school_id?: string | null
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          outcome?: string | null
          staff_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_language_school_id_fkey"
            columns: ["language_school_id"]
            isOneToOne: false
            referencedRelation: "language_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: string | null
          assigned_staff_id: string | null
          birthday: string | null
          church_id: string | null
          created_at: string | null
          email: string | null
          engagement_score: number | null
          id: string
          interests: string[] | null
          is_recurring: boolean | null
          last_contact_date: string | null
          lifetime_giving: number | null
          name: string
          next_follow_up_date: string | null
          next_step: string | null
          notes: string | null
          org_id: string | null
          phone: string | null
          preferred_contact_method: string | null
          recurring_amount: number | null
          recurring_cadence: string | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          stage: Database["public"]["Enums"]["donor_stage"] | null
          tags: string[] | null
          updated_at: string | null
          years_supported: number | null
        }
        Insert: {
          address?: string | null
          assigned_staff_id?: string | null
          birthday?: string | null
          church_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_score?: number | null
          id?: string
          interests?: string[] | null
          is_recurring?: boolean | null
          last_contact_date?: string | null
          lifetime_giving?: number | null
          name: string
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          recurring_amount?: number | null
          recurring_cadence?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          stage?: Database["public"]["Enums"]["donor_stage"] | null
          tags?: string[] | null
          updated_at?: string | null
          years_supported?: number | null
        }
        Update: {
          address?: string | null
          assigned_staff_id?: string | null
          birthday?: string | null
          church_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_score?: number | null
          id?: string
          interests?: string[] | null
          is_recurring?: boolean | null
          last_contact_date?: string | null
          lifetime_giving?: number | null
          name?: string
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          recurring_amount?: number | null
          recurring_cadence?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          stage?: Database["public"]["Enums"]["donor_stage"] | null
          tags?: string[] | null
          updated_at?: string | null
          years_supported?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donors_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donors_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          amount: number
          cadence: string | null
          church_id: string | null
          created_at: string | null
          created_by: string | null
          donor_id: string | null
          external_source: string | null
          external_transaction_id: string | null
          gift_date: string
          id: string
          idempotency_key: string | null
          is_recurring: boolean | null
          method: string | null
          notes: string | null
          org_id: string | null
          project_id: string | null
        }
        Insert: {
          amount: number
          cadence?: string | null
          church_id?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id?: string | null
          external_source?: string | null
          external_transaction_id?: string | null
          gift_date?: string
          id?: string
          idempotency_key?: string | null
          is_recurring?: boolean | null
          method?: string | null
          notes?: string | null
          org_id?: string | null
          project_id?: string | null
        }
        Update: {
          amount?: number
          cadence?: string | null
          church_id?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id?: string | null
          external_source?: string | null
          external_transaction_id?: string | null
          gift_date?: string
          id?: string
          idempotency_key?: string | null
          is_recurring?: boolean | null
          method?: string | null
          notes?: string | null
          org_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      language_schools: {
        Row: {
          assigned_staff_id: string | null
          city: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contact_date: string | null
          name: string
          next_follow_up_date: string | null
          next_step: string | null
          notes: string | null
          org_id: string | null
          phone: string | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["language_school_status"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["language_school_status"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          next_follow_up_date?: string | null
          next_step?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["language_school_status"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "language_schools_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          follow_up_date: string | null
          id: string
          next_step: string | null
          org_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          follow_up_date?: string | null
          id?: string
          next_step?: string | null
          org_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          follow_up_date?: string | null
          id?: string
          next_step?: string | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string | null
          position: number
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id?: string | null
          position?: number
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string | null
          position?: number
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      project_staff: {
        Row: {
          project_id: string
          staff_id: string
        }
        Insert: {
          project_id: string
          staff_id: string
        }
        Update: {
          project_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_staff_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_needed: number | null
          created_at: string | null
          current_funding: number | null
          description: string | null
          end_date: string | null
          goal_description: string | null
          id: string
          name: string
          org_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget_needed?: number | null
          created_at?: string | null
          current_funding?: number | null
          description?: string | null
          end_date?: string | null
          goal_description?: string | null
          id?: string
          name: string
          org_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget_needed?: number | null
          created_at?: string | null
          current_funding?: number | null
          description?: string | null
          end_date?: string | null
          goal_description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_transactions: {
        Row: {
          amount: number | null
          church_id: string | null
          donor_id: string | null
          id: string
          notes: string | null
          org_id: string | null
          quantity: number
          resource_id: string | null
          staff_id: string | null
          transaction_date: string | null
          type: string
        }
        Insert: {
          amount?: number | null
          church_id?: string | null
          donor_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          quantity: number
          resource_id?: string | null
          staff_id?: string | null
          transaction_date?: string | null
          type: string
        }
        Update: {
          amount?: number | null
          church_id?: string | null
          donor_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          quantity?: number
          resource_id?: string | null
          staff_id?: string | null
          transaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_transactions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_transactions_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_transactions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          location: string | null
          org_id: string | null
          price: number | null
          quantity_available: number | null
          quantity_given: number | null
          quantity_sold: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          org_id?: string | null
          price?: number | null
          quantity_available?: number | null
          quantity_given?: number | null
          quantity_sold?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          org_id?: string | null
          price?: number | null
          quantity_available?: number | null
          quantity_given?: number | null
          quantity_sold?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          profile_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          profile_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          profile_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean
          org_id: string | null
          position: number
          task_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean
          org_id?: string | null
          position?: number
          task_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean
          org_id?: string | null
          position?: number
          task_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          created_from_planner: boolean
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          org_id: string | null
          phase_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          related_to_id: string | null
          related_to_type: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_from_planner?: boolean
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          org_id?: string | null
          phase_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          related_to_id?: string | null
          related_to_type?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_from_planner?: boolean
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          org_id?: string | null
          phase_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          related_to_id?: string | null
          related_to_type?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_church_engagement_score: {
        Args: { p_church_id: string }
        Returns: number
      }
      calculate_engagement_score: {
        Args: { p_donor_id: string }
        Returns: number
      }
      compute_church_engagement_score: {
        Args: {
          p_last_gift: string
          p_last_visit: string
          p_next_visit: string
        }
        Returns: number
      }
      compute_engagement_score: {
        Args: {
          p_is_recurring: boolean
          p_last_contact: string
          p_last_gift: string
          p_next_follow_up: string
        }
        Returns: number
      }
      current_user_org: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_church_engagement_score_breakdown: {
        Args: { p_church_id: string }
        Returns: Json
      }
      get_default_org_id: { Args: never; Returns: string }
      get_engagement_score_breakdown: {
        Args: { p_donor_id: string }
        Returns: Json
      }
    }
    Enums: {
      contact_type:
        | "call"
        | "email"
        | "text"
        | "meeting"
        | "church visit"
        | "event"
      donor_stage:
        | "New contact"
        | "First conversation"
        | "Interested"
        | "Active donor"
        | "Monthly supporter"
        | "Major donor"
        | "Needs re-engagement"
        | "Inactive"
      language_school_status:
        | "New"
        | "Contacted"
        | "No Answer"
        | "Interested"
        | "Follow-up"
        | "Connected"
        | "Declined"
      project_status:
        | "Idea"
        | "Planning"
        | "Active"
        | "Waiting"
        | "Completed"
        | "Cancelled"
      relationship_status:
        | "Engaged"
        | "Steady"
        | "Cooling"
        | "At risk"
        | "Inactive"
      task_priority: "Low" | "Medium" | "High"
      task_status:
        | "Not started"
        | "In progress"
        | "Waiting"
        | "Completed"
        | "Cancelled"
      user_role: "Admin" | "Staff" | "Volunteer"
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
      contact_type: [
        "call",
        "email",
        "text",
        "meeting",
        "church visit",
        "event",
      ],
      donor_stage: [
        "New contact",
        "First conversation",
        "Interested",
        "Active donor",
        "Monthly supporter",
        "Major donor",
        "Needs re-engagement",
        "Inactive",
      ],
      language_school_status: [
        "New",
        "Contacted",
        "No Answer",
        "Interested",
        "Follow-up",
        "Connected",
        "Declined",
      ],
      project_status: [
        "Idea",
        "Planning",
        "Active",
        "Waiting",
        "Completed",
        "Cancelled",
      ],
      relationship_status: [
        "Engaged",
        "Steady",
        "Cooling",
        "At risk",
        "Inactive",
      ],
      task_priority: ["Low", "Medium", "High"],
      task_status: [
        "Not started",
        "In progress",
        "Waiting",
        "Completed",
        "Cancelled",
      ],
      user_role: ["Admin", "Staff", "Volunteer"],
    },
  },
} as const
