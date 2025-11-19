/*
  # Create Laptop Reimbursement Portal Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `employee_id` (text, unique)
      - `email` (text, unique)
      - `password` (text)
      - `role` (text)
      - `name` (text)
      - `joining_date` (date)
      - `is_active` (boolean, default true)
      - `category` (text, default 'Developer')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `requests`
      - `id` (uuid, primary key)
      - `employee_id` (text)
      - `joining_date` (date)
      - `email` (text)
      - `laptop_purchase_date` (date)
      - `category` (text)
      - `invoice_amount` (numeric)
      - `has_windows_pro` (boolean, default false)
      - `windows_pro_amount` (numeric, default 0)
      - `reimbursement_amount` (numeric)
      - `invoice_file` (text)
      - `windows_invoice_file` (text)
      - `status` (text, default 'pending')
      - `submitted_at` (timestamp)
      - `submitted_by` (uuid, references users)
      - `depreciation_type` (text)
      - `depreciation_value` (text)
      - `comments` (text)
      - `updated_at` (timestamp)
      - `updated_by` (text)
      - `processed_at` (timestamp)
      - `monthly_installment` (numeric)
      - `installment_start_date` (timestamp)
      - `installment_end_date` (timestamp)
      - `next_eligible_date` (timestamp)
      - `created_at` (timestamp)
    
    - `email_templates`
      - `id` (text, primary key)
      - `name` (text)
      - `subject` (text)
      - `body` (text)
      - `variables` (text[])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `smtp_settings`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `host` (text)
      - `port` (integer)
      - `username` (text)
      - `password` (text)
      - `from_email` (text)
      - `from_name` (text)
      - `secure` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `entra_id_settings`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `enabled` (boolean, default false)
      - `tenant_id` (text)
      - `client_id` (text)
      - `client_secret` (text)
      - `redirect_uri` (text)
      - `allowed_domains` (text[])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `existing_rentals`
      - `id` (uuid, primary key)
      - `emp_id` (text)
      - `emp_name` (text)
      - `emp_email` (text)
      - `invoice_date` (date)
      - `total_amount` (numeric)
      - `actual_amount` (numeric)
      - `windows_upgrade_cost` (numeric, default 0)
      - `monthly_instalment` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `next_request_date` (date)
      - `created_at` (timestamp)
    
    - `company_settings`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `logo_url` (text)
      - `company_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Add policies for data access control

  3. Initial Data
    - Insert default users (admin, finance, employee)
    - Insert default email templates
    - Insert default settings
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('employee', 'it_admin', 'finance')),
  name text NOT NULL,
  joining_date date NOT NULL,
  is_active boolean DEFAULT true,
  category text DEFAULT 'Developer' CHECK (category IN ('Developer', 'Non-Developer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  joining_date date NOT NULL,
  email text NOT NULL,
  laptop_purchase_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('Developer', 'Non-Developer')),
  invoice_amount numeric NOT NULL,
  has_windows_pro boolean DEFAULT false,
  windows_pro_amount numeric DEFAULT 0,
  reimbursement_amount numeric NOT NULL,
  invoice_file text,
  windows_invoice_file text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'paid')),
  submitted_at timestamptz DEFAULT now(),
  submitted_by uuid REFERENCES users(id),
  depreciation_type text,
  depreciation_value text,
  comments text,
  updated_at timestamptz,
  updated_by text,
  processed_at timestamptz,
  monthly_installment numeric,
  installment_start_date timestamptz,
  installment_end_date timestamptz,
  next_eligible_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create SMTP settings table
CREATE TABLE IF NOT EXISTS smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host text,
  port integer DEFAULT 587,
  username text,
  password text,
  from_email text,
  from_name text DEFAULT 'Own Your Laptop Portal',
  secure boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Entra ID settings table
CREATE TABLE IF NOT EXISTS entra_id_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  tenant_id text,
  client_id text,
  client_secret text,
  redirect_uri text,
  allowed_domains text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create existing rentals table
CREATE TABLE IF NOT EXISTS existing_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text NOT NULL,
  emp_name text NOT NULL,
  emp_email text NOT NULL,
  invoice_date date NOT NULL,
  total_amount numeric NOT NULL,
  actual_amount numeric NOT NULL,
  windows_upgrade_cost numeric DEFAULT 0,
  monthly_instalment numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  next_request_date date,
  created_at timestamptz DEFAULT now()
);

-- Create company settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  company_name text DEFAULT 'Own Your Laptop Portal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entra_id_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE existing_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "IT Admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'it_admin'
    )
  );

-- Create policies for requests table
CREATE POLICY "Users can read own requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "Users can create own requests"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "IT Admin and Finance can read all requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('it_admin', 'finance')
    )
  );

CREATE POLICY "IT Admin and Finance can update requests"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('it_admin', 'finance')
    )
  );

-- Create policies for email templates
CREATE POLICY "IT Admin can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'it_admin'
    )
  );

-- Create policies for SMTP settings
CREATE POLICY "IT Admin can manage SMTP settings"
  ON smtp_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'it_admin'
    )
  );

-- Create policies for Entra ID settings
CREATE POLICY "IT Admin can manage Entra ID settings"
  ON entra_id_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'it_admin'
    )
  );

-- Create policies for existing rentals
CREATE POLICY "IT Admin and Finance can manage existing rentals"
  ON existing_rentals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('it_admin', 'finance')
    )
  );

-- Create policies for company settings
CREATE POLICY "All authenticated users can read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "IT Admin can manage company settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'it_admin'
    )
  );

-- Insert default users
INSERT INTO users (employee_id, email, password, role, name, joining_date, category) VALUES
  ('EMP001', 'admin@company.com', 'admin123', 'it_admin', 'IT Admin', '2023-01-01', 'Developer'),
  ('EMP002', 'finance@company.com', 'finance123', 'finance', 'Finance Team', '2023-01-01', 'Non-Developer'),
  ('EMP003', 'employee@company.com', 'emp123', 'employee', 'John Doe', '2024-01-01', 'Developer')
ON CONFLICT (employee_id) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (id, name, subject, body, variables) VALUES
  ('request_approved', 'Request Approved', 'Laptop Reimbursement Request Approved - #{requestId}', 
   'Dear {userName},

Your laptop reimbursement request has been approved!

Request Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Invoice Amount: ₹{invoiceAmount}
- Reimbursement Amount: ₹{reimbursementAmount}
- Category: {category}

Comments: {comments}

Your request will now be processed by the Finance team for payment.

Best regards,
IT Team', 
   ARRAY['userName', 'requestId', 'employeeId', 'invoiceAmount', 'reimbursementAmount', 'category', 'comments']),
   
  ('request_rejected', 'Request Rejected', 'Laptop Reimbursement Request Rejected - #{requestId}',
   'Dear {userName},

We regret to inform you that your laptop reimbursement request has been rejected.

Request Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Invoice Amount: ₹{invoiceAmount}
- Category: {category}

Reason for rejection: {comments}

If you have any questions, please contact the IT team.

Best regards,
IT Team',
   ARRAY['userName', 'requestId', 'employeeId', 'invoiceAmount', 'category', 'comments']),
   
  ('request_processed', 'Request Processed', 'Laptop Reimbursement Processed - Payment Details - #{requestId}',
   'Dear {userName},

Your laptop reimbursement has been processed and payment has been initiated.

Payment Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Final Reimbursement Amount: ₹{reimbursementAmount}
- Monthly Installment: ₹{monthlyInstallment}
- Installment Period: {startDate} to {endDate}
- Next Eligible Date: {nextEligibilityDate}

Processing Notes: {comments}

The amount will be credited to your salary in monthly installments as mentioned above.

Best regards,
Finance Team',
   ARRAY['userName', 'requestId', 'employeeId', 'reimbursementAmount', 'monthlyInstallment', 'startDate', 'endDate', 'nextEligibilityDate', 'comments'])
ON CONFLICT (id) DO NOTHING;

-- Insert default SMTP settings (empty)
INSERT INTO smtp_settings (host, port, username, password, from_email, from_name, secure) VALUES
  ('', 587, '', '', '', 'Own Your Laptop Portal', true)
ON CONFLICT DO NOTHING;

-- Insert default Entra ID settings (disabled)
INSERT INTO entra_id_settings (enabled, tenant_id, client_id, client_secret, redirect_uri, allowed_domains) VALUES
  (false, '', '', '', '', ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Insert default company settings
INSERT INTO company_settings (logo_url, company_name) VALUES
  (null, 'Own Your Laptop Portal')
ON CONFLICT DO NOTHING;