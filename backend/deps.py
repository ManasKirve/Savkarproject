# deps.py
from fastapi import Request, HTTPException

def verify_firebase_token(request: Request):
    # This function is now a no-op and can be removed if no longer needed.
    # It's kept to avoid breaking endpoint dependency definitions.
    return {}