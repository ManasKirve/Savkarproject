import React, { useState } from 'react';

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(1000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [interestRate, setInterestRate] = useState(1);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [missedPaymentPenalty, setMissedPaymentPenalty] = useState(5);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [editedTotalAmount, setEditedTotalAmount] = useState('');
  const [editField, setEditField] = useState('');

  // ✅ Removed auto calculation — user must click Calculate button
  const calculateLoan = () => {
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
    const startDate = new Date(loanDate);

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
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }

    setAmortizationSchedule(schedule);
    setEditRowIndex(null);
    setEditField('');
  };

  const handleMissedPayment = (month) => {
    const updatedSchedule = [...amortizationSchedule];
    const currentRow = updatedSchedule[month - 1];

    if (currentRow.missedPayment) {
      currentRow.missedPayment = false;
      calculateLoan();
      return;
    }

    currentRow.missedPayment = true;

    const penaltyRate = missedPaymentPenalty / 100;
    const remainingBalance = parseFloat(currentRow.balance);
    const penaltyAmount = remainingBalance * penaltyRate;

    let newBalance = remainingBalance + penaltyAmount;

    for (let i = month; i < updatedSchedule.length; i++) {
      const monthlyRate = interestRate / 100;
      const interestPayment = newBalance * monthlyRate;
      const principalPayment = parseFloat(updatedSchedule[i].payment) - interestPayment;

      newBalance -= principalPayment;

      updatedSchedule[i].interest = interestPayment.toFixed(2);
      updatedSchedule[i].principal = principalPayment.toFixed(2);
      updatedSchedule[i].balance = Math.max(0, newBalance).toFixed(2);
    }

    setAmortizationSchedule(updatedSchedule);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const handleEditField = (index, field) => {
    if (field === 'totalAmount') {
      setEditRowIndex(index);
      setEditField(field);
      setEditedTotalAmount(amortizationSchedule[index].totalAmount);
    }
  };

  const handleSaveTotalAmount = (index) => {
    const updatedSchedule = [...amortizationSchedule];
    const newTotalAmount = Math.max(0, parseFloat(editedTotalAmount));
    const monthlyRate = interestRate / 100;

    const currentRow = updatedSchedule[index];
    const previousBalance = index === 0 ? loanAmount : parseFloat(updatedSchedule[index - 1].balance);

    const interestPayment = parseFloat(currentRow.interest);
    const principalPayment = Math.max(0, newTotalAmount - interestPayment);

    updatedSchedule[index].totalAmount = newTotalAmount.toFixed(2);
    updatedSchedule[index].principal = principalPayment.toFixed(2);

    const newBalance = Math.max(0, previousBalance - principalPayment);
    updatedSchedule[index].balance = newBalance.toFixed(2);

    if (newBalance === 0) {
      const trimmedSchedule = updatedSchedule.slice(0, index + 1);
      setAmortizationSchedule(trimmedSchedule);
      setEditRowIndex(null);
      setEditField('');
      return;
    }

    let currentBalance = newBalance;

    for (let i = index + 1; i < updatedSchedule.length; i++) {
      const futureInterestPayment = currentBalance * monthlyRate;
      const futurePrincipalPayment = parseFloat(updatedSchedule[i].payment) - futureInterestPayment;

      currentBalance -= futurePrincipalPayment;

      updatedSchedule[i].interest = futureInterestPayment.toFixed(2);
      updatedSchedule[i].principal = futurePrincipalPayment.toFixed(2);
      updatedSchedule[i].balance = Math.max(0, currentBalance).toFixed(2);

      if (currentBalance <= 0) {
        const trimmedSchedule = updatedSchedule.slice(0, i + 1);
        setAmortizationSchedule(trimmedSchedule);
        setEditRowIndex(null);
        setEditField('');
        return;
      }
    }

    setAmortizationSchedule(updatedSchedule);
    setEditRowIndex(null);
    setEditField('');
  };

  const handleInputChange = (e) => {
    setEditedTotalAmount(e.target.value);
  };

  const handleSaveField = (index) => {
    if (editField === 'totalAmount') {
      handleSaveTotalAmount(index);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Loan Calculator</h1>

      <div className="row">
        {/* Loan Details Section */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="card-title h5 mb-3">Loan Details</h2>

              <div className="mb-3">
                <label htmlFor="loan-amount" className="form-label">Loan Amount (₹)</label>
                <input
                  id="loan-amount"
                  type="number"
                  className="form-control"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="loan-term" className="form-label">Loan Term (months)</label>
                <input
                  id="loan-term"
                  type="number"
                  className="form-control"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="interest-rate" className="form-label">Interest Rate (% per month)</label>
                <input
                  id="interest-rate"
                  type="number"
                  className="form-control"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="loan-date" className="form-label">Loan Start Date</label>
                <input
                  id="loan-date"
                  type="date"
                  className="form-control"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="penalty" className="form-label">Missed Payment Penalty (%)</label>
                <input
                  id="penalty"
                  type="number"
                  className="form-control"
                  value={missedPaymentPenalty}
                  onChange={(e) => setMissedPaymentPenalty(Math.max(0, Number(e.target.value)))}
                />
              </div>

              {/* ✅ Calculate Button */}
              <button className="btn btn-primary w-100" onClick={calculateLoan}>
                Calculate
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h2 className="card-title h5 mb-3">Summary</h2>
              <p className="mb-2">Monthly Payment: ₹{monthlyPayment.toFixed(2)}</p>
              <p className="mb-2">Total Payment: ₹{(monthlyPayment * loanTerm).toFixed(2)}</p>
              <p className="mb-2">Total Interest: ₹{(monthlyPayment * loanTerm - loanAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Amortization Schedule Section */}
        <div className="col-md-8 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="card-title h5 mb-2">Amortization Schedule</h2>
              <p className="text-muted mb-3 small">
                Click on any month to toggle between missed and paid payment.
                A missed payment adds {missedPaymentPenalty}% penalty to remaining balance.
                Double-click on Total Amount column to edit values.
              </p>

              <div className="table-responsive" style={{ maxHeight: '550px' }}>
                <table className="table table-hover">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Principal (₹)</th>
                      <th>Interest (₹)</th>
                      <th>Total Amount (₹)</th>
                      <th>Remaining (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.length > 0 ? (
                      amortizationSchedule.map((row, index) => (
                        <tr
                          key={row.month}
                          onClick={() => handleMissedPayment(row.month)}
                          className={row.missedPayment ? 'table-danger' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{row.month}</td>
                          <td>{formatDate(row.dueDate)}</td>
                          <td>{row.principal}</td>
                          <td>{row.interest}</td>
                          <td
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleEditField(index, 'totalAmount');
                            }}
                          >
                            {editRowIndex === index && editField === 'totalAmount' ? (
                              <div onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={editedTotalAmount}
                                  onChange={handleInputChange}
                                  onBlur={() => handleSaveField(index)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveField(index);
                                    if (e.key === 'Escape') {
                                      setEditRowIndex(null);
                                      setEditField('');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              row.totalAmount
                            )}
                          </td>
                          <td>{row.balance}</td>
                          <td>
                            <span
                              className={`badge ${row.missedPayment ? 'bg-danger' : 'bg-success'}`}
                            >
                              {row.missedPayment ? 'Missed' : 'Paid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          Click <b>“Calculate”</b> to generate amortization schedule
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
