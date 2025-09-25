import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

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

const defaultSMTPSettings: SMTPSettings = {
  host: '',
  port: 587,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Own Your Laptop Portal',
  secure: true
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
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates'>('smtp');
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>(defaultSMTPSettings);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSMTP = localStorage.getItem('smtpSettings');
    const savedTemplates = localStorage.getItem('emailTemplates');
    
    if (savedSMTP) {
      setSMTPSettings(JSON.parse(savedSMTP));
    }
    
    if (savedTemplates) {
      setEmailTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const handleSMTPChange = (field: keyof SMTPSettings, value: string | number | boolean) => {
    setSMTPSettings(prev => ({ ...prev, [field]: value }));
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
        </div>
      </div>
    </div>
  );
};