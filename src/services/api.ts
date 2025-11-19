import { supabase } from './supabaseClient';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  password: string;
  role: string;
  name: string;
  joiningDate: string;
  isActive?: boolean;
  category?: string;
}

export interface Request {
  id: string;
  employeeId: string;
  joiningDate: string;
  email: string;
  laptopPurchaseDate: string;
  category: string;
  invoiceAmount: number;
  hasWindowsPro?: boolean;
  windowsProAmount?: number;
  reimbursementAmount: number;
  invoiceFile?: string;
  windowsInvoiceFile?: string;
  status: string;
  submittedAt: string;
  submittedBy: string;
  depreciationType?: string;
  depreciationValue?: string;
  comments?: string;
  updatedAt?: string;
  updatedBy?: string;
  processedAt?: string;
  monthlyInstallment?: number;
  installmentStartDate?: string;
  installmentEndDate?: string;
  nextEligibleDate?: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface EntraIDSettings {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedDomains: string[];
}

export interface ExistingRental {
  id: string;
  empId: string;
  empName: string;
  empEmail: string;
  invoiceDate: string;
  totalAmount: number;
  actualAmount: number;
  windowsUpgradeCost: number;
  monthlyInstalment: number;
  startDate: string;
  endDate: string;
  nextRequestDate: string;
}

export interface CompanySettings {
  logoUrl: string | null;
  companyName: string;
}

// User management
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data.map(user => ({
    id: user.id,
    employeeId: user.employee_id,
    email: user.email,
    password: user.password,
    role: user.role,
    name: user.name,
    joiningDate: user.joining_date,
    isActive: user.is_active,
    category: user.category
  }));
};

export const saveUser = async (userData: Omit<User, 'id' | 'password'>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      employee_id: userData.employeeId,
      email: userData.email,
      password: 'temp123', // Default password
      role: userData.role,
      name: userData.name,
      joining_date: userData.joiningDate,
      category: userData.category || 'Developer',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    email: data.email,
    password: data.password,
    role: data.role,
    name: data.name,
    joiningDate: data.joining_date,
    isActive: data.is_active,
    category: data.category
  };
};

export const resetUserPassword = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ 
      password: 'temp123',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Error resetting password:', error);
    throw error;
  }

  return true;
};

export const toggleUserStatus = async (userId: string): Promise<boolean> => {
  // First get current status
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    throw fetchError;
  }

  // Toggle status
  const { error } = await supabase
    .from('users')
    .update({ 
      is_active: !user.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }

  return true;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  // Check if user has any requests
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('id')
    .eq('submitted_by', userId)
    .limit(1);

  if (requestsError) {
    console.error('Error checking user requests:', requestsError);
    throw requestsError;
  }

  if (requests && requests.length > 0) {
    throw new Error('Cannot delete user with existing requests');
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }

  return true;
};

export const updateUser = async (userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'employeeId'>>): Promise<User> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.email) updateData.email = updates.email;
  if (updates.employeeId) updateData.employee_id = updates.employeeId;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    email: data.email,
    password: data.password,
    role: data.role,
    name: data.name,
    joiningDate: data.joining_date,
    isActive: data.is_active,
    category: data.category
  };
};

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    email: data.email,
    password: data.password,
    role: data.role,
    name: data.name,
    joiningDate: data.joining_date,
    isActive: data.is_active,
    category: data.category
  };
};

// Request management
export const getRequests = async (): Promise<Request[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }

  return data.map(request => ({
    id: request.id,
    employeeId: request.employee_id,
    joiningDate: request.joining_date,
    email: request.email,
    laptopPurchaseDate: request.laptop_purchase_date,
    category: request.category,
    invoiceAmount: request.invoice_amount,
    hasWindowsPro: request.has_windows_pro,
    windowsProAmount: request.windows_pro_amount,
    reimbursementAmount: request.reimbursement_amount,
    invoiceFile: request.invoice_file,
    windowsInvoiceFile: request.windows_invoice_file,
    status: request.status,
    submittedAt: request.submitted_at,
    submittedBy: request.submitted_by,
    depreciationType: request.depreciation_type,
    depreciationValue: request.depreciation_value,
    comments: request.comments,
    updatedAt: request.updated_at,
    updatedBy: request.updated_by,
    processedAt: request.processed_at,
    monthlyInstallment: request.monthly_installment,
    installmentStartDate: request.installment_start_date,
    installmentEndDate: request.installment_end_date,
    nextEligibleDate: request.next_eligible_date
  }));
};

