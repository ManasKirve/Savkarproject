import React, { useState, useEffect } from "react";

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(0);
  const [loanTerm, setLoanTerm] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [missedPaymentPenalty, setMissedPaymentPenalty] = useState(0);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [loanDate, setLoanDate] = useState("");
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [editedTotalAmount, setEditedTotalAmount] = useState("");
  const [editField, setEditField] = useState("");

  // ✅ Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("loanCalculatorData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setLoanAmount(parsed.loanAmount || 0);
      setLoanTerm(parsed.loanTerm || 0);
      setInterestRate(parsed.interestRate || 0);
      setMissedPaymentPenalty(parsed.missedPaymentPenalty || 0);
      setLoanDate(parsed.loanDate || "");
      setAmortizationSchedule(parsed.amortizationSchedule || []);
      setMonthlyPayment(parsed.monthlyPayment || 0);
    }
  }, []);

  // ✅ Save to localStorage whenever schedule or loan details change
  useEffect(() => {
    const data = {
      loanAmount,
      loanTerm,
      interestRate,
      loanDate,
      missedPaymentPenalty,
      amortizationSchedule,
      monthlyPayment,
    };
    localStorage.setItem("loanCalculatorData", JSON.stringify(data));
  }, [
    loanAmount,
    loanTerm,
    interestRate,
    loanDate,
    missedPaymentPenalty,
    amortizationSchedule,
    monthlyPayment,
  ]);

  // 🔹 Main loan calculation function
  const calculateLoan = () => {
    if (loanAmount <= 0 || loanTerm <= 0) return;

    const monthlyRate = interestRate / 100;
    let payment = 0;

    if (monthlyRate === 0) {
      payment = loanAmount / loanTerm;
    } else {
      payment =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
        (Math.pow(1 + monthlyRate, loanTerm) - 1);
    }

    setMonthlyPayment(payment);

    let balance = loanAmount;
    const schedule = [];
    const startDate = new Date(loanDate || new Date());

    for (let i = 1; i <= loanTerm; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = payment - interestPayment;
      balance -= principalPayment;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        month: i,
        payment: payment.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        balance: Math.max(0, balance).toFixed(2),
        totalAmount: payment.toFixed(2),
        missedPayment: false,
        dueDate: dueDate.toISOString().split("T")[0],
      });
    }

    setAmortizationSchedule(schedule);
    setEditRowIndex(null);
    setEditField("");
  };

  // 🔹 Manual trigger
  const handleGenerate = () => {
    calculateLoan();
  };

  // 🔹 Clear all data
  const clearData = () => {
    localStorage.removeItem("loanCalculatorData");
    setLoanAmount(0);
    setLoanTerm(0);
    setInterestRate(0);
    setMissedPaymentPenalty(0);
    setLoanDate("");
    setMonthlyPayment(0);
    setAmortizationSchedule([]);
    setEditRowIndex(null);
    setEditField("");
  };

  const handleMissedPayment = (month) => {
    const updated = [...amortizationSchedule];
    const row = updated[month - 1];
    row.missedPayment = !row.missedPayment;
    setAmortizationSchedule(updated);
  };

  const handleEditField = (index, field) => {
    if (field === "totalAmount") {
      setEditRowIndex(index);
      setEditField(field);
      setEditedTotalAmount(amortizationSchedule[index].totalAmount);
    }
  };

  const handleSaveTotalAmount = (index) => {
    const updated = [...amortizationSchedule];
    const newTotal = Math.max(0, parseFloat(editedTotalAmount));
    updated[index].totalAmount = newTotal.toFixed(2);
    setAmortizationSchedule(updated);
    setEditRowIndex(null);
    setEditField("");
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-IN");
  };

  return (
    <div className="container py-4">
      <h3 className="text-center mb-4">Loan Calculator</h3>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Loan Details</h5>

              <div className="mb-3">
                <label className="form-label">Loan Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={loanAmount}
                  onChange={(e) =>
                    setLoanAmount(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Loan Term (months)</label>
                <input
                  type="number"
                  className="form-control"
                  value={loanTerm}
                  onChange={(e) =>
                    setLoanTerm(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Interest Rate (% per month)</label>
                <input
                  type="number"
                  className="form-control"
                  value={interestRate}
                  onChange={(e) =>
                    setInterestRate(Math.max(0, Number(e.target.value)))
                  }
                />
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

              <div className="mb-3">
                <label className="form-label">Missed Payment Penalty (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={missedPaymentPenalty}
                  onChange={(e) =>
                    setMissedPaymentPenalty(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary w-50" onClick={handleGenerate}>
                  Generate Schedule
                </button>
                <button className="btn btn-danger w-50" onClick={clearData}>
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h5>Summary</h5>
              <p>Monthly Payment: ₹{monthlyPayment.toFixed(2)}</p>
              <p>
                Total Payment: ₹{(monthlyPayment * loanTerm).toFixed(2) || 0}
              </p>
              <p>
                Total Interest: ₹
                {(monthlyPayment * loanTerm - loanAmount).toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Amortization Schedule</h5>
              <p className="text-muted small">
                Click row to toggle missed payment.  
                Double-click Total Amount to edit.
              </p>

              <div className="table-responsive" style={{ maxHeight: "550px" }}>
                <table className="table table-hover table-bordered">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Total</th>
                      <th>Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.length > 0 ? (
                      amortizationSchedule.map((row, i) => (
                        <tr
                          key={i}
                          onClick={() => handleMissedPayment(row.month)}
                          className={row.missedPayment ? "table-danger" : ""}
                        >
                          <td>{row.month}</td>
                          <td>{formatDate(row.dueDate)}</td>
                          <td>{row.principal}</td>
                          <td>{row.interest}</td>
                          <td
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleEditField(i, "totalAmount");
                            }}
                          >
                            {editRowIndex === i && editField === "totalAmount" ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editedTotalAmount}
                                onChange={(e) =>
                                  setEditedTotalAmount(e.target.value)
                                }
                                onBlur={() => handleSaveTotalAmount(i)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveTotalAmount(i);
                                  if (e.key === "Escape") {
                                    setEditRowIndex(null);
                                    setEditField("");
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              row.totalAmount
                            )}
                          </td>
                          <td>{row.balance}</td>
                          <td>
                            <span
                              className={`badge ${
                                row.missedPayment ? "bg-danger" : "bg-success"
                              }`}
                            >
                              {row.missedPayment ? "Missed" : "Paid"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          Generate schedule to see details.
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

export default LoanCalculator;
