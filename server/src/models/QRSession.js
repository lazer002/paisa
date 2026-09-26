// server/src/models/QRSession.js

import mongoose from "mongoose";
import crypto from "crypto";

const QR_SESSION_TYPES = [
  "attendance",
  "check_in",
  "check_out",
  "live_session",
  "event",
  "exam",
  "class",
  "visitor",
  "access",
];

const QR_SESSION_STATUS = [
  "draft",
  "active",
  "paused",
  "expired",
  "completed",
  "cancelled",
  "revoked",
];

const QR_SCAN_STATUS = [
  "accepted",
  "rejected",
  "expired",
  "duplicate",
  "invalid",
  "outside_geofence",
  "unauthorized",
  "rate_limited",
];

const QR_SECURITY_LEVELS = [
  "standard",
  "secure",
  "high",
];

const qrScanSchema =
  new mongoose.Schema(
    {
      _id: false,

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        default: null,
      },

      scannedAt: {
        type: Date,
        default: Date.now,
      },

      status: {
        type: String,
        enum: QR_SCAN_STATUS,
        required: true,
      },

      verificationMethod: {
        type: String,
        enum: [
          "qr",
          "qr_geofence",
          "qr_device",
          "qr_live_session",
          "multi_factor",
        ],
        default: "qr",
      },

      ipHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },

      fingerprintHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },

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

      geofenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Geofence",
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      attendanceEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttendanceEvent",
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

