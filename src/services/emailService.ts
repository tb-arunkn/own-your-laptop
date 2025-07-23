interface EmailData {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
}

interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// Get SMTP settings from localStorage
export const getSMTPSettings = (): SMTPSettings | null => {
  const settings = localStorage.getItem('smtpSettings');
  return settings ? JSON.parse(settings) : null;
};

// Get email templates from localStorage
export const getEmailTemplates = (): EmailTemplate[] => {
  const templates = localStorage.getItem('emailTemplates');
  return templates ? JSON.parse(templates) : [];
};

// Replace variables in template
const replaceVariables = (template: string, variables: Record<string, string>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value || '');
  });
  return result;
};

// Send email (mock implementation)
const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  const smtpSettings = getSMTPSettings();
  
  if (!smtpSettings) {
    console.error('SMTP settings not configured');
    return false;
  }

  try {
    // In a real application, this would use a proper email service
    // For demo purposes, we'll just log the email details
    console.log('📧 Email sent:', {
      from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject,
      body: emailData.body,
      smtp: {
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure
      }
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Email workflow functions
export const sendRequestSubmittedEmail = async (requestData: any, userData: any): Promise<boolean> => {
  const templates = getEmailTemplates();
  const template = templates.find(t => t.id === 'request_submitted');
  
  if (!template) {
    console.error('Request submitted email template not found');
    return false;
  }

  const variables = {
    userName: userData.name,
    requestId: requestData.id.slice(-6),
    employeeId: requestData.employeeId,
    category: requestData.category,
    invoiceAmount: requestData.invoiceAmount.toLocaleString(),
    reimbursementAmount: requestData.reimbursementAmount.toLocaleString(),
    submittedDate: new Date(requestData.submittedAt).toLocaleDateString()
  };

  const subject = replaceVariables(template.subject, variables);
  const body = replaceVariables(template.body, variables);

  // Get IT Admin emails
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const itAdmins = users.filter((u: any) => u.role === 'it_admin');
  const itAdminEmails = itAdmins.map((admin: any) => admin.email);

  return await sendEmail({
    to: [userData.email, ...itAdminEmails],
    subject,
    body
  });
};

export const sendRequestApprovedEmail = async (requestData: any, userData: any, comments: string = ''): Promise<boolean> => {
  const templates = getEmailTemplates();
  const template = templates.find(t => t.id === 'request_approved');
  
  if (!template) {
    console.error('Request approved email template not found');
    return false;
  }

  const variables = {
    userName: userData.name,
    requestId: requestData.id.slice(-6),
    employeeId: requestData.employeeId,
    category: requestData.category,
    reimbursementAmount: requestData.reimbursementAmount.toLocaleString(),
    comments: comments || 'No additional comments'
  };

  const subject = replaceVariables(template.subject, variables);
  const body = replaceVariables(template.body, variables);

  // Get Finance team emails
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const financeUsers = users.filter((u: any) => u.role === 'finance');
  const financeEmails = financeUsers.map((user: any) => user.email);

  return await sendEmail({
    to: [userData.email],
    cc: financeEmails,
    subject,
    body
  });
};

export const sendRequestRejectedEmail = async (requestData: any, userData: any, comments: string = ''): Promise<boolean> => {
  const templates = getEmailTemplates();
  const template = templates.find(t => t.id === 'request_rejected');
  
  if (!template) {
    console.error('Request rejected email template not found');
    return false;
  }

  const variables = {
    userName: userData.name,
    requestId: requestData.id.slice(-6),
    employeeId: requestData.employeeId,
    category: requestData.category,
    comments: comments || 'No reason provided'
  };

  const subject = replaceVariables(template.subject, variables);
  const body = replaceVariables(template.body, variables);

  return await sendEmail({
    to: [userData.email],
    subject,
    body
  });
};

export const sendRequestProcessedEmail = async (requestData: any, userData: any, comments: string = ''): Promise<boolean> => {
  const templates = getEmailTemplates();
  const template = templates.find(t => t.id === 'request_processed');
  
  if (!template) {
    console.error('Request processed email template not found');
    return false;
  }

  const variables = {
    userName: userData.name,
    requestId: requestData.id.slice(-6),
    employeeId: requestData.employeeId,
    finalAmount: requestData.reimbursementAmount.toLocaleString(),
    monthlyInstallment: requestData.monthlyInstallment?.toLocaleString() || '0',
    startDate: requestData.installmentStartDate ? new Date(requestData.installmentStartDate).toLocaleDateString() : 'TBD',
    endDate: requestData.installmentEndDate ? new Date(requestData.installmentEndDate).toLocaleDateString() : 'TBD',
    nextEligibilityDate: requestData.nextEligibleDate ? new Date(requestData.nextEligibleDate).toLocaleDateString() : 'TBD',
    comments: comments || 'No additional comments'
  };

  const subject = replaceVariables(template.subject, variables);
  const body = replaceVariables(template.body, variables);

  // Get IT Admin and Finance emails
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const itAdmins = users.filter((u: any) => u.role === 'it_admin');
  const financeUsers = users.filter((u: any) => u.role === 'finance');
  const adminEmails = [...itAdmins, ...financeUsers].map((user: any) => user.email);

  return await sendEmail({
    to: [userData.email],
    cc: adminEmails,
    subject,
    body
  });
};