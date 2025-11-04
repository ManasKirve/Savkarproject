import React, { useState, useEffect } from "react";
import ApiService from "../services/apiService";
import * as XLSX from "xlsx";

const Dashboard = () => {
  const [allLoans, setAllLoans] = useState([]); // Store all loans data
  const [loans, setLoans] = useState([]); // For display purposes
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingLoans: 0,
    closedLoans: 0,
    totalAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0,
  });

  // Filter, Sort, and Pagination states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await ApiService.getDashboardSummary();

        setStats({
          totalLoans:
            dashboardData.activeRecords +
            dashboardData.pendingRecords +
            dashboardData.closingRecords,
          activeLoans: dashboardData.activeRecords,
          pendingLoans: dashboardData.pendingRecords,
          closedLoans: dashboardData.closingRecords,
          totalAmount: dashboardData.totalLoanIssued,
          collectedAmount: dashboardData.recoveredAmount,
          pendingAmount: dashboardData.pendingAmount,
        });

        const loansData = await ApiService.getAllLoans();
        setAllLoans(loansData);
        setLoans(loansData);
      } catch (err) {
        console.error("Dashboard: Error fetching data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper: calculate due date
  const getDueDate = (loan) => {
    if (loan.status === "Closed") return null;
    const start = new Date(loan.startDate);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dueDate = new Date(start);
    dueDate.setMonth(currentMonth);
    dueDate.setFullYear(currentYear);
    return dueDate;
  };

  // Helper: calculate EMI
  const calculateEMI = (loan) => {
    if (loan.emi) return loan.emi;
    return loan.totalLoan && loan.interestRate
      ? (loan.totalLoan * (loan.interestRate / 100)) / 12
      : 0;
  };

  // Filter + Sort
  useEffect(() => {
    const filtered = allLoans.filter((loan) => {
      const dueDate = getDueDate(loan);
      if (!fromDate && !toDate) return true;
      if (!dueDate) return false;
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && to) return dueDate >= from && dueDate <= to;
      if (from) return dueDate >= from;
      if (to) return dueDate <= to;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setLoans(sorted);
    setCurrentPage(1); // reset to page 1 on filter/sort change
  }, [allLoans, fromDate, toDate, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(loans.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentLoans = loans.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Sort by Start Date
  const sortByDate = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Export Excel function
  const handleExportReport = () => {
    const wb = XLSX.utils.book_new();

    const excelData = loans.map((loan, index) => {
      const dueDate = getDueDate(loan);
      const emi = calculateEMI(loan);
      return {
        "S.No": index + 1,
        Name: loan.borrowerName || "N/A",
        Amount: `₹${emi.toFixed(2)}`,
        "Due Date": dueDate ? dueDate.toLocaleDateString("en-GB") : "-",
        "Paid Date": "",
        Note: "",
        File: "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Loans Report");
    XLSX.writeFile(wb, "Loans_Report.xlsx");
  };

  if (loading)
    return (
      <div className="container p-4 text-center">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );

  if (error)
    return (
      <div className="container p-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );

  return (
    <div className="container p-4 dashboard-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="text-muted mb-0">
            Welcome back! Here's what's happening with your loans today.
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={handleExportReport}>
          <i className="fas fa-download me-2"></i>Export Report
        </button>
      </div>

      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-primary">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">
                    Total Loans
                  </h6>
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
                  <h6 className="card-title stat-card-title mb-0">
                    Active Loans
                  </h6>
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
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Total Amount</h6>
              <h4 className="amount-card-value primary">
                ₹{stats.totalAmount.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Collected</h6>
              <h4 className="amount-card-value success">
                ₹{stats.collectedAmount.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Pending Amount</h6>
              <h4 className="amount-card-value warning">
                ₹{stats.pendingAmount.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* All Loans Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Loans</h5>

          <div className="d-flex align-items-center gap-2">
            <label className="fw-medium me-2">From:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label className="fw-medium me-2">To:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}>
              Clear
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-custom mb-0">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>EMI</th>
                  <th onClick={sortByDate} style={{ cursor: "pointer" }}>
                    Start Date{" "}
                    <i
                      className={`fas fa-sort-${
                        sortOrder === "asc" ? "up" : "down"
                      } ms-1`}></i>
                  </th>
                  <th>Due Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {currentLoans.length > 0 ? (
                  currentLoans.map((loan) => {
                    const dueDate = getDueDate(loan);
                    const emi = calculateEMI(loan);
                    const dueDateDisplay = dueDate
                      ? dueDate.toLocaleDateString("en-GB")
                      : "-";
                    const endDateDisplay = new Date(
                      loan.startDate
                    ).toLocaleDateString("en-GB");

                    return (
                      <tr key={loan.id}>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {loan.borrowerName || "N/A"}
                            </div>
                            <small className="text-muted">
                              {loan.phoneNumber || "N/A"}
                            </small>
                          </div>
                        </td>
                        <td>₹{(loan.totalLoan || 0).toLocaleString()}</td>
                        <td>{loan.interestRate || 0}%</td>
                        <td>₹{emi.toLocaleString()}</td>
                        <td>
                          {new Date(loan.startDate).toLocaleDateString("en-GB")}
                        </td>
                        <td>{dueDateDisplay}</td>
                        <td>{endDateDisplay}</td>
                        <td>
                          <span
                            className={`badge ${
                              loan.status === "Active"
                                ? "bg-success"
                                : loan.status === "Closed"
                                ? "bg-info"
                                : loan.status === "Pending"
                                ? "bg-warning"
                                : "bg-secondary"
                            }`}>
                            {loan.status || "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="progress">
                            <div
                              className={`progress-bar ${
                                loan.status === "Closed"
                                  ? "bg-success"
                                  : loan.status === "Pending"
                                  ? "bg-danger"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${
                                  loan.paidAmount && loan.totalLoan
                                    ? (loan.paidAmount / loan.totalLoan) * 100
                                    : 0
                                }%`,
                              }}></div>
                          </div>
                          <small>
                            {loan.paidAmount && loan.totalLoan
                              ? Math.round(
                                  (loan.paidAmount / loan.totalLoan) * 100
                                )
                              : 0}
                            % paid
                          </small>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-3">
                      No loans found for selected dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {loans.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex align-items-center gap-3">
                <small className="text-muted">
                  Showing {indexOfFirstRecord + 1}–
                  {Math.min(indexOfLastRecord, loans.length)} of {loans.length}{" "}
                  entries
                </small>

                <div className="d-flex align-items-center">
                  <label className="me-2 text-muted">Rows per page:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "80px" }}
                    value={recordsPerPage}
                    onChange={handleRecordsPerPageChange}>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}>
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    className={`btn btn-sm ${
                      currentPage === index + 1
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } me-1`}
                    onClick={() => handlePageChange(index + 1)}>
                    {index + 1}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-outline-primary ms-2"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
