import { LoanRecord, LegalNotice, Transaction, DashboardSummary, Document } from '@/types/loan';

const STORAGE_KEYS = {
  LOANS: 'loan_records',
  NOTICES: 'legal_notices',
  TRANSACTIONS: 'transactions',
  DOCUMENTS: 'loan_documents',
} as const;

// Sample data for initial load
const sampleLoans: LoanRecord[] = [
  {
    id: '1',
    borrowerName: 'Rajesh Kumar',
    phoneNumber: '+91 9876543210',
    emi: 5000,
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    interestRate: 12,
    paymentMode: 'Bank Transfer',
    totalLoan: 50000,
    paidAmount: 30000,
    status: 'Active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    profilePhoto: '',
    occupation: 'Software Engineer',
    address: '123 Main St, Mumbai, India'
  },
  {
    id: '2',
    borrowerName: 'Priya Sharma',
    phoneNumber: '+91 9123456789',
    emi: 3000,
    startDate: '2024-02-01',
    endDate: '2024-08-01',
    interestRate: 10,
    paymentMode: 'UPI',
    totalLoan: 30000,
    paidAmount: 12000,
    status: 'Pending',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
    profilePhoto: '',
    occupation: 'Teacher',
    address: '456 Park Ave, Delhi, India'
  },
  {
    id: '3',
    borrowerName: 'Amit Patel',
    phoneNumber: '+91 9555666777',
    emi: 10000,
    startDate: '2023-12-01',
    endDate: '2024-06-01',
    interestRate: 15,
    paymentMode: 'Cheque',
    totalLoan: 100000,
    paidAmount: 100000,
    status: 'Closed',
    createdAt: '2023-12-01T11:00:00Z',
    updatedAt: '2024-06-01T16:45:00Z',
    profilePhoto: '',
    occupation: 'Business Owner',
    address: '789 Market Rd, Bangalore, India'
  },
];

const sampleNotices: LegalNotice[] = [
  {
    id: '1',
    borrowerId: '2',
    borrowerName: 'Priya Sharma',
    amountDue: 18000,
    noticeDate: '2024-07-15',
    status: 'Pending',
    description: 'Payment overdue for 2 months',
    createdAt: '2024-07-15T10:00:00Z',
  },
];

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    borrowerId: '1',
    borrowerName: 'Rajesh Kumar',
    amount: 5000,
    type: 'Payment',
    date: '2024-07-20',
    description: 'EMI Payment',
  },
  {
    id: '2',
    borrowerId: '3',
    borrowerName: 'Amit Patel',
    amount: 10000,
    type: 'Payment',
    date: '2024-07-18',
    description: 'Final Payment',
  },
];

// Sample documents for initial load
const sampleDocuments: Document[] = [
  {
    id: '1',
    loanId: '1',
    name: 'Aadhaar Card',
    type: 'ID Proof',
    uploadedAt: '2024-01-15T10:00:00Z',
    fileName: 'aadhaar_card.pdf'
  },
  {
    id: '2',
    loanId: '1',
    name: 'Address Proof',
    type: 'Address Proof',
    uploadedAt: '2024-01-16T11:00:00Z',
    fileName: 'address_proof.pdf'
  },
  {
    id: '3',
    loanId: '2',
    name: 'PAN Card',
    type: 'ID Proof',
    uploadedAt: '2024-02-01T09:30:00Z',
    fileName: 'pan_card.pdf'
  },
  {
    id: '4',
    loanId: '3',
    name: 'Business Registration',
    type: 'Other',
    uploadedAt: '2023-12-01T12:00:00Z',
    fileName: 'business_registration.pdf'
  }
];

export class LoanService {
  static initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(sampleLoans));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTICES)) {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(sampleNotices));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(sampleDocuments));
    }
  }

  // Loan Records
  static getAllLoans(): LoanRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOANS);
    return data ? JSON.parse(data) : [];
  }

  static createLoan(loan: Omit<LoanRecord, 'id' | 'createdAt' | 'updatedAt'>): LoanRecord {
    const loans = this.getAllLoans();
    const newLoan: LoanRecord = {
      ...loan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loans.push(newLoan);
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    return newLoan;
  }

  static updateLoan(id: string, updates: Partial<LoanRecord>): LoanRecord | null {
    const loans = this.getAllLoans();
    const index = loans.findIndex(loan => loan.id === id);
    if (index === -1) return null;

    loans[index] = { ...loans[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    return loans[index];
  }

  static deleteLoan(id: string): boolean {
    const loans = this.getAllLoans();
    const filteredLoans = loans.filter(loan => loan.id !== id);
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(filteredLoans));
    return filteredLoans.length < loans.length;
  }

  // Legal Notices
  static getAllNotices(): LegalNotice[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
    return data ? JSON.parse(data) : [];
  }

  static createNotice(notice: Omit<LegalNotice, 'id' | 'createdAt'>): LegalNotice {
    const notices = this.getAllNotices();
    const newNotice: LegalNotice = {
      ...notice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    notices.push(newNotice);
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    return newNotice;
  }

  static updateNotice(id: string, updates: Partial<LegalNotice>): LegalNotice | null {
    const notices = this.getAllNotices();
    const index = notices.findIndex(notice => notice.id === id);
    if (index === -1) return null;

    notices[index] = { ...notices[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    return notices[index];
  }

  // Transactions
  static getAllTransactions(): Transaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  static createTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const transactions = this.getAllTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  }

  // Documents
  static getAllDocuments(): Document[] {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  }

  static createDocument(document: Omit<Document, 'id' | 'uploadedAt'>): Document {
    const documents = this.getAllDocuments();
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
    };
    documents.push(newDocument);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    return newDocument;
  }

  static deleteDocument(id: string): boolean {
    const documents = this.getAllDocuments();
    const filteredDocuments = documents.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filteredDocuments));
    return filteredDocuments.length < documents.length;
  }

  static getDocumentsByLoanId(loanId: string): Document[] {
    const documents = this.getAllDocuments();
    return documents.filter(doc => doc.loanId === loanId);
  }


  static getDashboardSummary(): DashboardSummary {
    const loans = this.getAllLoans();
    
    const totalLoanIssued = loans.reduce((sum, loan) => sum + loan.totalLoan, 0);
    const recoveredAmount = loans.reduce((sum, loan) => sum + loan.paidAmount, 0);
    const pendingAmount = totalLoanIssued - recoveredAmount;
    
    const activeRecords = loans.filter(loan => loan.status === 'Active').length;
    const pendingRecords = loans.filter(loan => loan.status === 'Pending').length;
    const closingRecords = loans.filter(loan => loan.status === 'Closed').length;

    return {
      totalLoanIssued,
      recoveredAmount,
      pendingAmount,
      activeRecords,
      pendingRecords,
      closingRecords,
    };
  }

  // Defaulters
  static getDefaulters(): LoanRecord[] {
    const loans = this.getAllLoans();
    return loans.filter(loan => {
      const endDate = new Date(loan.endDate);
      const today = new Date();
      return loan.status !== 'Closed' && loan.paidAmount < loan.totalLoan && endDate < today;
    });
  }
}

// Initialize data on first load
LoanService.initializeData();