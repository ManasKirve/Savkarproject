import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingLoans: 0,
    closedLoans: 0,
    totalAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0
  });

  // Filter and Sort states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Dashboard: Fetching dashboard data...");
        
        const dashboardData = await ApiService.getDashboardSummary();
        console.log("Dashboard: Dashboard data received:", dashboardData);
        
        setStats({
          totalLoans: dashboardData.activeRecords + dashboardData.pendingRecords + dashboardData.closingRecords,
          activeLoans: dashboardData.activeRecords,
          pendingLoans: dashboardData.pendingRecords,
          closedLoans: dashboardData.closingRecords,
          totalAmount: dashboardData.totalLoanIssued,
          collectedAmount: dashboardData.recoveredAmount,
          pendingAmount: dashboardData.pendingAmount
        });
        
        const loansData = await ApiService.getAllLoans();
        console.log("Dashboard: Loans data received:", loansData);
        setLoans(loansData);
      } catch (err) {
        console.error("Dashboard: Error fetching data:", err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper: calculate due date (start date but current month)
  const getDueDate = (loan) => {
    if (loan.status === 'Closed') return null;
    const start = new Date(loan.startDate);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dueDate = new Date(start);
    dueDate.setMonth(currentMonth);
    dueDate.setFullYear(currentYear);
    return dueDate;
  };

  // Apply Date Range Filter based on Due Date
  const filteredLoans = loans.filter((loan) => {
    const dueDate = getDueDate(loan);
    if (!fromDate && !toDate) return true;
    if (!dueDate) return false; // closed loans have no due date
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && to) return dueDate >= from && dueDate <= to;
    if (from) return dueDate >= from;
    if (to) return dueDate <= to;
    return true;
  });

  // Sort by Start Date
  const sortByDate = () => {
    const sorted = [...filteredLoans].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setLoans(sorted);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const recentLoans = filteredLoans.slice(0, 5);

  // Function to handle Excel export with styling
  const handleExportReport = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel with separate Note and File columns
    const excelData = filteredLoans.map((loan, index) => {
      const dueDate = getDueDate(loan);
      return {
        'S.No': index + 1,
        'Name': loan.borrowerName || 'N/A',
        'Interest': `${loan.interestRate || 0}%`,
        'Amount': loan.totalLoan || 0,
        'Due Date': dueDate ? dueDate.toLocaleDateString('en-GB') : '-',
        'Paid Date': '', // Leave blank for user to fill
        'Note': '',      // Leave blank for user to fill
        'File': ''       // Leave blank for user to fill
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Define styles for different elements
    const headerStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const amountStyle = {
      font: { bold: true, sz: 11, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "C6E0B4" } }, // Light green
      numFmt: '"₹"#,##0.00',
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    const interestStyle = {
      font: { sz: 11, color: { rgb: "7030A0" } },
      fill: { fgColor: { rgb: "E2D9F3" } }, // Light purple
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    const dueDateStyle = {
      font: { bold: true, sz: 11, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "FFEB9C" } }, // Light yellow
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    const paidDateStyle = {
      font: { sz: 11, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "BDD7EE" } }, // Light blue
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    const noteStyle = {
      font: { sz: 11, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D9D9D9" } }, // Light gray
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    const fileStyle = {
      font: { sz: 11, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "F8CBAD" } }, // Light orange
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } }
      }
    };
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Apply header style to the first row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[headerCell]) continue;
      ws[headerCell].s = headerStyle;
    }
    
    // Apply styles to data rows
    for (let R = 1; R <= range.e.r; ++R) {
      // S.No column (index 0)
      const snoCell = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (ws[snoCell]) ws[snoCell].s = { 
        font: { sz: 11, color: { rgb: "000000" } }, 
        fill: { fgColor: { rgb: "F2F2F2" } },
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } },
          bottom: { style: "thin", color: { rgb: "D9D9D9" } },
          left: { style: "thin", color: { rgb: "D9D9D9" } },
          right: { style: "thin", color: { rgb: "D9D9D9" } }
        }
      };
      
      // Name column (index 1)
      const nameCell = XLSX.utils.encode_cell({ r: R, c: 1 });
      if (ws[nameCell]) ws[nameCell].s = { 
        font: { sz: 11, color: { rgb: "000000" } }, 
        fill: { fgColor: { rgb: "F2F2F2" } },
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } },
          bottom: { style: "thin", color: { rgb: "D9D9D9" } },
          left: { style: "thin", color: { rgb: "D9D9D9" } },
          right: { style: "thin", color: { rgb: "D9D9D9" } }
        }
      };
      
      // Interest column (index 2)
      const interestCell = XLSX.utils.encode_cell({ r: R, c: 2 });
      if (ws[interestCell]) ws[interestCell].s = interestStyle;
      
      // Amount column (index 3) - Important column with color
      const amountCell = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (ws[amountCell]) ws[amountCell].s = amountStyle;
      
      // Due Date column (index 4) - Important column with color
      const dueDateCell = XLSX.utils.encode_cell({ r: R, c: 4 });
      if (ws[dueDateCell]) ws[dueDateCell].s = dueDateStyle;
      
      // Paid Date column (index 5)
      const paidDateCell = XLSX.utils.encode_cell({ r: R, c: 5 });
      if (ws[paidDateCell]) ws[paidDateCell].s = paidDateStyle;
      
      // Note column (index 6)
      const noteCell = XLSX.utils.encode_cell({ r: R, c: 6 });
      if (ws[noteCell]) ws[noteCell].s = noteStyle;
      
      // File column (index 7)
      const fileCell = XLSX.utils.encode_cell({ r: R, c: 7 });
      if (ws[fileCell]) ws[fileCell].s = fileStyle;
    }
    
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Name
      { wch: 10 }, // Interest
      { wch: 15 }, // Amount
      { wch: 12 }, // Due Date
      { wch: 12 }, // Paid Date
      { wch: 20 }, // Note
      { wch: 15 }  // File
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Loans Report");
    
    // Generate Excel file and trigger download
    // Fixed: Use writeBuffer for proper styling support
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Loans_Report.xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  if (loading) {
    return (
      <div className="container p-4 dashboard-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4 dashboard-container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 dashboard-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title">Dashboard Overview</h2>
          <p className="dashboard-subtitle text-muted m-0">
            Welcome back! Here's what's happening with your loans today.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-custom" onClick={handleExportReport}>
            <i className="fas fa-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card stat-card stat-card-custom stat-card-primary">
            <div className="card-body stat-card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title stat-card-title mb-0">Total Loans</h6>
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
                  <h6 className="card-title stat-card-title mb-0">Active Loans</h6>
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
              <h4 className="amount-card-value primary">₹{stats.totalAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Collected</h6>
              <h4 className="amount-card-value success">₹{stats.collectedAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card amount-card">
            <div className="card-body amount-card-body">
              <h6 className="amount-card-title">Pending Amount</h6>
              <h4 className="amount-card-value warning">₹{stats.pendingAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans Table */}
      <div className="card table-container-custom">
        <div className="card-header table-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Loans</h5>

          {/* Date Filter */}
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center">
              <label className="me-2 fw-medium">From:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center">
              <label className="me-2 fw-medium">To:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="card-body table-body">
          <div className="table-responsive">
            <table className="table table-hover table-custom mb-0">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>EMI</th>
                  <th
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={sortByDate}
                  >
                    Start Date <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                  </th>
                  <th>Due Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.length > 0 ? (
                  recentLoans.map((loan) => {
                    const dueDate = getDueDate(loan);
                    const dueDateDisplay = dueDate ? dueDate.toLocaleDateString('en-GB') : '-';
                    const endDateDisplay = new Date(loan.startDate).toLocaleDateString('en-GB');
                    
                    // Calculate EMI (simplified calculation)
                    const emi = loan.totalLoan && loan.interestRate 
                      ? (loan.totalLoan * (loan.interestRate / 100)) / 12 
                      : 0;

                    return (
                      <tr key={loan.id}>
                        <td>
                          <div>
                            <div className="fw-medium">{loan.borrowerName || 'N/A'}</div>
                            <small className="text-muted">{loan.phoneNumber || 'N/A'}</small>
                          </div>
                        </td>
                        <td>₹{(loan.totalLoan || 0).toLocaleString()}</td>
                        <td>{loan.interestRate || 0}%</td>
                        <td>₹{emi.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td>{new Date(loan.startDate).toLocaleDateString('en-GB')}</td>
                        <td>{dueDateDisplay}</td>
                        <td>{endDateDisplay}</td>
                        <td>
                          <span
                            className={`badge badge-custom ${
                              loan.status === 'Active'
                                ? 'badge-success'
                                : loan.status === 'Closed'
                                ? 'badge-info'
                                : loan.status === 'Pending'
                                ? 'badge-danger'
                                : 'badge-secondary'
                            }`}
                          >
                            {loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="progress progress-custom">
                            <div
                              className={`progress-bar progress-bar-custom ${
                                loan.status === 'Closed'
                                  ? 'progress-bar-success'
                                  : loan.status === 'Pending'
                                  ? 'progress-bar-danger'
                                  : 'progress-bar-primary'
                              }`}
                              style={{ width: `${(loan.paidAmount && loan.totalLoan) ? (loan.paidAmount / loan.totalLoan) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <small className="progress-text">
                            {loan.paidAmount && loan.totalLoan ? Math.round((loan.paidAmount / loan.totalLoan) * 100) : 0}% paid
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;