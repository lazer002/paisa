import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js";

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["school", "college", "coaching", "company"],
      required: true,
    },

    orgCode: { type: String, unique: true },

    address: String,
    contactEmail: { type: String, lowercase: true },
    contactPhone: String,

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    meta: {
      industry: String,
      registrationNo: String,
      board: String,
      affiliationNo: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// 🔥 indexes
instituteSchema.index({ owner: 1 });
instituteSchema.index({ type: 1 });

// 🎯 Auto code
instituteSchema.pre("save", async function (next) {
  if (this.isNew && !this.orgCode) {
    const seq = await getNextSequence("Institute");
    this.orgCode = `ORG-${String(seq).padStart(4, "0")}`;
  }
  next();
});

// ✅ FIX overwrite error
export default mongoose.models.Institute ||
  mongoose.model("Institute", instituteSchema);