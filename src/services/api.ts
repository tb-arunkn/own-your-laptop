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
    name: userData.email.split('@')[0], // Use email prefix as default name
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
  
  const now = new Date();
  let processedAt, monthlyInstallment, installmentStartDate, installmentEndDate, nextEligibleDate;
  
  // If status is being changed to 'processed', calculate installment details
  if (status === 'processed') {
    processedAt = now.toISOString();
    
    // Calculate final reimbursement amount with depreciation if applicable
    let finalReimbursementAmount = requests[requestIndex].reimbursementAmount;
    
    if (depreciationType && depreciationValue) {
      const purchaseDate = new Date(requests[requestIndex].laptopPurchaseDate);
      const joiningDate = new Date(requests[requestIndex].joiningDate);
      const depreciationRate = parseFloat(depreciationValue) / 100;
      
      if (depreciationType === 'monthly') {
        const monthsDiff = Math.floor((joiningDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        finalReimbursementAmount = finalReimbursementAmount * Math.pow(1 - depreciationRate, monthsDiff);
      } else if (depreciationType === 'yearly') {
        const yearsDiff = Math.floor((joiningDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        finalReimbursementAmount = finalReimbursementAmount * Math.pow(1 - depreciationRate, yearsDiff);
      }
      
      finalReimbursementAmount = Math.round(finalReimbursementAmount);
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
    ...(status === 'processed' && depreciationType && depreciationValue && {
      reimbursementAmount: Math.round(
        (() => {
          let amount = requests[requestIndex].reimbursementAmount;
          const purchaseDate = new Date(requests[requestIndex].laptopPurchaseDate);
          const joiningDate = new Date(requests[requestIndex].joiningDate);
          const depreciationRate = parseFloat(depreciationValue) / 100;
          
          if (depreciationType === 'monthly') {
            const monthsDiff = Math.floor((joiningDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            amount = amount * Math.pow(1 - depreciationRate, monthsDiff);
          } else if (depreciationType === 'yearly') {
            const yearsDiff = Math.floor((joiningDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
            amount = amount * Math.pow(1 - depreciationRate, yearsDiff);
          }
          
          return amount;
        })()
      ),
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
    const now = new Date();
    
    if (now < nextEligibleDate) {
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