from fastapi import FastAPI, HTTPException
from datetime import datetime
from typing import List, Dict
import uuid
from fastapi.middleware.cors import CORSMiddleware
from models import (
    LoanRecord, LoanCreate, LoanUpdate,
    LegalNotice, NoticeCreate, NoticeUpdate,
    Transaction, TransactionCreate,
    Document, DocumentCreate,
    DashboardSummary,
    PaymentMode, LoanStatus, NoticeStatus, TransactionType
)
from deps import verify_firebase_token
import firestore_repo
try:
    from firebase import init_firebase
except Exception:
    init_firebase = None
from fastapi import Depends, Request
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Fixed CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Add test_firestore_connection function
def test_firestore_connection():
    try:
        if init_firebase is None:
            return False
        app, db = init_firebase()
        if not app or not db:
            return False
        # Try to access Firestore
        test_collection = db.collection('test')
        test_doc = test_collection.document('connection_test')
        test_doc.set({'test': True, 'timestamp': datetime.utcnow()})
        result = test_doc.get().to_dict()
        # Clean up
        test_doc.delete()
        return True
    except Exception as e:
        logger.error(f"Firestore connection test failed: {e}")
        return False

# Initialize Firebase once at startup
@app.on_event("startup")
async def startup_event():
    try:
        if init_firebase:
            print("Attempting to initialize Firebase...")
            app, db = init_firebase()
            if app and db:
                logger.info("Firebase initialized successfully")
                print("Firebase initialized successfully")
                
                # Test with actual user collection
                try:
                    # Use the savkar user ID
                    test_doc = db.collection('users').document(firestore_repo.SAVKAR_USER_ID).get()
                    if test_doc.exists:
                        logger.info("Successfully accessed savkar user document")
                        # Test accessing loans
                        loans_ref = test_doc.reference.collection('loans')
                        loans_count = len(list(loans_ref.stream()))
                        logger.info(f"Found {loans_count} loans for savkar user")
                    else:
                        logger.info("Savkar user document not found, will create on first access")
                except Exception as e:
                    logger.error(f"Error accessing savkar user data: {e}")
            else:
                logger.error("Firebase initialization failed - app or db is None")
                print("Firebase initialization failed")
        else:
            logger.error("Firebase module not available")
            print("Firebase module not available")
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        print(f"Error initializing Firebase: {e}")

# REMOVED: Sample data initialization - we'll use only Firestore data

@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    try:
        # Get loans for the savkar user
        logger.info("Getting dashboard summary from Firestore for savkar user")
        
        # Use the savkar user ID
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        loans_data = firestore_repo.get_loans_for_user(savkar_user_id)
        
        # Calculate summary statistics
        total_loan_issued = sum(loan.get('totalLoan', 0) for loan in loans_data)
        recovered_amount = sum(loan.get('paidAmount', 0) for loan in loans_data)
        pending_amount = total_loan_issued - recovered_amount
        
        active_records = sum(1 for loan in loans_data if loan.get('status') == 'Active')
        pending_records = sum(1 for loan in loans_data if loan.get('status') == 'Pending')
        closing_records = sum(1 for loan in loans_data if loan.get('status') == 'Closed')
        
        logger.info(f"Dashboard summary calculated: total_loan_issued={total_loan_issued}, recovered_amount={recovered_amount}, pending_amount={pending_amount}")
        logger.info(f"Loan counts: active={active_records}, pending={pending_records}, closed={closing_records}")
        
        return DashboardSummary(
            total_loan_issued=total_loan_issued,
            recovered_amount=recovered_amount,
            pending_amount=pending_amount,
            active_records=active_records,
            pending_records=pending_records,
            closing_records=closing_records
        )
        
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

