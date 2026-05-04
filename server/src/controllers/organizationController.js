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

    const query = {
      owner: userId,
    };

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

    const org = await Organization.findOne({
      _id: id,
      owner: userId,
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or unauthorized",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "contact",
      "website",
      "logo",
      "meta",
      "settings",
      "status",
    ];

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
// 🗑️ SOFT DELETE ORGANIZATION
//
export const deleteOrganization = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const org = await Organization.findOne({
      _id: id,
      owner: userId,
    });

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