// src/controllers/organizationController.js


import slugify from "slugify";

import Organization from "../models/organization.js";
import { User } from "../models/User.js";
import { ROLES } from "../config/constants.js";
import { hashPassword } from "../utils/password.js";
import { sendInBackground } from "../services/emailService.js";
import { sendWelcomeEmail } from "../services/passwordResetService.js";

export const createOrganization = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      type,
      description,
      contact,
      website,
      logo,
      meta,
    } = req.body;

    if (!name?.trim() || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    const organizationName = name.trim();

    const slug = slugify(organizationName, {
      lower: true,
      strict: true,
      trim: true,
    });

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "A valid organization name is required",
      });
    }

    // Organization name/slug must be unique globally.
    const exists = await Organization.findOne({
      $or: [
        { name: organizationName },
        { slug },
      ],
      isDeleted: false,
    }).lean();

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Organization with this name or slug already exists",
      });
    }

    if (!contact?.email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Organization admin email is required",
      });
    }

    const adminEmail = String(contact.email)
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: adminEmail,
      isDeleted: false,
    }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const emailUsername =
      adminEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9._-]/g, "");

    if (!emailUsername) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin email",
      });
    }

    const temporaryPassword =
      `${emailUsername}@12345`;

    const passwordHash =
      await hashPassword(temporaryPassword);

    const org = await Organization.create({
      name: organizationName,
      slug,
      type,
      description,
      contact: {
        ...contact,
        email: adminEmail,
      },
      // The model keeps these under branding; top-level keys were dropped.
      branding: {
        website: website || null,
        logo: logo || null,
      },
      meta,
      owner: userId,
      createdBy: userId,
      admins: [],
      membersCount: 0,
    });

    try {
      const organizationAdmin =
        await User.create({
          instituteId: org._id,

          name:
            contact?.name?.trim() ||
            emailUsername,

          email: adminEmail,

          passwordHash,

          role: ROLES.ADMIN,

          status: "active",

          mustChangePassword: true,

          emailVerified: false,

          createdBy: userId,
        });

      org.admins = [
        organizationAdmin._id,
      ];


      org.updatedBy = userId;

      await org.save();

      // The temporary password is shown once to the creator only; the
      // new admin gets a set-password link instead of a password.
      sendInBackground("welcome:org-admin", () =>
        sendWelcomeEmail({
          userId: organizationAdmin._id,
          name: organizationAdmin.name,
          email: organizationAdmin.email,
          role: organizationAdmin.role,
          organizationName: org.name,
        })
      );

      return res.status(201).json({
        success: true,
        message:
          "Organization and admin account created successfully",

        data: {
          organization: org,

          admin: {
            id: organizationAdmin._id,
            email: organizationAdmin.email,
            name: organizationAdmin.name,
            role: organizationAdmin.role,
            mustChangePassword:
              organizationAdmin.mustChangePassword,
          },

          temporaryPassword,
        },
      });
    } catch (userError) {
      await Organization.deleteOne({
        _id: org._id,
      });

      throw userError;
    }
  } catch (err) {
    console.error(
      "Create Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err?.message ||
        "Failed to create organization",
    });
  }
};
//
// MULTI-TENANT SCOPING
//
const scopeQueryForUser = (user) => {
  const query = {};

  if (user.role === "super_admin") {
    return query;
  }

  if (!user.instituteId) {
    query.owner = user._id;
    return query;
  }

  query.$or = [
    {
      _id: user.instituteId,
    },
    {
      owner: user._id,
    },
  ];

  return query;
};

