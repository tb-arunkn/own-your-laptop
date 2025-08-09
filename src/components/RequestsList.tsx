import React from 'react';
import { useState } from 'react';
import { getFileUrl, calculateDepreciation } from '../services/api';
import { FileText, Calendar, DollarSign, User, Eye, CreditCard, Clock, Calculator, AlertTriangle } from 'lucide-react';

import { Request } from '../services/api';

interface RequestsListProps {
  requests: Request[];
  loading: boolean;
  onStatusUpdate?: (id: string, status: string, comments?: string) => void;
  onProcessWithDepreciation?: (id: string, depreciationType: string, depreciationValue: string, comments?: string) => void;
  showActions?: boolean;
  userRole?: string;
}

export const RequestsList: React.FC<RequestsListProps> = ({ 
  requests, 
  loading, 
  onStatusUpdate,
  onProcessWithDepreciation,
  showActions = false,
  userRole
}) => {
  const [depreciationStates, setDepreciationStates] = useState<Record<string, {
    enabled: boolean;
    type: string;
    value: string;
    comments: string;
  }>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpdateStatus = (status: string, role?: string) => {
    if (role === 'it_admin') {
      return status === 'pending';
    }
    if (role === 'finance') {
      return status === 'approved';
    }
    return false;
  };

  const isLaptopOlderThanJoining = (request: Request) => {
    const purchaseDate = new Date(request.laptopPurchaseDate);
    const joiningDate = new Date(request.joiningDate);
    return purchaseDate < joiningDate;
  };

  const getTimeDifference = (request: Request) => {
    const purchaseDate = new Date(request.laptopPurchaseDate);
    const joiningDate = new Date(request.joiningDate);
    const timeDiff = Math.abs(joiningDate.getTime() - purchaseDate.getTime());
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const monthsDiff = Math.floor(daysDiff / 30);
    const yearsDiff = Math.floor(daysDiff / 365);
    
    return { days: daysDiff, months: monthsDiff, years: yearsDiff };
  };

  const calculateDepreciatedAmount = (request: Request, type: string, value: string) => {
    if (!type || !value) return request.reimbursementAmount;
    
    const rate = parseFloat(value) / 100;
    const timeDiff = getTimeDifference(request);
    let periods = 0;
    
    if (type === 'daily') periods = timeDiff.days;
    else if (type === 'monthly') periods = timeDiff.months;
    else if (type === 'yearly') periods = timeDiff.years;
    
    const depreciatedAmount = request.reimbursementAmount * Math.pow(1 - rate, periods);
    return Math.round(depreciatedAmount);
  };

  const updateDepreciationState = (requestId: string, field: string, value: any) => {
    setDepreciationStates(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value
      }
    }));
  };

  const getDepreciationState = (requestId: string) => {
    return depreciationStates[requestId] || {
      enabled: false,
      type: '',
      value: '',
      comments: ''
    };
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    if (newStatus === 'processed' && userRole === 'finance' && onProcessWithDepreciation) {
      const depState = getDepreciationState(id);
      if (depState.enabled && (!depState.type || !depState.value)) {
        alert('Please select depreciation type and rate, or disable depreciation to proceed.');
        return;
      }
      
      onProcessWithDepreciation(
        id, 
        depState.enabled ? depState.type : '', 
        depState.enabled ? depState.value : '', 
        depState.comments || undefined
      );
    } else if (onStatusUpdate) {
      let comments: string | undefined;
      
      if (newStatus === 'rejected') {
        // Comments will be handled in AdminDashboard
        onStatusUpdate(id, newStatus);
      } else if (newStatus === 'paid') {
        comments = prompt('Add comments (optional):') || undefined;
        onStatusUpdate(id, newStatus, comments);
      } else {
        onStatusUpdate(id, newStatus);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
        <p className="text-gray-600">No laptop rental requests have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Request #{request.id.slice(-6)}
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on {new Date(request.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                request.status
              )}`}
            >
              {request.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-medium">{request.employeeId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Purchase Date</p>
                <p className="font-medium">
                  {new Date(request.laptopPurchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Laptop Rental</p>
                <p className="font-medium">₹{request.reimbursementAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Automatic Depreciation Display */}
          {(() => {
            const depreciationInfo = calculateDepreciation(
              request.laptopPurchaseDate,
              request.joiningDate,
              request.reimbursementAmount // Use the actual reimbursement amount
            );
            
            if (depreciationInfo.depreciationApplied) {
              return (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Automatic Depreciation Applied (Device Older Than Joining Date)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-amber-600 font-medium">Laptop Age:</span>
                      <p className="font-bold text-amber-800">
                        {Math.floor(depreciationInfo.monthsOld / 12)} years, {depreciationInfo.monthsOld % 12} months
                      </p>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Depreciation:</span>
                      <p className="font-bold text-amber-800">{depreciationInfo.depreciationPercentage}% (1.67% monthly)</p>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Original Amount:</span>
                      <p className="font-medium">₹{Math.round(request.invoiceAmount * 0.75).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Final Amount:</span>
                      <p className="font-bold text-amber-800">₹{depreciationInfo.depreciatedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>Note:</strong> Depreciation is automatically applied because the laptop was purchased before your joining date. 
                      The system calculates 20% yearly depreciation (1.67% monthly) from purchase date to joining date.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Show installment details for processed requests */}
          {request.status === 'processed' && request.monthlyInstallment && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Installment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Monthly Amount:</span>
                  <p className="font-bold text-blue-800">₹{request.monthlyInstallment.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Start Date:</span>
                  <p className="font-medium">{request.installmentStartDate ? new Date(request.installmentStartDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">End Date:</span>
                  <p className="font-medium">{request.installmentEndDate ? new Date(request.installmentEndDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              {request.nextEligibleDate && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">Next Laptop Rental Request Eligible:</span>
                    <span className="font-medium text-blue-800">
                      {new Date(request.nextEligibleDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{request.category}</span>
            </div>
            <div>
              <span className="text-gray-600">Invoice Amount:</span>
              <span className="ml-2 font-medium">₹{request.invoiceAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{request.email}</span>
            </div>
            {request.depreciationType && request.depreciationValue && (
              <div>
                <span className="text-gray-600">Depreciation:</span>
                <span className="ml-2 font-medium">{request.depreciationValue}% {request.depreciationType}</span>
              </div>
            )}
            {request.invoiceFile && (
              <div>
                <span className="text-gray-600">Invoice:</span>
                <a
                  href={getFileUrl(request.invoiceFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View File
                </a>
              </div>
            )}
            {request.windowsInvoiceFile && (
              <div>
                <span className="text-gray-600">Windows Invoice:</span>
                <a
                  href={getFileUrl(request.windowsInvoiceFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View Windows Invoice
                </a>
              </div>
            )}
          </div>

          {request.comments && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Comments:</p>
              <p className="text-sm">{request.comments}</p>
            </div>
          )}

          {/* Depreciation Section for Finance Team */}
          {userRole === 'finance' && request.status === 'approved' && (() => {
            const depreciationInfo = calculateDepreciation(
              request.laptopPurchaseDate,
              request.joiningDate,
              request.reimbursementAmount
            );
            
            return (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Automatic Depreciation Calculation</h4>
                {depreciationInfo.depreciationApplied && (
                  <div className="flex items-center gap-1 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Depreciation applied: {depreciationInfo.depreciationPercentage}%</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <span className="text-sm text-gray-600">Purchase Date:</span>
                  <p className="font-medium">{new Date(request.laptopPurchaseDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-sm text-gray-600">Joining Date:</span>
                  <p className="font-medium">{new Date(request.joiningDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-sm text-gray-600">Laptop Age:</span>
                  <p className="font-medium">
                    {Math.floor(depreciationInfo.monthsOld / 12)} years, {depreciationInfo.monthsOld % 12} months
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <span className="text-blue-600 font-medium text-sm">Original Amount:</span>
                  <p className="font-bold text-blue-800">₹{request.reimbursementAmount.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <span className="text-amber-600 font-medium text-sm">Depreciation Applied:</span>
                  <p className="font-bold text-amber-800">{depreciationInfo.depreciationPercentage}% (1.67% monthly)</p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <span className="text-green-600 font-medium text-sm">Final Amount:</span>
                  <p className="font-bold text-green-800">₹{depreciationInfo.depreciatedAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="bg-gray-100 p-3 rounded text-sm text-gray-700">
                  <strong>Automatic Depreciation Rule:</strong> 20% yearly (1.67% monthly) is automatically applied for devices purchased before joining date. 
                  {depreciationInfo.depreciationApplied 
                    ? ` This device is ${Math.floor(depreciationInfo.monthsOld / 12)} years, ${depreciationInfo.monthsOld % 12} months older than joining date, so ${depreciationInfo.depreciationPercentage}% depreciation is applied.`
                    : ' No depreciation applied as device was purchased after joining date.'
                  }
                </div>
              </div>
              
              <div className="mt-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={getDepreciationState(request.id).comments}
                    onChange={(e) => updateDepreciationState(request.id, 'comments', e.target.value)}
                    rows={2}
                    placeholder="Add any comments about processing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
            );
          })()}

          {showActions && canUpdateStatus(request.status, userRole) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              {userRole === 'it_admin' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              {userRole === 'finance' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'processed')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Mark as Processed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'paid')}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};