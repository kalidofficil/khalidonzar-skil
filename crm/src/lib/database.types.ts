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

type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  emirate: Database["public"]["Enums"]["emirate"] | null;
  city: string | null;
  website: string | null;
  instagram: string | null;
  source: Database["public"]["Enums"]["company_source"] | null;
  status: Database["public"]["Enums"]["company_status"];
  tags: string[];
  notes: string | null;
  owner_id: string | null;
  created_by: string | null;
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
  preferred_language: Database["public"]["Enums"]["language_code"];
  is_primary: boolean;
  notes: string | null;
  created_by: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Database["public"]["Enums"]["app_role"] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          full_name?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: Partial<Omit<CompanyRow, "name" | "search_text">> & { name: string };
        Update: Partial<Omit<CompanyRow, "search_text">>;
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
        Insert: Partial<Omit<ContactRow, "company_id" | "full_name" | "search_text">> & {
          company_id: string;
          full_name: string;
        };
        Update: Partial<Omit<ContactRow, "search_text">>;
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
    };
    Views: {
      company_tags: {
        Row: { tag: string | null };
        Relationships: [];
      };
    };
    Functions: {
      search_companies: {
        Args: { q?: string | null };
        Returns: CompanyRow[];
        SetofOptions: {
          from: "*";
          to: "companies";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_contacts: {
        Args: { q?: string | null };
        Returns: ContactRow[];
        SetofOptions: {
          from: "*";
          to: "contacts";
          isOneToOne: false;
          isSetofReturn: true;
        };
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
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