export const saveRequest = async (request: Omit<Request, 'id' | 'submittedAt'>): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      employee_id: request.employeeId,
      joining_date: request.joiningDate,
      email: request.email,
      laptop_purchase_date: request.laptopPurchaseDate,
      category: request.category,
      invoice_amount: request.invoiceAmount,
      has_windows_pro: request.hasWindowsPro || false,
      windows_pro_amount: request.windowsProAmount || 0,
      reimbursement_amount: request.reimbursementAmount,
      invoice_file: request.invoiceFile,
      windows_invoice_file: request.windowsInvoiceFile,
      status: request.status,
      submitted_by: request.submittedBy
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating request:', error);
    throw error;
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    joiningDate: data.joining_date,
    email: data.email,
    laptopPurchaseDate: data.laptop_purchase_date,
    category: data.category,
    invoiceAmount: data.invoice_amount,
    hasWindowsPro: data.has_windows_pro,
    windowsProAmount: data.windows_pro_amount,
    reimbursementAmount: data.reimbursement_amount,
    invoiceFile: data.invoice_file,
    windowsInvoiceFile: data.windows_invoice_file,
    status: data.status,
    submittedAt: data.submitted_at,
    submittedBy: data.submitted_by
  };
};

// Calculate depreciation for a laptop
export const calculateDepreciation = (purchaseDate: string, joiningDate: string, originalAmount: number, includeMonthlyBreakdown: boolean = false): {
  depreciatedAmount: number;
  depreciationApplied: boolean;
  monthsOld: number;
  depreciationPercentage: number;
  monthlyBreakdown?: Array<{month: string, value: number, depreciation: number}>;
} => {
  const purchase = new Date(purchaseDate);
  const joining = new Date(joiningDate);
  
  // If laptop was purchased after joining, no depreciation
  if (purchase >= joining) {
    return {
      depreciatedAmount: originalAmount,
      depreciationApplied: false,
      monthsOld: 0,
      depreciationPercentage: 0
    };
  }
  
  // Calculate months between purchase and joining
  const timeDiff = joining.getTime() - purchase.getTime();
  const monthsOld = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
  
  if (monthsOld === 0) {
    return {
      depreciatedAmount: originalAmount,
      depreciationApplied: false,
      monthsOld: 0,
      depreciationPercentage: 0
    };
  }
  
  // Apply 20% yearly depreciation (1.67% monthly)
  const monthlyDepreciationRate = 0.20 / 12; // 20% per year = 1.67% per month
  const totalDepreciationRate = Math.min(monthsOld * monthlyDepreciationRate, 0.80); // Max 80% depreciation
  const depreciationPercentage = Math.round(totalDepreciationRate * 100);
  const depreciatedAmount = Math.round(originalAmount * (1 - totalDepreciationRate));
  
  let monthlyBreakdown;
  if (includeMonthlyBreakdown) {
    monthlyBreakdown = [];
    let currentValue = originalAmount;
    const startDate = new Date(purchase);
    
    for (let i = 0; i < Math.min(monthsOld, 48); i++) { // Show max 4 years
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthlyDepreciation = Math.round(currentValue * monthlyDepreciationRate);
      currentValue = Math.max(currentValue - monthlyDepreciation, originalAmount * 0.2);
      
      monthlyBreakdown.push({
        month: monthName,
        value: currentValue,
        depreciation: monthlyDepreciation
      });
    }
  }
  
  return {
    depreciatedAmount: Math.max(depreciatedAmount, originalAmount * 0.2), // Minimum 20% of original value
    depreciationApplied: true,
    monthsOld,
    depreciationPercentage,
    ...(monthlyBreakdown && { monthlyBreakdown })
  };
};

