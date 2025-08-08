import React, { useState, useEffect } from 'react';
import { Upload, Search, FileText, Download, Calendar, DollarSign, User } from 'lucide-react';

interface ExistingRental {
  id: string;
  empId: string;
  empName: string;
  empEmail: string;
  invoiceDate: string;
  totalAmount: number;
  actualAmount: number;
  windowsUpgradeCost: number;
  monthlyInstalment: number;
  startDate: string;
  endDate: string;
  nextRequestDate: string;
}

interface ExistingRentalsProps {
  userRole: string;
}

export const ExistingRentals: React.FC<ExistingRentalsProps> = ({ userRole }) => {
  const [rentals, setRentals] = useState<ExistingRental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<ExistingRental[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadExistingRentals();
  }, []);

  useEffect(() => {
    filterRentals();
  }, [searchTerm, rentals]);

  const loadExistingRentals = () => {
    setLoading(true);
    try {
      const savedRentals = localStorage.getItem('existingRentals');
      if (savedRentals) {
        const parsedRentals = JSON.parse(savedRentals);
        setRentals(parsedRentals);
      }
    } catch (error) {
      console.error('Error loading existing rentals:', error);
      setError('Failed to load existing rentals');
    } finally {
      setLoading(false);
    }
  };

  const filterRentals = () => {
    if (!searchTerm.trim()) {
      setFilteredRentals(rentals);
      return;
    }

    const filtered = rentals.filter(rental =>
      rental.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.empEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRentals(filtered);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const expectedHeaders = [
        'Emp ID', 'Emp Name', 'Emp Email ID', 'Invoice Date', 'Total Amount',
        ['EMP001', 'John Doe', 'john.doe@company.com', '2023-01-15', '100000', '75000', '5000', '3125', '2023-02-01', '2025-01-31'],
        ['EMP002', 'Jane Smith', 'jane.smith@company.com', '2023-03-20', '120000', '82000', '8000', '3750', '2023-04-01', '2025-03-31']
      ];

      // Validate headers
      const missingHeaders = expectedHeaders.filter(expected => 
        !headers.some(header => header.toLowerCase() === expected.toLowerCase())
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const newRentals: ExistingRental[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < expectedHeaders.length) {
            errors.push(`Row ${i + 1}: Insufficient columns`);
            continue;
          }

          const rental: ExistingRental = {
            id: Date.now().toString() + i,
            empId: values[0] || '',
            empName: values[1] || '',
            empEmail: values[2] || '',
            invoiceDate: values[3] || '',
            totalAmount: parseFloat(values[4]) || 0,
            actualAmount: parseFloat(values[5]) || 0,
            windowsUpgradeCost: parseFloat(values[6]) || 0,
            monthlyInstalment: parseFloat(values[7]) || 0,
            startDate: values[8] || '',
            endDate: values[9] || ''
          };

          // Calculate next request date (36 months after end date)
          if (rental.endDate) {
            try {
              const endDate = new Date(rental.endDate);
              const nextRequestDate = new Date(endDate);
              nextRequestDate.setDate(nextRequestDate.getDate() + 365);
              rental.nextRequestDate = nextRequestDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            } catch (error) {
              rental.nextRequestDate = '';
            }
          } else {
            rental.nextRequestDate = '';
          }

          // Basic validation
          if (!rental.empId || !rental.empName || !rental.empEmail) {
            errors.push(`Row ${i + 1}: Missing required employee information`);
            continue;
          }

          newRentals.push(rental);
        } catch (rowError) {
          errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Invalid data'}`);
        }
      }

      if (errors.length > 0 && newRentals.length === 0) {
        throw new Error(`Import failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more errors' : ''}`);
      }

      // Save to localStorage
      const existingRentals = [...rentals, ...newRentals];
      localStorage.setItem('existingRentals', JSON.stringify(existingRentals));
      setRentals(existingRentals);

      setSuccess(`Successfully imported ${newRentals.length} rental records${errors.length > 0 ? ` (${errors.length} rows had errors)` : ''}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import CSV file');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Emp ID', 'Emp Name', 'Emp Email ID', 'Invoice Date', 'Total Amount', 'Actual Amount', 'Windows Upgrade Cost', 'Monthly Instalment', 'Start Month', 'End Month'],
      ['EMP001', 'John Doe', 'john.doe@company.com', '2023-01-15', '100000', '75000', '5000', '3125', '2023-02', '2025-01'],
      ['EMP002', 'Jane Smith', 'jane.smith@company.com', '2023-03-20', '120000', '82000', '8000', '3750', '2023-04', '2025-03']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'existing_rentals_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all existing rental data? This action cannot be undone.')) {
      localStorage.removeItem('existingRentals');
      setRentals([]);
      setSuccess('All existing rental data has been cleared');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Existing Rentals</h2>
        <p className="text-gray-600">Import and manage historical laptop rental data</p>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Import CSV Data
          </h3>
          <div className="flex gap-2">
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              Sample CSV
            </button>
            {rentals.length > 0 && (
              <button
                onClick={clearAllData}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Clear All Data
              </button>
            )}
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="csv-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload CSV file</span>
                <input
                  id="csv-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">CSV files only</p>
            {importing && (
              <p className="text-sm text-blue-600 mt-2">Importing data...</p>
            )}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Required CSV columns:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Emp ID</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Emp Name</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Emp Email ID</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Invoice Date</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Total Amount</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Actual Amount</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Windows Upgrade Cost</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Monthly Instalment</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">Start Date</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">End Date</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-2 text-red-600">
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2 text-green-600">
              <div className="text-sm">{success}</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Rental Records ({filteredRentals.length})
            </h3>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by employee name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading rental data...</p>
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {rentals.length === 0 ? 'No rental data found' : 'No matching records'}
              </h3>
              <p className="text-gray-600">
                {rentals.length === 0 
                  ? 'Import a CSV file to view existing rental records'
                  : 'Try adjusting your search criteria'
                }
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Instalment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rental Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Request Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{rental.empName}</div>
                          <div className="text-sm text-gray-500">{rental.empId}</div>
                          <div className="text-xs text-gray-400">{rental.empEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {rental.invoiceDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">Total: ₹{rental.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Actual: ₹{rental.actualAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Windows: ₹{rental.windowsUpgradeCost.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{rental.monthlyInstalment.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {rental.startDate ? new Date(rental.startDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          to {rental.endDate ? new Date(rental.endDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rental.nextRequestDate ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">
                              {new Date(rental.nextRequestDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not calculated</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};