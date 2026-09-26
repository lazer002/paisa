// server/src/models/AttendanceEvent.js

import mongoose from "mongoose";

const ATTENDANCE_EVENT_TYPES = [
  "check_in",
  "check_out",
  "present",
  "absent",
  "late",
  "half_day",
  "leave",
  "excused",
  "early_exit",
  "remote",
  "on_duty",
  "missed_checkout",
  "manual_correction",
];

const ATTENDANCE_SOURCES = [
  "manual",
  "qr",
  "face",
  "biometric",
  "geofence",
  "live_session",
  "mobile",
  "web",
  "device",
  "import",
  "system",
  "api",
];

const VERIFICATION_METHODS = [
  "none",
  "manual",
  "qr",
  "face",
  "biometric",
  "geofence",
  "device",
  "live_session",
  "multi_factor",
];

const VERIFICATION_STATUS = [
  "pending",
  "verified",
  "failed",
  "not_required",
];

const EVENT_STATUS = [
  "recorded",
  "verified",
  "rejected",
  "corrected",
  "voided",
];

const attendanceEventSchema =
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
      /* PERSON                                                                */
      /* ==================================================================== */

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* ATTENDANCE CONTEXT                                                    */
      /* ==================================================================== */

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
        index: true,
      },

      enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        default: null,
        index: true,
      },

      liveSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveSession",
        default: null,
        index: true,
      },

      attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
        default: null,
        index: true,
      },

      leaveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leave",
        default: null,
      },

      /* ==================================================================== */
      /* EVENT                                                                 */
      /* ==================================================================== */

      eventType: {
        type: String,
        enum: ATTENDANCE_EVENT_TYPES,
        required: true,
        index: true,
      },

      source: {
        type: String,
        enum: ATTENDANCE_SOURCES,
        default: "manual",
        index: true,
      },

      status: {
        type: String,
        enum: EVENT_STATUS,
        default: "recorded",
        index: true,
      },

      occurredAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
      },

      recordedAt: {
        type: Date,
        default: Date.now,
      },

      effectiveDate: {
        type: Date,
        required: true,
        index: true,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      /* ==================================================================== */
      /* TIME                                                                  */
      /* ==================================================================== */

      checkInAt: {
        type: Date,
        default: null,
      },

      checkOutAt: {
        type: Date,
        default: null,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      lateBySeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      earlyExitBySeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      scheduledStartAt: {
        type: Date,
        default: null,
      },

      scheduledEndAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* VERIFICATION                                                          */
      /* ==================================================================== */

      verification: {
        status: {
          type: String,
          enum: VERIFICATION_STATUS,
          default: "not_required",
          index: true,
        },

        method: {
          type: String,
          enum: VERIFICATION_METHODS,
          default: "none",
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

        confidence: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },

        reason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },

        provider: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
        },

        referenceId: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },
      },

      /* ==================================================================== */
      /* QR SESSION                                                            */
      /* ==================================================================== */

      qr: {
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "QRSession",
          default: null,
        },

        tokenHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },

        scannedAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* DEVICE                                                                */
      /* ==================================================================== */

      device: {
        deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Device",
          default: null,
        },

        fingerprintHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },

        platform: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        appVersion: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        operatingSystem: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
        },

        browser: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
        },

        userAgentHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },
      },

      /* ==================================================================== */
      /* LOCATION                                                              */
      /* ==================================================================== */

      location: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
          default: null,
        },

        longitude: {
          type: Number,
          min: -180,
          max: 180,
          default: null,
        },

        accuracyMeters: {
          type: Number,
          min: 0,
          default: null,
        },

        altitudeMeters: {
          type: Number,
          default: null,
        },

        speedMetersPerSecond: {
          type: Number,
          min: 0,
          default: null,
        },

        geofenceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Geofence",
          default: null,
        },

        geofenceVerified: {
          type: Boolean,
          default: false,
        },

        capturedAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* NETWORK                                                               */
      /* ==================================================================== */

      network: {
        ipHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },

        networkType: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        connectionId: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },
      },

      /* ==================================================================== */
      /* MANUAL CORRECTION                                                     */
      /* ==================================================================== */

      correction: {
        isCorrection: {
          type: Boolean,
          default: false,
        },

        originalEventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AttendanceEvent",
          default: null,
        },

        reason: {
          type: String,
          trim: true,
          maxlength: 5000,
          default: null,
        },

        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
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

        rejectionReason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* LEAVE / STATUS                                                        */
      /* ==================================================================== */

      attendanceStatus: {
        type: String,
        enum: [
          "present",
          "absent",
          "late",
          "half_day",
          "leave",
          "excused",
          "holiday",
          "weekend",
          "work_from_home",
          "on_duty",
          "unknown",
        ],
        default: "present",
      },

      isPaidDay: {
        type: Boolean,
        default: true,
      },

      isWorkingDay: {
        type: Boolean,
        default: true,
      },

      /* ==================================================================== */
      /* AUDIT                                                                 */
      /* ==================================================================== */

      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      sourceReference: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      correlationId: {
        type: String,
        trim: true,
        maxlength: 150,
        index: true,
        default: null,
      },

      idempotencyKey: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      /* ==================================================================== */
      /* IMMUTABILITY / LIFECYCLE                                              */
      /* ==================================================================== */

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

