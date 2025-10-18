import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../services/apiService";

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profileFormData, setProfileFormData] = useState({
    occupation: "",
    address: "",
    profilePhoto: "",
  });

  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "ID Proof",
    file: null,
  });

useEffect(() => {
  const fetchLoan = async () => {
    try {
      const data = await ApiService.get(`/loans/${id}`);
      console.log("Fetched loan data:", data);
      setSelectedLoan(data);
      setProfileFormData({
        occupation: data.occupation || "",
        address: data.address || "",
        profilePhoto: data.profilePhoto || "",
      });
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching loan:", err);
      alert("Failed to load borrower profile.");
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

  const handleDocumentFileChange = (e) => {
    setNewDocument({ ...newDocument, file: e.target.files[0] });
  };

  const handleAddDocument = () => {
    if (!newDocument.file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc = {
        id: Date.now(),
        name: newDocument.name,
        type: newDocument.type,
        fileContent: reader.result,
        fileName: newDocument.file.name,
        uploadedAt: new Date(),
      };
      setDocuments([...documents, newDoc]);
      setNewDocument({ name: "", type: "ID Proof", file: null });
    };
    reader.readAsDataURL(newDocument.file);
  };

  const downloadDocument = (doc) => {
    const link = document.createElement("a");
    link.href = doc.fileContent;
    link.download = doc.fileName || doc.name;
    link.click();
  };

  const handleDeleteDocument = (id) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const handleSaveProfile = async () => {
    if (!selectedLoan) return;
    try {
      const updatedData = {
        ...selectedLoan,
        ...profileFormData,
        documents,
      };
      await ApiService.put(`/loans/${id}`, updatedData);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const isImageFile = (filename) => /\.(jpg|jpeg|png|gif)$/i.test(filename);

  if (loading) return <p className="text-center mt-5">Loading profile...</p>;
  if (error) return <p className="text-center mt-5 text-danger">{error}</p>;
  if (!selectedLoan) return <p className="text-center mt-5">No profile found</p>;

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Borrower Profile</h3>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Profile Section */}
      <div className="text-center mb-4">
        <div className="mx-auto mb-3 position-relative" style={{ width: "120px", height: "120px" }}>
          <img
            src={
              profileFormData.profilePhoto ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                selectedLoan.borrowerName || "User"
              )}&background=0D8ABC&color=fff&size=120`
            }
            alt="Profile"
            className="rounded-circle img-fluid"
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
          <label
            htmlFor="profile-upload"
            className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1"
            style={{ cursor: "pointer" }}
          >
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
              className="position-absolute top-0 end-0 bg-info rounded-circle p-1"
              style={{ cursor: "pointer" }}
              onClick={downloadProfileImage}
              title="Download Profile Image"
            >
              <i className="fas fa-download text-white"></i>
            </button>
          )}
        </div>
        <h4>{selectedLoan.borrowerName}</h4>
        <div className="mb-3">
          <input
            type="text"
            className="form-control text-center"
            placeholder="Occupation"
            value={profileFormData.occupation}
            onChange={(e) =>
              setProfileFormData({ ...profileFormData, occupation: e.target.value })
            }
          />
        </div>
        <div className="mb-3">
          <input
            type="text"
            className="form-control text-center"
            placeholder="Address"
            value={profileFormData.address}
            onChange={(e) =>
              setProfileFormData({ ...profileFormData, address: e.target.value })
            }
          />
        </div>
        <p className="text-muted">{selectedLoan.phoneNumber || "N/A"}</p>
      </div>

      {/* Loan Details */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Loan Details</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <strong>Total Loan:</strong> ₹{selectedLoan.totalLoan?.toLocaleString() || 0}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Paid Amount:</strong> ₹{selectedLoan.paidAmount?.toLocaleString() || 0}
            </div>
            <div className="col-md-6 mb-3">
              <strong>EMI:</strong> ₹{selectedLoan.emi?.toLocaleString() || 0}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Interest Rate:</strong> {selectedLoan.interestRate || 0}%
            </div>
            <div className="col-md-6 mb-3">
              <strong>Payment Mode:</strong> {selectedLoan.paymentMode || "N/A"}
            </div>
            <div className="col-md-6 mb-3">
              <strong>Status:</strong>
              <span
                className={`badge ms-2 ${
                  selectedLoan.status === "Active"
                    ? "bg-success"
                    : selectedLoan.status === "Closed"
                    ? "bg-secondary"
                    : "bg-warning"
                }`}
              >
                {selectedLoan.status || "N/A"}
              </span>
            </div>
            <div className="col-md-6 mb-3">
              <strong>Start Date:</strong>{" "}
              {selectedLoan.startDate ? new Date(selectedLoan.startDate).toLocaleDateString() : "N/A"}
            </div>
            <div className="col-md-6 mb-3">
              <strong>End Date:</strong>{" "}
              {selectedLoan.endDate ? new Date(selectedLoan.endDate).toLocaleDateString() : "N/A"}
            </div>
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
              <input
                type="text"
                className="form-control"
                placeholder="Document name"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={newDocument.type}
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
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

          {documents.length > 0 ? (
            <div className="table-responsive">
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
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>{doc.type}</td>
                      <td>
                        {doc.fileContent && isImageFile(doc.fileName || doc.name) ? (
                          <img
                            src={doc.fileContent}
                            alt={doc.name}
                            className="img-thumbnail"
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                          />
                        ) : (
                          <i className="fas fa-file-alt fa-2x text-muted"></i>
                        )}
                      </td>
                      <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-light-primary me-1"
                          onClick={() => downloadDocument(doc)}
                        >
                          <i className="fas fa-download"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light-danger"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
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
    </div>
  );
};

export default CustomerProfile;
