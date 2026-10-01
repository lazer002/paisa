// server/src/models/Invoice.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const INVOICE_STATUSES = [
  "draft",
  "pending",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "void",
  "refunded",
  "written_off",
];

const INVOICE_TYPES = [
  "tuition",
  "admission",
  "course",
  "exam",
  "transport",
  "hostel",
  "library",
  "event",
  "subscription",
  "product",
  "service",
  "salary",
  "other",
];

const PAYMENT_STATUSES = [
  "unpaid",
  "partially_paid",
  "paid",
  "overpaid",
  "refunded",
];

const DISCOUNT_TYPES = [
  "fixed",
  "percentage",
];

const TAX_TYPES = [
  "gst",
  "vat",
  "service_tax",
  "other",
];

const LINE_ITEM_TYPES = [
  "product",
  "service",
  "fee",
  "discount",
  "tax",
  "adjustment",
  "other",
];

const REFUND_STATUSES = [
  "requested",
  "processing",
  "completed",
  "rejected",
  "cancelled",
];

const invoiceItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: LINE_ITEM_TYPES,
      default: "service",
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceModel: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    quantity: {
      type: Number,
      min: 0.000001,
      default: 1,
    },

    unit: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "unit",
    },

    unitPrice: {
      type: Number,
      min: 0,
      required: true,
    },

    grossAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: {
        type: String,
        enum: DISCOUNT_TYPES,
        default: null,
      },

      value: {
        type: Number,
        min: 0,
        default: 0,
      },

      amount: {
        type: Number,
        min: 0,
        default: 0,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
    },

    taxableAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    taxes: [
      {
        type: {
          type: String,
          enum: TAX_TYPES,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 200,
        },

        rate: {
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

        code: {
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 50,
          default: null,
        },
      },
    ],

    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
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

const paymentAllocationSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    amount: {
      type: Number,
      min: 0,
      required: true,
    },

    allocatedAt: {
      type: Date,
      default: Date.now,
    },

    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
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
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    status: {
      type: String,
      enum: REFUND_STATUSES,
      default: "requested",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    providerRefundId: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const invoiceHistorySchema = new mongoose.Schema(
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

const invoiceSchema = new mongoose.Schema(
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
    `pay_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    invoiceNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      index: true,
    },

    invoicePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
      default: "INV",
    },

    fiscalYear: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
      index: true,
    },

    externalId: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    type: {
      type: String,
      enum: INVOICE_TYPES,
      default: "other",
      index: true,
    },

    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: "draft",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
      index: true,
    },

    /* ====================================================================== */
    /* CUSTOMER / PAYER                                                       */
    /* ====================================================================== */

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

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

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    /* ====================================================================== */
    /* SNAPSHOTS                                                              */
    /* ====================================================================== */

    customerSnapshot: {
      name: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      address: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      taxNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    studentSnapshot: {
      studentCode: {
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

      className: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      section: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    /* ====================================================================== */
    /* BILLING PERIOD                                                         */
    /* ====================================================================== */

    billingPeriod: {
      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      label: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },
    },

    issueDate: {
      type: Date,
      default: null,
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* CURRENCY                                                               */
    /* ====================================================================== */

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "INR",
    },

    exchangeRate: {
      type: Number,
      min: 0,
      default: 1,
    },

    /* ====================================================================== */
    /* LINE ITEMS                                                             */
    /* ====================================================================== */

    items: {
      type: [invoiceItemSchema],
      default: [],
    },

    /* ====================================================================== */
    /* AMOUNTS                                                                */
    /* ====================================================================== */

    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    discountTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    taxableAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    taxTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    adjustmentAmount: {
      type: Number,
      default: 0,
    },

    roundOff: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    amountPaid: {
      type: Number,
      min: 0,
      default: 0,
    },

    amountRefunded: {
      type: Number,
      min: 0,
      default: 0,
    },

    amountDue: {
      type: Number,
      min: 0,
      default: 0,
    },

    balanceAfterRefund: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* DISCOUNT                                                               */
    /* ====================================================================== */

    discount: {
      type: {
        type: String,
        enum: DISCOUNT_TYPES,
        default: null,
      },

      value: {
        type: Number,
        min: 0,
        default: 0,
      },

      amount: {
        type: Number,
        min: 0,
        default: 0,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    /* ====================================================================== */
    /* TAX                                                                     */
    /* ====================================================================== */

    taxes: [
      {
        type: {
          type: String,
          enum: TAX_TYPES,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 200,
        },

        code: {
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 50,
          default: null,
        },

        rate: {
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
      },
    ],

    taxRegistrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
    },

    /* ====================================================================== */
    /* PAYMENTS                                                               */
    /* ====================================================================== */

    paymentAllocations: {
      type: [paymentAllocationSchema],
      default: [],
    },

    paymentCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastPaymentAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* REFUNDS                                                                */
    /* ====================================================================== */

    refunds: {
      type: [refundSchema],
      default: [],
    },

    refundCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* TERMS                                                                  */
    /* ====================================================================== */

    paymentTerms: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

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

    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    /* ====================================================================== */
    /* DOCUMENT                                                               */
    /* ====================================================================== */

    document: {
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

      fileName: {
        type: String,
        trim: true,
        maxlength: 500,
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

    /* ====================================================================== */
    /* REMINDERS / COLLECTIONS                                                */
    /* ====================================================================== */

    reminders: {
      enabled: {
        type: Boolean,
        default: true,
      },

      lastSentAt: {
        type: Date,
        default: null,
      },

      nextReminderAt: {
        type: Date,
        default: null,
      },

      count: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    collection: {
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      assignedAt: {
        type: Date,
        default: null,
      },

      lastContactedAt: {
        type: Date,
        default: null,
      },

      nextFollowUpAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* HISTORY                                                                */
    /* ====================================================================== */

    history: {
      type: [invoiceHistorySchema],
      default: [],
    },

    /* ====================================================================== */
    /* SOURCE / AUDIT                                                         */
    /* ====================================================================== */

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

    /* ====================================================================== */
    /* TAGS / METADATA                                                        */
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
    /* IDEMPOTENCY / INTEGRATION                                              */
    /* ====================================================================== */

    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    externalSystem: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    syncStatus: {
      type: String,
      enum: [
        "not_synced",
        "pending",
        "synced",
        "failed",
      ],
      default: "not_synced",
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    syncError: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                              */
    /* ====================================================================== */

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

    voidedAt: {
      type: Date,
      default: null,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    voidReason: {
      type: String,
      trim: true,
      maxlength: 3000,
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
    versionKey: false,

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

invoiceSchema.index(
  {
    instituteId: 1,
    invoiceNumber: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_invoice_number",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    externalId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_external_invoice",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    idempotencyKey: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_invoice_idempotency",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    status: 1,
    dueDate: 1,
  },
  {
    sparse: true,
    name: "student_invoice_collection",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    customerId: 1,
    status: 1,
    dueDate: 1,
  },
  {
    sparse: true,
    name: "customer_invoice_collection",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    type: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "employee_invoices",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    status: 1,
    paymentStatus: 1,
    dueDate: 1,
  },
  {
    name: "invoice_payment_queue",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    dueDate: 1,
    paymentStatus: 1,
  },
  {
    name: "invoice_due_dates",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    issueDate: -1,
    status: 1,
  },
  {
    name: "invoice_reporting",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    fiscalYear: 1,
    type: 1,
    status: 1,
  },
  {
    name: "fiscal_invoice_reporting",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    "collection.nextFollowUpAt": 1,
  },
  {
    sparse: true,
    name: "collection_followups",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    "reminders.nextReminderAt": 1,
    "reminders.enabled": 1,
  },
  {
    sparse: true,
    name: "invoice_reminders",
  }
);

invoiceSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_invoices",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

invoiceSchema.pre(
  "validate",
  function (next) {
    if (
      this.issueDate &&
      this.dueDate &&
      this.dueDate <
        this.issueDate
    ) {
      return next(
        new Error(
          "Invoice due date cannot be before issue date"
        )
      );
    }

    if (
      this.billingPeriod.startDate &&
      this.billingPeriod.endDate &&
      this.billingPeriod.endDate <
        this.billingPeriod.startDate
    ) {
      return next(
        new Error(
          "Billing period end date cannot be before start date"
        )
      );
    }

    if (
      this.items.length >
      500
    ) {
      return next(
        new Error(
          "Invoice cannot contain more than 500 line items"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Invoice cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.grandTotal <
      0
    ) {
      return next(
        new Error(
          "Invoice grand total cannot be negative"
        )
      );
    }

    if (
      this.amountPaid <
      0
    ) {
      return next(
        new Error(
          "Invoice amount paid cannot be negative"
        )
      );
    }

    if (
      this.amountRefunded <
      0
    ) {
      return next(
        new Error(
          "Invoice refunded amount cannot be negative"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

invoiceSchema.virtual(
  "isOverdue"
).get(function () {
  if (
    this.paymentStatus ===
      "paid" ||
    this.paymentStatus ===
      "refunded"
  ) {
    return false;
  }

  if (
    !this.dueDate
  ) {
    return false;
  }

  return (
    this.dueDate <
    new Date()
  );
});

invoiceSchema.virtual(
  "isPaid"
).get(function () {
  return (
    this.paymentStatus ===
    "paid"
  );
});

invoiceSchema.virtual(
  "isPartiallyPaid"
).get(function () {
  return (
    this.paymentStatus ===
    "partially_paid"
  );
});

invoiceSchema.virtual(
  "isFullyRefunded"
).get(function () {
  return (
    this.grandTotal >
      0 &&
    this.amountRefunded >=
      this.grandTotal
  );
});

invoiceSchema.virtual(
  "paymentPercentage"
).get(function () {
  if (
    this.grandTotal <=
    0
  ) {
    return 0;
  }

  return Math.min(
    100,
    (
      this.amountPaid /
      this.grandTotal
    ) *
      100
  );
});

invoiceSchema.virtual(
  "refundPercentage"
).get(function () {
  if (
    this.grandTotal <=
    0
  ) {
    return 0;
  }

  return Math.min(
    100,
    (
      this.amountRefunded /
      this.grandTotal
    ) *
      100
  );
});

invoiceSchema.virtual(
  "daysOverdue"
).get(function () {
  if (
    !this.dueDate ||
    !this.isOverdue
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (
        Date.now() -
        this.dueDate.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

invoiceSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

invoiceSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $nin: [
          "cancelled",
          "void",
        ],
      },
    });
  };

invoiceSchema.query.unpaid =
  function () {
    return this.where({
      isDeleted: false,
      paymentStatus: {
        $in: [
          "unpaid",
          "partially_paid",
        ],
      },
    });
  };

invoiceSchema.query.overdue =
  function () {
    return this.where({
      isDeleted: false,
      paymentStatus: {
        $in: [
          "unpaid",
          "partially_paid",
        ],
      },
      dueDate: {
        $lt: new Date(),
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

invoiceSchema.methods.calculateTotals =
  function () {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableAmount = 0;
    let taxTotal = 0;

    for (
      const item of this.items
    ) {
      item.grossAmount =
        Number(
          (
            item.quantity *
            item.unitPrice
          ).toFixed(2)
        );

      item.discount.amount =
        item.discount.type ===
        "percentage"
          ? Number(
              (
                item.grossAmount *
                (
                  item.discount.value /
                  100
                )
              ).toFixed(2)
            )
          : Number(
              item.discount.value ||
                0
            );

      item.discount.amount =
        Math.min(
          item.grossAmount,
          item.discount.amount
        );

      item.taxableAmount =
        Math.max(
          0,
          item.grossAmount -
            item.discount.amount
        );

      item.taxAmount =
        Number(
          item.taxes
            .reduce(
              (
                total,
                tax
              ) =>
                total +
                Number(
                  tax.amount ||
                    (
                      item.taxableAmount *
                      (
                        tax.rate /
                        100
                      )
                    )
                ),
              0
            )
            .toFixed(2)
        );

      item.netAmount =
        Number(
          (
            item.taxableAmount +
            item.taxAmount
          ).toFixed(2)
        );

      subtotal +=
        item.grossAmount;

      discountTotal +=
        item.discount.amount;

      taxableAmount +=
        item.taxableAmount;

      taxTotal +=
        item.taxAmount;
    }

    this.subtotal =
      Number(
        subtotal.toFixed(2)
      );

    this.discountTotal =
      Number(
        (
          discountTotal +
          Number(
            this.discount.amount ||
              0
          )
        ).toFixed(2)
      );

    this.taxableAmount =
      Number(
        taxableAmount.toFixed(2)
      );

    this.taxTotal =
      Number(
        taxTotal.toFixed(2)
      );

    const beforeAdjustment =
      Math.max(
        0,
        this.subtotal -
          this.discountTotal +
          this.taxTotal
      );

    this.grandTotal =
      Number(
        (
          beforeAdjustment +
          Number(
            this.adjustmentAmount ||
              0
          ) +
          Number(
            this.roundOff ||
              0
          )
        ).toFixed(2)
      );

    this.amountDue =
      Math.max(
        0,
        Number(
          (
            this.grandTotal -
            this.amountPaid +
            this.amountRefunded
          ).toFixed(2)
        )
      );

    this.balanceAfterRefund =
      Math.max(
        0,
        Number(
          (
            this.grandTotal -
            this.amountRefunded
          ).toFixed(2)
        )
      );

    this.updatePaymentStatus();

    return this;
  };

invoiceSchema.methods.updatePaymentStatus =
  function () {
    if (
      this.grandTotal <=
      0
    ) {
      this.paymentStatus =
        "paid";
      this.amountDue = 0;
      return this;
    }

    if (
      this.amountRefunded >=
      this.grandTotal
    ) {
      this.paymentStatus =
        "refunded";
      this.amountDue = 0;
      return this;
    }

    if (
      this.amountPaid >
      this.grandTotal
    ) {
      this.paymentStatus =
        "overpaid";
      this.amountDue = 0;
      return this;
    }

    if (
      this.amountPaid >=
      this.grandTotal
    ) {
      this.paymentStatus =
        "paid";
      this.amountDue = 0;
      return this;
    }

    if (
      this.amountPaid >
      0
    ) {
      this.paymentStatus =
        "partially_paid";
    } else if (
      this.dueDate &&
      this.dueDate <
        new Date()
    ) {
      this.paymentStatus =
        "unpaid";
    } else {
      this.paymentStatus =
        "unpaid";
    }

    this.amountDue =
      Math.max(
        0,
        Number(
          (
            this.grandTotal -
            this.amountPaid
          ).toFixed(2)
        )
      );

    return this;
  };

invoiceSchema.methods.issue =
  async function ({
    performedBy = null,
  } = {}) {
    if (
      this.status !==
        "draft" &&
      this.status !==
        "pending"
    ) {
      throw new Error(
        "Only draft or pending invoices can be issued"
      );
    }

    if (
      !this.items.length
    ) {
      throw new Error(
        "Invoice must contain at least one line item"
      );
    }

    this.calculateTotals();

    const previousStatus =
      this.status;

    this.status =
      "issued";

    this.issueDate =
      this.issueDate ||
      new Date();

    this.history.push({
      action: "issued",
      fromStatus:
        previousStatus,
      toStatus:
        "issued",
      performedBy,
      performedAt:
        new Date(),
    });

    return this.save();
  };

invoiceSchema.methods.addPayment =
  async function ({
    paymentId,
    amount,
    paidAt = new Date(),
    performedBy = null,
  } = {}) {
    if (
      !paymentId
    ) {
      throw new Error(
        "Payment ID is required"
      );
    }

    if (
      !Number.isFinite(
        Number(amount)
      ) ||
      Number(amount) <=
        0
    ) {
      throw new Error(
        "Payment amount must be greater than zero"
      );
    }

    const paymentAmount =
      Number(amount);

    const existing =
      this.paymentAllocations.find(
        (allocation) =>
          String(
            allocation.paymentId
          ) ===
          String(paymentId)
      );

    if (
      existing
    ) {
      existing.amount +=
        paymentAmount;
    } else {
      this.paymentAllocations.push(
        {
          paymentId,
          amount:
            paymentAmount,
          allocatedAt:
            paidAt,
          allocatedBy:
            performedBy,
        }
      );
    }

    this.amountPaid =
      Number(
        (
          this.amountPaid +
          paymentAmount
        ).toFixed(2)
      );

    this.paymentCount =
      this.paymentAllocations.length;

    this.lastPaymentAt =
      paidAt;

    const previousStatus =
      this.status;

    this.updatePaymentStatus();

    if (
      this.paymentStatus ===
      "paid"
    ) {
      this.status =
        "paid";
    } else if (
      this.paymentStatus ===
      "partially_paid"
    ) {
      this.status =
        "partially_paid";
    }

    this.history.push({
      action:
        "payment_allocated",
      fromStatus:
        previousStatus,
      toStatus:
        this.status,
      performedBy,
      performedAt:
        paidAt,
      metadata: {
        paymentId,
        amount:
          paymentAmount,
      },
    });

    return this.save();
  };

invoiceSchema.methods.addRefund =
  async function ({
    amount,
    reason = null,
    paymentId = null,
    requestedBy = null,
  } = {}) {
    if (
      !Number.isFinite(
        Number(amount)
      ) ||
      Number(amount) <=
        0
    ) {
      throw new Error(
        "Refund amount must be greater than zero"
      );
    }

    const refundAmount =
      Number(amount);

    const refundable =
      Math.max(
        0,
        this.amountPaid -
          this.amountRefunded
      );

    if (
      refundAmount >
      refundable
    ) {
      throw new Error(
        "Refund amount exceeds refundable amount"
      );
    }

    this.refunds.push({
      paymentId,
      amount:
        refundAmount,
      reason,
      requestedBy,
      requestedAt:
        new Date(),
      status:
        "requested",
    });

    this.refundCount =
      this.refunds.length;

    return this.save();
  };

invoiceSchema.methods.completeRefund =
  async function ({
    refundId,
    processedBy = null,
    providerRefundId = null,
    notes = null,
  } = {}) {
    const refund =
      this.refunds.id(
        refundId
      );

    if (
      !refund
    ) {
      throw new Error(
        "Refund not found"
      );
    }

    if (
      refund.status ===
      "completed"
    ) {
      return this;
    }

    if (
      refund.status ===
      "rejected" ||
      refund.status ===
      "cancelled"
    ) {
      throw new Error(
        "Refund cannot be completed from its current status"
      );
    }

    refund.status =
      "completed";

    refund.processedBy =
      processedBy;

    refund.processedAt =
      new Date();

    refund.providerRefundId =
      providerRefundId;

    refund.notes =
      notes;

    this.amountRefunded =
      Number(
        (
          this.amountRefunded +
          refund.amount
        ).toFixed(2)
      );

    this.updatePaymentStatus();

    if (
      this.paymentStatus ===
      "refunded"
    ) {
      this.status =
        "refunded";
    }

    return this.save();
  };

invoiceSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      this.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "Paid invoice cannot be cancelled"
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
      action:
        "cancelled",
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

invoiceSchema.methods.void =
  async function ({
    voidedBy = null,
    reason = null,
  } = {}) {
    if (
      this.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "Paid invoice cannot be voided"
      );
    }

    const previousStatus =
      this.status;

    this.status =
      "void";

    this.voidedAt =
      new Date();

    this.voidedBy =
      voidedBy;

    this.voidReason =
      reason;

    this.history.push({
      action:
        "voided",
      fromStatus:
        previousStatus,
      toStatus:
        "void",
      performedBy:
        voidedBy,
      performedAt:
        new Date(),
      reason,
    });

    return this.save();
  };

invoiceSchema.methods.markOverdue =
  async function () {
    if (
      this.paymentStatus ===
        "paid" ||
      this.paymentStatus ===
        "refunded"
    ) {
      return this;
    }

    if (
      !this.dueDate ||
      this.dueDate >=
        new Date()
    ) {
      return this;
    }

    this.status =
      "overdue";

    this.paymentStatus =
      this.amountPaid >
      0
        ? "partially_paid"
        : "unpaid";

    return this.save();
  };

invoiceSchema.methods.addTag =
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

invoiceSchema.methods.removeTag =
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

invoiceSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

invoiceSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Invoice is under legal hold"
      );
    }

    if (
      this.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "Paid invoice should not be soft deleted"
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

invoiceSchema.methods.restore =
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

invoiceSchema.statics.findByNumber =
  function (
    instituteId,
    invoiceNumber
  ) {
    return this.findOne({
      instituteId,
      invoiceNumber:
        String(
          invoiceNumber
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

invoiceSchema.statics.findByStudent =
  function (
    instituteId,
    studentId,
    {
      status = null,
      paymentStatus = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      studentId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    if (
      paymentStatus
    ) {
      query.paymentStatus =
        paymentStatus;
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

invoiceSchema.statics.findByCustomer =
  function (
    instituteId,
    customerId,
    {
      status = null,
      paymentStatus = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      customerId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    if (
      paymentStatus
    ) {
      query.paymentStatus =
        paymentStatus;
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

invoiceSchema.statics.findOverdue =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      paymentStatus: {
        $in: [
          "unpaid",
          "partially_paid",
        ],
      },
      dueDate: {
        $lt: new Date(),
      },
      status: {
        $nin: [
          "cancelled",
          "void",
          "refunded",
        ],
      },
    })
      .sort({
        dueDate: 1,
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

invoiceSchema.statics.findDueSoon =
  function (
    instituteId,
    days = 7,
    limit = 100
  ) {
    const now =
      new Date();

    const future =
      new Date(
        now.getTime() +
          days *
            24 *
            60 *
            60 *
            1000
      );

    return this.find({
      instituteId,
      isDeleted: false,
      paymentStatus: {
        $in: [
          "unpaid",
          "partially_paid",
        ],
      },
      dueDate: {
        $gte: now,
        $lte: future,
      },
      status: {
        $nin: [
          "cancelled",
          "void",
          "refunded",
        ],
      },
    })
      .sort({
        dueDate: 1,
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

invoiceSchema.statics.findByFiscalYear =
  function (
    instituteId,
    fiscalYear,
    limit = 500
  ) {
    return this.find({
      instituteId,
      fiscalYear,
      isDeleted: false,
    })
      .sort({
        issueDate: -1,
      })
      .limit(
        Math.min(
          2000,
          Math.max(
            1,
            limit
          )
        )
      );
  };

invoiceSchema.statics.getFinancialSummary =
  async function (
    instituteId,
    {
      startDate = null,
      endDate = null,
    } = {}
  ) {
    const match = {
      instituteId:
        new mongoose.Types.ObjectId(
          instituteId
        ),
      isDeleted: false,
      status: {
        $nin: [
          "cancelled",
          "void",
        ],
      },
    };

    if (
      startDate ||
      endDate
    ) {
      match.issueDate = {};

      if (
        startDate
      ) {
        match.issueDate.$gte =
          new Date(
            startDate
          );
      }

      if (
        endDate
      ) {
        match.issueDate.$lte =
          new Date(
            endDate
          );
      }
    }

    const result =
      await this.aggregate([
        {
          $match:
            match,
        },
        {
          $group: {
            _id: null,

            invoiceCount: {
              $sum: 1,
            },

            grossBilled: {
              $sum:
                "$grandTotal",
            },

            amountPaid: {
              $sum:
                "$amountPaid",
            },

            amountRefunded: {
              $sum:
                "$amountRefunded",
            },

            amountDue: {
              $sum:
                "$amountDue",
            },

            taxTotal: {
              $sum:
                "$taxTotal",
            },

            discountTotal: {
              $sum:
                "$discountTotal",
            },
          },
        },
        {
          $project: {
            _id: 0,
            invoiceCount: 1,
            grossBilled: 1,
            amountPaid: 1,
            amountRefunded: 1,
            amountDue: 1,
            taxTotal: 1,
            discountTotal: 1,
          },
        },
      ]);

    return (
      result[0] || {
        invoiceCount: 0,
        grossBilled: 0,
        amountPaid: 0,
        amountRefunded: 0,
        amountDue: 0,
        taxTotal: 0,
        discountTotal: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Invoice =
  mongoose.models.Invoice ||
  mongoose.model(
    "Invoice",
    invoiceSchema
  );

export {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  PAYMENT_STATUSES,
  DISCOUNT_TYPES,
  TAX_TYPES,
  LINE_ITEM_TYPES,
  REFUND_STATUSES,
};
