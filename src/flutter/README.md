# Flutter Firebase Starter

This folder contains a Flutter starter app for Firebase Authentication, Firestore, and Realtime Database.

## Setup

1. Install the Flutter SDK and add it to your PATH.
2. Open a terminal in `flutter_app`.
3. Run:

```bash
flutter pub get
```

4. Replace the placeholder values in `lib/firebase_options.dart` with your Firebase app config values.
5. Enable Firebase services in the Firebase Console:
   - Authentication providers: Email/Password, Google, Phone
   - Cloud Firestore
   - Realtime Database

## Run

```bash
flutter run
```

## Notes

- `lib/main.dart` includes email/password auth, Google sign-in, phone auth, Firestore profile save/read, and Realtime Database save/read/delete.
- Update `firebase_options.dart` with your own Firebase project credentials.
