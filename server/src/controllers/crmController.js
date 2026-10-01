// server/src/controllers/crmController.js
//
// CRM module: Pipelines (stages), Leads, Deals.
// Leads convert into Deals; Deals move through the
// pipeline stages. Tenant-scoped throughout.

import { Lead } from "../models/Lead.js";
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

export const createLead = asyncHandler(
  async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      source,
      priority,
      estimatedValue,
      notes,
    } = req.body;

    if (!firstName && !lastName && !company) {
      return sendError(
        res,
        400,
        "A name or company is required"
      );
    }

    const lead = await Lead.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      firstName: firstName || null,
      lastName: lastName || null,
      company: company || null,

      contact: {
        email: email || null,
        phone: phone || null,
      },

      source: source || "manual",
      priority: priority || "medium",

      estimatedValue:
        Number(estimatedValue) || 0,

      notes: notes || null,

      status: "new",
    });

    return sendCreated(res, {
      message: "Lead created",
      data: lead,
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
      $regex: search,
      $options: "i",
    };

    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { company: regex },
    ];
  }

  const leads = await Lead.find(query).sort({
    createdAt: -1,
  });

  return sendSuccess(res, {
    message: "Leads fetched",
    data: leads,
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
    data: lead,
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

  const allowed = [
    "firstName",
    "lastName",
    "company",
    "source",
    "priority",
    "status",
    "estimatedValue",
    "notes",
  ];

  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.body.email !== undefined) {
    updates["contact.email"] = req.body.email;
  }

  if (req.body.phone !== undefined) {
    updates["contact.phone"] = req.body.phone;
  }

  const updated = await Lead.findOneAndUpdate(
    { publicId: req.params.publicId },
    updates,
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    message: "Lead updated",
    data: updated,
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

export const createPipeline = asyncHandler(
  async (req, res) => {
    const { name, stages, type } = req.body;

    if (!name) {
      return sendError(res, 400, "Name is required");
    }

    const pipeline = await Pipeline.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      name,

      type: type || "sales",

      stages: stages || [
        { name: "Qualification", order: 1 },
        { name: "Proposal", order: 2 },
        { name: "Negotiation", order: 3 },
        { name: "Closed Won", order: 4 },
        { name: "Closed Lost", order: 5 },
      ],

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
