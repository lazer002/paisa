// server/src/models/Certificate.js

import mongoose from "mongoose";

const CERTIFICATE_STATUSES = [
  "draft",
  "pending",
  "issued",
  "revoked",
  "expired",
  "cancelled",
  "archived",
];

const CERTIFICATE_TYPES = [
  "course_completion",
  "academic",
  "achievement",
  "participation",
  "attendance",
  "competition",
  "internship",
  "employment",
  "experience",
  "training",
  "appreciation",
  "award",
  "other",
];

const DELIVERY_METHODS = [
  "portal",
  "email",
  "download",
  "print",
  "physical",
  "api",
];

const VERIFICATION_STATUSES = [
  "unverified",
  "verified",
  "revoked",
];

const certificateItemSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        trim: true,
        maxlength: 100,
        required: true,
      },

      value: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      label: {
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
      _id: false,
    }
  );

const certificateVersionSchema =
  new mongoose.Schema(
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

      templateId: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      templateVersion: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      checksum: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      generatedAt: {
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

const deliverySchema =
  new mongoose.Schema(
    {
      method: {
        type: String,
        enum: DELIVERY_METHODS,
        required: true,
      },

      recipient: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      sentAt: {
        type: Date,
        default: null,
      },

      deliveredAt: {
        type: Date,
        default: null,
      },

      openedAt: {
        type: Date,
        default: null,
      },

      downloadedAt: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "sent",
          "delivered",
          "opened",
          "downloaded",
          "failed",
        ],
        default: "pending",
      },

      failureReason: {
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

const verificationSchema =
  new mongoose.Schema(
    {
      status: {
        type: String,
        enum: VERIFICATION_STATUSES,
        default: "unverified",
      },

      verificationCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 300,
        index: true,
      },

      verificationUrl: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      verificationCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastVerifiedAt: {
        type: Date,
        default: null,
      },

      lastVerifiedIpHash: {
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
      _id: false,
    }
  );

const certificateHistorySchema =
  new mongoose.Schema(
    {
      action: {
        type: String,
        trim: true,
        maxlength: 100,
        required: true,
      },

      fromStatus: {
        type: String,
        default: null,
      },

      toStatus: {
        type: String,
        default: null,
      },

      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      performedAt: {
        type: Date,
        default: Date.now,
      },

      reason: {
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

const certificateSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                              */
      /* ==================================================================== */

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* IDENTITY                                                             */
      /* ==================================================================== */

      certificateNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 150,
        index: true,
      },

      certificateCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 150,
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
        enum: CERTIFICATE_TYPES,
        default: "other",
        index: true,
      },

      status: {
        type: String,
        enum: CERTIFICATE_STATUSES,
        default: "draft",
        index: true,
      },

      /* ==================================================================== */
      /* RECIPIENT                                                             */
      /* ==================================================================== */

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        default: null,
        index: true,
      },

      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        default: null,
        index: true,
      },

      achievementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
        default: null,
      },

      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        default: null,
      },

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
      },

      /* ==================================================================== */
      /* RECIPIENT SNAPSHOT                                                    */
      /* ==================================================================== */

      recipientSnapshot: {
        name: {
          type: String,
          trim: true,
          maxlength: 500,
          required: true,
        },

        email: {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 320,
          default: null,
        },

        studentCode: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        employeeCode: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        className: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        designation: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        departmentName: {
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

      /* ==================================================================== */
      /* ISSUER                                                               */
      /* ==================================================================== */

      issuer: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        designation: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        department: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        organizationName: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        organizationAddress: {
          type: String,
          trim: true,
          maxlength: 3000,
          default: null,
        },

        signatureUrl: {
          type: String,
          trim: true,
          maxlength: 3000,
          default: null,
        },

        sealUrl: {
          type: String,
          trim: true,
          maxlength: 3000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* COURSE / ACADEMIC CONTEXT                                             */
      /* ==================================================================== */

      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
        index: true,
      },

      courseName: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        default: null,
      },

      subjectName: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      grade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      score: {
        type: Number,
        default: null,
      },

      maxScore: {
        type: Number,
        min: 0,
        default: null,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      gradeResult: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      /* ==================================================================== */
      /* ACHIEVEMENT / AWARD DETAILS                                           */
      /* ==================================================================== */

      achievement: {
        name: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        rank: {
          type: Number,
          min: 1,
          default: null,
        },

        position: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        points: {
          type: Number,
          min: 0,
          default: null,
        },

        level: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },
      },

      /* ==================================================================== */
      /* DATES                                                                */
      /* ==================================================================== */

      issueDate: {
        type: Date,
        default: null,
        index: true,
      },

      completionDate: {
        type: Date,
        default: null,
      },

      validFrom: {
        type: Date,
        default: null,
      },

      validUntil: {
        type: Date,
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* CONTENT                                                              */
      /* ==================================================================== */

      content: {
        type: [certificateItemSchema],
        default: [],
      },

      skills: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },

      competencies: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },

      /* ==================================================================== */
      /* TEMPLATE                                                              */
      /* ==================================================================== */

      template: {
        templateId: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        templateVersion: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        orientation: {
          type: String,
          enum: [
            "portrait",
            "landscape",
          ],
          default: "landscape",
        },

        language: {
          type: String,
          trim: true,
          maxlength: 20,
          default: "en",
        },

        configuration: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
      },

      /* ==================================================================== */
      /* DOCUMENT                                                              */
      /* ==================================================================== */

      document: {
        fileName: {
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
          default: "application/pdf",
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

        generatedAt: {
          type: Date,
          default: null,
        },

        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        version: {
          type: Number,
          min: 1,
          default: 1,
        },
      },

      versions: {
        type: [certificateVersionSchema],
        default: [],
      },

      currentVersion: {
        type: Number,
        min: 1,
        default: 1,
      },

      /* ==================================================================== */
      /* VERIFICATION                                                          */
      /* ==================================================================== */

      verification: {
        type: verificationSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* DELIVERY                                                              */
      /* ==================================================================== */

      deliveries: {
        type: [deliverySchema],
        default: [],
      },

      deliveryCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      downloadCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastDownloadedAt: {
        type: Date,
        default: null,
      },

      lastDeliveredAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* QR / SECURITY                                                         */
      /* ==================================================================== */

      qrCode: {
        enabled: {
          type: Boolean,
          default: true,
        },

        value: {
          type: String,
          trim: true,
          maxlength: 3000,
          default: null,
        },

        imageUrl: {
          type: String,
          trim: true,
          maxlength: 3000,
          default: null,
        },

        generatedAt: {
          type: Date,
          default: null,
        },
      },

      security: {
        digitalSignature: {
          type: String,
          trim: true,
          maxlength: 5000,
          default: null,
          select: false,
        },

        signatureAlgorithm: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        hash: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        tamperDetected: {
          type: Boolean,
          default: false,
        },

        tamperDetectedAt: {
          type: Date,
          default: null,
        },

        securityMetadata: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
      },

      /* ==================================================================== */
      /* HISTORY                                                              */
      /* ==================================================================== */

      history: {
        type: [certificateHistorySchema],
        default: [],
      },

      /* ==================================================================== */
      /* TAGS / METADATA                                                      */
      /* ==================================================================== */

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

      /* ==================================================================== */
      /* SOURCE / AUDIT                                                       */
      /* ==================================================================== */

      source: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      sourceReferenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

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

      /* ==================================================================== */
      /* LIFECYCLE                                                             */
      /* ==================================================================== */

      revokedAt: {
        type: Date,
        default: null,
      },

      revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      revocationReason: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      cancellationReason: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      archivedAt: {
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

certificateSchema.index(
  {
    instituteId: 1,
    certificateNumber: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_certificate_number",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    certificateCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_certificate_code",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    externalId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_certificate_external_id",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    "verification.verificationCode": 1,
  },
  {
    unique: true,
    sparse: true,
    name: "certificate_verification_code",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    status: 1,
    issueDate: -1,
  },
  {
    sparse: true,
    name: "student_certificates",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    status: 1,
    issueDate: -1,
  },
  {
    sparse: true,
    name: "employee_certificates",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    userId: 1,
    status: 1,
    issueDate: -1,
  },
  {
    sparse: true,
    name: "user_certificates",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    enrollmentId: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "enrollment_certificates",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
    issueDate: -1,
  },
  {
    name: "certificate_reporting",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    validUntil: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "certificate_expiry",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    "verification.status": 1,
    status: 1,
  },
  {
    name: "certificate_verification",
  }
);

certificateSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_certificates",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

certificateSchema.pre(
  "validate",
  function (next) {
    if (
      this.issueDate &&
      this.validUntil &&
      this.validUntil <
        this.issueDate
    ) {
      return next(
        new Error(
          "Certificate validity cannot end before issue date"
        )
      );
    }

    if (
      this.maxScore !== null &&
      this.score !== null &&
      this.score >
        this.maxScore
    ) {
      return next(
        new Error(
          "Certificate score cannot exceed maximum score"
        )
      );
    }

    if (
      this.versions.length >
      100
    ) {
      return next(
        new Error(
          "Certificate cannot contain more than 100 versions"
        )
      );
    }

    if (
      this.deliveries.length >
      500
    ) {
      return next(
        new Error(
          "Certificate cannot contain more than 500 delivery records"
        )
      );
    }

    if (
      this.history.length >
      1000
    ) {
      this.history =
        this.history.slice(
          -1000
        );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Certificate cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.status ===
        "issued" &&
      !this.issueDate
    ) {
      this.issueDate =
        new Date();
    }

    if (
      this.status ===
        "revoked" &&
      !this.revokedAt
    ) {
      this.revokedAt =
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

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

certificateSchema.virtual(
  "isIssued"
).get(function () {
  return (
    this.status ===
    "issued"
  );
});

certificateSchema.virtual(
  "isRevoked"
).get(function () {
  return (
    this.status ===
    "revoked" ||
    this.verification.status ===
      "revoked"
  );
});

certificateSchema.virtual(
  "isExpired"
).get(function () {
  if (
    !this.validUntil
  ) {
    return false;
  }

  return (
    this.validUntil <
    new Date()
  );
});

certificateSchema.virtual(
  "isVerified"
).get(function () {
  return (
    this.verification.status ===
    "verified"
  );
});

certificateSchema.virtual(
  "hasDocument"
).get(function () {
  return Boolean(
    this.document &&
      this.document.fileUrl
  );
});

certificateSchema.virtual(
  "versionCount"
).get(function () {
  return this.versions.length;
});

certificateSchema.virtual(
  "deliveryCountComputed"
).get(function () {
  return this.deliveries.length;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

certificateSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

certificateSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $nin: [
          "revoked",
          "cancelled",
          "archived",
        ],
      },
    });
  };

certificateSchema.query.issued =
  function () {
    return this.where({
      status: "issued",
      isDeleted: false,
    });
  };

certificateSchema.query.verifiable =
  function () {
    return this.where({
      status: "issued",
      "verification.status": {
        $ne: "revoked",
      },
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

certificateSchema.methods.issue =
  async function ({
    issuedBy = null,
  } = {}) {
    if (
      this.status !==
        "draft" &&
      this.status !==
        "pending"
    ) {
      throw new Error(
        "Only draft or pending certificates can be issued"
      );
    }

    const previousStatus =
      this.status;

    this.status =
      "issued";

    this.issueDate =
      this.issueDate ||
      new Date();

    this.issuer.userId =
      this.issuer.userId ||
      issuedBy;

    this.history.push({
      action: "issued",
      fromStatus:
        previousStatus,
      toStatus: "issued",
      performedBy:
        issuedBy,
      performedAt:
        new Date(),
    });

    return this.save();
  };

certificateSchema.methods.revoke =
  async function ({
    revokedBy = null,
    reason = null,
  } = {}) {
    if (
      this.status !==
      "issued"
    ) {
      throw new Error(
        "Only issued certificates can be revoked"
      );
    }

    const previousStatus =
      this.status;

    this.status =
      "revoked";

    this.revokedAt =
      new Date();

    this.revokedBy =
      revokedBy;

    this.revocationReason =
      reason;

    this.verification.status =
      "revoked";

    this.history.push({
      action: "revoked",
      fromStatus:
        previousStatus,
      toStatus: "revoked",
      performedBy:
        revokedBy,
      performedAt:
        new Date(),
      reason,
    });

    return this.save();
  };

certificateSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      this.status ===
      "issued"
    ) {
      throw new Error(
        "Issued certificate should be revoked instead of cancelled"
      );
    }

    const previousStatus =
      this.status;

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    this.history.push({
      action: "cancelled",
      fromStatus:
        previousStatus,
      toStatus:
        "cancelled",
      performedBy:
        cancelledBy,
      performedAt:
        new Date(),
      reason,
    });

    return this.save();
  };

certificateSchema.methods.verify =
  async function ({
    verifiedBy = null,
    ipHash = null,
  } = {}) {
    if (
      this.status !==
      "issued"
    ) {
      throw new Error(
        "Only issued certificates can be verified"
      );
    }

    if (
      this.verification.status ===
      "revoked"
    ) {
      throw new Error(
        "Revoked certificate cannot be verified"
      );
    }

    this.verification.status =
      "verified";

    this.verification.verifiedAt =
      new Date();

    this.verification.verifiedBy =
      verifiedBy;

    this.verification.verificationCount +=
      1;

    this.verification.lastVerifiedAt =
      new Date();

    this.verification.lastVerifiedIpHash =
      ipHash;

    return this.save();
  };

certificateSchema.methods.generateVerificationCode =
  function () {
    const randomPart =
      new mongoose.Types.ObjectId()
        .toString()
        .toUpperCase();

    this.verification.verificationCode =
      `CERT-${randomPart}`;

    return this.verification
      .verificationCode;
  };

certificateSchema.methods.addDelivery =
  async function ({
    method,
    recipient = null,
  } = {}) {
    if (
      !method
    ) {
      throw new Error(
        "Delivery method is required"
      );
    }

    this.deliveries.push({
      method,
      recipient,
      status: "pending",
    });

    this.deliveryCount =
      this.deliveries.length;

    return this.save();
  };

certificateSchema.methods.markDelivered =
  async function ({
    deliveryId,
  } = {}) {
    const delivery =
      this.deliveries.id(
        deliveryId
      );

    if (
      !delivery
    ) {
      throw new Error(
        "Delivery record not found"
      );
    }

    delivery.status =
      "delivered";

    delivery.sentAt =
      delivery.sentAt ||
      new Date();

    delivery.deliveredAt =
      new Date();

    this.lastDeliveredAt =
      new Date();

    return this.save();
  };

certificateSchema.methods.markDownloaded =
  async function ({
    deliveryId = null,
  } = {}) {
    if (
      deliveryId
    ) {
      const delivery =
        this.deliveries.id(
          deliveryId
        );

      if (
        !delivery
      ) {
        throw new Error(
          "Delivery record not found"
        );
      }

      delivery.status =
        "downloaded";

      delivery.downloadedAt =
        new Date();
    }

    this.downloadCount +=
      1;

    this.lastDownloadedAt =
      new Date();

    return this.save();
  };

certificateSchema.methods.addVersion =
  async function ({
    fileName = null,
    fileUrl = null,
    storageKey = null,
    templateId = null,
    templateVersion = null,
    checksum = null,
    generatedBy = null,
    changeReason = null,
  } = {}) {
    const nextVersion =
      this.currentVersion +
      1;

    this.versions.push({
      version:
        nextVersion,
      fileName,
      fileUrl,
      storageKey,
      templateId,
      templateVersion,
      checksum,
      generatedBy,
      generatedAt:
        new Date(),
      changeReason,
    });

    this.currentVersion =
      nextVersion;

    this.document.version =
      nextVersion;

    this.document.fileName =
      fileName;

    this.document.fileUrl =
      fileUrl;

    this.document.storageKey =
      storageKey;

    this.document.checksum =
      checksum;

    this.document.generatedBy =
      generatedBy;

    this.document.generatedAt =
      new Date();

    return this.save();
  };

certificateSchema.methods.addTag =
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

certificateSchema.methods.removeTag =
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

certificateSchema.methods.archive =
  async function () {
    if (
      this.status ===
      "issued"
    ) {
      throw new Error(
        "Issued certificates should be revoked rather than archived"
      );
    }

    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

certificateSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

certificateSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Certificate is under legal hold"
      );
    }

    if (
      this.status ===
      "issued"
    ) {
      throw new Error(
        "Issued certificates should not be soft deleted"
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

certificateSchema.methods.restore =
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

certificateSchema.statics.findByNumber =
  function (
    instituteId,
    certificateNumber
  ) {
    return this.findOne({
      instituteId,
      certificateNumber:
        String(
          certificateNumber
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

certificateSchema.statics.findByVerificationCode =
  function (
    instituteId,
    verificationCode
  ) {
    return this.findOne({
      instituteId,
      "verification.verificationCode":
        String(
          verificationCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

certificateSchema.statics.findByStudent =
  function (
    instituteId,
    studentId,
    {
      type = null,
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      studentId,
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
        issueDate: -1,
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

certificateSchema.statics.findByEmployee =
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
        issueDate: -1,
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

certificateSchema.statics.findByEnrollment =
  function (
    instituteId,
    enrollmentId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      enrollmentId,
      isDeleted: false,
    })
      .sort({
        issueDate: -1,
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

certificateSchema.statics.findExpiring =
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
      validUntil: {
        $ne: null,
        $lte: date,
        $gte: new Date(),
      },
      status: "issued",
      isDeleted: false,
    })
      .sort({
        validUntil: 1,
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

certificateSchema.statics.findVerifiable =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      status: "issued",
      "verification.status": {
        $ne: "revoked",
      },
      isDeleted: false,
    })
      .sort({
        issueDate: -1,
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

certificateSchema.statics.getStudentSummary =
  async function (
    instituteId,
    studentId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            studentId:
              new mongoose.Types.ObjectId(
                studentId
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

            issued: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "issued",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            revoked: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "revoked",
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
            issued: 1,
            revoked: 1,
            expired: 1,
            verified: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        issued: 0,
        revoked: 0,
        expired: 0,
        verified: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Certificate =
  mongoose.models.Certificate ||
  mongoose.model(
    "Certificate",
    certificateSchema
  );

export {
  CERTIFICATE_STATUSES,
  CERTIFICATE_TYPES,
  DELIVERY_METHODS,
  VERIFICATION_STATUSES,
};