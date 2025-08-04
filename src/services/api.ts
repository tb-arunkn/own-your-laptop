export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'request_approved',
    name: 'Request Approved',
    subject: 'Laptop Reimbursement Request Approved - {{requestId}}',
    body: `Dear {{employeeName}},

Your laptop reimbursement request has been approved!

Request Details:
- Request ID: {{requestId}}
- Employee ID: {{employeeId}}
- Invoice Amount: ₹{{invoiceAmount}}
- Reimbursement Amount: ₹{{reimbursementAmount}}
- Category: {{category}}

{{#if comments}}
Comments: {{comments}}
{{/if}}

Your request will now be processed by the Finance team for payment.

Best regards,
IT Team`
  },
  {
    id: 'request_rejected',
    name: 'Request Rejected',
    subject: 'Laptop Reimbursement Request Rejected - {{requestId}}',
    body: `Dear {{employeeName}},

We regret to inform you that your laptop reimbursement request has been rejected.

Request Details:
- Request ID: {{requestId}}
- Employee ID: {{employeeId}}
- Invoice Amount: ₹{{invoiceAmount}}
- Category: {{category}}

{{#if comments}}
Reason for rejection: {{comments}}
{{/if}}

If you have any questions, please contact the IT team.

Best regards,
IT Team`
  },
  {
    id: 'request_processed',
    name: 'Request Processed',
    subject: 'Laptop Reimbursement Processed - Payment Details - {{requestId}}',
    body: `Dear {{employeeName}},

Your laptop reimbursement has been processed and payment has been initiated.

Payment Details:
- Request ID: {{requestId}}
- Employee ID: {{employeeId}}
- Final Reimbursement Amount: ₹{{reimbursementAmount}}
- Monthly Installment: ₹{{monthlyInstallment}}
- Installment Period: {{installmentStartDate}} to {{installmentEndDate}}
- Next Eligible Date: {{nextEligibleDate}}

{{#if comments}}
Processing Notes: {{comments}}
{{/if}}

The amount will be credited to your salary in monthly installments as mentioned above.

Best regards,
Finance Team`
  }
];
// Mock data for demo purposes
const defaultUsers = [
  {
    id: '1',
    employeeId: 'EMP001',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'it_admin',
    name: 'IT Admin',
    joiningDate: '2023-01-01'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    email: 'finance@company.com',
    password: 'finance123',
    role: 'finance',
    name: 'Finance Team',
    joiningDate: '2023-01-01'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    email: 'employee@company.com',
    password: 'emp123',
    role: 'employee',
    name: 'John Doe',
    joiningDate: '2024-01-01'
  }
];

export interface User {
  id: string;
  employeeId: string;
  email: string;
  password: string;
  role: string;
  name: string;
  joiningDate: string;
  isActive?: boolean;
}

export interface Request {
  id: string;
  employeeId: string;
  joiningDate: string;
  email: string;
  laptopPurchaseDate: string;
  category: string;
  invoiceAmount: number;
  reimbursementAmount: number;
  invoiceFile?: string;
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

// Initialize localStorage with default data if not exists
const initializeData = () => {
  if (!localStorage.getItem('users')) {
    const usersWithActiveStatus = defaultUsers.map(user => ({ ...user, isActive: true }));
    localStorage.setItem('users', JSON.stringify(usersWithActiveStatus));
  }
  if (!localStorage.getItem('requests')) {
    localStorage.setItem('requests', JSON.stringify([]));
  }
  if (!localStorage.getItem('emailTemplates')) {
    localStorage.setItem('emailTemplates', JSON.stringify(defaultEmailTemplates));
  }
  if (!localStorage.getItem('smtpSettings')) {
    const defaultSmtpSettings = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      password: ''
    };
    localStorage.setItem('smtpSettings', JSON.stringify(defaultSmtpSettings));
  }
};

// User management
export const getUsers = (): User[] => {
  initializeData();
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const saveUser = (userData: Omit<User, 'id' | 'password' | 'name'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    password: 'temp123', // Default temporary password
    isActive: true, // New users are active by default
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return newUser;
};

export const resetUserPassword = (userId: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].password = 'temp123';
  localStorage.setItem('users', JSON.stringify(users));
  return true;
};

export const toggleUserStatus = (userId: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].isActive = !users[userIndex].isActive;
  localStorage.setItem('users', JSON.stringify(users));
  return true;
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Check if user has any requests
  const requests = getRequests();
  const userHasRequests = requests.some(r => r.submittedBy === userId);
  
  if (userHasRequests) {
    throw new Error('Cannot delete user with existing requests');
  }
  
  users.splice(userIndex, 1);
  localStorage.setItem('users', JSON.stringify(users));
  return true;
};

