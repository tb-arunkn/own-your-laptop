# Laptop Reimbursement Portal - Full Stack Application

A comprehensive web application for managing laptop reimbursement requests within an organization. This system provides role-based access for employees, IT administrators, and finance teams to streamline the laptop procurement and reimbursement process.

## 🚀 Features

### Employee Features
- **Submit Reimbursement Requests**: Apply for laptop reimbursement with automatic eligibility checking
- **Real-time Depreciation Calculation**: Automatic calculation based on laptop purchase date vs joining date
- **Request Tracking**: View status and history of all submitted requests
- **Eligibility Validation**: 15-day minimum employment requirement and 36-month waiting period between requests

### IT Admin Features
- **Request Management**: Review, approve, or reject employee requests
- **User Management**: Add, edit, disable/enable, and manage user accounts
- **Dashboard Analytics**: Overview of system activity and request statistics
- **Reports Generation**: Monthly, yearly, and financial year reports with CSV export
- **Settings Configuration**: SMTP settings and email template management
- **Existing Rentals**: Import and manage historical rental data via CSV

### Finance Team Features
- **Process Approved Requests**: Handle approved requests with automatic depreciation calculations
- **Payment Tracking**: Mark requests as processed and paid
- **Financial Reports**: Detailed financial analytics and reporting
- **Installment Management**: Automatic calculation of 24-month installments
- **Existing Rentals**: View and manage historical rental records

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js with React Chart.js 2
- **Build Tool**: Vite
- **State Management**: React Context API
- **Data Storage**: LocalStorage (for demo purposes)

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd laptop-reimbursement-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 👥 Demo Accounts

The application comes with pre-configured demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Employee | employee@company.com | emp123 | Submit and track reimbursement requests |
| IT Admin | admin@company.com | admin123 | Manage requests, users, and system settings |
| Finance | finance@company.com | finance123 | Process payments and financial reporting |

## 🏗 Project Structure

```
src/
├── components/           # React components
│   ├── AdminDashboard.tsx
│   ├── FinanceDashboard.tsx
│   ├── EmployeeDashboard.tsx
│   ├── ExistingRentals.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   └── ...
├── context/             # React context providers
│   └── AuthContext.tsx
├── services/            # API and business logic
│   ├── api.ts
│   └── emailService.ts
└── main.tsx            # Application entry point
```

## 💼 Business Rules

### Reimbursement Eligibility
- **Employment Duration**: Minimum 15 days of service required
- **Waiting Period**: 36 months between reimbursement requests
- **Amount Limits**: 
  - Developer: Maximum ₹82,000 (75% of invoice)
  - Non-Developer: Maximum ₹72,000 (75% of invoice)

### Depreciation Calculation
- **Automatic Depreciation**: Applied when laptop purchased before joining date
- **Rate**: 20% yearly (1.67% monthly)
- **Maximum**: 80% depreciation cap
- **Minimum Value**: 20% of original amount retained

### Payment Processing
- **Installments**: 24 monthly installments
- **Start Date**: First day of month following processing
- **Next Eligibility**: 36 months from processing date

## 📊 CSV Import Format

### Existing Rentals CSV Structure
```csv
Emp ID,Emp Name,Emp Email ID,Invoice Date,Total Amount,Actual Amount,Windows Upgrade Cost,Monthly Instalment,Start Date,End Date
EMP001,John Doe,john.doe@company.com,2023-01-15,100000,75000,5000,3125,2023-02-01,2025-01-31
```

**Date Format**: YYYY-MM-DD
**Next Request Date**: Automatically calculated as 365 days after End Date

## 🔧 Configuration

### SMTP Settings
Configure email notifications in Settings > SMTP Settings:
- Host, Port, Username, Password
- From Email and Display Name
- TLS/SSL Security options

### Email Templates
Customize email templates for:
- Request submission confirmation
- Approval notifications
- Rejection notifications
- Processing completion

## 📈 Reports

### Available Reports
- **Monthly Reports**: Request activity by month
- **Yearly Reports**: Annual summaries and trends
- **Financial Year Reports**: April-March financial year analysis
- **CSV Export**: All reports exportable to CSV format

### Report Metrics
- Total requests and amounts
- Approval/rejection rates
- Category breakdowns (Developer vs Non-Developer)
- Department-wise analysis
- Monthly trends and patterns

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔒 Security Features

- **Role-based Access Control**: Different permissions for each user role
- **Input Validation**: Comprehensive form validation and sanitization
- **File Upload Security**: Restricted file types and size limits
- **Data Persistence**: Secure local storage with validation

## 🐛 Troubleshooting

### Common Issues

1. **SMTP Settings Error**
   - Configure SMTP settings in Admin Settings
   - Ensure all required fields are filled

2. **CSV Import Failures**
   - Check CSV format matches expected structure
   - Ensure date formats are correct (YYYY-MM-DD)
   - Verify all required columns are present

3. **Depreciation Calculation Issues**
   - Verify laptop purchase date is before joining date
   - Check date formats are valid

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added existing rentals management
- **v1.2.0**: Enhanced reporting and analytics
- **v1.3.0**: Improved email notifications and templates

---

**Built with ❤️ for efficient laptop reimbursement management**