import React, { useState, useEffect } from 'react';
import { StatsCards } from './StatsCards';
import { getRequests, getStats, getUsers } from '../services/api';
import { FileText, Clock, CheckCircle, XCircle, Users, DollarSign, CreditCard } from 'lucide-react';

interface DashboardOverviewProps {
  userRole: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ userRole }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = getStats();
        const requests = getRequests();
        const users = getUsers();
        
        // Get recent requests (last 5)
        const recent = requests
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5);
        
        setStats({
          ...statsData,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.isActive !== false).length,
          totalAmount: requests
            .filter(req => ['approved', 'processed', 'paid'].includes(req.status))
            .reduce((sum, req) => sum + req.reimbursementAmount, 0)
        });
        setRecentRequests(recent);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatsCards = () => {
    if (!stats) return [];

    if (userRole === 'it_admin') {
      return [
        {
          title: 'Total Requests',
          value: stats.total,
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Pending Review',
          value: stats.pending,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        },
        {
          title: 'Total Users',
          value: stats.totalUsers,
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Active Users',
          value: stats.activeUsers,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
      ];
    } else if (userRole === 'finance') {
      return [
        {
          title: 'Total Amount',
          value: `₹${stats.totalAmount.toLocaleString()}`,
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
      ];
    }

    return [];
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">
          {userRole === 'it_admin' 
            ? 'Monitor system activity and manage requests' 
            : 'Track financial metrics and process payments'
          }
        </p>
      </div>

      <StatsCards cards={getStatsCards()} loading={loading} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : recentRequests.length > 0 ? (
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Request #{request.id.slice(-6)} - {request.employeeId}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(request.submittedAt).toLocaleDateString()} • ₹{request.reimbursementAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};