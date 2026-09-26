// server/src/models/Attendance.js

import mongoose from "mongoose";

/**
 * ATTENDANCE
 *
 * Designed as the long-term attendance foundation for PAISA:
 *
 * Web
 * ├── Admin marks attendance
 * ├── Teacher marks class attendance
 * └── HR manages employee attendance
 *
 * Future Mobile App
 * ├── Face recognition
 * ├── QR attendance
 * ├── Device check-in
 * ├── GPS / geofencing
 * ├── Wi-Fi / location verification
 * ├── Self check-in/out
 * ├── Biometric devices
 * ├── Live-class attendance
 * └── Attendance correction workflow
 *
 * IMPORTANT:
 * Face data itself should NOT be stored directly in this document.
 * A future biometric/face service should store encrypted biometric
 * templates separately and only return a verification result here.
 */

const ATTENDANCE_STATUS = [
  "present",
  "absent",
  "late",
  "leave",
  "half_day",
  "holiday",
  "week_off",
  "excused",
];

const ATTENDANCE_METHODS = [
  "manual",
  "self_checkin",
  "self_checkout",
  "qr",
  "face_recognition",
  "biometric",
  "mobile",
  "geofence",
  "wifi",
  "live_session",
  "import",
  "api",
];

const LOCATION_MODES = [
  "office",
  "campus",
  "classroom",
  "remote",
  "field",
  "geofence",
  "unknown",
];

const DEVICE_TYPES = [
  "web",
  "android",
  "ios",
  "tablet",
  "kiosk",
  "biometric_device",
  "unknown",
];

const VERIFICATION_STATUS = [
  "not_required",
  "pending",
  "verified",
  "failed",
  "manual_override",
];