//
// GET ALL ORGANIZATIONS
//
export const getOrganizations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type,
      status,
    } = req.query;

    const query = scopeQueryForUser(req.user);

    // countDocuments skips the model's soft-delete find hook, so the
    // filter is explicit. super_admin can list deleted orgs to restore them.
    if (
      req.query.deleted === "true" &&
      req.user.role === ROLES.SUPER_ADMIN
    ) {
      query.isDeleted = true;
      query.includeDeleted = true;
    } else {
      query.isDeleted = false;
    }

    // One type or a comma-separated group (e.g. "company,startup").
    if (type) {
      const types = String(type).split(",").map((t) => t.trim()).filter(Boolean);
      query.type = types.length > 1 ? { $in: types } : types[0];
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // includeDeleted is a flag for the find hook, not a field.
    const countQuery = { ...query };
    delete countQuery.includeDeleted;

    const [orgs, total] = await Promise.all([
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Organization.countDocuments(countQuery),
    ]);

    const organizationIds = orgs.map(
      (org) => org._id
    );

    const memberCounts = await User.aggregate([
      {
        $match: {
          instituteId: {
            $in: organizationIds,
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$instituteId",
          members: {
            $sum: 1,
          },
          students: {
            $sum: {
              $cond: [
                { $eq: ["$role", ROLES.STUDENT] },
                1,
                0,
              ],
            },
          },
          staff: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$role",
                    [
                      ROLES.TEACHER,
                      ROLES.EMPLOYEE,
                      ROLES.HR,
                      ROLES.ACCOUNTANT,
                      ROLES.COUNSELOR,
                      ROLES.SUPPORT,
                      ROLES.PRINCIPAL,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const countMap = new Map(
      memberCounts.map((item) => [
        String(item._id),
        item,
      ])
    );

    const organizations = orgs.map((org) => {
      const counts =
        countMap.get(String(org._id)) || {
          members: 0,
          students: 0,
          staff: 0,
        };

      return {
        ...org,

        membersCount: counts.members,
        studentsCount: counts.students,
        staffCount: counts.staff,
      };
    });

    return res.json({
      success: true,
      data: organizations,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (err) {
    console.error(
      "Get Orgs Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch organizations",
    });
  }
};

//
// GET SINGLE ORGANIZATION
// Uses publicId instead of Mongo _id
//
export const getOrganization = async (
  req,
  res
) => {
  try {
    const { publicId } = req.params;

    const org = await Organization.findOne({
      publicId,
      isDeleted: false,
    }).lean();

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      String(org._id) !==
        String(req.user.instituteId) &&
      String(org.owner) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const counts = await User.aggregate([
      {
        $match: {
          instituteId: org._id,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,

          members: {
            $sum: 1,
          },

          students: {
            $sum: {
              $cond: [
                { $eq: ["$role", ROLES.STUDENT] },
                1,
                0,
              ],
            },
          },

          staff: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$role",
                    [
                      ROLES.TEACHER,
                      ROLES.EMPLOYEE,
                      ROLES.HR,
                      ROLES.ACCOUNTANT,
                      ROLES.COUNSELOR,
                      ROLES.SUPPORT,
                      ROLES.PRINCIPAL,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = counts[0] || {
      members: 0,
      students: 0,
      staff: 0,
    };

    return res.json({
      success: true,

      data: {
        ...org,

        membersCount: stats.members,
        studentsCount: stats.students,
        staffCount: stats.staff,
      },
    });
  } catch (err) {
    console.error(
      "Get Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch organization",
    });
  }
};

//
// UPDATE ORGANIZATION
//
export const updateOrganization = async (
  req,
  res
) => {
  try {
    const userId =
      req.user._id;

    const { publicId } =
      req.params;

    const match = {
      publicId,
    };

    if (
      req.user.role !==
      "super_admin"
    ) {
      match.$or = [
        {
          _id:
            req.user.instituteId,
        },
        {
          owner: userId,
        },
      ];
    }

    const org =
      await Organization.findOne(
        match
      );

    if (!org) {
      return res.status(404).json({
        success: false,
        message:
          "Organization not found or unauthorized",
      });
    }

    // plan/planExpiresAt are owned by the Subscription record
    // (POST /subscriptions/override); website/logo live under branding.
    const SUPER_ADMIN_FIELDS = [
      "name",
      "description",
      "contact",
      "meta",
      "settings",
      "status",
      "type",
    ];

    const ADMIN_FIELDS = [
      "description",
      "contact",
      "meta",
      "settings",
    ];

    if (
      req.user.role === "super_admin" &&
      req.body.plan !== undefined &&
      req.body.plan !== org.plan
    ) {
      return res.status(400).json({
        success: false,
        code: "PLAN_CHANGE_VIA_SUBSCRIPTION",
        message:
          "Change the plan through the organization's subscription (Billing → Manage subscription)",
      });
    }

    const allowedFields =
      req.user.role ===
      "super_admin"
        ? SUPER_ADMIN_FIELDS
        : ADMIN_FIELDS;

    const attemptedForbidden =
      req.user.role ===
      "super_admin"
        ? []
        : [
            "name",
            "type",
            "plan",
            "status",
          ].filter(
            (field) =>
              req.body[field] !==
                undefined &&
              req.body[field] !==
                org[field]
          );

    if (
      attemptedForbidden.length
    ) {
      return res.status(403).json({
        success: false,
        message:
          `You do not have permission to change: ${attemptedForbidden.join(", ")}`,
      });
    }

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        org[field] =
          req.body[field];
      }
    }

    for (const field of ["website", "logo"]) {
      if (req.body[field] !== undefined) {
        org.set(`branding.${field}`, req.body[field] || null);
      }
    }

    org.updatedBy =
      userId;

    await org.save();

    return res.json({
      success: true,
      data: org,
    });
  } catch (err) {
    console.error(
      "Update Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update organization",
    });
  }
};

//
// SOFT DELETE ORGANIZATION
//
export const deleteOrganization = async (
  req,
  res
) => {
  try {
    const {
      publicId,
    } = req.params;

    if (
      req.user.role !==
      "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only a super admin can delete organizations",
      });
    }

    const org =
      await Organization.findOne({
        publicId,
      });

    if (!org) {
      return res.status(404).json({
        success: false,
        message:
          "Organization not found or unauthorized",
      });
    }

    await org.softDelete(null, req.user._id);

    return res.json({
      success: true,
      message:
        "Organization deleted successfully",
    });
  } catch (err) {
    console.error(
      "Delete Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete organization",
    });
  }
};

//
// RESTORE ORGANIZATION (super_admin)
// Members regain access at once: authenticate only checks the org.
export const restoreOrganization = async (
  req,
  res
) => {
  try {
    const org = await Organization.findOne({
      publicId: req.params.publicId,
      isDeleted: true,
      includeDeleted: true,
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Deleted organization not found",
      });
    }

    await org.restore(req.user._id);

    return res.json({
      success: true,
      message: "Organization restored",
      data: org,
    });
  } catch (err) {
    console.error(
      "Restore Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restore organization",
    });
  }
};
