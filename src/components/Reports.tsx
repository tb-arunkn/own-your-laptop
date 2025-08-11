import React, { useState, useEffect } from 'react';
import { getRequests, getUsers } from '../services/api';
import { BarChart3, Calendar, Download, Filter, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface ReportsProps {
  userRole: string;
}

export const Reports: React.FC<ReportsProps> = ({ userRole }) => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'financial-year'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const financialYears = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: `FY ${year}-${(year + 1).toString().slice(-2)}` };
  });

  useEffect(() => {
    generateReport();
  }, [reportType, selectedMonth, selectedYear, selectedFinancialYear]);

  const generateReport = () => {
    setLoading(true);
    
    try {
      const requests = getRequests();
      const users = getUsers();
      
      // Filter requests based on report type
      const filteredRequests = requests.filter(request => {
        const requestDate = new Date(request.submittedAt);
        if (reportType === 'monthly') {
          return requestDate.getMonth() === selectedMonth && requestDate.getFullYear() === selectedYear;
        } else if (reportType === 'yearly') {
          return requestDate.getFullYear() === selectedYear;
        } else if (reportType === 'financial-year') {
          const financialYearStart = new Date(selectedFinancialYear, 3, 1); // April 1st
          const financialYearEnd = new Date(selectedFinancialYear + 1, 2, 31); // March 31st
          return requestDate >= financialYearStart && requestDate <= financialYearEnd;
        }
      });

      // Calculate statistics
      const stats = {
        totalRequests: filteredRequests.length,
        totalAmount: filteredRequests.reduce((sum, req) => sum + req.reimbursementAmount, 0),
        approvedRequests: filteredRequests.filter(req => req.status === 'approved').length,
        rejectedRequests: filteredRequests.filter(req => req.status === 'rejected').length,
        processedRequests: filteredRequests.filter(req => req.status === 'processed').length,
        paidRequests: filteredRequests.filter(req => req.status === 'paid').length,
        pendingRequests: filteredRequests.filter(req => req.status === 'pending').length,
      };

      // Calculate amounts by status
      const amounts = {
        approved: filteredRequests.filter(req => req.status === 'approved').reduce((sum, req) => sum + req.reimbursementAmount, 0),
        processed: filteredRequests.filter(req => req.status === 'processed').reduce((sum, req) => sum + req.reimbursementAmount, 0),
        paid: filteredRequests.filter(req => req.status === 'paid').reduce((sum, req) => sum + req.reimbursementAmount, 0),
      };

      // Category breakdown
      const categoryBreakdown = filteredRequests.reduce((acc, req) => {
        acc[req.category] = (acc[req.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Department breakdown (based on user roles)
      const departmentBreakdown = filteredRequests.reduce((acc, req) => {
        const user = users.find(u => u.id === req.submittedBy);
        const dept = user?.role === 'employee' ? 'Employee' : user?.role || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setReportData({
        stats,
        amounts,
        categoryBreakdown,
        departmentBreakdown,
        requests: filteredRequests,
        ...(reportType === 'financial-year' && {
          monthlyData: generateMonthlyFinancialData(requests, selectedFinancialYear)
        })
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyFinancialData = (requests: any[], financialYear: number) => {
    const months = [
      'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
    ];
    
    const monthlyData = months.map((month, index) => {
      // Calculate actual month (April = 3, May = 4, ..., March = 2 of next year)
      const actualMonth = index < 9 ? index + 3 : index - 9;
      const actualYear = index < 9 ? financialYear : financialYear + 1;
      
      const monthRequests = requests.filter(request => {
        const requestDate = new Date(request.submittedAt);
        return requestDate.getMonth() === actualMonth && 
               requestDate.getFullYear() === actualYear &&
               ['approved', 'processed', 'paid'].includes(request.status);
      });
      
      const developerRequests = monthRequests.filter(req => req.category === 'Developer');
      const nonDeveloperRequests = monthRequests.filter(req => req.category === 'Non-Developer');
      
      return {
        month,
        developer: {
          count: developerRequests.length,
          amount: developerRequests.reduce((sum, req) => sum + req.reimbursementAmount, 0),
          users: [...new Set(developerRequests.map(req => req.employeeId))].length
        },
        nonDeveloper: {
          count: nonDeveloperRequests.length,
          amount: nonDeveloperRequests.reduce((sum, req) => sum + req.reimbursementAmount, 0),
          users: [...new Set(nonDeveloperRequests.map(req => req.employeeId))].length
        },
        total: {
          count: monthRequests.length,
          amount: monthRequests.reduce((sum, req) => sum + req.reimbursementAmount, 0),
          users: [...new Set(monthRequests.map(req => req.employeeId))].length
        }
      };
    });
    
    return monthlyData;
  };

  const exportReport = () => {
    if (!reportData) return;

    const periodText = reportType === 'monthly'
      ? `${months[selectedMonth]} ${selectedYear}`
      : reportType === 'yearly'
      ? `Year ${selectedYear}`
      : `FY ${selectedFinancialYear}-${(selectedFinancialYear + 1).toString().slice(-2)}`;

    const csvContent = [
      ['Laptop Reimbursement Report'],
      [`Period: ${periodText}`],
      [''],
      ['Summary Statistics'],
      ['Total Requests', reportData.stats.totalRequests],
      ['Total Amount', `₹${reportData.stats.totalAmount.toLocaleString()}`],
      ['Approved', reportData.stats.approvedRequests],
      ['Rejected', reportData.stats.rejectedRequests],
      ['Processed', reportData.stats.processedRequests],
      ['Paid', reportData.stats.paidRequests],
      ['Pending', reportData.stats.pendingRequests],
      [''],
      ['Request Details'],
      ['Request ID', 'Employee ID', 'Category', 'Amount', 'Status', 'Date'],
      ...reportData.requests.map((req: any) => [
        req.id.slice(-6),
        req.employeeId,
        req.category,
        `₹${req.reimbursementAmount.toLocaleString()}`,
        req.status,
        new Date(req.submittedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = reportType === 'monthly'
      ? `laptop-reimbursement-report-${months[selectedMonth]}-${selectedYear}.csv`
      : reportType === 'yearly'
      ? `laptop-reimbursement-report-year-${selectedYear}.csv`
      : `laptop-reimbursement-report-FY-${selectedFinancialYear}-${(selectedFinancialYear + 1).toString().slice(-2)}.csv`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!reportData?.monthlyData) return null;
    
    return {
      labels: reportData.monthlyData.map((data: any) => data.month),
      datasets: [
        {
          label: 'Developer',
          data: reportData.monthlyData.map((data: any) => data.developer.amount),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Non-Developer',
          data: reportData.monthlyData.map((data: any) => data.nonDeveloper.amount),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: 'Total Users',
          data: reportData.monthlyData.map((data: any) => data.total.users * 10000), // Scale for visibility
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
          type: 'line' as const,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Monthly Reimbursement Amounts - FY ${selectedFinancialYear}-${(selectedFinancialYear + 1).toString().slice(-2)}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Total Users') {
              return `Total Users: ${Math.round(context.parsed.y / 10000)}`;
            }
            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return Math.round(value / 10000) + ' users';
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports</h2>
          <p className="text-gray-600">
            {reportType === 'monthly' ? 'Monthly' : reportType === 'yearly' ? 'Yearly' : 'Financial Year'} analytics for laptop reimbursements
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'monthly' | 'yearly' | 'financial-year')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="financial-year">Financial Year</option>
            </select>
            
            {reportType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            )}
            
            {reportType === 'financial-year' ? (
              <select
                value={selectedFinancialYear}
                onChange={(e) => setSelectedFinancialYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {financialYears.map(fy => (
                  <option key={fy.value} value={fy.value}>{fy.label}</option>
                ))}
              </select>
            ) : (
              <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            )}
          </div>
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Financial Year Chart */}
          {reportType === 'financial-year' && reportData.monthlyData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Monthly Breakdown - FY {selectedFinancialYear}-{(selectedFinancialYear + 1).toString().slice(-2)}
                </h3>
              </div>
              <div className="h-96">
                <Bar data={getChartData()!} options={chartOptions} />
              </div>
              
              {/* Monthly Summary Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Developer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Developer Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((monthData: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {monthData.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{monthData.developer.count} requests</div>
                            <div className="text-xs text-gray-500">{monthData.developer.users} users</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{monthData.developer.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{monthData.nonDeveloper.count} requests</div>
                            <div className="text-xs text-gray-500">{monthData.nonDeveloper.users} users</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{monthData.nonDeveloper.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <div className="font-bold text-blue-600">₹{monthData.total.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{monthData.total.count} requests</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {monthData.total.users}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.stats.totalRequests}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{reportData.stats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.stats.totalRequests > 0 
                      ? Math.round((reportData.stats.approvedRequests / reportData.stats.totalRequests) * 100)
                      : 0
                    }%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg. Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{reportData.stats.totalRequests > 0 
                      ? Math.round(reportData.stats.totalAmount / reportData.stats.totalRequests).toLocaleString()
                      : 0
                    }
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pending', count: reportData.stats.pendingRequests, color: 'bg-yellow-500' },
                  { label: 'Approved', count: reportData.stats.approvedRequests, color: 'bg-green-500' },
                  { label: 'Rejected', count: reportData.stats.rejectedRequests, color: 'bg-red-500' },
                  { label: 'Processed', count: reportData.stats.processedRequests, color: 'bg-blue-500' },
                  { label: 'Paid', count: reportData.stats.paidRequests, color: 'bg-purple-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(reportData.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(reportData.categoryBreakdown).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary (for Finance role) */}
          {userRole === 'finance' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Approved Amount</p>
                  <p className="text-xl font-bold text-green-600">₹{reportData.amounts.approved.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Processed Amount</p>
                  <p className="text-xl font-bold text-blue-600">₹{reportData.amounts.processed.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
                  <p className="text-xl font-bold text-purple-600">₹{reportData.amounts.paid.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};