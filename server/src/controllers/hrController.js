import { User, Roles } from "../models/user.js";

// Create HR
export const createHR = async (req, res) => {
  try {
    const { name, email, password, instituteId } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // Create HR
    const hr = await User.create({
      name,
      email,
      passwordHash: password, // password should be hashed via pre-save hook or bcrypt
      role: Roles.HR,
      instituteId: instituteId || null,
    });

    res.status(201).json({ message: "HR created successfully", hr });
  } catch (err) {
    console.error("Create HR error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all HRs
export const getHRs = async (req, res) => {
  try {
    const hrs = await User.find({ role: Roles.HR }).populate("instituteId", "name type");
    res.json(hrs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
