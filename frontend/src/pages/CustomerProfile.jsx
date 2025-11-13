import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../services/apiService";

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profileFormData, setProfileFormData] = useState({
    occupation: "",
    address: "",
    profilePhoto: "",
    addressAsPerAadhar: "",
    nave: "",
    haste: "",
    purava: "",
    permanentAddress: "",
    jamindars: [],
  });

  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "",
    file: null,
    fileName: "",
  });

  const [paymentRecords, setPaymentRecords] = useState([
    { id: Date.now(), date: "", amount: "", status: "Paid", note: "" },
  ]);

  const [viewingDocument, setViewingDocument] = useState(null);

useEffect(() => {
  if (!selectedLoan || !paymentRecords) return;

  // Calculate total paid amount
  const totalPaid = paymentRecords
    .filter((r) => r.status === "Paid" && r.amount)
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // Update local state only
  setSelectedLoan((prev) => ({
    ...prev,
    paidAmount: totalPaid,
  }));

  // Remove the API call to updatePaidAmount since it's causing issues
  // The paid amount will be updated when the entire profile is saved
}, [paymentRecords, selectedLoan?.id]); 

useEffect(() => {
    const fetchLoan = async () => {
      try {
        const savkarUserId = "savkar_user_001";
        const loans = await ApiService.getMyLoans(savkarUserId);

        const loan = loans.find((loan) => loan.id === id);
        if (!loan) throw new Error("Loan not found");

        setSelectedLoan(loan);

        // Fetch profile data
        try {
          const profileData = await ApiService.getLoanProfile(id);
          setProfile(profileData);

          setProfileFormData({
            occupation: profileData.occupation || "",
            address: profileData.address || "",
            profilePhoto: profileData.profilePhoto || "",
            addressAsPerAadhar: profileData.addressAsPerAadhar || "",
            nave: profileData.nave || "",
            haste: profileData.haste || "",
            purava: profileData.purava || "",
            permanentAddress: profileData.permanentAddress || "",
            jamindars: profileData.jamindars || [],
          });
        } catch (profileErr) {
          console.error("Error fetching profile:", profileErr);
          // Use loan data if profile doesn't exist
          setProfileFormData({
            occupation: loan.occupation || "",
            address: loan.address || "",
            profilePhoto: loan.profilePhoto || "",
            addressAsPerAadhar: loan.addressAsPerAadhar || "",
            nave: loan.nave || "",
            haste: loan.haste || "",
            purava: loan.purava || "",
            permanentAddress: loan.permanentAddress || "",
            jamindars: loan.jamindars || [],
          });
        }

        const loanDocuments = await ApiService.getDocumentsByLoanId(id);
        setDocuments(loanDocuments);

        setPaymentRecords(
          loan.paymentRecords || [
            { id: Date.now(), date: "", amount: "", status: "Paid", note: "" },
          ]
        );
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError("Failed to load borrower profile, using dummy data...");
        alert("API failed — displaying dummy data for testing.");
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [id]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setProfileFormData({ ...profileFormData, profilePhoto: reader.result });
    reader.readAsDataURL(file);
  };

  const downloadProfileImage = () => {
    if (!profileFormData.profilePhoto) return;
    const link = document.createElement("a");
    link.href = profileFormData.profilePhoto;
    link.download = `${selectedLoan.borrowerName}-profile.jpg`;
    link.click();
  };

  const handleAddJamindar = () => {
    const newJamindar = {
      id: Date.now(),
      name: "",
      residenceAddress: "",
      permanentAddress: "",
      mobile: "",
    };
    setProfileFormData({
      ...profileFormData,
      jamindars: [...profileFormData.jamindars, newJamindar],
    });
  };

  const handleRemoveJamindar = (id) => {
    setProfileFormData({
      ...profileFormData,
      jamindars: profileFormData.jamindars.filter((j) => j.id !== id),
    });
  };

  const handleJamindarChange = (id, field, value) => {
    setProfileFormData({
      ...profileFormData,
      jamindars: profileFormData.jamindars.map((j) =>
        j.id === id ? { ...j, [field]: value } : j
      ),
    });
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
      let dataUrl = null;

      const reader = new FileReader();
      dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(newDocument.file);
      });

      await ApiService.createDocument({
        loanId: selectedLoan.id,
        name: newDocument.name,
        type: newDocument.type,
        fileContent: dataUrl,
        fileName: newDocument.file.name,
        borrowerName: selectedLoan.borrowerName,
      });

      const updatedDocuments = await ApiService.getDocumentsByLoanId(
        selectedLoan.id
      );
      setDocuments(updatedDocuments);

      setNewDocument({
        name: "",
        type: "",
        file: null,
        fileName: "",
      });
      document.getElementById("document-file-input").value = "";
    } catch (error) {
      console.error("Error adding document:", error);
      alert("Failed to add document. Please try again.");
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await ApiService.deleteDocument(id);
      const updatedDocuments = await ApiService.getDocumentsByLoanId(
        selectedLoan.id
      );
      setDocuments(updatedDocuments);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleAddPaymentRow = () => {
    setPaymentRecords([
      ...paymentRecords,
      { id: Date.now(), date: "", amount: "", status: "Paid", note: "" },
    ]);
  };

  const handleDeletePaymentRow = (id) => {
    setPaymentRecords(paymentRecords.filter((r) => r.id !== id));
  };

  const handlePaymentChange = (id, field, value) => {
    setPaymentRecords(
      paymentRecords.map((record) =>
        record.id === id ? { ...record, [field]: value } : record
      )
    );
  };

  const handleSaveProfile = async () => {
  if (!selectedLoan) return;

  try {
    // Save profile data separately
    const profileData = {
      loanId: selectedLoan.id,
      occupation: profileFormData.occupation,
      address: profileFormData.address,
      profilePhoto: profileFormData.profilePhoto,
      addressAsPerAadhar:
        profileFormData.addressAsPerAadhar || "Not Available",
      nave: profileFormData.nave || "N/A",
      haste: profileFormData.haste || "N/A",
      purava: profileFormData.purava || "N/A",
      permanentAddress: profileFormData.permanentAddress,
      jamindars: profileFormData.jamindars || [], // Ensure jamindars is always an array
      paymentRecords: paymentRecords, // Add this line
    };

    console.log("Saving profile with data:", profileData);

    if (profile && profile.id) {
      // Update existing profile
      await ApiService.updateLoanProfile(selectedLoan.id, profileData);
    } else {
      // Create new profile
      await ApiService.createLoanProfile(selectedLoan.id, profileData);
    }

    // Calculate total paid amount from payment records
    const totalPaid = paymentRecords
      .filter((r) => r.status === "Paid" && r.amount)
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    // Save loan data with payment records
    const updatedData = {
      ...selectedLoan,
      paidAmount: totalPaid, // Update paid amount based on payment records
      paymentRecords: paymentRecords, // Include payment records in the update
    };

    await ApiService.updateLoan(selectedLoan.id, updatedData);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to update profile (API not responding).");
  }
};

  const isImageFile = (filename) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const extension = filename.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  const isImageDataUrl = (content) => {
    return content && content.startsWith("data:image/");
  };

  const handleViewDocument = (document) => setViewingDocument(document);
  const closeDocumentModal = () => setViewingDocument(null);

  if (loading) return <p className="text-center mt-5">Loading profile...</p>;
  if (!selectedLoan)
    return <p className="text-center mt-5">No profile found</p>;

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Borrower Profile</h3>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/loan-records")}>
          ← Back to Loan Records
        </button>
      </div>

      {error && <p className="text-warning text-center mb-3">{error}</p>}

      {/* ---------- HEADER PROFILE CARD ---------- */}
      <div className="card border-0 shadow-sm mb-4 rounded-3 p-3">
        <div className="row align-items-center g-3">
          {/* LEFT: Profile Section */}
          <div className="col-md-3 text-center">
            <div className="position-relative d-inline-block mb-3">
              <img
                src={
                  profileFormData.profilePhoto ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedLoan.borrowerName || "User"
                  )}&background=0D8ABC&color=fff&size=120`
                }
                alt="Profile"
                className="rounded-circle border border-2 shadow-sm"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                }}
              />
              <label
                htmlFor="profile-upload"
                className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 shadow-sm"
                style={{ cursor: "pointer" }}>
                <i className="fas fa-camera text-white"></i>
              </label>
              <input
                id="profile-upload"
                type="file"
                className="d-none"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
              {profileFormData.profilePhoto && (
                <button
                  className="position-absolute top-0 end-0 bg-success rounded-circle p-2 border-0 shadow-sm"
                  onClick={downloadProfileImage}
                  title="Download"
                  style={{ cursor: "pointer" }}>
                  <i className="fas fa-download text-white"></i>
                </button>
              )}
            </div>

            {/* Name and Phone below photo */}
            <div>
              <h5 className="fw-bold text-primary mb-1">
                {selectedLoan.borrowerName || "Borrower Name"}
              </h5>
              <p className="text-muted mb-0">
                {selectedLoan.phoneNumber || "N/A"}
              </p>
            </div>
          </div>

          {/* CENTER: Occupation + Address */}
          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label fw-semibold small">Occupation</label>
              <input
                type="text"
                className="form-control"
                placeholder="Occupation"
                value={profileFormData.occupation || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    occupation: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="form-label fw-semibold small">
                Residential Address
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter Residential Address"
                value={profileFormData.address || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    address: e.target.value,
                  })
                }></textarea>
            </div>
          </div>

          {/* RIGHT: Loan Summary */}
          <div className="col-md-4">
            <h6 className="fw-semibold text-secondary mb-2">Loan Summary</h6>
            <ul className="list-group shadow-sm">
              <li className="list-group-item d-flex justify-content-between">
                <span>Total Loan:</span>
                <strong>
                  ₹{selectedLoan.totalLoan?.toLocaleString() || "0"}
                </strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Paid Amount:</span>
                <strong>
                  ₹{selectedLoan.paidAmount?.toLocaleString() || "0"}
                </strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>EMI:</span>
                <strong>₹{selectedLoan.emi?.toLocaleString() || "0"}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Interest Rate:</span>
                <strong>{selectedLoan.interestRate || 0}%</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Loan Type:</span>
                <strong>{selectedLoan.loanType || "N/A"}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- DETAILED INFORMATION SECTION ---------- */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-light">
          <h6 className="fw-bold text-primary mb-0">Customer Details</h6>
        </div>

        <div className="card-body">
          <div className="row g-4 align-items-center">
            {/* ---------- Payment Mode ---------- */}
            <div className="col-md-6 d-flex align-items-center border-bottom pb-2">
              <label
                className="form-label fw-semibold text-muted mb-0"
                style={{ width: "40%" }}>
                Payment Mode
              </label>
              <div className="flex-grow-1 text-center text-dark fw-medium">
                {selectedLoan.paymentMode || "N/A"}
              </div>
            </div>

            {/* ---------- Status ---------- */}
            <div className="col-md-6 d-flex align-items-center border-bottom pb-2">
              <label
                className="form-label fw-semibold text-muted mb-0"
                style={{ width: "40%" }}>
                Status
              </label>
              <div className="flex-grow-1 text-center">
                <span
                  className={`badge px-3 py-2 ${
                    selectedLoan.status === "Active"
                      ? "bg-success"
                      : selectedLoan.status === "Closed"
                      ? "bg-secondary"
                      : "bg-warning"
                  }`}>
                  {selectedLoan.status || "N/A"}
                </span>
              </div>
            </div>

            {/* ---------- Start Date ---------- */}
            <div className="col-md-6 d-flex align-items-center border-bottom pb-2">
              <label
                className="form-label fw-semibold text-muted mb-0"
                style={{ width: "40%" }}>
                Start Date
              </label>
              <div className="flex-grow-1 text-center text-dark fw-medium">
                {selectedLoan.startDate
                  ? new Date(selectedLoan.startDate).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>

            {/* ---------- End Date ---------- */}
            <div className="col-md-6 d-flex align-items-center border-bottom pb-2">
              <label
                className="form-label fw-semibold text-muted mb-0"
                style={{ width: "40%" }}>
                End Date
              </label>
              <div className="flex-grow-1 text-center text-dark fw-medium">
                {selectedLoan.endDate
                  ? new Date(selectedLoan.endDate).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>

            {/* ---------- Nave ---------- */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-muted">Nave</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Nave"
                value={profileFormData.nave || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    nave: e.target.value,
                  })
                }
              />
            </div>

            {/* ---------- Haste ---------- */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-muted">Haste</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Haste"
                value={profileFormData.haste || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    haste: e.target.value,
                  })
                }
              />
            </div>

            {/* ---------- Purava ---------- */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-muted">
                Purava
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Purava"
                value={profileFormData.purava || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    purava: e.target.value,
                  })
                }
              />
            </div>

            {/* ---------- Permanent Address ---------- */}
            <div className="col-md-6">
              <label className="form-label fw-semibold text-muted">
                Permanent Address
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter Permanent Address"
                value={profileFormData.permanentAddress || ""}
                onChange={(e) =>
                  setProfileFormData({
                    ...profileFormData,
                    permanentAddress: e.target.value,
                  })
                }></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Jamindar Section */}
      <div className="card mt-4 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Jamindar Details</h6>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAddJamindar}>
            + Add Jamindar
          </button>
        </div>

        {profileFormData.jamindars.length === 0 && (
          <p className="text-muted">No Jamindars added yet.</p>
        )}

        {profileFormData.jamindars.map((jamindar, index) => (
          <div key={jamindar.id} className="border rounded p-3 mb-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0 text-primary">
                Jamindar {index + 1}
              </h6>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveJamindar(jamindar.id)}>
                − Remove
              </button>
            </div>

            {/* First Row: Name and Mobile */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Jamindar Name"
                  value={jamindar.name}
                  onChange={(e) =>
                    handleJamindarChange(jamindar.id, "name", e.target.value)
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Mobile No.
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Mobile Number"
                  value={jamindar.mobile}
                  onChange={(e) =>
                    handleJamindarChange(jamindar.id, "mobile", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Second Row: Residence and Permanent Address */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Residence Address
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter Residence Address"
                  value={jamindar.residenceAddress}
                  onChange={(e) =>
                    handleJamindarChange(
                      jamindar.id,
                      "residenceAddress",
                      e.target.value
                    )
                  }></textarea>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Permanent Address
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter Permanent Address"
                  value={jamindar.permanentAddress}
                  onChange={(e) =>
                    handleJamindarChange(
                      jamindar.id,
                      "permanentAddress",
                      e.target.value
                    )
                  }></textarea>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Records Table */}
      <div className="card my-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Payment Records</h5>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAddPaymentRow}>
            + Add Row
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Amount (₹)</th>
                  <th>Paid/Gap</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="date"
                        className="form-control"
                        value={record.date}
                        onChange={(e) =>
                          handlePaymentChange(record.id, "date", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={record.amount}
                        onChange={(e) =>
                          handlePaymentChange(
                            record.id,
                            "amount",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={record.status}
                        onChange={(e) =>
                          handlePaymentChange(
                            record.id,
                            "status",
                            e.target.value
                          )
                        }>
                        <option value="Paid">Paid</option>
                        <option value="Gap">Gap</option>
                      </select>
                    </td>
                    <td>
                      <textarea
                        className="form-control"
                        rows="1"
                        value={record.note}
                        onChange={(e) =>
                          handlePaymentChange(record.id, "note", e.target.value)
                        }
                      />
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePaymentRow(record.id)}>
                        −
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Documents</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name here"
                value={newDocument.name}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, name: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Note</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter note"
                value={newDocument.type}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, type: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">File</label>
              <input
                id="document-file-input"
                type="file"
                className="form-control"
                onChange={handleDocumentFileChange}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleAddDocument}
                disabled={!newDocument.file}>
                Add
              </button>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Note</th>
                    <th>Preview</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>{doc.type}</td>
                      <td>
                        {doc.fileContent &&
                        (isImageDataUrl(doc.fileContent) ||
                          isImageFile(doc.fileName || doc.name)) ? (
                          <img
                            src={doc.fileContent}
                            alt={doc.name}
                            className="document-preview"
                            onClick={() => handleViewDocument(doc)}
                            style={{
                              maxWidth: "50px",
                              maxHeight: "50px",
                              cursor: "pointer",
                            }}
                          />
                        ) : (
                          <i className="fas fa-file-alt fa-2x text-muted"></i>
                        )}
                      </td>
                      <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-light-primary me-1"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.fileContent;
                            link.download = doc.fileName || doc.name;
                            link.click();
                          }}
                          title="Download">
                          <i className="fas fa-download"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light-info me-1"
                          onClick={() => handleViewDocument(doc)}
                          title="View">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light-danger"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
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

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={handleSaveProfile}>
          Save Profile
        </button>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{viewingDocument.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDocumentModal}></button>
              </div>
              <div className="modal-body text-center">
                {viewingDocument.fileContent ? (
                  <>
                    {isImageDataUrl(viewingDocument.fileContent) ? (
                      <img
                        src={viewingDocument.fileContent}
                        alt={viewingDocument.name}
                        className="document-viewer-image"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
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
                  onClick={closeDocumentModal}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = viewingDocument.fileContent;
                    link.download =
                      viewingDocument.fileName || viewingDocument.name;
                    link.click();
                  }}>
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

export default CustomerProfile;