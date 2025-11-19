import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Save, TestTube, CheckCircle, AlertCircle, Shield, Key, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

interface EntraIDSettings {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedDomains: string[];
}

const defaultSMTPSettings: SMTPSettings = {
  host: '',
  port: 587,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Own Your Laptop Portal',
  secure: true
};

const defaultEntraIDSettings: EntraIDSettings = {
  enabled: false,
  tenantId: '',
  clientId: '',
  clientSecret: '',
  redirectUri: '',
  allowedDomains: []
};

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'request_submitted',
    name: 'Request Submitted',
    subject: 'Laptop Reimbursement Request Submitted - #{requestId}',
    body: `Dear {userName},

Your laptop reimbursement request has been successfully submitted.

Request Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Category: {category}
- Invoice Amount: ₹{invoiceAmount}
- Reimbursement Amount: ₹{reimbursementAmount}
- Submitted Date: {submittedDate}

Your request is now pending IT Admin approval. You will receive an email notification once the status is updated.

Best regards,
Own Your Laptop Portal Team`,
    variables: ['userName', 'requestId', 'employeeId', 'category', 'invoiceAmount', 'reimbursementAmount', 'submittedDate']
  },
  {
    id: 'request_approved',
    name: 'Request Approved by IT Admin',
    subject: 'Laptop Reimbursement Request Approved - #{requestId}',
    body: `Dear {userName},

Great news! Your laptop reimbursement request has been approved by IT Admin.

Request Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Category: {category}
- Approved Amount: ₹{reimbursementAmount}
- IT Admin Comments: {comments}

Your request is now forwarded to the Finance team for processing. You will receive another notification once the payment is processed.

Best regards,
Own Your Laptop Portal Team`,
    variables: ['userName', 'requestId', 'employeeId', 'category', 'reimbursementAmount', 'comments']
  },
  {
    id: 'request_rejected',
    name: 'Request Rejected by IT Admin',
    subject: 'Laptop Reimbursement Request Rejected - #{requestId}',
    body: `Dear {userName},

We regret to inform you that your laptop reimbursement request has been rejected by IT Admin.

Request Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Category: {category}
- Rejection Reason: {comments}

If you have any questions or would like to discuss this decision, please contact the IT Admin team.

Best regards,
Own Your Laptop Portal Team`,
    variables: ['userName', 'requestId', 'employeeId', 'category', 'comments']
  },
  {
    id: 'request_processed',
    name: 'Request Processed by Finance',
    subject: 'Laptop Reimbursement Processed - #{requestId}',
    body: `Dear {userName},

Your laptop reimbursement request has been successfully processed by the Finance team.

Final Processing Details:
- Request ID: #{requestId}
- Employee ID: {employeeId}
- Final Approved Amount: ₹{finalAmount}
- Monthly Installment: ₹{monthlyInstallment}
- Installment Start Date: {startDate}
- Installment End Date: {endDate}
- Next Eligibility Date: {nextEligibilityDate}
- Finance Comments: {comments}

The monthly installments will be added to your salary starting from {startDate}. You will be eligible for your next laptop reimbursement request after {nextEligibilityDate}.

Best regards,
Own Your Laptop Portal Team`,
    variables: ['userName', 'requestId', 'employeeId', 'finalAmount', 'monthlyInstallment', 'startDate', 'endDate', 'nextEligibilityDate', 'comments']
  }
];

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'sso'>('smtp');
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>(defaultSMTPSettings);
  const [entraIDSettings, setEntraIDSettings] = useState<EntraIDSettings>(defaultEntraIDSettings);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [testingSSO, setTestingSSO] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSMTP = localStorage.getItem('smtpSettings');
    const savedEntraID = localStorage.getItem('entraIDSettings');
    const savedTemplates = localStorage.getItem('emailTemplates');
    
    if (savedSMTP) {
      setSMTPSettings(JSON.parse(savedSMTP));
    }
    
    if (savedEntraID) {
      setEntraIDSettings(JSON.parse(savedEntraID));
    }
    
    if (savedTemplates) {
      setEmailTemplates(JSON.parse(savedTemplates));
    }
    
    // Load company logo
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);

  const handleSMTPChange = (field: keyof SMTPSettings, value: string | number | boolean) => {
    setSMTPSettings(prev => ({ ...prev, [field]: value }));
    setSuccess(null);
    setError(null);
  };

  const handleEntraIDChange = (field: keyof EntraIDSettings, value: string | boolean | string[]) => {
    setEntraIDSettings(prev => ({ ...prev, [field]: value }));
    setSuccess(null);
    setError(null);
  };

  const handleTemplateChange = (templateId: string, field: 'subject' | 'body', value: string) => {
    setEmailTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, [field]: value }
        : template
    ));
    setSuccess(null);
    setError(null);
  };

  const saveSMTPSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
        throw new Error('Please fill in all required SMTP fields');
      }
      
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem('smtpSettings', JSON.stringify(smtpSettings));
      
      setSuccess('SMTP settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const saveEntraIDSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields if SSO is enabled
      if (entraIDSettings.enabled) {
        if (!entraIDSettings.tenantId || !entraIDSettings.clientId || !entraIDSettings.clientSecret) {
          throw new Error('Please fill in all required Entra ID fields when SSO is enabled');
        }
      }
      
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem('entraIDSettings', JSON.stringify(entraIDSettings));
      
      setSuccess('Entra ID SSO settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Entra ID settings');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem('emailTemplates', JSON.stringify(emailTemplates));
      
      setSuccess('Email templates saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email templates');
    } finally {
      setLoading(false);
    }
  };

  const testSMTPConnection = async () => {
    setTestingEmail(true);
    setError(null);
    
    try {
      // In a real app, this would test the SMTP connection
      // For demo, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('SMTP connection test successful! Test email sent.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('SMTP connection test failed. Please check your settings.');
    } finally {
      setTestingEmail(false);
    }
  };

  const testSSOConnection = async () => {
    setTestingSSO(true);
    setError(null);
    
    try {
      // In a real app, this would test the Entra ID connection
      // For demo, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Entra ID SSO connection test successful!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Entra ID SSO connection test failed. Please check your settings.');
    } finally {
      setTestingSSO(false);
    }
  };

  const handleDomainAdd = (domain: string) => {
    if (domain.trim() && !entraIDSettings.allowedDomains.includes(domain.trim())) {
      const newDomains = [...entraIDSettings.allowedDomains, domain.trim()];
      handleEntraIDChange('allowedDomains', newDomains);
    }
  };

  const handleDomainRemove = (domainToRemove: string) => {
    const newDomains = entraIDSettings.allowedDomains.filter(domain => domain !== domainToRemove);
    handleEntraIDChange('allowedDomains', newDomains);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      
      setLogoFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCompanyLogo = async () => {
    if (!logoFile && !logoPreview) {
      setError('Please select a logo image');
      return;
    }
    
    setUploadingLogo(true);
    setError(null);
    
    try {
      if (logoFile) {
        // In a real app, this would upload to a server
        // For demo, we'll save the base64 data to localStorage
        const reader = new FileReader();
        reader.onload = (e) => {
          const logoData = e.target?.result as string;
          localStorage.setItem('companyLogo', logoData);
          setSuccess('Company logo uploaded successfully');
          setTimeout(() => setSuccess(null), 3000);
          setLogoFile(null);
        };
        reader.readAsDataURL(logoFile);
      } else {
        setSuccess('Company logo settings saved');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to upload company logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeCompanyLogo = () => {
    if (confirm('Are you sure you want to remove the company logo?')) {
      localStorage.removeItem('companyLogo');
      setLogoPreview(null);
      setLogoFile(null);
      setSuccess('Company logo removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Configure SMTP settings and email templates for automated notifications</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'smtp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                SMTP Settings
              </div>
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'branding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Branding
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Templates
              </div>
            </button>
            {user?.role === 'it_admin' && (
              <button
                onClick={() => setActiveTab('sso')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sso'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  SSO Settings
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure your SMTP server settings to enable automated email notifications
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.host}
                    onChange={(e) => handleSMTPChange('host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={smtpSettings.port}
                    onChange={(e) => handleSMTPChange('port', parseInt(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.username}
                    onChange={(e) => handleSMTPChange('username', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={smtpSettings.password}
                    onChange={(e) => handleSMTPChange('password', e.target.value)}
                    placeholder="your-app-password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email *
                  </label>
                  <input
                    type="email"
                    value={smtpSettings.fromEmail}
                    onChange={(e) => handleSMTPChange('fromEmail', e.target.value)}
                    placeholder="noreply@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.fromName}
                    onChange={(e) => handleSMTPChange('fromName', e.target.value)}
                    placeholder="Own Your Laptop Portal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="secure"
                  checked={smtpSettings.secure}
                  onChange={(e) => handleSMTPChange('secure', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="secure" className="text-sm text-gray-700">
                  Use secure connection (TLS/SSL)
                </label>
              </div>

              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveSMTPSettings}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>

                <button
                  onClick={testSMTPConnection}
                  disabled={testingEmail || !smtpSettings.host}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <TestTube className="h-4 w-4" />
                  {testingEmail ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Customize email templates for different workflow stages. Use variables like {'{userName}'}, {'{requestId}'}, etc.
                </p>
              </div>

              <div className="space-y-6">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">
                          Available variables: {(template.variables || []).map(v => `{${v}}`).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingTemplate(editingTemplate === template.id ? null : template.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        {editingTemplate === template.id ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Line
                        </label>
                        {editingTemplate === template.id ? (
                          <input
                            type="text"
                            value={template.subject}
                            onChange={(e) => handleTemplateChange(template.id, 'subject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{template.subject}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Body
                        </label>
                        {editingTemplate === template.id ? (
                          <textarea
                            value={template.body}
                            onChange={(e) => handleTemplateChange(template.id, 'body', e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          />
                        ) : (
                          <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">
                            {template.body}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={saveEmailTemplates}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Templates'}
              </button>
            </div>
          )}

          {activeTab === 'sso' && user?.role === 'it_admin' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Entra ID Single Sign-On</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure Microsoft Entra ID (formerly Azure AD) for single sign-on authentication
                </p>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="sso-enabled"
                  checked={entraIDSettings.enabled}
                  onChange={(e) => handleEntraIDChange('enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sso-enabled" className="text-sm font-medium text-gray-700">
                  Enable Entra ID Single Sign-On
                </label>
              </div>

              {entraIDSettings.enabled && (
                <div className="space-y-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tenant ID *
                      </label>
                      <input
                        type="text"
                        value={entraIDSettings.tenantId}
                        onChange={(e) => handleEntraIDChange('tenantId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your Azure AD tenant identifier</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID (Application ID) *
                      </label>
                      <input
                        type="text"
                        value={entraIDSettings.clientId}
                        onChange={(e) => handleEntraIDChange('clientId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Application ID from Azure AD app registration</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Secret *
                      </label>
                      <input
                        type="password"
                        value={entraIDSettings.clientSecret}
                        onChange={(e) => handleEntraIDChange('clientSecret', e.target.value)}
                        placeholder="Enter client secret"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Client secret from Azure AD app registration</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redirect URI
                      </label>
                      <input
                        type="url"
                        value={entraIDSettings.redirectUri}
                        onChange={(e) => handleEntraIDChange('redirectUri', e.target.value)}
                        placeholder="https://yourapp.com/auth/callback"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">OAuth redirect URI configured in Azure AD</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Email Domains
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., company.com"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleDomainAdd((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                            handleDomainAdd(input.value);
                            input.value = '';
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      
                      {entraIDSettings.allowedDomains.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entraIDSettings.allowedDomains.map((domain, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {domain}
                              <button
                                type="button"
                                onClick={() => handleDomainRemove(domain)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Only users with email addresses from these domains will be allowed to sign in via SSO
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Configuration Requirements</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Register your application in Azure AD</li>
                          <li>• Configure redirect URI in Azure AD app registration</li>
                          <li>• Grant necessary API permissions (User.Read, etc.)</li>
                          <li>• Generate and securely store client secret</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveEntraIDSettings}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save SSO Settings'}
                </button>

                {entraIDSettings.enabled && (
                  <button
                    onClick={testSSOConnection}
                    disabled={testingSSO || !entraIDSettings.tenantId || !entraIDSettings.clientId}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    {testingSSO ? 'Testing...' : 'Test SSO Connection'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};