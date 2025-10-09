import React, { useState, useEffect } from 'react';
import { LoanService } from '../services/loanService';

const LegalNotices = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    loanAmount: '',
    overdueAmount: '',
    noticeType: 'demand',
    issueDate: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    loadNotices();
  }, []);

  useEffect(() => {
    filterNotices();
  }, [notices, searchTerm, statusFilter]);

  const loadNotices = async () => {
    try {
      // Initialize data if it hasn't been initialized
      LoanService.initializeData();
      const noticesData = LoanService.getAllNotices();
      setNotices(noticesData || []);
    } catch (error) {
      console.error('Error loading notices:', error);
      setNotices([]);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    if (searchTerm) {
      filtered = filtered.filter(notice => 
        (notice.customerName || notice.borrowerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notice.customerPhone || notice.phoneNumber || '').includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(notice => notice.status === statusFilter);
    }

    setFilteredNotices(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const noticeData = {
      ...formData,
      loanAmount: parseFloat(formData.loanAmount),
      overdueAmount: parseFloat(formData.overdueAmount),
      status: 'pending'
    };

    if (editingNotice) {
      LoanService.updateNotice(editingNotice.id, noticeData);
    } else {
      LoanService.createNotice(noticeData);
    }

    loadNotices();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      loanAmount: '',
      overdueAmount: '',
      noticeType: 'demand',
      issueDate: '',
      dueDate: '',
      description: ''
    });
    setEditingNotice(null);
    setShowAddModal(false);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      customerName: notice.customerName || notice.borrowerName || '',
      customerPhone: notice.customerPhone || notice.phoneNumber || '',
      loanAmount: (notice.loanAmount || notice.amountDue || '0').toString(),
      overdueAmount: (notice.overdueAmount || notice.amountDue || '0').toString(),
      noticeType: notice.noticeType || 'demand',
      issueDate: notice.issueDate || notice.noticeDate || '',
      dueDate: notice.dueDate || notice.noticeDate || '',
      description: notice.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this legal notice?')) {
      LoanService.deleteNotice(id);
      loadNotices();
    }
  };

  const getNoticeTypeClass = (type) => {
    switch (type) {
      case 'demand': return 'bg-light text-warning border border-warning';
      case 'legal': return 'bg-light text-danger border border-danger';
      case 'court': return 'bg-light text-dark border border-dark';
      default: return 'bg-light text-secondary border border-secondary';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-light text-warning border border-warning';
      case 'sent': return 'bg-light text-info border border-info';
      case 'responded': return 'bg-light text-success border border-success';
      case 'legal_action': return 'bg-light text-secondary border border-secondary';
      default: return 'bg-light text-secondary border border-secondary';
    }
  };

  return (
    <div className="container-fluid p-4" style={{ paddingTop: '20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Legal Notices</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Create Notice
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-warning">
            <div className="card-body text-center">
              <h3 className="text-warning">{notices.filter(n => n.status === 'pending').length}</h3>
              <h6 className="text-muted">Pending Notices</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-info">
            <div className="card-body text-center">
              <h3 className="text-info">{notices.filter(n => n.status === 'sent').length}</h3>
              <h6 className="text-muted">Sent Notices</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-success">
            <div className="card-body text-center">
              <h3 className="text-success">{notices.filter(n => n.status === 'responded').length}</h3>
              <h6 className="text-muted">Responded</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-secondary">
            <div className="card-body text-center">
              <h3 className="text-secondary">{notices.filter(n => n.status === 'legal_action').length}</h3>
              <h6 className="text-muted">Legal Action</h6>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
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
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="responded">Responded</option>
                <option value="legal_action">Legal Action</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-primary w-100">
                <i className="fas fa-download me-2"></i>Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notices Table */}
      <div className="card table-container">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer Details</th>
                  <th>Notice Type</th>
                  <th>Loan Amount</th>
                  <th>Overdue Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                        <div>
                         <div className="fw-medium">{notice.customerName || notice.borrowerName}</div>
                         <small className="text-muted">{notice.customerPhone || notice.phoneNumber}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getNoticeTypeClass(notice.noticeType || 'demand')}`}>
                        {(notice.noticeType || 'demand').charAt(0).toUpperCase() + (notice.noticeType || 'demand').slice(1)}
                      </span>
                    </td>
                    <td>₹{(notice.loanAmount || notice.amountDue || 0).toLocaleString()}</td>
                    <td className="text-danger fw-bold">₹{(notice.overdueAmount || notice.amountDue || 0).toLocaleString()}</td>
                    <td>{new Date(notice.issueDate || notice.noticeDate).toLocaleDateString()}</td>
                    <td>{new Date(notice.dueDate || notice.noticeDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getStatusClass(notice.status)}`}>
                        {notice.status.replace('_', ' ').charAt(0).toUpperCase() + notice.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(notice)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success"
                          title="Generate PDF"
                        >
                          <i className="fas fa-file-pdf"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  {editingNotice ? 'Edit Legal Notice' : 'Create New Legal Notice'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Customer Phone *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Original Loan Amount *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({...formData, loanAmount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Overdue Amount *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.overdueAmount}
                        onChange={(e) => setFormData({...formData, overdueAmount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Notice Type *</label>
                      <select
                        className="form-select"
                        value={formData.noticeType}
                        onChange={(e) => setFormData({...formData, noticeType: e.target.value})}
                        required
                      >
                        <option value="demand">Demand Notice</option>
                        <option value="legal">Legal Notice</option>
                        <option value="court">Court Notice</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Issue Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Response Due Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description/Notes</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Additional details about the notice..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingNotice ? 'Update Notice' : 'Create Notice'}
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

export default LegalNotices;