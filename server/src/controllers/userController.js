// src/controllers/userController.js

import bcrypt from "bcryptjs";

import mongoose from "mongoose";
import {
  User
} from "../models/User.js";

import Organization from "../models/organization.js";
import { getNextSequence } from "../utils/sequence.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

import { scopedQuery } from "../utils/peopleHelpers.js";

import { resolveRef } from "../utils/resolveRef.js";
import { Department } from "../models/Department.js";

import {
  CREATABLE_ROLES,
  ROLE_MODELS,
  ROLE_DATA_KEYS,
  ORGANIZATION_ROLE_ARRAYS,
} from "../config/userRoleConfig.js";

import  {ROLES }  from "../config/constants.js";


export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      profile = {},
      instituteId: requestedInstituteId,
    } = req.body;

    /* ---------------------------------------------------------------------- */
    /* BASIC VALIDATION                                                       */
    /* ---------------------------------------------------------------------- */

    if (!name || !email || !password || !role) {
      return sendError(
        res,
        400,
        "Name, email, password and role are required"
      );
    }

    const normalizedName = String(name).trim();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const actorRole = String(req.user?.role || "")
      .trim()
      .toLowerCase();

    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    /* ---------------------------------------------------------------------- */
    /* ROLE PERMISSION                                                        */
    /* ---------------------------------------------------------------------- */

    const allowedRoles =
      CREATABLE_ROLES[actorRole] || [];

    if (!allowedRoles.includes(normalizedRole)) {
      return sendForbidden(
        res,
        "You do not have permission to create this role"
      );
    }

    /* ---------------------------------------------------------------------- */
    /* ORGANIZATION                                                           */
    /* ---------------------------------------------------------------------- */

    let instituteId = null;

    if (actorRole === ROLES.SUPER_ADMIN) {
      if (!requestedInstituteId) {
        return sendError(
          res,
          400,
          "Organization is required"
        );
      }

      instituteId = await resolveRef(
        Organization,
        requestedInstituteId,
        {
          label: "Organization",
        }
      );

      if (!instituteId) {
        return sendError(
          res,
          400,
          "Organization not found"
        );
      }
    } else {
      if (!req.user?.instituteId) {
        return sendError(
          res,
          400,
          "Your account is not linked to any organization"
        );
      }

      instituteId = req.user.instituteId;

      if (
        requestedInstituteId &&
        String(requestedInstituteId) !==
          String(req.user.instituteId)
      ) {
        return sendForbidden(
          res,
          "You cannot create a user in another organization"
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* DUPLICATE EMAIL                                                        */
    /* ---------------------------------------------------------------------- */

    const existingUser = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (existingUser) {
      return sendError(
        res,
        400,
        "A user with this email already exists"
      );
    }

    /* ---------------------------------------------------------------------- */
    /* ROLE MODEL                                                             */
    /* ---------------------------------------------------------------------- */

    const RoleModel =
      ROLE_MODELS[normalizedRole];

    if (!RoleModel) {
      return sendError(
        res,
        400,
        `No model configured for role: ${normalizedRole}`
      );
    }

    /* ---------------------------------------------------------------------- */
    /* ROLE DATA                                                              */
    /* ---------------------------------------------------------------------- */

    const dataKey =
      ROLE_DATA_KEYS[normalizedRole];

    const roleData =
      dataKey &&
      req.body[dataKey] &&
      typeof req.body[dataKey] === "object"
        ? {
            ...req.body[dataKey],
          }
        : {};

    /* ====================================================================== */
    /* STUDENT                                                                */
    /* ====================================================================== */

    if (normalizedRole === ROLES.STUDENT) {
      /*
       * enrollmentNumber is NEVER accepted from frontend.
       * Backend owns the sequence.
       */

      if (!roleData.course) {
        return sendError(
          res,
          400,
          "Course is required"
        );
      }

      const sequence =
        await getNextSequence(
          `student_enrollment_${instituteId}`
        );

      roleData.enrollmentNumber =
        `STU-${String(sequence).padStart(5, "0")}`;

      /*
       * Optional roll number can remain user supplied
       * if your academic workflow requires it.
       *
       * It is intentionally NOT generated here.
       */
    }


    /* ====================================================================== */
    /* TEACHER                                                                */
    /* ====================================================================== */

    if (normalizedRole === ROLES.TEACHER) {
      /*
       * Teacher code is backend generated.
       */

      const sequence =
        await getNextSequence(
          `teacher_${instituteId}`
        );

      roleData.employeeCode =
        `TEA-${String(sequence).padStart(5, "0")}`;

      /*
       * Teacher display name comes from User.
       */

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      /*
       * Teacher work email comes from User.
       */

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      /*
       * Never allow frontend to overwrite generated code.
       */

      delete roleData.teacherCode;
      delete roleData.employeeId;
    }


    /* ====================================================================== */
    /* EMPLOYEE                                                                */
    /* ====================================================================== */

    if (normalizedRole === ROLES.EMPLOYEE) {
      /*
       * Employee code is backend generated.
       */

      const sequence =
        await getNextSequence(
          `employee_${instituteId}`
        );

      const employeeCode =
        `EMP-${String(sequence).padStart(5, "0")}`;

      /*
       * Remove any frontend supplied generated values.
       */

      delete roleData.employeeCode;
      delete roleData.employeeId;

      /*
       * Backend owns these values.
       */

      roleData.employeeCode =
        employeeCode;

      roleData.employeeId =
        employeeCode;

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";

      /*
       * firstName is required by Employee model.
       */

      const nameParts =
        normalizedName.split(/\s+/);

      roleData.firstName =
        nameParts[0] || "";

      roleData.lastName =
        nameParts.length > 1
          ? nameParts
              .slice(1)
              .join(" ")
          : null;

      if (!roleData.firstName) {
        return sendError(
          res,
          400,
          "Employee first name is required"
        );
      }
    }


    /* ====================================================================== */
    /* HR                                                                      */
    /* ====================================================================== */

    if (normalizedRole === ROLES.HR) {
      const sequence =
        await getNextSequence(
          `hr_${instituteId}`
        );

      roleData.employeeCode =
        `HR-${String(sequence).padStart(5, "0")}`;

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";

      delete roleData.employeeId;
      delete roleData.hrCode;
    }


    /* ====================================================================== */
    /* ACCOUNTANT                                                             */
    /* ====================================================================== */

    if (normalizedRole === ROLES.ACCOUNTANT) {
      const sequence =
        await getNextSequence(
          `accountant_${instituteId}`
        );

      roleData.employeeCode =
        `ACC-${String(sequence).padStart(5, "0")}`;

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";

      delete roleData.employeeId;
    }


    /* ====================================================================== */
    /* COUNSELOR                                                              */
    /* ====================================================================== */

    if (normalizedRole === ROLES.COUNSELOR) {
      const sequence =
        await getNextSequence(
          `counselor_${instituteId}`
        );

      roleData.employeeCode =
        `CNS-${String(sequence).padStart(5, "0")}`;

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";

      delete roleData.employeeId;
    }


    /* ====================================================================== */
    /* PRINCIPAL                                                              */
    /* ====================================================================== */

    if (normalizedRole === ROLES.PRINCIPAL) {
      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";
    }


    /* ====================================================================== */
    /* PARENT                                                                 */
    /* ====================================================================== */

    if (normalizedRole === ROLES.PARENT) {
      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.email =
        roleData.email ||
        normalizedEmail;
    }


    /* ====================================================================== */
    /* SUPPORT                                                                */
    /* ====================================================================== */

    if (normalizedRole === ROLES.SUPPORT) {
      const sequence =
        await getNextSequence(
          `support_${instituteId}`
        );

      roleData.employeeCode =
        `SUP-${String(sequence).padStart(5, "0")}`;

      roleData.displayName =
        roleData.displayName ||
        normalizedName;

      roleData.workEmail =
        roleData.workEmail ||
        normalizedEmail;

      roleData.employmentStatus =
        roleData.employmentStatus ||
        "active";

      delete roleData.employeeId;
    }


    /* ---------------------------------------------------------------------- */
    /* PASSWORD                                                               */
    /* ---------------------------------------------------------------------- */

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );


    /* ---------------------------------------------------------------------- */
    /* CREATE USER                                                            */
    /* ---------------------------------------------------------------------- */

    const user =
      await User.create({
        name: normalizedName,

        email: normalizedEmail,

        passwordHash,

        role: normalizedRole,

        instituteId,

        profile: profile || {},

        createdBy:
          req.user._id,

        mustChangePassword: true,

        emailVerified: false,

        status: "active",
      });


    /* ---------------------------------------------------------------------- */
    /* CREATE ROLE RECORD                                                     */
    /* ---------------------------------------------------------------------- */

    let roleRecord;

    try {
      roleRecord =
        await RoleModel.create({
          ...roleData,

          userId:
            user._id,

          instituteId,

          createdBy:
            req.user._id,
        });
    } catch (roleError) {
      await User.deleteOne({
        _id: user._id,
      });

      throw roleError;
    }


    /* ---------------------------------------------------------------------- */
    /* UPDATE ORGANIZATION MEMBERSHIP                                         */
    /* ---------------------------------------------------------------------- */

    const organization =
      await Organization.findById(
        instituteId
      );

    if (!organization) {
      await RoleModel.deleteOne({
        _id: roleRecord._id,
      });

      await User.deleteOne({
        _id: user._id,
      });

      return sendError(
        res,
        400,
        "Organization not found"
      );
    }

    const organizationField =
      ORGANIZATION_ROLE_ARRAYS[
        normalizedRole
      ];

    if (organizationField) {
      if (
        !Array.isArray(
          organization[
            organizationField
          ]
        )
      ) {
        organization[
          organizationField
        ] = [];
      }

      const exists =
        organization[
          organizationField
        ].some(
          (id) =>
            String(id) ===
            String(user._id)
        );

      if (!exists) {
        organization[
          organizationField
        ].push(user._id);
      }
    }

    /*
     * Do NOT maintain membersCount here.
     *
     * Member counts are calculated dynamically
     * from the User collection.
     */

    organization.updatedBy =
      req.user._id;

    await organization.save();


    /* ---------------------------------------------------------------------- */
    /* SAFE RESPONSE                                                          */
    /* ---------------------------------------------------------------------- */

    const safeUser =
      user.toObject();

    delete safeUser.passwordHash;

    return sendCreated(
      res,
      "User created successfully",
      {
        user: safeUser,

        role: normalizedRole,

        roleRecord,
      }
    );

  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    if (
      error?.code === 11000
    ) {
      return sendError(
        res,
        400,
        "A duplicate record already exists"
      );
    }

    if (
      error?.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors || {}
        )
          .map(
            (item) =>
              item.message
          )
          .filter(Boolean);

      return sendError(
        res,
        400,
        messages.length
          ? messages.join(", ")
          : "Invalid user data"
      );
    }

    if (
      error?.name ===
      "CastError"
    ) {
      return sendError(
        res,
        400,
        `Invalid ${
          error.path ||
          "field"
        }`
      );
    }

    return sendError(
      res,
      500,
      error?.message ||
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

    // Admin sees only their own org's users and
    // never super admins — even when a role filter
    // is applied.
    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      query.role = {
        $ne: ROLES.SUPER_ADMIN,
      };
    }

    if (filterRole) {
      if (filterRole === ROLES.SUPER_ADMIN) {
        if (
          req.user.role !==
          ROLES.SUPER_ADMIN
        ) {
          return sendForbidden(
            res,
            "Access denied"
          );
        }
      } else {
        query.role =
          filterRole;
      }
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
const user = await User.findOne({
  publicId: req.params.publicId,
})
  .select("-passwordHash -failedAttempts -lockedUntil")
  .populate("instituteId", "name type")
  .populate("employment.department", "name code status")
  .populate("employment.reportingManager", "name email role userCode");

    if (!user) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    const targetRole = user.role;

    // Non-super-admins can only view users
    // from their own institute and can never
    // view a super admin.
    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      if (
        targetRole ===
        ROLES.SUPER_ADMIN
      ) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }

      const targetInstituteId =
        user.instituteId?._id ||
        user.instituteId;

      if (
        String(
          targetInstituteId ?? ""
        ) !==
        String(
          req.user.instituteId ?? ""
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

export const updateUser = async (req, res) => {
  try {
    console.log("✌️ req update --->", req.body);

    const target = await User.findOne({
      publicId: req.params.publicId,
    }).select("-passwordHash");

    if (!target) {
      return sendNotFound(res, "User not found");
    }

    const isSelf =
      String(target._id) === String(req.user._id);

    // =========================================================
    // ADMIN ACCESS
    // =========================================================

    if (req.user.role === ROLES.ADMIN) {
      const sameOrg =
        String(target.instituteId ?? "") ===
        String(req.user.instituteId ?? "");

      if (!sameOrg) {
        return sendForbidden(res, "Access denied");
      }

      const isBelowAdmin = [
        ROLES.PRINCIPAL,
        ROLES.TEACHER,
        ROLES.STUDENT,
        ROLES.HR,
        ROLES.ACCOUNTANT,
        ROLES.COUNSELOR,
        ROLES.EMPLOYEE,
        ROLES.SUPPORT,
        ROLES.PARENT,
      ].includes(target.role);

      if (!isBelowAdmin && !isSelf) {
        return sendForbidden(
          res,
          "Admin accounts can only be managed by a super admin"
        );
      }
    }

    // =========================================================
    // ROLE CHANGE
    // =========================================================

    if (
      req.body.role &&
      req.user.role !== ROLES.SUPER_ADMIN &&
      !canManageRole(req.user.role, req.body.role)
    ) {
      return sendForbidden(
        res,
        "You cannot assign this role"
      );
    }

    // =========================================================
    // EMAIL CHANGE
    // =========================================================

    if (req.body.email !== undefined) {
      const canChangeEmail =
        req.user.role === ROLES.SUPER_ADMIN ||
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

      const newEmail = String(req.body.email)
        .toLowerCase()
        .trim();

      if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
        return sendError(
          res,
          400,
          "Invalid email format"
        );
      }

      const taken = await User.findOne({
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

    // =========================================================
    // BUILD UPDATE OBJECT
    // =========================================================

    const updates = {};

    // =========================================================
    // BASIC USER FIELDS
    // =========================================================

    const basicFields = [
      "name",
      "displayName",
      "status",
      "role",
      "email",
    ];

    if (req.user.role === ROLES.SUPER_ADMIN) {
      basicFields.push("instituteId");
    }

    if (isSelf) {
      for (const field of [
        "name",
        "displayName",
      ]) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
    } else {
      for (const field of basicFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
    }

    // =========================================================
    // PROFILE
    // =========================================================

    if (
      req.body.profile &&
      typeof req.body.profile === "object"
    ) {
      const profileFields = [
        "phone",
        "alternatePhone",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "avatar",
      ];

      for (const field of profileFields) {
        if (
          req.body.profile[field] !== undefined
        ) {
          updates[`profile.${field}`] =
            req.body.profile[field];
        }
      }
    }

    // =========================================================
    // EMPLOYMENT
    // =========================================================



if (
  req.body.employment &&
  typeof req.body.employment === "object"
) {
  const employment = req.body.employment;

  const employmentFields = [
    "designation",
    "workLocation",
    "workEmail",
    "dateOfJoining",
    "probationEndDate",
    "skills",
  ];

  for (const field of employmentFields) {
    if (employment[field] !== undefined) {
      updates[`employment.${field}`] = employment[field];
    }
  }

  // =========================================================
  // DEPARTMENT
  // Accept publicId OR Mongo ObjectId
  // =========================================================

  if (employment.department !== undefined) {
    const departmentValue = employment.department;

    if (
      departmentValue === null ||
      departmentValue === ""
    ) {
      updates["employment.department"] = null;
    } else {
      const department = mongoose.Types.ObjectId.isValid(
        departmentValue
      )
        ? await Department.findOne({
            _id: departmentValue,
            instituteId: target.instituteId,
            isDeleted: { $ne: true },
          })
        : await Department.findOne({
            publicId: departmentValue,
            instituteId: target.instituteId,
            isDeleted: { $ne: true },
          });

      if (!department) {
        return sendError(
          res,
          400,
          "Department does not belong to this organization"
        );
      }

      updates["employment.department"] = department._id;
    }
  }

  // =========================================================
  // REPORTING MANAGER
  // Accept publicId OR Mongo ObjectId
  // =========================================================

  if (employment.reportingManager !== undefined) {
    const managerValue = employment.reportingManager;

    if (
      managerValue === null ||
      managerValue === ""
    ) {
      updates["employment.reportingManager"] = null;
    } else {
      const manager = mongoose.Types.ObjectId.isValid(
        managerValue
      )
        ? await User.findOne({
            _id: managerValue,
            instituteId: target.instituteId,
          }).select("_id instituteId name email role publicId")
        : await User.findOne({
            publicId: managerValue,
            instituteId: target.instituteId,
          }).select("_id instituteId name email role publicId");

      if (!manager) {
        return sendError(
          res,
          400,
          "Reporting manager must belong to the same organization"
        );
      }

      updates["employment.reportingManager"] =
        manager._id;
    }
  }
}

    // =========================================================
    // ACADEMIC
    // =========================================================

    if (
      req.body.academic &&
      typeof req.body.academic === "object"
    ) {
      const academicFields = [
        "rollNumber",
        "grade",
        "section",
        "guardianName",
        "guardianPhone",
        "admissionDate",
      ];

      for (const field of academicFields) {
        if (
          req.body.academic[field] !== undefined
        ) {
          updates[`academic.${field}`] =
            req.body.academic[field];
        }
      }
    }

    // =========================================================
    // INSTITUTE
    // =========================================================

    if (
      updates.instituteId !== undefined
    ) {
      updates.instituteId =
        updates.instituteId === null ||
        updates.instituteId === ""
          ? null
          : await resolveRef(
              Organization,
              updates.instituteId,
              {
                label: "Organization",
              }
            );
    }

    // =========================================================
    // PASSWORD
    // =========================================================

    if (req.body.password) {
      updates.passwordHash =
        await bcrypt.hash(
          req.body.password,
          10
        );
    }

    console.log(
      "✏️ Mongo updates --->",
      updates
    );

    // =========================================================
    // UPDATE
    // =========================================================

    const user =
      await User.findOneAndUpdate(
        {
          publicId:
            req.params.publicId,
        },
        {
          $set: updates,
        },
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
        )
        .populate(
          "employment.department",
          "publicId name code status"
        )
        .populate(
          "employment.reportingManager",
          "publicId name email role userCode"
        );

    if (!user) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    return sendSuccess(
      res,
      "User updated successfully",
      user
    );
  } catch (err) {
    console.error(
      "❌ Update user error:",
      err
    );

    if (err?.code === 11000) {
      return sendError(
        res,
        400,
        "Email is already in use"
      );
    }

    if (err?.name === "CastError") {
      return sendError(
        res,
        400,
        `Invalid value for ${err.path}`
      );
    }

    return sendError(
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