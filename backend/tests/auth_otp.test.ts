import request from "supertest";
import { app } from "../src/server";
import { prisma } from "../src/config";
import { hashOtp } from "../src/utils";
import { OtpService } from "../src/services/otp.service";

describe("Risky Logic Tests: Auth, OTP Security, Expiry, and Limits", () => {
  const testEmail = "test_candidate@padosipro.com";

  beforeEach(async () => {
    // Clear test records
    await prisma.otp.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  describe("1. OTP Generation & Hash Storage", () => {
    it("should generate a 6-digit code and store ONLY the SHA-256 hash in database", async () => {
      const res = await request(app)
        .post("/api/auth/request-otp")
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbOtp = await prisma.otp.findFirst({
        where: { email: testEmail },
      });

      expect(dbOtp).not.toBeNull();
      // Code hash must be a 64-character SHA-256 string, NOT the 6-digit raw code
      expect(dbOtp!.codeHash).toHaveLength(64);
      expect(dbOtp!.codeHash).not.toMatch(/^\d{6}$/);
    });
  });

  describe("2. OTP Attempt Limit (Max 5 attempts)", () => {
    it("should enforce maximum 5 attempts and lock the OTP on the 5th wrong attempt", async () => {
      // Create an OTP
      await request(app)
        .post("/api/auth/request-otp")
        .send({ email: testEmail });

      // Try 4 incorrect codes
      for (let i = 1; i <= 4; i++) {
        const wrongRes = await request(app)
          .post("/api/auth/verify-otp")
          .send({ email: testEmail, code: "000000" });

        expect(wrongRes.status).toBe(400);
        expect(wrongRes.body.error.code).toBe("INVALID_CODE");
        expect(wrongRes.body.error.message).toContain(`${5 - i} attempt`);
      }

      // 5th incorrect attempt -> MAX_ATTEMPTS_EXCEEDED (429)
      const fifthRes = await request(app)
        .post("/api/auth/verify-otp")
        .send({ email: testEmail, code: "000000" });

      expect(fifthRes.status).toBe(429);
      expect(fifthRes.body.error.code).toBe("MAX_ATTEMPTS_EXCEEDED");

      // Verify DB marks it used/invalidated
      const dbOtp = await prisma.otp.findFirst({
        where: { email: testEmail },
      });
      expect(dbOtp!.isUsed).toBe(true);
    });
  });

  describe("3. Resend Cooldown (30 seconds)", () => {
    it("should block resending OTP if cooldown period is active", async () => {
      await request(app)
        .post("/api/auth/request-otp")
        .send({ email: testEmail });

      // Immediate resend -> should be rejected with 429
      const resendRes = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: testEmail });

      expect(resendRes.status).toBe(429);
      expect(resendRes.body.error.code).toBe("COOLDOWN_ACTIVE");
    });
  });

  describe("4. OTP Expiry Enforcement (10 minutes)", () => {
    it("should reject expired OTPs", async () => {
      // Manually seed an expired OTP (11 minutes in the past)
      const pastDate = new Date(Date.now() - 11 * 60 * 1000);
      const testCode = "778899";

      await prisma.otp.create({
        data: {
          email: testEmail,
          codeHash: hashOtp(testCode),
          expiresAt: pastDate,
          resendCooldownUntil: pastDate,
          attempts: 0,
          isUsed: false,
        },
      });

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ email: testEmail, code: testCode });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("OTP_EXPIRED");
    });
  });

  describe("5. Unverified User Login Guard", () => {
    it("should reject password login if user has not verified their email", async () => {
      // Register with password
      await request(app)
        .post("/api/auth/request-otp")
        .send({ email: testEmail, password: "SecurePassword123!" });

      // Attempt to login directly without OTP verification
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "SecurePassword123!" });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    });
  });
});
