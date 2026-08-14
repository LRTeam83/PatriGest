export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProtectedPersonStatus = "active" | "archived";
export type MeasureType =
  | "safeguard_of_justice"
  | "safeguard_with_special_mandate"
  | "simple_curatorship"
  | "reinforced_curatorship"
  | "guardianship"
  | "future_protection_mandate"
  | "family_authorization"
  | "judicial_support_measure";
type ManagementPeriodStatus = "open" | "closed";
export type FinancialAccountType = "checking" | "livret_a" | "ldds" | "csl" | "lep" | "pel" | "term_account" | "life_insurance" | "other_investment";
type FinancialAccountStatus = "active" | "closed";
export type CategoryUsage = "income" | "expense" | "both";
export type TransactionType = "income" | "expense" | "transfer_in" | "transfer_out";
export type DossierAccessRole = "owner" | "manager" | "read_only";
type SharedAccessRole = Exclude<DossierAccessRole, "owner">;
type AccountRequestStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; first_name: string | null; last_name: string | null; last_seen_version: string | null; created_at: string; updated_at: string };
        Insert: { id: string; first_name?: string | null; last_name?: string | null; last_seen_version?: string | null; created_at?: string; updated_at?: string };
        Update: { first_name?: string | null; last_name?: string | null; last_seen_version?: string | null; updated_at?: string };
        Relationships: [];
      };
      protected_persons: {
        Row: {
          id: string; owner_id: string; first_name: string; last_name: string;
          birth_name: string | null; birth_date: string | null; birth_place: string | null;
          address_line1: string | null; address_line2: string | null; postal_code: string | null;
          city: string | null; country: string; phone: string | null; email: string | null;
          residence_address_line1: string | null; residence_address_line2: string | null;
          residence_postal_code: string | null; residence_city: string | null; residence_country: string | null;
          notes: string | null; status: ProtectedPersonStatus; created_at: string;
          updated_at: string; archived_at: string | null;
        };
        Insert: {
          id?: string; owner_id: string; first_name: string; last_name: string;
          birth_name?: string | null; birth_date?: string | null; birth_place?: string | null;
          address_line1?: string | null; address_line2?: string | null; postal_code?: string | null;
          city?: string | null; country?: string; phone?: string | null; email?: string | null;
          residence_address_line1?: string | null; residence_address_line2?: string | null;
          residence_postal_code?: string | null; residence_city?: string | null; residence_country?: string | null;
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
          court_cabinet: string | null;
          judge_name: string | null; notary_name: string | null; notes: string | null;
          representative_first_name: string | null; representative_last_name: string | null;
          representative_appointment_date: string | null;
          representative_address_line1: string | null; representative_address_line2: string | null;
          representative_postal_code: string | null; representative_city: string | null;
          representative_country: string | null; representative_phone: string | null; representative_email: string | null;
          active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; protected_person_id: string; measure_type: MeasureType;
          start_date?: string | null; end_date?: string | null; decision_date?: string | null;
          court_name?: string | null; court_city?: string | null; case_reference?: string | null;
          court_cabinet?: string | null;
          judge_name?: string | null; notary_name?: string | null; notes?: string | null;
          representative_first_name?: string | null; representative_last_name?: string | null;
          representative_appointment_date?: string | null;
          representative_address_line1?: string | null; representative_address_line2?: string | null;
          representative_postal_code?: string | null; representative_city?: string | null;
          representative_country?: string | null; representative_phone?: string | null; representative_email?: string | null;
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
      financial_accounts: {
        Row: {
          id: string; protected_person_id: string; account_type: FinancialAccountType;
          institution_name: string; account_name: string; account_reference: string | null;
          opening_date: string | null; closing_date: string | null; initial_balance: number;
          initial_balance_date: string; notes: string | null; status: FinancialAccountStatus;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; protected_person_id: string; account_type: FinancialAccountType;
          institution_name: string; account_name: string; account_reference?: string | null;
          opening_date?: string | null; closing_date?: string | null; initial_balance?: number;
          initial_balance_date: string; notes?: string | null; status?: FinancialAccountStatus;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["financial_accounts"]["Insert"]>;
        Relationships: [{ foreignKeyName: "financial_accounts_protected_person_id_fkey"; columns: ["protected_person_id"]; isOneToOne: false; referencedRelation: "protected_persons"; referencedColumns: ["id"] }];
      };
      account_valuations: {
        Row: { id: string; financial_account_id: string; valuation_date: string; value: number; comment: string | null; created_at: string };
        Insert: { id?: string; financial_account_id: string; valuation_date: string; value: number; comment?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["account_valuations"]["Insert"]>;
        Relationships: [{ foreignKeyName: "account_valuations_financial_account_id_fkey"; columns: ["financial_account_id"]; isOneToOne: false; referencedRelation: "financial_accounts"; referencedColumns: ["id"] }];
      };
      platform_administrators: {
        Row: { user_id: string; appointed_by: string | null; created_at: string };
        Insert: { user_id: string; appointed_by?: string | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
      account_requests: {
        Row: { id: string; email: string; first_name: string; last_name: string; message: string | null; status: AccountRequestStatus; invitation_token_hash: string | null; invitation_expires_at: string | null; invitation_used_at: string | null; created_at: string; reviewed_at: string | null; reviewed_by: string | null };
        Insert: { id?: string; email: string; first_name: string; last_name: string; message?: string | null; status?: AccountRequestStatus; invitation_token_hash?: string | null; invitation_expires_at?: string | null; invitation_used_at?: string | null; created_at?: string; reviewed_at?: string | null; reviewed_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["account_requests"]["Insert"]>;
        Relationships: [];
      };
      protected_person_access: {
        Row: { id: string; protected_person_id: string; user_id: string; role: SharedAccessRole; invited_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; protected_person_id: string; user_id: string; role: SharedAccessRole; invited_by: string; created_at?: string; updated_at?: string };
        Update: { role?: SharedAccessRole; updated_at?: string };
        Relationships: [];
      };
      protected_person_invitations: {
        Row: { id: string; protected_person_id: string; email: string; role: SharedAccessRole; token_hash: string; expires_at: string; accepted_at: string | null; invited_by: string; created_at: string };
        Insert: { id?: string; protected_person_id: string; email: string; role: SharedAccessRole; token_hash: string; expires_at: string; accepted_at?: string | null; invited_by: string; created_at?: string };
        Update: { role?: SharedAccessRole; expires_at?: string; accepted_at?: string | null };
        Relationships: [];
      };
      categories: {
        Row: { id: string; owner_id: string | null; name: string; usage: CategoryUsage; is_system: boolean; active: boolean; official_code: string | null; official_section: string | null; official_group: string | null; official_order: number | null; official_category_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; owner_id?: string | null; name: string; usage: CategoryUsage; is_system?: boolean; active?: boolean; official_code?: string | null; official_section?: string | null; official_group?: string | null; official_order?: number | null; official_category_id?: string | null; created_at?: string; updated_at?: string };
        Update: { name?: string; usage?: CategoryUsage; active?: boolean; official_category_id?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "categories_official_category_id_fkey"; columns: ["official_category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
      transfers: {
        Row: { id: string; protected_person_id: string; source_account_id: string; destination_account_id: string; transfer_date: string; amount: number; label: string | null; comment: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; protected_person_id: string; source_account_id: string; destination_account_id: string; transfer_date: string; amount: number; label?: string | null; comment?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["transfers"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: { id: string; financial_account_id: string; transaction_date: string; transaction_type: TransactionType; label: string; amount: number; category_id: string | null; transfer_id: string | null; proof_reference: string | null; comment: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; financial_account_id: string; transaction_date: string; transaction_type: TransactionType; label: string; amount: number; category_id?: string | null; transfer_id?: string | null; proof_reference?: string | null; comment?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      proof_reference_counters: {
        Row: { protected_person_id: string; reference_year: number; last_number: number; updated_at: string };
        Insert: { protected_person_id: string; reference_year: number; last_number: number; updated_at?: string };
        Update: { last_number?: number; updated_at?: string };
        Relationships: [];
      };
      proof_reference_assignments: {
        Row: { transaction_id: string; protected_person_id: string; reference_year: number; reference_number: number; proof_reference: string; created_at: string };
        Insert: { transaction_id: string; protected_person_id: string; reference_year: number; reference_number: number; proof_reference: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      transaction_documents: {
        Row: { id: string; transaction_id: string; storage_path: string; file_name: string; mime_type: string; file_size: number; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; transaction_id: string; storage_path: string; file_name: string; mime_type: string; file_size: number; created_by: string; created_at?: string; updated_at?: string };
        Update: { file_name?: string; mime_type?: string; file_size?: number; created_by?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      is_protected_person_owner: { Args: { person_id: string }; Returns: boolean };
      can_read_protected_person: { Args: { person_id: string }; Returns: boolean };
      can_manage_protected_person: { Args: { person_id: string }; Returns: boolean };
      accept_protected_person_invitation: { Args: { p_token_hash: string }; Returns: string };
      create_internal_transfer: { Args: { p_protected_person_id: string; p_source_account_id: string; p_destination_account_id: string; p_transfer_date: string; p_amount: number; p_label?: string | null; p_comment?: string | null }; Returns: string };
      delete_internal_transfer: { Args: { p_transfer_id: string }; Returns: undefined };
      delete_empty_financial_account: { Args: { p_account_id: string }; Returns: undefined };
      delete_empty_protected_person: { Args: { p_protected_person_id: string }; Returns: undefined };
      delete_transaction_with_document: { Args: { p_transaction_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProtectedPerson = Database["public"]["Tables"]["protected_persons"]["Row"];
export type ProtectionMeasure = Database["public"]["Tables"]["protection_measures"]["Row"];
export type ManagementPeriod = Database["public"]["Tables"]["management_periods"]["Row"];
export type FinancialAccount = Database["public"]["Tables"]["financial_accounts"]["Row"];
export type AccountValuation = Database["public"]["Tables"]["account_valuations"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionDocument = Database["public"]["Tables"]["transaction_documents"]["Row"];
export type Transfer = Database["public"]["Tables"]["transfers"]["Row"];
export type AccountRequest = Database["public"]["Tables"]["account_requests"]["Row"];
export type ProtectedPersonAccess = Database["public"]["Tables"]["protected_person_access"]["Row"];
export type ProtectedPersonInvitation = Database["public"]["Tables"]["protected_person_invitations"]["Row"];
