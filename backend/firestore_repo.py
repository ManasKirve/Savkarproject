from firebase import init_firebase
from datetime import datetime
from typing import Dict, Any, List
import uuid
from google.cloud.firestore_v1 import Transaction
import logging
import re
from models import (
    LoanRecord, LoanCreate, LoanUpdate,
    Document, DocumentCreate,
    LegalNotice, NoticeCreate, NoticeUpdate,
    Profile, ProfileCreate, ProfileUpdate,
    Jamindar
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fixed user ID for the savkar
SAVKAR_USER_ID = "savkar_user_001"

# Helper functions for key conversion
def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def convert_jamindar_keys(data, conversion_func):
    """Convert keys in Jamindar objects"""
    if not isinstance(data, list):
        return data
        
    converted = []
    for jamindar in data:
        if isinstance(jamindar, dict):
            converted_jamindar = {}
            for key, value in jamindar.items():
                converted_key = conversion_func(key)
                # Convert id to string if it's a number
                if key == 'id' and isinstance(value, (int, float)):
                    value = str(value)
                converted_jamindar[converted_key] = value
            converted.append(converted_jamindar)
        else:
            converted.append(jamindar)
    return converted

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

def _profiles_col(uid):
    try:
        _, db = init_firebase()
        if not db:
            logger.error("Failed to initialize Firebase")
            return None
        return db.collection('users').document(uid).collection('profiles')
    except Exception as e:
        logger.error(f"Error getting profiles collection: {e}")
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
    if not data:
        return data
        
    if isinstance(data, list):
        return [_convert_keys_to_camel_case(item) for item in data]
    
    if not isinstance(data, dict):
        return data
        
    converted = {}
    for key, value in data.items():
        if '_' in key:
            parts = key.split('_')
            camel_key = parts[0] + ''.join(part.capitalize() for part in parts[1:])
        else:
            camel_key = key
            
        # Recursively convert nested objects
        if isinstance(value, dict):
            converted[camel_key] = _convert_keys_to_camel_case(value)
        elif isinstance(value, list):
            converted[camel_key] = [_convert_keys_to_camel_case(item) if isinstance(item, dict) else item for item in value]
        else:
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
                
                # Ensure loan_type is included with default value if missing
                if 'loan_type' not in data:
                    data['loan_type'] = 'Cash Loan'
                
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
        
        # Ensure loan_type is included with default value if missing
        if 'loan_type' not in loan_data:
            loan_data['loan_type'] = 'Cash Loan'
        
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
    try:
        col = _loans_col(uid)
        if not col:
            logger.error(f"Failed to get loans collection for user {uid}")
            raise Exception(f"Failed to update loan for user {uid}")
            
        doc_ref = col.document(loan_id)
        
        # Get existing loan to preserve loan_type if not being updated
        existing_loan = doc_ref.get().to_dict()
        if existing_loan and 'loan_type' not in update_data:
            update_data['loan_type'] = existing_loan.get('loan_type', 'Cash Loan')
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Ensure payment_records is properly handled
        if 'payment_records' in update_data:
            logger.info(f"Updating payment records for loan {loan_id}: {update_data['payment_records']}")
        
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

def get_profile_for_loan(uid: str, loan_id: str) -> Dict[str, Any]:
    """Get profile for a specific loan"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            return None
            
        col = _profiles_col(uid)
        if not col:
            logger.error(f"Failed to get profiles collection for user {uid}")
            return None
            
        # Convert loan_id to string for consistent querying
        loan_id_str = str(loan_id)
        logger.info(f"Querying for profile with loan_id: {loan_id_str}")
        
        q = col.where('loan_id', '==', loan_id_str).stream()
        profiles = []
        for d in q:
            data = d.to_dict()
            if data:
                logger.info(f"Found profile document: {data}")
                data['id'] = d.id
                if 'created_at' in data and hasattr(data.get('created_at'), 'isoformat'):
                    data['created_at'] = data['created_at'].isoformat()
                if 'updated_at' in data and hasattr(data.get('updated_at'), 'isoformat'):
                    data['updated_at'] = data['updated_at'].isoformat()
                
                # Convert snake_case keys to camelCase
                converted_data = _convert_keys_to_camel_case(data)
                
                # Explicitly convert jamindars if they exist
                if 'jamindars' in converted_data and isinstance(converted_data['jamindars'], list):
                    converted_jamindars = []
                    for jamindar in converted_data['jamindars']:
                        if isinstance(jamindar, dict):
                            # Convert each jamindar's keys
                            converted_jamindars.append(_convert_keys_to_camel_case(jamindar))
                        else:
                            converted_jamindars.append(jamindar)
                    converted_data['jamindars'] = converted_jamindars
                
                profiles.append(converted_data)
        
        logger.info(f"Retrieved {len(profiles)} profiles for loan {loan_id}")
        if profiles:
            return profiles[0]  # Return the first (and should be only) profile
        return None
    except Exception as e:
        logger.error(f"Error getting profile for loan {loan_id} of user {uid}: {e}")
        return None
def create_profile_for_user(uid: str, profile_data: Dict[str, Any]) -> Profile:
    """Create a new profile for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to create profile for user {uid}")
            
        col = _profiles_col(uid)
        if not col:
            logger.error(f"Failed to get profiles collection for user {uid}")
            raise Exception(f"Failed to create profile for user {uid}")
            
        # Ensure loan_id is stored as a string
        if 'loan_id' in profile_data:
            profile_data['loan_id'] = str(profile_data['loan_id'])
        
        # Convert Jamindar fields from camelCase to snake_case before saving
        if 'jamindars' in profile_data:
            profile_data['jamindars'] = convert_jamindar_keys(
                profile_data['jamindars'], 
                camel_to_snake
            )
        
        doc_ref = col.document()
        now = datetime.utcnow()
        profile_data = dict(profile_data)
        profile_data.setdefault('created_at', now)
        profile_data.setdefault('updated_at', now)
        
        logger.info(f"Creating profile with data: {profile_data}")
        doc_ref.set(profile_data)
        logger.info(f"Created profile {doc_ref.id} for user {uid}")
        
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
                return Profile(**saved)
            except Exception as e:
                logger.error(f"Error creating Profile from saved data: {e}")
                raise Exception(f"Failed to create profile for user {uid}: {e}")
        raise Exception(f"Failed to retrieve saved profile for user {uid}")
    except Exception as e:
        logger.error(f"Error creating profile for user {uid}: {e}")
        raise Exception(f"Failed to create profile for user {uid}: {e}")


def update_notice_for_user(uid: str, notice_id: str, update_data: Dict[str, Any]) -> LegalNotice:
    """Update an existing notice for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to update notice for user {uid}")
            
        col = _notices_col(uid)
        if not col:
            logger.error(f"Failed to get notices collection for user {uid}")
            raise Exception(f"Failed to update notice for user {uid}")
            
        doc_ref = col.document(notice_id)
        update_data['updated_at'] = datetime.utcnow()
        doc_ref.update(update_data)
        logger.info(f"Updated notice {notice_id} for user {uid}")
        
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
                return LegalNotice(**updated)
            except Exception as e:
                logger.error(f"Error creating LegalNotice from updated data: {e}")
                raise Exception(f"Failed to update notice for user {uid}: {e}")
        raise Exception(f"Failed to retrieve updated notice for user {uid}")
    except Exception as e:
        logger.error(f"Error updating notice {notice_id} for user {uid}: {e}")
        raise Exception(f"Failed to update notice for user {uid}: {e}")

def delete_notice_for_user(uid: str, notice_id: str):
    """Delete a notice for a user"""
    try:
        # First ensure the user exists
        if not ensure_user_exists(uid):
            logger.error(f"Failed to ensure user {uid} exists")
            raise Exception(f"Failed to delete notice for user {uid}")
            
        col = _notices_col(uid)
        if not col:
            logger.error(f"Failed to get notices collection for user {uid}")
            raise Exception(f"Failed to delete notice for user {uid}")
            
        doc_ref = col.document(notice_id)
        doc_ref.delete()
        logger.info(f"Deleted notice {notice_id} for user {uid}")
    except Exception as e:
        logger.error(f"Error deleting notice {notice_id} for user {uid}: {e}")
        raise Exception(f"Failed to delete notice for user {uid}: {e}")
def update_profile_for_user(uid: str, profile_id: str, update_data: Dict[str, Any]) -> Profile:
    """Update an existing profile for a user"""
    try:
        logger.info(f"update_profile_for_user called with profile_id: {profile_id}, update_data: {update_data}")
        col = _profiles_col(uid)
        if not col:
            logger.error(f"Failed to get profiles collection for user {uid}")
            raise Exception(f"Failed to update profile for user {uid}")
            
        # Convert Jamindar fields from camelCase to snake_case before updating
        if 'jamindars' in update_data and update_data['jamindars']:
            logger.info("Converting jamindars in update_data")
            update_data['jamindars'] = convert_jamindar_keys(
                update_data['jamindars'], 
                camel_to_snake
            )
            
        doc_ref = col.document(profile_id)
        update_data['updated_at'] = datetime.utcnow()
        logger.info(f"Final update_data to be saved: {update_data}")
        doc_ref.update(update_data)
        logger.info(f"Updated profile {profile_id} for user {uid}")
        
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
                return Profile(**updated)
            except Exception as e:
                logger.error(f"Error creating Profile from updated data: {e}")
                raise Exception(f"Failed to update profile for user {uid}: {e}")
        raise Exception(f"Failed to retrieve updated profile for user {uid}")
    except Exception as e:
        logger.error(f"Error updating profile {profile_id} for user {uid}: {e}")
        raise Exception(f"Failed to update profile for user {uid}: {e}")

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