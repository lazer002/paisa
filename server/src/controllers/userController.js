// src/controllers/userController.js

import bcrypt from "bcryptjs";

import {
  User,
  canManageRole,
  Roles,
} from "../models/User.js";

import Organization from "../models/organization.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

import { scopedQuery } from "../utils/peopleHelpers.js";


// Roles an actor is allowed to create/manage
const creatableRoles = {
  super_admin: [
    "super_admin",
    "admin",
    "teacher",
    "student",
    "hr",
    "employee",
  ],

  admin: [
    "teacher",
    "student",
    "hr",
    "employee",
  ],
};


// ─────────────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────────────

export const createUser = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      role,
      profile,
      instituteId: requestedInstituteId,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return sendError(
        res,
        400,
        "Missing required fields"
      );
    }

    const normalizedEmail =
      String(email)
        .toLowerCase()
        .trim();

    const actorRole =
      req.user.role;

    if (
      !creatableRoles[
        actorRole
      ]?.includes(role)
    ) {
      return sendForbidden(
        res,
        "You do not have permission to create this role"
      );
    }

    if (
      actorRole !==
        Roles.SUPER_ADMIN &&
      !req.user.instituteId
    ) {
      return sendError(
        res,
        400,
        "Your account is not linked to any organization"
      );
    }

    const existing =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (existing) {
      return sendError(
        res,
        400,
        "A user with this email already exists"
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    const instituteId =
      actorRole ===
      Roles.SUPER_ADMIN
        ? requestedInstituteId ||
          null
        : req.user.instituteId;

    // Non-super-admin users must
    // always belong to their own institute.
    if (
      actorRole !==
        Roles.SUPER_ADMIN &&
      requestedInstituteId &&
      String(
        requestedInstituteId
      ) !==
        String(
          req.user.instituteId
        )
    ) {
      return sendForbidden(
        res,
        "You cannot create a user in another institute"
      );
    }

    const user =
      await User.create({
        name,
        email:
          normalizedEmail,
        passwordHash,
        role,
        instituteId,
        profile:
          profile || {},
      });

    // Keep organization role arrays
    // synchronized.
    if (instituteId) {
      const org =
        await Organization.findById(
          instituteId
        ).select(
          "_id teachers students employees hrManagers"
        );

      if (org) {
        const roleArrayMap = {
          teacher:
            "teachers",
          student:
            "students",
          employee:
            "employees",
          hr:
            "hrManagers",
        };

        const field =
          roleArrayMap[role];

        if (field) {
          org[field] =
            org[field] || [];

          if (
            !org[field].some(
              (id) =>
                String(id) ===
                String(user._id)
            )
          ) {
            org[field].push(
              user._id
            );

            await org.save();
          }
        }
      }
    }

    const safeUser =
      user.toObject();

    delete safeUser.passwordHash;

    sendCreated(
      res,
      "User created successfully",
      safeUser
    );
  } catch (err) {
    console.error(
      "Create user error:",
      err
    );

    if (
      err?.code === 11000
    ) {
      return sendError(
        res,
        400,
        "A user with this email already exists"
      );
    }

    sendError(
      res,
      500,
      "Server error"
    );
  }
};


// ─────────────────────────────────────────────
// GET USERS
// ─────────────────────────────────────────────

