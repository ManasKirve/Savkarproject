import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService'; 
import './LoanRecords.css';

const LoanRecords = () => {
  // State for loan management
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState({
    borrowerName: '',
    phoneNumber: '',
    emi: '',
    startDate: '',
    endDate: '',
    interestRate: '',
    paymentMode: 'Cash',
    totalLoan: '',
    paidAmount: '0',
    status: 'Active'
  });

  // State for profile functionality
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({ 
    name: '', 
    type: 'ID Proof', 
    file: null,
    fileName: '' 
  });
  const [profileFormData, setProfileFormData] = useState({
    profilePhoto: '',
    occupation: '',
    address: ''
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        profilePhoto: selectedLoan.profilePhoto || '',
        occupation: selectedLoan.occupation || '',
        address: selectedLoan.address || ''
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
      
      let loansData = Array.isArray(res) ? res : (res?.data ?? []);
      setLoans(loansData);
      setFilteredLoans(loansData);
    } catch (error) {
      console.error('LoanRecords: Error loading loans:', error);
      
      // Try to get more debug information
      try {
        const debugInfo = await ApiService.debugFirebase();
        console.error("Debug info:", debugInfo);
      } catch (debugError) {
        console.error("Failed to get debug info:", debugError);
      }
      
      const msg = (error && error.message) || '';
      if (msg.includes('403') || /Forbidden/i.test(msg)) {
        setError('Not authenticated. Please sign in to view your loans.');
      } else if (msg.includes('401') || /Unauthorized|Invalid authentication/i.test(msg)) {
        setError('Authentication failed. Please sign in again.');
      } else if (msg.includes('500')) {
        setError('Server error occurred. Please try again later.');
      } else {
        setError(`Failed to load loans: ${msg}`);
      }
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
      console.error('LoanRecords: Error loading documents:', error);
      setDocuments([]);
    }
  };

  const filterLoans = () => {
    console.log("LoanRecords: Filtering loans with searchTerm:", searchTerm, "and statusFilter:", statusFilter);
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter(loan => {
        const name = (loan.borrowerName || loan.customerName || '').toString().toLowerCase();
        const phone = (loan.phoneNumber || loan.customerPhone || '').toString();
        return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
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
      status: formData.status
    };

    // Calculate progress percentage
    const progress = (loanData.paidAmount / loanData.totalLoan) * 100;
    
    // Update status based on progress
    if (progress >= 100) {
      loanData.status = 'Closed';
    } else if (progress > 0) {
      loanData.status = 'Active';
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
      console.error('LoanRecords: Error saving loan:', error);
      alert(`Failed to save loan: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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
      status: 'Active'
    });
    setEditingLoan(null);
    setShowAddModal(false);
  };

  const handleEdit = (loan) => {
    console.log("LoanRecords: Editing loan:", loan);
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
      try {
        console.log("LoanRecords: Deleting loan with id:", id);
        // Use global delete endpoint
        await ApiService.deleteLoan(id);
        loadLoans();
      } catch (error) {
        console.error('LoanRecords: Error deleting loan:', error);
        alert('Failed to delete loan. Please try again.');
      }
    }
  };

  // Profile functionality
  const handleProfileClick = (loan) => {
    console.log("LoanRecords: Opening profile for loan:", loan);
    setSelectedLoan(loan);
    setShowProfileModal(true);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileFormData({...profileFormData, profilePhoto: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadProfileImage = () => {
    if (!profileFormData.profilePhoto) return;
    
    // Create a download link for the profile image
    const link = document.createElement('a');
    link.href = profileFormData.profilePhoto;
    link.download = `${selectedLoan.borrowerName.replace(/\s+/g, '_')}_profile.jpg`;
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
        fileName: file.name
      });
    }
  };

  // Add this function to compress images before upload
  const compressImage = (file, maxSizeKB = 60) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Start with original quality
          let quality = 0.8;
          let dataUrl = '';
          let blob;
          let sizeKB = 0;
          
          // Function to check size and adjust
          const checkSize = () => {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get data URL and check size
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Convert to blob to get accurate size
            canvas.toBlob((b) => {
              blob = b;
              sizeKB = blob.size / 1024;
              
              // If size is acceptable, resolve
              if (sizeKB <= maxSizeKB) {
                resolve({
                  file: new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  }),
                  dataUrl: dataUrl,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  sizeKB: sizeKB.toFixed(2)
                });
              } else {
                // Try reducing quality or dimensions
                if (quality > 0.3) {
                  quality -= 0.1;
                  checkSize();
                } else if (width > 400 && height > 400) {
                  // Reduce dimensions by 20%
                  width = Math.floor(width * 0.8);
                  height = Math.floor(height * 0.8);
                  quality = 0.8; // Reset quality
                  checkSize();
                } else {
                  // If we can't compress further, use what we have
                  resolve({
                    file: new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    }),
                    dataUrl: dataUrl,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    sizeKB: sizeKB.toFixed(2),
                    warning: `Could not compress below ${maxSizeKB}KB. Final size: ${sizeKB.toFixed(2)}KB`
                  });
                }
              }
            }, 'image/jpeg', quality);
          };
          
          // Start the compression process
          checkSize();
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddDocument = async () => {
    if (!newDocument.file || newDocument.name.trim() === '') return;
    
    try {
      console.log("LoanRecords: Adding document:", newDocument);
      
      let fileToUpload = newDocument.file;
      let dataUrl = null;
      let compressionInfo = null;
      
      // If it's an image, compress it
      if (newDocument.file.type.startsWith('image/')) {
        try {
          compressionInfo = await compressImage(newDocument.file);
          fileToUpload = compressionInfo.file;
          dataUrl = compressionInfo.dataUrl;
          
          console.log(`Image compression result: 
            Original: ${(compressionInfo.originalSize / 1024).toFixed(2)} KB → 
            Compressed: ${compressionInfo.sizeKB} KB
            Reduction: ${((1 - (compressionInfo.compressedSize / compressionInfo.originalSize)) * 100).toFixed(1)}%`);
          
          // Show warning if compression wasn't successful
          if (compressionInfo.warning) {
            alert(compressionInfo.warning);
          }
        } catch (error) {
          console.error("Image compression failed, using original:", error);
          // If compression fails, read the original file
          const reader = new FileReader();
          dataUrl = await new Promise(resolve => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(newDocument.file);
          });
        }
      } else {
        // For non-image files, just read as data URL
        const reader = new FileReader();
        dataUrl = await new Promise(resolve => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(newDocument.file);
        });
      }
      
      // Use global document endpoint
      await ApiService.createDocument({
        loanId: selectedLoan.id,
        name: newDocument.name,
        type: newDocument.type,
        fileContent: dataUrl,
        fileName: fileToUpload.name,
        borrowerName: selectedLoan.borrowerName
      });
      
      // Refresh documents
      loadDocuments(selectedLoan.id);
      
      // Reset form
      setNewDocument({ 
        name: '', 
        type: 'ID Proof', 
        file: null,
        fileName: '' 
      });
      document.getElementById('document-file-input').value = '';
    } catch (error) {
      console.error('LoanRecords: Error adding document:', error);
      alert('Failed to add document. Please try again.');
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
      console.error('LoanRecords: Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
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
            address: profileFormData.address
          });
          
          // Update the selectedLoan in state to reflect changes
          setSelectedLoan({
            ...selectedLoan,
            profilePhoto: reader.result,
            occupation: profileFormData.occupation,
            address: profileFormData.address
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
          address: profileFormData.address
        });
        
        // Update the selectedLoan in state to reflect changes
        setSelectedLoan({
          ...selectedLoan,
          profilePhoto: profileFormData.profilePhoto,
          occupation: profileFormData.occupation,
          address: profileFormData.address
        });
        
        // Also update the loans list to reflect changes in the table
        loadLoans();
      }
    } catch (error) {
      console.error('LoanRecords: Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedLoan(null);
    setProfileImageFile(null);
  };

  // Add function to check if a file is an image
  const isImageFile = (fileName) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  // Add function to check if content is an image data URL
  const isImageDataUrl = (content) => {
    return content && content.startsWith('data:image/');
  };

  const downloadDocument = (document) => {
    if (document.fileContent) {
      // Create a download link for the document
      const link = document.createElement('a');
      
      if (document.fileContent.startsWith('data:')) {
        // If it's a data URL, use it directly
        link.href = document.fileContent;
      } else {
        // Otherwise, use the API endpoint
        link.href = `${ApiService.getBaseUrl()}/documents/${document.id}/file`;
      }
      
      link.download = document.fileName || document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('File content not available for download');
    }
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
        <div className="alert alert-danger">
          <h5>Error Loading Loans</h5>
          <p>{error}</p>
          <div className="mt-3">
            <button 
              className="btn btn-primary me-2"
              onClick={loadLoans}
            >
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
              }}
            >
              Show Debug Info
            </button>
            <button 
              className="btn btn-outline-info"
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:8000/test-connection');
                  const data = await response.json();
                  alert(`Connection Test: ${JSON.stringify(data, null, 2)}`);
                } catch (e) {
                  alert(`Connection test failed: ${e.message}`);
                }
              }}
            >
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#1e293b', fontWeight: '600' }}>Loan Records</h2>
          <p className="text-muted mb-0">Manage and track all loan records</p>
        </div>
        {/* small sync button (sync localStorage loans to backend) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:8000/test-connection');
                const data = await response.json();
                alert(`Connection Test: ${JSON.stringify(data, null, 2)}`);
              } catch (e) {
                alert(`Connection test failed: ${e.message}`);
              }
            }}
          >
            Test Connection
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={async () => {
              await syncLocalLoans();
            }}
          >
            Sync Local Loans
          </button>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          <span>Add New Loan</span>
        </button>
      </div>

      {/* Total Loans Card - Like in the first image */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">TOTAL LOANS</h6>
              <h3 className="mb-0">{loans.length}</h3>
              <div className="mt-2">
                <button className="btn btn-sm btn-primary">All Loans</button>
              </div>
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
                {filteredLoans && filteredLoans.length > 0 ? (
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
                          loan.status === 'Active' ? 'bg-success' :
                          loan.status === 'Closed' ? 'bg-secondary' :
                          'bg-warning'
                        }`}>
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
                        <div className="d-flex gap-2">
                          {/* Profile Button */}
                          <button 
                            className="btn btn-icon btn-sm rounded-circle btn-light-info"
                            onClick={() => handleProfileClick(loan)}
                            title="Profile"
                          >
                            <i className="fas fa-user"></i>
                          </button>
                          {/* Edit Button */}
                          <button 
                            className="btn btn-icon btn-sm rounded-circle btn-light-primary"
                            onClick={() => handleEdit(loan)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {/* Delete Button */}
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
                      <h6 className="mb-3 text-muted">Loan Details</h6>
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
                      <h6 className="mb-3 text-muted">Payment Details</h6>
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

      {/* Profile Modal - Modified to take 90% of the page */}
      {showProfileModal && selectedLoan && (
        <div className="modal show d-block modal-90percent-container" tabIndex="-1">
          <div className="modal-dialog modal-90percent">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Borrower Profile</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={closeProfileModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* Profile Section */}
                <div className="profile-section">
                  <div className="profile-image-container">
                    <img 
                      src={profileFormData.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLoan.borrowerName)}&background=0D8ABC&color=fff&size=120`}
                      alt="Profile" 
                      className="profile-image"
                    />
                    <label htmlFor="profile-upload" className="profile-edit-btn">
                      <i className="fas fa-camera"></i>
                    </label>
                    <input 
                      id="profile-upload"
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                    {/* Add download button for profile image */}
                    {profileFormData.profilePhoto && (
                      <button 
                        className="position-absolute top-0 end-0 bg-info rounded-circle p-1"
                        style={{ cursor: 'pointer' }}
                        onClick={downloadProfileImage}
                        title="Download Profile Image"
                      >
                        <i className="fas fa-download text-white"></i>
                      </button>
                    )}
                  </div>
                  <h4 className="profile-name">{selectedLoan.borrowerName}</h4>
                  <div className="profile-details">
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control text-center"
                        placeholder="Occupation"
                        value={profileFormData.occupation}
                        onChange={(e) => setProfileFormData({...profileFormData, occupation: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control text-center"
                        placeholder="Address"
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData({...profileFormData, address: e.target.value})}
                      />
                    </div>
                    <p className="text-muted">{selectedLoan.phoneNumber}</p>
                  </div>
                </div>

                {/* Loan Details Section */}
                <div className="loan-details-card">
                  <div className="loan-details-header">
                    <h5 className="mb-0">Loan Details</h5>
                  </div>
                  <div className="loan-details-body">
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Total Loan:</span>
                      <span className="loan-detail-value">₹{selectedLoan.totalLoan?.toLocaleString()}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Paid Amount:</span>
                      <span className="loan-detail-value">₹{selectedLoan.paidAmount?.toLocaleString()}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">EMI:</span>
                      <span className="loan-detail-value">₹{selectedLoan.emi?.toLocaleString()}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Interest Rate:</span>
                      <span className="loan-detail-value">{selectedLoan.interestRate}%</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Payment Mode:</span>
                      <span className="loan-detail-value">{selectedLoan.paymentMode}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Status:</span>
                      <span className="loan-detail-value">
                        <span className={`badge ${
                          selectedLoan.status === 'Active' ? 'bg-success' :
                          selectedLoan.status === 'Closed' ? 'bg-secondary' :
                          'bg-warning'
                        } ms-2`}>
                          {selectedLoan.status}
                        </span>
                      </span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">Start Date:</span>
                      <span className="loan-detail-value">{new Date(selectedLoan.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="loan-detail-label">End Date:</span>
                      <span className="loan-detail-value">{new Date(selectedLoan.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="document-section">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Documents</h5>
                  </div>
                  <div className="card-body">
                    {/* Add Document Form */}
                    <div className="document-form">
                      <div className="row mb-4">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Document name"
                            value={newDocument.name}
                            onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                          />
                        </div>
                        <div className="col-md-3">
                          <select
                            className="form-select"
                            value={newDocument.type}
                            onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                          >
                            <option value="ID Proof">ID Proof</option>
                            <option value="Address Proof">Address Proof</option>
                            <option value="Income Certificate">Income Certificate</option>
                            <option value="Agreement">Agreement</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <input
                            id="document-file-input"
                            type="file"
                            className="form-control"
                            onChange={handleDocumentFileChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <button 
                            className="btn btn-primary w-100"
                            onClick={handleAddDocument}
                            disabled={!newDocument.file}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Documents List */}
                    {documents.length > 0 ? (
                      <div className="document-table">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Type</th>
                              <th>Preview</th>
                              <th>Uploaded</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map(doc => (
                              <tr key={doc.id}>
                                <td>{doc.name}</td>
                                <td>{doc.type}</td>
                                <td>
                                  {doc.fileContent && (isImageDataUrl(doc.fileContent) || isImageFile(doc.fileName || doc.name)) ? (
                                    <img 
                                      src={doc.fileContent} 
                                      alt={doc.name}
                                      className="document-preview"
                                      onClick={() => handleViewDocument(doc)}
                                      style={{ maxWidth: '50px', maxHeight: '50px', cursor: 'pointer' }}
                                    />
                                  ) : (
                                    <i className="fas fa-file-alt fa-2x text-muted"></i>
                                  )}
                                </td>
                                <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                <td>
                                  <div className="document-actions">
                                    <button 
                                      className="btn btn-sm btn-light-primary me-1"
                                      onClick={() => downloadDocument(doc)}
                                      title="Download"
                                    >
                                      <i className="fas fa-download"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-light-info me-1"
                                      onClick={() => handleViewDocument(doc)}
                                      title="View"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-light-danger"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      title="Delete"
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
                    ) : (
                      <p className="text-center text-muted">No documents uploaded yet</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeProfileModal}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveProfile}
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{viewingDocument.name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={closeDocumentModal}
                ></button>
              </div>
              <div className="modal-body text-center">
                {viewingDocument.fileContent ? (
                  <>
                    {isImageDataUrl(viewingDocument.fileContent) ? (
                      <img 
                        src={viewingDocument.fileContent} 
                        alt={viewingDocument.name}
                        className="document-viewer-image"
                        style={{ maxWidth: '100%', maxHeight: '70vh' }}
                      />
                    ) : (
                      <div className="p-5">
                        <i className="fas fa-file-alt fa-5x text-muted mb-3"></i>
                        <h4>{viewingDocument.name}</h4>
                        <p className="text-muted">This document cannot be previewed. Please download to view.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-5">
                    <i className="fas fa-file-alt fa-5x text-muted mb-3"></i>
                    <h4>{viewingDocument.name}</h4>
                    <p className="text-muted">File content not available.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeDocumentModal}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => downloadDocument(viewingDocument)}
                >
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