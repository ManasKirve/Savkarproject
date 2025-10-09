# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import time

app = FastAPI(title="Loan API (in-memory)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # DEV only — lock this down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Pydantic models
# ----------------------
class DocumentModel(BaseModel):
    id: str
    loanId: str
    name: str
    type: str
    uploadedAt: str
    fileContent: Optional[str] = None
    fileName: Optional[str] = None

class LoanModel(BaseModel):
    id: str
    borrowerName: str
    phoneNumber: str
    lastAmount: float
    emi: float
    startDate: str
    endDate: str
    interestRate: float
    paymentMode: str
    totalLoan: float
    paidAmount: float
    status: str
    createdAt: str
    updatedAt: str
    profilePhoto: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

class CreateLoanModel(BaseModel):
    borrowerName: str
    phoneNumber: str
    lastAmount: float
    emi: float
    startDate: str
    endDate: str
    interestRate: float
    paymentMode: str
    totalLoan: float
    paidAmount: float
    status: str
    profilePhoto: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

class NoticeModel(BaseModel):
    id: str
    borrowerId: str
    borrowerName: str
    amountDue: float
    noticeDate: str
    status: str
    description: str
    createdAt: str

class CreateNoticeModel(BaseModel):
    borrowerId: str
    borrowerName: str
    amountDue: float
    noticeDate: str
    status: str
    description: str

class TransactionModel(BaseModel):
    id: str
    borrowerId: str
    borrowerName: str
    amount: float
    type: str
    date: str
    description: str

class CreateTransactionModel(BaseModel):
    borrowerId: str
    borrowerName: str
    amount: float
    type: str
    date: str
    description: str

# ----------------------
# In-memory stores
# ----------------------
loans: List[Dict[str, Any]] = []
notices: List[Dict[str, Any]] = []
transactions: List[Dict[str, Any]] = []
documents: List[Dict[str, Any]] = []

def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

# sample data (same as your frontend)
def seed_data():
    global loans, notices, transactions, documents
    loans = [
      {
        "id": "1",
        "borrowerName": "Rajesh Kumar",
        "phoneNumber": "+91 9876543210",
        "lastAmount": 25000,
        "emi": 5000,
        "startDate": "2024-01-15",
        "endDate": "2024-07-15",
        "interestRate": 12,
        "paymentMode": "Bank Transfer",
        "totalLoan": 50000,
        "paidAmount": 30000,
        "status": "Active",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T15:30:00Z",
        "profilePhoto": "",
        "occupation": "Software Engineer",
        "address": "123 Main St, Mumbai, India"
      },
      {
        "id": "2",
        "borrowerName": "Priya Sharma",
        "phoneNumber": "+91 9123456789",
        "lastAmount": 15000,
        "emi": 3000,
        "startDate": "2024-02-01",
        "endDate": "2024-08-01",
        "interestRate": 10,
        "paymentMode": "UPI",
        "totalLoan": 30000,
        "paidAmount": 12000,
        "status": "Pending",
        "createdAt": "2024-02-01T09:00:00Z",
        "updatedAt": "2024-02-10T14:20:00Z",
        "profilePhoto": "",
        "occupation": "Teacher",
        "address": "456 Park Ave, Delhi, India"
      },
      {
        "id": "3",
        "borrowerName": "Amit Patel",
        "phoneNumber": "+91 9555666777",
        "lastAmount": 100000,
        "emi": 10000,
        "startDate": "2023-12-01",
        "endDate": "2024-06-01",
        "interestRate": 15,
        "paymentMode": "Cheque",
        "totalLoan": 100000,
        "paidAmount": 100000,
        "status": "Closed",
        "createdAt": "2023-12-01T11:00:00Z",
        "updatedAt": "2024-06-01T16:45:00Z",
        "profilePhoto": "",
        "occupation": "Business Owner",
        "address": "789 Market Rd, Bangalore, India"
      },
    ]

    notices = [
      {
        "id": "1",
        "borrowerId": "2",
        "borrowerName": "Priya Sharma",
        "amountDue": 18000,
        "noticeDate": "2024-07-15",
        "status": "Pending",
        "description": "Payment overdue for 2 months",
        "createdAt": "2024-07-15T10:00:00Z",
      }
    ]

    transactions = [
      {
        "id": "1",
        "borrowerId": "1",
        "borrowerName": "Rajesh Kumar",
        "amount": 5000,
        "type": "Payment",
        "date": "2024-07-20",
        "description": "EMI Payment",
      },
      {
        "id": "2",
        "borrowerId": "3",
        "borrowerName": "Amit Patel",
        "amount": 10000,
        "type": "Payment",
        "date": "2024-07-18",
        "description": "Final Payment",
      }
    ]

    documents = [
      {
        "id": "1",
        "loanId": "1",
        "name": "Aadhaar Card",
        "type": "ID Proof",
        "uploadedAt": "2024-01-15T10:00:00Z",
        "fileName": "aadhaar_card.pdf",
      },
      {
        "id": "2",
        "loanId": "1",
        "name": "Address Proof",
        "type": "Address Proof",
        "uploadedAt": "2024-01-16T11:00:00Z",
        "fileName": "address_proof.pdf",
      },
      {
        "id": "3",
        "loanId": "2",
        "name": "PAN Card",
        "type": "ID Proof",
        "uploadedAt": "2024-02-01T09:30:00Z",
        "fileName": "pan_card.pdf",
      },
      {
        "id": "4",
        "loanId": "3",
        "name": "Business Registration",
        "type": "Other",
        "uploadedAt": "2023-12-01T12:00:00Z",
        "fileName": "business_registration.pdf",
      }
    ]

seed_data()

# ----------------------
# Helper
# ----------------------
def gen_id() -> str:
    return str(int(time.time() * 1000))

# ----------------------
# Loan endpoints
# ----------------------
@app.get("/api/loans")
def get_loans():
    return {"data": loans}

@app.get("/api/loans/{loan_id}")
def get_loan(loan_id: str):
    for l in loans:
        if l["id"] == loan_id:
            return l
    raise HTTPException(status_code=404, detail="Loan not found")

@app.post("/api/loans")
def create_loan(payload: CreateLoanModel):
    new = payload.dict()
    new["id"] = gen_id()
    new["createdAt"] = now_iso()
    new["updatedAt"] = now_iso()
    loans.append(new)
    return {"data": new}

@app.put("/api/loans/{loan_id}")
def update_loan(loan_id: str, updates: Dict[str, Any]):
    for i, l in enumerate(loans):
        if l["id"] == loan_id:
            loans[i] = {**l, **updates, "updatedAt": now_iso()}
            return {"data": loans[i]}
    raise HTTPException(status_code=404, detail="Loan not found")

@app.delete("/api/loans/{loan_id}")
def delete_loan(loan_id: str):
    global loans
    original_len = len(loans)
    loans = [l for l in loans if l["id"] != loan_id]
    return {"deleted": original_len - len(loans)}

# ----------------------
# Notices
# ----------------------
@app.get("/api/notices")
def get_notices():
    return {"data": notices}

@app.post("/api/notices")
def create_notice(payload: CreateNoticeModel):
    new = payload.dict()
    new["id"] = gen_id()
    new["createdAt"] = now_iso()
    notices.append(new)
    return {"data": new}

@app.put("/api/notices/{notice_id}")
def update_notice(notice_id: str, updates: Dict[str, Any]):
    for i, n in enumerate(notices):
        if n["id"] == notice_id:
            notices[i] = {**n, **updates}
            return {"data": notices[i]}
    raise HTTPException(status_code=404, detail="Notice not found")

# ----------------------
# Transactions
# ----------------------
@app.get("/api/transactions")
def get_transactions():
    return {"data": transactions}

@app.post("/api/transactions")
def create_transaction(payload: CreateTransactionModel):
    new = payload.dict()
    new["id"] = gen_id()
    transactions.append(new)
    return {"data": new}

# ----------------------
# Documents
# ----------------------
@app.get("/api/documents")
def get_documents():
    return {"data": documents}

@app.get("/api/documents/loan/{loan_id}")
def get_documents_by_loan(loan_id: str):
    filtered = [d for d in documents if d.get("loanId") == loan_id]
    return {"data": filtered}

@app.post("/api/documents")
def create_document(payload: DocumentModel):
    new = payload.dict()
    if "id" not in new or not new["id"]:
        new["id"] = gen_id()
    if "uploadedAt" not in new or not new["uploadedAt"]:
        new["uploadedAt"] = now_iso()
    documents.append(new)
    return {"data": new}

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    global documents
    original_len = len(documents)
    documents = [d for d in documents if d["id"] != doc_id]
    return {"deleted": original_len - len(documents)}

# ----------------------
# Dashboard & Defaulters
# ----------------------
@app.get("/api/dashboard")
def dashboard():
    totalLoanIssued = sum(l.get("totalLoan", 0) for l in loans)
    recoveredAmount = sum(l.get("paidAmount", 0) for l in loans)
    pendingAmount = totalLoanIssued - recoveredAmount
    activeRecords = len([l for l in loans if l.get("status") == "Active"])
    pendingRecords = len([l for l in loans if l.get("status") == "Pending"])
    closingRecords = len([l for l in loans if l.get("status") == "Closed"])
    return {
        "totalLoanIssued": totalLoanIssued,
        "recoveredAmount": recoveredAmount,
        "pendingAmount": pendingAmount,
        "activeRecords": activeRecords,
        "pendingRecords": pendingRecords,
        "closingRecords": closingRecords,
    }

@app.get("/api/defaulters")
def defaulters():
    result = []
    now = datetime.utcnow()
    for l in loans:
        try:
            end = datetime.fromisoformat(l["endDate"])
        except Exception:
            # if endDate is a date-only string, try parse
            try:
                end = datetime.strptime(l["endDate"], "%Y-%m-%d")
            except Exception:
                continue
        if l.get("status") != "Closed" and l.get("paidAmount", 0) < l.get("totalLoan", 0) and end < now:
            result.append(l)
    return {"data": result}

# ----------------------
# Utility: re-seed sample data (dev)
# ----------------------
@app.post("/api/init")
def reinit():
    seed_data()
    return {"message": "seeded"}
