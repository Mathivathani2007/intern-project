"""
Task 51: Integrate Firebase with Python
Python utilities for Firebase integration
"""

firebase_python_template = """
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from datetime import datetime
import json

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-project.appspot.com'
})

db = firestore.client()
bucket = storage.bucket()

class FirebaseHelper:
    '''
    Utility class for Firebase operations in Python
    '''
    
    @staticmethod
    def create_user(email, password):
        '''Create new Firebase user'''
        try:
            user = auth.create_user(
                email=email,
                password=password
            )
            return {'success': True, 'uid': user.uid}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def add_document(collection, data):
        '''Add document to Firestore'''
        try:
            doc_ref = db.collection(collection).add(data)
            return {'success': True, 'doc_id': doc_ref[1].id}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_documents(collection, query_filters=None):
        '''Get documents from Firestore'''
        try:
            query = db.collection(collection)
            
            if query_filters:
                for field, operator, value in query_filters:
                    query = query.where(field, operator, value)
            
            docs = query.stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f'Error: {e}')
            return []
    
    @staticmethod
    def update_document(collection, doc_id, data):
        '''Update Firestore document'''
        try:
            db.collection(collection).document(doc_id).update(data)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_document(collection, doc_id):
        '''Delete Firestore document'''
        try:
            db.collection(collection).document(doc_id).delete()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def upload_file(local_path, storage_path):
        '''Upload file to Storage'''
        try:
            blob = bucket.blob(storage_path)
            blob.upload_from_filename(local_path)
            return {'success': True, 'path': storage_path}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def download_file(storage_path, local_path):
        '''Download file from Storage'''
        try:
            blob = bucket.blob(storage_path)
            blob.download_to_filename(local_path)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def batch_write(operations):
        '''Batch write operations'''
        try:
            batch = db.batch()
            for op in operations:
                if op['type'] == 'set':
                    batch.set(op['ref'], op['data'])
                elif op['type'] == 'update':
                    batch.update(op['ref'], op['data'])
                elif op['type'] == 'delete':
                    batch.delete(op['ref'])
            batch.commit()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Example usage
if __name__ == '__main__':
    # Create user
    result = FirebaseHelper.create_user('user@example.com', 'password123')
    print(result)
    
    # Add document
    data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'created_at': datetime.now()
    }
    result = FirebaseHelper.add_document('users', data)
    print(result)
    
    # Get documents
    docs = FirebaseHelper.get_documents('users')
    print(docs)
"""

print(firebase_python_template)