export const updateUser = (userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'employeeId'>>): User => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Check for duplicate employee ID or email (excluding current user)
  if (updates.employeeId) {
    const existingUser = users.find(u => u.id !== userId && u.employeeId === updates.employeeId);
    if (existingUser) {
      throw new Error('Employee ID already exists');
    }
  }
  
  if (updates.email) {
    const existingUser = users.find(u => u.id !== userId && u.email === updates.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
  }
  
  // Update user
  users[userIndex] = { ...users[userIndex], ...updates };
  localStorage.setItem('users', JSON.stringify(users));
  
  return users[userIndex];
};
export const authenticateUser = (email: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password && u.isActive !== false);
  return user || null;
};

// Request management
export const getRequests = (): Request[] => {
  initializeData();
  return JSON.parse(localStorage.getItem('requests') || '[]');
};

export const saveRequest = (request: Omit<Request, 'id' | 'submittedAt'>): Request => {
  const requests = getRequests();
  const newRequest: Request = {
    ...request,
    id: Date.now().toString(),
    submittedAt: new Date().toISOString(),
  };
  
  requests.push(newRequest);
  localStorage.setItem('requests', JSON.stringify(requests));
  return newRequest;
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

export const updateRequestStatus = (
  id: string, 
  status: string, 
  comments?: string, 
  updatedBy?: string,
  depreciationType?: string,
  depreciationValue?: string
): Request | null => {
  const requests = getRequests();
  const requestIndex = requests.findIndex(r => r.id === id);
  
  if (requestIndex === -1) return null;
  
  // Store original request for email notifications
  const originalRequest = requests[requestIndex];
  
  // Initialize finalReimbursementAmount with current value
  let finalReimbursementAmount = requests[requestIndex].reimbursementAmount;
  
  const now = new Date();
  let processedAt, monthlyInstallment, installmentStartDate, installmentEndDate, nextEligibleDate;
  
  // If status is being changed to 'processed', calculate installment details
  if (status === 'processed') {
    processedAt = now.toISOString();
    
    // Apply automatic depreciation calculation
    const depreciationResult = calculateDepreciation(
      requests[requestIndex].laptopPurchaseDate,
      requests[requestIndex].joiningDate,
      finalReimbursementAmount
    );
    
    finalReimbursementAmount = depreciationResult.depreciatedAmount;
    
    // Store depreciation info for display
    if (depreciationResult.depreciationApplied) {
      depreciationType = 'yearly';
      depreciationValue = depreciationResult.depreciationPercentage.toString();
    }
    
    monthlyInstallment = Math.round(finalReimbursementAmount / 24);
    
    // Start date is next month from processed date
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1); // First day of the month
    installmentStartDate = startDate.toISOString();
    
    // End date is 23 months after start date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 23);
    endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()); // Last day of the month
    installmentEndDate = endDate.toISOString();
    
    // Next eligible date is 36 months from processed date
    const nextEligible = new Date(now);
    nextEligible.setMonth(nextEligible.getMonth() + 36);
    nextEligibleDate = nextEligible.toISOString();
  }
  
  requests[requestIndex] = {
    ...requests[requestIndex],
    ...(status === 'processed' && {
      reimbursementAmount: finalReimbursementAmount,
      depreciationType,
      depreciationValue
    }),
    status,
    comments,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || '',
    ...(processedAt && { processedAt }),
    ...(monthlyInstallment && { monthlyInstallment }),
    ...(installmentStartDate && { installmentStartDate }),
    ...(installmentEndDate && { installmentEndDate }),
    ...(nextEligibleDate && { nextEligibleDate }),
  };
  
  localStorage.setItem('requests', JSON.stringify(requests));
  
  // Send email notifications based on status change
  try {
    const users = getUsers();
  const userData = users.find(u => u.id === originalRequest.submittedBy);
  if (userData) {
    const updatedRequest = requests[requestIndex];
    
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
  
  return requests[requestIndex];
};

export const getStats = () => {
  const requests = getRequests();
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
export const checkReimbursementEligibility = (employeeId: string): { eligible: boolean; nextEligibleDate?: string; reason?: string } => {
  const users = getUsers();
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
  
  const requests = getRequests();
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
    // In a real app, this would upload to a server
    // For demo, we'll just return a mock filename
    const filename = `${Date.now()}-${file.name}`;
    resolve(filename);
  });
};

export const getFileUrl = (filename: string): string => {
  // In a real app, this would return the actual file URL
  // For demo, we'll return a placeholder
  return `#${filename}`;

};