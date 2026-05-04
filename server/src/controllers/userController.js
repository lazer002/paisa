import { User } from "../models/user.js";
import Institute from "../models/organization.js";
import bcrypt from "bcryptjs";

//
// 👉 CREATE USER
//
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, profile } = req.body;

    // 🔐 basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🔐 normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 🔐 ROLE RESTRICTION
    const allowedRolesByCreator = {
      super_admin: [
        "super_admin",
        "admin",
        "teacher",
        "student",
        "hr",
        "employee",
      ],
      admin: ["teacher", "student", "hr", "employee"],
    };

    const creatorRole = req.user.role;

    if (!allowedRolesByCreator[creatorRole]?.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `You are not allowed to create role: ${role}`,
      });
    }

    // 🔐 check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 🔐 ensure institute exists (for non super_admin)
    if (creatorRole !== "super_admin" && !req.user.instituteId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to any organization",
      });
    }

    // 🔐 hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 🔥 attach institute automatically
    const instituteId = req.user.instituteId;

    // 🔥 create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      instituteId,
      profile: profile || {},
    });

    // 🔁 attach user to institute
    if (instituteId) {
      const institute = await Institute.findById(instituteId).select("_id teachers students employees hrManagers");

    if (institute) {
  if (role === "teacher") {
    institute.teachers = institute.teachers || [];
    institute.teachers.push(user._id);
  }

  if (role === "student") {
    institute.students = institute.students || [];
    institute.students.push(user._id);
  }

  if (role === "employee") {
    institute.employees = institute.employees || [];
    institute.employees.push(user._id);
  }

  if (role === "hr") {
    institute.hrManagers = institute.hrManagers || [];
    institute.hrManagers.push(user._id);
  }

  await institute.save();
}
    }

    // 🔐 remove sensitive data
    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser,
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//
// 👉 GET USERS (MULTI-TENANT SAFE)
//
export const getUsers = async (req, res) => {
  try {
    let query = {};

    // 🔥 restrict by institute
    if (req.user.role !== "super_admin") {
      query.instituteId = req.user.instituteId;
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .populate("instituteId", "name type")
      .lean();

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//
// 👉 GET USER BY ID
//
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("instituteId", "name type");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//
// 👉 UPDATE USER
//
export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    // 🔐 hash password if updated
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//
// 👉 DELETE USER
//
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};