// src/controllers/organizationController.js

import Organization from "../models/organization.js";

//
// CREATE ORGANIZATION
//
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

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    const exists = await Organization.findOne({
      name,
      owner: userId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Organization with this name already exists",
      });
    }

    const org = await Organization.create({
      name,
      type,
      description,
      contact,
      website,
      logo,
      meta,
      owner: userId,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      data: org,
    });
  } catch (err) {
    console.error(
      "Create Org Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
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

    const query =
      scopeQueryForUser(req.user);

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

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const limitNumber =
      Math.min(
        Math.max(
          Number(limit) || 10,
          1
        ),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [orgs, total] =
      await Promise.all([
        Organization.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber),

        Organization.countDocuments(
          query
        ),
      ]);

    return res.json({
      success: true,
      data: orgs,
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
    const { publicId } =
      req.params;

    const org =
      await Organization.findOne({
        publicId,
      });

    if (!org) {
      return res.status(404).json({
        success: false,
        message:
          "Organization not found",
      });
    }

    if (
      req.user.role !==
        "super_admin" &&
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

    return res.json({
      success: true,
      data: org,
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