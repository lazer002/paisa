// server/src/controllers/crmController.js
//
// CRM module: Pipelines (stages), Leads, Deals.
// Leads convert into Deals; Deals move through the
// pipeline stages. Tenant-scoped throughout.

import {
  Lead,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
} from "../models/Lead.js";
import { escapeRegex } from "../utils/crudHelpers.js";
import { Deal } from "../models/Deal.js";
import { Pipeline } from "../models/Pipeline.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

const assertTenant = (req, row) => {
  if (
    req.user.role !== "super_admin" &&
    String(row.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbiddenDirect();
  }

  return null;
};

import ApiError from "../utils/ApiError.js";

const sendForbiddenDirect = () => {
  throw ApiError.forbidden(
    "Access denied",
    "ACCESS_DENIED"
  );
};

/* =========================================================
   LEADS
========================================================= */

// The client speaks { company, email, phone, estimatedValue };
// the Lead model stores companyName, top-level email/phone,
// a required fullName and the value as qualification.budget.max.
const LEAD_SOURCE_ALIASES = { manual: "other" };
const LEAD_PRIORITY_ALIASES = { medium: "normal" };

const leadFields = (body, current = null) => {
  const fields = {};

  for (const key of ["firstName", "lastName", "status", "notes"]) {
    if (body[key] !== undefined) fields[key] = body[key] || null;
  }

  if (body.company !== undefined) {
    fields.companyName = body.company || null;
  }

  if (body.email !== undefined) fields.email = body.email || null;
  if (body.phone !== undefined) fields.phone = body.phone || null;

  if (body.source !== undefined) {
    const source = LEAD_SOURCE_ALIASES[body.source] ?? body.source;
    fields.source = LEAD_SOURCES.includes(source) ? source : "other";
  }

  if (body.priority !== undefined) {
    const priority = LEAD_PRIORITY_ALIASES[body.priority] ?? body.priority;
    fields.priority = LEAD_PRIORITIES.includes(priority) ? priority : "normal";
  }

  if (body.estimatedValue !== undefined) {
    fields["qualification.budget.max"] =
      Math.max(Number(body.estimatedValue) || 0, 0);
  }

  const firstName = fields.firstName !== undefined ? fields.firstName : current?.firstName;
  const lastName = fields.lastName !== undefined ? fields.lastName : current?.lastName;
  const companyName = fields.companyName !== undefined ? fields.companyName : current?.companyName;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || companyName;

  if (fullName) fields.fullName = fullName;

  return fields;
};

const leadView = (lead) => {
  const json = lead.toJSON ? lead.toJSON() : lead;

  return {
    ...json,
    company: json.companyName ?? null,
    contact: { email: json.email ?? null, phone: json.phone ?? null },
    estimatedValue: json.qualification?.budget?.max ?? 0,
  };
};

export const createLead = asyncHandler(
  async (req, res) => {
    const { firstName, lastName, company } = req.body;

    if (!firstName && !lastName && !company) {
      return sendError(
        res,
        400,
        "A name or company is required"
      );
    }

    const fields = leadFields({
      source: "other",
      priority: "normal",
      ...req.body,
    });

    const { "qualification.budget.max": budgetMax, ...rest } = fields;

    const lead = await Lead.create({
      ...rest,

      ...(budgetMax !== undefined
        ? { qualification: { budget: { max: budgetMax } } }
        : {}),

      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      status: "new",
    });

    return sendCreated(res, {
      message: "Lead created",
      data: leadView(lead),
    });
  }
);

export const getLeads = asyncHandler(async (req, res) => {
  const { status, source, priority, search } =
    req.query;

  const query = scoped(req);

  if (status) query.status = status;
  if (source) query.source = source;
  if (priority) query.priority = priority;

  if (search) {
    const regex = {
      $regex: escapeRegex(search),
      $options: "i",
    };

    query.$or = [
      { fullName: regex },
      { companyName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const leads = await Lead.find(query).sort({
    createdAt: -1,
  });

  return sendSuccess(res, {
    message: "Leads fetched",
    data: leads.map(leadView),
  });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  if (!lead) {
    return sendNotFound(res, "Lead not found");
  }

  return sendSuccess(res, {
    message: "Lead fetched",
    data: leadView(lead),
  });
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    publicId: req.params.publicId,
  });

  if (!lead) {
    return sendNotFound(res, "Lead not found");
  }

  assertTenant(req, lead);

  const updated = await Lead.findOneAndUpdate(
    { publicId: req.params.publicId },
    leadFields(req.body, lead),
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    message: "Lead updated",
    data: leadView(updated),
  });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    publicId: req.params.publicId,
  });

  if (!lead) {
    return sendNotFound(res, "Lead not found");
  }

  assertTenant(req, lead);

  await lead.deleteOne();

  return sendSuccess(res, {
    message: "Lead deleted",
    data: null,
  });
});

/* =========================================================
   DEALS
========================================================= */