export const getUsers = async (
  req,
  res
) => {
  try {
    const {
      role: filterRole,
      search,
      status,
    } = req.query;

    const query = {
      ...scopedQuery(req.user),
    };

    // Admin cannot see super admins.
    if (
      req.user.role ===
      Roles.ADMIN
    ) {
      query.role = {
        $ne: Roles.SUPER_ADMIN,
      };
    }

    if (filterRole) {
      query.role =
        filterRole;
    }

    if (status) {
      query.status =
        status;
    }

    if (search) {
      const searchRegex = {
        $regex: search,
        $options: "i",
      };

      query.$or = [
        {
          name: searchRegex,
        },
        {
          email: searchRegex,
        },
        {
          userCode: searchRegex,
        },
      ];
    }

    const users =
      await User.find(query)
        .select(
          "-passwordHash -failedAttempts -lockedUntil"
        )
        .populate(
          "instituteId",
          "name type"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    sendSuccess(
      res,
      "Users fetched",
      users
    );
  } catch (err) {
    console.error(
      "Get users error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};


// ─────────────────────────────────────────────
// GET USER BY PUBLIC ID
// ─────────────────────────────────────────────

export const getUserById = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        publicId:
          req.params.publicId,
      })
        .select(
          "-passwordHash -failedAttempts -lockedUntil"
        )
        .populate(
          "instituteId",
          "name type"
        );

    if (!user) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    // Admin can only view users
    // from their own institute.
    if (
      req.user.role ===
      Roles.ADMIN
    ) {
      const targetInstituteId =
        user.instituteId?._id ||
        user.instituteId;

      if (
        String(
          targetInstituteId
        ) !==
        String(
          req.user.instituteId
        )
      ) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }
    }

    sendSuccess(
      res,
      "User fetched",
      user
    );
  } catch (err) {
    console.error(
      "Get user error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};


// ─────────────────────────────────────────────
// UPDATE USER
// ─────────────────────────────────────────────

export const updateUser = async (
  req,
  res
) => {
  try {
    const target =
      await User.findOne({
        publicId:
          req.params.publicId,
      }).select(
        "-passwordHash"
      );

    if (!target) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    const isSelf =
      String(target._id) ===
      String(req.user._id);

    // ─────────────────────
    // ADMIN ACCESS
    // ─────────────────────

    if (
      req.user.role ===
      Roles.ADMIN
    ) {
      const sameOrg =
        String(
          target.instituteId ??
            ""
        ) ===
        String(
          req.user.instituteId ??
            ""
        );

      if (!sameOrg) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }

      const isBelowAdmin = [
        Roles.TEACHER,
        Roles.STUDENT,
        Roles.HR,
        Roles.EMPLOYEE,
      ].includes(
        target.role
      );

      // Admin cannot manage
      // another admin/super admin.
      if (
        !isBelowAdmin &&
        !isSelf
      ) {
        return sendForbidden(
          res,
          "Admin accounts can only be managed by a super admin"
        );
      }
    }

    // ─────────────────────
    // ROLE CHANGE
    // ─────────────────────

    if (
      req.body.role &&
      req.user.role !==
        Roles.SUPER_ADMIN &&
      !canManageRole(
        req.user.role,
        req.body.role
      )
    ) {
      return sendForbidden(
        res,
        "You cannot assign this role"
      );
    }

    // ─────────────────────
    // EMAIL CHANGE
    // ─────────────────────

    if (
      req.body.email !==
      undefined
    ) {
      const canChangeEmail =
        req.user.role ===
          Roles.SUPER_ADMIN ||
        (!isSelf &&
          canManageRole(
            req.user.role,
            target.role
          ));

      if (!canChangeEmail) {
        return sendForbidden(
          res,
          "Only a super admin can change this account's email"
        );
      }

      const newEmail =
        String(
          req.body.email
        )
          .toLowerCase()
          .trim();

      if (
        !/^\S+@\S+\.\S+$/.test(
          newEmail
        )
      ) {
        return sendError(
          res,
          400,
          "Invalid email format"
        );
      }

      const taken =
        await User.findOne({
          email: newEmail,
          _id: {
            $ne: target._id,
          },
        });

      if (taken) {
        return sendError(
          res,
          400,
          "That email is already in use by another account"
        );
      }
    }

    // ─────────────────────
    // ALLOWED FIELDS
    // ─────────────────────

    let allowedFields;

    if (
      req.user.role ===
      Roles.SUPER_ADMIN
    ) {
      allowedFields = [
        "name",
        "profile",
        "status",
        "role",
        "email",
        "instituteId",
      ];
    } else if (isSelf) {
      // Self-edit:
      // name/profile only.
      allowedFields = [
        "name",
        "profile",
      ];
    } else {
      allowedFields = [
        "name",
        "profile",
        "status",
        "role",
        "email",
      ];
    }

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    // Password update
    if (req.body.password) {
      updates.passwordHash =
        await bcrypt.hash(
          req.body.password,
          10
        );
    }

    const user =
      await User.findOneAndUpdate(
        {
          publicId:
            req.params.publicId,
        },
        updates,
        {
          new: true,
          runValidators: true,
        }
      )
        .select(
          "-passwordHash -failedAttempts -lockedUntil"
        )
        .populate(
          "instituteId",
          "name type"
        );

    sendSuccess(
      res,
      "User updated successfully",
      user
    );
  } catch (err) {
    console.error(
      "Update user error:",
      err
    );

    if (
      err?.code === 11000
    ) {
      return sendError(
        res,
        400,
        "Email is already in use"
      );
    }

    sendError(
      res,
      500,
      "Server error"
    );
  }
};


// ─────────────────────────────────────────────
// DELETE / DEACTIVATE USER
// ─────────────────────────────────────────────

export const deleteUser = async (
  req,
  res
) => {
  try {
    const target =
      await User.findOne({
        publicId:
          req.params.publicId,
      });

    if (!target) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    // Cannot delete yourself.
    if (
      String(target._id) ===
      String(req.user._id)
    ) {
      return sendError(
        res,
        400,
        "You cannot delete your own account"
      );
    }

    // Soft delete / deactivate.
    await User.findOneAndUpdate(
      {
        publicId:
          req.params.publicId,
      },
      {
        status: "inactive",
      },
      {
        runValidators: true,
      }
    );

    sendSuccess(
      res,
      "User deactivated successfully"
    );
  } catch (err) {
    console.error(
      "Delete user error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};