export const updateRequestStatus = async (
  id: string, 
  status: string, 
  comments?: string, 
  updatedBy?: string,
  depreciationType?: string,
  depreciationValue?: string
): Promise<Request | null> => {
  // Get the current request
  const { data: currentRequest, error: fetchError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentRequest) {
    console.error('Error fetching request:', fetchError);
    return null;
  }

  let updateData: any = {
    status,
    comments,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || ''
  };

  // If status is being changed to 'processed', calculate installment details
  if (status === 'processed') {
    const now = new Date();
    updateData.processed_at = now.toISOString();
    
    // Apply automatic depreciation calculation
    const depreciationResult = calculateDepreciation(
      currentRequest.laptop_purchase_date,
      currentRequest.joining_date,
      currentRequest.reimbursement_amount
    );
    
    const finalReimbursementAmount = depreciationResult.depreciatedAmount;
    updateData.reimbursement_amount = finalReimbursementAmount;
    
    // Store depreciation info for display
    if (depreciationResult.depreciationApplied) {
      updateData.depreciation_type = 'yearly';
      updateData.depreciation_value = depreciationResult.depreciationPercentage.toString();
    }
    
    updateData.monthly_installment = Math.round(finalReimbursementAmount / 24);
    
    // Start date is next month from processed date
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1); // First day of the month
    updateData.installment_start_date = startDate.toISOString();
    
    // End date is 23 months after start date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 23);
    endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()); // Last day of the month
    updateData.installment_end_date = endDate.toISOString();
    
    // Next eligible date is 36 months from processed date
    const nextEligible = new Date(now);
    nextEligible.setMonth(nextEligible.getMonth() + 36);
    updateData.next_eligible_date = nextEligible.toISOString();
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating request:', error);
    return null;
  }

  // Send email notifications based on status change
  try {
    const users = await getUsers();
    const userData = users.find(u => u.id === currentRequest.submitted_by);
    if (userData) {
      const updatedRequest = {
        id: data.id,
        employeeId: data.employee_id,
        joiningDate: data.joining_date,
        email: data.email,
        laptopPurchaseDate: data.laptop_purchase_date,
        category: data.category,
        invoiceAmount: data.invoice_amount,
        hasWindowsPro: data.has_windows_pro,
        windowsProAmount: data.windows_pro_amount,
        reimbursementAmount: data.reimbursement_amount,
        invoiceFile: data.invoice_file,
        windowsInvoiceFile: data.windows_invoice_file,
        status: data.status,
        submittedAt: data.submitted_at,
        submittedBy: data.submitted_by,
        depreciationType: data.depreciation_type,
        depreciationValue: data.depreciation_value,
        comments: data.comments,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by,
        processedAt: data.processed_at,
        monthlyInstallment: data.monthly_installment,
        installmentStartDate: data.installment_start_date,
        installmentEndDate: data.installment_end_date,
        nextEligibleDate: data.next_eligible_date
      };
      
      if (status === 'approved') {
        import('../services/emailService').then(({ sendRequestApprovedEmail }) => {
          sendRequestApprovedEmail(updatedRequest, userData, comments).catch(console.error);
        });
      } else if (status === 'rejected') {
        import('../services/emailService').then(({ sendRequestRejectedEmail }) => {
          sendRequestRejectedEmail(updatedRequest, userData, comments).catch(console.error);
        });
      } else if (status === 'processed') {
        import('../services/emailService').then(({ sendRequestProcessedEmail }) => {
          sendRequestProcessedEmail(updatedRequest, userData, comments).catch(console.error);
        });
      }
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't fail the request update if email fails
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    joiningDate: data.joining_date,
    email: data.email,
    laptopPurchaseDate: data.laptop_purchase_date,
    category: data.category,
    invoiceAmount: data.invoice_amount,
    hasWindowsPro: data.has_windows_pro,
    windowsProAmount: data.windows_pro_amount,
    reimbursementAmount: data.reimbursement_amount,
    invoiceFile: data.invoice_file,
    windowsInvoiceFile: data.windows_invoice_file,
    status: data.status,
    submittedAt: data.submitted_at,
    submittedBy: data.submitted_by,
    depreciationType: data.depreciation_type,
    depreciationValue: data.depreciation_value,
    comments: data.comments,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
    processedAt: data.processed_at,
    monthlyInstallment: data.monthly_installment,
    installmentStartDate: data.installment_start_date,
    installmentEndDate: data.installment_end_date,
    nextEligibleDate: data.next_eligible_date
  };
};

export const getStats = async () => {
  const requests = await getRequests();
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    processed: requests.filter(r => r.status === 'processed').length,
    paid: requests.filter(r => r.status === 'paid').length,
  };
};

// Check if employee is eligible for new reimbursement
export const checkReimbursementEligibility = async (employeeId: string): Promise<{ eligible: boolean; nextEligibleDate?: string; reason?: string }> => {
  const users = await getUsers();
  const user = users.find(u => u.employeeId === employeeId);
  
  if (!user) {
    return { eligible: false, reason: 'User not found' };
  }
  
  // Check if user has been working for at least 15 days
  const joiningDate = new Date(user.joiningDate);
  const today = new Date();
  const daysSinceJoining = Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceJoining < 15) {
    const eligibleDate = new Date(joiningDate);
    eligibleDate.setDate(eligibleDate.getDate() + 15);
    return {
      eligible: false,
      nextEligibleDate: eligibleDate.toISOString(),
      reason: `You need to complete 15 days of service. Eligible from ${eligibleDate.toLocaleDateString()}`
    };
  }
  
  const requests = await getRequests();
  const employeeRequests = requests.filter(r => r.employeeId === employeeId && r.status === 'processed');
  
  if (employeeRequests.length === 0) {
    return { eligible: true };
  }
  
  // Find the most recent processed request
  const latestProcessedRequest = employeeRequests.sort((a, b) => 
    new Date(b.processedAt || '').getTime() - new Date(a.processedAt || '').getTime()
  )[0];
  
  if (latestProcessedRequest.nextEligibleDate) {
    const nextEligibleDate = new Date(latestProcessedRequest.nextEligibleDate);
    
    if (today < nextEligibleDate) {
      return {
        eligible: false,
        nextEligibleDate: latestProcessedRequest.nextEligibleDate,
        reason: `You can apply for next reimbursement after ${nextEligibleDate.toLocaleDateString()}`
      };
    }
  }
  
  return { eligible: true };
};

