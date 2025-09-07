import { User, Roles } from "../models/user.js";

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, instituteId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const employee = await User.create({
      name,
      email,
      passwordHash: password, // password hashed in pre-save hook
      role: Roles.EMPLOYEE,
      instituteId: instituteId || null,
    });

    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (err) {
    console.error("Create Employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: Roles.EMPLOYEE }).populate("instituteId", "name type");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
