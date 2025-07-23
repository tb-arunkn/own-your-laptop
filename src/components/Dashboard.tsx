import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeDashboard } from './EmployeeDashboard';
import { AdminDashboard } from './AdminDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { Header } from './Header';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'it_admin':
        return <AdminDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{renderDashboard()}</main>
    </div>
  );
};