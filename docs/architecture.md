# Architecture Overview (Tasks 80, 86, 97)

This document summarizes the recommended scalable backend architecture for the project.

- Frontend: React + Vite (src/)
- Mobile: Flutter app in `src/flutter/`
- Backend: Firebase Functions (functions/) using Express
- Database: Firestore (document model)
- Realtime: Firebase Realtime Database for live features
- Storage: Firebase Storage for files
- Authentication: Firebase Auth with social providers

Scalability notes:
- Use Cloud Functions for stateless processing and background jobs
- Use Firestore composite indexes for query performance
- Move heavy analytics to BigQuery using scheduled exports
- Use Cloud Tasks for long-running operations

Diagram (Mermaid):

```mermaid
flowchart LR
  A[User Browser] -->|HTTPS| B(Cloud CDN)
  B --> C[React App (Vite)]
  C --> D[Firestore]
  C --> E[Functions API]
  E --> F[Cloud Functions]
  F --> G[Cloud Storage]
  F --> H[Third-party APIs]
```
