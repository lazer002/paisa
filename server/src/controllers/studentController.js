import Student from "../models/student.js";
import { User, Roles } from "../models/user.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";
import { scopedQuery } from "../utils/peopleHelpers.js";

// Create student profile — super_admin, admin, teacher
export const createStudent = async (req, res) => {
  try {
    const { userId, enrollmentNumber, course, year } = req.body;

    if (!userId || !enrollmentNumber) {
      return sendError(res, 400, "userId and enrollmentNumber are required");
    }

    const user = await User.findById(userId).lean();
    if (!user) return sendError(res, 404, "User not found");
    if (user.role !== Roles.STUDENT) {
      return sendError(res, 400, "The linked user must have the student role");
    }

    // Institute context: actor's own org (super_admin may use the user's org)
    const instituteId =
      req.user.role === Roles.SUPER_ADMIN ? user.instituteId : req.user.instituteId;

    if (!instituteId) {
      return sendError(res, 400, "Institute context required");
    }

    const student = await Student.create({
      userId,
      instituteId,
      enrollmentNumber,
      course,
      year,
    });

    sendCreated(res, "Student created", student);
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(res, 400, "Enrollment number already exists");
    }
    console.error("Create student error:", err);
    sendError(res, 500, "Server error");
  }
};

// Get students — scoped: super_admin all, others their own org only
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find(scopedQuery(req.user))
      .populate("userId", "name email userCode")
      .populate("instituteId", "name type")
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, "Students fetched", students);
  } catch (err) {
    console.error("Get students error:", err);
    sendError(res, 500, "Server error");
  }
};
