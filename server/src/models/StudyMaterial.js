// server/src/models/StudyMaterial.js

import mongoose from "mongoose";

const ALLOWED_ROLES = [
  "admin",
  "teacher",
  "student",
  "hr",
  "employee",
];

const studyMaterialSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* TENANCY                                                                 */
    /* ---------------------------------------------------------------------- */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* CONTENT                                                                 */
    /* ---------------------------------------------------------------------- */

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title is too short"],
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    subject: {
      type: String,
      trim: true,
      maxlength: 150,
      index: true,
      default: null,
    },

    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 50,
        },
      ],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= 30,
        message: "A material cannot have more than 30 tags",
      },
    },

    type: {
      type: String,
      enum: {
        values: [
          "pdf",
          "video",
          "document",
          "link",
          "image",
          "presentation",
          "audio",
          "other",
        ],
        message: "Invalid material type",
      },
      default: "other",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* SOURCE                                                                  */
    /* ---------------------------------------------------------------------- */

    url: {
      type: String,
      required: [true, "Material URL is required"],
      trim: true,
      maxlength: 2048,
    },

    storageProvider: {
      type: String,
      enum: [
        "external",
        "s3",
        "cloudinary",
        "local",
      ],
      default: "external",
    },

    fileMeta: {
      sizeBytes: {
        type: Number,
        min: 0,
        max: 5 * 1024 * 1024 * 1024,
        default: null,
      },

      mimeType: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      pages: {
        type: Number,
        min: 0,
        default: null,
      },

      durationMinutes: {
        type: Number,
        min: 0,
        default: null,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ACCESS CONTROL                                                          */
    /* ---------------------------------------------------------------------- */

    visibility: {
      type: String,
      enum: [
        "class_only",
        "institute",
        "public",
      ],
      default: "class_only",
      index: true,
    },

    allowedRoles: {
      type: [
        {
          type: String,
          enum: ALLOWED_ROLES,
        },
      ],
      default: [],
    },

    downloadable: {
      type: Boolean,
      default: true,
    },

    availableFrom: {
      type: Date,
      default: null,
      index: true,
    },

    availableUntil: {
      type: Date,
      default: null,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* ANALYTICS                                                              */
    /* ---------------------------------------------------------------------- */

    analytics: {
      views: {
        type: Number,
        min: 0,
        default: 0,
      },

      downloads: {
        type: Number,
        min: 0,
        default: 0,
      },

      uniqueViewers: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastViewedAt: {
        type: Date,
        default: null,
      },

      lastDownloadedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* LIFECYCLE / AUDIT                                                       */
    /* ---------------------------------------------------------------------- */

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.index({
  instituteId: 1,
  classId: 1,
});

studyMaterialSchema.index({
  instituteId: 1,
  subject: 1,
});

studyMaterialSchema.index({
  instituteId: 1,
  type: 1,
});

studyMaterialSchema.index({
  instituteId: 1,
  visibility: 1,
  isArchived: 1,
});

studyMaterialSchema.index({
  instituteId: 1,
  uploadedBy: 1,
  createdAt: -1,
});

studyMaterialSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.pre("validate", function (next) {
  if (
    this.availableFrom &&
    this.availableUntil &&
    this.availableUntil < this.availableFrom
  ) {
    return next(
      new Error(
        "availableUntil cannot be earlier than availableFrom"
      )
    );
  }

  if (
    this.visibility === "class_only" &&
    !this.classId
  ) {
    return next(
      new Error(
        "A class is required for class-only materials"
      )
    );
  }

  if (
    this.visibility === "public" &&
    this.allowedRoles?.length
  ) {
    this.allowedRoles = [];
  }

  if (
    this.isArchived &&
    !this.archivedAt
  ) {
    this.archivedAt = new Date();
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
    });
  };

studyMaterialSchema.query.active =
  function () {
    return this.where({
      isArchived: false,
    });
  };

studyMaterialSchema.query.byClass =
  function (classId) {
    return this.where({
      classId,
    });
  };

studyMaterialSchema.query.bySubject =
  function (subject) {
    return this.where({
      subject,
    });
  };

/* -------------------------------------------------------------------------- */
/* Virtuals                                                                   */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.virtual("isAvailable").get(
  function () {
    const now = new Date();

    if (
      this.availableFrom &&
      now < this.availableFrom
    ) {
      return false;
    }

    if (
      this.availableUntil &&
      now > this.availableUntil
    ) {
      return false;
    }

    return !this.isArchived;
  }
);

/* -------------------------------------------------------------------------- */
/* Analytics methods                                                          */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.methods.recordView =
  async function (unique = false) {
    this.analytics =
      this.analytics || {};

    this.analytics.views =
      (this.analytics.views || 0) + 1;

    this.analytics.lastViewedAt =
      new Date();

    if (unique) {
      this.analytics.uniqueViewers =
        (this.analytics.uniqueViewers || 0) + 1;
    }

    return this.save();
  };

studyMaterialSchema.methods.recordDownload =
  async function () {
    this.analytics =
      this.analytics || {};

    this.analytics.downloads =
      (this.analytics.downloads || 0) + 1;

    this.analytics.lastDownloadedAt =
      new Date();

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* Archive methods                                                            */
/* -------------------------------------------------------------------------- */

studyMaterialSchema.methods.archive =
  async function (userId = null) {
    this.isArchived = true;
    this.archivedAt = new Date();

    if (userId) {
      this.archivedBy = userId;
      this.updatedBy = userId;
    }

    return this.save();
  };

studyMaterialSchema.methods.restore =
  async function (userId = null) {
    this.isArchived = false;
    this.archivedAt = null;
    this.archivedBy = null;

    if (userId) {
      this.updatedBy = userId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const StudyMaterial =
  mongoose.models.StudyMaterial ||
  mongoose.model(
    "StudyMaterial",
    studyMaterialSchema
  );

export default StudyMaterial;