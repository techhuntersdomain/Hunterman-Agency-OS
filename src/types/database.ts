export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          industry: string | null;
          location: string | null;
          status: LeadStatus;
          source: string | null;
          notes: string | null;
          score: number | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        // Only `business_name` is required; everything else is nullable or
        // has a DB default (id, status, created_at, updated_at).
        Insert: {
          id?: string;
          business_name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          industry?: string | null;
          location?: string | null;
          status?: LeadStatus;
          source?: string | null;
          notes?: string | null;
          score?: number | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          status: "active" | "inactive" | "development";
          config: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["modules"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["modules"]["Insert"]>;
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          module_id: string;
          lead_id: string | null;
          name: string;
          status: WorkflowStatus;
          started_at: string;
          completed_at: string | null;
          metadata: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["workflows"]["Row"], "id" | "started_at">;
        Update: Partial<Database["public"]["Tables"]["workflows"]["Insert"]>;
        Relationships: [];
      };
      workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_name: string;
          step_order: number;
          status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
          agent_type: string | null;
          input: Json;
          output: Json;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["workflow_steps"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["workflow_steps"]["Insert"]>;
        Relationships: [];
      };
      business_research: {
        Row: {
          id: string;
          lead_id: string;
          current_website: string | null;
          has_website: boolean;
          google_rating: number | null;
          review_count: number | null;
          competitors: Json;
          market_notes: string | null;
          tech_stack: Json;
          /** Workflow run that produced this record (null for legacy/manual rows). */
          workflow_id: string | null;
          /** The business-researcher step within that workflow, where known. */
          workflow_step_id: string | null;
          researched_at: string;
        };
        // workflow_id / workflow_step_id are optional on insert — they're
        // nullable and only set when a research run is tracked by a workflow.
        Insert: Omit<
          Database["public"]["Tables"]["business_research"]["Row"],
          "id" | "researched_at" | "workflow_id" | "workflow_step_id"
        > & {
          workflow_id?: string | null;
          workflow_step_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["business_research"]["Insert"]>;
        Relationships: [];
      };
      demo_sites: {
        Row: {
          id: string;
          lead_id: string;
          workflow_id: string | null;
          url: string | null;
          template: string | null;
          status: "generating" | "ready" | "sent" | "viewed" | "expired";
          preview_image: string | null;
          generated_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["demo_sites"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["demo_sites"]["Insert"]>;
        Relationships: [];
      };
      outreach_messages: {
        Row: {
          id: string;
          lead_id: string;
          workflow_id: string | null;
          channel: "email" | "sms" | "linkedin" | "phone" | "other";
          subject: string | null;
          body: string;
          status: "draft" | "scheduled" | "sent" | "delivered" | "opened" | "replied" | "bounced";
          scheduled_for: string | null;
          sent_at: string | null;
          opened_at: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["outreach_messages"]["Insert"]>;
        Relationships: [];
      };
      production_projects: {
        Row: {
          id: string;
          lead_id: string;
          workflow_id: string | null;
          project_name: string;
          status: "proposal" | "accepted" | "in_progress" | "review" | "launched" | "cancelled";
          domain: string | null;
          hosting_provider: string | null;
          monthly_value: number | null;
          start_date: string | null;
          launch_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["production_projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["production_projects"]["Insert"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          details: Json;
          actor: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_status: LeadStatus;
      workflow_status: WorkflowStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type LeadStatus =
  | "new"
  | "researching"
  | "qualified"
  | "demo_ready"
  | "outreach"
  | "negotiating"
  | "won"
  | "lost"
  | "dormant";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
