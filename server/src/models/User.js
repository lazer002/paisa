import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["super_admin", "admin", "teacher", "student", "hr"], 
    default: "student" 
  },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
