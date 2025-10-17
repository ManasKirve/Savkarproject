# main.py
from fastapi import FastAPI, HTTPException
from datetime import datetime
from typing import List, Dict
import uuid
from fastapi.middleware.cors import CORSMiddleware  # Import CORS middleware
from models import (
    LoanRecord, LoanCreate, LoanUpdate,
    LegalNotice, NoticeCreate, NoticeUpdate,
    Transaction, TransactionCreate,
    Document, DocumentCreate,
    DashboardSummary,
    PaymentMode, LoanStatus, NoticeStatus, TransactionType
)

app = FastAPI()

# Fixed CORS middleware configuration - removed duplicate allow_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

loans_db: Dict[str, LoanRecord] = {}
notices_db: Dict[str, LegalNotice] = {}
transactions_db: Dict[str, Transaction] = {}
documents_db: Dict[str, Document] = {}


def initialize_sample_data():
    # Sample loans
    loan1 = LoanRecord(
        id="1",
        borrower_name="Rajesh Kumar",
        phone_number="+91 9876543210",
        last_amount=25000,
        emi=5000,
        start_date="2024-01-15",
        end_date="2024-07-15",
        interest_rate=12,
        payment_mode=PaymentMode.BANK_TRANSFER,
        total_loan=50000,
        paid_amount=30000,
        status=LoanStatus.ACTIVE,
        created_at=datetime.fromisoformat("2024-01-15T10:00:00Z"),
        updated_at=datetime.fromisoformat("2024-01-20T15:30:00Z"),
        occupation="Software Engineer",
        address="123 Main St, Mumbai, India"
    )
    
    loan2 = LoanRecord(
        id="2",
        borrower_name="Priya Sharma",
        phone_number="+91 9123456789",
        last_amount=15000,
        emi=3000,
        start_date="2024-02-01",
        end_date="2024-08-01",
        interest_rate=10,
        payment_mode=PaymentMode.UPI,
        total_loan=30000,
        paid_amount=12000,
        status=LoanStatus.PENDING,
        created_at=datetime.fromisoformat("2024-02-01T09:00:00Z"),
        updated_at=datetime.fromisoformat("2024-02-10T14:20:00Z"),
        occupation="Teacher",
        address="456 Park Ave, Delhi, India"
    )
    
    loan3 = LoanRecord(
        id="3",
        borrower_name="Amit Patel",
        phone_number="+91 9555666777",
        last_amount=100000,
        emi=10000,
        start_date="2023-12-01",
        end_date="2024-06-01",
        interest_rate=15,
        payment_mode=PaymentMode.CHEQUE,
        total_loan=100000,
        paid_amount=100000,
        status=LoanStatus.CLOSED,
        created_at=datetime.fromisoformat("2023-12-01T11:00:00Z"),
        updated_at=datetime.fromisoformat("2024-06-01T16:45:00Z"),
        occupation="Business Owner",
        address="789 Market Rd, Bangalore, India"
    )
    
    loans_db["1"] = loan1
    loans_db["2"] = loan2
    loans_db["3"] = loan3
    
    # Sample notices
    notice1 = LegalNotice(
        id="1",
        borrower_id="2",
        borrower_name="Priya Sharma",
        amount_due=18000,
        notice_date="2024-07-15",
        status=NoticeStatus.PENDING,
        description="Payment overdue for 2 months",
        created_at=datetime.fromisoformat("2024-07-15T10:00:00Z")
    )
    
    notices_db["1"] = notice1
    
    # Sample transactions
    transaction1 = Transaction(
        id="1",
        borrower_id="1",
        borrower_name="Rajesh Kumar",
        amount=5000,
        type=TransactionType.PAYMENT,
        date="2024-07-20",
        description="EMI Payment"
    )
    
    transaction2 = Transaction(
        id="2",
        borrower_id="3",
        borrower_name="Amit Patel",
        amount=10000,
        type=TransactionType.PAYMENT,
        date="2024-07-18",
        description="Final Payment"
    )
    
    transactions_db["1"] = transaction1
    transactions_db["2"] = transaction2
    
    # Sample documents
    doc1 = Document(
        id="1",
        loan_id="1",
        name="Aadhaar Card",
        type="ID Proof",
        uploaded_at=datetime.fromisoformat("2024-01-15T10:00:00Z"),
        file_name="aadhaar_card.pdf"
    )
    
    doc2 = Document(
        id="2",
        loan_id="1",
        name="Address Proof",
        type="Address Proof",
        uploaded_at=datetime.fromisoformat("2024-01-16T11:00:00Z"),
        file_name="address_proof.pdf"
    )
    
    doc3 = Document(
        id="3",
        loan_id="2",
        name="PAN Card",
        type="ID Proof",
        uploaded_at=datetime.fromisoformat("2024-02-01T09:30:00Z"),
        file_name="pan_card.pdf"
    )
    
    doc4 = Document(
        id="4",
        loan_id="3",
        name="Business Registration",
        type="Other",
        uploaded_at=datetime.fromisoformat("2023-12-01T12:00:00Z"),
        file_name="business_registration.pdf"
    )
    
    documents_db["1"] = doc1
    documents_db["2"] = doc2
    documents_db["3"] = doc3
    documents_db["4"] = doc4

