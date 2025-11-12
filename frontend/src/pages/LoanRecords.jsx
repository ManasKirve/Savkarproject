import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/apiService";
import "./LoanRecords.css";

const LoanRecords = () => {
  const navigate = useNavigate();

  // State for loan management
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState({
    borrowerName: "",
    phoneNumber: "",
    emi: "",
    startDate: "",
    endDate: "",
    interestRate: "",
    paymentMode: "Cash",
    totalLoan: "",
    paidAmount: "0",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil((filteredLoans?.length || 0) / rowsPerPage);

  // Slice data for current page
  const currentLoans = filteredLoans?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm, statusFilter]);

  const loadLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("LoanRecords: Starting to load loans...");

      // First, check if the backend is reachable
      try {
        const healthCheck = await ApiService.healthCheck();
        console.log("Health check result:", healthCheck);
      } catch (healthError) {
        console.error("Health check failed:", healthError);
        setError(
          "Backend server is not reachable. Please check if the server is running."
        );
        return;
      }

      // Use the savkar user ID
      const savkarUserId = "savkar_user_001";
      const res = await ApiService.getMyLoans(savkarUserId);
      console.log("LoanRecords: Loans data received:", res);

      let loansData = Array.isArray(res) ? res : res?.data ?? [];
      setLoans(loansData);
      setFilteredLoans(loansData);
    } catch (error) {
      console.error("LoanRecords: Error loading loans:", error);

      // Try to get more debug information
      try {
        const debugInfo = await ApiService.debugFirebase();
        console.error("Debug info:", debugInfo);
      } catch (debugError) {
        console.error("Failed to get debug info:", debugError);
      }

      const msg = (error && error.message) || "";
      if (msg.includes("403") || /Forbidden/i.test(msg)) {
        setError("Not authenticated. Please sign in to view your loans.");
      } else if (
        msg.includes("401") ||
        /Unauthorized|Invalid authentication/i.test(msg)
      ) {
        setError("Authentication failed. Please sign in again.");
      } else if (msg.includes("500")) {
        setError("Server error occurred. Please try again later.");
      } else {
        setError(`Failed to load loans: ${msg}`);
      }
      setLoans([]);
      setFilteredLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.totalLoan && formData.interestRate) {
      const autoEmi =
        (parseFloat(formData.totalLoan) * parseFloat(formData.interestRate)) /
        100;

      setFormData((prev) => ({
        ...prev,
        emi: autoEmi.toFixed(2),
      }));
    }
  }, [formData.totalLoan, formData.interestRate]);

  const syncLocalLoans = async () => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("loan_records");
      if (!raw) {
        alert("No local loans found to sync.");
        return;
      }
      const localLoans = JSON.parse(raw || "[]");
      if (!Array.isArray(localLoans) || localLoans.length === 0) {
        alert("No local loans found to sync.");
        return;
      }
      let anySynced = 0;
      for (let i = 0; i < localLoans.length; i++) {
        const loan = localLoans[i];
        // Skip if already marked as synced
        if (loan.synced) continue;
        try {
          // Use global create loan endpoint
          await ApiService.createLoan(loan);
          localLoans[i].synced = true;
          anySynced++;
        } catch (e) {
          console.warn("Sync loan failed for", loan, e);
        }
      }
      // Persist back the synced flags
      window.localStorage.setItem("loan_records", JSON.stringify(localLoans));
      loadLoans();
      alert(`Sync finished. ${anySynced} loan(s) synced to server.`);
    } catch (e) {
      console.error("syncLocalLoans error", e);
      alert("Failed to sync local loans. See console for details.");
    }
  };

  const filterLoans = () => {
    console.log(
      "LoanRecords: Filtering loans with searchTerm:",
      searchTerm,
      "and statusFilter:",
      statusFilter
    );
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter((loan) => {
        const name = (loan.borrowerName || loan.customerName || "")
          .toString()
          .toLowerCase();
        const phone = (loan.phoneNumber || loan.customerPhone || "").toString();
        return (
          name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    console.log("LoanRecords: Filtered loans count:", filtered.length);
    setFilteredLoans(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loanData = {
      borrowerName: formData.borrowerName,
      phoneNumber: formData.phoneNumber,
      totalLoan: parseFloat(formData.totalLoan) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      emi: parseFloat(formData.emi) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      paymentMode: formData.paymentMode,
      status: formData.status,
    };

    // Calculate progress percentage
    const progress = (loanData.paidAmount / loanData.totalLoan) * 100;

    // Update status based on progress
    if (progress >= 100) {
      loanData.status = "Closed";
    } else if (progress > 0) {
      loanData.status = "Active";
    }

    try {
      console.log("LoanRecords: Submitting loan data:", loanData);

      // Show loading state
      setLoading(true);

      if (editingLoan) {
        // Use global update endpoint
        await ApiService.updateLoan(editingLoan.id, loanData);
      } else {
        // Use global create endpoint
        const result = await ApiService.createLoan(loanData);
        console.log("LoanRecords: Loan created successfully:", result);
      }

      loadLoans();
      resetForm();
    } catch (error) {
      console.error("LoanRecords: Error saving loan:", error);
      alert(`Failed to save loan: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      borrowerName: "",
      phoneNumber: "",
      paidAmount: "0",
      emi: "",
      startDate: "",
      endDate: "",
      interestRate: "",
      paymentMode: "Bank Transfer",
      totalLoan: "",
      status: "Active",
    });
    setEditingLoan(null);
    setShowAddModal(false);
  };

  const handleEdit = (loan) => {
    console.log("LoanRecords: Editing loan:", loan);
    setEditingLoan(loan);
    setFormData({
      borrowerName: loan.borrowerName || "",
      phoneNumber: loan.phoneNumber || "",
      paidAmount: loan.paidAmount?.toString() || "0",
      emi: loan.emi?.toString() || "",
      startDate: loan.startDate || "",
      endDate: loan.endDate || "",
      interestRate: loan.interestRate?.toString() || "",
      paymentMode: loan.paymentMode || "Cash",
      totalLoan: loan.totalLoan?.toString() || "",
      paidAmount: loan.paidAmount?.toString() || "0",
      status: loan.status || "Active",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loan record?")) {
      try {
        console.log("LoanRecords: Deleting loan with id:", id);
        // Use global delete endpoint
        await ApiService.deleteLoan(id);
        loadLoans();
      } catch (error) {
        console.error("LoanRecords: Error deleting loan:", error);
        alert("Failed to delete loan. Please try again.");
      }
    }
  };

  // Profile functionality - Navigate to profile page
  const handleProfileClick = (loan) => {
    console.log("LoanRecords: Navigating to profile for loan:", loan);
    navigate(`/profile/${loan.id}`);
  };

  // Add loading and error states
  if (loading) {
    return (
      <div className="container-fluid py-4 px-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading loans...</span>
          </div>
          <p className="mt-3">Loading loan records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4 px-4">
        <div className="alert alert-danger">
          <h5>Error Loading Loans</h5>
          <p>{error}</p>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={loadLoans}>
              Retry Loading Loans
            </button>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={async () => {
                try {
                  const debugInfo = await ApiService.debugFirebase();
                  alert(`Debug Info: ${JSON.stringify(debugInfo, null, 2)}`);
                } catch (e) {
                  alert(`Failed to get debug info: ${e.message}`);
                }
              }}>
              Show Debug Info
            </button>
            <button
              className="btn btn-outline-info"
              onClick={async () => {
                try {
                  const response = await fetch(
                    "http://localhost:8000/test-connection"
                  );
                  const data = await response.json();
                  alert(`Connection Test: ${JSON.stringify(data, null, 2)}`);
                } catch (e) {
                  alert(`Connection test failed: ${e.message}`);
                }
              }}>
              Test Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1" style={{ color: "#1e293b", fontWeight: "600" }}>
            Loan Records
          </h2>
          <p className="text-muted mb-0">Manage and track all loan records</p>
        </div>
        {/* small sync button (sync localStorage loans to backend) */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={async () => {
              try {
                const response = await fetch(
                  "http://localhost:8000/test-connection"
                );
                const data = await response.json();
                alert(`Connection Test: ${JSON.stringify(data, null, 2)}`);
              } catch (e) {
                alert(`Connection test failed: ${e.message}`);
              }
            }}>
            Test Connection
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={async () => {
              await syncLocalLoans();
            }}>
            Sync Local Loans
          </button>
        </div>
        <div className="card p-2">
          <div className="d-flex align-items-center justify-content-around">
            <h6 className="text-muted">TOTAL LOANS</h6>
            <h3 className="ms-4">{loans.length}</h3>
          </div>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center"
          onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus me-2"></i>
          <span>Add New Loan</span>
        </button>
      </div>

      <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
        <div className="col-md-4">
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
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card table-container">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="wth-250">CUSTOMER NAME</th>
                  <th>PHONE NUMBER</th>
                  <th>TOTAL LOAN</th>
                  <th>PAID AMOUNT</th>
                  <th>EMI</th>
                  <th>INTEREST RATE</th>
                  <th>PAYMENT MODE</th>
                  <th>START DATE</th>
                  <th>END DATE</th>
                  <th>STATUS</th>
                  <th>PROGRESS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentLoans && currentLoans.length > 0 ? (
                  currentLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="fw-medium wth-250">{loan.borrowerName}</td>
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
                        <span
                          className={`badge ${
                            loan.status === "Active"
                              ? "bg-success"
                              : loan.status === "Closed"
                              ? "bg-secondary"
                              : "bg-warning"
                          }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td>
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{ minWidth: "150px" }}>
                          <div
                            className="progress flex-grow-1"
                            style={{
                              height: "8px",
                              backgroundColor: "#f0f0f0",
                            }}>
                            <div
                              className={`progress-bar ${
                                loan.status === "Closed"
                                  ? "bg-success"
                                  : loan.status === "Pending"
                                  ? "bg-warning"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${
                                  ((loan.paidAmount || 0) /
                                    (loan.totalLoan || 1)) *
                                  100
                                }%`,
                                transition: "width 0.5s ease-in-out",
                              }}></div>
                          </div>
                          <div style={{ minWidth: "100px" }}>
                            <small
                              className="text-muted"
                              style={{ whiteSpace: "nowrap" }}>
                              ₹{(loan.paidAmount || 0).toLocaleString()} / ₹
                              {(loan.totalLoan || 0).toLocaleString()}
                            </small>
                            <br />
                            <small
                              className="text-primary"
                              style={{ whiteSpace: "nowrap" }}>
                              {Math.round(
                                ((loan.paidAmount || 0) /
                                  (loan.totalLoan || 1)) *
                                  100
                              )}
                              % paid
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-icon btn-sm rounded-circle btn-light-info"
                            onClick={() => handleProfileClick(loan)}
                            title="Profile">
                            <i className="fas fa-user"></i>
                          </button>
                          <button
                            className="btn btn-icon btn-sm rounded-circle btn-light-primary"
                            onClick={() => handleEdit(loan)}
                            title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-icon btn-sm rounded-circle btn-light-danger"
                            onClick={() => handleDelete(loan.id)}
                            title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-loans">
                    <td colSpan="12" className="text-center py-4">
                      <p className="text-muted mb-0">No loan records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center py-2">
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted">
                Showing {(currentPage - 1) * rowsPerPage + 1}–
                {Math.min(currentPage * rowsPerPage, filteredLoans.length)} of
                {filteredLoans.length} entries
              </small>

              <div className="d-flex align-items-center">
                <label className="me-2 text-muted">Rows per page:</label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "80px" }}
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when rows per page changes
                  }}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}>
                    Previous
                  </button>
                </li>

                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i}
                    className={`page-item ${
                      currentPage === i + 1 ? "active" : ""
                    }`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
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
                  {editingLoan ? "Edit Loan Record" : "Add New Loan"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Borrower Information */}
                    <div className="col-12">
                      <h6 className="text-muted">Borrower Information</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Borrower Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter borrower name"
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
                        <div className="col-md-6">
                          <label className="form-label">Phone Number *</label>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Enter phone number"
                            maxLength={10}
                            value={formData.phoneNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phoneNumber: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="col-12">
                      <h6 className="mb-3 text-muted">Loan Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">
                            Total Loan Amount *
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter total loan amount"
                              value={formData.totalLoan}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  totalLoan: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Interest Rate (%) *
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="Enter interest rate"
                              value={formData.interestRate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  interestRate: e.target.value,
                                })
                              }
                              required
                            />
                            <span className="input-group-text">%</span>
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
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  emi: e.target.value,
                                })
                              }
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
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  paidAmount: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="col-12">
                      <h6 className="mb-3 text-muted">Payment Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Payment Mode *</label>
                          <select
                            className="form-select"
                            value={formData.paymentMode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                paymentMode: e.target.value,
                              })
                            }
                            required>
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
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value,
                              })
                            }
                            required>
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
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">End Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
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
                    {editingLoan ? "Update Loan" : "Add Loan"}
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
