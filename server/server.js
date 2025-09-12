import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
// Import routes
import authRoutes from "./src/routes/auth.js";
import instituteRoutes from "./src/routes/instituteRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import hrRoutes from "./src/routes/hrRoutes.js";            
import employeeRoutes from "./src/routes/employeeRoutes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // frontend origin
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hr", hrRoutes);             // ✅ HR endpoints
app.use("/api/employees", employeeRoutes); // ✅ Employee endpoints

app.get("/", (req, res) => {
  res.send("🚀 HRM Backend Running Successfully!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
