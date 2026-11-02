// server/src/models/JobRun.js
//
// One row per scheduled job (jobs/registry.js): the cross-process lock and
// the outcome of the latest run. Platform-level, so no instituteId.

import mongoose from "mongoose";

const jobRunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    // A run holds the lock until it finishes or this time passes.
    lockedUntil: { type: Date, default: null },

    lastStartedAt: { type: Date, default: null },
    lastFinishedAt: { type: Date, default: null },
    lastStatus: {
      type: String,
      enum: ["never", "running", "success", "failed"],
      default: "never",
    },
    lastError: { type: String, maxlength: 2000, default: null },
    lastDurationMs: { type: Number, default: null },
    // What the run did, e.g. { markedOverdue: 3, notified: 5 }.
    lastResult: { type: mongoose.Schema.Types.Mixed, default: null },
    lastTrigger: { type: String, enum: ["schedule", "manual", null], default: null },

    runCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const JobRun =
  mongoose.models.JobRun || mongoose.model("JobRun", jobRunSchema);

export default JobRun;
