import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { TaskController } from "../controllers/task.controller";
import { requireAuth } from "../middlewares";

export const apiRouter = Router();

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PadosiPro API",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
apiRouter.post("/auth/request-otp", AuthController.requestOtp);
apiRouter.post("/auth/verify-otp", AuthController.verifyOtp);
apiRouter.post("/auth/resend-otp", AuthController.resendOtp);
apiRouter.post("/auth/login", AuthController.login);
apiRouter.get("/auth/me", requireAuth, AuthController.getMe);

// Direct email delivery test route for diagnostics
apiRouter.post("/auth/test-email", async (req, res) => {
  const { sendOtpEmail } = await import("../services/mailer.service");
  const targetEmail = req.body?.email || "b.c.chhandogi@gmail.com";
  try {
    const success = await sendOtpEmail(targetEmail, "849201");
    res.json({ success, email: targetEmail, message: "Email dispatch completed" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Administrative account reset endpoint
apiRouter.post("/auth/reset-account", async (req, res) => {
  const { emails, secret } = req.body;
  if (secret !== "padosipro_admin_reset_2026") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    const { prisma } = await import("../config");
    const targetEmails = Array.isArray(emails) ? emails : [emails];
    const normalized = targetEmails.map((e: string) => e.toLowerCase().trim());

    const userRes = await prisma.user.deleteMany({
      where: { email: { in: normalized } },
    });
    const otpRes = await prisma.otp.deleteMany({
      where: { email: { in: normalized } },
    });

    res.json({
      success: true,
      deletedUsersCount: userRes.count,
      deletedOtpsCount: otpRes.count,
      emails: normalized,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile routes
apiRouter.get("/profile", requireAuth, ProfileController.getProfile);
apiRouter.post("/profile", requireAuth, ProfileController.saveProfile);

// Task routes
apiRouter.get("/tasks/catalog", requireAuth, TaskController.getCatalog);
apiRouter.post("/tasks/select", requireAuth, TaskController.selectTasks);
apiRouter.get("/tasks/my-tasks", requireAuth, TaskController.getMyTasks);
