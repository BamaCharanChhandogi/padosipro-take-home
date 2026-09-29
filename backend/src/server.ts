import express from "express";
import cors from "cors";
import { config } from "./config";
import { apiRouter } from "./routes/api.routes";
import { errorHandler } from "./middlewares";

export const app = express();

app.use(cors());
app.use(express.json());

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
