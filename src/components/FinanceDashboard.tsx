import React, { useState, useEffect } from 'react';
import { RequestsList } from './RequestsList';
import { StatsCards } from './StatsCards';
import { getRequests, getStats, updateRequestStatus, Request } from '../services/api';
import { DollarSign, Clock, CheckCircle, CreditCard } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
  paid: number;
}

export const FinanceDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('approved');

  const fetchData = async () => {
    try {
      const requestsData = getRequests();
      const statsData = getStats();
      
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id: string, status: string, comments?: string) => {
    try {
      const updatedRequest = updateRequestStatus(id, status, comments, 'Finance Team');
      if (updatedRequest) {
        fetchData(); // Refresh data
      } else {
        alert('Error: Request not found');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update request status');
    }
  };

  const handleProcessWithDepreciation = async (
    id: string, 
    depreciationType: string, 
    depreciationValue: string, 
    comments?: string
  ) => {
    try {
      const updatedRequest = updateRequestStatus(
        id, 
        'processed', 
        comments, 
        'Finance Team',
        depreciationType,
        depreciationValue
      );
      if (updatedRequest) {
        fetchData(); // Refresh data
      } else {
        alert('Error: Request not found');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Failed to process request');
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const totalReimbursementAmount = requests
    .filter(req => ['approved', 'processed', 'paid'].includes(req.status))
    .reduce((sum, req) => sum + req.reimbursementAmount, 0);

  const statsCards = stats ? [
    {
      title: 'Total Amount',
      value: `₹${totalReimbursementAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Awaiting Processing',
      value: stats.approved,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Processed',
      value: stats.processed,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Paid',
      value: stats.paid,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finance Dashboard</h2>
        <p className="text-gray-600">Process approved laptop rental requests</p>
      </div>

      <StatsCards cards={statsCards} loading={loading} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
            Approved Requests
          </h3>
          
          <div className="flex gap-2">
            {['approved', 'processed', 'paid', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && stats && (
                  <span className="ml-1">({stats[status as keyof Stats]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <RequestsList 
          requests={filteredRequests}
          loading={loading}
          onStatusUpdate={handleStatusUpdate}
          onProcessWithDepreciation={handleProcessWithDepreciation}
          showActions={true}
          userRole="finance"
        />
      </div>
    </div>
  );
};