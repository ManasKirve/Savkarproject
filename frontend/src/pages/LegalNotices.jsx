import React, { useState, useEffect } from "react";
import ApiService from "../services/apiService";

const LegalNotices = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [borrowers, setBorrowers] = useState([]);
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerId: "",
    amountDue: "",
    noticeDate: "",
    status: "Pending",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotices();
    loadBorrowers();
  }, []);

  useEffect(() => {
    filterNotices();
  }, [notices, searchTerm, statusFilter]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const noticesData = await ApiService.getAllNotices();
      setNotices(noticesData || []);
    } catch (error) {
      console.error("Error loading notices:", error);
      setError("Failed to load notices. Please try again later.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowers = async () => {
    try {
      const borrowersData = await ApiService.getAllLoans();
      setBorrowers(borrowersData || []);
    } catch (error) {
      console.error("Error loading borrowers:", error);
      setBorrowers([]);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    if (searchTerm) {
      filtered = filtered.filter(
        (notice) =>
          (notice.borrowerName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (notice.borrowerId || "").includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((notice) => notice.status === statusFilter);
    }

    setFilteredNotices(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const noticeData = {
      borrowerName: formData.borrowerName,
      borrowerId: formData.borrowerId || "",
      amountDue: parseFloat(formData.amountDue),
      noticeDate: formData.noticeDate,
      status: formData.status,
      description: formData.description,
    };

    try {
      if (editingNotice) {
        await ApiService.updateNotice(editingNotice.id, noticeData);
      } else {
        await ApiService.createNotice(noticeData);
      }
      loadNotices();
      resetForm();
    } catch (error) {
      console.error("Error saving notice:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to save notice. Please try again.";
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      borrowerName: "",
      borrowerId: "",
      amountDue: "",
      noticeDate: "",
      status: "Pending",
      description: "",
    });
    setEditingNotice(null);
    setShowAddModal(false);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      borrowerName: notice.borrowerName || "",
      borrowerId: notice.borrowerId || "",
      amountDue: (notice.amountDue || 0).toString(),
      noticeDate: notice.noticeDate || "",
      status: notice.status || "Pending",
      description: notice.description || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this legal notice?")) {
      try {
        await ApiService.deleteNotice(id);
        loadNotices();
      } catch (error) {
        console.error("Error deleting notice:", error);
        const errorMessage = error.response?.data?.detail || error.message || "Failed to delete notice. Please try again.";
        alert(errorMessage);
      }
    }
  };

  const handleBorrowerSelect = (e) => {
    const borrowerId = e.target.value;
    if (!borrowerId) {
      setFormData({
        ...formData,
        borrowerName: "",
        borrowerId: "",
        amountDue: "",
        noticeDate: "",
      });
      return;
    }

    const selectedBorrower = borrowers.find(b => b.id === borrowerId);
    if (selectedBorrower) {
      const amountDue = (selectedBorrower.totalLoan || 0) - (selectedBorrower.paidAmount || 0);
      const today = new Date().toISOString().split('T')[0];
      
      setFormData({
        ...formData,
        borrowerName: selectedBorrower.borrowerName || "",
        borrowerId: selectedBorrower.id || "",
        amountDue: amountDue.toString(),
        noticeDate: today,
      });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-light text-warning border border-warning";
      case "Resolved":
        return "bg-light text-success border border-success";
      default:
        return "bg-light text-secondary border border-secondary";
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4" style={{ paddingTop: "20px" }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading legal notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4" style={{ paddingTop: "20px" }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ paddingTop: "20px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">Legal Notices</h2>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus me-2"></i>
            Create Notice
          </button>

          <button className="btn btn-outline-primary d-flex align-items-center">
            <i className="fas fa-download me-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-warning">
            <div className="card-body text-center">
              <h3 className="text-warning">
                {notices.filter((n) => n.status === "Pending").length}
              </h3>
              <h6 className="text-muted">Pending Notices</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-success">
            <div className="card-body text-center">
              <h3 className="text-success">
                {notices.filter((n) => n.status === "Resolved").length}
              </h3>
              <h6 className="text-muted">Resolved Notices</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-info">
            <div className="card-body text-center">
              <h3 className="text-info">
                {notices.length}
              </h3>
              <h6 className="text-muted">Total Notices</h6>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card border-danger">
            <div className="card-body text-center">
              <h3 className="text-danger">
                ₹{notices.reduce((sum, n) => sum + (n.amountDue || 0), 0).toLocaleString()}
              </h3>
              <h6 className="text-muted">Total Amount Due</h6>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by borrower name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Notices Table */}
      <div className="card table-container">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Borrower Details</th>
                  <th>Amount Due</th>
                  <th>Notice Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No notices found
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((notice) => (
                    <tr key={notice.id}>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {notice.borrowerName}
                          </div>
                          <small className="text-muted">
                            ID: {notice.borrowerId || "N/A"}
                          </small>
                        </div>
                      </td>
                      <td className="text-danger fw-bold">
                        ₹{notice.amountDue.toLocaleString()}
                      </td>
                      <td>
                        {new Date(notice.noticeDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusClass(notice.status)}`}>
                          {notice.status}
                        </span>
                      </td>
                      <td>
                        <div 
                          className="text-truncate" 
                          style={{ maxWidth: "200px" }} 
                          title={notice.description || "No description"}>
                          {notice.description || "No description"}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(notice)}
                            title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Generate PDF">
                            <i className="fas fa-file-pdf"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(notice.id)}
                            title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingNotice
                    ? "Edit Legal Notice"
                    : "Create New Legal Notice"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Select Borrower</label>
                      <select
                        className="form-select"
                        value={formData.borrowerId}
                        onChange={handleBorrowerSelect}>
                        <option value="">Select a borrower...</option>
                        {borrowers.map(borrower => (
                          <option key={borrower.id} value={borrower.id}>
                            {borrower.borrowerName} - {borrower.phoneNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Borrower Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.borrowerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            borrowerName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Borrower ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.borrowerId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            borrowerId: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        readOnly
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Amount Due *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.amountDue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            amountDue: e.target.value,
                          })
                        }
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Notice Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.noticeDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            noticeDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value,
                          })
                        }
                        required>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Additional details about the notice..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingNotice ? "Update Notice" : "Create Notice"}
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