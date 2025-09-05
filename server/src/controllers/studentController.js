import Student from "../models/student.js";
import User from "../models/user.js";

export const createStudent = async (req, res) => {
  try {
    const { userId, instituteId, enrollmentNumber, course, year } = req.body;

    const student = await Student.create({
      userId,
      instituteId,
      enrollmentNumber,
      course,
      year
    });

    res.status(201).json({ message: "Student created", student });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "name email")
      .populate("instituteId", "name type");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
