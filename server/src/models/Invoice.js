// server/src/models/EmployeeDocument.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const DOCUMENT_STATUSES = [
  "draft",
  "pending",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "expired",
  "archived",
  "cancelled",
];

const DOCUMENT_TYPES = [
  "identity",
  "address",
  "education",
  "experience",
  "employment",
  "joining",
  "contract",
  "salary",
  "bank",
  "tax",
  "insurance",
  "medical",
  "compliance",
  "background_check",
  "certificate",
  "license",
  "other",
];

const VERIFICATION_STATUSES = [
  "not_required",
  "pending",
  "verified",
  "rejected",
  "expired",
];

const VERIFICATION_METHODS = [
  "manual",
  "system",
  "api",
  "government",
  "employer",
  "employee",
  "other",
];

const VISIBILITY_LEVELS = [
  "private",
  "employee",
  "manager",
  "hr",
  "admin",
];

const approvalSchema = new mongoose.Schema(
  {
    required: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: "not_required",
    },

    method: {
      type: String,
      enum: VERIFICATION_METHODS,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    verificationReference: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const versionSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      min: 1,
      required: true,
    },

    fileName: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    fileUrl: {
      type: String,
      trim: true,
      maxlength: 3000,
      required: true,
    },

    storageKey: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    mimeType: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    fileSize: {
      type: Number,
      min: 0,
      default: null,
    },

    checksum: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    changeReason: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const accessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      enum: [
        "view",
        "download",
        "upload",
        "replace",
        "approve",
        "reject",
        "verify",
        "share",
        "delete",
      ],
      required: true,
    },

    accessedAt: {
      type: Date,
      default: Date.now,
    },

    ipHash: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    userAgentHash: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const employeeDocumentSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                                */
    /* ====================================================================== */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `inv_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    documentCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      index: true,
    },

    externalId: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    title: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: "other",
      index: true,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* EMPLOYEE                                                                */
    /* ====================================================================== */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employeeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* DOCUMENT STATUS                                                         */
    /* ====================================================================== */

    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: "draft",
      index: true,
    },

    required: {
      type: Boolean,
      default: false,
      index: true,
    },

    mandatoryForJoining: {
      type: Boolean,
      default: false,
    },

    /* ====================================================================== */
    /* FILE                                                                    */
    /* ====================================================================== */

    file: {
      fileName: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      originalName: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      fileUrl: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      storageKey: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      mimeType: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      fileSize: {
        type: Number,
        min: 0,
        default: null,
      },

      checksum: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      pageCount: {
        type: Number,
        min: 1,
        default: null,
      },
    },

    /* ====================================================================== */
    /* DOCUMENT NUMBER / DETAILS                                               */
    /* ====================================================================== */

    documentNumber: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    issuingAuthority: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    issuingCountry: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: null,
    },

    issueDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    issueLocation: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    /* ====================================================================== */
    /* VERIFICATION                                                            */
    /* ====================================================================== */

    verification: {
      type: verificationSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* APPROVAL                                                                */
    /* ====================================================================== */

    approval: {
      type: approvalSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* VERSIONS                                                                */
    /* ====================================================================== */

    currentVersion: {
      type: Number,
      min: 1,
      default: 1,
    },

    versions: {
      type: [versionSchema],
      default: [],
    },

    /* ====================================================================== */
    /* ACCESS CONTROL                                                          */
    /* ====================================================================== */

    visibility: {
      type: String,
      enum: VISIBILITY_LEVELS,
      default: "hr",
    },

    allowedUserIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    downloadable: {
      type: Boolean,
      default: true,
    },

    printable: {
      type: Boolean,
      default: false,
    },

    shareable: {
      type: Boolean,
      default: false,
    },

    /* ====================================================================== */
    /* ACCESS LOG                                                              */
    /* ====================================================================== */

    accessLogs: {
      type: [accessLogSchema],
      default: [],
    },

    accessCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    downloadCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastAccessedAt: {
      type: Date,
      default: null,
    },

    lastAccessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* REMINDERS                                                               */
    /* ====================================================================== */

    reminders: {
      enabled: {
        type: Boolean,
        default: true,
      },

      daysBeforeExpiry: {
        type: [
          {
            type: Number,
            min: 0,
            max: 3650,
          },
        ],
        default: [30, 7, 1],
      },

      lastReminderAt: {
        type: Date,
        default: null,
      },

      nextReminderAt: {
        type: Date,
        default: null,
        index: true,
      },

      reminderCount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* ====================================================================== */
    /* SOURCE                                                                  */
    /* ====================================================================== */

    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* TAGS / METADATA                                                         */
    /* ====================================================================== */

    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* AUDIT                                                                   */
    /* ====================================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
    /* ====================================================================== */

    archivedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    legalHold: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* ============================================================================
 * INDEXES
 * ========================================================================== */

employeeDocumentSchema.index(
  {
    instituteId: 1,
    documentCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_employee_document_code",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    type: 1,
    status: 1,
  },
  {
    name: "employee_documents",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    employeeUserId: 1,
    type: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "employee_user_documents",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    type: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "department_documents",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    type: 1,
    required: 1,
    status: 1,
  },
  {
    name: "required_document_types",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    expiryDate: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "document_expiry",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    "verification.status": 1,
    status: 1,
  },
  {
    name: "document_verification_queue",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    "approval.status": 1,
    status: 1,
  },
  {
    name: "document_approval_queue",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    "reminders.nextReminderAt": 1,
    "reminders.enabled": 1,
  },
  {
    sparse: true,
    name: "document_reminders",
  }
);

employeeDocumentSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_employee_documents",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

employeeDocumentSchema.pre(
  "validate",
  function (next) {
    if (
      this.issueDate &&
      this.expiryDate &&
      this.expiryDate <
        this.issueDate
    ) {
      return next(
        new Error(
          "Document expiry date cannot be before issue date"
        )
      );
    }

    if (
      this.versions.length >
      100
    ) {
      return next(
        new Error(
          "A document cannot contain more than 100 versions"
        )
      );
    }

    if (
      this.accessLogs.length >
      1000
    ) {
      this.accessLogs =
        this.accessLogs.slice(
          -1000
        );
    }

    if (
      this.allowedUserIds.length >
      1000
    ) {
      return next(
        new Error(
          "A document cannot have more than 1000 explicitly allowed users"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "A document cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.file.fileSize !==
        null &&
      this.file.fileSize <
        0
    ) {
      return next(
        new Error(
          "File size cannot be negative"
        )
      );
    }

    if (
      this.required &&
      !this.file.fileUrl &&
      this.status ===
        "approved"
    ) {
      return next(
        new Error(
          "An approved required document must contain a file"
        )
      );
    }

    if (
      this.verification.status ===
        "verified" &&
      !this.verification.verifiedAt
    ) {
      this.verification.verifiedAt =
        new Date();
    }

    if (
      this.status ===
        "archived" &&
      !this.archivedAt
    ) {
      this.archivedAt =
        new Date();
    }

    if (
      this.status ===
        "cancelled" &&
      !this.cancelledAt
    ) {
      this.cancelledAt =
        new Date();
    }

    if (
      this.isDeleted &&
      !this.deletedAt
    ) {
      this.deletedAt =
        new Date();
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

employeeDocumentSchema.virtual(
  "isExpired"
).get(function () {
  if (
    !this.expiryDate
  ) {
    return false;
  }

  return (
    this.expiryDate <
    new Date()
  );
});

employeeDocumentSchema.virtual(
  "expiresSoon"
).get(function () {
  if (
    !this.expiryDate
  ) {
    return false;
  }

  const now =
    Date.now();

  const expiry =
    this.expiryDate.getTime();

  const days =
    (
      expiry -
      now
    ) /
    (
      1000 *
      60 *
      60 *
      24
    );

  return (
    days >= 0 &&
    days <= 30
  );
});

employeeDocumentSchema.virtual(
  "hasFile"
).get(function () {
  return Boolean(
    this.file &&
      this.file.fileUrl
  );
});

employeeDocumentSchema.virtual(
  "isVerified"
).get(function () {
  return (
    this.verification.status ===
    "verified"
  );
});

employeeDocumentSchema.virtual(
  "isApproved"
).get(function () {
  return (
    this.approval.status ===
    "approved"
  );
});

employeeDocumentSchema.virtual(
  "versionCount"
).get(function () {
  return this.versions.length;
});

employeeDocumentSchema.virtual(
  "daysUntilExpiry"
).get(function () {
  if (
    !this.expiryDate
  ) {
    return null;
  }

  return Math.ceil(
    (
      this.expiryDate.getTime() -
      Date.now()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

employeeDocumentSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

employeeDocumentSchema.query.byEmployee =
  function (
    employeeId
  ) {
    return this.where({
      employeeId,
      isDeleted: false,
    });
  };

employeeDocumentSchema.query.active =
  function () {
    return this.where({
      status: {
        $nin: [
          "archived",
          "cancelled",
        ],
      },
      isDeleted: false,
    });
  };

employeeDocumentSchema.query.pendingApproval =
  function () {
    return this.where({
      "approval.status":
        "pending",
      isDeleted: false,
    });
  };

employeeDocumentSchema.query.pendingVerification =
  function () {
    return this.where({
      "verification.status":
        "pending",
      isDeleted: false,
    });
  };

employeeDocumentSchema.query.expired =
  function (
    date = new Date()
  ) {
    return this.where({
      expiryDate: {
        $lt: date,
      },
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

employeeDocumentSchema.methods.submit =
  async function () {
    if (
      !this.file.fileUrl
    ) {
      throw new Error(
        "A file is required before submitting the document"
      );
    }

    this.status =
      "submitted";

    if (
      this.uploadedAt ===
      null
    ) {
      this.uploadedAt =
        new Date();
    }

    return this.save();
  };

employeeDocumentSchema.methods.approve =
  async function ({
    approvedBy,
    comments = null,
  } = {}) {
    if (
      !approvedBy
    ) {
      throw new Error(
        "Approver is required"
      );
    }

    this.approval.required =
      true;

    this.approval.status =
      "approved";

    this.approval.approvedBy =
      approvedBy;

    this.approval.approvedAt =
      new Date();

    this.approval.comments =
      comments;

    this.approval.rejectedBy =
      null;

    this.approval.rejectedAt =
      null;

    this.approval.rejectionReason =
      null;

    this.status =
      "approved";

    return this.save();
  };

employeeDocumentSchema.methods.reject =
  async function ({
    rejectedBy,
    reason = null,
  } = {}) {
    if (
      !rejectedBy
    ) {
      throw new Error(
        "Rejecting user is required"
      );
    }

    this.approval.required =
      true;

    this.approval.status =
      "rejected";

    this.approval.rejectedBy =
      rejectedBy;

    this.approval.rejectedAt =
      new Date();

    this.approval.rejectionReason =
      reason;

    this.status =
      "rejected";

    return this.save();
  };

employeeDocumentSchema.methods.verify =
  async function ({
    verifiedBy,
    method = "manual",
    verificationReference = null,
    verificationNotes = null,
    expiresAt = null,
  } = {}) {
    if (
      !verifiedBy
    ) {
      throw new Error(
        "Verifier is required"
      );
    }

    this.verification.status =
      "verified";

    this.verification.method =
      method;

    this.verification.verifiedBy =
      verifiedBy;

    this.verification.verifiedAt =
      new Date();

    this.verification.expiresAt =
      expiresAt;

    this.verification.verificationReference =
      verificationReference;

    this.verification.verificationNotes =
      verificationNotes;

    this.verification.rejectionReason =
      null;

    return this.save();
  };

employeeDocumentSchema.methods.rejectVerification =
  async function ({
    verifiedBy,
    reason = null,
  } = {}) {
    if (
      !verifiedBy
    ) {
      throw new Error(
        "Verifier is required"
      );
    }

    this.verification.status =
      "rejected";

    this.verification.verifiedBy =
      verifiedBy;

    this.verification.verifiedAt =
      new Date();

    this.verification.rejectionReason =
      reason;

    return this.save();
  };

employeeDocumentSchema.methods.replaceFile =
  async function ({
    fileName,
    originalName = null,
    fileUrl,
    storageKey = null,
    mimeType = null,
    fileSize = null,
    checksum = null,
    pageCount = null,
    uploadedBy = null,
    reason = null,
  } = {}) {
    if (
      !fileName ||
      !fileUrl
    ) {
      throw new Error(
        "File name and file URL are required"
      );
    }

    const nextVersion =
      this.currentVersion +
      1;

    this.versions.push({
      version:
        this.currentVersion,
      fileName:
        this.file.fileName,
      fileUrl:
        this.file.fileUrl,
      storageKey:
        this.file.storageKey,
      mimeType:
        this.file.mimeType,
      fileSize:
        this.file.fileSize,
      checksum:
        this.file.checksum,
      uploadedBy:
        this.uploadedBy,
      uploadedAt:
        this.uploadedAt ||
        new Date(),
      changeReason:
        reason,
    });

    this.file.fileName =
      fileName;

    this.file.originalName =
      originalName;

    this.file.fileUrl =
      fileUrl;

    this.file.storageKey =
      storageKey;

    this.file.mimeType =
      mimeType;

    this.file.fileSize =
      fileSize;

    this.file.checksum =
      checksum;

    this.file.pageCount =
      pageCount;

    this.currentVersion =
      nextVersion;

    this.uploadedBy =
      uploadedBy;

    this.uploadedAt =
      new Date();

    this.status =
      "submitted";

    this.approval.status =
      this.approval.required
        ? "pending"
        : this.approval.status;

    this.verification.status =
      "not_required";

    return this.save();
  };

employeeDocumentSchema.methods.addVersion =
  async function ({
    fileName,
    fileUrl,
    storageKey = null,
    mimeType = null,
    fileSize = null,
    checksum = null,
    uploadedBy = null,
    changeReason = null,
  } = {}) {
    if (
      !fileName ||
      !fileUrl
    ) {
      throw new Error(
        "File name and file URL are required"
      );
    }

    const nextVersion =
      this.currentVersion +
      1;

    this.versions.push({
      version:
        nextVersion,
      fileName,
      fileUrl,
      storageKey,
      mimeType,
      fileSize,
      checksum,
      uploadedBy,
      uploadedAt:
        new Date(),
      changeReason,
    });

    this.currentVersion =
      nextVersion;

    this.file.fileName =
      fileName;

    this.file.fileUrl =
      fileUrl;

    this.file.storageKey =
      storageKey;

    this.file.mimeType =
      mimeType;

    this.file.fileSize =
      fileSize;

    this.file.checksum =
      checksum;

    this.uploadedBy =
      uploadedBy;

    this.uploadedAt =
      new Date();

    return this.save();
  };

employeeDocumentSchema.methods.recordAccess =
  async function ({
    userId = null,
    action = "view",
    ipHash = null,
    userAgentHash = null,
    metadata = null,
  } = {}) {
    if (
      action ===
        "download" &&
      !this.downloadable
    ) {
      throw new Error(
        "Document downloads are disabled"
      );
    }

    if (
      this.accessLogs.length >=
      1000
    ) {
      this.accessLogs =
        this.accessLogs.slice(
          -999
        );
    }

    this.accessLogs.push({
      userId,
      action,
      accessedAt:
        new Date(),
      ipHash,
      userAgentHash,
      metadata,
    });

    this.accessCount +=
      1;

    if (
      action ===
      "download"
    ) {
      this.downloadCount +=
        1;
    }

    this.lastAccessedAt =
      new Date();

    this.lastAccessedBy =
      userId;

    return this.save();
  };

employeeDocumentSchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      !normalized
    ) {
      throw new Error(
        "Tag is required"
      );
    }

    if (
      this.tags.includes(
        normalized
      )
    ) {
      return this;
    }

    if (
      this.tags.length >=
      100
    ) {
      throw new Error(
        "Maximum tag limit reached"
      );
    }

    this.tags.push(
      normalized
    );

    return this.save();
  };

employeeDocumentSchema.methods.removeTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    this.tags =
      this.tags.filter(
        (item) =>
          item !==
          normalized
      );

    return this.save();
  };

employeeDocumentSchema.methods.markExpired =
  async function () {
    if (
      !this.expiryDate ||
      this.expiryDate >
        new Date()
    ) {
      return this;
    }

    this.status =
      "expired";

    this.verification.status =
      "expired";

    return this.save();
  };

employeeDocumentSchema.methods.archive =
  async function () {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

employeeDocumentSchema.methods.cancel =
  async function () {
    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    return this.save();
  };

employeeDocumentSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

employeeDocumentSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Employee document is under legal hold"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.deletedBy =
      deletedBy;

    this.deletionReason =
      reason;

    return this.save();
  };

employeeDocumentSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    this.deletedBy =
      null;

    this.deletionReason =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

employeeDocumentSchema.statics.findByCode =
  function (
    instituteId,
    documentCode
  ) {
    return this.findOne({
      instituteId,
      documentCode:
        String(
          documentCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

employeeDocumentSchema.statics.findEmployeeDocuments =
  function (
    instituteId,
    employeeId,
    {
      type = null,
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      employeeId,
      isDeleted: false,
    };

    if (
      type
    ) {
      query.type =
        type;
    }

    if (
      status
    ) {
      query.status =
        status;
    }

    return this.find(
      query
    )
      .sort({
        required: -1,
        expiryDate: 1,
        createdAt: -1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.findExpiring =
  function (
    instituteId,
    beforeDate,
    limit = 100
  ) {
    const date =
      beforeDate ||
      new Date(
        Date.now() +
          30 *
            24 *
            60 *
            60 *
            1000
      );

    return this.find({
      instituteId,
      expiryDate: {
        $ne: null,
        $lte: date,
        $gte: new Date(),
      },
      status: {
        $nin: [
          "archived",
          "cancelled",
        ],
      },
      isDeleted: false,
    })
      .sort({
        expiryDate: 1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.findExpired =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      expiryDate: {
        $lt: new Date(),
      },
      status: {
        $ne: "archived",
      },
      isDeleted: false,
    })
      .sort({
        expiryDate: 1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.findPendingVerification =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "verification.status":
        "pending",
      isDeleted: false,
    })
      .sort({
        createdAt: 1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.findPendingApproval =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "approval.status":
        "pending",
      isDeleted: false,
    })
      .sort({
        createdAt: 1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.findRequiredDocuments =
  function (
    instituteId,
    employeeId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      employeeId,
      required: true,
      isDeleted: false,
      status: {
        $nin: [
          "approved",
          "archived",
          "cancelled",
        ],
      },
    })
      .sort({
        mandatoryForJoining: -1,
        type: 1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeDocumentSchema.statics.getEmployeeDocumentSummary =
  async function (
    instituteId,
    employeeId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            employeeId:
              new mongoose.Types.ObjectId(
                employeeId
              ),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            required: {
              $sum: {
                $cond: [
                  "$required",
                  1,
                  0,
                ],
              },
            },

            approved: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "approved",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      [
                        "pending",
                        "submitted",
                        "under_review",
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            expired: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "expired",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            verified: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$verification.status",
                      "verified",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            required: 1,
            approved: 1,
            pending: 1,
            expired: 1,
            verified: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        required: 0,
        approved: 0,
        pending: 0,
        expired: 0,
        verified: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const EmployeeDocument =
  mongoose.models.EmployeeDocument ||
  mongoose.model(
    "EmployeeDocument",
    employeeDocumentSchema
  );

export {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  VERIFICATION_STATUSES,
  VERIFICATION_METHODS,
  VISIBILITY_LEVELS,
};
