# PadosiPro Full-Stack Developer Take-Home Assignment

A high-fidelity native mobile app and backend REST API for **PadosiPro** ([app.padosipro.com](https://app.padosipro.com)), implementing the complete first-user onboarding and task selection journey.

---

## 📱 Features & Highlights
* **Native Mobile App (React Native / Expo)**:
  * **Pixel-Perfect UI**: Faithful replication of `app.padosipro.com` layout, color palette (`#175440` forest green, `#EBF7F0` mint, `#D97706` amber accents), typography, and cards.
  * **Welcome & Registration**: Mobile (+91) & email entry with amber-focus states and live validation.
  * **Secure OTP Verification**: 6-digit input, 30s resend countdown timer, inline attempt/error feedback.
  * **First-Login Profile Setup ("A few details")**: Collects Name, Mobile, Address, Society, Flat unit, Notes, and optional Business Name.
  * **Interactive Task Selection**: Dynamic category accordions expanding into "WHAT KIND OF HELP?" sub-task pill buttons with multi-select and sticky bottom confirmation.
  * **Home Screen & Account**: Shows personalized greeting, selected tasks summary, Lifestyle Manager card, and red-outline `"Sign out"` button with session clearance.
  * **Session Persistence**: User stays logged in upon app restarts via persistent storage.
  * **Network States**: Complete loading, error, and empty states on every screen.

* **Backend REST API (Node.js + TypeScript + Express + Prisma SQLite)**:
  * **Hashed OTP Storage**: Codes are hashed with SHA-256 before storing in the database (raw codes are never stored).
  * **Rate Limiting & Safety**: Max 5 wrong attempts before invalidating OTP, 10-minute expiry, and strict 30-second resend cooldown.
  * **Unverified User Guard**: Unverified users cannot log in (HTTP 403 `EMAIL_NOT_VERIFIED`).
  * **Password Storage**: Passwords hashed with `bcryptjs`.
  * **Pre-seeded Catalogue**: 6 lifestyle categories and 27 detailed tasks.
  * **Dual Mailer**: Dispatches real emails via Gmail SMTP or local test mailers (Ethereal).

---

## 🚀 Quickstart Guide (Under 15 Minutes)

### Prerequisites
* **Node.js**: v18.x or v20.x
* **npm**: v9.x or higher
* *(Optional)*: Docker & Docker Compose

---

### Step 1: Run the Backend API

#### Option A: Local Run (Fastest)
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```
The backend API will start at: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

#### Option B: Docker Compose
```bash
cd backend
docker-compose up --build
```

---

### Step 2: Run the Automated Tests (Risky Logic)
We have written a comprehensive automated test suite verifying all risky logic:
```bash
cd backend
npm test
```
**Tests Covered**:
* OTP generation & SHA-256 hash storage verification
* Max 5 wrong attempts lockout enforcement
* 30-second resend cooldown active blocking
* 10-minute expiry rejection
* Unverified user login protection

---

### Step 3: Run the Mobile App

```bash
cd mobile
npm install
npm start
```
* Press **`a`** to open in Android Emulator (or run on your physical phone via Expo Go by scanning the QR code).
* *Note on Android Emulator*: The app automatically uses `http://10.0.2.2:5000` to communicate with the local backend.

---

## 📦 Building Standalone Android APK

An `eas.json` is pre-configured with a preview APK profile:
```bash
cd mobile
npx eas-cli build --platform android --profile preview
```

---

## 🔑 Environment Variables

The backend ships with `.env.example`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="padosipro_super_secret_jwt_key_2026_exclusive"
JWT_EXPIRES_IN="7d"

# SMTP Configuration (Gmail or Ethereal)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=b.c.chhandogi@gmail.com
SMTP_PASS=dbubbzjsbqohxtyg
EMAIL_FROM="PadosiPro <b.c.chhandogi@gmail.com>"
```
*(If `SMTP_USER` and `SMTP_PASS` are left empty, Nodemailer will automatically fall back to an Ethereal test mailbox without crashing).*

---

## 🏛️ Project Structure
```text
padosipro_assignment/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, DB, Mailer settings
│   │   ├── controllers/        # Auth, Profile, Task controllers
│   │   ├── middlewares/        # Auth guard, Error handler
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # OTP, Mailer, Auth, Task services
│   │   ├── utils/              # Hash helpers (bcrypt, SHA-256)
│   │   └── server.ts           # App entry point
│   ├── tests/                  # Jest test suite (auth_otp.test.ts)
│   ├── prisma/                 # Schema & Seed data
│   ├── Dockerfile
│   └── docker-compose.yml
├── mobile/
│   ├── src/
│   │   ├── api/                # Axios client with interceptors
│   │   ├── components/         # Button, InputField, BrandHeader
│   │   ├── context/            # AuthContext (session persistence)
│   │   ├── navigation/         # Native stack navigator
│   │   ├── screens/            # Welcome, OTP, Profile, Tasks, Home, Account
│   │   └── theme/              # Color palette and typography tokens
│   ├── app.json
│   └── eas.json
├── DESIGN.md                   # 1-page Architecture & Trade-offs
└── README.md
```
