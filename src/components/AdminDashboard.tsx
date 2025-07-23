import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardOverview } from './DashboardOverview';
import { RequestsList } from './RequestsList';
import { UserManagementForm } from './UserManagementForm';
import { UsersList } from './UsersList';
import { Reports } from './Reports';
import { getRequests, getStats, updateRequestStatus, getUsers, Request, User } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'user-management': false
  });
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      const requestsData = getRequests();
      
      setRequests(requestsData);
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
    
    // Auto-expand user management menu if on user management sections
    if (activeSection === 'add-user' || activeSection === 'manage-users') {
      setExpandedMenus(prev => ({ ...prev, 'user-management': true }));
    }
  }, []);

  const handleMenuToggle = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

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
    setActiveSection('manage-users'); // Switch to users list
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh users list
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview userRole="it_admin" />;
      
      case 'requests':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Requests</h2>
              <p className="text-gray-600">Review and approve laptop reimbursement requests</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
                  Laptop Reimbursement Requests
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
          </div>
        );
      
      case 'add-user':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add User</h2>
              <p className="text-gray-600">Create a new user account for the system</p>
            </div>
            <UserManagementForm onUserCreated={handleUserCreated} />
          </div>
        );
      
      case 'manage-users':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Users</h2>
              <p className="text-gray-600">View and manage all system users</p>
            </div>
            <UsersList 
              users={users} 
              loading={usersLoading} 
              onUserUpdated={handleUserUpdated}
            />
          </div>
        );
      
      case 'reports':
        return <Reports userRole="it_admin" />;
      
      default:
        return <DashboardOverview userRole="it_admin" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userRole="it_admin"
        expandedMenus={expandedMenus}
        onMenuToggle={handleMenuToggle}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};