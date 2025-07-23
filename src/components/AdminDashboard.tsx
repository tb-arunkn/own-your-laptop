import React, { useState, useEffect } from 'react';
import { RequestsList } from './RequestsList';
import { StatsCards } from './StatsCards';
import { UserManagementForm } from './UserManagementForm';
import { UsersList } from './UsersList';
import { getRequests, getStats, updateRequestStatus, getUsers, Request, User } from '../services/api';
import { FileText, Clock, CheckCircle, XCircle, UserPlus, Users, Settings } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
  paid: number;
}

export const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'requests' | 'add-user' | 'manage-users'>('requests');

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

  const fetchUsers = async () => {
    try {
      const usersData = getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (id: string, status: string, comments?: string) => {
    try {
      const updatedRequest = updateRequestStatus(id, status, comments, 'IT Admin');
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

  const handleUserCreated = () => {
    fetchUsers(); // Refresh users list
    setActiveTab('manage-users'); // Switch to users list
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh users list
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const statsCards = stats ? [
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
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">IT Admin Dashboard</h2>
        <p className="text-gray-600">Manage requests and users in the system</p>
      </div>

      <StatsCards cards={statsCards} loading={loading} />

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
          Manage Requests
        </button>
        <button
          onClick={() => setActiveTab('add-user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'add-user'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
        <button
          onClick={() => setActiveTab('manage-users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'manage-users'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Settings className="h-4 w-4" />
          Manage Users
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
              Laptop Rental Requests
            </h3>
            
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
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
            showActions={true}
            userRole="it_admin"
          />
        </div>
      )}

      {activeTab === 'add-user' && (
        <UserManagementForm onUserCreated={handleUserCreated} />
      )}

      {activeTab === 'manage-users' && (
        <UsersList 
          users={users} 
          loading={usersLoading} 
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};