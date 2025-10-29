import React, { useState } from 'react';
import { User, resetUserPassword, toggleUserStatus, deleteUser, updateUser } from '../services/api';
import { Users, Mail, Calendar, Shield, Key, CheckCircle, AlertCircle, UserX, Trash2, UserCheck, CreditCard as Edit3, Save, X } from 'lucide-react';

interface UsersListProps {
  users: User[];
  loading: boolean;
  onUserUpdated: () => void;
}

export const UsersList: React.FC<UsersListProps> = ({ users, loading, onUserUpdated }) => {
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    employeeId: string;
  }>({ name: '', email: '', employeeId: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'employee':
        return 'Employee';
      case 'it_admin':
        return 'IT Administrator';
      case 'finance':
        return 'Finance Team';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'employee':
        return 'bg-blue-100 text-blue-800';
      case 'it_admin':
        return 'bg-purple-100 text-purple-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${userEmail}?`)) {
      return;
    }

    setResettingPassword(userId);
    setResetError(null);
    setResetSuccess(null);

    try {
      resetUserPassword(userId);
      setResetSuccess(userId);
      onUserUpdated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResetSuccess(null);
      }, 3000);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleToggleStatus = async (userId: string, userEmail: string, currentStatus: boolean) => {
    const action = currentStatus ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} ${userEmail}?`)) {
      return;
    }

    setTogglingStatus(userId);
    setActionError(null);
    setActionSuccess(null);

    try {
      toggleUserStatus(userId);
      setActionSuccess(userId);
      onUserUpdated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(userId);
    setActionError(null);
    setActionSuccess(null);

    try {
      deleteUser(userId);
      setActionSuccess(userId);
      onUserUpdated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      employeeId: user.employeeId
    });
    setEditErrors({});
    setActionError(null);
    setActionSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({ name: '', email: '', employeeId: '' });
    setEditErrors({});
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    setEditErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!editFormData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async (userId: string) => {
    if (!validateEditForm()) return;

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      updateUser(userId, editFormData);
      setActionSuccess(userId);
      setEditingUser(null);
      onUserUpdated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-600">No users have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management ({users.length} users)
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joining Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-gray-50 ${user.isActive === false ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => handleEditFormChange('name', e.target.value)}
                          placeholder="Full Name"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            editErrors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {editErrors.name && (
                          <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditFormChange('email', e.target.value)}
                          placeholder="Email"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            editErrors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {editErrors.email && (
                          <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editFormData.employeeId}
                          onChange={(e) => handleEditFormChange('employeeId', e.target.value)}
                          placeholder="Employee ID"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            editErrors.employeeId ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {editErrors.employeeId && (
                          <p className="text-xs text-red-600 mt-1">{editErrors.employeeId}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive === false 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isActive === false ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.category === 'Developer' 
                      ? 'bg-indigo-100 text-indigo-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {user.category || 'Developer'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {new Date(user.joiningDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingUser === user.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                    
                    {editingUser !== user.id && (
                      <>
                        <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      disabled={resettingPassword === user.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Key className="h-3 w-3" />
                      {resettingPassword === user.id ? 'Resetting...' : 'Reset Password'}
                    </button>
                        
                        <button
                          onClick={() => handleToggleStatus(user.id, user.email, user.isActive !== false)}
                          disabled={togglingStatus === user.id}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            user.isActive === false
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
                          }`}
                        >
                          {user.isActive === false ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {togglingStatus === user.id 
                            ? 'Updating...' 
                            : user.isActive === false 
                              ? 'Enable' 
                              : 'Disable'
                          }
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleting === user.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                    
                    {resetSuccess === user.id && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Password reset to: temp123
                      </div>
                    )}
                    
                    {actionSuccess === user.id && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        {editingUser === user.id ? 'User updated successfully' : 'Action completed'}
                      </div>
                    )}
                    
                    {resetError && resettingPassword === user.id && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Reset failed
                      </div>
                    )}
                    
                    {actionError && (togglingStatus === user.id || deleting === user.id || editingUser === user.id) && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {actionError}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};