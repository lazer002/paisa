import { User } from "../models/user.js";
import Institute from "../models/institute.js";
import bcrypt from "bcryptjs";
import { getNextSequence } from "../utils/sequence.js";

// 👉 Create new user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, instituteId } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique userId (like STU-001, EMP-001 etc.)
    const seqNum = await getNextSequence("userId");
    const userId = `${role.toUpperCase().slice(0, 3)}-${seqNum.toString().padStart(4, "0")}`;

    // Create user
    const user = await User.create({
      instituteId,
      name,
      email,
      passwordHash,
      role,
      profile: req.body.profile || {},
      userId, // custom generated ID
    });

    // If user belongs to an institute, push them into the correct array
    if (instituteId) {
      const institute = await Institute.findById(instituteId);
      if (institute) {
        if (role === "teacher") institute.teachers.push(user._id);
        if (role === "student") institute.students.push(user._id);
        if (role === "employee") institute.employees.push(user._id);
        if (role === "hr") institute.hrManagers.push(user._id);
        await institute.save();
      }
    }

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("instituteId", "name type");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("instituteId", "name type");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Update user
export const updateUser = async (req, res) => {
  try {
    const updates = req.body;

    // If password update, hash it again
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Delete user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
