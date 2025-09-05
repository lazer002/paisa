import Institute from "../models/institute.js";
import User from "../models/user.js";

export const createInstitute = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone, ownerId } = req.body;

    // check if owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== "admin") {
      return res.status(400).json({ message: "Invalid institute owner" });
    }

    const institute = await Institute.create({
      name,
      type,
      address,
      contactEmail,
      contactPhone,
      owner: owner._id,
    });

    res.status(201).json({ message: "Institute created", institute });
  } catch (err) {
    console.error("Create institute error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().populate("owner", "name email");
    res.json(institutes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findById(id)
      .populate("owner", "name email")
      .populate("teachers", "name email")
      .populate("students", "name email");

    if (!institute) return res.status(404).json({ message: "Not found" });

    res.json(institute);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

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

export const deleteInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    await Institute.findByIdAndDelete(id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
