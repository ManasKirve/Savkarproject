# models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class PaymentMode(str, Enum):
    CASH = "Cash"
    BANK_TRANSFER = "Bank Transfer"
    CHEQUE = "Cheque"
    UPI = "UPI"

class LoanStatus(str, Enum):
    ACTIVE = "Active"
    PENDING = "Pending"
    CLOSED = "Closed"

class NoticeStatus(str, Enum):
    PENDING = "Pending"
    RESOLVED = "Resolved"

class TransactionType(str, Enum):
    PAYMENT = "Payment"
    LOAN_ISSUE = "Loan Issue"
    INTEREST = "Interest"

class Document(BaseModel):
    id: str
    loan_id: str
    name: str
    type: str
    uploaded_at: datetime
    file_content: Optional[str] = None  # Base64 encoded
    file_name: Optional[str] = None

class LoanRecord(BaseModel):
    id: str
    borrower_name: str
    phone_number: str
    last_amount: float
    emi: float
    start_date: str
    end_date: str
    interest_rate: float
    payment_mode: PaymentMode
    total_loan: float
    paid_amount: float
    status: LoanStatus
    created_at: datetime
    updated_at: datetime
    profile_photo: Optional[str] = None  # Base64 encoded
    occupation: Optional[str] = None
    address: Optional[str] = None

class LegalNotice(BaseModel):
    id: str
    borrower_id: str
    borrower_name: str
    amount_due: float
    notice_date: str
    status: NoticeStatus
    description: str
    created_at: datetime

class Transaction(BaseModel):
    id: str
    borrower_id: str
    borrower_name: str
    amount: float
    type: TransactionType
    date: str
    description: str

class DashboardSummary(BaseModel):
    total_loan_issued: float
    recovered_amount: float
    pending_amount: float
    active_records: int
    pending_records: int
    closing_records: int

# Request models for creating/updating
class LoanCreate(BaseModel):
    borrower_name: str
    phone_number: str
    last_amount: float
    emi: float
    start_date: str
    end_date: str
    interest_rate: float
    payment_mode: PaymentMode
    total_loan: float
    paid_amount: float
    status: LoanStatus
    profile_photo: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

class LoanUpdate(BaseModel):
    borrower_name: Optional[str] = None
    phone_number: Optional[str] = None
    last_amount: Optional[float] = None
    emi: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interest_rate: Optional[float] = None
    payment_mode: Optional[PaymentMode] = None
    total_loan: Optional[float] = None
    paid_amount: Optional[float] = None
    status: Optional[LoanStatus] = None
    profile_photo: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

class NoticeCreate(BaseModel):
    borrower_id: str
    borrower_name: str
    amount_due: float
    notice_date: str
    status: NoticeStatus
    description: str

class NoticeUpdate(BaseModel):
    borrower_id: Optional[str] = None
    borrower_name: Optional[str] = None
    amount_due: Optional[float] = None
    notice_date: Optional[str] = None
    status: Optional[NoticeStatus] = None
    description: Optional[str] = None

class TransactionCreate(BaseModel):
    borrower_id: str
    borrower_name: str
    amount: float
    type: TransactionType
    date: str
    description: str

class DocumentCreate(BaseModel):
    loan_id: str
    name: str
    type: str
    file_content: Optional[str] = None
    file_name: Optional[str] = None