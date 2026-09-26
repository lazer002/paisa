import mongoose from "mongoose";
import slugify from "slugify";
import { getNextSequence } from "../utils/sequence.js";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      unique: true,
    },

    type: {
      type: String,
      enum: [
        "school",
        "college",
        "coaching",
        "company",
        "institute",
        "startup",
        "ngo",
        "others",
      ],
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    logo: {
      type: String,
    },

    website: {
      type: String,
      trim: true,
    },

    orgCode: {
      type: String,
      unique: true,
      index: true,
    },

    contact: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      },

      phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,15}$/, "Invalid phone number"],
      },

      address: {
        type: String,
        trim: true,
        maxlength: 300,
      },

      city: String,
      state: String,

      country: {
        type: String,
        default: "India",
      },

      pincode: String,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    membersCount: {
      type: Number,
      default: 1,
    },

    meta: {
      industry: String,
      registrationNo: String,
      gstNumber: String,
      board: String,
      affiliationNo: String,
      establishedYear: Number,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
      index: true,
    },

    planExpiresAt: Date,

    settings: {
      allowPublicJoin: {
        type: Boolean,
        default: false,
      },

      requireApproval: {
        type: Boolean,
        default: true,
      },

      maxMembers: {
        type: Number,
        default: 50,
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance indexes
organizationSchema.index(
  { name: 1, owner: 1 },
  { unique: true }
);

organizationSchema.index({
  owner: 1,
  type: 1,
});

organizationSchema.index({
  name: "text",
  description: "text",
});

// REMOVED duplicate slug index.
// `unique: true` on slug already creates the index.

// Generate slug
organizationSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }

  next();
});

// Generate organization code
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

// Hide deleted organizations
organizationSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// Soft delete
organizationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

// Find by slug
organizationSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug });
};

// Clean response
organizationSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);