# Global endpoints that query ALL loans from Firestore
@app.get("/loans", response_model=List[LoanRecord])
def get_all_loans():
    try:
        # Get loans for the savkar user
        logger.info("Getting all loans from Firestore for savkar user")
        
        # Use the savkar user ID
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        loans_data = firestore_repo.get_loans_for_user(savkar_user_id)
        
        # Convert to LoanRecord objects
        loan_records = []
        for loan_dict in loans_data:
            try:
                # Use the converted data (camelCase) to create LoanRecord
                loan_record = LoanRecord(**loan_dict)
                loan_records.append(loan_record)
            except Exception as e:
                logger.error(f"Error converting loan data to LoanRecord: {e}")
                logger.error(f"Problematic data: {loan_dict}")
                continue
        
        logger.info(f"Retrieved {len(loan_records)} loans from Firestore")
        return loan_records
        
    except Exception as e:
        logger.error(f"Error getting loans from Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get loans: {str(e)}")

@app.post("/loans", response_model=LoanRecord)
def create_loan(loan: LoanCreate):
    try:
        # Create loan for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        # Use dict(by_alias=False) to get snake_case field names for Firestore
        data = loan.dict(by_alias=False)
        
        saved = firestore_repo.create_loan_for_user(savkar_user_id, data)
        
        return saved
        
    except Exception as e:
        logger.error(f"Error creating loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create loan: {e}")

@app.put("/loans/{loan_id}", response_model=LoanRecord)
def update_loan(loan_id: str, loan_update: LoanUpdate):
    try:
        # Update loan for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        # Use dict(by_alias=False) to get snake_case field names for Firestore
        update_data = loan_update.dict(by_alias=False, exclude_unset=True)
        
        updated = firestore_repo.update_loan_for_user(savkar_user_id, loan_id, update_data)
        
        if not updated:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        return updated
        
    except Exception as e:
        logger.error(f"Error updating loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update loan: {e}")

@app.delete("/loans/{loan_id}")
def delete_loan(loan_id: str):
    try:
        # Delete loan for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        firestore_repo.delete_loan_for_user(savkar_user_id, loan_id)
        return {"message": "Loan deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete loan: {e}")

@app.get("/loans/{loan_id}/documents", response_model=List[Document])
def get_loan_documents(loan_id: str):
    try:
        # Get documents for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        docs_data = firestore_repo.get_documents_for_user(savkar_user_id, loan_id)
        
        return docs_data
        
    except Exception as e:
        logger.error(f"Error getting documents from Firestore: {e}")
        return []

@app.post("/documents", response_model=Document)
def create_document(document: DocumentCreate):
    try:
        # Create document for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        # Use dict(by_alias=False) to get snake_case field names for Firestore
        data = document.dict(by_alias=False)
        
        saved = firestore_repo.create_document_for_user(savkar_user_id, data)
        
        return saved
        
    except Exception as e:
        logger.error(f"Error creating document in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create document: {e}")

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    try:
        # Delete document for the savkar user
        savkar_user_id = firestore_repo.SAVKAR_USER_ID
        firestore_repo.delete_document_for_user(savkar_user_id, doc_id)
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting document in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e}")

# ... rest of your existing code for notices and user-specific endpoints remains the same

