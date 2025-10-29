"""
Run this script after setting GOOGLE_APPLICATION_CREDENTIALS to a service account JSON
that has permissions to access Firestore for your project.

Usage (PowerShell):
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
python .\scripts\seed_user_counter.py --create-counter
python .\scripts\seed_user_counter.py --create-mapping --uid some-firebase-uid

This will create the document counters/user_counter with {'next': 2} so the first allocated
numeric_id will be 1, then 2, etc. Optionally it will create a mapping in user_mappings/{uid}
with a chosen numeric id.
"""

import argparse
import json
from firebase_admin import credentials, initialize_app
from google.cloud import firestore


def init_app():
    # firebase_admin will read GOOGLE_APPLICATION_CREDENTIALS or use default
    try:
        initialize_app()
    except Exception:
        # app may be already initialized or credentials provided differently
        pass
    return firestore.Client()


def create_counter(db):
    counter_ref = db.collection('counters').document('user_counter')
    counter_ref.set({'next': 2})
    print("Created counters/user_counter with {'next': 2}")


def create_mapping(db, uid, numeric_id=None):
    mappings_col = db.collection('user_mappings')
    doc_ref = mappings_col.document(uid)
    if numeric_id is None:
        # naive: set a high placeholder if unspecified; it's better to let the app allocate.
        numeric_id = 9999
    doc_ref.set({'numeric_id': int(numeric_id)})
    print(f"Created user_mappings/{uid} with numeric_id={numeric_id}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--create-counter', action='store_true')
    p.add_argument('--create-mapping', action='store_true')
    p.add_argument('--uid', type=str, help='Firebase uid for mapping')
    p.add_argument('--numeric-id', type=int, help='Numeric id to assign to mapping (optional)')
    args = p.parse_args()

    db = init_app()
    if args.create_counter:
        create_counter(db)
    if args.create_mapping:
        if not args.uid:
            print('You must provide --uid when using --create-mapping')
            return
        create_mapping(db, args.uid, args.numeric_id)

if __name__ == '__main__':
    main()
