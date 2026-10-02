// src/controllers/departmentController.js

import { Department } from "../models/Department.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const MANAGEMENT_ROLES = [
  "super_admin",
  "admin",
  "principal",
  "hr",
];

const getInstituteId = (req) => req.user?.instituteId;

const ensureSameInstituteUser = async (
  userId,
  instituteId,
  label = "User"
) => {
  if (!userId) return null;

  const user = await User.findOne({
    _id: userId,
    instituteId,
  }).select("_id name email role userCode instituteId");

  if (!user) {
    const error = new Error(`${label} does not belong to this organization`);
    error.statusCode = 400;
    throw error;
  }

  return user;
};

const resolveDepartmentHead = async (head, instituteId) => {
  if (!head || head === "") return null;

  const resolvedId = await resolveRef(User, head, {
    label: "Department head",
  });

  const user = await ensureSameInstituteUser(
    resolvedId,
    instituteId,
    "Department head"
  );

  if (!MANAGEMENT_ROLES.includes(user.role)) {
    const error = new Error(
      "Department head must have a management role"
    );
    error.statusCode = 400;
    throw error;
  }

  return user._id;
};

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export const createDepartment = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    head,
    description,
  } = req.body;

  const instituteId = getInstituteId(req);

  if (!instituteId) {
    return sendForbidden(
      res,
      "Organization context is required"
    );
  }

  if (!name?.trim()) {
    return sendError(
      res,
      400,
      "Department name is required"
    );
  }

  const normalizedName = name.trim();

  const existing = await Department.findOne({
    instituteId,
    name: normalizedName,
  });

  if (existing) {
    return sendError(
      res,
      400,
      "A department with this name already exists"
    );
  }

  if (code?.trim()) {
    const existingCode = await Department.findOne({
      instituteId,
      code: code.trim().toUpperCase(),
    });

    if (existingCode) {
      return sendError(
        res,
        400,
        "A department with this code already exists"
      );
    }
  }

  const resolvedHeadId = await resolveDepartmentHead(
    head,
    instituteId
  );

  const dept = await Department.create({
    instituteId,
    name: normalizedName,
    code: code?.trim()
      ? code.trim().toUpperCase()
      : undefined,
    head: resolvedHeadId,
    description: description?.trim() || "",
  });

  const populated = await Department.findById(dept._id)
    .populate(
      "head",
      "name email userCode role publicId"
    );

  return sendCreated(
    res,
    "Department created",
    populated
  );
});

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────

export const getDepartments = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === "super_admin") {
    if (req.query.instituteId) {
      query.instituteId = await resolveRef(
        Department.db.model("Organization"),
        req.query.instituteId,
        {
          label: "Organization",
        }
      );
    }
  } else {
    if (!req.user.instituteId) {
      return sendForbidden(
        res,
        "Organization context is required"
      );
    }

    query.instituteId = req.user.instituteId;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    const search = req.query.search.trim();

    query.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        code: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const departments = await Department.find(query)
    .populate(
      "head",
      "name email userCode role publicId"
    )
    .sort({
      name: 1,
    });

  return sendSuccess(
    res,
    "Departments fetched",
    departments
  );
});

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findOne({
    publicId: req.params.publicId,
  });

  if (!dept) {
    return sendNotFound(
      res,
      "Department not found"
    );
  }

  if (
    req.user.role !== "super_admin" &&
    String(dept.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  const allowedFields = [
    "name",
    "code",
    "head",
    "description",
    "status",
  ];

  const updates = {};

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();

    if (!name) {
      return sendError(
        res,
        400,
        "Department name is required"
      );
    }

    const duplicate = await Department.findOne({
      instituteId: dept.instituteId,
      name,
      _id: {
        $ne: dept._id,
      },
    });

    if (duplicate) {
      return sendError(
        res,
        400,
        "A department with this name already exists"
      );
    }

    updates.name = name;
  }

  if (req.body.code !== undefined) {
    const code = String(req.body.code).trim().toUpperCase();

    if (code) {
      const duplicate = await Department.findOne({
        instituteId: dept.instituteId,
        code,
        _id: {
          $ne: dept._id,
        },
      });

      if (duplicate) {
        return sendError(
          res,
          400,
          "A department with this code already exists"
        );
      }

      updates.code = code;
    } else {
      updates.code = null;
    }
  }

  if (req.body.description !== undefined) {
    updates.description =
      String(req.body.description).trim();
  }

  if (req.body.status !== undefined) {
    if (
      !["active", "inactive"].includes(
        req.body.status
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid department status"
      );
    }

    updates.status = req.body.status;
  }

  if (req.body.head !== undefined) {
    updates.head = await resolveDepartmentHead(
      req.body.head,
      dept.instituteId
    );
  }

  const updated = await Department.findOneAndUpdate(
    {
      publicId: req.params.publicId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).populate(
    "head",
    "name email userCode role publicId"
  );

  return sendSuccess(
    res,
    "Department updated",
    updated
  );
});

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findOne({
    publicId: req.params.publicId,
  });

  if (!dept) {
    return sendNotFound(
      res,
      "Department not found"
    );
  }

  if (
    req.user.role !== "super_admin" &&
    String(dept.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  const usersCount = await User.countDocuments({
    instituteId: dept.instituteId,
    "employment.department": dept._id,
  });

  if (usersCount > 0) {
    return sendError(
      res,
      400,
      `Cannot delete department. ${usersCount} user(s) are assigned to it.`
    );
  }

  await Department.deleteOne({
    _id: dept._id,
  });

  return sendSuccess(
    res,
    "Department deleted"
  );
});