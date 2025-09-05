import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  enrollmentNumber: { type: String, unique: true },
  course: { type: String, required: true },
  year: { type: Number }, // e.g., 1st year, 2nd year
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
