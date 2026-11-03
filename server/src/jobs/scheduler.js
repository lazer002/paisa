// server/src/jobs/scheduler.js
//
// In-process scheduler for the jobs in JOBS. Every minute it starts each job
// whose interval has passed. A JobRun row per job is the lock (so several API
// processes never run the same job at once) and the record of the last run.
// JOBS_ENABLED=false turns scheduling off; manual runs still work.

import { JobRun } from "../models/JobRun.js";
import logger from "../config/logger.js";
import { invoiceOverdue, subscriptionExpiry } from "./billing.js";
import { assignmentDueReminders, liveSessionReminders, ticketSlaBreaches, leadRescoring } from "./reminders.js";
import { abandonedUploadCleanup, expiredSessionCleanup, leaveBalanceSync } from "./maintenance.js";

export const JOBS = [
  invoiceOverdue,
  subscriptionExpiry,
  assignmentDueReminders,
  liveSessionReminders,
  ticketSlaBreaches,
  leadRescoring,
  abandonedUploadCleanup,
  expiredSessionCleanup,
  leaveBalanceSync,
];

const TICK_MS = 60 * 1000;
const FIRST_TICK_MS = 15 * 1000;
const LOCK_MS = 10 * 60 * 1000;

let timer = null;
let ticking = false;

export const findJob = (name) => JOBS.find((job) => job.name === name) ?? null;

/**
 * Whether a job is due: never ran, its interval has passed, or its last run
 * died without finishing (still "running" with an expired lock).
 */
export const isDue = (job, state, now = new Date()) =>
  !state?.lastStartedAt ||
  (state.lastStatus === "running" &&
    (!state.lockedUntil || new Date(state.lockedUntil) < now)) ||
  now.getTime() - new Date(state.lastStartedAt).getTime() >= job.everyMinutes * 60 * 1000;

/**
 * Run one job if its lock is free. Returns the JobRun row afterwards, or
 * null when another process holds the lock.
 */
export const runJob = async (job, { trigger = "schedule", now = new Date() } = {}) => {
  try {
    await JobRun.updateOne({ name: job.name }, { $setOnInsert: { name: job.name } }, { upsert: true });
  } catch (error) {
    // Another process created the row at the same moment.
    if (error?.code !== 11000) throw error;
  }

  const locked = await JobRun.findOneAndUpdate(
    {
      name: job.name,
      $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
    },
    {
      $set: {
        lockedUntil: new Date(now.getTime() + LOCK_MS),
        lastStartedAt: now,
        lastStatus: "running",
        lastTrigger: trigger,
      },
    },
    { new: true }
  );

  if (!locked) return null;

  const started = Date.now();

  try {
    const result = await job.run(now);

    return await JobRun.findOneAndUpdate(
      { name: job.name },
      {
        $set: {
          lockedUntil: null,
          lastFinishedAt: new Date(),
          lastStatus: "success",
          lastError: null,
          lastDurationMs: Date.now() - started,
          lastResult: result ?? null,
        },
        $inc: { runCount: 1 },
      },
      { new: true }
    );
  } catch (error) {
    logger.error("Scheduled job failed", { job: job.name, error: error.message });

    return await JobRun.findOneAndUpdate(
      { name: job.name },
      {
        $set: {
          lockedUntil: null,
          lastFinishedAt: new Date(),
          lastStatus: "failed",
          lastError: String(error.message).slice(0, 2000),
          lastDurationMs: Date.now() - started,
        },
        $inc: { runCount: 1, failCount: 1 },
      },
      { new: true }
    );
  }
};

const tick = async () => {
  if (ticking) return;
  ticking = true;

  try {
    const now = new Date();
    const states = new Map(
      (await JobRun.find({ name: { $in: JOBS.map((j) => j.name) } }).lean()).map((s) => [s.name, s])
    );

    for (const job of JOBS) {
      if (isDue(job, states.get(job.name), now)) {
        await runJob(job, { trigger: "schedule", now });
      }
    }
  } catch (error) {
    logger.error("Scheduler tick failed", { error: error.message });
  } finally {
    ticking = false;
  }
};

export const startScheduler = () => {
  if (timer || process.env.JOBS_ENABLED === "false") return;

  logger.info("Scheduled jobs started", { jobs: JOBS.map((j) => j.name) });

  setTimeout(() => void tick(), FIRST_TICK_MS).unref();
  timer = setInterval(() => void tick(), TICK_MS);
  timer.unref();
};

export const stopScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

/** Jobs with their latest run, for the admin page. */
export const listJobs = async () => {
  const states = new Map((await JobRun.find().lean()).map((s) => [s.name, s]));

  return JOBS.map((job) => {
    const state = states.get(job.name);
    const running = Boolean(state?.lockedUntil && new Date(state.lockedUntil) > new Date());

    // A run whose process died (restart, crash) keeps "running" until its lock expires.
    const lastStatus =
      state?.lastStatus === "running" && !running ? "interrupted" : state?.lastStatus ?? "never";

    return {
      name: job.name,
      description: job.description,
      everyMinutes: job.everyMinutes,
      lastStatus,
      lastStartedAt: state?.lastStartedAt ?? null,
      lastFinishedAt: state?.lastFinishedAt ?? null,
      lastDurationMs: state?.lastDurationMs ?? null,
      lastResult: state?.lastResult ?? null,
      lastError: state?.lastError ?? null,
      lastTrigger: state?.lastTrigger ?? null,
      runCount: state?.runCount ?? 0,
      failCount: state?.failCount ?? 0,
      nextRunAt: state?.lastStartedAt
        ? new Date(new Date(state.lastStartedAt).getTime() + job.everyMinutes * 60 * 1000)
        : null,
      running,
    };
  });
};
