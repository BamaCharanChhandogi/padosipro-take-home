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

// Profile routes
apiRouter.get("/profile", requireAuth, ProfileController.getProfile);
apiRouter.post("/profile", requireAuth, ProfileController.saveProfile);

// Task routes
apiRouter.get("/tasks/catalog", requireAuth, TaskController.getCatalog);
apiRouter.post("/tasks/select", requireAuth, TaskController.selectTasks);
apiRouter.get("/tasks/my-tasks", requireAuth, TaskController.getMyTasks);
