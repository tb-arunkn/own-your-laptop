import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          employee_id: string;
          email: string;
          password: string;
          role: string;
          name: string;
          joining_date: string;
          is_active: boolean;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          email: string;
          password: string;
          role: string;
          name: string;
          joining_date: string;
          is_active?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          email?: string;
          password?: string;
          role?: string;
          name?: string;
          joining_date?: string;
          is_active?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          employee_id: string;
          joining_date: string;
          email: string;
          laptop_purchase_date: string;
          category: string;
          invoice_amount: number;
          has_windows_pro: boolean;
          windows_pro_amount: number;
          reimbursement_amount: number;
          invoice_file: string | null;
          windows_invoice_file: string | null;
          status: string;
          submitted_at: string;
          submitted_by: string;
          depreciation_type: string | null;
          depreciation_value: string | null;
          comments: string | null;
          updated_at: string | null;
          updated_by: string | null;
          processed_at: string | null;
          monthly_installment: number | null;
          installment_start_date: string | null;
          installment_end_date: string | null;
          next_eligible_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          joining_date: string;
          email: string;
          laptop_purchase_date: string;
          category: string;
          invoice_amount: number;
          has_windows_pro?: boolean;
          windows_pro_amount?: number;
          reimbursement_amount: number;
          invoice_file?: string | null;
          windows_invoice_file?: string | null;
          status?: string;
          submitted_at?: string;
          submitted_by: string;
          depreciation_type?: string | null;
          depreciation_value?: string | null;
          comments?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          processed_at?: string | null;
          monthly_installment?: number | null;
          installment_start_date?: string | null;
          installment_end_date?: string | null;
          next_eligible_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          joining_date?: string;
          email?: string;
          laptop_purchase_date?: string;
          category?: string;
          invoice_amount?: number;
          has_windows_pro?: boolean;
          windows_pro_amount?: number;
          reimbursement_amount?: number;
          invoice_file?: string | null;
          windows_invoice_file?: string | null;
          status?: string;
          submitted_at?: string;
          submitted_by?: string;
          depreciation_type?: string | null;
          depreciation_value?: string | null;
          comments?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          processed_at?: string | null;
          monthly_installment?: number | null;
          installment_start_date?: string | null;
          installment_end_date?: string | null;
          next_eligible_date?: string | null;
          created_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          variables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          subject: string;
          body: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      smtp_settings: {
        Row: {
          id: string;
          host: string | null;
          port: number;
          username: string | null;
          password: string | null;
          from_email: string | null;
          from_name: string | null;
          secure: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host?: string | null;
          port?: number;
          username?: string | null;
          password?: string | null;
          from_email?: string | null;
          from_name?: string | null;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host?: string | null;
          port?: number;
          username?: string | null;
          password?: string | null;
          from_email?: string | null;
          from_name?: string | null;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      entra_id_settings: {
        Row: {
          id: string;
          enabled: boolean;
          tenant_id: string | null;
          client_id: string | null;
          client_secret: string | null;
          redirect_uri: string | null;
          allowed_domains: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enabled?: boolean;
          tenant_id?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          redirect_uri?: string | null;
          allowed_domains?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enabled?: boolean;
          tenant_id?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          redirect_uri?: string | null;
          allowed_domains?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      existing_rentals: {
        Row: {
          id: string;
          emp_id: string;
          emp_name: string;
          emp_email: string;
          invoice_date: string;
          total_amount: number;
          actual_amount: number;
          windows_upgrade_cost: number;
          monthly_instalment: number;
          start_date: string;
          end_date: string;
          next_request_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          emp_id: string;
          emp_name: string;
          emp_email: string;
          invoice_date: string;
          total_amount: number;
          actual_amount: number;
          windows_upgrade_cost?: number;
          monthly_instalment: number;
          start_date: string;
          end_date: string;
          next_request_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          emp_id?: string;
          emp_name?: string;
          emp_email?: string;
          invoice_date?: string;
          total_amount?: number;
          actual_amount?: number;
          windows_upgrade_cost?: number;
          monthly_instalment?: number;
          start_date?: string;
          end_date?: string;
          next_request_date?: string | null;
          created_at?: string;
        };
      };
      company_settings: {
        Row: {
          id: string;
          logo_url: string | null;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          logo_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          logo_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}