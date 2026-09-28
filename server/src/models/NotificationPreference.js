// server/src/models/Device.js

import mongoose from "mongoose";

import crypto from "node:crypto";import crypto from "crypto";

const DEVICE_TYPES = [
  "mobile",
  "tablet",
  "desktop",
  "laptop",
  "web",
  "kiosk",
  "smart_tv",
  "other",
];

const DEVICE_PLATFORMS = [
  "android",
  "ios",
  "windows",
  "macos",
  "linux",
  "web",
  "chromeos",
  "other",
];

const DEVICE_STATUS = [
  "pending",
  "active",
  "trusted",
  "blocked",
  "revoked",
  "lost",
  "inactive",
];

const TRUST_LEVELS = [
  "unknown",
  "low",
  "standard",
  "trusted",
  "high",
];

const DEVICE_EVENT_TYPES = [
  "registered",
  "activated",
  "trusted",
  "login",
  "logout",
  "refresh",
  "verified",
  "blocked",
  "unblocked",
  "revoked",
  "unregistered",
  "password_changed",
  "security_alert",
  "location_changed",
  "app_updated",
];

const deviceEventSchema =
  new mongoose.Schema(
    {
      _id: false,

      type: {
        type: String,
        enum: DEVICE_EVENT_TYPES,
        required: true,
      },

      occurredAt: {
        type: Date,
        default: Date.now,
      },

      ipHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },

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

const deviceSchema =
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
    `noti_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* OWNER                                                                */
      /* ==================================================================== */

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* DEVICE IDENTITY                                                      */
      /* ==================================================================== */

      deviceCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        index: true,
      },

      deviceIdHash: {
        type: String,
        trim: true,
        maxlength: 128,
        required: true,
        select: false,
      },

      fingerprintHash: {
        type: String,
        trim: true,
        maxlength: 128,
        required: true,
        select: false,
      },

      installationIdHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
        select: false,
      },

      /* ==================================================================== */
      /* DEVICE INFORMATION                                                   */
      /* ==================================================================== */

      name: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      manufacturer: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      model: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      deviceType: {
        type: String,
        enum: DEVICE_TYPES,
        default: "mobile",
        index: true,
      },

      platform: {
        type: String,
        enum: DEVICE_PLATFORMS,
        default: "android",
        index: true,
      },

      operatingSystem: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      osVersion: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      architecture: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      /* ==================================================================== */
      /* APPLICATION                                                          */
      /* ==================================================================== */

      appName: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      appVersion: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      buildNumber: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      bundleId: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      /* ==================================================================== */
      /* BROWSER                                                              */
      /* ==================================================================== */

      browser: {
        name: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        version: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        engine: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        userAgentHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
          select: false,
        },
      },

      /* ==================================================================== */
      /* STATUS / TRUST                                                       */
      /* ==================================================================== */

      status: {
        type: String,
        enum: DEVICE_STATUS,
        default: "pending",
        index: true,
      },

      trustLevel: {
        type: String,
        enum: TRUST_LEVELS,
        default: "unknown",
        index: true,
      },

      isPrimary: {
        type: Boolean,
        default: false,
        index: true,
      },

      isTrusted: {
        type: Boolean,
        default: false,
        index: true,
      },

      isManaged: {
        type: Boolean,
        default: false,
      },

      /* ==================================================================== */
      /* SECURITY                                                             */
      /* ==================================================================== */

      security: {
        passcodeEnabled: {
          type: Boolean,
          default: false,
        },

        biometricEnabled: {
          type: Boolean,
          default: false,
        },

        faceUnlockEnabled: {
          type: Boolean,
          default: false,
        },

        rootedOrJailbroken: {
          type: Boolean,
          default: false,
        },

        developerModeEnabled: {
          type: Boolean,
          default: false,
        },

        emulatorDetected: {
          type: Boolean,
          default: false,
        },

        integrityVerified: {
          type: Boolean,
          default: false,
        },

        integrityProvider: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        integrityVerifiedAt: {
          type: Date,
          default: null,
        },

        riskScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
          index: true,
        },

        riskLevel: {
          type: String,
          enum: [
            "low",
            "medium",
            "high",
            "critical",
          ],
          default: "low",
          index: true,
        },

        compromised: {
          type: Boolean,
          default: false,
        },

        compromisedAt: {
          type: Date,
          default: null,
        },

        compromisedReason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* PUSH NOTIFICATIONS                                                   */
      /* ==================================================================== */

      push: {
        enabled: {
          type: Boolean,
          default: true,
        },

        provider: {
          type: String,
          enum: [
            "fcm",
            "apns",
            "expo",
            "web_push",
            "other",
          ],
          default: null,
        },

        tokenHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
          select: false,
        },

        tokenVersion: {
          type: Number,
          min: 1,
          default: 1,
        },

        lastRegisteredAt: {
          type: Date,
          default: null,
        },

        lastDeliveredAt: {
          type: Date,
          default: null,
        },

        lastFailedAt: {
          type: Date,
          default: null,
        },

        failureCount: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      /* ==================================================================== */
      /* NETWORK                                                              */
      /* ==================================================================== */

      network: {
        lastIpHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
          select: false,
        },

        lastNetworkType: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        lastConnectionId: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        ipChangeCount: {
          type: Number,
          min: 0,
          default: 0,
        },

        networkChangeCount: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      /* ==================================================================== */
      /* LOCATION                                                             */
      /* ==================================================================== */

      lastLocation: {
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

      locationTrackingEnabled: {
        type: Boolean,
        default: false,
      },

      /* ==================================================================== */
      /* LOGIN / ACTIVITY                                                     */
      /* ==================================================================== */

      firstSeenAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      lastSeenAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      lastLoginAt: {
        type: Date,
        default: null,
      },

      lastLogoutAt: {
        type: Date,
        default: null,
      },

      loginCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      successfulAuthenticationCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      failedAuthenticationCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* SESSION                                                               */
      /* ==================================================================== */

      activeSessionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      maxConcurrentSessions: {
        type: Number,
        min: 1,
        max: 100,
        default: 3,
      },

      lastSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RefreshSession",
        default: null,
      },

      /* ==================================================================== */
      /* VERIFICATION                                                          */
      /* ==================================================================== */

      verification: {
        status: {
          type: String,
          enum: [
            "unverified",
            "pending",
            "verified",
            "failed",
          ],
          default: "unverified",
        },

        method: {
          type: String,
          enum: [
            "none",
            "otp",
            "email",
            "sms",
            "admin",
            "biometric",
            "device_attestation",
            "multi_factor",
          ],
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

        verificationReference: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },
      },

      /* ==================================================================== */
      /* MANAGEMENT                                                           */
      /* ==================================================================== */

      managedByOrganization: {
        type: Boolean,
        default: false,
      },

      management: {
        policyId: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        policyVersion: {
          type: Number,
          min: 1,
          default: null,
        },

        enrolledAt: {
          type: Date,
          default: null,
        },

        lastPolicySyncAt: {
          type: Date,
          default: null,
        },

        policyCompliant: {
          type: Boolean,
          default: true,
        },

        complianceCheckedAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* EVENTS                                                               */
      /* ==================================================================== */

      events: {
        type: [deviceEventSchema],
        default: [],
      },

      /* ==================================================================== */
      /* METADATA                                                             */
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

      notes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      /* ==================================================================== */
      /* LIFECYCLE                                                            */
      /* ==================================================================== */

      registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      blockedAt: {
        type: Date,
        default: null,
      },

      blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      blockReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },

      revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      revokeReason: {
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

deviceSchema.index(
  {
    instituteId: 1,
    userId: 1,
    deviceIdHash: 1,
  },
  {
    name: "tenant_user_device",
    unique: true,
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    deviceCode: 1,
  },
  {
    name: "tenant_device_code",
    unique: true,
    sparse: true,
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    fingerprintHash: 1,
  },
  {
    name: "tenant_device_fingerprint",
    sparse: true,
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    userId: 1,
    status: 1,
    lastSeenAt: -1,
  },
  {
    name: "user_devices",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    status: 1,
    trustLevel: 1,
    lastSeenAt: -1,
  },
  {
    name: "device_security_listing",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    isPrimary: 1,
    userId: 1,
  },
  {
    name: "primary_user_device",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    "security.riskLevel": 1,
    "security.riskScore": -1,
  },
  {
    name: "device_risk_queue",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    platform: 1,
    deviceType: 1,
    lastSeenAt: -1,
  },
  {
    name: "device_platform_listing",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    "push.enabled": 1,
    status: 1,
    lastSeenAt: -1,
  },
  {
    name: "push_delivery_devices",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    lastSeenAt: -1,
  },
  {
    name: "recent_devices",
  }
);

deviceSchema.index(
  {
    instituteId: 1,
    "management.policyCompliant": 1,
    "management.complianceCheckedAt": 1,
  },
  {
    name: "device_compliance",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

deviceSchema.pre(
  "validate",
  function (next) {
    if (
      this.status ===
        "trusted" &&
      !this.isTrusted
    ) {
      this.isTrusted =
        true;
    }

    if (
      this.isTrusted &&
      this.trustLevel ===
        "unknown"
    ) {
      this.trustLevel =
        "trusted";
    }

    if (
      this.security.riskScore >=
      80
    ) {
      this.security.riskLevel =
        "critical";
    } else if (
      this.security.riskScore >=
      50
    ) {
      this.security.riskLevel =
        "high";
    } else if (
      this.security.riskScore >=
      20
    ) {
      this.security.riskLevel =
        "medium";
    } else {
      this.security.riskLevel =
        "low";
    }

    if (
      this.status ===
        "blocked" &&
      !this.blockedAt
    ) {
      this.blockedAt =
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
      this.security.compromised &&
      !this.security.compromisedAt
    ) {
      this.security.compromisedAt =
        new Date();
    }

    if (
      this.events.length >
      1000
    ) {
      return next(
        new Error(
          "Device cannot contain more than 1,000 embedded events"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Device cannot contain more than 100 tags"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

deviceSchema.virtual(
  "isActive"
).get(function () {
  return [
    "active",
    "trusted",
  ].includes(
    this.status
  );
});

deviceSchema.virtual(
  "isBlocked"
).get(function () {
  return (
    this.status ===
      "blocked" ||
    this.status ===
      "revoked"
  );
});

deviceSchema.virtual(
  "isSecure"
).get(function () {
  return (
    !this.security.compromised &&
    !this.security.rootedOrJailbroken &&
    !this.security.emulatorDetected &&
    this.security.integrityVerified
  );
});

deviceSchema.virtual(
  "daysSinceLastSeen"
).get(function () {
  if (
    !this.lastSeenAt
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() -
        this.lastSeenAt.getTime()) /
        86400000
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

deviceSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

deviceSchema.query.byUser =
  function (
    userId
  ) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

deviceSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "active",
          "trusted",
        ],
      },
    });
  };

deviceSchema.query.trusted =
  function () {
    return this.where({
      isDeleted: false,
      isTrusted: true,
      status: {
        $in: [
          "active",
          "trusted",
        ],
      },
    });
  };

deviceSchema.query.blocked =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "blocked",
          "revoked",
          "lost",
        ],
      },
    });
  };

deviceSchema.query.highRisk =
  function () {
    return this.where({
      isDeleted: false,
      "security.riskLevel": {
        $in: [
          "high",
          "critical",
        ],
      },
    });
  };

deviceSchema.query.nonCompliant =
  function () {
    return this.where({
      isDeleted: false,
      "management.policyCompliant": false,
    });
  };

/* ============================================================================
 * SECURITY HELPERS
 * ========================================================================== */

deviceSchema.statics.hashIdentifier =
  function (
    value
  ) {
    if (!value) {
      return null;
    }

    return crypto
      .createHash("sha256")
      .update(
        String(value)
      )
      .digest("hex");
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

deviceSchema.methods.recordEvent =
  async function ({
    type,
    metadata = null,
    ipHash = null,
    latitude = null,
    longitude = null,
    accuracyMeters = null,
  } = {}) {
    if (!type) {
      throw new Error(
        "Device event type is required"
      );
    }

    this.events.push({
      type,
      occurredAt:
        new Date(),
      ipHash,
      location: {
        latitude,
        longitude,
        accuracyMeters,
      },
      metadata,
    });

    this.lastSeenAt =
      new Date();

    return this.save();
  };

deviceSchema.methods.markSeen =
  async function ({
    ipHash = null,
    networkType = null,
    connectionId = null,
    latitude = null,
    longitude = null,
    accuracyMeters = null,
  } = {}) {
    const now =
      new Date();

    this.lastSeenAt =
      now;

    this.network.lastIpHash =
      ipHash;

    this.network.lastNetworkType =
      networkType;

    this.network.lastConnectionId =
      connectionId;

    if (
      latitude !== null &&
      longitude !== null
    ) {
      this.lastLocation.latitude =
        latitude;

      this.lastLocation.longitude =
        longitude;

      this.lastLocation.accuracyMeters =
        accuracyMeters;

      this.lastLocation.capturedAt =
        now;
    }

    return this.save();
  };

deviceSchema.methods.recordLogin =
  async function ({
    sessionId = null,
    ipHash = null,
  } = {}) {
    this.loginCount +=
      1;

    this.successfulAuthenticationCount +=
      1;

    this.lastLoginAt =
      new Date();

    this.lastSeenAt =
      new Date();

    this.lastSessionId =
      sessionId;

    this.activeSessionCount +=
      1;

    this.network.lastIpHash =
      ipHash;

    this.events.push({
      type: "login",
      occurredAt:
        new Date(),
      ipHash,
    });

    return this.save();
  };

deviceSchema.methods.recordLogout =
  async function () {
    this.lastLogoutAt =
      new Date();

    this.activeSessionCount =
      Math.max(
        0,
        this.activeSessionCount -
          1
      );

    this.events.push({
      type: "logout",
      occurredAt:
        new Date(),
    });

    return this.save();
  };

deviceSchema.methods.recordFailedAuthentication =
  async function () {
    this.failedAuthenticationCount +=
      1;

    this.security.riskScore =
      Math.min(
        100,
        this.security.riskScore +
          2
      );

    this.events.push({
      type: "security_alert",
      occurredAt:
        new Date(),
        metadata: {
          reason:
            "failed_authentication",
        },
    });

    return this.save();
  };

deviceSchema.methods.trust =
  async function ({
    verifiedBy = null,
    method = "admin",
  } = {}) {
    this.status =
      "trusted";

    this.isTrusted =
      true;

    this.trustLevel =
      "trusted";

    this.verification.status =
      "verified";

    this.verification.method =
      method;

    this.verification.verifiedAt =
      new Date();

    this.verification.verifiedBy =
      verifiedBy;

    this.events.push({
      type: "trusted",
      occurredAt:
        new Date(),
        metadata: {
          method,
        },
    });

    return this.save();
  };

deviceSchema.methods.untrust =
  async function () {
    this.isTrusted =
      false;

    this.trustLevel =
      "standard";

    if (
      this.status ===
      "trusted"
    ) {
      this.status =
        "active";
    }

    this.events.push({
      type: "security_alert",
      occurredAt:
        new Date(),
        metadata: {
          reason:
            "device_untrusted",
        },
    });

    return this.save();
  };

deviceSchema.methods.block =
  async function ({
    blockedBy = null,
    reason = null,
  } = {}) {
    if (
      !reason
    ) {
      throw new Error(
        "Block reason is required"
      );
    }

    this.status =
      "blocked";

    this.isTrusted =
      false;

    this.blockedAt =
      new Date();

    this.blockedBy =
      blockedBy;

    this.blockReason =
      reason;

    this.events.push({
      type: "blocked",
      occurredAt:
        new Date(),
        metadata: {
          reason,
        },
    });

    return this.save();
  };

deviceSchema.methods.unblock =
  async function ({
    changedBy = null,
  } = {}) {
    if (
      this.status !==
      "blocked"
    ) {
      throw new Error(
        "Only blocked devices can be unblocked"
      );
    }

    this.status =
      this.isTrusted
        ? "trusted"
        : "active";

    this.blockedAt =
      null;

    this.blockedBy =
      null;

    this.blockReason =
      null;

    this.events.push({
      type: "unblocked",
      occurredAt:
        new Date(),
        metadata: {
          changedBy,
        },
    });

    return this.save();
  };

deviceSchema.methods.revoke =
  async function ({
    revokedBy = null,
    reason = null,
  } = {}) {
    if (
      !reason
    ) {
      throw new Error(
        "Revoke reason is required"
      );
    }

    this.status =
      "revoked";

    this.isTrusted =
      false;

    this.revokedAt =
      new Date();

    this.revokedBy =
      revokedBy;

    this.revokeReason =
      reason;

    this.activeSessionCount =
      0;

    this.events.push({
      type: "revoked",
      occurredAt:
        new Date(),
        metadata: {
          reason,
        },
    });

    return this.save();
  };

deviceSchema.methods.markLost =
  async function ({
    changedBy = null,
  } = {}) {
    this.status =
      "lost";

    this.isTrusted =
      false;

    this.activeSessionCount =
      0;

    this.events.push({
      type: "security_alert",
      occurredAt:
        new Date(),
        metadata: {
          reason:
            "device_marked_lost",
          changedBy,
        },
    });

    return this.save();
  };

deviceSchema.methods.markCompromised =
  async function ({
    reason = null,
  } = {}) {
    this.security.compromised =
      true;

    this.security.compromisedAt =
      new Date();

    this.security.compromisedReason =
      reason;

    this.security.riskScore =
      Math.max(
        80,
        this.security.riskScore
      );

    this.security.riskLevel =
      "critical";

    this.status =
      "blocked";

    this.isTrusted =
      false;

    this.activeSessionCount =
      0;

    this.events.push({
      type: "security_alert",
      occurredAt:
        new Date(),
        metadata: {
          reason:
            reason ||
            "device_compromised",
        },
    });

    return this.save();
  };

deviceSchema.methods.updateIntegrity =
  async function ({
    verified,
    provider = null,
  } = {}) {
    this.security.integrityVerified =
      Boolean(
        verified
      );

    this.security.integrityProvider =
      provider;

    this.security.integrityVerifiedAt =
      new Date();

    if (
      !verified
    ) {
      this.security.riskScore =
        Math.min(
          100,
          this.security.riskScore +
            20
        );

      this.security.riskLevel =
        "high";
    }

    return this.save();
  };

deviceSchema.methods.updatePushToken =
  async function ({
    token,
    provider,
  } = {}) {
    if (!token) {
      throw new Error(
        "Push token is required"
      );
    }

    this.push.tokenHash =
      crypto
        .createHash("sha256")
        .update(
          String(token)
        )
        .digest("hex");

    this.push.provider =
      provider;

    this.push.tokenVersion +=
      1;

    this.push.enabled =
      true;

    this.push.lastRegisteredAt =
      new Date();

    this.push.failureCount =
      0;

    return this.save();
  };

deviceSchema.methods.recordPushSuccess =
  async function () {
    this.push.lastDeliveredAt =
      new Date();

    this.push.failureCount =
      0;

    return this.save();
  };

deviceSchema.methods.recordPushFailure =
  async function () {
    this.push.lastFailedAt =
      new Date();

    this.push.failureCount +=
      1;

    if (
      this.push.failureCount >=
      10
    ) {
      this.push.enabled =
        false;
    }

    return this.save();
  };

deviceSchema.methods.setPrimary =
  async function () {
    this.isPrimary =
      true;

    return this.save();
  };

deviceSchema.methods.updateCompliance =
  async function ({
    compliant,
    policyId = null,
    policyVersion = null,
  } = {}) {
    this.management.policyCompliant =
      Boolean(
        compliant
      );

    this.management.policyId =
      policyId;

    this.management.policyVersion =
      policyVersion;

    this.management.lastPolicySyncAt =
      new Date();

    this.management.complianceCheckedAt =
      new Date();

    if (
      !compliant
    ) {
      this.security.riskScore =
        Math.min(
          100,
          this.security.riskScore +
            10
        );
    }

    return this.save();
  };

deviceSchema.methods.softDelete =
  async function () {
    if (
      this.status ===
      "trusted"
    ) {
      throw new Error(
        "Trusted devices must be revoked before deletion"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.activeSessionCount =
      0;

    return this.save();
  };

deviceSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    if (
      this.status ===
      "inactive"
    ) {
      this.status =
        "active";
    }

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

deviceSchema.statics.findByDeviceIdentifier =
  async function ({
    instituteId,
    deviceId,
  } = {}) {
    const deviceIdHash =
      this.hashIdentifier(
        deviceId
      );

    return this.findOne({
      instituteId,
      deviceIdHash,
      isDeleted: false,
    }).select(
      "+deviceIdHash +fingerprintHash +installationIdHash +push.tokenHash"
    );
  };

deviceSchema.statics.findByFingerprint =
  async function ({
    instituteId,
    fingerprint,
  } = {}) {
    const fingerprintHash =
      this.hashIdentifier(
        fingerprint
      );

    return this.find({
      instituteId,
      fingerprintHash,
      isDeleted: false,
    }).select(
      "+fingerprintHash"
    );
  };

deviceSchema.statics.findActiveForUser =
  function (
    instituteId,
    userId
  ) {
    return this.find({
      instituteId,
      userId,
      isDeleted: false,
      status: {
        $in: [
          "active",
          "trusted",
        ],
      },
    }).sort({
      isPrimary: -1,
      lastSeenAt: -1,
    });
  };

deviceSchema.statics.findTrustedForUser =
  function (
    instituteId,
    userId
  ) {
    return this.find({
      instituteId,
      userId,
      isDeleted: false,
      isTrusted: true,
      status: {
        $in: [
          "active",
          "trusted",
        ],
      },
    }).sort({
      isPrimary: -1,
      lastSeenAt: -1,
    });
  };

deviceSchema.statics.findHighRisk =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      "security.riskLevel": {
        $in: [
          "high",
          "critical",
        ],
      },
    })
      .sort({
        "security.riskScore": -1,
        lastSeenAt: -1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Device =
  mongoose.models.Device ||
  mongoose.model(
    "Device",
    deviceSchema
  );

export {
  DEVICE_TYPES,
  DEVICE_PLATFORMS,
  DEVICE_STATUS,
  TRUST_LEVELS,
  DEVICE_EVENT_TYPES,
};