attendanceEventSchema.index(
  {
    instituteId: 1,
    userId: 1,
    effectiveDate: -1,
    occurredAt: -1,
  },
  {
    name: "user_attendance_timeline",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    effectiveDate: -1,
  },
  {
    name: "student_attendance_history",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    effectiveDate: -1,
  },
  {
    name: "employee_attendance_history",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    teacherId: 1,
    effectiveDate: -1,
  },
  {
    name: "teacher_attendance_history",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    classId: 1,
    effectiveDate: -1,
    status: 1,
  },
  {
    name: "class_attendance_events",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    liveSessionId: 1,
    occurredAt: -1,
  },
  {
    name: "live_session_attendance",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    attendanceId: 1,
    occurredAt: -1,
  },
  {
    name: "attendance_record_events",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    eventType: 1,
    effectiveDate: -1,
  },
  {
    name: "attendance_event_type",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    source: 1,
    effectiveDate: -1,
  },
  {
    name: "attendance_source",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    "verification.status": 1,
    occurredAt: -1,
  },
  {
    name: "verification_queue",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    "location.geofenceId": 1,
    occurredAt: -1,
  },
  {
    name: "geofence_events",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    "device.deviceId": 1,
    occurredAt: -1,
  },
  {
    name: "device_attendance_events",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    correlationId: 1,
    occurredAt: -1,
  },
  {
    name: "correlation_lookup",
    sparse: true,
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    idempotencyKey: 1,
  },
  {
    name: "idempotency_lookup",
    unique: true,
    sparse: true,
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    "correction.originalEventId": 1,
    occurredAt: -1,
  },
  {
    name: "correction_history",
  }
);

