import React, { useState, useEffect } from "react";
import ApiService from "../services/apiService";
import "./LoanRecords.css";
import { useNavigate } from "react-router-dom";

const LoanRecords = () => {
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
    lastAmount: "",
    emi: "",
    startDate: "",
    endDate: "",
    interestRate: "",
    paymentMode: "Cash",
    totalLoan: "",
    paidAmount: "0",
    status: "Active",
  });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "ID Proof",
    file: null,
    fileName: "",
  });
  const [profileFormData, setProfileFormData] = useState({
    profilePhoto: "",
    occupation: "",
    address: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm, statusFilter]);

  // Load documents when a loan is selected
  useEffect(() => {
    if (selectedLoan) {
      loadDocuments(selectedLoan.id);
      setProfileFormData({
        profilePhoto: selectedLoan.profilePhoto || "",
        occupation: selectedLoan.occupation || "",
        address: selectedLoan.address || "",
      });
    }
  }, [selectedLoan]);

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
        setError("Backend server is not reachable. Please check if the server is running.");
        return;
      }
      
      // Use the savkar user ID
      const savkarUserId = "savkar_user_001";
      const res = await ApiService.getMyLoans(savkarUserId);
      console.log("LoanRecords: Loans data received:", res);
      // ApiService normalizes server snake_case -> camelCase and may return array or { data: [...] }
      const loansData = Array.isArray(res) ? res : res?.data ?? [];

      // Don't treat empty array as an error; just show empty state if no records exist
      setLoans(loansData);
      setFilteredLoans(loansData);
    } catch (error) {
      console.error("LoanRecords: Error loading loans:", error);
      setError("Failed to load loans. Please try again later.");
      setLoans([]);
      setFilteredLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalLoans = async () => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('loan_records');
      if (!raw) {
        alert('No local loans found to sync.');
        return;
      }
      const localLoans = JSON.parse(raw || '[]');
      if (!Array.isArray(localLoans) || localLoans.length === 0) {
        alert('No local loans found to sync.');
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
          console.warn('Sync loan failed for', loan, e);
        }
      }
      // Persist back the synced flags
      window.localStorage.setItem('loan_records', JSON.stringify(localLoans));
      loadLoans();
      alert(`Sync finished. ${anySynced} loan(s) synced to server.`);
    } catch (e) {
      console.error('syncLocalLoans error', e);
      alert('Failed to sync local loans. See console for details.');
    }
  };

  const loadDocuments = async (loanId) => {
    try {
      console.log("LoanRecords: Loading documents for loan:", loanId);
      // Use global documents endpoint
      const loanDocuments = await ApiService.getDocumentsByLoanId(loanId);
      console.log("LoanRecords: Documents loaded:", loanDocuments);
      setDocuments(loanDocuments);
    } catch (error) {
      console.error("LoanRecords: Error loading documents:", error);
      setDocuments([]);
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
      alert("Failed to save loan. Please try again.");
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

  // Profile functionality
  const handleProfileClick = (loan) => {
    navigate(`/profile/${loan.id}`);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileFormData({ ...profileFormData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadProfileImage = () => {
    if (!profileFormData.profilePhoto) return;

    // Create a download link for the profile image
    const link = document.createElement("a");
    link.href = profileFormData.profilePhoto;
    link.download = `${selectedLoan.borrowerName.replace(
      /\s+/g,
      "_"
    )}_profile.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocument({
        ...newDocument,
        file,
        fileName: file.name,
      });
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.file || newDocument.name.trim() === "") return;

    try {
      console.log("LoanRecords: Adding document:", newDocument);
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Use global document endpoint
        await ApiService.createDocument({
          loanId: selectedLoan.id,
          name: newDocument.name,
          type: newDocument.type,
          fileContent: reader.result,
          fileName: newDocument.fileName,
        });

        // Refresh documents
        loadDocuments(selectedLoan.id);

        // Reset form
        setNewDocument({
          name: "",
          type: "ID Proof",
          file: null,
          fileName: "",
        });
        document.getElementById("document-file-input").value = "";
      };
      reader.readAsDataURL(newDocument.file);
    } catch (error) {
      console.error("LoanRecords: Error adding document:", error);
      alert("Failed to add document. Please try again.");
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      console.log("LoanRecords: Deleting document with id:", id);
      // Use global document endpoint
      await ApiService.deleteDocument(id);
      // Refresh documents
      loadDocuments(selectedLoan.id);
    } catch (error) {
      console.error("LoanRecords: Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log("LoanRecords: Saving profile for loan:", selectedLoan);
      // Convert profile image to base64 if a new file was selected
      if (profileImageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          // Use global update endpoint
          await ApiService.updateLoan(selectedLoan.id, {
            profilePhoto: reader.result,
            occupation: profileFormData.occupation,
            address: profileFormData.address,
          });

          // Update the selectedLoan in state to reflect changes
          setSelectedLoan({
            ...selectedLoan,
            profilePhoto: reader.result,
            occupation: profileFormData.occupation,
            address: profileFormData.address,
          });

          // Also update the loans list to reflect changes in the table
          loadLoans();
        };
        reader.readAsDataURL(profileImageFile);
      } else {
        // Update without changing the profile photo
        // Use global update endpoint
        await ApiService.updateLoan(selectedLoan.id, {
          profilePhoto: profileFormData.profilePhoto,
          occupation: profileFormData.occupation,
          address: profileFormData.address,
        });

        // Update the selectedLoan in state to reflect changes
        setSelectedLoan({
          ...selectedLoan,
          profilePhoto: profileFormData.profilePhoto,
          occupation: profileFormData.occupation,
          address: profileFormData.address,
        });

        // Also update the loans list to reflect changes in the table
        loadLoans();
      }
    } catch (error) {
      console.error("LoanRecords: Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  const downloadDocument = (document) => {
    // Create a download link for the document
    const link = document.createElement("a");
    link.href = document.fileContent;
    link.download = document.fileName || document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add function to check if a file is an image
  const isImageFile = (fileName) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const extension = fileName.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  // Add function to view document
  const handleViewDocument = (document) => {
    console.log("LoanRecords: Viewing document:", document);
    setViewingDocument(document);
  };

  const closeDocumentModal = () => {
    setViewingDocument(null);
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
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Check if we have loans data
  if (!loans || loans.length === 0) {
    return (
      <div className="container-fluid py-4 px-4">
        <div className="alert alert-warning">
          No loan records found. Please check your backend connection or add
          some loans.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="mb-1" style={{ color: "#1e293b", fontWeight: "600" }}>
            Loan Records
          </h2>
          <p className="text-muted mb-0">Manage and track all loan records</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center"
          onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus me-2"></i>
          <span>Add New Loan</span>
        </button>
      </div>

      {/* Statistics Overview */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Active Loans</h6>
              <h3 className="mb-0">
                {loans.filter((loan) => loan.status === "Active").length}
              </h3>
              <div className="mt-2">
                <span className="badge bg-success">Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Loan Amount</h6>
              <h3 className="mb-0">
                ₹
                {loans
                  .reduce(
                    (sum, loan) =>
                      sum + (loan.principal || loan.totalLoan || 0),
                    0
                  )
                  .toLocaleString()}
              </h3>
              <div className="mt-2">
                <small className="text-success">
                  <i className="fas fa-chart-line me-1"></i>Total Portfolio
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Amount Collected</h6>
              <h3 className="mb-0">
                ₹
                {loans
                  .reduce((sum, loan) => sum + (loan.paidAmount || 0), 0)
                  .toLocaleString()}
              </h3>
              <div className="mt-2">
                <small className="text-info">
                  <i className="fas fa-money-bill-wave me-1"></i>Total Recovered
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Pending Amount</h6>
              <h3 className="mb-0">
                ₹
                {loans
                  .reduce(
                    (sum, loan) =>
                      sum +
                      ((loan.principal || loan.totalLoan || 0) -
                        (loan.paidAmount || 0)),
                    0
                  )
                  .toLocaleString()}
              </h3>
              <div className="mt-2">
                <small className="text-warning">
                  <i className="fas fa-clock me-1"></i>To be Collected
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex justify-content-end align-items-center my-3 gap-2">
        {/* Search Input */}
        <div className="input-group" style={{ width: "400px" }}>
          <span className="input-group-text">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ width: "160px" }}>
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
                  <th>CUSTOMER NAME</th>
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
                {filteredLoans.map((loan) => (
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
                      <span
                        className={`badge ${
                          loan.status === "Active"
                            ? "bg-success-subtle text-success"
                            : loan.status === "Closed"
                            ? "bg-secondary-subtle text-secondary"
                            : "bg-warning-subtle text-warning"
                        } px-2 py-1 rounded-pill`}>
                        {loan.status}
                      </span>
                    </td>
                    <td>
                      <div
                        className="d-flex align-items-center gap-2"
                        style={{ minWidth: "150px" }}>
                        <div
                          className="progress flex-grow-1"
                          style={{ height: "8px", backgroundColor: "#f0f0f0" }}>
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
                              ((loan.paidAmount || 0) / (loan.totalLoan || 1)) *
                                100
                            )}
                            % paid
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {/* Profile Button */}
                        <button
                          className="btn btn-icon btn-sm rounded-circle btn-light-info"
                          onClick={() => handleProfileClick(loan)}
                          title="Profile">
                          <i className="fas fa-user"></i>
                        </button>
                        {/* Edit Button */}
                        <button
                          className="btn btn-icon btn-sm rounded-circle btn-light-primary"
                          onClick={() => handleEdit(loan)}
                          title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        {/* Delete Button */}
                        <button
                          className="btn btn-icon btn-sm rounded-circle btn-light-danger"
                          onClick={() => handleDelete(loan.id)}
                          title="Delete">
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
                      <h6 className="mb-3 text-muted">Borrower Information</h6>
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

      {viewingDocument && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{viewingDocument.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDocumentModal}></button>
              </div>
              <div className="modal-body text-center">
                {viewingDocument.fileContent &&
                isImageFile(
                  viewingDocument.fileName || viewingDocument.name
                ) ? (
                  <img
                    src={viewingDocument.fileContent}
                    alt={viewingDocument.name}
                    className="img-fluid"
                    style={{ maxHeight: "70vh" }}
                  />
                ) : (
                  <div className="p-5">
                    <i className="fas fa-file-alt fa-5x text-muted mb-3"></i>
                    <h4>{viewingDocument.name}</h4>
                    <p className="text-muted">
                      This document cannot be previewed. Please download to
                      view.
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDocumentModal}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => downloadDocument(viewingDocument)}>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRecords;
