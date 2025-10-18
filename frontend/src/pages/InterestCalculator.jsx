import React, { useState, useEffect } from "react";

const InterestCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [loanMonths, setLoanMonths] = useState(0);
  const [loanDays, setLoanDays] = useState(0);
  const [loanDate, setLoanDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedPrincipal, setEditedPrincipal] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // 🧠 Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("interestCalculatorData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setLoanAmount(parsed.loanAmount || 0);
      setInterestRate(parsed.interestRate || 0);
      setLoanMonths(parsed.loanMonths || 0);
      setLoanDays(parsed.loanDays || 0);
      setLoanDate(parsed.loanDate || "");
      setSchedule(parsed.schedule || []);
    }
  }, []);

  // 💾 Save all data to localStorage whenever anything changes
  useEffect(() => {
    const dataToSave = {
      loanAmount,
      interestRate,
      loanMonths,
      loanDays,
      loanDate,
      schedule,
    };
    localStorage.setItem("interestCalculatorData", JSON.stringify(dataToSave));
  }, [loanAmount, interestRate, loanMonths, loanDays, loanDate, schedule]);

  const calculateSchedule = () => {
    const basePrincipal = loanAmount;
    const monthlyRate = interestRate / 100;
    const start = new Date(loanDate);
    const newSchedule = [];

    for (let i = 1; i <= loanMonths; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + i);

      const interestAmount = basePrincipal * monthlyRate;
      newSchedule.push({
        index: i,
        label: `Month ${i}`,
        dueDate: dueDate.toISOString().split("T")[0],
        principal: basePrincipal.toFixed(2),
        interest: interestAmount.toFixed(2),
        remaining: basePrincipal.toFixed(2),
        status: "Paid",
      });
    }

    if (loanDays > 0) {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + loanMonths);
      dueDate.setDate(dueDate.getDate() + loanDays);

      const dayFraction = loanDays / 30;
      const interestAmount = basePrincipal * monthlyRate * dayFraction;

      newSchedule.push({
        index: newSchedule.length + 1,
        label: `${loanDays} Days`,
        dueDate: dueDate.toISOString().split("T")[0],
        principal: basePrincipal.toFixed(2),
        interest: interestAmount.toFixed(2),
        remaining: basePrincipal.toFixed(2),
        status: "Pending",
      });
    }

    setSchedule(newSchedule);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN");
  };

  const handleEditPrincipal = (index) => {
    setEditIndex(index);
    setEditedPrincipal(schedule[index].principal);
  };

  // ✅ Save edited principal only (no future recalculation)
  const handleSavePrincipal = (index) => {
    const updated = [...schedule];
    const newPrincipal = Math.max(0, parseFloat(editedPrincipal) || 0);
    const monthlyRate = interestRate / 100;

    const row = updated[index];
    row.principal = newPrincipal.toFixed(2);

    if (row.label.includes("Days")) {
      const dayCount = parseInt(row.label);
      const dayFraction = dayCount / 30;
      row.interest = (newPrincipal * monthlyRate * dayFraction).toFixed(2);
    } else {
      row.interest = (newPrincipal * monthlyRate).toFixed(2);
    }

    row.remaining = newPrincipal.toFixed(2);
    setSchedule(updated);
    setEditIndex(null);
  };

  const toggleStatus = (index) => {
    const updated = [...schedule];
    updated[index].status =
      updated[index].status === "Pending" ? "Paid" : "Pending";
    setSchedule(updated);
  };

  const sortByDate = () => {
    const sorted = [...schedule].sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
    setSchedule(sorted);
    setSortAsc(!sortAsc);
  };

const clearData = () => {
  localStorage.removeItem("interestCalculatorData");
  setSchedule([]);
  setLoanAmount(0);
  setInterestRate(0);
  setLoanMonths(0);
  setLoanDays(0);
  setLoanDate("");
};

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Interest Loan Calculator</h2>

      <div className="row">
        {/* Loan Input Section */}
        <div className="col-md-4">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h5>Loan Details</h5>

              <div className="mb-3">
                <label className="form-label">Loan Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Interest Rate (% per month)</label>
                <input
                  type="number"
                  className="form-control"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Months</label>
                  <input
                    type="number"
                    className="form-control"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                  />
                </div>
                <div className="col">
                  <label className="form-label">Days</label>
                  <input
                    type="number"
                    className="form-control"
                    value={loanDays}
                    onChange={(e) => setLoanDays(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Loan Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                />
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={calculateSchedule}
                >
                  Calculate Schedule
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={clearData}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Summary</h5>
              <p>Principal: ₹{loanAmount.toLocaleString()}</p>
              <p>
                Monthly Interest: ₹
                {(loanAmount * (interestRate / 100)).toFixed(2)}
              </p>
              <p>
                Total Interest ({loanMonths} months {loanDays} days): ₹
                {(
                  loanAmount *
                  (interestRate / 100) *
                  (loanMonths + loanDays / 30)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Schedule</h5>
              <p className="text-muted mb-3 small">
                Double-click on Principal to edit. Press Tab or Enter to save.
                All data (including loan details) auto-saves to localStorage.
              </p>

              <div className="table-responsive" style={{ maxHeight: "550px" }}>
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Period</th>
                      <th
                        onClick={sortByDate}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Due Date {sortAsc ? "▲" : "▼"}
                      </th>
                      <th>Principal (₹)</th>
                      <th>Interest (₹)</th>
                      <th>Remaining (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, index) => (
                      <tr
                        key={index}
                        onClick={() => toggleStatus(index)}
                        className={
                          row.status === "Paid"
                            ? "table-success"
                            : "table-warning"
                        }
                      >
                        <td>{row.index}</td>
                        <td>{row.label}</td>
                        <td>{formatDate(row.dueDate)}</td>
                        <td
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleEditPrincipal(index);
                          }}
                        >
                          {editIndex === index ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={editedPrincipal}
                              onChange={(e) =>
                                setEditedPrincipal(e.target.value)
                              }
                              onBlur={() => handleSavePrincipal(index)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Tab") {
                                  e.preventDefault();
                                  handleSavePrincipal(index);
                                }
                                if (e.key === "Escape") setEditIndex(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            row.principal
                          )}
                        </td>
                        <td>{row.interest}</td>
                        <td>{row.remaining}</td>
                        <td>
                          <span
                            className={`badge ${
                              row.status === "Paid"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          Click <b>"Calculate Schedule"</b> to generate table
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCalculator;
