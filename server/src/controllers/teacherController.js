import Teacher from "../models/teacher.js";
import User from "../models/user.js";

export const createTeacher = async (req, res) => {
  try {
    const { userId, instituteId, subject, qualifications, experience } = req.body;

    const teacher = await Teacher.create({
      userId,
      instituteId,
      subject,
      qualifications,
      experience
    });

    res.status(201).json({ message: "Teacher created", teacher });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("userId", "name email")
      .populate("instituteId", "name type");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
