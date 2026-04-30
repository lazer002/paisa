import Institute from "../models/institute.js";
import {User} from "../models/user.js";

// 👉 Create Institute
export const createInstitute = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone } = req.body;

    // 🔒 Basic validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    // 🔒 Prevent admin from creating multiple institutes (optional rule)
    if (req.user.role === "admin" && req.user.instituteId) {
      return res.status(400).json({
        success: false,
        message: "Admin already owns an institute",
      });
    }

    // 🔥 Create institute (code auto-generated in schema)
    const institute = await Institute.create({
      name,
      type,
      address,
      contactEmail,
      contactPhone,
      owner: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      instituteId: institute._id,
    });

    res.status(201).json({
      success: true,
      message: "Institute created successfully",
      data: institute,
    });
  } catch (err) {
    console.error("Create institute error:", err);

    // 🔥 Handle duplicate errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Institute already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 👉 Get all institutes
export const getInstitutes = async (req, res) => {
  try {
    let query = {};

    // 🔥 Admin sees only their institute
    if (req.user.role === "admin") {
      query.owner = req.user._id;
    }

    const institutes = await Institute.find(query);

    res.json({
      success: true,
      data: institutes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// 👉 Get institute by ID
export const getInstituteById = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);

    if (!institute) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔥 Admin can only access own institute
    if (
      req.user.role === "admin" &&
      institute.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ success: true, data: institute });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Update institute
export const updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const institute = await Institute.findByIdAndUpdate(id, updates, { new: true });
    if (!institute) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Updated successfully", institute });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Delete institute
export const deleteInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    await Institute.findByIdAndDelete(id);

    if (!institute) {
  return res.status(404).json({ message: "Not found" });
}

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
