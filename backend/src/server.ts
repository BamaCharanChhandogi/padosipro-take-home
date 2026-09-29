import express from "express";
import cors from "cors";
import { config } from "./config";
import { apiRouter } from "./routes/api.routes";
import { errorHandler } from "./middlewares";

export const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoints for external uptime monitors & crons
app.get(["/", "/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "PadosiPro API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRouter);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`🚀 PadosiPro Backend API running on http://localhost:${config.port}`);
    console.log(`   Health check: http://localhost:${config.port}/api/health`);
  });
}
