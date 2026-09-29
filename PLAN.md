# Implementation Plan: PadosiPro Full-Stack Developer Take-Home Assignment

## 1. Project Overview & Objectives
Build a high-fidelity native mobile application (Android APK via React Native / Expo) and an accompanying robust backend REST API (Node.js + TypeScript + Express/Prisma with SQLite) replicating the exact first-user onboarding and task selection flow of **PadosiPro** ([app.padosipro.com](https://app.padosipro.com)).

### Core Evaluation Criteria Addressed:
1. **Working Product (30%)**: Flawless end-to-end user flow on device/emulator without dead ends.
2. **Backend & Security (25%)**: Hashed OTP storage, bcrypt password hashing, 5-attempt limit, 10-minute expiry, 30s resend cooldown, JWT auth.
3. **UI/UX Fidelity (20%)**: Native mobile recreation matching exact design tokens, typography, colors, and layout from production screenshots.
4. **Code Quality & Tests (15%)**: Clean modular architecture with automated test suite for critical auth/OTP logic.
5. **Documentation & Simplicity (10%)**: Self-contained `README.md` allowing reviewers to run backend and app in under 15 minutes, plus 1-page `DESIGN.md`.

---

## 2. Target Project Structure
Location: `d:/Programming/TEMP/padosipro_assignment/`

```text
padosipro_assignment/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, DB, Mailer configs
│   │   ├── controllers/        # Auth, Profile, Task controllers
│   │   ├── middlewares/        # Auth guard, Rate limiting, Validation middleware
│   │   ├── models/ or prisma/  # Prisma schema and SQLite database
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # OTP service, Mailer service, Auth service, Task service
│   │   ├── utils/              # Hash helpers (bcrypt, sha256), AppError
│   │   └── server.ts           # App entry point
│   ├── tests/                  # Jest test suite (OTP rules, limits, auth guards)
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── seed.ts             # Seeds 6 categories & 24+ tasks
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── assets/                 # Logo, icons, fonts
│   ├── src/
│   │   ├── api/                # Axios client with interceptors & auth token handling
│   │   ├── components/         # Button, InputField, CategoryCard, TaskPill, Header
│   │   ├── context/            # AuthContext (token storage, login/logout state)
│   │   ├── navigation/         # React Navigation / Expo Router setup
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.tsx           # Mobile & Email input
│   │   │   ├── OtpVerificationScreen.tsx   # 6-digit input, countdown, resend
│   │   │   ├── ProfileSetupScreen.tsx      # "A few details" form
│   │   │   ├── TaskSelectionScreen.tsx     # Categories accordion & task multi-select
│   │   │   ├── HomeScreen.tsx              # Greeting, selected tasks, Lifestyle Manager card
│   │   │   └── AccountScreen.tsx           # Profile info, Household, Sign out
│   │   ├── theme/              # Color palette, spacing, typography tokens
│   │   └── types/              # TypeScript interfaces
│   ├── app.json                # Expo config & build settings
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Screenshots, architecture diagrams
├── DESIGN.md                   # 1-page Architecture, Trade-offs & Next Steps
├── README.md                   # Complete 15-minute quickstart guide
└── PLAN.md                     # This blueprint
```

---

## 3. Detailed Component Architecture

### A. Backend Architecture & Database Design

#### 1. Tech Stack
* **Runtime**: Node.js with TypeScript (`tsx`, `ts-node`)
* **Framework**: Express.js
* **ORM & Database**: Prisma with SQLite (`dev.db`) for zero-configuration local review + Docker Compose support
* **Security & Auth**: `bcryptjs` for password hashing, `crypto` (SHA-256) for OTP hashing, `jsonwebtoken` for access tokens
* **Validation**: `zod` for strict runtime schema validation
* **Email Transport**: `nodemailer` supporting both Gmail SMTP (via credentials) and Ethereal/Mailpit local catcher fallback
* **Testing**: `jest` + `supertest` for unit & integration testing

#### 2. Database Schema (Prisma)
* **`User`**:
  * `id` (UUID / CUID)
  * `email` (String, unique, indexed)
  * `mobile` (String, unique, indexed)
  * `passwordHash` (String, optional if passwordless OTP login is used; required if password registration)
  * `isVerified` (Boolean, default false)
  * `hasCompletedProfile` (Boolean, default false)
  * `createdAt`, `updatedAt`
* **`Otp`**:
  * `id` (UUID)
  * `userId` (String, relation to User)
  * `email` (String)
  * `codeHash` (String - SHA-256 hash of 6-digit OTP, never plaintext)
  * `attempts` (Int, default 0 - increments on wrong attempt, max 5)
  * `expiresAt` (DateTime - 10 minutes from creation)
  * `resendCooldownUntil` (DateTime - 30 seconds from creation)
  * `isUsed` (Boolean, default false)
  * `createdAt`
* **`Profile`**:
  * `id` (UUID)
  * `userId` (String, unique, relation to User)
  * `fullName` (String)
  * `phone` (String, +91 format, 10 digits)
  * `addressArea` (String, "Road, area, landmark")
  * `society` (String, optional, "Name as on gate")
  * `flatUnit` (String, optional, "e.g. Tower B, 1204")
  * `entryNotes` (String, optional, "Anything the team should know at entry")
  * `businessName` (String, optional - documented why in DESIGN.md)
  * `city` (String, default "Mumbai")
* **`Category`**:
  * `id` (String / Slug)
  * `name` (String, e.g. "Errands & Daily Tasks")
  * `description` (String, e.g. "Bills, banks, documents, government work")
  * `icon` (String icon identifier)
* **`Task`**:
  * `id` (UUID)
  * `categoryId` (String, relation to Category)
  * `name` (String, e.g. "Pickups & Deliveries")
  * `description` (String)
* **`UserTask`**:
  * `id` (UUID)
  * `userId` (String, relation to User)
  * `taskId` (String, relation to Task)
  * `createdAt`

#### 3. API Endpoints Specification
* **Authentication**:
  * `POST /api/auth/request-otp`: Accepts `{ email, mobile, password? }`. Generates 6-digit OTP, stores SHA-256 hash, sends email, enforces 30s cooldown.
  * `POST /api/auth/verify-otp`: Accepts `{ email, code }`. Verifies hash, checks expiry, tracks attempts (rejects if > 5), marks `isVerified = true`, issues JWT token.
  * `POST /api/auth/resend-otp`: Accepts `{ email }`. Verifies 30s cooldown before issuing new OTP.
  * `POST /api/auth/login`: Accepts `{ email, password }` or OTP flow. Rejects unverified accounts with HTTP 403 / `EMAIL_NOT_VERIFIED`.
* **Profile**:
  * `GET /api/profile`: Authenticated user profile lookup.
  * `POST /api/profile`: Saves Name, Phone (+91 validation), Address, Society, Flat, Notes, Business Name. Sets `hasCompletedProfile = true`.
* **Tasks**:
  * `GET /api/tasks/catalog`: Returns all 6 categories with their sub-tasks.
  * `POST /api/tasks/select`: Accepts `{ taskIds: string[] }`. Saves selected tasks for authenticated user.
  * `GET /api/tasks/my-tasks`: Returns user's currently selected tasks for the Home Screen.

---

### B. Mobile App Architecture (React Native / Expo)

#### 1. Tech Stack
* **Framework**: React Native with Expo (SDK 51+)
* **Navigation**: React Navigation (Native Stack) or Expo Router
* **Networking**: Axios with request interceptor for JWT authorization and response interceptor for session expiration
* **Storage**: `expo-secure-store` / `@react-native-async-storage/async-storage` for persisting auth tokens
* **Icons**: `@expo/vector-icons` (Ionicons / Feather matching PadosiPro UI)
* **Build System**: Expo EAS CLI for generating standalone Android `.apk`

#### 2. Screen Specifications & Flows

1. **Screen 1: Welcome / Entry (`WelcomeScreen`)**:
   * Exact visual replica of `media_1790651057819.png`.
   * Title: *"Welcome"*, Subtitle: *"Enter your mobile number and email. We'll send the OTP to your email."*
   * Inputs:
     - Mobile with `+91` prefix and phone icon.
     - Email with mail icon.
     - Focus states: amber border (`#D97706`).
   * Action button: *"Get OTP"* (Forest green `#175440`).

2. **Screen 2: OTP Verification (`OtpVerificationScreen`)**:
   * Exact visual replica of `media_1790651428701.png` & `media_1790651448378.png`.
   * Top navigation: `< Back`.
   * Title: *"Enter OTP"*, Subtitle: *"We've sent a code to <email>. It expires in 10 minutes."*
   * 6-digit spaced input with auto-focus.
   * Resend code link with active 30s countdown timer (`Resend in 28s`).
   * Action button: *"Verify"* -> transition state *"Verifying..."*.
   * Error handling: Inline error message for incorrect OTP and attempt counter warnings ("3 attempts remaining").

3. **Screen 3: First-Login Profile Setup (`ProfileSetupScreen`)**:
   * Exact visual replica of `media_1790651455936.png` & `media_1790651500758.png`.
   * City tag: `Mumbai` (muted amber badge).
   * Title: *"A few details"*, Subtitle: *"So your Lifestyle Manager can coordinate visits and deliveries smoothly."*
   * Form fields:
     - Full name (required)
     - Address & area (required)
     - Society / building (optional)
     - Flat / unit (optional)
     - Gate or entry notes (optional)
     - Business Name (optional)
   * Real-time inline validator: *"Enter your full name to continue."*
   * Action button: *"Continue"*.

4. **Screen 4: Task Selection (`TaskSelectionScreen`)**:
   * Exact visual replica of `media_1790651734539.png`, `media_1790651741177.png`, `media_1790651747512.png`.
   * Title: *"What do you need help with?"*, Subtitle: *"Pick a category, then choose a service. You can add details next."*
   * Interactive accordion categories:
     - Errands & Daily Tasks
     - Home Services
     - Travel & Tourism
     - Health & Medical
     - Senior Care
     - Events & Management
   * Tapping a category expands the mint card (`#E6F4EA`) with amber left accent and displays sub-task pill buttons ("WHAT KIND OF HELP?").
   * Multi-select toggles on sub-tasks with active styling.
   * Sticky bottom *"Continue"* button (enables once $\ge 1$ task is selected).

5. **Screen 5: Home Screen (`HomeScreen`)**:
   * Exact visual replica of `media_1790651528189.png`.
   * Dynamic greeting: *"Good morning, [User Name]"* with avatar `👤` button.
   * Search input: *"AC leaking, cook for weekends..."*.
   * Quick category chips ("POPULAR WITH FAMILIES LIKE YOURS").
   * User's Selected Tasks list.
   * Value prop cards: *"Tell us what you need"*, *"Your Lifestyle Manager takes it on"*, *"You see it done"*.
   * Bottom pinned card: *"Your Lifestyle Manager: Pilot LM"* with `💬 Chat` trigger.

6. **Screen 6: Account Screen (`AccountScreen`)**:
   * Exact visual replica of `media_1790651543532.png` & `media_1790651548688.png`.
   * `< Back` button.
   * Cards: `Signed in as (+91 ...)`, `Your LM (Pilot LM, Mumbai)`, `Household`, `Wallet (Coming soon)`.
   * Red outlined button: `🚪→ Sign out` (clears SecureStore and resets navigation to Welcome).

---

## 4. Verification & Testing Strategy
* **Automated Unit & Integration Tests (Jest)**:
  1. `otp.service.test.ts`:
     - Test: Generates 6-digit numeric OTP.
     - Test: Stores only SHA-256 hash in DB, never plaintext.
     - Test: Rejects verification after 10-minute expiration.
     - Test: Enforces max 5 wrong attempts before locking OTP.
     - Test: Rejects resend request before 30-second cooldown expires.
     - Test: Invalidates previous OTP upon resending a new one.
  2. `auth.guard.test.ts`:
     - Test: Blocks unverified users from logging in or accessing protected routes.
     - Test: Validates JWT signature and expiration.
* **Manual Mobile Validation**:
  - Test on Android emulator and physical Android device.
  - Verify app restart preserves authentication state.
  - Verify network failure states (airplane mode) render clean retry banners.

---

## 5. Deliverables & Documentation Plan
1. **GitHub / ZIP Archive**: Clean repository with no `.env` secrets or `node_modules`.
2. **Pre-Built Android APK**: Standalone APK generated via Expo EAS or local build.
3. **`README.md`**:
   - Prerequisites (Node.js 18+, Docker if applicable).
   - 1-command startup instructions (`docker compose up` or `npm run dev`).
   - Mobile app launch instructions (`npx expo start` or installing the pre-built APK).
   - Environment variables guide with `.env.example`.
4. **`DESIGN.md`**:
   - Architectural decisions (Separation of Concerns, Service/Repository pattern).
   - Security considerations (OTP hashing, attempt limits, timing attacks).
   - Trade-offs made (SQLite for rapid local evaluation vs distributed Redis/PostgreSQL).
   - Next steps with an extra week (WebSocket live chat with LM, push notifications, payment gateway).

---

## 6. Execution Phases (When Approved)
* **Phase 1**: Initialize backend project in `d:/Programming/TEMP/padosipro_assignment/backend`, configure TypeScript, Prisma schema, seed data, and email transport.
* **Phase 2**: Implement core services (OTP security, auth, profile, task selection) and write comprehensive Jest test suite.
* **Phase 3**: Initialize React Native Expo app in `d:/Programming/TEMP/padosipro_assignment/mobile`, establish design system tokens, build all 6 screens with exact UI fidelity.
* **Phase 4**: Connect mobile app to backend, test full end-to-end flow, verify loading/empty/error states.
* **Phase 5**: Build standalone Android APK file, write `DESIGN.md` and `README.md`.
