// server/src/controllers/certificateTemplateController.js
//
// Certificate designs per organization (see models/CertificateTemplate.js).
// Read: certificate:read. Write: certificate:create (issuers design their own
// certificates). Always scoped to the caller's organization.

import { CertificateTemplate } from "../models/CertificateTemplate.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

const FIELDS = [
  "name",
  "heading",
  "intro",
  "awardLine",
  "footerNote",
  "signatoryName",
  "signatoryTitle",
  "accentColor",
  "style",
  "isDefault",
];

const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f] === "" ? null : body[f]]));

const requireOrg = (req) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest("Templates belong to an organization", "ORGANIZATION_REQUIRED");
  }
  return req.user.instituteId;
};

/** Only one default per organization. */
const clearOtherDefaults = (instituteId, keepId) =>
  CertificateTemplate.updateMany({ instituteId, _id: { $ne: keepId }, isDefault: true }, { $set: { isDefault: false } });

const duplicateName = (error) =>
  error?.code === 11000 ? ApiError.conflict("A template with that name already exists", "TEMPLATE_NAME_TAKEN") : error;

export const getCertificateTemplates = asyncHandler(async (req, res) => {
  const templates = await CertificateTemplate.find({ instituteId: requireOrg(req) }).sort({ isDefault: -1, name: 1 });

  return sendSuccess(res, { message: "Certificate templates", data: templates });
});

export const createCertificateTemplate = asyncHandler(async (req, res) => {
  const instituteId = requireOrg(req);

  try {
    const template = await CertificateTemplate.create({ ...pick(req.body), instituteId, createdBy: req.user._id });
    if (template.isDefault) await clearOtherDefaults(instituteId, template._id);

    return sendCreated(res, { message: "Template created", data: template });
  } catch (error) {
    throw duplicateName(error);
  }
});

export const updateCertificateTemplate = asyncHandler(async (req, res) => {
  const instituteId = requireOrg(req);
  const template = await CertificateTemplate.findOne({ publicId: req.params.publicId, instituteId });

  if (!template) throw ApiError.notFound("Template not found", "TEMPLATE_NOT_FOUND");

  Object.assign(template, pick(req.body));

  try {
    await template.save();
  } catch (error) {
    throw duplicateName(error);
  }

  if (template.isDefault) await clearOtherDefaults(instituteId, template._id);

  return sendSuccess(res, { message: "Template updated", data: template });
});

export const deleteCertificateTemplate = asyncHandler(async (req, res) => {
  const result = await CertificateTemplate.deleteOne({ publicId: req.params.publicId, instituteId: requireOrg(req) });

  if (!result.deletedCount) throw ApiError.notFound("Template not found", "TEMPLATE_NOT_FOUND");

  // Issued certificates keep their copied design.
  return sendSuccess(res, { message: "Template deleted", data: null });
});
