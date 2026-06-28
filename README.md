# Doctor-Patient Healthcare Dashboard

A full-stack, real-time healthcare management platform built with **React**, **TypeScript**, **Firebase**, and **Vite**. Designed to streamline clinical workflows for both patients and doctors, with features ranging from telemedicine to AI-assisted symptom checking.

---

## Features

| Module | Description |
|---|---|
| **Patient Onboarding** | Guided registration flow with medical history intake |
| **Appointment Booking** | Real-time scheduling with doctor availability |
| **Telemedicine Room** | Video consultation interface for remote care |
| **Symptom Checker** | AI-assisted symptom triage and recommendations |
| **Vital Signs Tracking** | Dashboard for logging and visualizing patient vitals |
| **Medical Records** | Secure storage and retrieval of patient health records |
| **Prescription Tracker** | Manage and monitor active prescriptions and refills |
| **Secure Messaging** | HIPAA-friendly encrypted doctor-patient messaging |
| **Billing & Insurance** | Claims management and insurance verification |
| **Doctor Portal** | Provider-side dashboard for managing patients and notes |
| **Live Emergency Monitor** | Real-time alerts and emergency status monitoring |
| **Communications Hub** | Centralized notifications and care team coordination |
| **Emergency SOS** | One-tap emergency escalation with location context |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend/DB:** Firebase Firestore, Firebase Auth
- **Integrations:** Google Workspace, PDF generation
- **Real-time:** Firestore live listeners for live data sync

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (free tier works)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/infoallin1eventsllc-sys/doctor-patient-healthcare-dashboard.git
   cd doctor-patient-healthcare-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in your Firebase credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── components/          # All feature UI components
│   ├── AppointmentBooking.tsx
│   ├── TelemedicineRoom.tsx
│   ├── SymptomChecker.tsx
│   ├── VitalSignsTracking.tsx
│   ├── MedicalRecords.tsx
│   ├── PrescriptionTracker.tsx
│   ├── SecureMessaging.tsx
│   ├── BillingInsurance.tsx
│   ├── DoctorPortal.tsx
│   ├── LiveEmergencyMonitor.tsx
│   ├── CommunicationsHub.tsx
│   ├── EmergencySOS.tsx
│   ├── PatientOnboarding.tsx
│   └── Header.tsx
├── utils/               # Firebase, PDF, Google Workspace helpers
├── data.ts              # Seed/mock data
├── types.ts             # Shared TypeScript types
└── App.tsx              # Root component and routing
```

---

## Code Quality

- **TypeScript strict mode** enabled (`strict`, `noImplicitAny`, `strictNullChecks`)
- No `any` types — all Firebase errors typed as `FirestoreError | unknown`
- Firestore document paths are dynamic per authenticated user ID — no hardcoded patient references
- Circular imports resolved — all imports declared at module top
- No `console.log` / `console.warn` / `console.error` in production paths
- Silent offline fallback for Firestore using Firebase SDK error codes (`unavailable`, `failed-precondition`) — no fragile string matching
- Duplicate Firebase app initialization prevented via `getApps()` guard

## Security

- Firestore security rules enforce role-based access (patient vs. doctor)
- Auth-gated routes throughout the app
- No PHI stored client-side beyond active session
- Firebase config isolated to a JSON file outside of source — not embedded in code

---

## License

MIT
