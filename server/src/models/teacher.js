import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  subject: { type: String, required: true },
  qualifications: { type: String },
  experience: { type: Number }, // in years
}, { timestamps: true });

export default mongoose.model("Teacher", teacherSchema);