const attendanceSchema = new mongoose.Schema(
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

    /* ---------------------------------------------------------------------- */
    /* ACADEMIC CONTEXT                                                        */
    /* ---------------------------------------------------------------------- */

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* DATE                                                                     */
    /* ---------------------------------------------------------------------- */

    /*
     * Store the attendance day normalized to the organization's timezone.
     *
     * Do not calculate "today" blindly using server timezone.
     * The attendance service should normalize this before creating the
     * document.
     */
    date: {
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

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                   */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUS,
        message: "Invalid attendance status",
      },
      default: "present",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* CHECK-IN / CHECK-OUT                                                    */
    /* ---------------------------------------------------------------------- */

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    workedMinutes: {
      type: Number,
      min: 0,
      max: 1440,
      default: null,
    },

    lateBy: {
      type: Number,
      min: 0,
      max: 1440,
      default: null,
    },

    earlyLeaveBy: {
      type: Number,
      min: 0,
      max: 1440,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* LOCATION                                                                 */
    /* ---------------------------------------------------------------------- */

    location: {
      mode: {
        type: String,
        enum: [
          ...LOCATION_MODES,
          null,
        ],
        default: null,
      },

      coordinates: {
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

        capturedAt: {
          type: Date,
          default: null,
        },
      },

      address: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      geofenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      distanceFromGeofenceMeters: {
        type: Number,
        min: 0,
        default: null,
      },

      verified: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* DEVICE                                                                    */
    /* ---------------------------------------------------------------------- */

    device: {
      type: {
        type: String,
        enum: DEVICE_TYPES,
        default: "web",
      },

      deviceId: {
        type: String,
        trim: true,
        maxlength: 255,
        default: null,
      },

      appVersion: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      osVersion: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      model: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ATTENDANCE VERIFICATION                                                  */
    /* ---------------------------------------------------------------------- */

    verification: {
      status: {
        type: String,
        enum: VERIFICATION_STATUS,
        default: "not_required",
      },

      method: {
        type: String,
        enum: [
          ...ATTENDANCE_METHODS,
          null,
        ],
        default: null,
      },

      verifiedAt: {
        type: Date,
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
        maxlength: 300,
        default: null,
      },

      /*
       * Reference only.
       *
       * Never store the raw face image or biometric template here.
       */
      provider: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      verificationId: {
        type: String,
        trim: true,
        maxlength: 255,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* QR / TOKEN ATTENDANCE                                                    */
    /* ---------------------------------------------------------------------- */

    qrAttendance: {
      used: {
        type: Boolean,
        default: false,
      },

      sessionId: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      scannedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* LIVE CLASS                                                               */
    /* ---------------------------------------------------------------------- */

    liveSession: {
      sessionId: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      joinedAt: {
        type: Date,
        default: null,
      },

      leftAt: {
        type: Date,
        default: null,
      },

      minutesPresent: {
        type: Number,
        min: 0,
        default: null,
      },

      autoMarked: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* NOTES                                                                    */
    /* ---------------------------------------------------------------------- */

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* AUDIT                                                                    */
    /* ---------------------------------------------------------------------- */

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    markedVia: {
      type: String,
      enum: ATTENDANCE_METHODS,
      default: "manual",
      index: true,
    },

    source: {
      type: String,
      enum: [
        "web",
        "mobile",
        "kiosk",
        "biometric",
        "live_class",
        "import",
        "api",
        "system",
      ],
      default: "web",
    },

    /* ---------------------------------------------------------------------- */
    /* EDIT HISTORY                                                             */
    /* ---------------------------------------------------------------------- */

    editHistory: [
      {
        _id: false,

        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        from: {
          type: String,
          trim: true,
          maxlength: 100,
        },

        to: {
          type: String,
          trim: true,
          maxlength: 100,
        },

        at: {
          type: Date,
          default: Date.now,
        },

        reason: {
          type: String,
          trim: true,
          maxlength: 300,
        },

        source: {
          type: String,
          enum: [
            "web",
            "mobile",
            "admin",
            "teacher",
            "hr",
            "system",
          ],
          default: "web",
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* CORRECTION WORKFLOW                                                      */
    /* ---------------------------------------------------------------------- */

    correction: {
      requested: {
        type: Boolean,
        default: false,
      },

      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      requestedAt: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      decision: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
          null,
        ],
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* SOFT DELETE                                                              */
    /* ---------------------------------------------------------------------- */

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
/* INDEXES                                                                    */
/* -------------------------------------------------------------------------- */

/*
 * One attendance record per user per class per day.
 *
 * IMPORTANT:
 * MongoDB treats null values as equal for unique indexes.
 * For future high-scale attendance, this should eventually be split into
 * separate "class attendance" and "employee attendance" indexes/collections
 * if the workload requires it.
 */
attendanceSchema.index(
  {
    instituteId: 1,
    userId: 1,
    date: 1,
    classId: 1,
  },
  {
    unique: true,
    name: "attendance_user_day_class_unique",
  }
);

attendanceSchema.index(
  {
    instituteId: 1,
    date: 1,
  },
  {
    name: "attendance_institute_date",
  }
);

attendanceSchema.index(
  {
    instituteId: 1,
    classId: 1,
    date: 1,
  },
  {
    name: "attendance_class_date",
  }
);

attendanceSchema.index(
  {
    instituteId: 1,
    userId: 1,
    date: -1,
  },
  {
    name: "attendance_user_history",
  }
);

attendanceSchema.index(
  {
    instituteId: 1,
    status: 1,
    date: -1,
  },
  {
    name: "attendance_status_date",
  }
);

attendanceSchema.index(
  {
    instituteId: 1,
    markedVia: 1,
    date: -1,
  },
  {
    name: "attendance_method_date",
  }
);

attendanceSchema.index(
  {
    "liveSession.sessionId": 1,
  },
  {
    sparse: true,
    name: "attendance_live_session",
  }
);

attendanceSchema.index(
  {
    "qrAttendance.sessionId": 1,
  },
  {
    sparse: true,
    name: "attendance_qr_session",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

attendanceSchema.pre(
  "validate",
  function (next) {
    if (
      this.checkIn &&
      this.checkOut &&
      this.checkOut < this.checkIn
    ) {
      return next(
        new Error(
          "Check-out cannot be before check-in"
        )
      );
    }

    if (
      this.checkIn &&
      this.checkOut
    ) {
      const minutes = Math.round(
        (
          this.checkOut.getTime() -
          this.checkIn.getTime()
        ) /
          60000
      );

      if (minutes < 0) {
        return next(
          new Error(
            "Invalid worked duration"
          )
        );
      }

      this.workedMinutes =
        Math.min(
          minutes,
          1440
        );
    }

    if (
      this.status === "half_day" &&
      this.workedMinutes != null &&
      this.workedMinutes > 720
    ) {
      return next(
        new Error(
          "Half-day attendance cannot contain more than 12 worked hours"
        )
      );
    }

    const latitude =
      this.location?.coordinates
        ?.latitude;

    const longitude =
      this.location?.coordinates
        ?.longitude;

    if (
      (latitude != null &&
        longitude == null) ||
      (latitude == null &&
        longitude != null)
    ) {
      return next(
        new Error(
          "Latitude and longitude must be provided together"
        )
      );
    }

    if (
      this.verification?.confidence !=
        null &&
      this.verification.status !==
        "verified"
    ) {
      this.verification.confidence =
        null;
    }

    if (
      this.status === "holiday" ||
      this.status === "week_off"
    ) {
      this.checkIn = null;
      this.checkOut = null;
      this.workedMinutes = null;
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

attendanceSchema.virtual(
  "hoursWorked"
).get(function () {
  if (
    this.workedMinutes == null
  ) {
    return null;
  }

  return Math.round(
    (this.workedMinutes / 60) *
      10
  ) / 10;
});

attendanceSchema.virtual(
  "isCheckedIn"
).get(function () {
  return Boolean(
    this.checkIn &&
      !this.checkOut
  );
});

attendanceSchema.virtual(
  "isCheckedOut"
).get(function () {
  return Boolean(
    this.checkIn &&
      this.checkOut
  );
});

attendanceSchema.virtual(
  "isVerified"
).get(function () {
  return (
    this.verification?.status ===
      "verified" ||
    this.verification?.status ===
      "manual_override"
  );
});

attendanceSchema.virtual(
  "isLocationVerified"
).get(function () {
  return (
    this.location?.verified ===
    true
  );
});

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

attendanceSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

attendanceSchema.query.byUser =
  function (userId) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

attendanceSchema.query.byClass =
  function (classId) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

attendanceSchema.query.byDate =
  function (date) {
    return this.where({
      date,
      isDeleted: false,
    });
  };

attendanceSchema.query.present =
  function () {
    return this.where({
      status: {
        $in: [
          "present",
          "late",
          "half_day",
        ],
      },
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

attendanceSchema.methods.checkInNow =
  async function ({
    markedBy = null,
    markedVia = "self_checkin",
    source = "mobile",
    location = null,
    device = null,
    verification = null,
  } = {}) {
    if (this.checkIn) {
      throw new Error(
        "Attendance is already checked in"
      );
    }

    const now = new Date();

    this.checkIn = now;
    this.status = "present";
    this.markedBy =
      markedBy;
    this.markedVia =
      markedVia;
    this.source =
      source;

    if (location) {
      this.location = location;
    }

    if (device) {
      this.device = device;
    }

    if (verification) {
      this.verification =
        verification;
    }

    return this.save();
  };

attendanceSchema.methods.checkOutNow =
  async function ({
    markedBy = null,
    source = "mobile",
  } = {}) {
    if (!this.checkIn) {
      throw new Error(
        "Cannot check out before check-in"
      );
    }

    if (this.checkOut) {
      throw new Error(
        "Attendance is already checked out"
      );
    }

    this.checkOut =
      new Date();

    this.markedBy =
      markedBy || this.markedBy;

    this.source =
      source;

    return this.save();
  };

attendanceSchema.methods.overrideStatus =
  async function ({
    status,
    editedBy,
    reason,
  }) {
    if (
      !ATTENDANCE_STATUS.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid attendance status"
      );
    }

    if (!editedBy) {
      throw new Error(
        "Editor is required"
      );
    }

    if (!reason?.trim()) {
      throw new Error(
        "Attendance correction reason is required"
      );
    }

    const previousStatus =
      this.status;

    this.status =
      status;

    this.editHistory.push({
      editedBy,
      from: previousStatus,
      to: status,
      at: new Date(),
      reason:
        reason.trim(),
        source: "admin",
    });

    this.verification.status =
      "manual_override";

    this.verification.verifiedAt =
      new Date();

    return this.save();
  };

attendanceSchema.methods.requestCorrection =
  async function ({
    userId,
    reason,
  }) {
    if (!reason?.trim()) {
      throw new Error(
        "Correction reason is required"
      );
    }

    this.correction = {
      requested: true,
      requestedBy: userId,
      requestedAt: new Date(),
      reason:
        reason.trim(),
      reviewedBy: null,
      reviewedAt: null,
      decision: "pending",
    };

    return this.save();
  };

attendanceSchema.methods.reviewCorrection =
  async function ({
    reviewerId,
    decision,
  }) {
    if (
      ![
        "approved",
        "rejected",
      ].includes(decision)
    ) {
      throw new Error(
        "Invalid correction decision"
      );
    }

    if (
      !this.correction?.requested
    ) {
      throw new Error(
        "No correction request exists"
      );
    }

    this.correction.reviewedBy =
      reviewerId;

    this.correction.reviewedAt =
      new Date();

    this.correction.decision =
      decision;

    if (
      decision === "approved"
    ) {
      this.correction.requested =
        false;
    }

    return this.save();
  };

attendanceSchema.methods.softDelete =
  async function (
    deletedBy = null
  ) {
    this.isDeleted = true;
    this.deletedAt =
      new Date();
    this.deletedBy =
      deletedBy;

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* STATIC METHODS                                                             */
/* -------------------------------------------------------------------------- */

attendanceSchema.statics.findForDate =
  function ({
    instituteId,
    date,
    classId = null,
  }) {
    const query = {
      instituteId,
      date,
      isDeleted: false,
    };

    if (classId) {
      query.classId =
        classId;
    }

    return this.find(query);
  };

attendanceSchema.statics.findUserAttendance =
  function ({
    instituteId,
    userId,
    startDate,
    endDate,
  }) {
    return this.find({
      instituteId,
      userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
      isDeleted: false,
    }).sort({
      date: -1,
    });
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

export const Attendance =
  mongoose.models.Attendance ||
  mongoose.model(
    "Attendance",
    attendanceSchema
  );

export {
  ATTENDANCE_STATUS,
  ATTENDANCE_METHODS,
  LOCATION_MODES,
  DEVICE_TYPES,
  VERIFICATION_STATUS,
};