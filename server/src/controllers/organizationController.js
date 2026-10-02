// src/controllers/organizationController.js


import slugify from "slugify";

import Organization from "../models/organization.js";
import { User } from "../models/User.js";
import { ROLES } from "../config/constants.js";
import { hashPassword } from "../utils/password.js";

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
      website,
      logo,
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

    if (type) {
      query.type = type;
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

    const [orgs, total] = await Promise.all([
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Organization.countDocuments(query),
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

    const SUPER_ADMIN_FIELDS = [
      "name",
      "description",
      "contact",
      "website",
      "logo",
      "meta",
      "settings",
      "status",
      "type",
      "plan",
      "planExpiresAt",
    ];

    const ADMIN_FIELDS = [
      "description",
      "contact",
      "website",
      "logo",
      "meta",
      "settings",
    ];

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

    await org.softDelete();

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