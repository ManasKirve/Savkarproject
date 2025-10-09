import React, { useState, useEffect } from 'react';
import { LoanService } from '../services/loanService';
import './LoanRecords.css';

const LoanRecords = () => {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState({
    borrowerName: '',
    phoneNumber: '',
    lastAmount: '',
    emi: '',
    startDate: '',
    endDate: '',
    interestRate: '',
    paymentMode: 'Cash',
    totalLoan: '',
    paidAmount: '0',
    status: 'Active'
  });

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm, statusFilter]);

  const loadLoans = async () => {
    try {
      // Initialize data if it hasn't been initialized
      LoanService.initializeData();
      const loansData = LoanService.getAllLoans();
      setLoans(loansData || []);
    } catch (error) {
      console.error('Error loading loans:', error);
      setLoans([]);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter(loan => 
        (loan.customerName || loan.borrowerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loan.customerPhone || loan.phoneNumber || '').includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const loanData = {
      ...formData,
      totalLoan: parseFloat(formData.totalLoan) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      emi: parseFloat(formData.emi) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      paidAmount: editingLoan ? parseFloat(formData.paidAmount) || 0 : 0
    };

    // Calculate progress percentage
    const progress = (loanData.paidAmount / loanData.totalLoan) * 100;
    
    // Update status based on progress
    if (progress >= 100) {
      loanData.status = 'Closed';
    } else if (progress > 0) {
      loanData.status = 'Active';
    }

    if (editingLoan) {
      LoanService.updateLoan(editingLoan.id, loanData);
    } else {
      LoanService.createLoan(loanData);
    }

    loadLoans();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      borrowerName: '',
      phoneNumber: '',
      paidAmount: '0',
      emi: '',
      startDate: '',
      endDate: '',
      interestRate: '',
      paymentMode: 'Bank Transfer',
      totalLoan: '',
      paidAmount: '0',
      status: 'Active'
    });
    setEditingLoan(null);
    setShowAddModal(false);
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setFormData({
      borrowerName: loan.borrowerName || '',
      phoneNumber: loan.phoneNumber || '',
      paidAmount: loan.paidAmount?.toString() || '0',
      emi: loan.emi?.toString() || '',
      startDate: loan.startDate || '',
      endDate: loan.endDate || '',
      interestRate: loan.interestRate?.toString() || '',
      paymentMode: loan.paymentMode || 'Cash',
      totalLoan: loan.totalLoan?.toString() || '',
      paidAmount: loan.paidAmount?.toString() || '0',
      status: loan.status || 'Active'
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan record?')) {
      LoanService.deleteLoan(id);
      loadLoans();
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header Section */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Loan Records</h2>
          <p className="text-muted mb-0">Manage and track all loan records</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          <span>Add New Loan</span>
        </button>
      </div>

      {/* Statistics Overview */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="stat-icon success">
                <i className="fas fa-chart-line"></i>
              </div>
              <h6 className="text-muted mb-2">Total Active Loans</h6>
              <h3 className="mb-0">{loans.filter(loan => loan.status === 'Active').length}</h3>
              <div className="mt-3">
                <span className="badge bg-success">Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="stat-icon primary">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h6 className="text-muted mb-2">Total Loan Amount</h6>
              <h3 className="mb-0">₹{loans.reduce((sum, loan) => sum + (loan.principal || loan.totalLoan || 0), 0).toLocaleString()}</h3>
              <div className="mt-3">
                <small className="text-success">
                  <i className="fas fa-chart-line me-1"></i>Total Portfolio
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="stat-icon info">
                <i className="fas fa-hand-holding-usd"></i>
              </div>
              <h6 className="text-muted mb-2">Amount Collected</h6>
              <h3 className="mb-0">₹{loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0).toLocaleString()}</h3>
              <div className="mt-3">
                <small className="text-info">
                  <i className="fas fa-money-bill-wave me-1"></i>Total Recovered
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="stat-icon warning">
                <i className="fas fa-hourglass-half"></i>
              </div>
              <h6 className="text-muted mb-2">Pending Amount</h6>
              <h3 className="mb-0">₹{loans.reduce((sum, loan) => sum + ((loan.principal || loan.totalLoan || 0) - (loan.paidAmount || 0)), 0).toLocaleString()}</h3>
              <div className="mt-3">
                <small className="text-warning">
                  <i className="fas fa-clock me-1"></i>To be Collected
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filter-section mb-4">
        <div className="card-body p-0">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by customer name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card table-container">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Borrower Name</th>
                  <th>Phone Number</th>
                  <th>Total Loan</th>
                  <th>Paid Amount</th>
                  <th>EMI</th>
                  <th>Interest Rate</th>
                  <th>Payment Mode</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="fw-medium">{loan.borrowerName}</td>
                      <td>{loan.phoneNumber}</td>
                      <td>₹{loan.totalLoan?.toLocaleString()}</td>
                      <td>₹{loan.paidAmount?.toLocaleString()}</td>
                      <td>₹{loan.emi?.toLocaleString()}</td>
                      <td>{loan.interestRate}%</td>
                      <td>
                        <span className="text-primary">{loan.paymentMode}</span>
                      </td>
                      <td>{new Date(loan.startDate).toLocaleDateString()}</td>
                      <td>{new Date(loan.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          loan.status === 'Active' ? 'bg-success-subtle text-success' :
                          loan.status === 'Closed' ? 'bg-secondary-subtle text-secondary' :
                          'bg-warning-subtle text-warning'
                        } px-2 py-1 rounded-pill`}>
                          {loan.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: '150px' }}>
                          <div className="progress flex-grow-1" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
                            <div 
                              className={`progress-bar ${
                                loan.status === 'Closed' ? 'bg-success' :
                                loan.status === 'Pending' ? 'bg-warning' : 'bg-primary'
                              }`}
                              style={{ 
                                width: `${((loan.paidAmount || 0) / (loan.totalLoan || 1)) * 100}%`,
                                transition: 'width 0.5s ease-in-out'
                              }}
                            ></div>
                          </div>
                          <div style={{ minWidth: '100px' }}>
                            <small className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                              ₹{(loan.paidAmount || 0).toLocaleString()} / ₹{(loan.totalLoan || 0).toLocaleString()}
                            </small>
                            <br />
                            <small className="text-primary" style={{ whiteSpace: 'nowrap' }}>
                              {Math.round(((loan.paidAmount || 0) / (loan.totalLoan || 1)) * 100)}% paid
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-icon btn-sm rounded-circle btn-light-primary"
                            onClick={() => handleEdit(loan)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-icon btn-sm rounded-circle btn-light-danger"
                            onClick={() => handleDelete(loan.id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="table-empty">
                      <i className="fas fa-inbox"></i>
                      <p>No loan records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingLoan ? 'Edit Loan Record' : 'Add New Loan'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-4">
                    {/* Borrower Information */}
                    <div className="col-12">
                      <h6 className="section-title">Borrower Information</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Borrower Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter borrower name"
                            value={formData.borrowerName}
                            onChange={(e) => setFormData({...formData, borrowerName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Phone Number *</label>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Enter phone number"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="col-12">
                      <h6 className="section-title">Loan Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Total Loan Amount *</label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter total loan amount"
                              value={formData.totalLoan}
                              onChange={(e) => setFormData({...formData, totalLoan: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Paid Amount *</label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter paid amount"
                              value={formData.paidAmount}
                              onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">EMI Amount *</label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter EMI amount"
                              value={formData.emi}
                              onChange={(e) => setFormData({...formData, emi: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Interest Rate (%) *</label>
                          <div className="input-group">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="Enter interest rate"
                              value={formData.interestRate}
                              onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                              required
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="col-12">
                      <h6 className="section-title">Payment Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Payment Mode *</label>
                          <select
                            className="form-select"
                            value={formData.paymentMode}
                            onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                            required
                          >
                            <option value="">Select payment mode</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Status *</label>
                          <select
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            required
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Start Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">End Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingLoan ? 'Update Loan' : 'Add Loan'}
                  </button>
                </div>
              </form>
            </div>
          </div>  
        </div>
      )}
    </div>
  );
};

export default LoanRecords;