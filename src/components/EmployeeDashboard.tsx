import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReimbursementForm } from './ReimbursementForm';
import { RequestsList } from './RequestsList';
import { getRequests, Request, checkReimbursementEligibility } from '../services/api';
import { Plus, FileText, AlertCircle } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'requests'>('requests');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; nextEligibleDate?: string; reason?: string }>({ eligible: true });
  const { user } = useAuth();

  const fetchRequests = async () => {
    try {
      const allRequests = getRequests();
      // Filter requests for current user
      const userRequests = allRequests.filter(req => req.submittedBy === user?.id);
      setRequests(userRequests);
      
      // Check reimbursement eligibility
      if (user?.employeeId) {
        const eligibilityCheck = checkReimbursementEligibility(user.employeeId);
        setEligibility(eligibilityCheck);
        
        // Also check 15-day joining requirement
        if (eligibilityCheck.eligible && user.joiningDate) {
          const joiningDate = new Date(user.joiningDate);
          const today = new Date();
          const daysSinceJoining = Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceJoining < 15) {
            const eligibleDate = new Date(joiningDate);
            eligibleDate.setDate(eligibleDate.getDate() + 15);
            setEligibility({
              eligible: false,
              nextEligibleDate: eligibleDate.toISOString(),
              reason: `You need to complete 15 days of service before applying. You can apply from ${eligibleDate.toLocaleDateString()}.`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestSubmitted = () => {
    fetchRequests();
    setActiveTab('requests');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Dashboard</h2>
        <p className="text-gray-600">Submit and track your laptop rental requests</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          My Requests
        </button>
        <button
          onClick={() => setActiveTab('form')}
          disabled={!eligibility.eligible}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-blue-600 text-white' 
              : !eligibility.eligible
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {!eligibility.eligible && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Laptop Request Not Available</h4>
              <p className="text-sm text-yellow-700">{eligibility.reason}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'form' ? (
        eligibility.eligible ? (
          <ReimbursementForm onSubmitted={handleRequestSubmitted} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">New Request Not Available</h3>
            <p className="text-gray-600">{eligibility.reason}</p>
          </div>
        )
      ) : (
        <RequestsList requests={requests} loading={loading} />
      )}
    </div>
  );
};