# Initialize sample data on startup
initialize_sample_data()

# Loan endpoints
@app.get("/loans", response_model=List[LoanRecord])
def get_all_loans():
    return list(loans_db.values())

@app.post("/loans", response_model=LoanRecord)
def create_loan(loan: LoanCreate):
    loan_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_loan = LoanRecord(
        id=loan_id,
        borrower_name=loan.borrower_name,
        phone_number=loan.phone_number,
        last_amount=loan.last_amount,
        emi=loan.emi,
        start_date=loan.start_date,
        end_date=loan.end_date,
        interest_rate=loan.interest_rate,
        payment_mode=loan.payment_mode,
        total_loan=loan.total_loan,
        paid_amount=loan.paid_amount,
        status=loan.status,
        created_at=now,
        updated_at=now,
        profile_photo=loan.profile_photo,
        occupation=loan.occupation,
        address=loan.address
    )
    
    loans_db[loan_id] = new_loan
    return new_loan

@app.put("/loans/{loan_id}", response_model=LoanRecord)
def update_loan(loan_id: str, updates: LoanUpdate):
    if loan_id not in loans_db:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    loan = loans_db[loan_id]
    update_data = updates.dict(exclude_unset=True)
    
    # Update fields
    for field, value in update_data.items():
        setattr(loan, field, value)
    
    loan.updated_at = datetime.now()
    return loan

@app.delete("/loans/{loan_id}")
def delete_loan(loan_id: str):
    if loan_id not in loans_db:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    del loans_db[loan_id]
    return {"message": "Loan deleted successfully"}

# Notice endpoints
@app.get("/notices", response_model=List[LegalNotice])
def get_all_notices():
    return list(notices_db.values())

@app.post("/notices", response_model=LegalNotice)
def create_notice(notice: NoticeCreate):
    notice_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_notice = LegalNotice(
        id=notice_id,
        borrower_id=notice.borrower_id,
        borrower_name=notice.borrower_name,
        amount_due=notice.amount_due,
        notice_date=notice.notice_date,
        status=notice.status,
        description=notice.description,
        created_at=now
    )
    
    notices_db[notice_id] = new_notice
    return new_notice

@app.put("/notices/{notice_id}", response_model=LegalNotice)
def update_notice(notice_id: str, updates: NoticeUpdate):
    if notice_id not in notices_db:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    notice = notices_db[notice_id]
    update_data = updates.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(notice, field, value)
    
    return notice

# Transaction endpoints
@app.get("/transactions", response_model=List[Transaction])
def get_all_transactions():
    return list(transactions_db.values())

@app.post("/transactions", response_model=Transaction)
def create_transaction(transaction: TransactionCreate):
    transaction_id = str(uuid.uuid4())
    
    new_transaction = Transaction(
        id=transaction_id,
        borrower_id=transaction.borrower_id,
        borrower_name=transaction.borrower_name,
        amount=transaction.amount,
        type=transaction.type,
        date=transaction.date,
        description=transaction.description
    )
    
    transactions_db[transaction_id] = new_transaction
    return new_transaction

# Document endpoints
@app.get("/documents", response_model=List[Document])
def get_all_documents():
    return list(documents_db.values())

@app.post("/documents", response_model=Document)
def create_document(document: DocumentCreate):
    document_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_document = Document(
        id=document_id,
        loan_id=document.loan_id,
        name=document.name,
        type=document.type,
        uploaded_at=now,
        file_content=document.file_content,
        file_name=document.file_name
    )
    
    documents_db[document_id] = new_document
    return new_document

@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    del documents_db[document_id]
    return {"message": "Document deleted successfully"}

@app.get("/loans/{loan_id}/documents", response_model=List[Document])
def get_documents_by_loan_id(loan_id: str):
    return [doc for doc in documents_db.values() if doc.loan_id == loan_id]

# Dashboard endpoint
@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    loans = list(loans_db.values())
    
    total_loan_issued = sum(loan.total_loan for loan in loans)
    recovered_amount = sum(loan.paid_amount for loan in loans)
    pending_amount = total_loan_issued - recovered_amount
    
    active_records = sum(1 for loan in loans if loan.status == LoanStatus.ACTIVE)
    pending_records = sum(1 for loan in loans if loan.status == LoanStatus.PENDING)
    closing_records = sum(1 for loan in loans if loan.status == LoanStatus.CLOSED)
    
    return DashboardSummary(
        total_loan_issued=total_loan_issued,
        recovered_amount=recovered_amount,
        pending_amount=pending_amount,
        active_records=active_records,
        pending_records=pending_records,
        closing_records=closing_records
    )

# Defaulters endpoint
@app.get("/loans/defaulters", response_model=List[LoanRecord])
def get_defaulters():
    today = datetime.now().date()
    defaulters = []
    
    for loan in loans_db.values():
        if loan.status != LoanStatus.CLOSED and loan.paid_amount < loan.total_loan:
            end_date = datetime.fromisoformat(loan.end_date).date()
            if end_date < today:
                defaulters.append(loan)
    
    return defaulters