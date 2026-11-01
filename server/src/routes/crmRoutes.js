// server/src/routes/crmRoutes.js

import express from "express";

import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  createDeal,
  getDeals,
  updateDealStage,
  deleteDeal,
  createPipeline,
  getPipelines,
  deletePipeline,
} from "../controllers/crmController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";
import {
  leadSchema,
  createDealSchema,
  updateDealStageSchema,
  createPipelineSchema,
} from "../validators/crmValidator.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────

const leadRouter = express.Router();

leadRouter.use(authenticate);

leadRouter.get(
  "/",
  authorize({ anyPermissions: ["lead:read"] }),
  getLeads
);

leadRouter.get(
  "/:publicId",
  authorize({ anyPermissions: ["lead:read"] }),
  getLead
);

leadRouter.post(
  "/",
  authorize({ anyPermissions: ["lead:create"] }),
  body(leadSchema),
  createLead
);

leadRouter.put(
  "/:publicId",
  authorize({ anyPermissions: ["lead:update"] }),
  body(leadSchema),
  updateLead
);

leadRouter.delete(
  "/:publicId",
  authorize({ anyPermissions: ["lead:delete"] }),
  deleteLead
);

// ─────────────────────────────────────────────
// DEALS
// ─────────────────────────────────────────────

const dealRouter = express.Router();

dealRouter.use(authenticate);

dealRouter.get(
  "/",
  authorize({ anyPermissions: ["deal:read"] }),
  getDeals
);

dealRouter.post(
  "/",
  authorize({ anyPermissions: ["deal:create"] }),
  body(createDealSchema),
  createDeal
);

dealRouter.put(
  "/:publicId/stage",
  authorize({ anyPermissions: ["deal:update"] }),
  body(updateDealStageSchema),
  updateDealStage
);

dealRouter.delete(
  "/:publicId",
  authorize({ anyPermissions: ["deal:delete"] }),
  deleteDeal
);

// ─────────────────────────────────────────────
// PIPELINES
// ─────────────────────────────────────────────

const pipelineRouter = express.Router();

pipelineRouter.use(authenticate);

pipelineRouter.get(
  "/",
  authorize({ anyPermissions: ["pipeline:read"] }),
  getPipelines
);

pipelineRouter.post(
  "/",
  authorize({ anyPermissions: ["pipeline:create"] }),
  body(createPipelineSchema),
  createPipeline
);

pipelineRouter.delete(
  "/:publicId",
  authorize({ anyPermissions: ["pipeline:delete"] }),
  deletePipeline
);

export { leadRouter, dealRouter, pipelineRouter };

export default router;
