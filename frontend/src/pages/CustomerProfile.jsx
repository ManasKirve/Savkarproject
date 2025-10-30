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

  const [paymentRecords, setPaymentRecords] = useState([
    { id: Date.now(), date: "", amount: "", status: "Paid", note: "" },
  ]);

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
        setPaymentRecords(data.paymentRecords || [
          { id: Date.now(), date: "", amount: "", status: "Paid", note: "" },
        ]);
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError("Failed to load borrower profile, using dummy data...");
        alert("API failed — displaying dummy data for testing.");
        setSelectedLoan(dummyLoanData);
        setProfileFormData({
          occupation: dummyLoanData.occupation,
          address: dummyLoanData.address,
          profilePhoto: dummyLoanData.profilePhoto,
        });
        setDocuments(dummyLoanData.documents);
        setPaymentRecords([
          {
            id: 101,
            date: "2024-05-01",
            amount: 12500,
            status: "Paid",
            note: "First EMI cleared",
          },
        ]);
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

  const handleDeleteDocument = (id) => {
    setDocuments(documents.filter((d) => d.id !== id));
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
      const updatedData = {
        ...selectedLoan,
        ...profileFormData,
        documents,
        paymentRecords,
      };
      await ApiService.put(`/loans/${id}`, updatedData);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile (API not responding).");
    }
  };

  const isImageFile = (filename) => /\.(jpg|jpeg|png|gif)$/i.test(filename);

  if (loading) return <p className="text-center mt-5">Loading profile...</p>;
  if (!selectedLoan)
    return <p className="text-center mt-5">No profile found</p>;

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Borrower Profile</h3>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {error && <p className="text-warning text-center mb-3">{error}</p>}

      {/* Profile + Loan Info */}
      <div className="row">
        <div className="col-md-4 text-center mb-4">
          <div
            className="mx-auto mb-3 position-relative"
            style={{ width: "120px", height: "120px" }}
          >
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
          </div>
          <h5>{selectedLoan.borrowerName}</h5>
          <input
            type="text"
            className="form-control mb-2 text-center"
            placeholder="Occupation"
            value={profileFormData.occupation}
            onChange={(e) =>
              setProfileFormData({ ...profileFormData, occupation: e.target.value })
            }
          />
          <input
            type="text"
            className="form-control text-center"
            placeholder="Address"
            value={profileFormData.address}
            onChange={(e) =>
              setProfileFormData({ ...profileFormData, address: e.target.value })
            }
          />
          <p className="text-muted mt-2">{selectedLoan.phoneNumber || "N/A"}</p>
        </div>

        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Loan Details</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-2">
                  <strong>Total Loan:</strong> ₹{selectedLoan.totalLoan?.toLocaleString() || 0}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Paid Amount:</strong> ₹{selectedLoan.paidAmount?.toLocaleString() || 0}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>EMI:</strong> ₹{selectedLoan.emi?.toLocaleString() || 0}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Interest Rate:</strong> {selectedLoan.interestRate || 0}%
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Payment Mode:</strong> {selectedLoan.paymentMode || "N/A"}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${
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
                <div className="col-md-6 mb-2">
                  <strong>Start Date:</strong>{" "}
                  {selectedLoan.startDate
                    ? new Date(selectedLoan.startDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div className="col-md-6 mb-2">
                  <strong>End Date:</strong>{" "}
                  {selectedLoan.endDate
                    ? new Date(selectedLoan.endDate).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Payment Records Table */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Payment Records</h5>
          <button className="btn btn-sm btn-primary" onClick={handleAddPaymentRow}>
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
                          handlePaymentChange(record.id, "amount", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={record.status}
                        onChange={(e) =>
                          handlePaymentChange(record.id, "status", e.target.value)
                        }
                      >
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
                        onClick={() => handleDeletePaymentRow(record.id)}
                      >
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
              <input
                type="text"
                className="form-control"
                placeholder="Document name"
                value={newDocument.name}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, name: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={newDocument.type}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, type: e.target.value })
                }
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
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.fileContent;
                            link.download = doc.fileName || doc.name;
                            link.click();
                          }}
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
