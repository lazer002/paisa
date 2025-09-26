import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./src/utils/errorHandler.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import instituteRoutes from "./src/routes/instituteRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import hrRoutes from "./src/routes/hrRoutes.js";            
import employeeRoutes from "./src/routes/employeeRoutes.js";

dotenv.config();
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/employees", employeeRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 HRM Backend Running Successfully!",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      institutes: "/api/institutes",
      users: "/api/users",
      hr: "/api/hr",
      employees: "/api/employees"
    }
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
