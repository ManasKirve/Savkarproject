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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const loansData = await ApiService.getAllLoans();
        setLoans(loansData);
        
        // Calculate statistics
        const totalLoans = loansData.length;
        const activeLoans = loansData.filter(loan => loan.status === 'Active').length;
        const pendingLoans = loansData.filter(loan => loan.status === 'Pending').length;
        const closedLoans = loansData.filter(loan => loan.status === 'Closed').length;
        
        const totalAmount = loansData.reduce((sum, loan) => sum + (loan.totalLoan || 0), 0);
        const collectedAmount = loansData.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);
        const remainingAmount = totalAmount - collectedAmount;
        const pendingAmount = loansData
          .filter(loan => loan.status === 'Pending')
          .reduce((sum, loan) => sum + ((loan.totalLoan || 0) - (loan.paidAmount || 0)), 0);

        setStats({
          totalLoans,
          activeLoans,
          pendingLoans,
          closedLoans,
          totalAmount,
          collectedAmount,
          pendingAmount
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const recentLoans = loans.slice(0, 5);

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
          <p className="dashboard-subtitle text-muted">
            Welcome back! Here's what's happening with your loans today.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-custom">
            <i className="fas fa-download me-2"></i>Export Report
          </button>
          <button className="btn btn-primary btn-custom btn-primary-custom">
            <i className="fas fa-plus me-2"></i>Add New Loan
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
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
      <div className="row mb-4">
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
        <div className="card-header table-header">
          <h5 className="mb-0">Recent Loans</h5>
        </div>
        <div className="card-body table-body">
          <div className="table-responsive">
            <table className="table table-hover table-custom mb-0">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <div>
                        <div className="fw-medium">{loan.borrowerName}</div>
                        <small className="text-muted">{loan.phoneNumber}</small>
                      </div>
                    </td>
                    <td>₹{loan.totalLoan.toLocaleString()}</td>
                    <td>{loan.interestRate}%</td>
                    <td>{new Date(loan.startDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-custom ${
                        loan.status === 'Active' ? 'badge-success' :
                        loan.status === 'Closed' ? 'badge-info' :
                        loan.status === 'Pending' ? 'badge-danger' : 'badge-secondary'
                      }`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="progress progress-custom">
                        <div 
                          className={`progress-bar progress-bar-custom ${
                            loan.status === 'Closed' ? 'progress-bar-success' :
                            loan.status === 'Pending' ? 'progress-bar-danger' : 'progress-bar-primary'
                          }`}
                          style={{ width: `${(loan.paidAmount / loan.totalLoan) * 100}%` }}
                        ></div>
                      </div>
                      <small className="progress-text">
                        {Math.round((loan.paidAmount / loan.totalLoan) * 100)}% paid
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;