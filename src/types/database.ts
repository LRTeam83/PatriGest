export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProtectedPersonStatus = "active" | "archived";
type MeasureType =
  | "safeguard_of_justice"
  | "simple_curatorship"
  | "reinforced_curatorship"
  | "guardianship"
  | "future_protection_mandate"
  | "family_authorization";
type ManagementPeriodStatus = "open" | "closed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; first_name: string | null; last_name: string | null; created_at: string; updated_at: string };
        Insert: { id: string; first_name?: string | null; last_name?: string | null; created_at?: string; updated_at?: string };
        Update: { first_name?: string | null; last_name?: string | null; updated_at?: string };
        Relationships: [];
      };
      protected_persons: {
        Row: {
          id: string; owner_id: string; first_name: string; last_name: string;
          birth_name: string | null; birth_date: string | null; birth_place: string | null;
          address_line1: string | null; address_line2: string | null; postal_code: string | null;
          city: string | null; country: string; phone: string | null; email: string | null;
          notes: string | null; status: ProtectedPersonStatus; created_at: string;
          updated_at: string; archived_at: string | null;
        };
        Insert: {
          id?: string; owner_id: string; first_name: string; last_name: string;
          birth_name?: string | null; birth_date?: string | null; birth_place?: string | null;
          address_line1?: string | null; address_line2?: string | null; postal_code?: string | null;
          city?: string | null; country?: string; phone?: string | null; email?: string | null;
          notes?: string | null; status?: ProtectedPersonStatus; created_at?: string;
          updated_at?: string; archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["protected_persons"]["Insert"]>;
        Relationships: [];
      };
      protection_measures: {
        Row: {
          id: string; protected_person_id: string; measure_type: MeasureType;
          start_date: string | null; end_date: string | null; decision_date: string | null;
          court_name: string | null; court_city: string | null; case_reference: string | null;
          judge_name: string | null; notary_name: string | null; notes: string | null;
          active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; protected_person_id: string; measure_type: MeasureType;
          start_date?: string | null; end_date?: string | null; decision_date?: string | null;
          court_name?: string | null; court_city?: string | null; case_reference?: string | null;
          judge_name?: string | null; notary_name?: string | null; notes?: string | null;
          active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["protection_measures"]["Insert"]>;
        Relationships: [{ foreignKeyName: "protection_measures_protected_person_id_fkey"; columns: ["protected_person_id"]; isOneToOne: false; referencedRelation: "protected_persons"; referencedColumns: ["id"] }];
      };
      management_periods: {
        Row: {
          id: string; protected_person_id: string; start_date: string; end_date: string;
          status: ManagementPeriodStatus; notes: string | null; created_at: string;
          updated_at: string; closed_at: string | null;
        };
        Insert: {
          id?: string; protected_person_id: string; start_date: string; end_date: string;
          status?: ManagementPeriodStatus; notes?: string | null; created_at?: string;
          updated_at?: string; closed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["management_periods"]["Insert"]>;
        Relationships: [{ foreignKeyName: "management_periods_protected_person_id_fkey"; columns: ["protected_person_id"]; isOneToOne: false; referencedRelation: "protected_persons"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProtectedPerson = Database["public"]["Tables"]["protected_persons"]["Row"];
export type ProtectionMeasure = Database["public"]["Tables"]["protection_measures"]["Row"];
export type ManagementPeriod = Database["public"]["Tables"]["management_periods"]["Row"];
