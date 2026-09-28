// server/src/models/Class.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const CLASS_STATUS = [
  "draft",
  "active",
  "inactive",
  "completed",
  "archived",
];

const CLASS_MODES = [
  "in_person",
  "online",
  "hybrid",
];

const LIVE_SESSION_STATUS = [
  "scheduled",
  "live",
  "ended",
  "cancelled",
];

const LIVE_PROVIDER = [
  "internal",
  "zoom",
  "google_meet",
  "teams",
  "youtube",
  "other",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * CLASS / BATCH
 *
 * This is intentionally designed as the academic root of PAISA.
 *
 * Future systems can attach to this class:
 *
 *   Class
 *    ├── Students
 *    ├── Teachers
 *    ├── Live Classes
 *    ├── Attendance
 *    ├── Assignments
 *    ├── Study Materials
 *    ├── Tests / Exams
 *    ├── Results
 *    ├── Rankings
 *    ├── Leaderboards
 *    ├── Points / XP
 *    ├── Achievements
 *    └── Analytics
 *
 * The Class document should remain the stable academic container.
 */

const classSchema = new mongoose.Schema(
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `cla_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ---------------------------------------------------------------------- */
    /* BASIC IDENTITY                                                          */
    /* ---------------------------------------------------------------------- */

    name: {
      type: String,
      required: [
        true,
        "Class name is required",
      ],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: null,
    },

    subject: {
      type: String,
      required: [
        true,
        "Subject is required",
      ],
      trim: true,
      maxlength: 150,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* ACADEMIC CONTEXT                                                        */
    /* ---------------------------------------------------------------------- */

    grade: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    branch: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    course: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    academicYear: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    section: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    syllabusUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* PEOPLE                                                                   */
    /* ---------------------------------------------------------------------- */

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    coTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* SCHEDULE                                                                 */
    /* ---------------------------------------------------------------------- */

    schedule: {
      days: [
        {
          type: String,
          enum: DAYS,
        },
      ],

      startTime: {
        type: String,
        trim: true,
        match: [
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid start time",
        ],
        default: null,
      },

      endTime: {
        type: String,
        trim: true,
        match: [
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid end time",
        ],
        default: null,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      room: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      mode: {
        type: String,
        enum: CLASS_MODES,
        default: "in_person",
      },

      meetingLink: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ENROLLMENT                                                               */
    /* ---------------------------------------------------------------------- */

    maxStudents: {
      type: Number,
      min: 1,
      max: 100000,
      default: 50,
    },

    enrollment: {
      open: {
        type: Boolean,
        default: true,
      },

      requiresApproval: {
        type: Boolean,
        default: false,
      },

      enrollmentCode: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      opensAt: {
        type: Date,
        default: null,
      },

      closesAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* LIVE CLASS / STREAMING                                                   */
    /* ---------------------------------------------------------------------- */

    liveClass: {
      enabled: {
        type: Boolean,
        default: true,
      },

      provider: {
        type: String,
        enum: [
          ...LIVE_PROVIDER,
          null,
        ],
        default: null,
      },

      defaultMeetingUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      defaultRecordingUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      allowRecording: {
        type: Boolean,
        default: true,
      },

      allowStudentChat: {
        type: Boolean,
        default: true,
      },

      allowStudentMic: {
        type: Boolean,
        default: false,
      },

      allowStudentCamera: {
        type: Boolean,
        default: false,
      },

      attendanceRequired: {
        type: Boolean,
        default: true,
      },

      autoMarkAttendance: {
        type: Boolean,
        default: false,
      },
    },

    /*
     * Live sessions are kept as lightweight scheduling metadata.
     *
     * The actual stream/session service can later live in its own collection
     * so Class documents do not grow indefinitely.
     */
    liveSessions: [
      {
        _id: false,

        sessionId: {
          type: String,
          trim: true,
          maxlength: 150,
        },

        title: {
          type: String,
          trim: true,
          maxlength: 200,
        },

        scheduledStart: {
          type: Date,
          required: true,
        },

        scheduledEnd: {
          type: Date,
          default: null,
        },

        actualStart: {
          type: Date,
          default: null,
        },

        actualEnd: {
          type: Date,
          default: null,
        },

        status: {
          type: String,
          enum: LIVE_SESSION_STATUS,
          default: "scheduled",
        },

        provider: {
          type: String,
          enum: LIVE_PROVIDER,
          default: "internal",
        },

        joinUrl: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        recordingUrl: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        recordingAvailable: {
          type: Boolean,
          default: false,
        },

        attendanceSessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attendance",
          default: null,
        },

        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* LEARNING CONFIGURATION                                                  */
    /* ---------------------------------------------------------------------- */

    learning: {
      allowAssignments: {
        type: Boolean,
        default: true,
      },

      allowTests: {
        type: Boolean,
        default: true,
      },

      allowQuizzes: {
        type: Boolean,
        default: true,
      },

      allowStudyMaterials: {
        type: Boolean,
        default: true,
      },

      allowDiscussion: {
        type: Boolean,
        default: true,
      },

      allowPeerLearning: {
        type: Boolean,
        default: false,
      },

      allowProjects: {
        type: Boolean,
        default: true,
      },

      allowCertificates: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ASSESSMENT SYSTEM                                                        */
    /* ---------------------------------------------------------------------- */

    assessment: {
      enabled: {
        type: Boolean,
        default: true,
      },

      gradingMode: {
        type: String,
        enum: [
          "marks",
          "percentage",
          "grade",
          "points",
          "mixed",
        ],
        default: "marks",
      },

      passingPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 40,
      },

      allowNegativeMarking: {
        type: Boolean,
        default: false,
      },

      negativeMarkPerQuestion: {
        type: Number,
        min: 0,
        default: 0,
      },

      rankingEnabled: {
        type: Boolean,
        default: false,
      },

      leaderboardEnabled: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* GAMIFICATION / RANKING                                                  */
    /* ---------------------------------------------------------------------- */

    gamification: {
      enabled: {
        type: Boolean,
        default: false,
      },

      pointsEnabled: {
        type: Boolean,
        default: true,
      },

      xpEnabled: {
        type: Boolean,
        default: true,
      },

      badgesEnabled: {
        type: Boolean,
        default: true,
      },

      streaksEnabled: {
        type: Boolean,
        default: true,
      },

      leaderboardEnabled: {
        type: Boolean,
        default: false,
      },

      rankingScope: {
        type: String,
        enum: [
          "class",
          "subject",
          "batch",
          "institute",
          "global",
        ],
        default: "class",
      },

      rankingPeriod: {
        type: String,
        enum: [
          "daily",
          "weekly",
          "monthly",
          "term",
          "academic_year",
          "all_time",
        ],
        default: "academic_year",
      },
    },

    /*
     * Cached leaderboard information only.
     *
     * Source-of-truth ranking data should eventually live in dedicated
     * assessment/gamification collections.
     */
    leaderboard: {
      lastComputedAt: {
        type: Date,
        default: null,
      },

      totalParticipants: {
        type: Number,
        min: 0,
        default: 0,
      },

      topStudentIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    /* ---------------------------------------------------------------------- */
    /* ATTENDANCE CONFIGURATION                                                */
    /* ---------------------------------------------------------------------- */

    attendance: {
      enabled: {
        type: Boolean,
        default: true,
      },

      required: {
        type: Boolean,
        default: true,
      },

      mode: {
        type: String,
        enum: [
          "manual",
          "qr",
          "mobile",
          "geo",
          "live_session",
          "hybrid",
        ],
        default: "manual",
      },

      lateAfterMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 15,
      },

      autoSyncFromLiveClass: {
        type: Boolean,
        default: false,
      },

      allowStudentSelfAttendance: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* CAPACITY / ENROLLMENT STATS                                             */
    /* ---------------------------------------------------------------------- */

    stats: {
      attendancePercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      assignmentsCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      testsCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      quizzesCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      materialsCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      liveSessionsCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      activeStudentsCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      averagePoints: {
        type: Number,
        min: 0,
        default: null,
      },

      lastComputedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                  */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: CLASS_STATUS,
        message: "Invalid class status",
      },
      default: "active",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* AUDIT                                                                    */
    /* ---------------------------------------------------------------------- */

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

classSchema.index(
  {
    instituteId: 1,
    status: 1,
  },
  {
    name: "class_institute_status",
  }
);

classSchema.index(
  {
    instituteId: 1,
    subject: 1,
  },
  {
    name: "class_institute_subject",
  }
);

classSchema.index(
  {
    instituteId: 1,
    teacherId: 1,
    status: 1,
  },
  {
    name: "class_teacher_status",
  }
);

classSchema.index(
  {
    instituteId: 1,
    academicYear: 1,
    section: 1,
  },
  {
    name: "class_academic_year_section",
  }
);

classSchema.index(
  {
    instituteId: 1,
    code: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "class_institute_code_unique",
  }
);

classSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
  },
  {
    name: "class_institute_deleted",
  }
);

classSchema.index(
  {
    "liveSessions.scheduledStart": 1,
    "liveSessions.status": 1,
  },
  {
    name: "class_live_session_schedule",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

classSchema.pre(
  "validate",
  function (next) {
    const studentCount =
      this.studentIds?.length || 0;

    if (
      studentCount >
      this.maxStudents
    ) {
      return next(
        new Error(
          "Student count cannot exceed class capacity"
        )
      );
    }

    if (
      this.schedule?.startTime &&
      this.schedule?.endTime &&
      this.schedule.startTime >=
        this.schedule.endTime
    ) {
      return next(
        new Error(
          "Class end time must be after start time"
        )
      );
    }

    if (
      this.enrollment?.opensAt &&
      this.enrollment?.closesAt &&
      this.enrollment.opensAt >=
        this.enrollment.closesAt
    ) {
      return next(
        new Error(
          "Enrollment close time must be after open time"
        )
      );
    }

    if (
      this.schedule?.mode ===
        "online" &&
      !this.schedule?.meetingLink &&
      !this.liveClass?.defaultMeetingUrl
    ) {
      /*
       * Do not hard-fail here.
       *
       * A live-session URL can be generated dynamically by the live-stream
       * service when the class actually starts.
       */
    }

    if (
      !this.gamification?.enabled
    ) {
      this.leaderboard = {
        lastComputedAt: null,
        totalParticipants: 0,
        topStudentIds: [],
      };
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

classSchema.virtual(
  "enrolledCount"
).get(function () {
  return (
    this.studentIds?.length || 0
  );
});

classSchema.virtual(
  "seatsAvailable"
).get(function () {
  return Math.max(
    0,
    (this.maxStudents || 0) -
      (this.studentIds?.length || 0)
  );
});

classSchema.virtual(
  "isFull"
).get(function () {
  return (
    (this.studentIds?.length || 0) >=
    (this.maxStudents || 0)
  );
});

classSchema.virtual(
  "isEnrollmentOpen"
).get(function () {
  const now = new Date();

  if (
    this.status !== "active" ||
    this.isDeleted ||
    !this.enrollment?.open ||
    this.isFull
  ) {
    return false;
  }

  if (
    this.enrollment.opensAt &&
    now < this.enrollment.opensAt
  ) {
    return false;
  }

  if (
    this.enrollment.closesAt &&
    now > this.enrollment.closesAt
  ) {
    return false;
  }

  return true;
});

classSchema.virtual(
  "hasLiveClass"
).get(function () {
  return (
    this.liveClass?.enabled === true
  );
});

classSchema.virtual(
  "isLiveNow"
).get(function () {
  return (
    this.liveSessions?.some(
      (session) =>
        session.status === "live"
    ) || false
  );
});

classSchema.virtual(
  "activeLiveSession"
).get(function () {
  return (
    this.liveSessions?.find(
      (session) =>
        session.status === "live"
    ) || null
  );
});

classSchema.virtual(
  "isGamified"
).get(function () {
  return (
    this.gamification?.enabled === true
  );
});

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

classSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

classSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

classSchema.query.byTeacher =
  function (teacherId) {
    return this.where({
      teacherId,
      isDeleted: false,
    });
  };

classSchema.query.byStudent =
  function (studentId) {
    return this.where({
      studentIds: studentId,
      isDeleted: false,
    });
  };

classSchema.query.liveEnabled =
  function () {
    return this.where({
      "liveClass.enabled": true,
      isDeleted: false,
    });
  };

classSchema.query.gamified =
  function () {
    return this.where({
      "gamification.enabled": true,
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* ENROLLMENT METHODS                                                         */
/* -------------------------------------------------------------------------- */

classSchema.methods.enrollStudent =
  async function (
    studentId,
    byUserId = null
  ) {
    if (
      !this.isEnrollmentOpen
    ) {
      throw new Error(
        "Enrollment is not currently available"
      );
    }

    const exists =
      this.studentIds.some(
        (id) =>
          id.toString() ===
          studentId.toString()
      );

    if (!exists) {
      if (
        this.studentIds.length >=
        this.maxStudents
      ) {
        throw new Error(
          "Class is full"
        );
      }

      this.studentIds.push(
        studentId
      );

      this.stats.activeStudentsCount =
        this.studentIds.length;

      if (byUserId) {
        this.updatedBy =
          byUserId;
      }

      await this.save();
    }

    return this;
  };

classSchema.methods.removeStudent =
  async function (
    studentId,
    byUserId = null
  ) {
    this.studentIds =
      this.studentIds.filter(
        (id) =>
          id.toString() !==
          studentId.toString()
      );

    this.stats.activeStudentsCount =
      this.studentIds.length;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    await this.save();

    return this;
  };

/* -------------------------------------------------------------------------- */
/* LIVE SESSION METHODS                                                       */
/* -------------------------------------------------------------------------- */

classSchema.methods.scheduleLiveSession =
  async function ({
    sessionId,
    title,
    scheduledStart,
    scheduledEnd = null,
    provider = "internal",
    joinUrl = null,
    createdBy = null,
  }) {
    if (
      !this.liveClass?.enabled
    ) {
      throw new Error(
        "Live classes are disabled for this class"
      );
    }

    if (!sessionId) {
      throw new Error(
        "Live session ID is required"
      );
    }

    const duplicate =
      this.liveSessions.some(
        (session) =>
          session.sessionId ===
          sessionId
      );

    if (duplicate) {
      throw new Error(
        "Live session already exists"
      );
    }

    this.liveSessions.push({
      sessionId,
      title:
        title ||
        this.name,
      scheduledStart,
      scheduledEnd,
      provider,
      joinUrl,
      status: "scheduled",
      createdBy,
    });

    this.stats.liveSessionsCount =
      this.liveSessions.length;

    await this.save();

    return this;
  };

classSchema.methods.startLiveSession =
  async function (
    sessionId
  ) {
    const session =
      this.liveSessions.find(
        (item) =>
          item.sessionId ===
          sessionId
      );

    if (!session) {
      throw new Error(
        "Live session not found"
      );
    }

    if (
      session.status === "ended"
    ) {
      throw new Error(
        "Live session has already ended"
      );
    }

    session.status = "live";
    session.actualStart =
      new Date();

    await this.save();

    return session;
  };

classSchema.methods.endLiveSession =
  async function (
    sessionId,
    recordingUrl = null
  ) {
    const session =
      this.liveSessions.find(
        (item) =>
          item.sessionId ===
          sessionId
      );

    if (!session) {
      throw new Error(
        "Live session not found"
      );
    }

    session.status = "ended";
    session.actualEnd =
      new Date();

    if (recordingUrl) {
      session.recordingUrl =
        recordingUrl;
      session.recordingAvailable =
        true;
    }

    await this.save();

    return session;
  };

/* -------------------------------------------------------------------------- */
/* SOFT DELETE                                                                */
/* -------------------------------------------------------------------------- */

classSchema.methods.softDelete =
  async function (
    byUserId = null
  ) {
    this.isDeleted = true;
    this.deletedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

classSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

export const Class =
  mongoose.models.Class ||
  mongoose.model(
    "Class",
    classSchema
  );

export {
  CLASS_STATUS,
  CLASS_MODES,
  LIVE_SESSION_STATUS,
  LIVE_PROVIDER,
};