// File handling (mock implementation)
export const uploadFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // In a real app, this would upload to Supabase Storage
    // For demo, we'll just return a mock filename
    const filename = `${Date.now()}-${file.name}`;
    resolve(filename);
  });
};

export const getFileUrl = (filename: string): string => {
  // In a real app, this would return the actual file URL from Supabase Storage
  // For demo, we'll return a placeholder
  return `#${filename}`;
};

// Email Templates
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }

  return data;
};

export const saveEmailTemplates = async (templates: EmailTemplate[]): Promise<void> => {
  for (const template of templates) {
    const { error } = await supabase
      .from('email_templates')
      .upsert({
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving email template:', error);
      throw error;
    }
  }
};

// SMTP Settings
export const getSMTPSettings = async (): Promise<SMTPSettings | null> => {
  const { data, error } = await supabase
    .from('smtp_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching SMTP settings:', error);
    throw error;
  }

  if (!data) return null;

  return {
    host: data.host || '',
    port: data.port,
    username: data.username || '',
    password: data.password || '',
    fromEmail: data.from_email || '',
    fromName: data.from_name || '',
    secure: data.secure
  };
};

export const saveSMTPSettings = async (settings: SMTPSettings): Promise<void> => {
  const { error } = await supabase
    .from('smtp_settings')
    .upsert({
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password: settings.password,
      from_email: settings.fromEmail,
      from_name: settings.fromName,
      secure: settings.secure,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving SMTP settings:', error);
    throw error;
  }
};

// Entra ID Settings
export const getEntraIDSettings = async (): Promise<EntraIDSettings | null> => {
  const { data, error } = await supabase
    .from('entra_id_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching Entra ID settings:', error);
    throw error;
  }

  if (!data) return null;

  return {
    enabled: data.enabled,
    tenantId: data.tenant_id || '',
    clientId: data.client_id || '',
    clientSecret: data.client_secret || '',
    redirectUri: data.redirect_uri || '',
    allowedDomains: data.allowed_domains || []
  };
};

export const saveEntraIDSettings = async (settings: EntraIDSettings): Promise<void> => {
  const { error } = await supabase
    .from('entra_id_settings')
    .upsert({
      enabled: settings.enabled,
      tenant_id: settings.tenantId,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: settings.redirectUri,
      allowed_domains: settings.allowedDomains,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving Entra ID settings:', error);
    throw error;
  }
};

// Existing Rentals
export const getExistingRentals = async (): Promise<ExistingRental[]> => {
  const { data, error } = await supabase
    .from('existing_rentals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching existing rentals:', error);
    throw error;
  }

  return data.map(rental => ({
    id: rental.id,
    empId: rental.emp_id,
    empName: rental.emp_name,
    empEmail: rental.emp_email,
    invoiceDate: rental.invoice_date,
    totalAmount: rental.total_amount,
    actualAmount: rental.actual_amount,
    windowsUpgradeCost: rental.windows_upgrade_cost,
    monthlyInstalment: rental.monthly_instalment,
    startDate: rental.start_date,
    endDate: rental.end_date,
    nextRequestDate: rental.next_request_date || ''
  }));
};

export const saveExistingRentals = async (rentals: Omit<ExistingRental, 'id'>[]): Promise<void> => {
  const { error } = await supabase
    .from('existing_rentals')
    .insert(rentals.map(rental => ({
      emp_id: rental.empId,
      emp_name: rental.empName,
      emp_email: rental.empEmail,
      invoice_date: rental.invoiceDate,
      total_amount: rental.totalAmount,
      actual_amount: rental.actualAmount,
      windows_upgrade_cost: rental.windowsUpgradeCost,
      monthly_instalment: rental.monthlyInstalment,
      start_date: rental.startDate,
      end_date: rental.endDate,
      next_request_date: rental.nextRequestDate || null
    })));

  if (error) {
    console.error('Error saving existing rentals:', error);
    throw error;
  }
};

export const clearExistingRentals = async (): Promise<void> => {
  const { error } = await supabase
    .from('existing_rentals')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

  if (error) {
    console.error('Error clearing existing rentals:', error);
    throw error;
  }
};

// Company Settings
export const getCompanySettings = async (): Promise<CompanySettings | null> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching company settings:', error);
    throw error;
  }

  if (!data) return null;

  return {
    logoUrl: data.logo_url,
    companyName: data.company_name || 'Own Your Laptop Portal'
  };
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<void> => {
  const { error } = await supabase
    .from('company_settings')
    .upsert({
      logo_url: settings.logoUrl,
      company_name: settings.companyName,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving company settings:', error);
    throw error;
  }
};