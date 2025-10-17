import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService'; 

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingLoans: 0,
    closedLoans: 0,
    totalAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0
  });

  // Filter and Sort states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Dashboard: Starting to fetch data...");
        setLoading(true);
        
        // First get dashboard summary from the dedicated endpoint
        console.log("Dashboard: Fetching dashboard summary...");
        const dashboardData = await ApiService.getDashboardSummary();
        console.log("Dashboard: Dashboard summary received:", dashboardData);
        
        // Update stats with the data from the dashboard summary endpoint
        setStats({
          totalLoans: dashboardData.activeRecords + dashboardData.pendingRecords + dashboardData.closingRecords,
          activeLoans: dashboardData.activeRecords,
          pendingLoans: dashboardData.pendingRecords,
          closedLoans: dashboardData.closingRecords,
          totalAmount: dashboardData.totalLoanIssued,
          collectedAmount: dashboardData.recoveredAmount,
          pendingAmount: dashboardData.pendingAmount
        });
        
        // Then get loans for the table
        console.log("Dashboard: Fetching loans data...");
        const loansData = await ApiService.getAllLoans();
        console.log("Dashboard: Loans data received:", loansData);
        setLoans(loansData);
        
      } catch (err) {
        console.error('Dashboard: Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        console.log("Dashboard: Setting loading to false");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply Date Range Filter
  const filteredLoans = loans.filter((loan) => {
    if (!fromDate && !toDate) return true;
    const loanDate = new Date(loan.startDate);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && to) return loanDate >= from && loanDate <= to;
    if (from) return loanDate >= from;
    if (to) return loanDate <= to;
    return true;
  });

  // Sort by Date when column clicked
  const sortByDate = () => {
    const sorted = [...filteredLoans].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setLoans(sorted);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const recentLoans = filteredLoans.slice(0, 5);

  if (loading) {
    return (
      <div className="container p-4 dashboard-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4 dashboard-container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 dashboard-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title">Dashboard Overview</h2>
          <p className="dashboard-subtitle text-muted m-0">
            Welcome back! Here's what's happening with your loans today.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-custom">
            <i className="fas fa-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-primary">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">Total Loans</h6>
                  <h3 className="stat-card-value mb-0">{stats.totalLoans}</h3>
                </div>
                <div className="stat-card-icon">
                  <i className="fas fa-file-contract"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-success">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">Active Loans</h6>
                  <h3 className="stat-card-value mb-0">{stats.activeLoans}</h3>
                </div>
                <div className="stat-card-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-warning">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">Pending</h6>
                  <h3 className="stat-card-value mb-0">{stats.pendingLoans}</h3>
                </div>
                <div className="stat-card-icon">
                  <i className="fas fa-clock"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-danger">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">Closed</h6>
                  <h3 className="stat-card-value mb-0">{stats.closedLoans}</h3>
                </div>
                <div className="stat-card-icon">
                  <i className="fas fa-archive"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Statistics */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Total Amount</h6>
              <h4 className="amount-card-value primary">₹{stats.totalAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Collected</h6>
              <h4 className="amount-card-value success">₹{stats.collectedAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Pending Amount</h6>
              <h4 className="amount-card-value warning">₹{stats.pendingAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans Table */}
      <div className="card table-container-custom">
        <div className="card-header table-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Loans</h5>

          {/* Date Filter */}
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center">
              <label className="me-2 fw-medium">From:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2 fw-medium">To:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="card-body table-body">
          <div className="table-responsive">
            <table className="table table-hover table-custom mb-0">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  {/* Clickable Due Date Header */}
                  <th
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={sortByDate}
                  >
                    Due Date{' '}
                    <i
                      className={`fas fa-sort-${
                        sortOrder === 'asc' ? 'up' : 'down'
                      } ms-1`}
                    ></i>
                  </th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.length > 0 ? (
                  recentLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <div>
                          <div className="fw-medium">{loan.borrowerName}</div>
                          <small className="text-muted">{loan.phoneNumber}</small>
                        </div>
                      </td>
                      <td>₹{loan.totalLoan.toLocaleString()}</td>
                      <td>{loan.interestRate}%</td>
                      <td>{new Date(loan.startDate).toLocaleDateString('en-GB')}</td>
                      <td>
                        <span
                          className={`badge badge-custom ${
                            loan.status === 'Active'
                              ? 'badge-success'
                              : loan.status === 'Closed'
                              ? 'badge-info'
                              : loan.status === 'Pending'
                              ? 'badge-danger'
                              : 'badge-secondary'
                          }`}
                        >
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="progress progress-custom">
                          <div
                            className={`progress-bar progress-bar-custom ${
                              loan.status === 'Closed'
                                ? 'progress-bar-success'
                                : loan.status === 'Pending'
                                ? 'progress-bar-danger'
                                : 'progress-bar-primary'
                            }`}
                            style={{ width: `${(loan.paidAmount / loan.totalLoan) * 100}%` }}
                          ></div>
                        </div>
                        <small className="progress-text">
                          {Math.round((loan.paidAmount / loan.totalLoan) * 100)}% paid
                        </small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">
                      No loans found for selected dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;