export const createDeal = asyncHandler(async (req, res) => {
  const {
    title,
    leadId,
    value,
    currency,
    stage,
    expectedCloseDate,
  } = req.body;

  if (!title) {
    return sendError(res, 400, "Title is required");
  }

  let resolvedLeadId = null;

  if (leadId) {
    const lead = await Lead.findOne({
      publicId: leadId,
      ...scoped(req),
    });

    if (!lead) {
      return sendNotFound(res, "Lead not found");
    }

    resolvedLeadId = lead._id;
  }

  const deal = await Deal.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    title,

    leadId: resolvedLeadId,

    value: Number(value) || 0,

    currency: currency || "INR",

    stage: stage || "qualification",

    expectedCloseDate:
      expectedCloseDate || null,

    status: "open",
  });

  return sendCreated(res, {
    message: "Deal created",
    data: deal,
  });
});

export const getDeals = asyncHandler(async (req, res) => {
  const { status, stage, pipelineId, search } =
    req.query;

  const query = scoped(req);

  if (status) query.status = status;
  if (stage) query.stage = stage;
  if (pipelineId) query.pipelineId = pipelineId;

  if (search) {
    query.title = {
      $regex: search,
      $options: "i",
    };
  }

  const deals = await Deal.find(query)
    .populate("leadId", "firstName lastName company")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Deals fetched",
    data: deals,
  });
});

export const updateDealStage = asyncHandler(
  async (req, res) => {
    const { stage, status } = req.body;

    const deal = await Deal.findOne({
      publicId: req.params.publicId,
    });

    if (!deal) {
      return sendNotFound(res, "Deal not found");
    }

    assertTenant(req, deal);

    if (stage !== undefined) {
      deal.stage = stage;
    }

    if (status !== undefined) {
      deal.status = status;
    }

    if (status === "won") {
      deal.actualCloseDate = new Date();
    }

    await deal.save();

    return sendSuccess(res, {
      message: "Deal updated",
      data: deal,
    });
  }
);

export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({
    publicId: req.params.publicId,
  });

  if (!deal) {
    return sendNotFound(res, "Deal not found");
  }

  assertTenant(req, deal);

  await deal.deleteOne();

  return sendSuccess(res, {
    message: "Deal deleted",
    data: null,
  });
});

/* =========================================================
   PIPELINES
========================================================= */

const DEFAULT_PIPELINE_STAGES = [
  { name: "Qualification" },
  { name: "Proposal" },
  { name: "Negotiation" },
  { name: "Closed Won", type: "won" },
  { name: "Closed Lost", type: "lost" },
];

const STAGE_TYPES = ["open", "won", "lost"];

// The Pipeline model requires a unique `key` and `order`
// per stage. Callers send names (strings or { name, type }),
// so keys are derived from names and order follows the
// array position.
const normalizeStages = (stages) => {
  const keys = new Set();

  return stages.map((raw, index) => {
    const stage =
      typeof raw === "string" ? { name: raw } : raw || {};

    const name = String(stage.name || "").trim();

    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/(^_|_$)/g, "") || `stage_${index + 1}`;

    let key = base;
    let suffix = 2;

    while (keys.has(key)) {
      key = `${base}_${suffix++}`;
    }

    keys.add(key);

    const type = STAGE_TYPES.includes(stage.type)
      ? stage.type
      : "open";

    return {
      name,
      key,
      order: index + 1,
      type,
      isClosed: type !== "open",
    };
  });
};

export const createPipeline = asyncHandler(
  async (req, res) => {
    const { name, stages, type } = req.body;

    if (!name) {
      return sendError(res, 400, "Name is required");
    }

    if (stages !== undefined && !Array.isArray(stages)) {
      return sendError(res, 400, "Stages must be an array");
    }

    const normalized = normalizeStages(
      stages && stages.length
        ? stages
        : DEFAULT_PIPELINE_STAGES
    );

    if (normalized.some((stage) => !stage.name)) {
      return sendError(res, 400, "Every stage needs a name");
    }

    const pipeline = await Pipeline.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      name,

      type: type || "sales",

      stages: normalized,

      defaultStageKey: normalized[0].key,

      wonStageKey:
        normalized.find((stage) => stage.type === "won")
          ?.key || null,

      lostStageKey:
        normalized.find((stage) => stage.type === "lost")
          ?.key || null,

      status: "active",
    });

    return sendCreated(res, {
      message: "Pipeline created",
      data: pipeline,
    });
  }
);

export const getPipelines = asyncHandler(
  async (req, res) => {
    const pipelines = await Pipeline.find(
      scoped(req)
    ).sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: "Pipelines fetched",
      data: pipelines,
    });
  }
);

export const deletePipeline = asyncHandler(
  async (req, res) => {
    const pipeline = await Pipeline.findOne({
      publicId: req.params.publicId,
    });

    if (!pipeline) {
      return sendNotFound(
        res,
        "Pipeline not found"
      );
    }

    assertTenant(req, pipeline);

    await pipeline.deleteOne();

    return sendSuccess(res, {
      message: "Pipeline deleted",
      data: null,
    });
  }
);
