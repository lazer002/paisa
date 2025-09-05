import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js"; // 🔑 helper for sequential IDs

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    type: {
      type: String,
      enum: ["school", "college", "coaching", "company"],
      required: true,
    },

    // 🔑 Unique Institute Code
    instituteCode: { type: String, unique: true },

    address: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },

    // 👤 The owner (main admin / institute owner)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🏫 Educational roles
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 🏢 Company roles
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    hrManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 🔧 Dynamic meta (only required fields per type)
    meta: {
      industry: { type: String },        // company
      registrationNo: { type: String },  // company
      board: { type: String },           // school/college
      affiliationNo: { type: String },   // school/college
    },

    // ✅ Active / Inactive
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// 🎯 Auto-generate instituteCode like INST-0001, INST-0002
instituteSchema.pre("save", async function (next) {
  if (this.isNew && !this.instituteCode) {
    const seq = await getNextSequence("Institute");
    this.instituteCode = `INST-${String(seq).padStart(4, "0")}`;
  }
  next();
});

// 🧩 Auto-population middleware (optional)
instituteSchema.pre(/^find/, function (next) {
  this.populate("owner", "name email role");
  next();
});

export default mongoose.model("Institute", instituteSchema);
