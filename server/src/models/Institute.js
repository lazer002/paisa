import mongoose from "mongoose";

const instituteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["school", "college", "coaching", "company"] },
  address: { type: String },
  contactEmail: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

export default mongoose.model("Institute", instituteSchema);
