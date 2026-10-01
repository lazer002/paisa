// server/src/models/Geofence.js

import mongoose from "mongoose";

import crypto from "node:crypto";
/* ============================================================================
 * ENUMS
 * ========================================================================== */

const GEOFENCE_STATUSES = [
  "draft",
  "active",
  "inactive",
  "suspended",
  "expired",
  "archived",
];

const GEOFENCE_TYPES = [
  "campus",
  "office",
  "branch",
  "classroom",
  "department",
  "warehouse",
  "site",
  "custom",
];

const SHAPE_TYPES = [
  "circle",
  "polygon",
];

const EVENT_TYPES = [
  "enter",
  "exit",
  "dwell",
];

const ACTION_TYPES = [
  "allow_attendance",
  "deny_attendance",
  "mark_present",
  "mark_absent",
  "notify",
  "log",
  "trigger_workflow",
];

const VERIFICATION_METHODS = [
  "gps",
  "network",
  "wifi",
  "bluetooth",
  "device",
  "hybrid",
];

const ACCURACY_MODES = [
  "strict",
  "standard",
  "relaxed",
];

const TIMEZONE_DEFAULT = "Asia/Kolkata";

/* ============================================================================
 * COORDINATE SCHEMA
 * ========================================================================== */

const coordinateSchema =
  new mongoose.Schema(
    {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },

      accuracy: {
        type: Number,
        min: 0,
        default: null,
      },

      altitude: {
        type: Number,
        default: null,
      },

      heading: {
        type: Number,
        min: 0,
        max: 360,
        default: null,
      },

      speed: {
        type: Number,
        min: 0,
        default: null,
      },

      capturedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * POLYGON POINT SCHEMA
 * ========================================================================== */

const polygonPointSchema =
  new mongoose.Schema(
    {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },

      sequence: {
        type: Number,
        min: 0,
        required: true,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * SCHEDULE SCHEMA
 * ========================================================================== */

const scheduleSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: false,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: TIMEZONE_DEFAULT,
      },

      daysOfWeek: {
        type: [
          {
            type: Number,
            min: 0,
            max: 6,
          },
        ],
        default: [
          1,
          2,
          3,
          4,
          5,
        ],
      },

      startTime: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "00:00",
      },

      endTime: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "23:59",
      },

      validFrom: {
        type: Date,
        default: null,
      },

      validUntil: {
        type: Date,
        default: null,
      },

      holidaysEnabled: {
        type: Boolean,
        default: false,
      },

      excludedDates: {
        type: [
          {
            type: Date,
          },
        ],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * ATTENDANCE CONFIGURATION
 * ========================================================================== */

const attendanceConfigSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: true,
      },

      attendanceTypes: {
        type: [
          {
            type: String,
            enum: [
              "student",
              "employee",
              "teacher",
            ],
          },
        ],
        default: [
          "student",
          "employee",
          "teacher",
        ],
      },

      allowCheckIn: {
        type: Boolean,
        default: true,
      },

      allowCheckOut: {
        type: Boolean,
        default: true,
      },

      requireCheckOut: {
        type: Boolean,
        default: false,
      },

      verificationRequired: {
        type: Boolean,
        default: true,
      },

      verificationMethods: {
        type: [
          {
            type: String,
            enum: VERIFICATION_METHODS,
          },
        ],
        default: [
          "gps",
        ],
      },

      accuracyMode: {
        type: String,
        enum: ACCURACY_MODES,
        default: "standard",
      },

      maximumAccuracyMeters: {
        type: Number,
        min: 1,
        max: 10000,
        default: 100,
      },

      allowOutsideRadiusMeters: {
        type: Number,
        min: 0,
        max: 10000,
        default: 0,
      },

      gracePeriodMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 0,
      },

      preventDuplicateCheckInMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 5,
      },

      requireDeviceRegistration: {
        type: Boolean,
        default: false,
      },

      requireTrustedDevice: {
        type: Boolean,
        default: false,
      },

      requireFaceVerification: {
        type: Boolean,
        default: false,
      },

      requireQrVerification: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * ACCESS POLICY
 * ========================================================================== */

const accessPolicySchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: true,
      },

      roles: {
        type: [
          {
            type: String,
            enum: [
              "super_admin",
              "admin",
              "teacher",
              "student",
              "hr",
              "employee",
            ],
          },
        ],
        default: [],
      },

      userIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        default: [],
      },

      employeeIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
        ],
        default: [],
      },

      studentIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
          },
        ],
        default: [],
      },

      teacherIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
          },
        ],
        default: [],
      },

      departmentIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
          },
        ],
        default: [],
      },

      classIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
          },
        ],
        default: [],
      },

      allowVisitors: {
        type: Boolean,
        default: false,
      },

      denyListUserIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * ACTION SCHEMA
 * ========================================================================== */

const actionSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        enum: ACTION_TYPES,
        required: true,
      },

      event: {
        type: String,
        enum: EVENT_TYPES,
        default: "enter",
      },

      enabled: {
        type: Boolean,
        default: true,
      },

      priority: {
        type: Number,
        min: 0,
        max: 1000,
        default: 100,
      },

      notificationTemplate: {
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

/* ============================================================================
 * SECURITY CONFIGURATION
 * ========================================================================== */

const securitySchema =
  new mongoose.Schema(
    {
      antiSpoofingEnabled: {
        type: Boolean,
        default: true,
      },

      requireMockLocationDetection: {
        type: Boolean,
        default: true,
      },

      rejectMockLocation: {
        type: Boolean,
        default: true,
      },

      requireHighAccuracyLocation: {
        type: Boolean,
        default: false,
      },

      minimumGpsAccuracyMeters: {
        type: Number,
        min: 1,
        max: 10000,
        default: 100,
      },

      maximumLocationAgeSeconds: {
        type: Number,
        min: 1,
        max: 86400,
        default: 120,
      },

      allowVpn: {
        type: Boolean,
        default: true,
      },

      allowProxy: {
        type: Boolean,
        default: true,
      },

      requireNetworkValidation: {
        type: Boolean,
        default: false,
      },

      requireDeviceValidation: {
        type: Boolean,
        default: false,
      },

      requireSessionValidation: {
        type: Boolean,
        default: true,
      },

      maxVerificationAttemptsPerHour: {
        type: Number,
        min: 1,
        max: 10000,
        default: 100,
      },

      suspiciousThreshold: {
        type: Number,
        min: 0,
        max: 100,
        default: 70,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * ANALYTICS
 * ========================================================================== */

const analyticsSchema =
  new mongoose.Schema(
    {
      totalVerifications: {
        type: Number,
        min: 0,
        default: 0,
      },

      successfulVerifications: {
        type: Number,
        min: 0,
        default: 0,
      },

      rejectedVerifications: {
        type: Number,
        min: 0,
        default: 0,
      },

      enterEvents: {
        type: Number,
        min: 0,
        default: 0,
      },

      exitEvents: {
        type: Number,
        min: 0,
        default: 0,
      },

      failedSecurityChecks: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastVerificationAt: {
        type: Date,
        default: null,
      },

      lastSuccessfulVerificationAt: {
        type: Date,
        default: null,
      },

      averageAccuracyMeters: {
        type: Number,
        min: 0,
        default: null,
      },

      averageDwellMinutes: {
        type: Number,
        min: 0,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * AUDIT CONFIGURATION
 * ========================================================================== */

const auditSchema =
  new mongoose.Schema(
    {
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

      activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      activatedAt: {
        type: Date,
        default: null,
      },

      deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deactivatedAt: {
        type: Date,
        default: null,
      },

      lastVerificationBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      lastVerificationAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================================
 * MAIN SCHEMA
 * ========================================================================== */

const geofenceSchema =
  new mongoose.Schema(
    {
      /* ====================================================================== */
      /* TENANCY                                                               */
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
    `geo_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ====================================================================== */
      /* IDENTITY                                                              */
      /* ====================================================================== */

      geofenceCode: {
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

      name: {
        type: String,
        trim: true,
        maxlength: 300,
        required: true,
      },

      slug: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 300,
        index: true,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      type: {
        type: String,
        enum: GEOFENCE_TYPES,
        default: "custom",
        index: true,
      },

      status: {
        type: String,
        enum: GEOFENCE_STATUSES,
        default: "draft",
        index: true,
      },

      /* ====================================================================== */
      /* LOCATION                                                              */
      /* ====================================================================== */

      shapeType: {
        type: String,
        enum: SHAPE_TYPES,
        default: "circle",
        required: true,
      },

      center: {
        type: coordinateSchema,
        default: null,
      },

      radiusMeters: {
        type: Number,
        min: 1,
        max: 100000,
        default: null,
      },

      polygon: {
        type: [polygonPointSchema],
        default: [],
      },

      boundaryVersion: {
        type: Number,
        min: 1,
        default: 1,
      },

      address: {
        line1: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        line2: {
          type: String,
          trim: true,
          maxlength: 500,
          default: null,
        },

        city: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        state: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        country: {
          type: String,
          trim: true,
          maxlength: 100,
          default: "India",
        },

        postalCode: {
          type: String,
          trim: true,
          maxlength: 30,
          default: null,
        },

        formatted: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: TIMEZONE_DEFAULT,
      },

      /* ====================================================================== */
      /* ASSOCIATIONS                                                          */
      /* ====================================================================== */

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
        index: true,
      },

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
        index: true,
      },

      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null,
      },

      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },

      /* ====================================================================== */
      /* SCHEDULE                                                              */
      /* ====================================================================== */

      schedule: {
        type: scheduleSchema,
        default: () => ({}),
      },

      /* ====================================================================== */
      /* ATTENDANCE                                                            */
      /* ====================================================================== */

      attendance: {
        type: attendanceConfigSchema,
        default: () => ({}),
      },

      /* ====================================================================== */
      /* ACCESS                                                                */
      /* ====================================================================== */

      accessPolicy: {
        type: accessPolicySchema,
        default: () => ({}),
      },

      /* ====================================================================== */
      /* EVENTS / ACTIONS                                                      */
      /* ====================================================================== */

      enabledEvents: {
        type: [
          {
            type: String,
            enum: EVENT_TYPES,
          },
        ],
        default: [
          "enter",
          "exit",
        ],
      },

      actions: {
        type: [actionSchema],
        default: [],
      },

      /* ====================================================================== */
      /* SECURITY                                                              */
      /* ====================================================================== */

      security: {
        type: securitySchema,
        default: () => ({}),
      },

      /* ====================================================================== */
      /* ANALYTICS                                                             */
      /* ====================================================================== */

      analytics: {
        type: analyticsSchema,
        default: () => ({}),
      },

      /* ====================================================================== */
      /* LIFECYCLE                                                             */
      /* ====================================================================== */

      effectiveFrom: {
        type: Date,
        default: null,
      },

      effectiveUntil: {
        type: Date,
        default: null,
      },

      activatedAt: {
        type: Date,
        default: null,
      },

      deactivatedAt: {
        type: Date,
        default: null,
      },

      archivedAt: {
        type: Date,
        default: null,
      },

      /* ====================================================================== */
      /* AUDIT                                                                 */
      /* ====================================================================== */

      audit: {
        type: auditSchema,
        default: () => ({}),
      },

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

      customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
      },

      /* ====================================================================== */
      /* SOFT DELETE / LEGAL HOLD                                              */
      /* ====================================================================== */

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

geofenceSchema.index(
  {
    instituteId: 1,
    geofenceCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_geofence_code",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    externalId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_geofence_external_id",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    slug: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_geofence_slug",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    status: 1,
    type: 1,
  },
  {
    name: "geofence_status_type",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    status: 1,
  },
  {
    name: "geofence_department_status",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    classId: 1,
    status: 1,
  },
  {
    name: "geofence_class_status",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    status: 1,
  },
  {
    name: "geofence_employee_status",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    "schedule.validFrom": 1,
    "schedule.validUntil": 1,
  },
  {
    name: "geofence_schedule",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    effectiveFrom: 1,
    effectiveUntil: 1,
  },
  {
    name: "geofence_effective_period",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "geofence_active_records",
  }
);

geofenceSchema.index(
  {
    instituteId: 1,
    name: "text",
    geofenceCode: "text",
    description: "text",
    "address.formatted": "text",
  },
  {
    name: "geofence_search",
    weights: {
      geofenceCode: 10,
      name: 10,
      description: 5,
      "address.formatted": 3,
    },
  }
);

/* ============================================================================
 * GEO INDEX
 *
 * GeoJSON is intentionally kept as a derived field rather than the source of
 * truth so the API can continue using latitude/longitude + polygon points.
 * ========================================================================== */

geofenceSchema.add({
  geo: {
    type: {
      type: String,
      enum: [
        "Point",
        "Polygon",
      ],
      default: null,
    },

    coordinates: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
  },
});

geofenceSchema.index(
  {
    geo: "2dsphere",
  },
  {
    sparse: true,
    name: "geofence_geo",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

geofenceSchema.pre(
  "validate",
  function (next) {
    if (
      this.shapeType ===
      "circle"
    ) {
      if (
        !this.center
      ) {
        return next(
          new Error(
            "Circle geofence requires a center"
          )
        );
      }

      if (
        !this.radiusMeters ||
        this.radiusMeters <= 0
      ) {
        return next(
          new Error(
            "Circle geofence requires a valid radius"
          )
        );
      }

      this.polygon = [];
    }

    if (
      this.shapeType ===
      "polygon"
    ) {
      if (
        !this.polygon ||
        this.polygon.length <
          3
      ) {
        return next(
          new Error(
            "Polygon geofence requires at least 3 points"
          )
        );
      }

      this.center = null;
      this.radiusMeters = null;

      const sequences =
        this.polygon.map(
          (point) =>
            point.sequence
        );

      const uniqueSequences =
        new Set(
          sequences
        );

      if (
        uniqueSequences.size !==
        sequences.length
      ) {
        return next(
          new Error(
            "Polygon point sequences must be unique"
          )
        );
      }
    }

    if (
      this.polygon &&
      this.polygon.length >
        5000
    ) {
      return next(
        new Error(
          "Polygon cannot contain more than 5000 points"
        )
      );
    }

    if (
      this.actions.length >
      100
    ) {
      return next(
        new Error(
          "Geofence cannot contain more than 100 actions"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Geofence cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.schedule.validFrom &&
      this.schedule.validUntil &&
      this.schedule.validUntil <
        this.schedule.validFrom
    ) {
      return next(
        new Error(
          "Schedule validUntil cannot be before validFrom"
        )
      );
    }

    if (
      this.effectiveFrom &&
      this.effectiveUntil &&
      this.effectiveUntil <
        this.effectiveFrom
    ) {
      return next(
        new Error(
          "effectiveUntil cannot be before effectiveFrom"
        )
      );
    }

    if (
      this.status ===
        "active" &&
      this.isDeleted
    ) {
      return next(
        new Error(
          "Deleted geofence cannot be active"
        )
      );
    }

    if (
      this.security.minimumGpsAccuracyMeters >
      this.attendance.maximumAccuracyMeters
    ) {
      return next(
        new Error(
          "Security GPS accuracy requirement cannot exceed attendance maximum accuracy"
        )
      );
    }

    this._buildGeo();

    next();
  }
);

/* ============================================================================
 * DERIVED GEOJSON
 * ========================================================================== */

geofenceSchema.methods._buildGeo =
  function () {
    if (
      this.shapeType ===
      "circle" &&
      this.center
    ) {
      this.geo = {
        type: "Point",
        coordinates: [
          this.center.longitude,
          this.center.latitude,
        ],
      };

      return;
    }

    if (
      this.shapeType ===
        "polygon" &&
      this.polygon?.length >=
        3
    ) {
      const points =
        [...this.polygon]
          .sort(
            (a, b) =>
              a.sequence -
              b.sequence
          )
          .map(
            (point) => [
              point.longitude,
              point.latitude,
            ]
          );

      const first =
        points[0];

      const last =
        points[
          points.length - 1
        ];

      if (
        first[0] !==
          last[0] ||
        first[1] !==
          last[1]
      ) {
        points.push(
          [...first]
        );
      }

      this.geo = {
        type: "Polygon",
        coordinates: [
          points,
        ],
      };
    }
  };

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

geofenceSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
      "active" &&
    !this.isDeleted
  );
});

geofenceSchema.virtual(
  "isScheduled"
).get(function () {
  return (
    this.schedule?.enabled ===
    true
  );
});

geofenceSchema.virtual(
  "pointCount"
).get(function () {
  return this.polygon?.length ||
    0;
});

geofenceSchema.virtual(
  "hasAttendance"
).get(function () {
  return (
    this.attendance?.enabled ===
    true
  );
});

geofenceSchema.virtual(
  "hasSecurityControls"
).get(function () {
  return (
    this.security?.antiSpoofingEnabled ===
      true ||
    this.security
      ?.requireMockLocationDetection ===
      true ||
    this.security
      ?.requireDeviceValidation ===
      true
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

geofenceSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

geofenceSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

geofenceSchema.query.attendanceEnabled =
  function () {
    return this.where({
      "attendance.enabled": true,
      status: "active",
      isDeleted: false,
    });
  };

geofenceSchema.query.byType =
  function (
    type
  ) {
    return this.where({
      type,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

geofenceSchema.methods.activate =
  async function (
    activatedBy = null
  ) {
    if (
      this.isDeleted
    ) {
      throw new Error(
        "Deleted geofence cannot be activated"
      );
    }

    this.status =
      "active";

    this.activatedAt =
      new Date();

    this.deactivatedAt =
      null;

    this.audit.activatedBy =
      activatedBy;

    this.audit.activatedAt =
      new Date();

    return this.save();
  };

geofenceSchema.methods.deactivate =
  async function (
    deactivatedBy = null
  ) {
    this.status =
      "inactive";

    this.deactivatedAt =
      new Date();

    this.audit.deactivatedBy =
      deactivatedBy;

    this.audit.deactivatedAt =
      new Date();

    return this.save();
  };

geofenceSchema.methods.suspend =
  async function (
    suspendedBy = null
  ) {
    this.status =
      "suspended";

    this.audit.updatedBy =
      suspendedBy;

    return this.save();
  };

geofenceSchema.methods.archive =
  async function (
    archivedBy = null
  ) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    this.audit.updatedBy =
      archivedBy;

    return this.save();
  };

geofenceSchema.methods.expire =
  async function () {
    this.status =
      "expired";

    return this.save();
  };

geofenceSchema.methods.updateBoundary =
  async function ({
    shapeType,
    center = null,
    radiusMeters = null,
    polygon = [],
    updatedBy = null,
  } = {}) {
    if (
      !SHAPE_TYPES.includes(
        shapeType
      )
    ) {
      throw new Error(
        "Invalid geofence shape"
      );
    }

    this.shapeType =
      shapeType;

    this.center =
      shapeType ===
      "circle"
        ? center
        : null;

    this.radiusMeters =
      shapeType ===
      "circle"
        ? radiusMeters
        : null;

    this.polygon =
      shapeType ===
      "polygon"
        ? polygon
        : [];

    this.boundaryVersion +=
      1;

    this.audit.updatedBy =
      updatedBy;

    return this.save();
  };

geofenceSchema.methods.addAction =
  async function (
    action
  ) {
    if (
      this.actions.length >=
      100
    ) {
      throw new Error(
        "Maximum action limit reached"
      );
    }

    if (
      !ACTION_TYPES.includes(
        action.type
      )
    ) {
      throw new Error(
        "Invalid geofence action"
      );
    }

    this.actions.push(
      action
    );

    return this.save();
  };

geofenceSchema.methods.removeAction =
  async function (
    actionId
  ) {
    const action =
      this.actions.id(
        actionId
      );

    if (
      !action
    ) {
      throw new Error(
        "Geofence action not found"
      );
    }

    action.deleteOne();

    return this.save();
  };

geofenceSchema.methods.addTag =
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

geofenceSchema.methods.removeTag =
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

geofenceSchema.methods.recordVerification =
  async function ({
    successful = false,
    event = null,
    accuracy = null,
    verifiedBy = null,
  } = {}) {
    this.analytics.totalVerifications +=
      1;

    if (
      successful
    ) {
      this.analytics.successfulVerifications +=
        1;

      this.analytics.lastSuccessfulVerificationAt =
        new Date();
    } else {
      this.analytics.rejectedVerifications +=
        1;
    }

    if (
      event ===
      "enter"
    ) {
      this.analytics.enterEvents +=
        1;
    }

    if (
      event ===
      "exit"
    ) {
      this.analytics.exitEvents +=
        1;
    }

    if (
      typeof accuracy ===
        "number" &&
      accuracy >= 0
    ) {
      const total =
        this.analytics.totalVerifications;

      const previousAverage =
        this.analytics.averageAccuracyMeters ||
        0;

      this.analytics.averageAccuracyMeters =
        (
          (
            previousAverage *
              (
                total -
                1
              )
          ) +
          accuracy
        ) /
        total;
    }

    this.analytics.lastVerificationAt =
      new Date();

    this.audit.lastVerificationBy =
      verifiedBy;

    this.audit.lastVerificationAt =
      new Date();

    return this.save();
  };

geofenceSchema.methods.recordSecurityFailure =
  async function () {
    this.analytics.failedSecurityChecks +=
      1;

    return this.save();
  };

geofenceSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

geofenceSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Geofence is under legal hold"
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

    this.status =
      "archived";

    return this.save();
  };

geofenceSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    this.deletedBy =
      null;

    this.deletionReason =
      null;

    if (
      this.status ===
      "archived"
    ) {
      this.status =
        "inactive";
    }

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

geofenceSchema.statics.findByCode =
  function (
    instituteId,
    geofenceCode
  ) {
    return this.findOne({
      instituteId,
      geofenceCode:
        String(
          geofenceCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

geofenceSchema.statics.findBySlug =
  function (
    instituteId,
    slug
  ) {
    return this.findOne({
      instituteId,
      slug:
        String(
          slug
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

geofenceSchema.statics.findActive =
  function (
    instituteId
  ) {
    return this.find({
      instituteId,
      status: "active",
      isDeleted: false,
    }).sort({
      name: 1,
    });
  };

geofenceSchema.statics.findAttendanceGeofences =
  function (
    instituteId
  ) {
    return this.find({
      instituteId,
      status: "active",
      "attendance.enabled": true,
      isDeleted: false,
    }).sort({
      name: 1,
    });
  };

geofenceSchema.statics.findByDepartment =
  function (
    instituteId,
    departmentId
  ) {
    return this.find({
      instituteId,
      departmentId,
      isDeleted: false,
    }).sort({
      name: 1,
    });
  };

geofenceSchema.statics.findByClass =
  function (
    instituteId,
    classId
  ) {
    return this.find({
      instituteId,
      classId,
      isDeleted: false,
    }).sort({
      name: 1,
    });
  };

geofenceSchema.statics.findByEmployee =
  function (
    instituteId,
    employeeId
  ) {
    return this.find({
      instituteId,
      employeeId,
      isDeleted: false,
    }).sort({
      name: 1,
    });
  };

geofenceSchema.statics.findByPoint =
  function (
    instituteId,
    longitude,
    latitude
  ) {
    return this.find({
      instituteId,
      status: "active",
      isDeleted: false,
      geo: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [
              longitude,
              latitude,
            ],
          },
        },
      },
    });
  };

geofenceSchema.statics.findNearby =
  function (
    instituteId,
    longitude,
    latitude,
    maxDistanceMeters = 1000
  ) {
    return this.find({
      instituteId,
      status: "active",
      isDeleted: false,
      geo: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              longitude,
              latitude,
            ],
          },
          $maxDistance:
            maxDistanceMeters,
        },
      },
    });
  };

geofenceSchema.statics.search =
  function (
    instituteId,
    search,
    limit = 50
  ) {
    const normalized =
      String(
        search || ""
      ).trim();

    if (
      !normalized
    ) {
      return this.find({
        instituteId,
        isDeleted: false,
      })
        .sort({
          name: 1,
        })
        .limit(
          Math.min(
            200,
            Math.max(
              1,
              limit
            )
          )
        );
    }

    return this.find(
      {
        instituteId,
        $text: {
          $search:
            normalized,
        },
        isDeleted: false,
      },
      {
        score: {
          $meta:
            "textScore",
        },
      }
    )
      .sort({
        score: {
          $meta:
            "textScore",
        },
      })
      .limit(
        Math.min(
          200,
          Math.max(
            1,
            limit
          )
        )
      );
  };

geofenceSchema.statics.getSummary =
  async function (
    instituteId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
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

            active: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "active",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            inactive: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "inactive",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            draft: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "draft",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            attendanceEnabled: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$attendance.enabled",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalVerifications: {
              $sum:
                "$analytics.totalVerifications",
            },

            successfulVerifications: {
              $sum:
                "$analytics.successfulVerifications",
            },

            rejectedVerifications: {
              $sum:
                "$analytics.rejectedVerifications",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            active: 1,
            inactive: 1,
            draft: 1,
            attendanceEnabled: 1,
            totalVerifications: 1,
            successfulVerifications: 1,
            rejectedVerifications: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        attendanceEnabled: 0,
        totalVerifications: 0,
        successfulVerifications: 0,
        rejectedVerifications: 0,
      }
    );
  };

/* ============================================================================
 * SOFT DELETE QUERY PROTECTION
 * ========================================================================== */

geofenceSchema.pre(
  /^find/,
  function (next) {
    const options =
      this.getOptions();

    if (
      options.includeDeleted
    ) {
      return next();
    }

    const filter =
      this.getFilter();

    if (
      filter.isDeleted ===
      undefined
    ) {
      this.where({
        isDeleted: false,
      });
    }

    next();
  }
);

/* ============================================================================
 * IMMUTABLE DELETE PROTECTION
 * ========================================================================== */

geofenceSchema.pre(
  [
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findByIdAndDelete",
  ],
  function (next) {
    const options =
      this.getOptions();

    if (
      options.allowHardDelete !==
      true
    ) {
      return next(
        new Error(
          "Hard delete is disabled for Geofence. Use softDelete()."
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Geofence =
  mongoose.models.Geofence ||
  mongoose.model(
    "Geofence",
    geofenceSchema
  );

export {
  GEOFENCE_STATUSES,
  GEOFENCE_TYPES,
  SHAPE_TYPES,
  EVENT_TYPES,
  ACTION_TYPES,
  VERIFICATION_METHODS,
  ACCURACY_MODES,
};
