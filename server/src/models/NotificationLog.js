// server/src/models/NotificationPreference.js

import mongoose from "mongoose";

const NOTIFICATION_CHANNELS = [
  "in_app",
  "push",
  "email",
  "sms",
];

const NOTIFICATION_TYPES = [
  "announcement",
  "assignment",
  "assignment_due",
  "assignment_graded",
  "test",
  "test_scheduled",
  "test_reminder",
  "test_result",
  "attendance",
  "attendance_marked",
  "attendance_alert",
  "leave",
  "leave_submitted",
  "leave_approved",
  "leave_rejected",
  "payroll",
  "payroll_processed",
  "payment",
  "invoice",
  "live_session",
  "live_session_starting",
  "live_session_started",
  "live_session_ended",
  "message",
  "conversation",
  "ticket",
  "ticket_update",
  "crm",
  "task",
  "event",
  "certificate",
  "achievement",
  "leaderboard",
  "streak",
  "security",
  "login",
  "device",
  "system",
  "marketing",
];

const NOTIFICATION_FREQUENCIES = [
  "immediate",
  "hourly",
  "daily",
  "weekly",
  "never",
];

const DIGEST_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const QUIET_DAY_VALUES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const channelPreferenceSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: true,
      },

      frequency: {
        type: String,
        enum: NOTIFICATION_FREQUENCIES,
        default: "immediate",
      },

      priorityOnly: {
        type: Boolean,
        default: false,
      },

      digestEnabled: {
        type: Boolean,
        default: false,
      },

      digestTime: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: "09:00",
      },

      lastUsedAt: {
        type: Date,
        default: null,
      },

      failureCount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

const typePreferenceSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: true,
      },

      channels: {
        type: [String],
        enum: NOTIFICATION_CHANNELS,
        default: [
          "in_app",
          "push",
        ],
      },

      priorityOnly: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: NOTIFICATION_FREQUENCIES,
        default: "immediate",
      },

      mutedUntil: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const quietHoursSchema =
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
        default: "Asia/Kolkata",
      },

      startTime: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: "22:00",
      },

      endTime: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: "07:00",
      },

      days: {
        type: [String],
        enum: QUIET_DAY_VALUES,
        default: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },

      allowCritical: {
        type: Boolean,
        default: true,
      },

      allowSecurity: {
        type: Boolean,
        default: true,
      },

      allowAttendance: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: false,
    }
  );

const digestSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: [
          "daily",
          "weekly",
        ],
        default: "daily",
      },

      time: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: "09:00",
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      dayOfWeek: {
        type: String,
        enum: DIGEST_DAYS,
        default: "monday",
      },

      includeRead: {
        type: Boolean,
        default: false,
      },

      includeMuted: {
        type: Boolean,
        default: false,
      },

      lastSentAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const notificationPreferenceSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                             */
      /* ==================================================================== */

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* USER                                                                 */
      /* ==================================================================== */

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      role: {
        type: String,
        enum: [
          "super_admin",
          "admin",
          "teacher",
          "student",
          "hr",
          "employee",
        ],
        default: null,
      },

      /* ==================================================================== */
      /* GLOBAL SETTINGS                                                       */
      /* ==================================================================== */

      enabled: {
        type: Boolean,
        default: true,
        index: true,
      },

      allowNotifications: {
        type: Boolean,
        default: true,
      },

      allowMarketing: {
        type: Boolean,
        default: false,
      },

      allowSystem: {
        type: Boolean,
        default: true,
      },

      allowSecurity: {
        type: Boolean,
        default: true,
      },

      /* ==================================================================== */
      /* CHANNELS                                                              */
      /* ==================================================================== */

      channels: {
        in_app: {
          type: channelPreferenceSchema,
          default: () => ({
            enabled: true,
            frequency: "immediate",
          }),
        },

        push: {
          type: channelPreferenceSchema,
          default: () => ({
            enabled: true,
            frequency: "immediate",
          }),
        },

        email: {
          type: channelPreferenceSchema,
          default: () => ({
            enabled: true,
            frequency: "daily",
          }),
        },

        sms: {
          type: channelPreferenceSchema,
          default: () => ({
            enabled: false,
            frequency: "immediate",
          }),
        },
      },

      /* ==================================================================== */
      /* NOTIFICATION TYPES                                                    */
      /* ==================================================================== */

      types: {
        announcement: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        assignment: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        assignment_due: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        assignment_graded: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        test: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        test_scheduled: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
          ],
          }),
        },

        test_reminder: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        test_result: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        attendance: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        attendance_marked: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
            ],
          }),
        },

        attendance_alert: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        leave: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        leave_submitted: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        leave_approved: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        leave_rejected: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        payroll: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "email",
            ],
          }),
        },

        payroll_processed: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "email",
            ],
          }),
        },

        payment: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "email",
            ],
          }),
        },

        invoice: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "email",
            ],
          }),
        },

        live_session: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        live_session_starting: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        live_session_started: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        live_session_ended: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
            ],
          }),
        },

        message: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        conversation: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        ticket: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        ticket_update: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        crm: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        task: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        event: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        certificate: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        achievement: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        leaderboard: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
            ],
          }),
        },

        streak: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
            ],
          }),
        },

        security: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
            priorityOnly: false,
          }),
        },

        login: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        device: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
              "push",
              "email",
            ],
          }),
        },

        system: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: true,
            channels: [
              "in_app",
            ],
          }),
        },

        marketing: {
          type: typePreferenceSchema,
          default: () => ({
            enabled: false,
            channels: [
              "email",
            ],
          }),
        },
      },

      /* ==================================================================== */
      /* QUIET HOURS                                                           */
      /* ==================================================================== */

      quietHours: {
        type: quietHoursSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* DIGEST                                                                */
      /* ==================================================================== */

      digest: {
        type: digestSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* DEVICE / PUSH CONTROL                                                 */
      /* ==================================================================== */

      devicePreferences: {
        allDevices: {
          type: Boolean,
          default: true,
        },

        trustedDevicesOnly: {
          type: Boolean,
          default: false,
        },

        excludedDeviceIds: {
          type: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Device",
            },
          ],
          default: [],
        },

        preferredDeviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Device",
          default: null,
        },
      },

      /* ==================================================================== */
      /* SOUND / UI                                                            */
      /* ==================================================================== */

      presentation: {
        soundEnabled: {
          type: Boolean,
          default: true,
        },

        vibrationEnabled: {
          type: Boolean,
          default: true,
        },

        badgeEnabled: {
          type: Boolean,
          default: true,
        },

        popupEnabled: {
          type: Boolean,
          default: true,
        },

        lockScreenEnabled: {
          type: Boolean,
          default: true,
        },

        showPreview: {
          type: Boolean,
          default: true,
        },

        sound: {
          type: String,
          trim: true,
          maxlength: 100,
          default: "default",
        },
      },

      /* ==================================================================== */
      /* PRIVACY                                                               */
      /* ==================================================================== */

      privacy: {
        showSenderName: {
          type: Boolean,
          default: true,
        },

        showMessagePreview: {
          type: Boolean,
          default: true,
        },

        showSensitiveContent: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* LIMITS / ANTI-SPAM                                                    */
      /* ==================================================================== */

      limits: {
        maxPushPerHour: {
          type: Number,
          min: 1,
          max: 1000,
          default: 60,
        },

        maxEmailPerDay: {
          type: Number,
          min: 1,
          max: 500,
          default: 20,
        },

        maxSmsPerDay: {
          type: Number,
          min: 1,
          max: 100,
          default: 5,
        },

        cooldownSeconds: {
          type: Number,
          min: 0,
          max: 86400,
          default: 10,
        },
      },

      /* ==================================================================== */
      /* MUTING                                                                */
      /* ==================================================================== */

      mutedTypes: {
        type: [String],
        enum: NOTIFICATION_TYPES,
        default: [],
      },

      mutedUntil: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* TIMEZONE / LOCALE                                                     */
      /* ==================================================================== */

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      locale: {
        type: String,
        trim: true,
        maxlength: 20,
        default: "en-IN",
      },

      /* ==================================================================== */
      /* AUDIT                                                                 */
      /* ==================================================================== */

      lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      version: {
        type: Number,
        min: 1,
        default: 1,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
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
      versionKey: "__v",

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

notificationPreferenceSchema.index(
  {
    instituteId: 1,
    userId: 1,
  },
  {
    unique: true,
    name: "unique_user_notification_preferences",
  }
);

notificationPreferenceSchema.index(
  {
    instituteId: 1,
    enabled: 1,
    updatedAt: -1,
  },
  {
    name: "active_notification_preferences",
  }
);

notificationPreferenceSchema.index(
  {
    instituteId: 1,
    mutedUntil: 1,
  },
  {
    name: "muted_notification_preferences",
  }
);

notificationPreferenceSchema.index(
  {
    instituteId: 1,
    "digest.enabled": 1,
    "digest.frequency": 1,
    "digest.time": 1,
  },
  {
    name: "notification_digest_schedule",
  }
);

notificationPreferenceSchema.index(
  {
    instituteId: 1,
    role: 1,
    enabled: 1,
  },
  {
    name: "role_notification_preferences",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

notificationPreferenceSchema.pre(
  "validate",
  function (next) {
    if (
      this.quietHours.enabled &&
      this.quietHours.startTime ===
        this.quietHours.endTime
    ) {
      return next(
        new Error(
          "Quiet hours start and end time cannot be identical"
        )
      );
    }

    if (
      this.digest.enabled &&
      !this.digest.timezone
    ) {
      return next(
        new Error(
          "Digest timezone is required when digest is enabled"
        )
      );
    }

    if (
      this.devicePreferences.preferredDeviceId &&
      this.devicePreferences.excludedDeviceIds.some(
        (id) =>
          String(id) ===
          String(
            this.devicePreferences
              .preferredDeviceId
          )
      )
    ) {
      return next(
        new Error(
          "Preferred device cannot be excluded"
        )
      );
    }

    if (
      this.mutedTypes.length >
      NOTIFICATION_TYPES.length
    ) {
      return next(
        new Error(
          "Invalid muted notification type configuration"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

notificationPreferenceSchema.virtual(
  "isMuted"
).get(function () {
  if (
    !this.mutedUntil
  ) {
    return false;
  }

  return (
    this.mutedUntil >
    new Date()
  );
});

notificationPreferenceSchema.virtual(
  "hasQuietHours"
).get(function () {
  return (
    this.quietHours &&
    this.quietHours.enabled
  );
});

notificationPreferenceSchema.virtual(
  "isDigestEnabled"
).get(function () {
  return (
    this.digest &&
    this.digest.enabled
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

notificationPreferenceSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

notificationPreferenceSchema.query.byUser =
  function (
    userId
  ) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

notificationPreferenceSchema.query.enabled =
  function () {
    return this.where({
      enabled: true,
      allowNotifications: true,
      isDeleted: false,
    });
  };

notificationPreferenceSchema.query.digestEnabled =
  function () {
    return this.where({
      "digest.enabled": true,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

notificationPreferenceSchema.methods.isTypeEnabled =
  function (
    type
  ) {
    if (
      !this.enabled ||
      !this.allowNotifications ||
      this.isMuted
    ) {
      return false;
    }

    if (
      !NOTIFICATION_TYPES.includes(
        type
      )
    ) {
      return false;
    }

    if (
      this.mutedTypes.includes(
        type
      )
    ) {
      return false;
    }

    const preference =
      this.types?.[type];

    if (
      !preference
    ) {
      return true;
    }

    if (
      preference.mutedUntil &&
      preference.mutedUntil >
        new Date()
    ) {
      return false;
    }

    return preference.enabled;
  };

notificationPreferenceSchema.methods.isChannelEnabled =
  function (
    channel
  ) {
    if (
      !NOTIFICATION_CHANNELS.includes(
        channel
      )
    ) {
      return false;
    }

    if (
      !this.enabled ||
      !this.allowNotifications ||
      this.isMuted
    ) {
      return false;
    }

    const channelConfig =
      this.channels?.[channel];

    if (
      !channelConfig
    ) {
      return false;
    }

    return channelConfig.enabled;
  };

notificationPreferenceSchema.methods.shouldNotify =
  function ({
    type,
    channel,
    priority = "normal",
    now = new Date(),
  } = {}) {
    if (
      !this.isTypeEnabled(
        type
      )
    ) {
      return false;
    }

    if (
      !this.isChannelEnabled(
        channel
      )
    ) {
      return false;
    }

    const typeConfig =
      this.types?.[type];

    if (
      typeConfig?.priorityOnly &&
      ![
        "high",
        "urgent",
        "critical",
      ].includes(
        priority
      )
    ) {
      return false;
    }

    if (
      channel ===
      "email" &&
      type ===
        "marketing" &&
      !this.allowMarketing
    ) {
      return false;
    }

    if (
      this.isWithinQuietHours(
        now
      )
    ) {
      if (
        priority ===
          "critical" &&
        this.quietHours
          .allowCritical
      ) {
        return true;
      }

      if (
        type ===
          "security" &&
        this.quietHours
          .allowSecurity
      ) {
        return true;
      }

      if (
        type.startsWith(
          "attendance"
        ) &&
        this.quietHours
          .allowAttendance
      ) {
        return true;
      }

      return false;
    }

    return true;
  };

notificationPreferenceSchema.methods.isWithinQuietHours =
  function (
    date = new Date()
  ) {
    if (
      !this.quietHours?.enabled
    ) {
      return false;
    }

    const timezone =
      this.quietHours
        .timezone ||
      this.timezone ||
      "Asia/Kolkata";

    let parts;

    try {
      parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone:
              timezone,
            weekday:
              "long",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        ).formatToParts(
          date
        );
    } catch {
      parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone:
              "UTC",
            weekday:
              "long",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        ).formatToParts(
          date
        );
    }

    const values = {};

    for (
      const part of parts
    ) {
      values[
        part.type
      ] =
        part.value;
    }

    const weekday =
      String(
        values.weekday
      ).toLowerCase();

    if (
      !this.quietHours.days.includes(
        weekday
      )
    ) {
      return false;
    }

    const currentMinutes =
      Number(
        values.hour
      ) *
        60 +
      Number(
        values.minute
      );

    const [
      startHour,
      startMinute,
    ] =
      this.quietHours.startTime
        .split(":")
        .map(Number);

    const [
      endHour,
      endMinute,
    ] =
      this.quietHours.endTime
        .split(":")
        .map(Number);

    const startMinutes =
      startHour * 60 +
      startMinute;

    const endMinutes =
      endHour * 60 +
      endMinute;

    if (
      startMinutes <
      endMinutes
    ) {
      return (
        currentMinutes >=
          startMinutes &&
        currentMinutes <
          endMinutes
      );
    }

    return (
      currentMinutes >=
        startMinutes ||
      currentMinutes <
        endMinutes
    );
  };

notificationPreferenceSchema.methods.setTypeEnabled =
  async function (
    type,
    enabled
  ) {
    if (
      !NOTIFICATION_TYPES.includes(
        type
      )
    ) {
      throw new Error(
        `Unsupported notification type: ${type}`
      );
    }

    if (
      !this.types?.[type]
    ) {
      throw new Error(
        `Notification type configuration not found: ${type}`
      );
    }

    this.types[type].enabled =
      Boolean(enabled);

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.setChannelEnabled =
  async function (
    channel,
    enabled
  ) {
    if (
      !NOTIFICATION_CHANNELS.includes(
        channel
      )
    ) {
      throw new Error(
        `Unsupported notification channel: ${channel}`
      );
    }

    this.channels[channel].enabled =
      Boolean(enabled);

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.muteType =
  async function (
    type,
    until = null
  ) {
    if (
      !NOTIFICATION_TYPES.includes(
        type
      )
    ) {
      throw new Error(
        `Unsupported notification type: ${type}`
      );
    }

    if (
      !this.mutedTypes.includes(
        type
      )
    ) {
      this.mutedTypes.push(
        type
      );
    }

    this.types[type].mutedUntil =
      until;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.unmuteType =
  async function (
    type
  ) {
    this.mutedTypes =
      this.mutedTypes.filter(
        (item) =>
          item !== type
      );

    if (
      this.types?.[type]
    ) {
      this.types[type].mutedUntil =
        null;
    }

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.muteAll =
  async function (
    until = null
  ) {
    this.mutedUntil =
      until;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.unmuteAll =
  async function () {
    this.mutedUntil =
      null;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.enableQuietHours =
  async function ({
    startTime,
    endTime,
    timezone,
    days,
  } = {}) {
    if (
      startTime
    ) {
      this.quietHours.startTime =
        startTime;
    }

    if (
      endTime
    ) {
      this.quietHours.endTime =
        endTime;
    }

    if (
      timezone
    ) {
      this.quietHours.timezone =
        timezone;
    }

    if (
      Array.isArray(
        days
      )
    ) {
      this.quietHours.days =
        days;
    }

    this.quietHours.enabled =
      true;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.disableQuietHours =
  async function () {
    this.quietHours.enabled =
      false;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.enableDigest =
  async function ({
    frequency = "daily",
    time = "09:00",
    timezone,
    dayOfWeek = "monday",
  } = {}) {
    this.digest.enabled =
      true;

    this.digest.frequency =
      frequency;

    this.digest.time =
      time;

    if (
      timezone
    ) {
      this.digest.timezone =
        timezone;
    }

    this.digest.dayOfWeek =
      dayOfWeek;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.disableDigest =
  async function () {
    this.digest.enabled =
      false;

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.setPreferredDevice =
  async function (
    deviceId
  ) {
    this.devicePreferences
      .preferredDeviceId =
      deviceId;

    if (
      this.devicePreferences
        .excludedDeviceIds.some(
          (id) =>
            String(id) ===
            String(deviceId)
        )
    ) {
      this.devicePreferences
        .excludedDeviceIds =
        this.devicePreferences
          .excludedDeviceIds.filter(
            (id) =>
              String(id) !==
              String(
                deviceId
              )
          );
    }

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.excludeDevice =
  async function (
    deviceId
  ) {
    const alreadyExcluded =
      this.devicePreferences
        .excludedDeviceIds.some(
          (id) =>
            String(id) ===
            String(deviceId)
        );

    if (
      !alreadyExcluded
    ) {
      this.devicePreferences
        .excludedDeviceIds.push(
          deviceId
        );
    }

    if (
      this.devicePreferences
        .preferredDeviceId &&
      String(
        this.devicePreferences
          .preferredDeviceId
      ) ===
        String(deviceId)
    ) {
      this.devicePreferences
        .preferredDeviceId =
        null;
    }

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.restoreDefaults =
  async function () {
    this.enabled =
      true;

    this.allowNotifications =
      true;

    this.allowMarketing =
      false;

    this.allowSystem =
      true;

    this.allowSecurity =
      true;

    this.mutedTypes =
      [];

    this.mutedUntil =
      null;

    this.quietHours =
      {
        enabled: false,
        timezone:
          this.timezone ||
          "Asia/Kolkata",
        startTime:
          "22:00",
        endTime:
          "07:00",
        days:
          QUIET_DAY_VALUES,
        allowCritical:
          true,
        allowSecurity:
          true,
        allowAttendance:
          true,
      };

    this.digest =
      {
        enabled: false,
        frequency:
          "daily",
        time:
          "09:00",
        timezone:
          this.timezone ||
          "Asia/Kolkata",
        dayOfWeek:
          "monday",
        includeRead:
          false,
        includeMuted:
          false,
        lastSentAt:
          null,
      };

    this.version +=
      1;

    return this.save();
  };

notificationPreferenceSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

notificationPreferenceSchema.methods.restore =
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

notificationPreferenceSchema.statics.findForUser =
  function (
    instituteId,
    userId
  ) {
    return this.findOne({
      instituteId,
      userId,
      isDeleted: false,
    });
  };

notificationPreferenceSchema.statics.findOrCreateForUser =
  async function ({
    instituteId,
    userId,
    role = null,
    timezone = "Asia/Kolkata",
    locale = "en-IN",
  } = {}) {
    let preferences =
      await this.findOne({
        instituteId,
        userId,
        isDeleted: false,
      });

    if (
      preferences
    ) {
      return preferences;
    }

    preferences =
      await this.create({
        instituteId,
        userId,
        role,
        timezone,
        locale,
      });

    return preferences;
  };

notificationPreferenceSchema.statics.shouldNotifyUser =
  async function ({
    instituteId,
    userId,
    type,
    channel,
    priority = "normal",
    now = new Date(),
  } = {}) {
    const preferences =
      await this.findOne({
        instituteId,
        userId,
        isDeleted: false,
      });

    if (
      !preferences
    ) {
      return (
        type !==
          "marketing"
      );
    }

    return preferences.shouldNotify(
      {
        type,
        channel,
        priority,
        now,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const NotificationPreference =
  mongoose.models
    .NotificationPreference ||
  mongoose.model(
    "NotificationPreference",
    notificationPreferenceSchema
  );

export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_FREQUENCIES,
  DIGEST_DAYS,
  QUIET_DAY_VALUES,
};