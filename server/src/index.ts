import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";

import { configurePassport } from "./middleware/auth";
import authRoutes from "./routes/auth";
import eventsRoutes from "./routes/events";
import planningRoutes from "./routes/planning";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

configurePassport();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", eventsRoutes);
app.use("/api", planningRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
