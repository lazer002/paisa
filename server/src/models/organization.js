import mongoose from "mongoose";
import slugify from "slugify";
import { getNextSequence } from "../utils/sequence.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ORGANIZATION — tenant root for the entire platform
 * ═══════════════════════════════════════════════════════════════════════════
 *  Sections:
 *    1. Identity          5. Branding
 *    2. Contact           6. Compliance & documents
 *    3. Subscription      7. Settings & limits
 *    4. Meta (industry)   8. Stats cache & audit
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ORG_TYPES = ["school", "college", "coaching", "company", "institute", "startup", "ngo", "others"];

const organizationSchema = new mongoose.Schema(
  {
    // ── 1. IDENTITY ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: [2, "Name too short"],
      maxlength: [100, "Name too long"],
    },

    slug: { type: String, unique: true, index: true },

    type: {
      type: String,
      enum: { values: ORG_TYPES, message: "Invalid organization type" },
      required: true,
      index: true,
    },

    orgCode: { type: String, unique: true, index: true },

    description: { type: String, trim: true, maxlength: 1000 },

    // ── 2. CONTACT ───────────────────────────────────────────────────────────
    contact: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      },
      phone: { type: String, trim: true, match: [/^[0-9]{10,15}$/, "Invalid phone number"] },
      address: { type: String, trim: true, maxlength: 300 },
      city: { type: String, trim: true, index: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
      pincode: { type: String, trim: true },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // quick-access admin list

    membersCount: { type: Number, default: 1 },

    // ── 3. SUBSCRIPTION & BILLING ────────────────────────────────────────────
    plan: {
      type: String,
      enum: { values: ["free", "pro", "enterprise"], message: "Invalid plan" },
      default: "free",
      index: true,
    },

    planExpiresAt: { type: Date, default: null },
    billing: {
      cycle: { type: String, enum: ["monthly", "yearly", null], default: null },
      currency: { type: String, default: "INR" },
      pricePaid: { type: Number, default: 0 },
      lastInvoiceAt: { type: Date, default: null },
      paymentMethod: { type: String, default: null },
      billingEmail: { type: String, trim: true, default: null },
    },

    // ── 4. META (industry details) ───────────────────────────────────────────
    meta: {
      industry: { type: String, trim: true },
      registrationNo: { type: String, trim: true },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$|^\s*$/, "Invalid GST number"],
      },
      board: { type: String, trim: true }, // education: CBSE / ICSE / State
      affiliationNo: { type: String, trim: true },
      establishedYear: { type: Number, min: 1800, max: 2100 },
      employeeRange: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", null],
        default: null,
      },
      annualRevenue: { type: String, trim: true, default: null },
    },

    // ── 5. BRANDING ──────────────────────────────────────────────────────────
    branding: {
      logo: { type: String, default: null },
      banner: { type: String, default: null },
      primaryColor: { type: String, default: "#111111" },
      website: { type: String, trim: true },
      socialLinks: {
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null },
        instagram: { type: String, default: null },
        facebook: { type: String, default: null },
      },
    },

    // ── 6. COMPLIANCE & DOCUMENTS ────────────────────────────────────────────
    documents: [
      {
        _id: false,
        type: {
          type: String,
          enum: ["registration", "gst_certificate", "affiliation", "moa", "other"],
        },
        name: String,
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    verification: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      notes: { type: String, default: null },
    },

    // ── 7. SETTINGS & LIMITS ─────────────────────────────────────────────────
    settings: {
      allowPublicJoin: { type: Boolean, default: false },
      requireApproval: { type: Boolean, default: true },
      maxMembers: { type: Number, default: 50 },
      maxStorageMb: { type: Number, default: 1024 },
      features: {
        payroll: { type: Boolean, default: true },
        attendance: { type: Boolean, default: true },
        lms: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
      },
      academicYearStarts: { type: String, default: null }, // e.g. "April"
      weeklyOffs: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
    },

    status: {
      type: String,
      enum: { values: ["active", "inactive", "suspended"], message: "Invalid status" },
      default: "active",
      index: true,
    },

    // ── 8. STATS CACHE (denormalized for dashboards) ─────────────────────────
    stats: {
      totalUsers: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      totalStaff: { type: Number, default: 0 },
      totalClasses: { type: Number, default: 0 },
      activeDepartments: { type: Number, default: 0 },
      lastComputedAt: { type: Date, default: null },
    },

    // ── AUDIT & LIFECYCLE ────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletionReason: { type: String, maxlength: 300, default: null },
  },
  { timestamps: true, versionKey: false }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
organizationSchema.index({ name: 1, owner: 1 }, { unique: true });
organizationSchema.index({ owner: 1, type: 1 });
organizationSchema.index({ name: "text", description: "text" });
organizationSchema.index({ "contact.city": 1, type: 1 });

// ── Hooks ────────────────────────────────────────────────────────────────────
organizationSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

organizationSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.orgCode) {
      const seq = await getNextSequence("Organization");
      this.orgCode = `ORG-${String(seq).padStart(5, "0")}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Hide soft-deleted orgs from every query
organizationSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// ── Methods ──────────────────────────────────────────────────────────────────
organizationSchema.methods.softDelete = function (reason = null, byUserId = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletionReason = reason;
  if (byUserId) this.updatedBy = byUserId;
  return this.save();
};

organizationSchema.methods.findBySlug = function (slug) {
  return this.constructor.findOne({ slug });
};

organizationSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
