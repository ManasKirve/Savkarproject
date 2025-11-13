from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

def to_camel(snake_str: str) -> str:
    components = snake_str.split('_')
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    return components[0] + ''.join(x.title() for x in components[1:])

class CamelCaseModel(BaseModel):
    class Config:
        alias_generator = to_camel
        populate_by_name = True

class PaymentMode(str, Enum):
    CASH = "Cash"
    BANK_TRANSFER = "Bank Transfer"
    CHEQUE = "Cheque"
    UPI = "UPI"

class LoanStatus(str, Enum):
    ACTIVE = "Active"
    PENDING = "Pending"
    CLOSED = "Closed"

# Add LoanType enum
class LoanType(str, Enum):
    CASH_LOAN = "Cash Loan"
    GOLD_LOAN = "Gold Loan"
    HOME_LOAN = "Home Loan"

class NoticeStatus(str, Enum):
    PENDING = "Pending"
    RESOLVED = "Resolved"

class TransactionType(str, Enum):
    PAYMENT = "Payment"
    LOAN_ISSUE = "Loan Issue"
    INTEREST = "Interest"

class Document(CamelCaseModel):
    id: str
    loan_id: str
    name: str
    type: str
    uploaded_at: datetime
    file_content: Optional[str] = None  # Base64 encoded
    file_name: Optional[str] = None

class Jamindar(CamelCaseModel):
    id: str
    name: str
    residence_address: str
    permanent_address: str
    mobile: str

class Profile(CamelCaseModel):
    id: str
    loan_id: str
    occupation: str
    address: str
    profile_photo: Optional[str] = None  # Base64 encoded
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: List[Jamindar] = []
    payment_records: List[dict] = []  # Added payment_records field
    created_at: datetime
    updated_at: datetime

class LoanRecord(CamelCaseModel):
    id: str
    borrower_name: str
    phone_number: str
    emi: float
    start_date: str
    end_date: str
    interest_rate: float
    payment_mode: PaymentMode
    total_loan: float
    paid_amount: float
    status: LoanStatus
    loan_type: LoanType  # Added loan_type field
    created_at: datetime
    updated_at: datetime
    profile_photo: Optional[str] = None  # Base64 encoded
    occupation: Optional[str] = None
    address: Optional[str] = None
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: List[Jamindar] = []
    payment_records: List[dict] = []

class LegalNotice(CamelCaseModel):
    id: str
    borrower_id: str
    borrower_name: str
    amount_due: float
    notice_date: str
    status: NoticeStatus
    description: str
    created_at: datetime

class Transaction(CamelCaseModel):
    id: str
    borrower_id: str
    borrower_name: str
    amount: float
    type: TransactionType
    date: str
    description: str

class DashboardSummary(CamelCaseModel):
    total_loan_issued: float
    recovered_amount: float
    pending_amount: float
    active_records: int
    pending_records: int
    closing_records: int

# Request models for creating/updating
class LoanCreate(CamelCaseModel):
    borrower_name: str
    phone_number: str
    emi: float
    start_date: str
    end_date: str
    interest_rate: float
    payment_mode: PaymentMode
    total_loan: float
    paid_amount: float
    status: LoanStatus
    loan_type: LoanType  # Added loan_type field
    profile_photo: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: List[dict] = []
    payment_records: List[dict] = []

class LoanUpdate(CamelCaseModel):
    borrower_name: Optional[str] = None
    phone_number: Optional[str] = None
    emi: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interest_rate: Optional[float] = None
    payment_mode: Optional[PaymentMode] = None
    total_loan: Optional[float] = None
    paid_amount: Optional[float] = None
    status: Optional[LoanStatus] = None
    loan_type: Optional[LoanType] = None  # Added loan_type field
    profile_photo: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: Optional[List[dict]] = None
    payment_records: Optional[List[dict]] = None

class NoticeCreate(CamelCaseModel):
    borrower_id: str
    borrower_name: str
    amount_due: float
    notice_date: str
    status: NoticeStatus
    description: str

class NoticeUpdate(CamelCaseModel):
    borrower_id: Optional[str] = None
    borrower_name: Optional[str] = None
    amount_due: Optional[float] = None
    notice_date: Optional[str] = None
    status: Optional[NoticeStatus] = None
    description: Optional[str] = None

class TransactionCreate(CamelCaseModel):
    borrower_id: str
    borrower_name: str
    amount: float
    type: TransactionType
    date: str
    description: str

class DocumentCreate(CamelCaseModel):
    loan_id: str
    name: str
    type: str
    file_content: Optional[str] = None
    file_name: Optional[str] = None
    borrower_name: Optional[str] = None  # Add this field

class ProfileCreate(CamelCaseModel):
    loan_id: str
    occupation: str
    address: str
    profile_photo: Optional[str] = None
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: List[dict] = []
    payment_records: List[dict] = []  # Added payment_records field

class ProfileUpdate(CamelCaseModel):
    occupation: Optional[str] = None
    address: Optional[str] = None
    profile_photo: Optional[str] = None
    address_as_per_aadhar: Optional[str] = None
    nave: Optional[str] = None
    haste: Optional[str] = None
    purava: Optional[str] = None
    permanent_address: Optional[str] = None
    jamindars: List[dict] = []  # Ensure it's always a list
    payment_records: List[dict] = []  # Added payment_records field