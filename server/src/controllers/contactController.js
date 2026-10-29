// server/src/controllers/contactController.js
//
// CRM contacts: people the institute talks to (parents, partners,
// vendors...). Tenant-scoped, soft-deleted, whitelisted fields only.

import { Contact } from "../models/Contact.js";

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
  "source",
  "firstName",
  "lastName",
  "fullName",
  "displayName",
  "companyName",
  "designation",
  "email",
  "phone",
  "alternatePhone",
  "whatsappNumber",
  "preferredContactMethod",
  "description",
  "internalNotes",
  "tags",
  "doNotContact",
];

export const createContact = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, WRITABLE);

  data.fullName =
    data.fullName ||
    [data.firstName, data.lastName].filter(Boolean).join(" ");

  const contact = await Contact.create({
    ...data,
    instituteId: requireInstitute(req),
    createdBy: req.user._id,
  });

  return sendCreated(res, {
    message: "Contact created",
    data: contact,
  });
});

export const getContacts = asyncHandler(async (req, res) => {
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
      { fullName: pattern },
      { email: pattern },
      { phone: pattern },
      { companyName: pattern },
    ];
  }

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .limit(200);

  return sendSuccess(res, {
    message: "Contacts fetched",
    data: contacts,
  });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!contact) {
    return sendNotFound(res, "Contact not found");
  }

  Object.assign(contact, pickFields(req.body, WRITABLE), {
    updatedBy: req.user._id,
  });

  await contact.save();

  return sendSuccess(res, {
    message: "Contact updated",
    data: contact,
  });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!contact) {
    return sendNotFound(res, "Contact not found");
  }

  contact.isDeleted = true;
  contact.deletedAt = new Date();
  await contact.save();

  return sendSuccess(res, { message: "Contact deleted" });
});
