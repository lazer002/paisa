import { User, canManageRole } from "../models/user.js";
import Organization from "../models/organization.js";
import bcrypt from "bcryptjs";

// Roles an actor is allowed to create/manage
const creatableRoles = {
  super_admin: ["super_admin", "admin", "teacher", "student", "hr", "employee"],
  admin: ["teacher", "student", "hr", "employee"],
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, profile } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const actorRole = req.user.role;

    if (!creatableRoles[actorRole]?.includes(role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to create this role" });
    }

    if (actorRole !== "super_admin" && !req.user.instituteId) {
      return res.status(400).json({ success: false, message: "Your account is not linked to any organization" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const instituteId = actorRole === "super_admin" ? (req.body.instituteId || null) : req.user.instituteId;

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      instituteId,
      profile: profile || {},
    });

    if (instituteId) {
      const org = await Organization.findById(instituteId).select("_id teachers students employees hrManagers");
      if (org) {
        const roleArrayMap = { teacher: "teachers", student: "students", employee: "employees", hr: "hrManagers" };
        const field = roleArrayMap[role];
        if (field) {
          org[field] = org[field] || [];
          if (!org[field].includes(user._id)) org[field].push(user._id);
          await org.save();
        }
      }
    }

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.status(201).json({ success: true, message: "User created successfully", data: safeUser });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role: filterRole, search, status } = req.query;
    let query = {};

    if (req.user.role !== "super_admin") {
      query.instituteId = req.user.instituteId;
    }

    // Admin cannot see super_admins
    if (req.user.role === "admin") {
      query.role = { $ne: "super_admin" };
    }

    if (filterRole) query.role = filterRole;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userCode: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Admin can only view users from their own institute
    if (req.user.role === "admin") {
      if (String(user.instituteId?._id || user.instituteId) !== String(req.user.instituteId)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select("-passwordHash");
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const isSelf = String(target._id) === String(req.user._id);

    if (req.user.role === "admin") {
      const sameOrg = String(target.instituteId ?? "") === String(req.user.instituteId ?? "");
      if (!sameOrg) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const isBelowAdmin = ["teacher", "student", "hr", "employee"].includes(target.role);

      // 🔒 Admins cannot manage OTHER admin/super_admin accounts —
      // except their OWN (name/password only — email still locked below).
      if (!isBelowAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: "Admin accounts can only be managed by a super admin",
        });
      }
    }

    // Prevent role escalation — can't set a role higher than your own
    if (req.body.role && !canManageRole(req.user.role, req.body.role) && req.user.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "You cannot assign this role" });
    }

    // 🔒 EMAIL permission:
    //   super_admin → anyone's email (incl. admins and their own)
    //   admin       → only for roles BELOW admin (teacher/student/hr/employee)
    //   admin's own email / other admins' emails → super_admin only
    if (req.body.email !== undefined) {
      const canChangeEmail =
        req.user.role === "super_admin" || (!isSelf && canManageRole(req.user.role, target.role));
      if (!canChangeEmail) {
        return res.status(403).json({
          success: false,
          message: "Only a super admin can change this account's email",
        });
      }

      const newEmail = String(req.body.email).toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      const taken = await User.findOne({ email: newEmail, _id: { $ne: target._id } });
      if (taken) {
        return res.status(400).json({ success: false, message: "That email is already in use by another account" });
      }
    }

    // Whitelist allowed update fields
    // Self-edit (non-super-admin): name/profile only — never own email/role/status
    let allowedFields;
    if (req.user.role === "super_admin") {
      allowedFields = ["name", "profile", "status", "role", "email", "instituteId"];
    } else if (isSelf) {
      allowedFields = ["name", "profile"];
    } else {
      allowedFields = ["name", "profile", "status", "role", "email"];
    }

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.body.password) {
      updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select("-passwordHash -failedAttempts -lockedUntil");

    res.json({ success: true, message: "User updated successfully", data: user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    // Cannot delete yourself
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    // Soft delete — mark as inactive instead of removing
    await User.findByIdAndUpdate(req.params.id, { status: "inactive" });

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