@app.get("/notices", response_model=List[LegalNotice])
def get_notices(request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        return []
    try:
        return firestore_repo.get_notices_for_user(uid)
    except Exception as e:
        logger.error(f"Error getting notices from Firestore: {e}")
        return []

@app.put('/users/me/loans/{loan_id}')
def update_my_loan(loan_id: str, request: Request, loan_update: LoanUpdate, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required for user-specific operations")
    
    try:
        # Use dict(by_alias=False) to get snake_case field names for Firestore
        update_data = loan_update.dict(by_alias=False, exclude_unset=True)
        updated = firestore_repo.update_loan_for_user(uid, loan_id, update_data)
        return updated
    except Exception as e:
        logger.error(f"Error updating loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update loan: {e}")

@app.delete('/users/me/loans/{loan_id}')
def delete_my_loan(loan_id: str, request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required for user-specific operations")
    
    try:
        firestore_repo.delete_loan_for_user(uid, loan_id)
        return {"message": "Loan deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete loan: {e}")

@app.delete('/users/me/documents/{doc_id}')
def delete_my_document(doc_id: str, request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required for user-specific operations")
    
    try:
        firestore_repo.delete_document_for_user(uid, doc_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e}")

# Per-user endpoints
@app.get('/users/me/loans', response_model=List[LoanRecord])
def get_my_loans(request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required")
    
    try:
        logger.info(f"Getting loans for user {uid} from Firestore")
        loans_data = firestore_repo.get_loans_for_user(uid)
        loan_records = []
        for loan_dict in loans_data:
            loan_record = LoanRecord(**loan_dict)
            loan_records.append(loan_record)
        
        return loan_records
    except Exception as e:
        logger.error(f"Error getting loans from Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load loans: {e}")

@app.post('/users/me/loans')
def create_my_loan(request: Request, loan: LoanCreate, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required")
    
    # Use dict(by_alias=False) to get snake_case field names for Firestore
    data = loan.dict(by_alias=False)
    try:
        logger.info(f"Creating loan for user {uid} in Firestore")
        saved = firestore_repo.create_loan_for_user(uid, data)
        return saved
    except Exception as e:
        logger.error(f"Error creating loan in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create loan: {e}")

@app.get('/users/me/loans/{loan_id}/documents')
def get_my_loan_documents(loan_id: str, request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required")
    
    try:
        logger.info(f"Getting documents for loan {loan_id} of user {uid} from Firestore")
        docs = firestore_repo.get_documents_for_user(uid, loan_id)
        return docs
    except Exception as e:
        logger.error(f"Error getting documents from Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load documents: {e}")

@app.post('/users/me/documents')
def create_my_document(document: DocumentCreate, request: Request, uid: str = None):
    uid = uid or request.headers.get('x-dev-uid')
    if not uid:
        raise HTTPException(status_code=400, detail="User ID (uid) is required.")
    
    # Use dict(by_alias=False) to get snake_case field names for Firestore
    data = document.dict(by_alias=False)
    try:
        logger.info(f"Creating document for user {uid} in Firestore")
        saved = firestore_repo.create_document_for_user(uid, data)
        return saved
    except Exception as e:
        logger.error(f"Error creating document in Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create document: {e}")

# Add health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "firebase": "initialized" if init_firebase else "not initialized"}

# Add debug endpoint for Firestore
@app.get("/debug/firestore")
def debug_firestore():
    try:
        _, db = init_firebase()
        if not db:
            return {"error": "Firebase not initialized"}
            
        # Test accessing the savkar user
        user_id = firestore_repo.SAVKAR_USER_ID
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return {"error": f"Savkar user document not found for ID: {user_id}"}
            
        # Test accessing loans
        loans_ref = user_ref.collection('loans')
        loans = []
        for doc in loans_ref.stream():
            loan_data = doc.to_dict()
            loan_data['id'] = doc.id
            loans.append(loan_data)
        
        return {
            "user_id": user_id,
            "user_exists": True,
            "loans_count": len(loans),
            "loans": loans,
            "sample_loan": loans[0] if loans else None
        }
    except Exception as e:
        return {"error": str(e)}

# Add test endpoint
@app.get("/test-connection")
def test_connection():
    """Test Firebase connection and data creation"""
    try:
        # Test Firebase initialization
        app, db = init_firebase()
        if not app or not db:
            return {"error": "Firebase not initialized properly"}
        
        # Test creating a user
        test_user_id = "test_user"
        user_doc = db.collection('users').document(test_user_id)
        user_doc.set({
            'created_at': datetime.utcnow(),
            'uid': test_user_id
        })
        
        # Test creating a loan
        loan_doc = user_doc.collection('loans').document()
        loan_data = {
            'borrower_name': 'Test Borrower',
            'phone_number': '1234567890',
            'emi': 1000,
            'start_date': '2023-01-01',
            'end_date': '2023-12-31',
            'interest_rate': 10,
            'payment_mode': 'Cash',
            'total_loan': 12000,
            'paid_amount': 0,
            'status': 'Active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        loan_doc.set(loan_data)
        
        # Get the loan to verify
        saved_loan = loan_doc.get().to_dict()
        saved_loan['id'] = loan_doc.id
        
        # Clean up test data
        loan_doc.delete()
        user_doc.delete()
        
        return {
            "success": True,
            "message": "Firebase connection and data creation successful",
            "test_loan": saved_loan
        }
    except Exception as e:
        return {"error": str(e)}