attendanceEventSchema.index(
  {
    instituteId: 1,
    effectiveDate: 1,
    attendanceStatus: 1,
  },
  {
    name: "daily_attendance_reporting",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

attendanceEventSchema.pre(
  "validate",
  function (next) {
    if (
      this.checkInAt &&
      this.checkOutAt &&
      this.checkOutAt <
        this.checkInAt
    ) {
      return next(
        new Error(
          "Check-out cannot occur before check-in"
        )
      );
    }

    if (
      this.scheduledStartAt &&
      this.scheduledEndAt &&
      this.scheduledEndAt <=
        this.scheduledStartAt
    ) {
      return next(
        new Error(
          "Scheduled end must be after scheduled start"
        )
      );
    }

    if (
      this.durationSeconds < 0 ||
      this.lateBySeconds < 0 ||
      this.earlyExitBySeconds < 0
    ) {
      return next(
        new Error(
          "Attendance duration values cannot be negative"
        )
      );
    }

    if (
      this.source === "live_session" &&
      !this.liveSessionId
    ) {
      return next(
        new Error(
          "Live session ID is required for live session attendance events"
        )
      );
    }

    if (
      this.source === "qr" &&
      !this.qr.sessionId
    ) {
      return next(
        new Error(
          "QR session ID is required for QR attendance events"
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
      this.verification.status ===
        "verified" &&
      this.verification.method ===
        "none"
    ) {
      return next(
        new Error(
          "Verification method is required for verified events"
        )
      );
    }

    if (
      this.correction.isCorrection &&
      !this.correction.originalEventId
    ) {
      return next(
        new Error(
          "Original event ID is required for corrections"
        )
      );
    }

    if (
      this.eventType ===
        "manual_correction" &&
      !this.correction.isCorrection
    ) {
      return next(
        new Error(
          "Manual correction events must be marked as corrections"
        )
      );
    }

    if (
      this.eventType ===
        "check_in" &&
      !this.checkInAt
    ) {
      this.checkInAt =
        this.occurredAt;
    }

    if (
      this.eventType ===
        "check_out" &&
      !this.checkOutAt
    ) {
      this.checkOutAt =
        this.occurredAt;
    }

    if (
      this.checkInAt &&
      this.checkOutAt
    ) {
      this.durationSeconds =
        Math.max(
          0,
          Math.floor(
            (this.checkOutAt.getTime() -
              this.checkInAt.getTime()) /
              1000
          )
        );
    }

    if (
      this.metadata &&
      JSON.stringify(
        this.metadata
      ).length > 50000
    ) {
      return next(
        new Error(
          "Attendance event metadata is too large"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

attendanceEventSchema.virtual(
  "isVerified"
).get(function () {
  return (
    this.verification.status ===
    "verified"
  );
});

attendanceEventSchema.virtual(
  "isCorrection"
).get(function () {
  return Boolean(
    this.correction.isCorrection
  );
});

attendanceEventSchema.virtual(
  "isVoided"
).get(function () {
  return Boolean(
    this.voidedAt
  );
});

attendanceEventSchema.virtual(
  "workedHours"
).get(function () {
  return Math.round(
    (this.durationSeconds /
      3600) *
      100
  ) / 100;
});

attendanceEventSchema.virtual(
  "workedMinutes"
).get(function () {
  return Math.floor(
    this.durationSeconds /
      60
  );
});

attendanceEventSchema.virtual(
  "lateMinutes"
).get(function () {
  return Math.floor(
    this.lateBySeconds /
      60
  );
});

attendanceEventSchema.virtual(
  "earlyExitMinutes"
).get(function () {
  return Math.floor(
    this.earlyExitBySeconds /
      60
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

attendanceEventSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      voidedAt: null,
    });
  };

attendanceEventSchema.query.byUser =
  function (
    userId
  ) {
    return this.where({
      userId,
      voidedAt: null,
    });
  };

attendanceEventSchema.query.byStudent =
  function (
    studentId
  ) {
    return this.where({
      studentId,
      voidedAt: null,
    });
  };

attendanceEventSchema.query.byEmployee =
  function (
    employeeId
  ) {
    return this.where({
      employeeId,
      voidedAt: null,
    });
  };

attendanceEventSchema.query.byTeacher =
  function (
    teacherId
  ) {
    return this.where({
      teacherId,
      voidedAt: null,
    });
  };

attendanceEventSchema.query.byDate =
  function (
    date
  ) {
    const start =
      new Date(date);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 1
    );

    return this.where({
      effectiveDate: {
        $gte: start,
        $lt: end,
      },
      voidedAt: null,
    });
  };

attendanceEventSchema.query.verified =
  function () {
    return this.where({
      "verification.status":
        "verified",
      voidedAt: null,
    });
  };

attendanceEventSchema.query.pendingVerification =
  function () {
    return this.where({
      "verification.status":
        "pending",
      voidedAt: null,
    });
  };

attendanceEventSchema.query.corrections =
  function () {
    return this.where({
      "correction.isCorrection":
        true,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

attendanceEventSchema.methods.verify =
  async function ({
    verifiedBy = null,
    method = "manual",
    confidence = null,
    reason = null,
  } = {}) {
    this.verification.status =
      "verified";

    this.verification.method =
      method;

    this.verification.verifiedAt =
      new Date();

    this.verification.verifiedBy =
      verifiedBy;

    this.verification.confidence =
      confidence;

    this.verification.reason =
      reason;

    this.status =
      "verified";

    return this.save();
  };

attendanceEventSchema.methods.reject =
  async function ({
    verifiedBy = null,
    reason = null,
  } = {}) {
    this.verification.status =
      "failed";

    this.verification.verifiedBy =
      verifiedBy;

    this.verification.verifiedAt =
      new Date();

    this.verification.reason =
      reason;

    this.status =
      "rejected";

    return this.save();
  };

attendanceEventSchema.methods.correct =
  async function ({
    changedBy = null,
    reason = null,
    eventType = null,
    attendanceStatus = null,
    checkInAt = undefined,
    checkOutAt = undefined,
  } = {}) {
    if (
      !reason
    ) {
      throw new Error(
        "Correction reason is required"
      );
    }

    if (
      this.voidedAt
    ) {
      throw new Error(
        "Voided attendance events cannot be corrected"
      );
    }

    if (
      eventType
    ) {
      this.eventType =
        eventType;
    }

    if (
      attendanceStatus
    ) {
      this.attendanceStatus =
        attendanceStatus;
    }

    if (
      checkInAt !==
      undefined
    ) {
      this.checkInAt =
        checkInAt;
    }

    if (
      checkOutAt !==
      undefined
    ) {
      this.checkOutAt =
        checkOutAt;
    }

    if (
      this.checkInAt &&
      this.checkOutAt
    ) {
      this.durationSeconds =
        Math.max(
          0,
          Math.floor(
            (this.checkOutAt.getTime() -
              this.checkInAt.getTime()) /
              1000
          )
        );
    }

    this.correction.isCorrection =
      true;

    this.correction.originalEventId =
      this._id;

    this.correction.reason =
      reason;

    this.correction.requestedBy =
      changedBy;

    this.correction.approvedBy =
      changedBy;

    this.correction.requestedAt =
      new Date();

    this.correction.approvedAt =
      new Date();

    this.status =
      "corrected";

    return this.save();
  };

attendanceEventSchema.methods.void =
  async function ({
    voidedBy = null,
    reason = null,
  } = {}) {
    if (
      this.voidedAt
    ) {
      return this;
    }

    if (
      !reason
    ) {
      throw new Error(
        "Void reason is required"
      );
    }

    this.voidedAt =
      new Date();

    this.voidedBy =
      voidedBy;

    this.voidReason =
      reason;

    this.status =
      "voided";

    return this.save();
  };

attendanceEventSchema.methods.setLocation =
  async function ({
    latitude,
    longitude,
    accuracyMeters = null,
    altitudeMeters = null,
    speedMetersPerSecond = null,
    geofenceId = null,
    geofenceVerified = false,
  } = {}) {
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      throw new Error(
        "Latitude and longitude are required"
      );
    }

    this.location.latitude =
      latitude;

    this.location.longitude =
      longitude;

    this.location.accuracyMeters =
      accuracyMeters;

    this.location.altitudeMeters =
      altitudeMeters;

    this.location.speedMetersPerSecond =
      speedMetersPerSecond;

    this.location.geofenceId =
      geofenceId;

    this.location.geofenceVerified =
      geofenceVerified;

    this.location.capturedAt =
      new Date();

    return this.save();
  };

attendanceEventSchema.methods.setCheckIn =
  async function ({
    at = new Date(),
  } = {}) {
    this.checkInAt =
      at;

    this.occurredAt =
      at;

    if (
      this.scheduledStartAt &&
      at >
        this.scheduledStartAt
    ) {
      this.lateBySeconds =
        Math.floor(
          (at.getTime() -
            this.scheduledStartAt.getTime()) /
            1000
        );

      if (
        this.lateBySeconds >
        0
      ) {
        this.eventType =
          "late";

        this.attendanceStatus =
          "late";
      }
    } else {
      this.eventType =
        "check_in";

      this.attendanceStatus =
        "present";
    }

    return this.save();
  };

attendanceEventSchema.methods.setCheckOut =
  async function ({
    at = new Date(),
  } = {}) {
    this.checkOutAt =
      at;

    this.occurredAt =
      at;

    if (
      this.scheduledEndAt &&
      at <
        this.scheduledEndAt
    ) {
      this.earlyExitBySeconds =
        Math.floor(
          (this.scheduledEndAt.getTime() -
            at.getTime()) /
            1000
        );

      if (
        this.earlyExitBySeconds >
        0
      ) {
        this.eventType =
          "early_exit";
      }
    } else {
      this.eventType =
        "check_out";
    }

    if (
      this.checkInAt
    ) {
      this.durationSeconds =
        Math.max(
          0,
          Math.floor(
            (at.getTime() -
              this.checkInAt.getTime()) /
              1000
          )
        );
    }

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

attendanceEventSchema.statics.findDailyEvents =
  function (
    instituteId,
    userId,
    date
  ) {
    const start =
      new Date(date);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 1
    );

    return this.find({
      instituteId,
      userId,
      effectiveDate: {
        $gte: start,
        $lt: end,
      },
      voidedAt: null,
    }).sort({
      occurredAt: 1,
    });
  };

attendanceEventSchema.statics.findForClass =
  function (
    instituteId,
    classId,
    startDate,
    endDate
  ) {
    return this.find({
      instituteId,
      classId,
      effectiveDate: {
        $gte: startDate,
        $lte: endDate,
      },
      voidedAt: null,
    }).sort({
      effectiveDate: 1,
      occurredAt: 1,
    });
  };

attendanceEventSchema.statics.findPendingVerification =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "verification.status":
        "pending",
      voidedAt: null,
    })
      .sort({
        occurredAt: 1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const AttendanceEvent =
  mongoose.models.AttendanceEvent ||
  mongoose.model(
    "AttendanceEvent",
    attendanceEventSchema
  );

export {
  ATTENDANCE_EVENT_TYPES,
  ATTENDANCE_SOURCES,
  VERIFICATION_METHODS,
  VERIFICATION_STATUS,
  EVENT_STATUS,
};