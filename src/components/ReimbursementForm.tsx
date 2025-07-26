import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveRequest, uploadFile } from '../services/api';
import { Upload, Calculator, AlertCircle, CheckCircle } from 'lucide-react';

interface ReimbursementFormProps {
  onSubmitted: () => void;
}

export const ReimbursementForm: React.FC<ReimbursementFormProps> = ({ onSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: user?.employeeId || '',
    joiningDate: user?.joiningDate || '',
    email: user?.email || '',
    laptopPurchaseDate: '',
    category: 'Developer',
    invoiceAmount: '',
    depreciationType: '',
    depreciationValue: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'invoiceAmount' || name === 'category') {
      calculateReimbursement({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const calculateReimbursement = (data: typeof formData) => {
    if (!data.invoiceAmount) {
      return;
    }

    const invoiceAmount = parseFloat(data.invoiceAmount);
    const maxAmount = data.category === 'Developer' ? 82000 : 72000;
    const reimbursement = Math.min(invoiceAmount * 0.75, maxAmount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Check eligibility (365+ days)
    const joining = new Date(formData.joiningDate);
    const today = new Date();
    const daysSinceJoining = Math.floor((today.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceJoining < 365) {
      newErrors.joiningDate = 'Employee must be working for more than 365 days (1 year)';
    }

    // Check laptop purchase date
    if (!formData.laptopPurchaseDate) {
      newErrors.laptopPurchaseDate = 'Required';
    } else {
      const purchaseDate = new Date(formData.laptopPurchaseDate);
      const joiningDate = new Date(formData.joiningDate);
      
      if (purchaseDate > today) {
        newErrors.laptopPurchaseDate = 'Purchase date cannot be in the future';
      }
    }

    if (!formData.invoiceAmount) newErrors.invoiceAmount = 'Required';
    if (!file) newErrors.file = 'Invoice file is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Upload file if provided
      let invoiceFile: string | undefined;
      if (file) {
        invoiceFile = await uploadFile(file);
      }

      // Calculate reimbursement amount
      const invoiceAmount = parseFloat(formData.invoiceAmount);
      const maxAmount = formData.category === 'Developer' ? 82000 : 72000;
      const reimbursementAmount = Math.min(invoiceAmount * 0.75, maxAmount);

      // Save request
      saveRequest({
        ...formData,
        invoiceAmount: invoiceAmount,
        reimbursementAmount: reimbursementAmount,
        invoiceFile,
        status: 'pending',
        submittedBy: user?.id || '',
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-800 mb-2">Request Submitted Successfully!</h3>
          <p className="text-green-700">Your laptop rental request has been submitted and is pending IT admin approval.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Submit Laptop Rental Request</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employeeId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={formData.joiningDate}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              {errors.joiningDate && (
                <p className="mt-1 text-sm text-red-600">{errors.joiningDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laptop Purchase Date *
              </label>
              <input
                type="date"
                name="laptopPurchaseDate"
                value={formData.laptopPurchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.laptopPurchaseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.laptopPurchaseDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Developer">Developer (Max: ₹82,000)</option>
                <option value="Non-Developer">Non-Developer (Max: ₹72,000)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Amount (₹) *
              </label>
              <input
                type="number"
                name="invoiceAmount"
                value={formData.invoiceAmount}
                onChange={handleChange}
                placeholder="Enter invoice amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.invoiceAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceAmount}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Invoice *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                {file && (
                  <p className="text-sm text-green-600">Selected: {file.name}</p>
                )}
              </div>
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{errors.submit}</p>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};