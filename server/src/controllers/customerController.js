// server/src/controllers/customerController.js
//
// CRM customers: accounts that were converted from leads / admissions.
// Tenant-scoped, soft-deleted, whitelisted fields only.

import { Customer } from "../models/Customer.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from "../utils/response.js";

import {
  pickFields,
  tenantScope,
  escapeRegex,
  requireInstitute,
} from "../utils/crudHelpers.js";

const WRITABLE = [
  "type",
  "status",
  "lifecycleStage",
  "firstName",
  "lastName",
  "displayName",
  "source",
  "customerSegment",
  "customerTier",
  "industry",
  "notes",
  "internalNotes",
  "tags",
  "doNotContact",
];

// Nested contact channels are written through dotted paths so a
// partial update never wipes the other channels.
const COMMUNICATION = {
  email: "communication.primaryEmail",
  phone: "communication.primaryPhone",
};

const buildData = (body) => {
  const data = pickFields(body, WRITABLE);

  for (const [field, path] of Object.entries(COMMUNICATION)) {
    if (body?.[field] !== undefined) {
      data[path] = body[field] === "" ? null : body[field];
    }
  }

  if (!data.displayName && (data.firstName || data.lastName)) {
    data.displayName = [data.firstName, data.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return data;
};

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({
    ...buildData(req.body),
    instituteId: requireInstitute(req),
    createdBy: req.user._id,
  });

  return sendCreated(res, {
    message: "Customer created",
    data: customer,
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;

  const query = tenantScope(req);

  if (type) query.type = String(type);
  if (status) query.status = String(status);

  if (search) {
    const pattern = {
      $regex: escapeRegex(search),
      $options: "i",
    };

    query.$or = [
      { displayName: pattern },
      { "communication.primaryEmail": pattern },
      { "communication.primaryPhone": pattern },
    ];
  }

  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .limit(200);

  return sendSuccess(res, {
    message: "Customers fetched",
    data: customers,
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!customer) {
    return sendNotFound(res, "Customer not found");
  }

  customer.set({
    ...buildData(req.body),
    updatedBy: req.user._id,
    lastModifiedBy: req.user._id,
  });

  await customer.save();

  return sendSuccess(res, {
    message: "Customer updated",
    data: customer,
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!customer) {
    return sendNotFound(res, "Customer not found");
  }

  customer.isDeleted = true;
  customer.deletedAt = new Date();
  customer.deletedBy = req.user._id;
  await customer.save();

  return sendSuccess(res, { message: "Customer deleted" });
});
