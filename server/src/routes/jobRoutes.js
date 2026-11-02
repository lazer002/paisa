// server/src/routes/jobRoutes.js
//
// Platform scheduled jobs: list their latest runs and run one now.
// system_job:manage is held by no role, so only super_admin passes.

import express from "express";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { findJob, listJobs, runJob } from "../jobs/scheduler.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/response.js";

const router = express.Router();

router.use(authenticate, authorize({ anyPermissions: ["system_job:manage"] }));

router.get(
  "/",
  asyncHandler(async (req, res) =>
    sendSuccess(res, { message: "Scheduled jobs", data: await listJobs() })
  )
);

// Audited by the global hook in routes/index.js.
router.post(
  "/:name/run",
  asyncHandler(async (req, res) => {
    const job = findJob(req.params.name);

    if (!job) {
      throw ApiError.notFound("No such job", "JOB_NOT_FOUND");
    }

    const run = await runJob(job, { trigger: "manual" });

    if (!run) {
      throw ApiError.conflict("That job is already running", "JOB_RUNNING");
    }

    return sendSuccess(res, {
      message: run.lastStatus === "success" ? `${job.name} finished` : `${job.name} failed: ${run.lastError}`,
      data: (await listJobs()).find((j) => j.name === job.name),
    });
  })
);

export default router;
