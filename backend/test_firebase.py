import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from firebase import init_firebase

def test_firebase():
    try:
        print("Testing Firebase initialization...")
        app, db = init_firebase()
        if app:
            print("✅ Firebase initialized successfully!")
            print(f"App name: {app.name}")
            print(f"Project ID: {app.project_id}")
            
            # Test Firestore connection
            test_doc = db.collection('test').document('test-doc')
            test_doc.set({'test': 'data'})
            result = test_doc.get().to_dict()
            print(f"✅ Firestore connection successful! Test data: {result}")
            
            # Clean up
            test_doc.delete()
            print("✅ Test document deleted")
        else:
            print("❌ Firebase initialization failed!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_firebase()