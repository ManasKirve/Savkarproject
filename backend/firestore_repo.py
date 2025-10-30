from firebase import init_firebase
from datetime import datetime
from typing import Dict, Any, List
import uuid
from google.cloud.firestore_v1 import Transaction
import logging
from models import (
    LoanRecord, LoanCreate, LoanUpdate,
    Document, DocumentCreate,
    LegalNotice, NoticeCreate, NoticeUpdate
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fixed user ID for the savkar
SAVKAR_USER_ID = "savkar_user_001"

def _loans_col(uid):
    try:
        _, db = init_firebase()
        if not db:
            logger.error("Failed to initialize Firebase")
            return None
        return db.collection('users').document(uid).collection('loans')
    except Exception as e:
        logger.error(f"Error getting loans collection: {e}")
        return None

def _docs_col(uid):
    try:
        _, db = init_firebase()
        if not db:
            logger.error("Failed to initialize Firebase")
            return None
        return db.collection('users').document(uid).collection('documents')
    except Exception as e:
        logger.error(f"Error getting documents collection: {e}")
        return None

def _notices_col(uid):
    try:
        _, db = init_firebase()
        if not db:
            logger.error("Failed to initialize Firebase")
            return None
        return db.collection('users').document(uid).collection('notices')
    except Exception as e:
        logger.error(f"Error getting notices collection: {e}")
        return None

def ensure_user_exists(uid):
    """Create a user document if it doesn't exist"""
    try:
        _, db = init_firebase()
        if not db:
            logger.error("Failed to initialize Firebase")
            return False
            
        user_doc = db.collection('users').document(uid)
        if not user_doc.get().exists:
            logger.info(f"Creating user document for {uid}")
            user_doc.set({
                'created_at': datetime.utcnow(),
                'uid': uid
            })
        return True
    except Exception as e:
        logger.error(f"Error ensuring user exists: {e}")
        return False

def _convert_keys_to_camel_case(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert snake_case keys to camelCase"""
    if not data:
        return data
        
    converted = {}
    for key, value in data.items():
        if '_' in key:
            parts = key.split('_')
            camel_key = parts[0] + ''.join(part.capitalize() for part in parts[1:])
        else:
            camel_key = key
        converted[camel_key] = value
    return converted

def get_loans_for_user(uid: str) -> List[Dict[str, Any]]:
    """Get all loans for a specific user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            return []
            
        col = _loans_col(uid)
        if not col:
            logger.error(f"Failed to get loans collection for user {uid}")
            return []
            
        docs = col.stream()
        out = []
        for d in docs:
            data = d.to_dict()
            if data:
                data['id'] = d.id
                
                # Convert Firestore timestamps to ISO strings
                if 'created_at' in data and hasattr(data.get('created_at'), 'isoformat'):
                    data['created_at'] = data['created_at'].isoformat()
                if 'updated_at' in data and hasattr(data.get('updated_at'), 'isoformat'):
                    data['updated_at'] = data['updated_at'].isoformat()
                
                # Convert snake_case keys to camelCase for frontend compatibility
                converted_data = {}
                for key, value in data.items():
                    if '_' in key:
                        parts = key.split('_')
                        camel_key = parts[0] + ''.join(part.capitalize() for part in parts[1:])
                    else:
                        camel_key = key
                    converted_data[camel_key] = value
                
                out.append(converted_data)
        
        logger.info(f"Retrieved {len(out)} loans for user {uid}")
        return out
    except Exception as e:
        logger.error(f"Error getting loans for user {uid}: {e}")
        return []

def create_loan_for_user(uid: str, loan_data: Dict[str, Any]) -> LoanRecord:
    """Create a new loan for a user"""
    try:
        logger.info(f"Creating loan for user {uid} with data: {loan_data}")
        
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to create loan for user {uid}")
            
        col = _loans_col(uid)
        if not col:
            logger.error(f"Failed to get loans collection for user {uid}")
            raise Exception(f"Failed to create loan for user {uid}")
            
        doc_ref = col.document()
        now = datetime.utcnow()
        loan_data = dict(loan_data)
        loan_data.setdefault('created_at', now)
        loan_data.setdefault('updated_at', now)
        
        logger.info(f"Setting loan data to Firestore: {loan_data}")
        doc_ref.set(loan_data)
        logger.info(f"Created loan {doc_ref.id} for user {uid}")
        
        saved = doc_ref.get().to_dict()
        if saved:
            saved['id'] = doc_ref.id
            # Convert timestamps
            for time_field in ['created_at', 'updated_at']:
                if time_field in saved and hasattr(saved[time_field], 'isoformat'):
                    saved[time_field] = saved[time_field].isoformat()
            
            # Convert snake_case keys to camelCase
            saved = _convert_keys_to_camel_case(saved)
            
            try:
                return LoanRecord(**saved)
            except Exception as e:
                logger.error(f"Error creating LoanRecord from saved data: {e}")
                logger.error(f"Saved data: {saved}")
                raise Exception(f"Failed to create loan for user {uid}: {e}")
        raise Exception(f"Failed to retrieve saved loan for user {uid}")
    except Exception as e:
        logger.error(f"Error creating loan for user {uid}: {e}")
        raise Exception(f"Failed to create loan for user {uid}: {e}")

def update_loan_for_user(uid: str, loan_id: str, update_data: Dict[str, Any]) -> LoanRecord:
    """Update an existing loan for a user"""
    try:
        col = _loans_col(uid)
        if not col:
            logger.error(f"Failed to get loans collection for user {uid}")
            raise Exception(f"Failed to update loan for user {uid}")
            
        doc_ref = col.document(loan_id)
        update_data['updated_at'] = datetime.utcnow()
        doc_ref.update(update_data)
        logger.info(f"Updated loan {loan_id} for user {uid}")
        
        updated = doc_ref.get().to_dict()
        if updated:
            updated['id'] = doc_ref.id
            # Convert timestamps
            for time_field in ['created_at', 'updated_at']:
                if time_field in updated and hasattr(updated[time_field], 'isoformat'):
                    updated[time_field] = updated[time_field].isoformat()
            
            # Convert snake_case keys to camelCase
            updated = _convert_keys_to_camel_case(updated)
            
            try:
                return LoanRecord(**updated)
            except Exception as e:
                logger.error(f"Error creating LoanRecord from updated data: {e}")
                raise Exception(f"Failed to update loan for user {uid}: {e}")
        raise Exception(f"Failed to retrieve updated loan for user {uid}")
    except Exception as e:
        logger.error(f"Error updating loan {loan_id} for user {uid}: {e}")
        raise Exception(f"Failed to update loan for user {uid}: {e}")

def delete_loan_for_user(uid: str, loan_id: str):
    """Delete a loan for a user"""
    try:
        col = _loans_col(uid)
        if not col:
            logger.error(f"Failed to get loans collection for user {uid}")
            raise Exception(f"Failed to delete loan for user {uid}")
            
        doc_ref = col.document(loan_id)
        doc_ref.delete()
        logger.info(f"Deleted loan {loan_id} for user {uid}")
    except Exception as e:
        logger.error(f"Error deleting loan {loan_id} for user {uid}: {e}")
        raise Exception(f"Failed to delete loan for user {uid}: {e}")
    
def get_documents_for_user(uid: str, loan_id: str) -> List[Dict[str, Any]]:
    """Get all documents for a specific loan"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            return []
            
        col = _docs_col(uid)
        if not col:
            logger.error(f"Failed to get documents collection for user {uid}")
            return []
            
        q = col.where('loan_id', '==', loan_id).stream()
        out = []
        for d in q:
            data = d.to_dict()
            if data:
                data['id'] = d.id
                if 'uploaded_at' in data and hasattr(data.get('uploaded_at'), 'isoformat'):
                    data['uploaded_at'] = data['uploaded_at'].isoformat()
                
                # Convert snake_case keys to camelCase
                converted_data = _convert_keys_to_camel_case(data)
                out.append(converted_data)
        logger.info(f"Retrieved {len(out)} documents for loan {loan_id} of user {uid}")
        return out
    except Exception as e:
        logger.error(f"Error getting documents for loan {loan_id} of user {uid}: {e}")
        return []

def create_document_for_user(uid: str, document_data: Dict[str, Any]) -> Document:
    """Create a new document for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to create document for user {uid}")
            
        col = _docs_col(uid)
        if not col:
            logger.error(f"Failed to get documents collection for user {uid}")
            raise Exception(f"Failed to create document for user {uid}")
            
        # If borrower_name is not provided, try to get it from the loan
        if 'borrower_name' not in document_data and 'loan_id' in document_data:
            try:
                loan_col = _loans_col(uid)
                if loan_col:
                    loan_doc = loan_col.document(document_data['loan_id']).get()
                    if loan_doc.exists:
                        loan_data = loan_doc.to_dict()
                        document_data['borrower_name'] = loan_data.get('borrower_name', '')
            except Exception as e:
                logger.error(f"Error getting borrower_name from loan: {e}")
        
        doc_ref = col.document()
        now = datetime.utcnow()
        document_data = dict(document_data)
        document_data.setdefault('uploaded_at', now)
        
        # Generate a shorter file ID instead of storing the full content
        if 'file_content' in document_data and document_data['file_content']:
            # Instead of storing the full base64, store a reference ID
            file_id = str(uuid.uuid4())
            document_data['file_id'] = file_id
            document_data['file_size'] = len(document_data['file_content']) // 1024  # Size in KB
            
            # Store the full content without truncation
            # REMOVE THIS LINE: document_data['file_content'] = document_data['file_content'][:100] + '...'  # Truncate for display
        
        doc_ref.set(document_data)
        logger.info(f"Created document {doc_ref.id} for user {uid}")
        
        saved = doc_ref.get().to_dict()
        if saved:
            saved['id'] = doc_ref.id
            if 'uploaded_at' in saved and hasattr(saved.get('uploaded_at'), 'isoformat'):
                saved['uploaded_at'] = saved['uploaded_at'].isoformat()
            
            # Convert snake_case keys to camelCase
            saved = _convert_keys_to_camel_case(saved)
            
            try:
                return Document(**saved)
            except Exception as e:
                logger.error(f"Error creating Document from saved data: {e}")
                raise Exception(f"Failed to create document for user {uid}: {e}")
        raise Exception(f"Failed to retrieve saved document for user {uid}")
    except Exception as e:
        logger.error(f"Error creating document for user {uid}: {e}")
        raise Exception(f"Failed to create document for user {uid}: {e}")    
def delete_document_for_user(uid: str, doc_id: str):
    """Delete a document for a user"""
    try:
        col = _docs_col(uid)
        if not col:
            logger.error(f"Failed to get documents collection for user {uid}")
            raise Exception(f"Failed to delete document for user {uid}")
            
        doc_ref = col.document(doc_id)
        doc_ref.delete()
        logger.info(f"Deleted document {doc_id} for user {uid}")
    except Exception as e:
        logger.error(f"Error deleting document {doc_id} for user {uid}: {e}")
        raise Exception(f"Failed to delete document for user {uid}: {e}")

def get_notices_for_user(uid: str) -> List[Dict[str, Any]]:
    """Get all notices for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            return []
            
        col = _notices_col(uid)
        if not col:
            logger.error(f"Failed to get notices collection for user {uid}")
            return []
            
        docs = col.stream()
        out = []
        for d in docs:
            data = d.to_dict()
            if data:
                data['id'] = d.id
                # Convert Firestore timestamps to ISO strings
                if 'created_at' in data and hasattr(data.get('created_at'), 'isoformat'):
                    data['created_at'] = data['created_at'].isoformat()
                if 'updated_at' in data and hasattr(data.get('updated_at'), 'isoformat'):
                    data['updated_at'] = data['updated_at'].isoformat()
                
                # Convert snake_case keys to camelCase
                converted_data = _convert_keys_to_camel_case(data)
                out.append(converted_data)
        logger.info(f"Retrieved {len(out)} notices for user {uid}")
        return out
    except Exception as e:
        logger.error(f"Error getting notices for user {uid}: {e}")
        return []

def create_notice_for_user(uid: str, notice_data: Dict[str, Any]) -> LegalNotice:
    """Create a new notice for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to create notice for user {uid}")
            
        col = _notices_col(uid)
        if not col:
            logger.error(f"Failed to get notices collection for user {uid}")
            raise Exception(f"Failed to create notice for user {uid}")
            
        doc_ref = col.document()
        now = datetime.utcnow()
        notice_data = dict(notice_data)
        notice_data.setdefault('created_at', now)
        notice_data.setdefault('updated_at', now)
        
        doc_ref.set(notice_data)
        logger.info(f"Created notice {doc_ref.id} for user {uid}")
        
        saved = doc_ref.get().to_dict()
        if saved:
            saved['id'] = doc_ref.id
            # Convert timestamps
            for time_field in ['created_at', 'updated_at']:
                if time_field in saved and hasattr(saved[time_field], 'isoformat'):
                    saved[time_field] = saved[time_field].isoformat()
            
            # Convert snake_case keys to camelCase
            saved = _convert_keys_to_camel_case(saved)
            
            try:
                return LegalNotice(**saved)
            except Exception as e:
                logger.error(f"Error creating LegalNotice from saved data: {e}")
                raise Exception(f"Failed to create notice for user {uid}: {e}")
        raise Exception(f"Failed to retrieve saved notice for user {uid}")
    except Exception as e:
        logger.error(f"Error creating notice for user {uid}: {e}")
        raise Exception(f"Failed to create notice for user {uid}: {e}")