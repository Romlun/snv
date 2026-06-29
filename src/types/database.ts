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
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          org_id: string | null
          full_name: string | null
          email: string
          role: 'Admin' | 'Director' | 'Donor Relations' | 'Church Relations' | 'Staff'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id?: string | null
          full_name?: string | null
          email: string
          role?: 'Admin' | 'Director' | 'Donor Relations' | 'Church Relations' | 'Staff'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          full_name?: string | null
          email?: string
          role?: 'Admin' | 'Director' | 'Donor Relations' | 'Church Relations' | 'Staff'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      donors: {
        Row: {
          id: string
          org_id: string
          church_id: string | null
          name: string
          email: string | null
          phone: string | null
          relationship_status: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          stage: 'New contact' | 'First conversation' | 'Interested' | 'Active donor' | 'Monthly supporter' | 'Major donor' | 'Needs re-engagement' | 'Inactive'
          assigned_staff_id: string | null
          last_contact_date: string | null
          next_follow_up_date: string | null
          interests: string[] | null
          preferred_contact_method: string | null
          tags: string[] | null
          engagement_score: number
          notes: string | null
          lifetime_giving: number
          years_supported: number
          is_recurring: boolean
          recurring_amount: number | null
          recurring_cadence: string | null
          card_expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          church_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          relationship_status?: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          stage?: 'New contact' | 'First conversation' | 'Interested' | 'Active donor' | 'Monthly supporter' | 'Major donor' | 'Needs re-engagement' | 'Inactive'
          assigned_staff_id?: string | null
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          interests?: string[] | null
          preferred_contact_method?: string | null
          tags?: string[] | null
          engagement_score?: number
          notes?: string | null
          lifetime_giving?: number
          years_supported?: number
          is_recurring?: boolean
          recurring_amount?: number | null
          recurring_cadence?: string | null
          card_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          church_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          relationship_status?: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          stage?: 'New contact' | 'First conversation' | 'Interested' | 'Active donor' | 'Monthly supporter' | 'Major donor' | 'Needs re-engagement' | 'Inactive'
          assigned_staff_id?: string | null
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          interests?: string[] | null
          preferred_contact_method?: string | null
          tags?: string[] | null
          engagement_score?: number
          notes?: string | null
          lifetime_giving?: number
          years_supported?: number
          is_recurring?: boolean
          recurring_amount?: number | null
          recurring_cadence?: string | null
          card_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      churches: {
        Row: {
          id: string
          org_id: string
          name: string
          pastor: string | null
          address: string | null
          phone: string | null
          email: string | null
          denomination: string | null
          relationship_status: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          engagement_score: number
          assigned_staff_id: string | null
          next_visit_date: string | null
          total_giving: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          pastor?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          denomination?: string | null
          relationship_status?: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          engagement_score?: number
          assigned_staff_id?: string | null
          next_visit_date?: string | null
          total_giving?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          pastor?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          denomination?: string | null
          relationship_status?: 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive'
          engagement_score?: number
          assigned_staff_id?: string | null
          next_visit_date?: string | null
          total_giving?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_logs: {
        Row: {
          id: string
          org_id: string
          donor_id: string | null
          church_id: string | null
          staff_id: string | null
          contact_date: string
          type: 'call' | 'email' | 'text' | 'meeting' | 'church visit' | 'event'
          notes: string | null
          outcome: string | null
          next_step: string | null
          next_follow_up_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          donor_id?: string | null
          church_id?: string | null
          staff_id?: string | null
          contact_date?: string
          type: 'call' | 'email' | 'text' | 'meeting' | 'church visit' | 'event'
          notes?: string | null
          outcome?: string | null
          next_step?: string | null
          next_follow_up_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          donor_id?: string | null
          church_id?: string | null
          staff_id?: string | null
          contact_date?: string
          type?: 'call' | 'email' | 'text' | 'meeting' | 'church visit' | 'event'
          notes?: string | null
          outcome?: string | null
          next_step?: string | null
          next_follow_up_date?: string | null
          created_at?: string
        }
      }
    }
  }
}
