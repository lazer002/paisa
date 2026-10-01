// server/src/routes/hrOpsRoutes.js

import express from "express";

import {
  createSalaryStructure,
  getSalaryStructures,
  updateSalaryStructure,
  deleteSalaryStructure,
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  createCertificate,
  getCertificates,
  revokeCertificate,
  deleteCertificate,
} from "../controllers/hrOpsController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// SALARY STRUCTURES
// ─────────────────────────────────────────────

const salaryRouter = express.Router();

salaryRouter.use(authenticate);

salaryRouter.get(
  "/",
  authorize({
    anyPermissions: ["salary_structure:read"],
  }),
  getSalaryStructures
);

salaryRouter.post(
  "/",
  authorize({
    anyPermissions: ["salary_structure:create"],
  }),
  createSalaryStructure
);

salaryRouter.put(
  "/:publicId",
  authorize({
    anyPermissions: ["salary_structure:update"],
  }),
  updateSalaryStructure
);

salaryRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["salary_structure:delete"],
  }),
  deleteSalaryStructure
);

// ─────────────────────────────────────────────
// PERFORMANCE REVIEWS
// ─────────────────────────────────────────────

const reviewRouter = express.Router();

reviewRouter.use(authenticate);

reviewRouter.get(
  "/",
  authorize({
    anyPermissions: ["performance:read"],
  }),
  getReviews
);

reviewRouter.post(
  "/",
  authorize({
    anyPermissions: ["performance:create"],
  }),
  createReview
);

reviewRouter.put(
  "/:publicId",
  authorize({
    anyPermissions: ["performance:update"],
  }),
  updateReview
);

reviewRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["performance:delete"],
  }),
  deleteReview
);

// ─────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────

const certificateRouter = express.Router();

certificateRouter.use(authenticate);

certificateRouter.get(
  "/",
  authorize({
    anyPermissions: ["certificate:read"],
  }),
  getCertificates
);

certificateRouter.post(
  "/",
  authorize({
    anyPermissions: ["certificate:create"],
  }),
  createCertificate
);

certificateRouter.put(
  "/:publicId/revoke",
  authorize({
    anyPermissions: ["certificate:update", "certificate:manage"],
  }),
  revokeCertificate
);

certificateRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["certificate:delete"],
  }),
  deleteCertificate
);

export {
  salaryRouter,
  reviewRouter,
  certificateRouter,
};
