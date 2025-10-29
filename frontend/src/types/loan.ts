

export interface Document {
  id: string;
  loanId: string;
  name: string;
  type: string;
  uploadedAt: string;
  // Add file-related fields
  fileContent?: string; // Base64 encoded file content
  fileName?: string;    // Original file name
}

export interface LoanRecord {
  id: string;
  borrowerName: string;
  phoneNumber: string;
  emi: number;
  startDate: string;
  endDate: string;
  interestRate: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI';
  totalLoan: number;
  paidAmount: number;
  status: 'Active' | 'Pending' | 'Closed';
  createdAt: string;
  updatedAt: string;
  // Add profile info
  profilePhoto?: string; // Base64 encoded image
  occupation?: string;
  address?: string;
}

export interface LegalNotice {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amountDue: number;
  noticeDate: string;
  status: 'Pending' | 'Resolved';
  description: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  type: 'Payment' | 'Loan Issue' | 'Interest';
  date: string;
  description: string;
}

export interface DashboardSummary {
  totalLoanIssued: number;
  recoveredAmount: number;
  pendingAmount: number;
  activeRecords: number;
  pendingRecords: number;
  closingRecords: number;
}