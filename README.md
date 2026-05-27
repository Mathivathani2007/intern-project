# Firebase React App

This project is a React + Vite application with Firebase integration for authentication, Firestore, and Realtime Database.

## What is implemented

- ✅ Configure Firebase SDK (`src/firebase.js`)
- ✅ Integrate Firebase with React (`src/App.jsx`)
- ✅ Set up Firebase Authentication
- ✅ Email/password login and signup
- ✅ Google sign-in authentication
- ✅ Phone authentication with Firebase Auth
- ✅ Firestore database usage and CRUD operations
- ✅ Store user profile data in Firestore
- ✅ Realtime Database usage and CRUD-style support

## Firebase task completion status (tasks 15–40)

- ✅ Task 15: Implement Firebase Storage — `src/firebase.js` + `Gallery.jsx`
- ✅ Task 16: Upload images to Firebase Storage — `Gallery.jsx`
- ✅ Task 17: Upload videos to Firebase Storage — `Gallery.jsx`
- ✅ Task 18: Create image gallery app — `Gallery.jsx`
- ✅ Task 19: Implement secure Firebase rules — `firestore.rules`, `storage.rules`
- ✅ Task 20: Configure Firestore security rules — `firestore.rules`
- ✅ Task 21: Set up Firebase Hosting — `firebase.json`
- ⚠️ Task 22: Deploy static website on Firebase — hosting config exists, deployment not executed in repo
- ⚠️ Task 23: Deploy React app on Firebase — hosting config exists, deployment not executed in repo
- ✅ Task 24: Implement Firebase Cloud Messaging — `src/firebase.js`, `src/Chat.jsx`, `public/firebase-messaging-sw.js`
- ✅ Task 25: Create push notifications — foreground message handling and FCM setup present
- ✅ Task 26: Build chat application — `src/Chat.jsx`
- ✅ Task 27: Create real-time messaging system — Firestore real-time chat in `src/Chat.jsx`
- ✅ Task 28: Develop attendance management app — `src/Attendance.jsx`
- ✅ Task 29: Build student record app — `src/StudentRecords.jsx`
- ✅ Task 30: Create eCommerce backend using Firebase — `src/BusinessSuite.jsx`
- ✅ Task 31: Develop inventory management app — `src/BusinessSuite.jsx`
- ✅ Task 32: Create social media app backend — `src/BusinessSuite.jsx`
- ✅ Task 33: Build healthcare management system — `src/BusinessSuite.jsx`
- ✅ Task 34: Develop LMS platform using Firebase — `src/BusinessSuite.jsx`
- ✅ Task 35: Create CRM application — `src/BusinessSuite.jsx`
- ✅ Task 36: Implement role-based access control — `src/App.jsx`, `src/BusinessSuite.jsx`, `firestore.rules`
- ✅ Task 37: Store analytics data — `src/firebase.js`, `src/BusinessSuite.jsx`
- ✅ Task 38: Set up Firebase Analytics — `src/firebase.js`, `src/App.jsx`
- ✅ Task 39: Track user events — `src/firebase.js`, `src/BusinessSuite.jsx`
- ✅ Task 40: Monitor app performance — `src/firebase.js`, `src/BusinessSuite.jsx`
- ✅ Task 41: Use Firebase Crashlytics-style error reporting — `src/firebase.js`, `src/App.jsx`
- ✅ Task 42: Implement cloud functions — `functions/index.js`
- ✅ Task 43: Create serverless backend — `functions/index.js`
- ✅ Task 44: Build REST API with Firebase Functions — `functions/index.js`, `src/BusinessSuite.jsx`
- ✅ Task 45: Use Firebase Emulator Suite — `firebase.json`, `src/firebase.js`
- ✅ Task 46: Implement offline data sync — `src/firebase.js`

## Notes on incomplete tasks

- Firebase Hosting is configured in `firebase.json`, but `firebase deploy` has not been run from this repo.
- FCM is integrated for foreground and background message handling, but a server-side push sender is not part of this codebase.
- This repo now includes self-hosted serverless backend code in `functions/` and emulator setup in `firebase.json`.
- Actual Cloud Functions deployment, Firebase Hosting deployment, and external push notification sender setup are not executed from this workspace.

## What is not included in this repository

- ⚠️ Android integration
- ⚠️ Flutter integration

Those two items are outside the scope of this web React repository because there is no Android or Flutter source code here.

## How to run the app

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal.

## Firebase setup notes

To use this app correctly, make sure your Firebase project has these enabled in the console:

- Authentication providers: Email/Password, Google, Phone
- Cloud Firestore
- Realtime Database

## Key files

- `src/firebase.js` — Firebase configuration, analytics, emulator support, offline persistence, and exports
- `src/App.jsx` — React app with authentication flows, Firestore profile CRUD, Realtime Database demo, role-based access, and crash reporting
- `src/BusinessSuite.jsx` — eCommerce, inventory, social media, healthcare, LMS, CRM, analytics event logging, performance tracing, and REST API demo
- `functions/index.js` — Firebase Functions REST API serverless backend

## Usage

- Sign up with email and password
- Log in with email and password
- Sign in with Google
- Sign in with Phone number
- Update profile data stored in Firestore
- Read profile data from Firestore
- Delete Firestore profile data
- Save and read a Realtime Database message
- Delete the Realtime Database message
- Use offline Firestore persistence for cached reads
- Call a serverless REST API endpoint from the app
- Store crash reports in Firestore
- Add and order eCommerce products
- Manage inventory items and stock levels
- Create and like social posts
- Schedule healthcare appointments
- Publish courses and enroll in LMS content
- Manage CRM leads and status updates
- Track analytics events and log custom events
- Monitor app performance using Firebase Performance traces

## Local emulator and backend

- To run the local Cloud Functions and Firebase Emulator Suite, install the functions dependencies:

```bash
cd functions
npm install
```

- Then start emulators from the project root:

```bash
firebase emulators:start --only auth,firestore,database,functions,hosting,storage
```

## Notes

This project now covers all tasks in the Firebase web flow except Android and Flutter integration, which require separate native/mobile codebases.
