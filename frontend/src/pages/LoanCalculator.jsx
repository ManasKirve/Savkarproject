import React, { useState, useEffect } from 'react';

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(1000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [interestRate, setInterestRate] = useState(1);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [missedPaymentPenalty, setMissedPaymentPenalty] = useState(5);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    calculateLoan();
  }, []);

  const calculateLoan = () => {
    const monthlyRate = interestRate / 100;
    let payment = 0;
    
    if (monthlyRate === 0) {
      payment = loanAmount / loanTerm;
    } else {
      // Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
      payment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm) 
                / (Math.pow(1 + monthlyRate, loanTerm) - 1);
    }
    
    setMonthlyPayment(payment);
    
    // Generate amortization schedule
    let balance = loanAmount;
    const schedule = [];
    
    // Get the loan start date
    const startDate = new Date(loanDate);
    
    for (let i = 1; i <= loanTerm; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = payment - interestPayment;
      balance -= principalPayment;
      
      // Calculate the payment due date (add i months to loan date)
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      schedule.push({
        month: i,
        payment: payment.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        balance: Math.max(0, balance).toFixed(2),
        totalAmount: payment.toFixed(2), // Total amount to pay in this month
        missedPayment: false,
        dueDate: dueDate.toISOString().split('T')[0]
      });
    }
    
    setAmortizationSchedule(schedule);
  };

  const handleMissedPayment = (month) => {
    // Make a copy of the current amortization schedule
    const updatedSchedule = [...amortizationSchedule];
    const currentRow = updatedSchedule[month - 1];
    
    if (currentRow.missedPayment) {
      // If payment is already marked as missed, set it to paid and recalculate
      currentRow.missedPayment = false;
      calculateLoan(); // Reset the schedule to original calculation
      return;
    }
    
    // Mark the payment as missed
    currentRow.missedPayment = true;
    
    // Calculate penalty amount
    const penaltyRate = missedPaymentPenalty / 100;
    const remainingBalance = parseFloat(currentRow.balance);
    const penaltyAmount = remainingBalance * penaltyRate;
    
    // Update the remaining balance and recalculate future payments
    let newBalance = remainingBalance + penaltyAmount;
    
    // Update all subsequent months in the schedule
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
              
              <button 
                className="btn btn-primary w-100" 
                onClick={calculateLoan}
              >
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
                Click on any month to toggle between missed and paid payment. A missed payment adds {missedPaymentPenalty}% penalty to remaining balance.
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
                    {amortizationSchedule.map((row) => (
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
                        <td>{row.totalAmount}</td>
                        <td>{row.balance}</td>
                        <td>
                          <span className={`badge ${row.missedPayment ? 'bg-danger' : 'bg-success'}`}>
                            {row.missedPayment ? 'Missed' : 'Paid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoanCalculator;