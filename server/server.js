// server/server.js

import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import { globalErrorHandler } from "./src/utils/errorHandler.js";

// Core routes
import authRoutes from "./src/routes/auth.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import hrRoutes from "./src/routes/hrRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import teacherRoutes from "./src/routes/teacherRoutes.js";

// Feature routes
import classRoutes from "./src/routes/classRoutes.js";
import assignmentRoutes from "./src/routes/assignmentRoutes.js";
import submissionRoutes from "./src/routes/submissionRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import studyMaterialRoutes from "./src/routes/studyMaterialRoutes.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import payrollRoutes from "./src/routes/payrollRoutes.js";
import leaveRoutes from "./src/routes/leaveRoutes.js";
import departmentRoutes from "./src/routes/departmentRoutes.js";
import statsRoutes from "./src/routes/statsRoutes.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_PREFIX = "/api";

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URLENCODED_BODY_LIMIT || "1mb",
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    service: "paisa-api",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    service: "paisa-api",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/organizations`, organizationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

app.use(`${API_PREFIX}/hr`, hrRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/teachers`, teacherRoutes);

app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
app.use(`${API_PREFIX}/submissions`, submissionRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/study-materials`, studyMaterialRoutes);

app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/leaves`, leaveRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/stats`, statsRoutes);

app.get(API_PREFIX, (req, res) => {
  res.json({
    success: true,
    message: "Paisa API",
    version: process.env.API_VERSION || "3.0.0",
    environment: NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Paisa Backend Running Successfully",
    version: process.env.API_VERSION || "3.0.0",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use(globalErrorHandler);

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 PAISA API running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          const mongoose = await import("mongoose");
          await mongoose.default.connection.close(false);
          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start PAISA:", error.message);
    process.exit(1);
  }
};

start();

export default app;