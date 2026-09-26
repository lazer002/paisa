// server/src/models/LiveSession.js

import mongoose from "mongoose";

const LIVE_SESSION_STATUS = [
  "draft",
  "scheduled",
  "starting",
  "live",
  "paused",
  "ended",
  "cancelled",
  "failed",
  "archived",
];

const SESSION_TYPES = [
  "live_class",
  "lecture",
  "webinar",
  "workshop",
  "meeting",
  "training",
  "orientation",
  "doubt_session",
  "exam",
  "interview",
  "demo",
  "event",
];

const ACCESS_MODES = [
  "private",
  "class",
  "course",
  "department",
  "organization",
  "public",
  "invite_only",
];

const PROVIDERS = [
  "internal",
  "zoom",
  "google_meet",
  "microsoft_teams",
  "jitsi",
  "custom",
];

const PARTICIPANT_ROLES = [
  "host",
  "co_host",
  "teacher",
  "student",
  "employee",
  "guest",
  "observer",
];

const PARTICIPANT_STATUS = [
  "invited",
  "registered",
  "joined",
  "left",
  "removed",
  "banned",
  "absent",
];

const CHAT_MODERATION_STATUS = [
  "open",
  "moderated",
  "locked",
  "disabled",
];

const recordingSchema =
  new mongoose.Schema(
    {
      _id: false,

      enabled: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        enum: [
          "not_started",
          "recording",
          "processing",
          "ready",
          "failed",
          "deleted",
        ],
        default: "not_started",
      },

      provider: {
        type: String,
        enum: PROVIDERS,
        default: "internal",
      },

      recordingId: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      playbackUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      sizeBytes: {
        type: Number,
        min: 0,
        default: 0,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      endedAt: {
        type: Date,
        default: null,
      },

      processedAt: {
        type: Date,
        default: null,
      },

      retentionUntil: {
        type: Date,
        default: null,
      },

      isPublished: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const participantSchema =
  new mongoose.Schema(
    {
      _id: false,

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      role: {
        type: String,
        enum: PARTICIPANT_ROLES,
        default: "student",
      },

      status: {
        type: String,
        enum: PARTICIPANT_STATUS,
        default: "invited",
      },

      joinedAt: {
        type: Date,
        default: null,
      },

      leftAt: {
        type: Date,
        default: null,
      },

      lastSeenAt: {
        type: Date,
        default: null,
      },

      totalDurationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      attendanceMarked: {
        type: Boolean,
        default: false,
      },

      attendanceEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttendanceEvent",
        default: null,
      },

      connectionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      cameraEnabled: {
        type: Boolean,
        default: false,
      },

      microphoneEnabled: {
        type: Boolean,
        default: false,
      },

      handRaised: {
        type: Boolean,
        default: false,
      },

      engagementScore: {
        type: Number,
        min: 0,
        max: 100,
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

const materialSchema =
  new mongoose.Schema(
    {
      _id: false,

      title: {
        type: String,
        trim: true,
        maxlength: 300,
        required: true,
      },

      materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudyMaterial",
        default: null,
      },

      url: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      type: {
        type: String,
        enum: [
          "document",
          "image",
          "video",
          "audio",
          "link",
          "presentation",
          "other",
        ],
        default: "document",
      },

      visibleAt: {
        type: Date,
        default: null,
      },

      order: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

const pollSchema =
  new mongoose.Schema(
    {
      _id: false,

      question: {
        type: String,
        trim: true,
        maxlength: 2000,
        required: true,
      },

      options: [
        {
          _id: false,

          key: {
            type: String,
            trim: true,
            maxlength: 30,
            required: true,
          },

          text: {
            type: String,
            trim: true,
            maxlength: 500,
            required: true,
          },

          voteCount: {
            type: Number,
            min: 0,
            default: 0,
          },
        },
      ],

      multipleChoice: {
        type: Boolean,
        default: false,
      },

      anonymous: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        enum: [
          "draft",
          "active",
          "closed",
        ],
        default: "draft",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      closedAt: {
        type: Date,
        default: null,
      },

      totalResponses: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

const chatSettingsSchema =
  new mongoose.Schema(
    {
      _id: false,

      enabled: {
        type: Boolean,
        default: true,
      },

      moderation: {
        type: String,
        enum: CHAT_MODERATION_STATUS,
        default: "open",
      },

      allowStudentChat: {
        type: Boolean,
        default: true,
      },

      allowPrivateMessages: {
        type: Boolean,
        default: false,
      },

      allowLinks: {
        type: Boolean,
        default: false,
      },

      allowFileUploads: {
        type: Boolean,
        default: false,
      },

      maxMessageLength: {
        type: Number,
        min: 50,
        max: 10000,
        default: 2000,
      },

      slowModeSeconds: {
        type: Number,
        min: 0,
        max: 3600,
        default: 0,
      },

      bannedWordsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: false,
    }
  );

const analyticsSchema =
  new mongoose.Schema(
    {
      _id: false,

      peakConcurrentParticipants: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalUniqueParticipants: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalJoins: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalLeaves: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageAttendanceSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageEngagementScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      chatMessages: {
        type: Number,
        min: 0,
        default: 0,
      },

      pollResponses: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionsAsked: {
        type: Number,
        min: 0,
        default: 0,
      },

      reactions: {
        type: Number,
        min: 0,
        default: 0,
      },

      updatedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const liveSessionSchema =
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
      /* BASIC INFORMATION                                                    */
      /* ==================================================================== */

      title: {
        type: String,
        trim: true,
        required: true,
        minlength: 2,
        maxlength: 300,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      sessionCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 50,
        index: true,
      },

      type: {
        type: String,
        enum: SESSION_TYPES,
        default: "live_class",
        index: true,
      },

      status: {
        type: String,
        enum: LIVE_SESSION_STATUS,
        default: "draft",
        index: true,
      },

      /* ==================================================================== */
      /* ACADEMIC / BUSINESS CONTEXT                                          */
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

      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        default: null,
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
        index: true,
      },

      hostUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* SCHEDULING                                                           */
      /* ==================================================================== */

      scheduledStartAt: {
        type: Date,
        required: true,
        index: true,
      },

      scheduledEndAt: {
        type: Date,
        default: null,
      },

      actualStartAt: {
        type: Date,
        default: null,
      },

      actualEndAt: {
        type: Date,
        default: null,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      /* ==================================================================== */
      /* PROVIDER / MEETING                                                    */
      /* ==================================================================== */

      provider: {
        type: String,
        enum: PROVIDERS,
        default: "internal",
      },

      providerSessionId: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      providerMeetingId: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      joinUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      hostUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      passcodeHash: {
        type: String,
        select: false,
        maxlength: 255,
        default: null,
      },

      /* ==================================================================== */
      /* ACCESS CONTROL                                                        */
      /* ==================================================================== */

      accessMode: {
        type: String,
        enum: ACCESS_MODES,
        default: "class",
        index: true,
      },

      maxParticipants: {
        type: Number,
        min: 1,
        max: 1000000,
        default: 500,
      },

      registrationRequired: {
        type: Boolean,
        default: false,
      },

      approvalRequired: {
        type: Boolean,
        default: false,
      },

      allowLateJoin: {
        type: Boolean,
        default: true,
      },

      lateJoinCutoffMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 0,
      },

      allowRejoin: {
        type: Boolean,
        default: true,
      },

      allowGuestParticipants: {
        type: Boolean,
        default: false,
      },

      /* ==================================================================== */
      /* PARTICIPANTS                                                         */
      /* ==================================================================== */

      participants: {
        type: [participantSchema],
        default: [],
      },

      participantCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      currentParticipantCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* RECORDING                                                            */
      /* ==================================================================== */

      recording: {
        type: recordingSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* CHAT                                                                  */
      /* ==================================================================== */

      chat: {
        type: chatSettingsSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* POLLS                                                                 */
      /* ==================================================================== */

      polls: {
        type: [pollSchema],
        default: [],
      },

      /* ==================================================================== */
      /* MATERIALS                                                             */
      /* ==================================================================== */

      materials: {
        type: [materialSchema],
        default: [],
      },

      /* ==================================================================== */
      /* INTERACTION                                                           */
      /* ==================================================================== */

      interaction: {
        screenSharingEnabled: {
          type: Boolean,
          default: true,
        },

        whiteboardEnabled: {
          type: Boolean,
          default: false,
        },

        raiseHandEnabled: {
          type: Boolean,
          default: true,
        },

        reactionsEnabled: {
          type: Boolean,
          default: true,
        },

        questionsEnabled: {
          type: Boolean,
          default: true,
        },

        breakoutRoomsEnabled: {
          type: Boolean,
          default: false,
        },

        captionsEnabled: {
          type: Boolean,
          default: false,
        },

        translationEnabled: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* ATTENDANCE                                                            */
      /* ==================================================================== */

      attendance: {
        enabled: {
          type: Boolean,
          default: true,
        },

        autoMark: {
          type: Boolean,
          default: false,
        },

        minimumAttendancePercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 75,
        },

        gracePeriodMinutes: {
          type: Number,
          min: 0,
          max: 120,
          default: 10,
        },

        requireContinuousPresence: {
          type: Boolean,
          default: false,
        },

        qrEnabled: {
          type: Boolean,
          default: false,
        },

        faceVerificationEnabled: {
          type: Boolean,
          default: false,
        },

        geofenceEnabled: {
          type: Boolean,
          default: false,
        },

        geofenceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Geofence",
          default: null,
        },
      },

      /* ==================================================================== */
      /* SECURITY                                                              */
      /* ==================================================================== */

      security: {
        waitingRoomEnabled: {
          type: Boolean,
          default: false,
        },

        hostApprovalRequired: {
          type: Boolean,
          default: false,
        },

        muteParticipantsOnJoin: {
          type: Boolean,
          default: false,
        },

        disableParticipantVideo: {
          type: Boolean,
          default: false,
        },

        lockMeetingAfterStart: {
          type: Boolean,
          default: false,
        },

        watermarkEnabled: {
          type: Boolean,
          default: false,
        },

        preventRecording: {
          type: Boolean,
          default: false,
        },

        preventScreenshots: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* ANALYTICS                                                             */
      /* ==================================================================== */

      analytics: {
        type: analyticsSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* NOTIFICATIONS                                                         */
      /* ==================================================================== */

      notifications: {
        sendBeforeMinutes: {
          type: [Number],
          default: [1440, 60, 10],
        },

        sendJoinReminder: {
          type: Boolean,
          default: true,
        },

        sendStartNotification: {
          type: Boolean,
          default: true,
        },

        sendEndNotification: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* TAGGING                                                               */
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

      /* ==================================================================== */
      /* AUDIT / LIFECYCLE                                                     */
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

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      archivedAt: {
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

liveSessionSchema.index(
  {
    instituteId: 1,
    scheduledStartAt: 1,
    status: 1,
  },
  {
    name: "scheduled_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    hostUserId: 1,
    scheduledStartAt: -1,
  },
  {
    name: "host_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    teacherId: 1,
    scheduledStartAt: -1,
  },
  {
    name: "teacher_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    classId: 1,
    scheduledStartAt: -1,
  },
  {
    name: "class_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    scheduledStartAt: -1,
  },
  {
    name: "department_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    status: 1,
    actualStartAt: -1,
  },
  {
    name: "live_session_status",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    "participants.userId": 1,
    scheduledStartAt: -1,
  },
  {
    name: "participant_sessions",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    provider: 1,
    providerSessionId: 1,
  },
  {
    name: "provider_session_lookup",
    sparse: true,
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    scheduledStartAt: -1,
  },
  {
    name: "session_calendar",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
    scheduledStartAt: -1,
  },
  {
    name: "session_type_feed",
  }
);

liveSessionSchema.index(
  {
    instituteId: 1,
    title: "text",
    description: "text",
    tags: "text",
  },
  {
    name: "session_text_search",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

liveSessionSchema.pre(
  "validate",
  function (next) {
    if (
      this.scheduledEndAt &&
      this.scheduledStartAt &&
      this.scheduledEndAt <=
        this.scheduledStartAt
    ) {
      return next(
        new Error(
          "Scheduled end time must be after scheduled start time"
        )
      );
    }

    if (
      this.actualEndAt &&
      this.actualStartAt &&
      this.actualEndAt <=
        this.actualStartAt
    ) {
      return next(
        new Error(
          "Actual end time must be after actual start time"
        )
      );
    }

    if (
      this.maxParticipants < 1
    ) {
      return next(
        new Error(
          "Maximum participants must be at least 1"
        )
      );
    }

    if (
      this.participants.length >
      this.maxParticipants
    ) {
      return next(
        new Error(
          "Participant count exceeds session capacity"
        )
      );
    }

    if (
      this.accessMode ===
        "class" &&
      !this.classId
    ) {
      return next(
        new Error(
          "Class is required for class access mode"
        )
      );
    }

    if (
      this.attendance.geofenceEnabled &&
      !this.attendance.geofenceId
    ) {
      return next(
        new Error(
          "Geofence is required when geofence attendance is enabled"
        )
      );
    }

    if (
      this.recording.enabled &&
      this.security.preventRecording
    ) {
      return next(
        new Error(
          "Recording cannot be enabled when recording is prevented"
        )
      );
    }

    if (
      this.notifications.sendBeforeMinutes.some(
        (value) =>
          !Number.isFinite(
            value
          ) ||
          value < 0
      )
    ) {
      return next(
        new Error(
          "Invalid notification schedule"
        )
      );
    }

    if (
      this.polls.length >
      100
    ) {
      return next(
        new Error(
          "A live session cannot contain more than 100 polls"
        )
      );
    }

    if (
      this.materials.length >
      500
    ) {
      return next(
        new Error(
          "A live session cannot contain more than 500 materials"
        )
      );
    }

    if (
      this.participants.length >
      10000
    ) {
      return next(
        new Error(
          "Participant list exceeds embedded document safety limit"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

liveSessionSchema.virtual(
  "isLive"
).get(function () {
  return this.status === "live";
});

liveSessionSchema.virtual(
  "isUpcoming"
).get(function () {
  return [
    "draft",
    "scheduled",
    "starting",
  ].includes(
    this.status
  );
});

liveSessionSchema.virtual(
  "isFinished"
).get(function () {
  return [
    "ended",
    "cancelled",
    "failed",
    "archived",
  ].includes(
    this.status
  );
});

liveSessionSchema.virtual(
  "occupancyPercentage"
).get(function () {
  if (
    !this.maxParticipants
  ) {
    return 0;
  }

  return Math.round(
    Math.min(
      100,
      (this.currentParticipantCount /
        this.maxParticipants) *
        100
    ) * 100
  ) / 100;
});

liveSessionSchema.virtual(
  "attendanceRate"
).get(function () {
  if (
    !this.participantCount
  ) {
    return 0;
  }

  const attended =
    this.participants.filter(
      (participant) =>
        participant.status ===
          "joined" ||
        participant.status ===
          "left"
    ).length;

  return Math.round(
    (attended /
      this.participantCount) *
      10000
  ) / 100;
});

liveSessionSchema.virtual(
  "scheduledDurationSeconds"
).get(function () {
  if (
    !this.scheduledStartAt ||
    !this.scheduledEndAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (this.scheduledEndAt.getTime() -
        this.scheduledStartAt.getTime()) /
        1000
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

liveSessionSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

liveSessionSchema.query.upcoming =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "draft",
          "scheduled",
          "starting",
        ],
      },
      scheduledStartAt: {
        $gte: new Date(),
      },
    });
  };

liveSessionSchema.query.live =
  function () {
    return this.where({
      isDeleted: false,
      status: "live",
    });
  };

liveSessionSchema.query.forHost =
  function (
    hostUserId
  ) {
    return this.where({
      hostUserId,
      isDeleted: false,
    });
  };

liveSessionSchema.query.forClass =
  function (
    classId
  ) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

liveSessionSchema.query.forTeacher =
  function (
    teacherId
  ) {
    return this.where({
      teacherId,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

liveSessionSchema.methods.schedule =
  async function () {
    if (
      ![
        "draft",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Session cannot be scheduled from its current state"
      );
    }

    if (
      this.scheduledStartAt <=
      new Date()
    ) {
      throw new Error(
        "Scheduled start time must be in the future"
      );
    }

    this.status =
      "scheduled";

    return this.save();
  };

liveSessionSchema.methods.start =
  async function () {
    if (
      ![
        "scheduled",
        "starting",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Session cannot be started from its current state"
      );
    }

    const now =
      new Date();

    this.status =
      "live";

    this.actualStartAt =
      this.actualStartAt ||
      now;

    return this.save();
  };

liveSessionSchema.methods.pause =
  async function () {
    if (
      this.status !==
      "live"
    ) {
      throw new Error(
        "Only live sessions can be paused"
      );
    }

    this.status =
      "paused";

    return this.save();
  };

liveSessionSchema.methods.resume =
  async function () {
    if (
      this.status !==
      "paused"
    ) {
      throw new Error(
        "Only paused sessions can be resumed"
      );
    }

    this.status =
      "live";

    return this.save();
  };

liveSessionSchema.methods.end =
  async function () {
    if (
      [
        "ended",
        "cancelled",
        "failed",
        "archived",
      ].includes(
        this.status
      )
    ) {
      return this;
    }

    const now =
      new Date();

    this.status =
      "ended";

    this.actualEndAt =
      now;

    if (
      this.actualStartAt
    ) {
      this.durationSeconds =
        Math.max(
          0,
          Math.floor(
            (now.getTime() -
              this.actualStartAt.getTime()) /
              1000
          )
        );
    }

    this.currentParticipantCount =
      0;

    this.participants.forEach(
      (participant) => {
        if (
          participant.status ===
            "joined"
        ) {
          participant.status =
            "left";

          participant.leftAt =
            now;

          if (
            participant.joinedAt
          ) {
            participant.totalDurationSeconds =
              Math.max(
                0,
                Math.floor(
                  (now.getTime() -
                    participant.joinedAt.getTime()) /
                    1000
                )
              );
          }
        }
      }
    );

    return this.save();
  };

liveSessionSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      [
        "ended",
        "archived",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Completed sessions cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    return this.save();
  };

liveSessionSchema.methods.addParticipant =
  async function ({
    userId,
    role = "student",
  } = {}) {
    if (!userId) {
      throw new Error(
        "User ID is required"
      );
    }

    const existing =
      this.participants.find(
        (participant) =>
          participant.userId?.toString() ===
          userId.toString()
      );

    if (existing) {
      if (
        existing.status ===
        "banned"
      ) {
        throw new Error(
          "Participant is banned from this session"
        );
      }

      existing.status =
        "invited";

      return this.save();
    }

    if (
      this.participants.length >=
      this.maxParticipants
    ) {
      throw new Error(
        "Session participant capacity has been reached"
      );
    }

    this.participants.push({
      userId,
      role,
      status: "invited",
    });

    this.participantCount =
      this.participants.length;

    return this.save();
  };

liveSessionSchema.methods.joinParticipant =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId?.toString() ===
          userId.toString()
      );

    if (!participant) {
      throw new Error(
        "Participant is not registered for this session"
      );
    }

    if (
      participant.status ===
      "banned"
    ) {
      throw new Error(
        "Participant is banned from this session"
      );
    }

    if (
      !this.allowLateJoin &&
      this.actualStartAt
    ) {
      const elapsedMinutes =
        (Date.now() -
          this.actualStartAt.getTime()) /
        60000;

      if (
        elapsedMinutes >
        this.lateJoinCutoffMinutes
      ) {
        throw new Error(
          "Late joining is not allowed"
        );
      }
    }

    const now =
      new Date();

    participant.status =
      "joined";

    participant.joinedAt =
      participant.joinedAt ||
      now;

    participant.lastSeenAt =
      now;

    participant.connectionCount +=
      1;

    this.currentParticipantCount =
      this.participants.filter(
        (item) =>
          item.status ===
          "joined"
      ).length;

    this.analytics.totalJoins +=
      1;

    this.analytics.totalUniqueParticipants =
      new Set(
        this.participants.map(
          (item) =>
            item.userId?.toString()
        )
      ).size;

    this.analytics.peakConcurrentParticipants =
      Math.max(
        this.analytics
          .peakConcurrentParticipants,
        this.currentParticipantCount
      );

    this.analytics.updatedAt =
      now;

    return this.save();
  };

liveSessionSchema.methods.leaveParticipant =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId?.toString() ===
          userId.toString()
      );

    if (!participant) {
      throw new Error(
        "Participant not found"
      );
    }

    const now =
      new Date();

    participant.status =
      "left";

    participant.leftAt =
      now;

    participant.lastSeenAt =
      now;

    if (
      participant.joinedAt
    ) {
      participant.totalDurationSeconds +=
        Math.max(
          0,
          Math.floor(
            (now.getTime() -
              participant.joinedAt.getTime()) /
              1000
          )
        );

      participant.joinedAt =
        null;
    }

    this.currentParticipantCount =
      this.participants.filter(
        (item) =>
          item.status ===
          "joined"
      ).length;

    this.analytics.totalLeaves +=
      1;

    this.analytics.updatedAt =
      now;

    return this.save();
  };

liveSessionSchema.methods.updateParticipantPresence =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId?.toString() ===
          userId.toString()
      );

    if (!participant) {
      throw new Error(
        "Participant not found"
      );
    }

    participant.lastSeenAt =
      new Date();

    return this.save();
  };

liveSessionSchema.methods.banParticipant =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId?.toString() ===
          userId.toString()
      );

    if (!participant) {
      throw new Error(
        "Participant not found"
      );
    }

    participant.status =
      "banned";

    if (
      participant.status ===
      "joined"
    ) {
      this.currentParticipantCount =
        Math.max(
          0,
          this.currentParticipantCount -
            1
        );
    }

    return this.save();
  };

liveSessionSchema.methods.addMaterial =
  async function ({
    title,
    materialId = null,
    url = null,
    type = "document",
    order = 0,
  } = {}) {
    if (!title) {
      throw new Error(
        "Material title is required"
      );
    }

    this.materials.push({
      title,
      materialId,
      url,
      type,
      order,
    });

    return this.save();
  };

liveSessionSchema.methods.createPoll =
  async function ({
    question,
    options,
    multipleChoice = false,
    anonymous = false,
    createdBy = null,
  } = {}) {
    if (
      !question ||
      !Array.isArray(options) ||
      options.length < 2
    ) {
      throw new Error(
        "Poll question and at least two options are required"
      );
    }

    this.polls.push({
      question,
      options: options.map(
        (option) => ({
          key:
            option.key,
          text:
            option.text,
          voteCount: 0,
        })
      ),
      multipleChoice,
      anonymous,
      status: "draft",
      createdBy,
    });

    return this.save();
  };

liveSessionSchema.methods.archive =
  async function () {
    if (
      this.status !==
      "ended"
    ) {
      throw new Error(
        "Only ended sessions can be archived"
      );
    }

    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

liveSessionSchema.methods.softDelete =
  async function () {
    if (
      this.status ===
      "live"
    ) {
      throw new Error(
        "Live sessions cannot be deleted"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

liveSessionSchema.methods.restore =
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

liveSessionSchema.statics.findUpcoming =
  function (
    instituteId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "scheduled",
          "starting",
        ],
      },
      scheduledStartAt: {
        $gte: new Date(),
      },
    })
      .sort({
        scheduledStartAt: 1,
      })
      .limit(limit);
  };

liveSessionSchema.statics.findLive =
  function (
    instituteId
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: "live",
    }).sort({
      actualStartAt: 1,
    });
  };

liveSessionSchema.statics.findForStudent =
  function (
    instituteId,
    studentId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      $or: [
        {
          "participants.userId":
            studentId,
        },
        {
          accessMode:
            "organization",
        },
        {
          accessMode:
            "public",
        },
      ],
    })
      .sort({
        scheduledStartAt: -1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const LiveSession =
  mongoose.models.LiveSession ||
  mongoose.model(
    "LiveSession",
    liveSessionSchema
  );

export {
  LIVE_SESSION_STATUS,
  SESSION_TYPES,
  ACCESS_MODES,
  PROVIDERS,
  PARTICIPANT_ROLES,
  PARTICIPANT_STATUS,
  CHAT_MODERATION_STATUS,
};