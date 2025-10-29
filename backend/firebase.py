import os
import json
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    # firebase-admin not installed; initialization will fail at runtime if used
    firebase_admin = None
    credentials = None
    firestore = None

_firebase_app = None
_db = None

def init_firebase():
    """Initialize firebase-admin and Firestore client. Uses
    GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON env vars.
    Returns (app, db).
    """
    global _firebase_app, _db
    
    # Return existing app if already initialized
    if _firebase_app and _db:
        return _firebase_app, _db

    if firebase_admin is None:
        raise RuntimeError("firebase-admin package is not installed. Please install firebase-admin.")

    # Check if any Firebase app is already initialized
    if len(firebase_admin._apps) > 0:
        # Try to get the default app (if exists)
        try:
            _firebase_app = firebase_admin.get_app()  # Gets the default app
            _db = firestore.client(app=_firebase_app)  # Explicitly pass the app
            return _firebase_app, _db
        except ValueError:
            # No default app exists, continue with initialization
            pass

    # Try to get credentials from environment variable first
    cred = None
    
    # Try to get from file first
    service_account_path = os.path.join(os.path.dirname(__file__), 'service-account.json')
    print(f"Looking for service account file at: {service_account_path}")
    print(f"File exists: {os.path.exists(service_account_path)}")
    
    if os.path.exists(service_account_path):
        print("Using service account file for authentication")
        cred = credentials.Certificate(service_account_path)
    else:
        # Try to get from environment variable
        sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if sa_path and os.path.exists(sa_path):
            print(f"Using service account from environment variable: {sa_path}")
            cred = credentials.Certificate(sa_path)
        else:
            # Try to get from JSON environment variable
            sa_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if sa_json_str:
                try:
                    sa_json = json.loads(sa_json_str)
                    cred = credentials.Certificate(sa_json)
                    print("Using service account from FIREBASE_SERVICE_ACCOUNT_JSON environment variable")
                except json.JSONDecodeError:
                    raise ValueError("Failed to decode FIREBASE_SERVICE_ACCOUNT_JSON. Please check the format.")
            else:
                # Fallback to Application Default Credentials
                print("Using Application Default Credentials")
                cred = credentials.ApplicationDefault()

    options = {
        "projectId": "savkardatabase",
        "databaseURL": "https://savkardatabase-default-rtdb.firebaseio.com",
        "storageBucket": "savkardatabase.firebasestorage.app",
    }
    
    # Initialize the app as the DEFAULT app (without a name)
    print("Initializing Firebase app...")
    _firebase_app = firebase_admin.initialize_app(cred, options)  # No name parameter
    _db = firestore.client(app=_firebase_app)  # Explicitly pass the app
    print("Firebase app initialized successfully")
    return _firebase_app, _db