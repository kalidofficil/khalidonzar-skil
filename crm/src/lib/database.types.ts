// TypeScript description of the database, so queries are type-checked.
// Written by hand to match supabase/migrations. Once your Supabase project is
// linked you can regenerate this whole file with:  npm run db:types
// (Handy short names like `Company` live in src/lib/types.ts, not here.)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type E = Database["public"]["Enums"];

type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  emirate: E["emirate"] | null;
  city: string | null;
  website: string | null;
  instagram: string | null;
  source: E["company_source"] | null;
  status: E["company_status"];
  tags: string[];
  notes: string | null;
  owner_id: string | null;
  created_by: string | null;
  last_activity_at: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

type ContactRow = {
  id: string;
  company_id: string;
  full_name: string;
  job_title: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  preferred_language: E["language_code"];
  is_primary: boolean;
  notes: string | null;
  created_by: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
  billing: E["billing_type"];
  default_price_fils: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type DealRow = {
  id: string;
  company_id: string;
  primary_contact_id: string | null;
  title: string;
  value_fils: number;
  billing: E["billing_type"];
  term_months: number;
  stage: E["deal_stage"];
  probability: number | null;
  expected_close_date: string | null;
  next_follow_up_date: string | null;
  lost_reason: E["lost_reason"] | null;
  lost_note: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  last_activity_at: string | null;
  position: number;
  owner_id: string | null;
  created_by: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

type DealServiceRow = { deal_id: string; service_id: string };

type DealStageHistoryRow = {
  id: string;
  deal_id: string;
  from_stage: E["deal_stage"] | null;
  to_stage: E["deal_stage"];
  changed_at: string;
  changed_by: string | null;
};

type ActivityRow = {
  id: string;
  company_id: string;
  deal_id: string | null;
  contact_id: string | null;
  occurred_at: string;
  channel: E["activity_channel"];
  summary: string;
  outcome: string | null;
  next_step: string | null;
  next_step_date: string | null;
  created_by: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

type AttachmentRow = {
  id: string;
  company_id: string;
  deal_id: string | null;
  activity_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: E["app_role"] | null;
  created_at: string;
  updated_at: string;
};

/** Columns the database fills in itself, so inserts never need them. */
type Generated = "id" | "search_text" | "created_at" | "updated_at";

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Insert = required columns + everything else optional. */
type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required | "search_text">>;

type Setof<To extends string> = {
  from: "*";
  to: To;
  isOneToOne: false;
  isSetofReturn: true;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: { full_name?: string };
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: Insertable<CompanyRow, "name">;
        Update: Partial<Omit<CompanyRow, Generated>>;
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "companies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: ContactRow;
        Insert: Insertable<ContactRow, "company_id" | "full_name">;
        Update: Partial<Omit<ContactRow, Generated>>;
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: ServiceRow;
        Insert: Insertable<ServiceRow, "name">;
        Update: Partial<Omit<ServiceRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      deals: {
        Row: DealRow;
        Insert: Insertable<DealRow, "company_id" | "title">;
        Update: Partial<Omit<DealRow, Generated>>;
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey";
            columns: ["primary_contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_services: {
        Row: DealServiceRow;
        Insert: DealServiceRow;
        Update: Partial<DealServiceRow>;
        Relationships: [
          {
            foreignKeyName: "deal_services_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_stage_history: {
        Row: DealStageHistoryRow;
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_stage_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: ActivityRow;
        Insert: Insertable<ActivityRow, "company_id" | "channel" | "summary">;
        Update: Partial<Omit<ActivityRow, Generated>>;
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: AttachmentRow;
        Insert: Insertable<AttachmentRow, "company_id" | "storage_path" | "file_name">;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "attachments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      company_tags: {
        Row: { tag: string | null };
        Relationships: Rel[];
      };
    };
    Functions: {
      search_companies: {
        Args: { q?: string | null };
        Returns: CompanyRow[];
        SetofOptions: Setof<"companies">;
      };
      search_contacts: {
        Args: { q?: string | null };
        Returns: ContactRow[];
        SetofOptions: Setof<"contacts">;
      };
      search_deals: {
        Args: { q?: string | null };
        Returns: DealRow[];
        SetofOptions: Setof<"deals">;
      };
      search_activities: {
        Args: { q?: string | null };
        Returns: ActivityRow[];
        SetofOptions: Setof<"activities">;
      };
      default_stage_probability: {
        Args: { stage: E["deal_stage"] };
        Returns: number;
      };
    };
    Enums: {
      app_role: "owner" | "sales" | "delivery";
      company_source:
        | "network"
        | "linkedin"
        | "referral"
        | "instagram"
        | "event"
        | "freelance_platform"
        | "other";
      company_status: "lead" | "client" | "past_client" | "archived";
      emirate:
        | "dubai"
        | "abu_dhabi"
        | "sharjah"
        | "ajman"
        | "umm_al_quwain"
        | "ras_al_khaimah"
        | "fujairah"
        | "outside_uae";
      language_code: "en" | "ar" | "fr";
      deal_stage: "lead" | "contacted" | "discovery" | "proposal" | "negotiation" | "won" | "lost";
      lost_reason: "price" | "budget" | "timing" | "competitor" | "no_response" | "not_a_fit" | "other";
      billing_type: "one_off" | "monthly";
      activity_channel: "whatsapp" | "call" | "meeting" | "email" | "linkedin" | "instagram" | "other";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
