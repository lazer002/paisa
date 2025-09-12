import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const router = express.Router();

// ✅ Register User
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, instituteId } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role,
      instituteId: instituteId || null,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id, role: user.role, instituteId: user.instituteId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // ✅ Return token in response (frontend API will set cookie)
  res.json({ token, role: user.role, instituteId: user.instituteId });
});



router.get("/me", async (req, res) => {
  // Get token from cookie or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // remove ": any"
    const user = await User.findById(decoded.userId).select("-passwordHash");
    res.json(user); // return user info to frontend
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});


export default router;
