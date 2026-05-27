# Firestore Security Best Practices (Task 92)

- Use least privilege rules: allow reads/writes only where necessary.
- Validate incoming data types and ranges in rules.
- Use `request.auth.uid` and `request.resource.data` to restrict access.

Example rule snippet:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

Recommendations:
- Run the Firebase Emulator Suite for testing rules.
- Use App Check to prevent unauthorized requests.
- Log and monitor security rule rejections.
