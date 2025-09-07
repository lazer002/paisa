import Institute from "../models/institute.js";
import {User} from "../models/user.js";
import { getNextSequence } from "../utils/sequence.js"; // 👈 import sequence helper

// 👉 Create Institute
export const createInstitute = async (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone, ownerId } = req.body;

    // check if owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== "admin") {
      return res.status(400).json({ message: "Invalid institute owner" });
    }

    // generate unique institute code
    const seqNum = await getNextSequence("instituteId");
    const instituteCode = `INST-${seqNum.toString().padStart(4, "0")}`;

    const institute = await Institute.create({
      name,
      type,
      address,
      contactEmail,
      contactPhone,
      owner: owner._id,
      instituteCode, // 👈 new field
    });

    res.status(201).json({ message: "Institute created", institute });
  } catch (err) {
    console.error("Create institute error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Get all institutes
export const getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find()
      .populate("owner", "name email role")
      .populate("teachers", "name email")
      .populate("students", "name email");

    res.json(institutes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👉 Get institute by ID
export const getInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findById(id)
      .populate("owner", "name email role")
      .populate("teachers", "name email")
      .populate("students", "name email");

    if (!institute) return res.status(404).json({ message: "Not found" });

    res.json(institute);
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
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
