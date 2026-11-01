// src/controllers/employeeController.js

import { User, Roles } from "../models/User.js";

import {
  hashPassword,
  resolveInstitute,
  scopedQuery,
} from "../utils/peopleHelpers.js";

import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
} from "../utils/response.js";

import { resolveRef } from "../utils/resolveRef.js";

import Employee, {
  EXIT_STATUSES,
  LIFECYCLE_STAGES,
  STAGE_TRANSITIONS,
  stageOfStatus,
} from "../models/Employee.js";

import RefreshSession from "../models/RefreshSession.js";
import { emit } from "../realtime/emitter.js";

import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";
import { getNextSequence } from "../utils/sequence.js";
import { sendInBackground } from "../services/emailService.js";
import { sendWelcomeEmail } from "../services/passwordResetService.js";
import { checkSeatLimit } from "../services/subscriptionService.js";

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      instituteId,
      profile,
    } = req.body;

    if (!name || !email || !password) {
      return sendError(
        res,
        400,
        "Name, email and password are required"
      );
    }

    const normalizedEmail =
      String(email)
        .toLowerCase()
        .trim();

    const existing =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existing) {
      return sendError(
        res,
        400,
        "User already exists"
      );
    }

    const resolvedInstitute =
      await resolveInstitute(
        req.user,
        instituteId
      );

    if (
      requestedButUnresolved(
        resolvedInstitute,
        instituteId
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid instituteId"
      );
    }

    // Soft plan limit (fails open on billing errors).
    const planLimit = await checkSeatLimit(
      resolvedInstitute,
      Roles.EMPLOYEE
    );

    if (planLimit) {
      return sendError(res, {
        statusCode: 403,
        code: "PLAN_LIMIT_REACHED",
        message: planLimit.message,
        details: planLimit,
      });
    }

    const employee =
      await User.create({
        name,
        email: normalizedEmail,

        passwordHash:
          await hashPassword(password),

        role: Roles.EMPLOYEE,

        instituteId:
          resolvedInstitute,

        profile:
          profile || {},
      });

    const safe =
      employee.toObject();

    delete safe.passwordHash;
    delete safe.resetTokenHash;
    delete safe.resetTokenExpiresAt;
    delete safe.resetTokenRequestedAt;

    sendCreated(
      res,
      "Employee created successfully",
      safe
    );

    sendInBackground("welcome:employee", () =>
      sendWelcomeEmail({
        userId: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        instituteId: employee.instituteId,
      })
    );
  } catch (err) {
    console.error(
      "Create Employee error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};

// Get all Employees
export const getEmployees = async (
  req,
  res
) => {
  try {
    if (
      !req.user.instituteId &&
      req.user.role !== Roles.SUPER_ADMIN
    ) {
      return sendSuccess(
        res,
        "Employees fetched",
        []
      );
    }

    const employees =
      await User.find({
        role: Roles.EMPLOYEE,
        ...scopedQuery(req.user),
      })
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

    // Attach the lifecycle stage from each person's Employee profile.
    const profiles = await Employee.find({
      userId: {
        $in: employees.map((u) => u._id),
      },
    })
      .select(
        "userId instituteId status joiningDate lastWorkingDate lastStatusChangeAt"
      )
      .lean();

    const profileByUser = new Map(
      profiles.map((p) => [
        `${p.userId}:${p.instituteId}`,
        p,
      ])
    );

    const withStage = employees.map((u) => {
      const institute =
        u.instituteId?._id ?? u.instituteId;
      const profile = profileByUser.get(
        `${u._id}:${institute}`
      );

      return {
        ...u,
        lifecycleStage: profile
          ? stageOfStatus(profile.status)
          : null,
        employmentStatus: profile?.status ?? null,
        joiningDate: profile?.joiningDate ?? null,
        lastWorkingDate:
          profile?.lastWorkingDate ?? null,
        lastStageChangeAt:
          profile?.lastStatusChangeAt ?? null,
      };
    });

    sendSuccess(
      res,
      "Employees fetched",
      withStage
    );
  } catch (err) {
    console.error(
      "Get Employees error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};function requestedButUnresolved(
  resolved,
  requested
) {
  return Boolean(requested && !resolved);
}

/* =========================================================
   GET ONE EMPLOYEE
========================================================= */

export const getEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    })
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type")
      .lean();

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    sendSuccess(res, "Employee fetched", employee);
  } catch (err) {
    console.error("Get employee error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   UPDATE EMPLOYEE
========================================================= */

export const updateEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    const updates = {};

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }

    if (["active", "inactive"].includes(req.body.status)) {
      updates.status = req.body.status;
    }

    if (!Object.keys(updates).length) {
      return sendError(res, 400, "No editable fields supplied");
    }

    Object.assign(employee, updates);
    await employee.save();

    const safe = employee.toObject();
    delete safe.passwordHash;

    sendSuccess(res, "Employee updated", safe);
  } catch (err) {
    console.error("Update employee error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   DELETE EMPLOYEE
========================================================= */

export const deleteEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    await employee.deleteOne();

    sendSuccess(res, "Employee deleted", null);
  } catch (err) {
    console.error("Delete employee error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   LIFECYCLE (stage + onboarding/exit checklist)
   Stage data lives on the person's Employee profile; the
   URL carries the User publicId like every other route here.
========================================================= */

const CHECKLIST_DEFAULTS = [
  ["offer_signed", "Offer letter signed", "onboarding"],
  ["documents_collected", "ID and documents collected", "onboarding"],
  ["bank_details", "Bank details collected", "onboarding"],
  ["accounts_created", "System accounts and email set up", "onboarding"],
  ["equipment_issued", "Equipment issued", "onboarding"],
  ["induction_done", "Induction completed", "onboarding"],
  ["exit_letter", "Resignation / termination letter on file", "exit"],
  ["handover_done", "Work handover completed", "exit"],
  ["assets_returned", "Company assets returned", "exit"],
  ["access_revoked", "System access revoked", "exit"],
  ["final_settlement", "Full and final settlement done", "exit"],
  ["relieving_letter", "Relieving / experience letter issued", "exit"],
];

const defaultChecklist = () =>
  CHECKLIST_DEFAULTS.map(([key, label, phase]) => ({
    key,
    label,
    phase,
    done: false,
    doneAt: null,
  }));

const findScopedEmployeeUser = async (req) => {
  const _id = await resolveRef(User, req.params.publicId, {
    label: "Employee",
  });

  const user = await User.findOne({
    _id,
    role: Roles.EMPLOYEE,
    ...scopedQuery(req.user),
  });

  if (!user) {
    throw ApiError.notFound("Employee not found");
  }

  return user;
};

const findProfile = (user) =>
  user.instituteId
    ? Employee.findOne({
        userId: user._id,
        instituteId: user.instituteId,
      })
    : null;

const parseDate = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${field}`, {
      code: "INVALID_DATE",
    });
  }

  return date;
};

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const lifecyclePayload = (user, profile) => {
  const stage = profile ? stageOfStatus(profile.status) : "none";

  const history = [...(profile?.stageHistory ?? [])]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((h) => ({
      id: String(h._id),
      from: h.from,
      to: h.to,
      status: h.status,
      at: h.at,
      byName: h.byName,
      note: h.note,
    }));

  const checklist = profile?.lifecycleChecklist?.length
    ? profile.lifecycleChecklist.map((item) => ({
        key: item.key,
        label: item.label,
        phase: item.phase,
        done: Boolean(item.done),
        doneAt: item.doneAt ?? null,
      }))
    : defaultChecklist();

  return {
    employee: {
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      accountStatus: user.status,
    },
    hasProfile: Boolean(profile),
    stage,
    status: profile?.status ?? null,
    allowedNext: STAGE_TRANSITIONS[stage] ?? [],
    dates: {
      joiningDate: profile?.joiningDate ?? null,
      probationStartDate: profile?.probationStartDate ?? null,
      probationEndDate: profile?.probationEndDate ?? null,
      confirmationDate: profile?.confirmationDate ?? null,
      resignationDate: profile?.resignationDate ?? null,
      lastWorkingDate: profile?.lastWorkingDate ?? null,
      terminationDate: profile?.terminationDate ?? null,
      retirementDate: profile?.retirementDate ?? null,
    },
    exitReason: profile?.terminationReason ?? null,
    history,
    checklist,
  };
};

// Pre-save hooks on Employee throw plain Errors for date rules.
const saveProfile = async (profile) => {
  try {
    await profile.save();
  } catch (err) {
    if (err instanceof ApiError || err?.name === "ValidationError") {
      throw err;
    }

    if (err?.code === 11000) {
      throw err;
    }

    throw ApiError.badRequest(err?.message || "Could not save employee", {
      code: "EMPLOYEE_SAVE_FAILED",
    });
  }
};

export const getEmployeeLifecycle = asyncHandler(async (req, res) => {
  const user = await findScopedEmployeeUser(req);
  const profile = await findProfile(user);

  return sendSuccess(
    res,
    "Employee lifecycle fetched",
    lifecyclePayload(user, profile)
  );
});

export const changeEmployeeStage = asyncHandler(async (req, res) => {
  const {
    stage: target,
    note,
    exitType = "resigned",
    reason,
    deactivateUser,
    reactivateUser,
  } = req.body ?? {};

  if (!LIFECYCLE_STAGES.includes(target)) {
    throw ApiError.badRequest(
      `stage must be one of: ${LIFECYCLE_STAGES.join(", ")}`,
      { code: "INVALID_STAGE" }
    );
  }

  const user = await findScopedEmployeeUser(req);

  if (!user.instituteId) {
    throw ApiError.badRequest(
      "This employee is not linked to an organization",
      { code: "NO_ORGANIZATION" }
    );
  }

  let profile = await findProfile(user);
  const from = profile ? stageOfStatus(profile.status) : "none";

  if (from === target) {
    throw ApiError.badRequest(`Employee is already in stage "${target}"`, {
      code: "INVALID_STAGE_TRANSITION",
    });
  }

  const allowed = STAGE_TRANSITIONS[from] ?? [];

  if (!allowed.includes(target)) {
    throw ApiError.badRequest(
      `Cannot move from "${from}" to "${target}". Allowed: ${
        allowed.join(", ") || "none"
      }`,
      { code: "INVALID_STAGE_TRANSITION" }
    );
  }

  if (target === "exited" && !EXIT_STATUSES.includes(exitType)) {
    throw ApiError.badRequest(
      `exitType must be one of: ${EXIT_STATUSES.join(", ")}`,
      { code: "INVALID_EXIT_TYPE" }
    );
  }

  const effective =
    parseDate(req.body?.effectiveDate, "effectiveDate") ?? new Date();
  const lastWorkingDate = parseDate(
    req.body?.lastWorkingDate,
    "lastWorkingDate"
  );
  const probationEndDate = parseDate(
    req.body?.probationEndDate,
    "probationEndDate"
  );

  if (!profile) {
    // Accounts created from the Employees page have no profile yet.
    // The counter can lag behind codes created elsewhere (seed, imports),
    // so skip any code already taken in this organization.
    let code;
    for (let attempt = 0; attempt < 50 && !code; attempt += 1) {
      const sequence = await getNextSequence(
        `${Roles.EMPLOYEE}_${user.instituteId}`
      );
      const candidate = `EMP-${String(sequence).padStart(5, "0")}`;
      const taken = await Employee.exists({
        instituteId: user.instituteId,
        employeeCode: candidate,
      });
      if (!taken) code = candidate;
    }
    if (!code) {
      throw ApiError.conflict("Could not allocate an employee code", {
        code: "EMPLOYEE_CODE_EXHAUSTED",
      });
    }
    const nameParts = String(user.name || "").trim().split(/\s+/);

    profile = new Employee({
      instituteId: user.instituteId,
      userId: user._id,
      employeeCode: code,
      firstName: nameParts[0] || "Employee",
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
      displayName: user.name || nameParts[0] || "Employee",
      email: user.email,
      createdBy: req.user._id,
    });
  }

  const status = target === "exited" ? exitType : target;

  // Stage-specific dates.
  if (["onboarding", "probation", "active"].includes(target) && from === "none") {
    profile.joiningDate = profile.joiningDate ?? effective;
  }

  if (target === "onboarding" && from === "exited") {
    // Rehire: clear the previous exit and start a fresh checklist.
    profile.joiningDate = effective;
    profile.resignationDate = null;
    profile.lastWorkingDate = null;
    profile.terminationDate = null;
    profile.retirementDate = null;
    profile.terminationReason = null;
    profile.confirmationDate = null;
    profile.lifecycleChecklist = defaultChecklist();
  }

  if (target === "probation") {
    profile.joiningDate = profile.joiningDate ?? effective;
    profile.probationStartDate = effective;
    profile.probationEndDate = probationEndDate ?? addDays(effective, 90);
  }

  if (target === "active" && ["probation", "onboarding"].includes(from)) {
    profile.joiningDate = profile.joiningDate ?? effective;
    profile.confirmationDate = effective;
  }

  if (target === "active" && from === "notice_period") {
    // Resignation withdrawn.
    profile.resignationDate = null;
    profile.lastWorkingDate = null;
    profile.terminationReason = null;
  }

  if (target === "notice_period") {
    profile.resignationDate = effective;
    profile.lastWorkingDate =
      lastWorkingDate ??
      addDays(effective, Number(profile.noticePeriodDays ?? 30));
    if (reason) profile.terminationReason = String(reason).slice(0, 3000);
  }

  if (target === "exited") {
    const exitDate = lastWorkingDate ?? effective;

    profile.lastWorkingDate = exitDate;

    if (exitType === "resigned") {
      profile.resignationDate = profile.resignationDate ?? exitDate;
    }
    if (exitType === "terminated") profile.terminationDate = exitDate;
    if (exitType === "retired") profile.retirementDate = exitDate;
    if (reason) profile.terminationReason = String(reason).slice(0, 3000);
  }

  if (!profile.lifecycleChecklist?.length) {
    profile.lifecycleChecklist = defaultChecklist();
  }

  profile.status = status;
  profile.lastStatusChangeAt = new Date();
  profile.lastModifiedBy = req.user._id;
  profile.updatedBy = req.user._id;

  profile.stageHistory.push({
    from,
    to: target,
    status,
    at: new Date(),
    by: req.user._id,
    byName: req.user.name ?? null,
    note: note ? String(note).slice(0, 2000) : null,
  });

  await saveProfile(profile);

  // Linked login account: only touched when explicitly asked.
  if (target === "exited" && deactivateUser === true && user.status !== "inactive") {
    user.status = "inactive";
    user.deactivatedAt = new Date();
    user.deactivationReason = `Employee exited (${exitType})`;
    await user.save();
    await RefreshSession.revokeUserSessions(user._id, "account_disabled");
    emit.disconnectUser(user._id, "ACCOUNT_DISABLED");
  }

  if (from === "exited" && reactivateUser === true && user.status !== "active") {
    user.status = "active";
    user.deactivatedAt = null;
    user.deactivationReason = null;
    await user.save();
  }

  return sendSuccess(
    res,
    `Employee moved to ${target}`,
    lifecyclePayload(user, profile)
  );
});

export const updateEmployeeChecklist = asyncHandler(async (req, res) => {
  const items = req.body?.items;

  if (!Array.isArray(items) || items.length > 60) {
    throw ApiError.badRequest("items must be an array of at most 60 entries", {
      code: "INVALID_CHECKLIST",
    });
  }

  const user = await findScopedEmployeeUser(req);
  const profile = await findProfile(user);

  if (!profile) {
    throw ApiError.badRequest(
      "Set a lifecycle stage before editing the checklist",
      { code: "NO_EMPLOYEE_PROFILE" }
    );
  }

  const previous = new Map(
    (profile.lifecycleChecklist ?? []).map((item) => [item.key, item])
  );
  const seen = new Set();

  const next = items.map((raw, index) => {
    const label = String(raw?.label ?? "").trim();
    const phase = raw?.phase;

    if (!label || !["onboarding", "exit"].includes(phase)) {
      throw ApiError.badRequest(
        `Checklist item ${index + 1} needs a label and phase (onboarding|exit)`,
        { code: "INVALID_CHECKLIST" }
      );
    }

    let key = String(raw?.key ?? "").trim().slice(0, 100) || `item_${index + 1}`;
    while (seen.has(key)) key = `${key}_${index + 1}`;
    seen.add(key);

    const done = raw?.done === true;
    const before = previous.get(key);

    return {
      key,
      label: label.slice(0, 300),
      phase,
      done,
      doneAt: done ? (before?.done ? before.doneAt : new Date()) : null,
      doneBy: done ? (before?.done ? before.doneBy : req.user._id) : null,
    };
  });

  profile.lifecycleChecklist = next;
  profile.lastModifiedBy = req.user._id;
  profile.updatedBy = req.user._id;

  await saveProfile(profile);

  return sendSuccess(
    res,
    "Checklist updated",
    lifecyclePayload(user, profile)
  );
});