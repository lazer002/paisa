import Organization from "../models/organization.js";

//
// ✅ CREATE ORGANIZATION
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

    // 🔒 validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    // ❌ prevent duplicate (per user)
    const exists = await Organization.findOne({
      name,
      owner: userId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Organization with this name already exists",
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
    console.error("Create Org Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create organization",
    });
  }
};

//
// 🔐 SCOPING HELPERS — multi-tenant isolation
//
// super_admin → platform-wide (all orgs)
// admin/staff → ONLY the org they belong to (instituteId)
//
const scopeQueryForUser = (user) => {
  const query = {};

  if (user.role === "super_admin") {
    return query; // sees everything
  }

  if (!user.instituteId) {
    // User not linked to any org → they own nothing platform-wide
    query.owner = user._id;
    return query;
  }

  // Admin/staff: their org only — whether they created it or were assigned to it
  query.$or = [
    { _id: user.instituteId },
    { owner: user._id },
  ];

  return query;
};

//
// 📥 GET ALL ORGANIZATIONS (with filters)
//
export const getOrganizations = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      page = 1,
      limit = 10,
      search = "",
      type,
      status,
    } = req.query;

    const query = scopeQueryForUser(req.user);

    if (type) query.type = type;
    if (status) query.status = status;

    // 🔍 text search
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [orgs, total] = await Promise.all([
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Organization.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: orgs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get Orgs Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
    });
  }
};

//
// 🔍 GET SINGLE ORGANIZATION (by ID or slug)
//
export const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    let org;

    // check if ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      org = await Organization.findById(id);
    } else {
      org = await Organization.findOne({ slug: id });
    }

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 🔒 Multi-tenant isolation: admins/staff can only view their own org
    if (
      req.user.role !== "super_admin" &&
      String(org._id) !== String(req.user.instituteId) &&
      String(org.owner) !== String(req.user._id)
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
    console.error("Get Org Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organization",
    });
  }
};

//
// ✏️ UPDATE ORGANIZATION
//
export const updateOrganization = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // 🔒 Admins can only update their OWN org; super_admin any
    const match = { _id: id };
    if (req.user.role !== "super_admin") {
      match.$or = [
        { _id: req.user.instituteId },
        { owner: userId },
      ];
    }

    const org = await Organization.findOne(match);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or unauthorized",
      });
    }

    // 🔒 Field-level permissions:
    // super_admin → everything (name, type, plan, status, …)
    // admin       → profile fields of their OWN org only
    //             (cannot rename, re-type, upgrade plan, or self-approve status)
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
      req.user.role === "super_admin" ? SUPER_ADMIN_FIELDS : ADMIN_FIELDS;

    // Only reject if the admin actually CHANGED a protected value —
    // sending back unchanged values (normal form submit) is fine
    const attemptedForbidden =
      req.user.role === "super_admin"
        ? []
        : ["name", "type", "plan", "status"].filter(
            (f) => req.body[f] !== undefined && req.body[f] !== org[f]
          );

    if (attemptedForbidden.length > 0) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to change: ${attemptedForbidden.join(", ")}`,
      });
    }

    // update only allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        org[field] = req.body[field];
      }
    });

    org.updatedBy = userId;

    await org.save();

    return res.json({
      success: true,
      data: org,
    });
  } catch (err) {
    console.error("Update Org Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update organization",
    });
  }
};

//
// 🗑️ SOFT DELETE ORGANIZATION (platform-level action)
//
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔒 Deleting an organization is a super_admin power —
    // an admin must not destroy the org they manage.
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only a super admin can delete organizations",
      });
    }

    const org = await Organization.findOne({ _id: id });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or unauthorized",
      });
    }

    await org.softDelete();

    return res.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (err) {
    console.error("Delete Org Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete organization",
    });
  }
};