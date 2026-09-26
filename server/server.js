import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
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

dotenv.config();
const app = express();

// Behind a reverse proxy (Render/Heroku/Nginx) so req.ip is the real client IP
app.set("trust proxy", 1);

// ─── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images from API origin
  })
);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/no-origin (curl, Postman) and whitelisted frontends
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Core
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);

// Features
app.use("/api/classes", classRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "🚀 HRM Backend Running Successfully!", version: "2.1.0" });
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
