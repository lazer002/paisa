// server/src/models/Enrollment.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const ENROLLMENT_STATUS = [
  "pending",
  "active",
  "completed",
  "suspended",
  "withdrawn",
  "transferred",
  "cancelled",
  "expired",
  "rejected",
];

const ENROLLMENT_TYPES = [
  "academic",
  "course",
  "program",
  "class",
  "batch",
  "training",
  "certification",
  "corporate",
  "workshop",
  "other",
];

const PAYMENT_STATUS = [
  "not_required",
  "pending",
  "partial",
  "paid",
  "overdue",
  "refunded",
  "waived",
];

const PAYMENT_PLANS = [
  "full",
  "monthly",
  "quarterly",
  "semester",
  "custom",
];

const TRANSFER_TYPES = [
  "class",
  "section",
  "batch",
  "course",
  "program",
  "department",
  "academic_year",
];

const enrollmentHistorySchema =
  new mongoose.Schema(
    {
      _id: false,

      action: {
        type: String,
        enum: [
          "created",
          "activated",
          "completed",
          "suspended",
          "withdrawn",
          "transferred",
          "cancelled",
          "expired",
          "rejected",
          "reactivated",
          "payment_updated",
          "class_changed",
          "section_changed",
          "batch_changed",
          "course_changed",
          "program_changed",
          "other",
        ],
        required: true,
      },

      fromStatus: {
        type: String,
        enum: ENROLLMENT_STATUS,
        default: null,
      },

      toStatus: {
        type: String,
        enum: ENROLLMENT_STATUS,
        default: null,
      },

      fromClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
      },

      toClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
      },

      fromCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
      },

      toCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      changedAt: {
        type: Date,
        default: Date.now,
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

const paymentSchema =
  new mongoose.Schema(
    {
      _id: false,

      invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        default: null,
      },

      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: null,
      },

      amount: {
        type: Number,
        min: 0,
        default: 0,
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10,
        default: "INR",
      },

      dueDate: {
        type: Date,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: PAYMENT_STATUS,
        default: "pending",
      },

      installmentNumber: {
        type: Number,
        min: 1,
        default: null,
      },

      reference: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const guardianSnapshotSchema =
  new mongoose.Schema(
    {
      _id: false,

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      name: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      relationship: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 255,
        default: null,
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },

      emergencyContact: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const academicSnapshotSchema =
  new mongoose.Schema(
    {
      _id: false,

      academicYear: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      semester: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      yearLevel: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      section: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      rollNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      admissionNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        default: null,
      },

      batchName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      departmentName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      className: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      courseName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      capturedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const progressSchema =
  new mongoose.Schema(
    {
      _id: false,

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      completedItems: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalItems: {
        type: Number,
        min: 0,
        default: 0,
      },

      completedAssessments: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalAssessments: {
        type: Number,
        min: 0,
        default: 0,
      },

      attendancePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      averageScore: {
        type: Number,
        min: 0,
        default: null,
      },

      lastActivityAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const enrollmentSchema =
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `enr_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* ENROLLMENT IDENTITY                                                  */
      /* ==================================================================== */

      enrollmentNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        index: true,
      },

      enrollmentCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        index: true,
      },

      status: {
        type: String,
        enum: ENROLLMENT_STATUS,
        default: "pending",
        index: true,
      },

      type: {
        type: String,
        enum: ENROLLMENT_TYPES,
        default: "academic",
        index: true,
      },

      /* ==================================================================== */
      /* STUDENT                                                              */
      /* ==================================================================== */

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* ACADEMIC RELATIONSHIPS                                               */
      /* ==================================================================== */

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
        index: true,
      },

      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
        index: true,
      },

      programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
        index: true,
      },

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
        index: true,
      },

      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null,
      },

      /* ==================================================================== */
      /* ACADEMIC PERIOD                                                      */
      /* ==================================================================== */

      academicYear: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
        index: true,
      },

      semester: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      yearLevel: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      section: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      batchName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      /* ==================================================================== */
      /* DATES                                                                */
      /* ==================================================================== */

      appliedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      enrolledAt: {
        type: Date,
        default: null,
      },

      startDate: {
        type: Date,
        default: null,
      },

      expectedEndDate: {
        type: Date,
        default: null,
      },

      completionDate: {
        type: Date,
        default: null,
      },

      withdrawalDate: {
        type: Date,
        default: null,
      },

      expiryDate: {
        type: Date,
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* GUARDIANS                                                            */
      /* ==================================================================== */

      guardians: {
        type: [guardianSnapshotSchema],
        default: [],
      },

      /* ==================================================================== */
      /* ACADEMIC SNAPSHOT                                                    */
      /* ==================================================================== */

      academicSnapshot: {
        type: academicSnapshotSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* FEES / PAYMENTS                                                      */
      /* ==================================================================== */

      fees: {
        totalAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        discountAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        scholarshipAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        taxAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        netAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        paidAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        dueAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        currency: {
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 10,
          default: "INR",
        },

        paymentPlan: {
          type: String,
          enum: PAYMENT_PLANS,
          default: "full",
        },

        paymentStatus: {
          type: String,
          enum: PAYMENT_STATUS,
          default: "not_required",
          index: true,
        },

        installments: {
          type: [paymentSchema],
          default: [],
        },

        invoiceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Invoice",
          default: null,
        },

        lastPaymentAt: {
          type: Date,
          default: null,
        },

        nextPaymentDueAt: {
          type: Date,
          default: null,
          index: true,
        },
      },

      /* ==================================================================== */
      /* SCHOLARSHIP                                                          */
      /* ==================================================================== */

      scholarship: {
        enabled: {
          type: Boolean,
          default: false,
        },

        scholarshipId: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        amount: {
          type: Number,
          min: 0,
          default: 0,
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

        reason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* PROGRESS                                                             */
      /* ==================================================================== */

      progress: {
        type: progressSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* ATTENDANCE                                                           */
      /* ==================================================================== */

      attendance: {
        totalSessions: {
          type: Number,
          min: 0,
          default: 0,
        },

        attendedSessions: {
          type: Number,
          min: 0,
          default: 0,
        },

        absentSessions: {
          type: Number,
          min: 0,
          default: 0,
        },

        lateSessions: {
          type: Number,
          min: 0,
          default: 0,
        },

        excusedSessions: {
          type: Number,
          min: 0,
          default: 0,
        },

        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        lastCalculatedAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* TRANSFER                                                             */
      /* ==================================================================== */

      transfer: {
        isTransferred: {
          type: Boolean,
          default: false,
        },

        type: {
          type: String,
          enum: TRANSFER_TYPES,
          default: null,
        },

        fromEnrollmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Enrollment",
          default: null,
        },

        toEnrollmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Enrollment",
          default: null,
        },

        fromClassId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          default: null,
        },

        toClassId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          default: null,
        },

        transferredAt: {
          type: Date,
          default: null,
        },

        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        reason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* APPROVAL                                                             */
      /* ==================================================================== */

      approval: {
        required: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          enum: [
            "not_required",
            "pending",
            "approved",
            "rejected",
          ],
          default: "not_required",
        },

        requestedAt: {
          type: Date,
          default: null,
        },

        approvedAt: {
          type: Date,
          default: null,
        },

        rejectedAt: {
          type: Date,
          default: null,
        },

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        rejectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        rejectionReason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* DOCUMENTS                                                            */
      /* ==================================================================== */

      documents: [
        {
          _id: false,

          name: {
            type: String,
            trim: true,
            maxlength: 255,
          },

          type: {
            type: String,
            trim: true,
            maxlength: 100,
          },

          url: {
            type: String,
            trim: true,
            maxlength: 2048,
          },

          fileId: {
            type: String,
            trim: true,
            maxlength: 300,
            default: null,
          },

          uploadedAt: {
            type: Date,
            default: Date.now,
          },

          verified: {
            type: Boolean,
            default: false,
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

          verificationNotes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: null,
          },
        },
      ],

      /* ==================================================================== */
      /* NOTES                                                                */
      /* ==================================================================== */

      notes: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      internalNotes: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      /* ==================================================================== */
      /* HISTORY                                                              */
      /* ==================================================================== */

      history: {
        type: [enrollmentHistorySchema],
        default: [],
      },

      /* ==================================================================== */
      /* AUDIT / LIFECYCLE                                                    */
      /* ==================================================================== */

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
        maxlength: 2000,
        default: null,
      },

      withdrawalReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
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

enrollmentSchema.index(
  {
    instituteId: 1,
    enrollmentNumber: 1,
  },
  {
    name: "tenant_enrollment_number",
    unique: true,
    sparse: true,
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    enrollmentCode: 1,
  },
  {
    name: "tenant_enrollment_code",
    unique: true,
    sparse: true,
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    academicYear: 1,
    status: 1,
  },
  {
    name: "student_academic_enrollment",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    classId: 1,
    status: 1,
  },
  {
    name: "student_class_enrollment",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    classId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "class_enrollments",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    courseId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "course_enrollments",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "department_enrollments",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    academicYear: 1,
    semester: 1,
    status: 1,
  },
  {
    name: "academic_period_enrollments",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    status: 1,
    startDate: 1,
    expiryDate: 1,
  },
  {
    name: "enrollment_lifecycle",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    "fees.paymentStatus": 1,
    "fees.nextPaymentDueAt": 1,
  },
  {
    name: "fee_collection_queue",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    "approval.status": 1,
    createdAt: -1,
  },
  {
    name: "enrollment_approval_queue",
  }
);

enrollmentSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "enrollment_listing",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

enrollmentSchema.pre(
  "validate",
  function (next) {
    if (
      this.startDate &&
      this.expectedEndDate &&
      this.expectedEndDate <
        this.startDate
    ) {
      return next(
        new Error(
          "Expected end date cannot be before start date"
        )
      );
    }

    if (
      this.completionDate &&
      this.startDate &&
      this.completionDate <
        this.startDate
    ) {
      return next(
        new Error(
          "Completion date cannot be before start date"
        )
      );
    }

    if (
      this.withdrawalDate &&
      this.startDate &&
      this.withdrawalDate <
        this.startDate
    ) {
      return next(
        new Error(
          "Withdrawal date cannot be before start date"
        )
      );
    }

    const calculatedNet =
      Math.max(
        0,
        this.fees.totalAmount -
          this.fees.discountAmount -
          this.fees.scholarshipAmount +
          this.fees.taxAmount
      );

    if (
      this.fees.netAmount >
      calculatedNet + 0.01
    ) {
      return next(
        new Error(
          "Net enrollment fee is inconsistent with fee components"
        )
      );
    }

    if (
      this.fees.paidAmount >
      this.fees.netAmount + 0.01
    ) {
      return next(
        new Error(
          "Paid amount cannot exceed net amount"
        )
      );
    }

    if (
      this.fees.dueAmount < 0
    ) {
      return next(
        new Error(
          "Due amount cannot be negative"
        )
      );
    }

    if (
      this.progress.percentage < 0 ||
      this.progress.percentage > 100
    ) {
      return next(
        new Error(
          "Progress percentage must be between 0 and 100"
        )
      );
    }

    if (
      this.attendance.percentage < 0 ||
      this.attendance.percentage > 100
    ) {
      return next(
        new Error(
          "Attendance percentage must be between 0 and 100"
        )
      );
    }

    if (
      this.scholarship.percentage < 0 ||
      this.scholarship.percentage > 100
    ) {
      return next(
        new Error(
          "Scholarship percentage must be between 0 and 100"
        )
      );
    }

    if (
      this.scholarship.enabled &&
      this.scholarship.amount <= 0 &&
      this.scholarship.percentage <= 0
    ) {
      return next(
        new Error(
          "Scholarship amount or percentage is required"
        )
      );
    }

    if (
      this.status ===
        "completed" &&
      !this.completionDate
    ) {
      this.completionDate =
        new Date();
    }

    if (
      this.status ===
        "withdrawn" &&
      !this.withdrawalDate
    ) {
      this.withdrawalDate =
        new Date();
    }

    if (
      this.status ===
        "active" &&
      !this.enrolledAt
    ) {
      this.enrolledAt =
        new Date();
    }

    if (
      this.approval.required &&
      this.approval.status ===
        "not_required"
    ) {
      this.approval.status =
        "pending";
    }

    if (
      this.history.length >
      500
    ) {
      return next(
        new Error(
          "Enrollment history cannot contain more than 500 entries"
        )
      );
    }

    if (
      this.guardians.length >
      20
    ) {
      return next(
        new Error(
          "An enrollment cannot contain more than 20 guardians"
        )
      );
    }

    if (
      this.documents.length >
      200
    ) {
      return next(
        new Error(
          "An enrollment cannot contain more than 200 documents"
        )
      );
    }

    if (
      this.fees.installments.length >
      120
    ) {
      return next(
        new Error(
          "An enrollment cannot contain more than 120 installments"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

enrollmentSchema.virtual(
  "isActive"
).get(function () {
  return this.status === "active";
});

enrollmentSchema.virtual(
  "isCompleted"
).get(function () {
  return this.status === "completed";
});

enrollmentSchema.virtual(
  "isWithdrawn"
).get(function () {
  return this.status === "withdrawn";
});

enrollmentSchema.virtual(
  "isPending"
).get(function () {
  return (
    this.status === "pending" ||
    this.approval.status === "pending"
  );
});

enrollmentSchema.virtual(
  "isExpired"
).get(function () {
  return (
    this.status === "expired" ||
    Boolean(
      this.expiryDate &&
        this.expiryDate <
          new Date() &&
        this.status === "active"
    )
  );
});

enrollmentSchema.virtual(
  "feePaymentPercentage"
).get(function () {
  if (
    !this.fees.netAmount
  ) {
    return 100;
  }

  return Math.round(
    Math.min(
      100,
      (this.fees.paidAmount /
        this.fees.netAmount) *
        100
    ) * 100
  ) / 100;
});

enrollmentSchema.virtual(
  "attendancePercentage"
).get(function () {
  if (
    this.attendance.totalSessions <=
    0
  ) {
    return 0;
  }

  return Math.round(
    (this.attendance.attendedSessions /
      this.attendance.totalSessions) *
      10000
  ) / 100;
});

enrollmentSchema.virtual(
  "daysEnrolled"
).get(function () {
  if (!this.startDate) {
    return 0;
  }

  const end =
    this.completionDate ||
    this.withdrawalDate ||
    new Date();

  return Math.max(
    0,
    Math.floor(
      (end.getTime() -
        this.startDate.getTime()) /
        86400000
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

enrollmentSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

enrollmentSchema.query.byStudent =
  function (
    studentId
  ) {
    return this.where({
      studentId,
      isDeleted: false,
    });
  };

enrollmentSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: "active",
    });
  };

enrollmentSchema.query.pending =
  function () {
    return this.where({
      isDeleted: false,
      status: "pending",
    });
  };

enrollmentSchema.query.completed =
  function () {
    return this.where({
      isDeleted: false,
      status: "completed",
    });
  };

enrollmentSchema.query.byClass =
  function (
    classId
  ) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

enrollmentSchema.query.byCourse =
  function (
    courseId
  ) {
    return this.where({
      courseId,
      isDeleted: false,
    });
  };

enrollmentSchema.query.feesDue =
  function () {
    return this.where({
      isDeleted: false,
      "fees.dueAmount": {
        $gt: 0,
      },
    });
  };

enrollmentSchema.query.requiresApproval =
  function () {
    return this.where({
      isDeleted: false,
      "approval.status": "pending",
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

enrollmentSchema.methods.addHistory =
  function ({
    action,
    fromStatus = null,
    toStatus = null,
    fromClassId = null,
    toClassId = null,
    fromCourseId = null,
    toCourseId = null,
    reason = null,
    notes = null,
    changedBy = null,
    metadata = null,
  } = {}) {
    if (!action) {
      throw new Error(
        "Enrollment history action is required"
      );
    }

    this.history.push({
      action,
      fromStatus,
      toStatus,
      fromClassId,
      toClassId,
      fromCourseId,
      toCourseId,
      reason,
      notes,
      changedBy,
      metadata,
      changedAt:
        new Date(),
    });

    return this;
  };

enrollmentSchema.methods.activate =
  async function ({
    activatedBy = null,
  } = {}) {
    if (
      ![
        "pending",
        "suspended",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Enrollment cannot be activated from its current state"
      );
    }

    if (
      this.approval.required &&
      this.approval.status !==
        "approved"
    ) {
      throw new Error(
        "Enrollment approval is required before activation"
      );
    }

    const previous =
      this.status;

    this.status =
      "active";

    this.enrolledAt =
      this.enrolledAt ||
      new Date();

    this.startDate =
      this.startDate ||
      new Date();

    this.addHistory({
      action:
        "activated",
      fromStatus:
        previous,
      toStatus:
        "active",
      changedBy:
        activatedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.suspend =
  async function ({
    changedBy = null,
    reason = null,
  } = {}) {
    if (
      this.status !==
      "active"
    ) {
      throw new Error(
        "Only active enrollments can be suspended"
      );
    }

    const previous =
      this.status;

    this.status =
      "suspended";

    this.addHistory({
      action:
        "suspended",
      fromStatus:
        previous,
      toStatus:
        "suspended",
      reason,
      changedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.reactivate =
  async function ({
    changedBy = null,
    reason = null,
  } = {}) {
    if (
      ![
        "suspended",
        "expired",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Only suspended or expired enrollments can be reactivated"
      );
    }

    const previous =
      this.status;

    this.status =
      "active";

    this.addHistory({
      action:
        "reactivated",
      fromStatus:
        previous,
      toStatus:
        "active",
      reason,
      changedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.complete =
  async function ({
    changedBy = null,
  } = {}) {
    if (
      ![
        "active",
        "suspended",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Enrollment cannot be completed from its current state"
      );
    }

    const previous =
      this.status;

    this.status =
      "completed";

    this.completionDate =
      new Date();

    this.progress.percentage =
      100;

    this.progress.completedAt =
      this.completionDate;

    this.addHistory({
      action:
        "completed",
      fromStatus:
        previous,
      toStatus:
        "completed",
      changedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.withdraw =
  async function ({
    changedBy = null,
    reason = null,
  } = {}) {
    if (
      [
        "completed",
        "cancelled",
        "withdrawn",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Enrollment cannot be withdrawn from its current state"
      );
    }

    const previous =
      this.status;

    this.status =
      "withdrawn";

    this.withdrawalDate =
      new Date();

    this.withdrawalReason =
      reason;

    this.addHistory({
      action:
        "withdrawn",
      fromStatus:
        previous,
      toStatus:
        "withdrawn",
      reason,
      changedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      [
        "completed",
        "withdrawn",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Enrollment cannot be cancelled from its current state"
      );
    }

    const previous =
      this.status;

    this.status =
      "cancelled";

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    this.addHistory({
      action:
        "cancelled",
      fromStatus:
        previous,
      toStatus:
        "cancelled",
      reason,
      changedBy:
        cancelledBy,
    });

    return this.save();
  };

enrollmentSchema.methods.updateFees =
  async function ({
    totalAmount,
    discountAmount = this.fees.discountAmount,
    scholarshipAmount = this.fees.scholarshipAmount,
    taxAmount = this.fees.taxAmount,
    paidAmount = this.fees.paidAmount,
    changedBy = null,
  } = {}) {
    if (
      totalAmount === undefined
    ) {
      throw new Error(
        "Total amount is required"
      );
    }

    const netAmount =
      Math.max(
        0,
        Number(totalAmount) -
          Number(
            discountAmount
          ) -
          Number(
            scholarshipAmount
          ) +
          Number(taxAmount)
      );

    const normalizedPaid =
      Math.max(
        0,
        Number(paidAmount)
      );

    if (
      normalizedPaid >
      netAmount
    ) {
      throw new Error(
        "Paid amount cannot exceed net amount"
      );
    }

    const dueAmount =
      Math.max(
        0,
        netAmount -
          normalizedPaid
      );

    this.fees.totalAmount =
      Number(totalAmount);

    this.fees.discountAmount =
      Number(discountAmount);

    this.fees.scholarshipAmount =
      Number(
        scholarshipAmount
      );

    this.fees.taxAmount =
      Number(taxAmount);

    this.fees.netAmount =
      netAmount;

    this.fees.paidAmount =
      normalizedPaid;

    this.fees.dueAmount =
      dueAmount;

    if (
      netAmount === 0
    ) {
      this.fees.paymentStatus =
        "waived";
    } else if (
      normalizedPaid >=
      netAmount
    ) {
      this.fees.paymentStatus =
        "paid";
    } else if (
      normalizedPaid > 0
    ) {
      this.fees.paymentStatus =
        "partial";
    } else {
      this.fees.paymentStatus =
        "pending";
    }

    this.addHistory({
      action:
        "payment_updated",
      changedBy,
      metadata: {
        netAmount,
        paidAmount:
          normalizedPaid,
        dueAmount,
      },
    });

    return this.save();
  };

enrollmentSchema.methods.recordPayment =
  async function ({
    amount,
    paymentId = null,
    invoiceId = null,
    reference = null,
    paidAt = new Date(),
    changedBy = null,
  } = {}) {
    const normalizedAmount =
      Number(amount);

    if (
      !Number.isFinite(
        normalizedAmount
      ) ||
      normalizedAmount <= 0
    ) {
      throw new Error(
        "Valid payment amount is required"
      );
    }

    const remaining =
      Math.max(
        0,
        this.fees.netAmount -
          this.fees.paidAmount
      );

    if (
      normalizedAmount >
      remaining
    ) {
      throw new Error(
        "Payment exceeds outstanding enrollment balance"
      );
    }

    this.fees.paidAmount +=
      normalizedAmount;

    this.fees.dueAmount =
      Math.max(
        0,
        this.fees.netAmount -
          this.fees.paidAmount
      );

    this.fees.lastPaymentAt =
      paidAt;

    this.fees.paymentStatus =
      this.fees.paidAmount >=
      this.fees.netAmount
        ? "paid"
        : "partial";

    this.fees.installments.push({
      invoiceId,
      paymentId,
      amount:
        normalizedAmount,
      currency:
        this.fees.currency,
      paidAt,
      status: "paid",
      reference,
    });

    this.addHistory({
      action:
        "payment_updated",
      changedBy,
      metadata: {
        paymentAmount:
          normalizedAmount,
        paidAmount:
          this.fees.paidAmount,
        dueAmount:
          this.fees.dueAmount,
      },
    });

    return this.save();
  };

enrollmentSchema.methods.updateProgress =
  async function ({
    percentage,
    completedItems = this
      .progress
      .completedItems,
    totalItems = this
      .progress
      .totalItems,
    completedAssessments = this
      .progress
      .completedAssessments,
    totalAssessments = this
      .progress
      .totalAssessments,
    averageScore = this
      .progress
      .averageScore,
  } = {}) {
    if (
      percentage !== undefined
    ) {
      this.progress.percentage =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              percentage
            )
          )
        );
    }

    this.progress.completedItems =
      Math.max(
        0,
        Number(
          completedItems
        )
      );

    this.progress.totalItems =
      Math.max(
        0,
        Number(
          totalItems
        )
      );

    this.progress.completedAssessments =
      Math.max(
        0,
        Number(
          completedAssessments
        )
      );

    this.progress.totalAssessments =
      Math.max(
        0,
        Number(
          totalAssessments
        )
      );

    this.progress.averageScore =
      averageScore === null ||
      averageScore === undefined
        ? null
        : Math.max(
            0,
            Number(
              averageScore
            )
          );

    this.progress.lastActivityAt =
      new Date();

    this.progress.updatedAt =
      new Date();

    if (
      this.progress.percentage >=
      100
    ) {
      this.progress.completedAt =
        this.progress.completedAt ||
        new Date();
    }

    return this.save();
  };

enrollmentSchema.methods.updateAttendance =
  async function ({
    totalSessions,
    attendedSessions,
    absentSessions = 0,
    lateSessions = 0,
    excusedSessions = 0,
  } = {}) {
    if (
      totalSessions ===
        undefined ||
      attendedSessions ===
        undefined
    ) {
      throw new Error(
        "Total and attended sessions are required"
      );
    }

    const total =
      Math.max(
        0,
        Number(
          totalSessions
        )
      );

    const attended =
      Math.min(
        total,
        Math.max(
          0,
          Number(
            attendedSessions
          )
        )
      );

    this.attendance.totalSessions =
      total;

    this.attendance.attendedSessions =
      attended;

    this.attendance.absentSessions =
      Math.max(
        0,
        Number(
          absentSessions
        )
      );

    this.attendance.lateSessions =
      Math.max(
        0,
        Number(
          lateSessions
        )
      );

    this.attendance.excusedSessions =
      Math.max(
        0,
        Number(
          excusedSessions
        )
      );

    this.attendance.percentage =
      total > 0
        ? Math.round(
            (attended /
              total) *
              10000
          ) / 100
        : 0;

    this.progress.attendancePercentage =
      this.attendance.percentage;

    this.attendance.lastCalculatedAt =
      new Date();

    return this.save();
  };

enrollmentSchema.methods.transfer =
  async function ({
    type,
    toClassId = null,
    toCourseId = null,
    toEnrollmentId = null,
    changedBy = null,
    reason = null,
  } = {}) {
    if (!type) {
      throw new Error(
        "Transfer type is required"
      );
    }

    if (
      ![
        "active",
        "suspended",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Only active or suspended enrollments can be transferred"
      );
    }

    const previousClassId =
      this.classId;

    const previousCourseId =
      this.courseId;

    if (
      toClassId
    ) {
      this.classId =
        toClassId;
    }

    if (
      toCourseId
    ) {
      this.courseId =
        toCourseId;
    }

    this.transfer.isTransferred =
      true;

    this.transfer.type =
      type;

    this.transfer.fromEnrollmentId =
      this._id;

    this.transfer.toEnrollmentId =
      toEnrollmentId;

    this.transfer.fromClassId =
      previousClassId;

    this.transfer.toClassId =
      toClassId;

    this.transfer.transferredAt =
      new Date();

    this.transfer.transferredBy =
      changedBy;

    this.transfer.reason =
      reason;

    this.addHistory({
      action:
        "transferred",
      fromStatus:
        this.status,
      toStatus:
        this.status,
      fromClassId:
        previousClassId,
      toClassId:
        toClassId,
      fromCourseId:
        previousCourseId,
      toCourseId:
        toCourseId,
      reason,
      changedBy,
    });

    return this.save();
  };

enrollmentSchema.methods.addDocument =
  async function ({
    name,
    type,
    url,
    fileId = null,
  } = {}) {
    if (
      !name ||
      !url
    ) {
      throw new Error(
        "Document name and URL are required"
      );
    }

    this.documents.push({
      name,
      type,
      url,
      fileId,
      uploadedAt:
        new Date(),
    });

    return this.save();
  };

enrollmentSchema.methods.verifyDocument =
  async function ({
    documentIndex,
    verifiedBy,
    notes = null,
  } = {}) {
    if (
      !Number.isInteger(
        documentIndex
      ) ||
      !this.documents[
        documentIndex
      ]
    ) {
      throw new Error(
        "Enrollment document not found"
      );
    }

    const document =
      this.documents[
        documentIndex
      ];

    document.verified =
      true;

    document.verifiedAt =
      new Date();

    document.verifiedBy =
      verifiedBy;

    document.verificationNotes =
      notes;

    return this.save();
  };

enrollmentSchema.methods.softDelete =
  async function ({
    deletedBy = null,
  } = {}) {
    if (
      this.status ===
      "active"
    ) {
      throw new Error(
        "Active enrollments cannot be deleted"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.updatedBy =
      deletedBy;

    return this.save();
  };

enrollmentSchema.methods.restore =
  async function ({
    restoredBy = null,
  } = {}) {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    this.updatedBy =
      restoredBy;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

enrollmentSchema.statics.findActiveForStudent =
  function (
    instituteId,
    studentId
  ) {
    return this.find({
      instituteId,
      studentId,
      status: "active",
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

enrollmentSchema.statics.findCurrentForClass =
  function (
    instituteId,
    classId
  ) {
    return this.find({
      instituteId,
      classId,
      status: "active",
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

enrollmentSchema.statics.findPendingApprovals =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      "approval.status":
        "pending",
    })
      .sort({
        "approval.requestedAt": 1,
      })
      .limit(limit);
  };

enrollmentSchema.statics.findOutstandingFees =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      "fees.dueAmount": {
        $gt: 0,
      },
    })
      .sort({
        "fees.nextPaymentDueAt": 1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model(
    "Enrollment",
    enrollmentSchema
  );

export {
  ENROLLMENT_STATUS,
  ENROLLMENT_TYPES,
  PAYMENT_STATUS,
  PAYMENT_PLANS,
  TRANSFER_TYPES,
};
