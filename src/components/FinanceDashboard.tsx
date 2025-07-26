import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardOverview } from './DashboardOverview';
import { RequestsList } from './RequestsList';
import { Reports } from './Reports';
import { getRequests, getStats, updateRequestStatus, Request } from '../services/api';

export const FinanceDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('approved');

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleMenuToggle = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

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
        'Finance Team'
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
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview userRole="finance" />;
      
      case 'requests':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Requests</h2>
              <p className="text-gray-600">Process approved laptop reimbursement requests</p>
            </div>
            
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
      
      case 'reports':
        return <Reports userRole="finance" />;
      
      default:
        return <DashboardOverview userRole="finance" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userRole="finance"
        expandedMenus={expandedMenus}
        onMenuToggle={handleMenuToggle}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};