# DESIGN.md: Architecture, Decisions & Trade-Offs

## 1. System Architecture Overview

The system is built as a clean, decoupled architecture:
* **Backend**: Express + TypeScript + Prisma ORM + SQLite (Dockerizable).
  * Follows a strict **Controller-Service-Repository** pattern. Controllers validate payloads using **Zod**, services execute business and security logic, and Prisma manages transactional data persistence.
* **Mobile App**: React Native with Expo SDK 57, React Navigation, and AsyncStorage.
  * Native component architecture faithfully styled using design tokens extracted directly from production screenshots of `app.padosipro.com`.
  * Centralized `AuthContext` ensures immediate session recovery and handles automatic routing between Unauthenticated, First-Login Profile Setup, and Authenticated states.

---

## 2. Key Security & Engineering Decisions

### 1. OTP Storage Security (Hashing vs. Plaintext)
* **Design Choice**: Raw 6-digit OTP codes are **never stored in the database**. Instead, the server generates a cryptographically random code, sends it over SMTP, and stores an irreversible **SHA-256 hash** (`crypto.createHash('sha256')`).
* **Why**: Even if the database is dumped or intercepted, an attacker cannot retrieve active verification codes.
* **Rate-Limiting & Expiry**:
  * An OTP is strictly single-use.
  * An attempt counter tracks wrong guesses. If an attacker exceeds **5 attempts**, the record is locked and invalidated (`isUsed = true`), mitigating brute-force attacks on the 6-digit space ($10^6$ combinations).
  * A 30-second cooldown prevents spamming the email service.

### 2. Password & Auth Flow
* Passwords are encrypted using `bcryptjs` with salt factor 10.
* Unverified users are rejected at login with HTTP 403 `EMAIL_NOT_VERIFIED`, satisfying the brief's requirement to redirect them to verification.
* Sessions use standard JWTs with expiration, signed with an environment secret.

### 3. Business Name: Optional Rationale
* In the profile schema, `businessName` was made **optional**.
* **Why**: PadosiPro caters primarily to households and families seeking lifestyle management (cleaning, groceries, doctor visits, senior care). Forcing individual homeowners to enter a business name creates cognitive friction and drops onboarding conversion. However, for freelance professionals or home entrepreneurs who expense household services through their entity, having the field available provides flexibility.

---

## 3. Trade-Offs Made

1. **SQLite over PostgreSQL**:
   * *Trade-off*: Used SQLite (`dev.db`) via Prisma rather than hosting an external Postgres instance.
   * *Rationale*: Reviewers need to run and evaluate the assignment locally in **under 15 minutes** with zero external database setup or cloud credentials. Prisma allows switching the datasource to PostgreSQL in production with a 1-line configuration change.
2. **Nodemailer Fallback (Gmail + Ethereal)**:
   * *Trade-off*: Configured real Gmail SMTP by default, but built an automatic fallback to Ethereal test accounts if credentials are omitted.
   * *Rationale*: Prevents crashes during evaluation if reviewer runs tests offline or with custom environment files.

---

## 4. What Was Left Out & Next Steps with Another Week

Given more time, here are the high-impact enhancements prioritized for production:

1. **Real-Time WebSocket / SSE Chat**:
   * Implement Socket.io or WebSockets between the customer and their assigned Lifestyle Manager (LM) for real-time messaging, task updates, and media proofs.
2. **Redis-Backed Distributed Rate Limiter & Token Blacklisting**:
   * Move OTP rate limiting and session invalidation to Redis for high-concurrency distributed deployments.
3. **Wallet & Payment Gateway Integration**:
   * Integrate Razorpay or Stripe UPI payment flows to enable wallet balance top-ups (currently marked "Coming soon" on the Account screen).
4. **Push Notifications (Expo Notifications / FCM)**:
   * Alert users when a Lifestyle Manager accepts an errand, completes a milestone, or uploads a proof photo.
