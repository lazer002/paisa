import mongoose from "mongoose";
import slugify from "slugify";
import { getNextSequence } from "../utils/sequence.js";

const organizationSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
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
      index: true,
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
      type: String, // cloudinary / s3 URL
    },

    website: {
      type: String,
      trim: true,
    },

    // 🔑 Public Identifier
    orgCode: {
      type: String,
      unique: true,
      index: true,
    },

    // 🔹 Contact Info
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

    // 👤 Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 👥 Organization Members Count (fast analytics)
    membersCount: {
      type: Number,
      default: 1,
    },

    // 🔹 Metadata (Flexible by type)
    meta: {
      industry: String,
      registrationNo: String,
      gstNumber: String,
      board: String,
      affiliationNo: String,
      establishedYear: Number,
    },

    // 💰 Subscription / Plan (future SaaS billing)
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
      index: true,
    },

    planExpiresAt: Date,

    // ⚙️ Settings (feature toggles)
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

    // 🔒 Status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    // 🗑️ Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,

    // 📊 Audit Fields
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

//
// 🔥 INDEXES (Performance + Constraints)
//

// prevent duplicate org name per owner
organizationSchema.index({ name: 1, owner: 1 }, { unique: true });

// fast filtering
organizationSchema.index({ owner: 1, type: 1 });

// text search
organizationSchema.index({
  name: "text",
  description: "text",
});

// slug uniqueness safety
organizationSchema.index({ slug: 1 }, { unique: true });

//
// 🎯 PRE-SAVE HOOKS
//

// generate slug
organizationSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// generate org code
organizationSchema.pre("save", async function (next) {
  if (this.isNew && !this.orgCode) {
    const seq = await getNextSequence("Organization");
    this.orgCode = `ORG-${String(seq).padStart(5, "0")}`;
  }
  next();
});

//
// 🛡️ GLOBAL QUERY FILTER (hide deleted)
//
organizationSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

//
// 🔍 INSTANCE METHODS
//

organizationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

//
// 🔄 STATIC METHODS
//

organizationSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug });
};

//
// 📤 CLEAN RESPONSE
//
organizationSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

//
// ✅ EXPORT SAFE
//
export default mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);