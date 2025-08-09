import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveRequest, uploadFile, calculateDepreciation } from '../services/api';
import { Upload, Calculator, AlertCircle, CheckCircle, TrendingDown, Calendar } from 'lucide-react';

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
    hasWindowsPro: false,
    windowsProAmount: '',
    depreciationType: '',
    depreciationValue: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [windowsFile, setWindowsFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [depreciationInfo, setDepreciationInfo] = useState<any>(null);
  const [reimbursementAmount, setReimbursementAmount] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Clear Windows Pro amount if checkbox is unchecked
    if (name === 'hasWindowsPro' && !newValue) {
      setFormData(prev => ({ ...prev, windowsProAmount: '' }));
      setWindowsFile(null);
      setErrors(prev => ({ ...prev, windowsProAmount: '', windowsFile: '' }));
    }
    
    if (name === 'invoiceAmount' || name === 'category' || name === 'laptopPurchaseDate' || name === 'windowsProAmount') {
      calculateReimbursement({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleWindowsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWindowsFile(e.target.files[0]);
      setErrors(prev => ({ ...prev, windowsFile: '' }));
    }
  };
  const calculateReimbursement = (data: typeof formData) => {
    if (!data.invoiceAmount || !data.laptopPurchaseDate) {
      setDepreciationInfo(null);
      setReimbursementAmount(0);
      return;
    }

    const invoiceAmount = parseFloat(data.invoiceAmount);
    const windowsAmount = data.hasWindowsPro && data.windowsProAmount ? parseFloat(data.windowsProAmount) : 0;
    const totalInvoiceAmount = invoiceAmount + windowsAmount;
    
    const maxAmount = data.category === 'Developer' ? 82000 : 72000;
    const baseReimbursement = Math.min(totalInvoiceAmount * 0.75, maxAmount);
    
    // Calculate depreciation
    const depreciation = calculateDepreciation(
      data.laptopPurchaseDate,
      data.joiningDate,
      baseReimbursement,
      true // Include monthly breakdown
    );
    
    setDepreciationInfo(depreciation);
    setReimbursementAmount(depreciation.depreciatedAmount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Check eligibility (15+ days)
    const joining = new Date(formData.joiningDate);
    const today = new Date();
    const daysSinceJoining = Math.floor((today.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceJoining < 15) {
      newErrors.joiningDate = 'Employee must be working for more than 15 days';
    }

    // Check laptop purchase date
    if (!formData.laptopPurchaseDate) {
      newErrors.laptopPurchaseDate = 'Required';
    } else {
      const purchaseDate = new Date(formData.laptopPurchaseDate);
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      
      if (purchaseDate > today) {
        newErrors.laptopPurchaseDate = 'Purchase date cannot be in the future';
      } else {
        // Check if invoice date is within 365 days of joining date
        const timeDiff = Math.abs(purchaseDate.getTime() - joiningDate.getTime());
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 365) {
          newErrors.laptopPurchaseDate = 'Invoice date cannot be more than 365 days from joining date';
        }
      }
    }

    if (!formData.invoiceAmount) newErrors.invoiceAmount = 'Required';
    
    // Windows Pro validation
    if (formData.hasWindowsPro) {
      if (!formData.windowsProAmount) {
        newErrors.windowsProAmount = 'Windows Pro amount is required';
      } else {
        const windowsAmount = parseFloat(formData.windowsProAmount);
        if (windowsAmount <= 0) {
          newErrors.windowsProAmount = 'Amount must be greater than 0';
        }
      }
      if (!windowsFile) {
        newErrors.windowsFile = 'Windows Pro invoice is required';
      }
    }
    
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
      let windowsInvoiceFile: string | undefined;
      
      if (file) {
        invoiceFile = await uploadFile(file);
      }
      
      if (windowsFile) {
        windowsInvoiceFile = await uploadFile(windowsFile);
      }

      // Calculate reimbursement amount
      const invoiceAmount = parseFloat(formData.invoiceAmount);
      const windowsAmount = formData.hasWindowsPro && formData.windowsProAmount ? parseFloat(formData.windowsProAmount) : 0;
      const totalInvoiceAmount = invoiceAmount + windowsAmount;
      
      const finalReimbursementAmount = reimbursementAmount || (() => {
        const maxAmount = formData.category === 'Developer' ? 82000 : 72000;
        return Math.min(totalInvoiceAmount * 0.75, maxAmount);
      })();

      // Save request
      saveRequest({
        ...formData,
        invoiceAmount: totalInvoiceAmount,
        windowsProAmount: windowsAmount,
        reimbursementAmount: finalReimbursementAmount,
        invoiceFile,
        windowsInvoiceFile,
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
            
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="hasWindowsPro"
                  name="hasWindowsPro"
                  checked={formData.hasWindowsPro}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasWindowsPro" className="text-sm font-medium text-gray-700">
                  I have purchased Windows Pro upgrade separately
                </label>
              </div>
              
              {formData.hasWindowsPro && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Windows Pro Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="windowsProAmount"
                      value={formData.windowsProAmount}
                      onChange={handleChange}
                      placeholder="Enter Windows Pro cost"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.windowsProAmount && (
                      <p className="mt-1 text-sm text-red-600">{errors.windowsProAmount}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Windows Pro Invoice *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="windows-file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                            <span>Upload Windows invoice</span>
                            <input
                              id="windows-file-upload"
                              name="windows-file-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleWindowsFileChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                        {windowsFile && (
                          <p className="text-sm text-green-600">Selected: {windowsFile.name}</p>
                        )}
                      </div>
                    </div>
                    {errors.windowsFile && (
                      <p className="mt-1 text-sm text-red-600">{errors.windowsFile}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Depreciation Calculation Display */}
          {depreciationInfo && formData.invoiceAmount && formData.laptopPurchaseDate && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Reimbursement Calculation</h4>
                  <p className="text-sm text-blue-700">Live calculation based on your inputs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">
                    {formData.hasWindowsPro ? 'Total Invoice Amount' : 'Invoice Amount'}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{(parseFloat(formData.invoiceAmount) + (formData.hasWindowsPro && formData.windowsProAmount ? parseFloat(formData.windowsProAmount) : 0)).toLocaleString()}
                  </div>
                  {formData.hasWindowsPro && formData.windowsProAmount && (
                    <div className="text-xs text-gray-500 mt-1">
                      Laptop: ₹{parseFloat(formData.invoiceAmount).toLocaleString()} + Windows: ₹{parseFloat(formData.windowsProAmount).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">75% Eligible Amount</div>
                  <div className="text-lg font-bold text-blue-600">
                    ₹{Math.min((parseFloat(formData.invoiceAmount) + (formData.hasWindowsPro && formData.windowsProAmount ? parseFloat(formData.windowsProAmount) : 0)) * 0.75, formData.category === 'Developer' ? 82000 : 72000).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-sm text-gray-600 mb-1">Final Reimbursement</div>
                  <div className="text-lg font-bold text-green-600">₹{reimbursementAmount.toLocaleString()}</div>
                </div>
              </div>
              
              {depreciationInfo.depreciationApplied && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-5 w-5 text-amber-600" />
                    <h5 className="font-medium text-amber-800">Depreciation Applied</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-amber-600">Device Age</div>
                      <div className="font-semibold text-amber-800">
                        {Math.floor(depreciationInfo.monthsOld / 12)} years, {depreciationInfo.monthsOld % 12} months
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-amber-600">Depreciation Rate</div>
                      <div className="font-semibold text-amber-800">{depreciationInfo.depreciationPercentage}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-amber-600">Amount Reduced</div>
                      <div className="font-semibold text-amber-800">
                        ₹{(Math.min(parseFloat(formData.invoiceAmount) * 0.75, formData.category === 'Developer' ? 82000 : 72000) - reimbursementAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded">
                    <strong>Why depreciation?</strong> Your laptop was purchased before your joining date. 
                    We apply 20% yearly depreciation (1.67% monthly) to account for the device's age at the time you joined.
                  </div>
                </div>
              )}
              
              {!depreciationInfo.depreciationApplied && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h5 className="font-medium text-green-800">No Depreciation Applied</h5>
                  </div>
                  <div className="text-sm text-green-700">
                    Your laptop was purchased after your joining date, so you'll receive the full eligible amount.
                  </div>
                </div>
              )}
            </div>
          )}
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