const qrSessionSchema =
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
      /* SESSION IDENTITY                                                      */
      /* ==================================================================== */

      sessionCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        index: true,
      },

      sessionType: {
        type: String,
        enum: QR_SESSION_TYPES,
        default: "attendance",
        index: true,
      },

      status: {
        type: String,
        enum: QR_SESSION_STATUS,
        default: "draft",
        index: true,
      },

      securityLevel: {
        type: String,
        enum: QR_SECURITY_LEVELS,
        default: "secure",
      },

      /* ==================================================================== */
      /* CONTEXT                                                               */
      /* ==================================================================== */

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
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
      },

      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null,
        index: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* TOKEN                                                                */
      /* ==================================================================== */

      tokenHash: {
        type: String,
        required: true,
        select: false,
        unique: true,
        maxlength: 128,
      },

      tokenVersion: {
        type: Number,
        min: 1,
        default: 1,
      },

      nonceHash: {
        type: String,
        select: false,
        maxlength: 128,
        default: null,
      },

      rotationEnabled: {
        type: Boolean,
        default: true,
      },

      rotationSeconds: {
        type: Number,
        min: 5,
        max: 3600,
        default: 30,
      },

      lastRotatedAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* LIFETIME                                                             */
      /* ==================================================================== */

      startsAt: {
        type: Date,
        required: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* SCAN POLICY                                                           */
      /* ==================================================================== */

      maxScans: {
        type: Number,
        min: 1,
        default: 10000,
      },

      scanCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      uniqueScannerCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      duplicateScanCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      failedScanCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      allowMultipleScansPerUser: {
        type: Boolean,
        default: false,
      },

      minimumScanIntervalSeconds: {
        type: Number,
        min: 0,
        max: 86400,
        default: 30,
      },

      maxScansPerUser: {
        type: Number,
        min: 1,
        default: 1,
      },

      /* ==================================================================== */
      /* AUTHORIZATION                                                         */
      /* ==================================================================== */

      allowedRoles: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 100,
          },
        ],
        default: [],
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

      restrictToClass: {
        type: Boolean,
        default: false,
      },

      restrictToEnrollment: {
        type: Boolean,
        default: false,
      },

      /* ==================================================================== */
      /* DEVICE SECURITY                                                       */
      /* ==================================================================== */

      devicePolicy: {
        enabled: {
          type: Boolean,
          default: false,
        },

        requireRegisteredDevice: {
          type: Boolean,
          default: false,
        },

        allowNewDevice: {
          type: Boolean,
          default: true,
        },

        singleDevicePerUser: {
          type: Boolean,
          default: true,
        },

        requireApp: {
          type: Boolean,
          default: false,
        },

        minimumAppVersion: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },
      },

      /* ==================================================================== */
      /* GEOLOCATION                                                           */
      /* ==================================================================== */

      geofence: {
        enabled: {
          type: Boolean,
          default: false,
        },

        geofenceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Geofence",
          default: null,
        },

        radiusMeters: {
          type: Number,
          min: 1,
          max: 100000,
          default: null,
        },

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

        maxAccuracyMeters: {
          type: Number,
          min: 1,
          max: 10000,
          default: 100,
        },

        requireLocationPermission: {
          type: Boolean,
          default: true,
        },
      },

      /* ==================================================================== */
      /* ANTI-REPLAY                                                          */
      /* ==================================================================== */

      antiReplay: {
        enabled: {
          type: Boolean,
          default: true,
        },

        oneTimeNonce: {
          type: Boolean,
          default: true,
        },

        nonceLifetimeSeconds: {
          type: Number,
          min: 5,
          max: 3600,
          default: 60,
        },

        bindToDevice: {
          type: Boolean,
          default: false,
        },

        bindToUser: {
          type: Boolean,
          default: true,
        },

        requireFreshToken: {
          type: Boolean,
          default: true,
        },
      },

      /* ==================================================================== */
      /* RATE LIMITING                                                         */
      /* ==================================================================== */

      rateLimit: {
        enabled: {
          type: Boolean,
          default: true,
        },

        maxAttemptsPerMinute: {
          type: Number,
          min: 1,
          max: 10000,
          default: 10,
        },

        maxFailuresPerMinute: {
          type: Number,
          min: 1,
          max: 10000,
          default: 5,
        },

        blockDurationSeconds: {
          type: Number,
          min: 1,
          max: 86400,
          default: 300,
        },
      },

      /* ==================================================================== */
      /* SCANS                                                                 */
      /* ==================================================================== */

      scans: {
        type: [qrScanSchema],
        default: [],
      },

      /* ==================================================================== */
      /* ATTENDANCE                                                            */
      /* ==================================================================== */

      attendance: {
        enabled: {
          type: Boolean,
          default: true,
        },

        eventType: {
          type: String,
          enum: [
            "check_in",
            "check_out",
            "present",
            "late",
          ],
          default: "present",
        },

        autoCreateEvent: {
          type: Boolean,
          default: true,
        },

        markLate: {
          type: Boolean,
          default: true,
        },

        gracePeriodMinutes: {
          type: Number,
          min: 0,
          max: 240,
          default: 10,
        },
      },

      /* ==================================================================== */
      /* DISPLAY                                                               */
      /* ==================================================================== */

      display: {
        title: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        subtitle: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        logoUrl: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        refreshAutomatically: {
          type: Boolean,
          default: true,
        },

        refreshSeconds: {
          type: Number,
          min: 5,
          max: 3600,
          default: 30,
        },
      },

      /* ==================================================================== */
      /* ANALYTICS                                                             */
      /* ==================================================================== */

      analytics: {
        successfulScans: {
          type: Number,
          min: 0,
          default: 0,
        },

        rejectedScans: {
          type: Number,
          min: 0,
          default: 0,
        },

        expiredScans: {
          type: Number,
          min: 0,
          default: 0,
        },

        unauthorizedScans: {
          type: Number,
          min: 0,
          default: 0,
        },

        geofenceFailures: {
          type: Number,
          min: 0,
          default: 0,
        },

        deviceFailures: {
          type: Number,
          min: 0,
          default: 0,
        },

        averageScanIntervalSeconds: {
          type: Number,
          min: 0,
          default: 0,
        },

        peakScansPerMinute: {
          type: Number,
          min: 0,
          default: 0,
        },

        lastSuccessfulScanAt: {
          type: Date,
          default: null,
        },

        lastFailedScanAt: {
          type: Date,
          default: null,
        },

        updatedAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* AUDIT                                                                 */
      /* ==================================================================== */

      correlationId: {
        type: String,
        trim: true,
        maxlength: 150,
        index: true,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      /* ==================================================================== */
      /* LIFECYCLE                                                             */
      /* ==================================================================== */

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

qrSessionSchema.index(
  {
    instituteId: 1,
    sessionCode: 1,
  },
  {
    name: "tenant_qr_session_code",
    unique: true,
    sparse: true,
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    status: 1,
    startsAt: 1,
    expiresAt: 1,
  },
  {
    name: "active_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    sessionType: 1,
    startsAt: -1,
  },
  {
    name: "qr_session_history",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    classId: 1,
    startsAt: -1,
  },
  {
    name: "class_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    liveSessionId: 1,
    startsAt: -1,
  },
  {
    name: "live_session_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    teacherId: 1,
    startsAt: -1,
  },
  {
    name: "teacher_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    createdBy: 1,
    startsAt: -1,
  },
  {
    name: "creator_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    "scans.userId": 1,
    startsAt: -1,
  },
  {
    name: "user_qr_scan_history",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    "scans.scannedAt": -1,
  },
  {
    name: "qr_scan_timeline",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    "geofence.geofenceId": 1,
    startsAt: -1,
  },
  {
    name: "geofence_qr_sessions",
  }
);

qrSessionSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    expiresAt: 1,
  },
  {
    name: "qr_expiration_queue",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

qrSessionSchema.pre(
  "validate",
  function (next) {
    if (
      this.expiresAt <=
      this.startsAt
    ) {
      return next(
        new Error(
          "QR session expiration must be after start time"
        )
      );
    }

    if (
      this.maxScans < 1
    ) {
      return next(
        new Error(
          "Maximum scans must be at least 1"
        )
      );
    }

    if (
      this.scanCount >
      this.maxScans
    ) {
      return next(
        new Error(
          "Scan count cannot exceed maximum scans"
        )
      );
    }

    if (
      this.geofence.enabled
    ) {
      if (
        !this.geofence.geofenceId &&
        (
          this.geofence.latitude === null ||
          this.geofence.longitude === null ||
          this.geofence.radiusMeters === null
        )
      ) {
        return next(
          new Error(
            "Geofence configuration requires either a geofence ID or coordinates and radius"
          )
        );
      }
    }

    if (
      this.devicePolicy.requireRegisteredDevice &&
      !this.devicePolicy.enabled
    ) {
      return next(
        new Error(
          "Device policy must be enabled when registered devices are required"
        )
      );
    }

    if (
      this.antiReplay.bindToDevice &&
      !this.devicePolicy.enabled
    ) {
      return next(
        new Error(
          "Device policy must be enabled when QR tokens are bound to devices"
        )
      );
    }

    if (
      this.sessionType ===
        "live_session" &&
      !this.liveSessionId
    ) {
      return next(
        new Error(
          "Live session ID is required for live-session QR sessions"
        )
      );
    }

    if (
      this.sessionType ===
        "attendance" &&
      this.attendance.enabled &&
      !this.attendance.autoCreateEvent &&
      !this.attendanceId
    ) {
      return next(
        new Error(
          "Attendance ID is required when automatic attendance event creation is disabled"
        )
      );
    }

    if (
      this.scans.length >
      10000
    ) {
      return next(
        new Error(
          "QR session cannot embed more than 10,000 scans"
        )
      );
    }

    if (
      this.allowedUserIds.length >
      100000
    ) {
      return next(
        new Error(
          "QR session cannot contain more than 100,000 explicitly allowed users"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

qrSessionSchema.virtual(
  "isActive"
).get(function () {
  const now =
    new Date();

  return (
    !this.isDeleted &&
    this.status ===
      "active" &&
    now >=
      this.startsAt &&
    now <
      this.expiresAt
  );
});

qrSessionSchema.virtual(
  "isExpired"
).get(function () {
  return (
    this.status ===
      "expired" ||
    (
      this.expiresAt &&
      this.expiresAt <=
        new Date()
    )
  );
});

qrSessionSchema.virtual(
  "remainingSeconds"
).get(function () {
  if (
    !this.expiresAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (this.expiresAt.getTime() -
        Date.now()) /
        1000
    )
  );
});

qrSessionSchema.virtual(
  "scanUtilizationPercentage"
).get(function () {
  if (
    !this.maxScans
  ) {
    return 0;
  }

  return Math.round(
    Math.min(
      100,
      (this.scanCount /
        this.maxScans) *
        100
    ) * 100
  ) / 100;
});

qrSessionSchema.virtual(
  "successRate"
).get(function () {
  if (
    !this.scanCount
  ) {
    return 0;
  }

  return Math.round(
    (
      this.analytics
        .successfulScans /
      this.scanCount
    ) *
      10000
  ) / 100;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

qrSessionSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

qrSessionSchema.query.active =
  function () {
    const now =
      new Date();

    return this.where({
      isDeleted: false,
      status: "active",
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    });
  };

qrSessionSchema.query.byClass =
  function (
    classId
  ) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

qrSessionSchema.query.byLiveSession =
  function (
    liveSessionId
  ) {
    return this.where({
      liveSessionId,
      isDeleted: false,
    });
  };

qrSessionSchema.query.byTeacher =
  function (
    teacherId
  ) {
    return this.where({
      teacherId,
      isDeleted: false,
    });
  };

qrSessionSchema.query.expired =
  function () {
    return this.where({
      isDeleted: false,
      expiresAt: {
        $lte: new Date(),
      },
    });
  };

/* ============================================================================
 * TOKEN HELPERS
 * ========================================================================== */

qrSessionSchema.statics.generateToken =
  function () {
    return crypto
      .randomBytes(32)
      .toString("hex");
  };

qrSessionSchema.statics.hashToken =
  function (
    token
  ) {
    return crypto
      .createHash("sha256")
      .update(
        String(token)
      )
      .digest("hex");
  };

qrSessionSchema.methods.rotateToken =
  async function () {
    if (
      !this.rotationEnabled
    ) {
      return null;
    }

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    this.tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    this.tokenVersion +=
      1;

    this.lastRotatedAt =
      new Date();

    await this.save();

    return token;
  };

qrSessionSchema.methods.verifyToken =
  function (
    token
  ) {
    if (
      !token ||
      !this.tokenHash
    ) {
      return false;
    }

    const suppliedHash =
      crypto
        .createHash("sha256")
        .update(
          String(token)
        )
        .digest("hex");

    const expected =
      Buffer.from(
        this.tokenHash,
        "utf8"
      );

    const supplied =
      Buffer.from(
        suppliedHash,
        "utf8"
      );

    if (
      expected.length !==
      supplied.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expected,
      supplied
    );
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

qrSessionSchema.methods.activate =
  async function () {
    if (
      ![
        "draft",
        "paused",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "QR session cannot be activated from its current state"
      );
    }

    const now =
      new Date();

    if (
      now >=
      this.expiresAt
    ) {
      throw new Error(
        "QR session has already expired"
      );
    }

    this.status =
      "active";

    if (
      this.startsAt <
      now
    ) {
      this.startsAt =
        now;
    }

    return this.save();
  };

qrSessionSchema.methods.pause =
  async function () {
    if (
      this.status !==
      "active"
    ) {
      throw new Error(
        "Only active QR sessions can be paused"
      );
    }

    this.status =
      "paused";

    return this.save();
  };

qrSessionSchema.methods.resume =
  async function () {
    if (
      this.status !==
      "paused"
    ) {
      throw new Error(
        "Only paused QR sessions can be resumed"
      );
    }

    if (
      new Date() >=
      this.expiresAt
    ) {
      this.status =
        "expired";

      await this.save();

      throw new Error(
        "QR session has expired"
      );
    }

    this.status =
      "active";

    return this.save();
  };

qrSessionSchema.methods.complete =
  async function () {
    if (
      [
        "completed",
        "cancelled",
        "revoked",
      ].includes(
        this.status
      )
    ) {
      return this;
    }

    this.status =
      "completed";

    this.completedAt =
      new Date();

    return this.save();
  };

qrSessionSchema.methods.cancel =
  async function () {
    if (
      [
        "completed",
        "expired",
        "revoked",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "QR session cannot be cancelled from its current state"
      );
    }

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    return this.save();
  };

qrSessionSchema.methods.revoke =
  async function () {
    if (
      this.status ===
      "revoked"
    ) {
      return this;
    }

    this.status =
      "revoked";

    this.revokedAt =
      new Date();

    return this.save();
  };

qrSessionSchema.methods.expire =
  async function () {
    if (
      [
        "completed",
        "cancelled",
        "revoked",
      ].includes(
        this.status
      )
    ) {
      return this;
    }

    this.status =
      "expired";

    return this.save();
  };

qrSessionSchema.methods.isUserAuthorized =
  function ({
    userId,
    role = null,
    classId = null,
  } = {}) {
    if (
      !userId
    ) {
      return false;
    }

    if (
      this.allowedUserIds.length >
        0 &&
      !this.allowedUserIds.some(
        (id) =>
          id.toString() ===
          userId.toString()
      )
    ) {
      return false;
    }

    if (
      this.allowedRoles.length >
        0 &&
      (
        !role ||
        !this.allowedRoles.includes(
          role
        )
      )
    ) {
      return false;
    }

    if (
      this.restrictToClass &&
      (
        !classId ||
        !this.classId ||
        this.classId.toString() !==
          classId.toString()
      )
    ) {
      return false;
    }

    return true;
  };

qrSessionSchema.methods.isWithinGeofence =
  function ({
    latitude,
    longitude,
    accuracyMeters = null,
  } = {}) {
    if (
      !this.geofence.enabled
    ) {
      return true;
    }

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return false;
    }

    if (
      accuracyMeters !==
        null &&
      accuracyMeters >
        this.geofence.maxAccuracyMeters
    ) {
      return false;
    }

    if (
      this.geofence.geofenceId
    ) {
      return null;
    }

    if (
      this.geofence.latitude ===
        null ||
      this.geofence.longitude ===
        null ||
      this.geofence.radiusMeters ===
        null
    ) {
      return false;
    }

    const toRadians =
      (value) =>
        (value *
          Math.PI) /
        180;

    const earthRadius =
      6371000;

    const dLat =
      toRadians(
        latitude -
          this.geofence
            .latitude
      );

    const dLon =
      toRadians(
        longitude -
          this.geofence
            .longitude
      );

    const lat1 =
      toRadians(
        this.geofence
          .latitude
      );

    const lat2 =
      toRadians(
        latitude
      );

    const a =
      Math.sin(
        dLat / 2
      ) **
        2 +
      Math.sin(
        dLon / 2
      ) **
        2 *
        Math.cos(lat1) *
        Math.cos(lat2);

    const distance =
      2 *
      earthRadius *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return (
      distance <=
      this.geofence
        .radiusMeters
    );
  };

qrSessionSchema.methods.recordScan =
  async function ({
    userId,
    deviceId = null,
    status = "accepted",
    verificationMethod = "qr",
    ipHash = null,
    fingerprintHash = null,
    latitude = null,
    longitude = null,
    accuracyMeters = null,
    geofenceId = null,
    reason = null,
    attendanceEventId = null,
    metadata = null,
  } = {}) {
    if (
      !userId
    ) {
      throw new Error(
        "User ID is required"
      );
    }

    if (
      this.scans.length >=
      this.maxScans
    ) {
      throw new Error(
        "Maximum QR scan limit has been reached"
      );
    }

    const now =
      new Date();

    this.scans.push({
      userId,
      deviceId,
      scannedAt: now,
      status,
      verificationMethod,
      ipHash,
      fingerprintHash,
      latitude,
      longitude,
      accuracyMeters,
      geofenceId,
      reason,
      attendanceEventId,
      metadata,
    });

    this.scanCount +=
      1;

    if (
      status ===
      "accepted"
    ) {
      this.analytics.successfulScans +=
        1;

      this.analytics.lastSuccessfulScanAt =
        now;
    } else {
      this.failedScanCount +=
        1;

      this.analytics.rejectedScans +=
        1;

      this.analytics.lastFailedScanAt =
        now;
    }

    if (
      status ===
      "duplicate"
    ) {
      this.duplicateScanCount +=
        1;
    }

    if (
      status ===
      "expired"
    ) {
      this.analytics.expiredScans +=
        1;
    }

    if (
      status ===
      "unauthorized"
    ) {
      this.analytics.unauthorizedScans +=
        1;
    }

    if (
      status ===
      "outside_geofence"
    ) {
      this.analytics.geofenceFailures +=
        1;
    }

    if (
      status ===
      "accepted"
    ) {
      this.uniqueScannerCount =
        new Set(
          this.scans
            .filter(
              (scan) =>
                scan.status ===
                "accepted"
            )
            .map(
              (scan) =>
                scan.userId?.toString()
            )
        ).size;
    }

    this.analytics.updatedAt =
      now;

    return this.save();
  };

qrSessionSchema.methods.canUserScan =
  function ({
    userId,
    role = null,
    classId = null,
    deviceId = null,
    latitude = null,
    longitude = null,
    accuracyMeters = null,
  } = {}) {
    if (
      !userId
    ) {
      return {
        allowed: false,
        reason:
          "USER_REQUIRED",
      };
    }

    if (
      !this.isActive
    ) {
      return {
        allowed: false,
        reason:
          this.isExpired
            ? "QR_EXPIRED"
            : "QR_NOT_ACTIVE",
      };
    }

    if (
      this.scanCount >=
      this.maxScans
    ) {
      return {
        allowed: false,
        reason:
          "SCAN_LIMIT_REACHED",
      };
    }

    if (
      !this.isUserAuthorized({
        userId,
        role,
        classId,
      })
    ) {
      return {
        allowed: false,
        reason:
          "UNAUTHORIZED",
      };
    }

    const userScans =
      this.scans.filter(
        (scan) =>
          scan.userId?.toString() ===
          userId.toString()
      );

    if (
      !this.allowMultipleScansPerUser &&
      userScans.some(
        (scan) =>
          scan.status ===
          "accepted"
      )
    ) {
      return {
        allowed: false,
        reason:
          "ALREADY_SCANNED",
      };
    }

    if (
      userScans.length >=
      this.maxScansPerUser
    ) {
      return {
        allowed: false,
        reason:
          "USER_SCAN_LIMIT_REACHED",
      };
    }

    if (
      this.devicePolicy.enabled &&
      this.devicePolicy.requireRegisteredDevice &&
      !deviceId
    ) {
      return {
        allowed: false,
        reason:
          "DEVICE_REQUIRED",
      };
    }

    if (
      this.geofence.enabled
    ) {
      const inside =
        this.isWithinGeofence({
          latitude,
          longitude,
          accuracyMeters,
        });

      if (
        inside === false
      ) {
        return {
          allowed: false,
          reason:
            "OUTSIDE_GEOFENCE",
        };
      }
    }

    if (
      this.minimumScanIntervalSeconds >
      0
    ) {
      const lastAccepted =
        [...userScans]
          .reverse()
          .find(
            (scan) =>
              scan.status ===
              "accepted"
          );

      if (
        lastAccepted
      ) {
        const elapsed =
          Math.floor(
            (Date.now() -
              lastAccepted.scannedAt.getTime()) /
              1000
          );

        if (
          elapsed <
          this.minimumScanIntervalSeconds
        ) {
          return {
            allowed: false,
            reason:
              "SCAN_TOO_FREQUENT",
            retryAfterSeconds:
              this.minimumScanIntervalSeconds -
              elapsed,
          };
        }
      }
    }

    return {
      allowed: true,
      reason: null,
    };
  };

qrSessionSchema.methods.softDelete =
  async function () {
    if (
      this.status ===
      "active"
    ) {
      throw new Error(
        "Active QR sessions cannot be deleted"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

qrSessionSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

qrSessionSchema.statics.createSecureSession =
  async function ({
    instituteId,
    createdBy,
    startsAt,
    expiresAt,
    sessionType = "attendance",
    classId = null,
    liveSessionId = null,
    attendanceId = null,
    teacherId = null,
    maxScans = 10000,
    securityLevel = "secure",
    geofence = {},
    metadata = null,
  } = {}) {
    const rawToken =
      this.generateToken();

    const tokenHash =
      this.hashToken(
        rawToken
      );

    const sessionCode =
      crypto
        .randomBytes(6)
        .toString("hex")
        .toUpperCase();

    const session =
      await this.create({
        instituteId,
        createdBy,
        sessionCode,
        sessionType,
        status: "draft",
        securityLevel,
        classId,
        liveSessionId,
        attendanceId,
        teacherId,
        tokenHash,
        startsAt,
        expiresAt,
        maxScans,
        geofence,
        metadata,
      });

    return {
      session,
      token: rawToken,
    };
  };

qrSessionSchema.statics.findActiveForClass =
  function (
    instituteId,
    classId
  ) {
    const now =
      new Date();

    return this.find({
      instituteId,
      classId,
      isDeleted: false,
      status: "active",
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    }).sort({
      startsAt: -1,
    });
  };

qrSessionSchema.statics.findActiveForLiveSession =
  function (
    instituteId,
    liveSessionId
  ) {
    const now =
      new Date();

    return this.findOne({
      instituteId,
      liveSessionId,
      isDeleted: false,
      status: "active",
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    }).sort({
      createdAt: -1,
    });
  };

qrSessionSchema.statics.expireSessions =
  async function (
    limit = 1000
  ) {
    const now =
      new Date();

    const sessions =
      await this.find({
        status: {
          $in: [
            "draft",
            "active",
            "paused",
          ],
        },
        expiresAt: {
          $lte: now,
        },
      })
        .select("_id")
        .limit(limit);

    if (
      !sessions.length
    ) {
      return {
        matched: 0,
        modified: 0,
      };
    }

    const ids =
      sessions.map(
        (session) =>
          session._id
      );

    const result =
      await this.updateMany(
        {
          _id: {
            $in: ids,
          },
        },
        {
          $set: {
            status:
              "expired",
          },
        }
      );

    return {
      matched:
        result.matchedCount ??
        result.n,
      modified:
        result.modifiedCount ??
        result.nModified,
    };
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const QRSession =
  mongoose.models.QRSession ||
  mongoose.model(
    "QRSession",
    qrSessionSchema
  );

export {
  QR_SESSION_TYPES,
  QR_SESSION_STATUS,
  QR_SCAN_STATUS,
  QR_SECURITY_LEVELS,
};