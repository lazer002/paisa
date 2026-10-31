// server/src/controllers/publicController.js
//
// Unauthenticated endpoints. Responses carry only data that is
// already printed on the public document: no emails, no ids.

import { Certificate } from "../models/Certificate.js";
import Organization from "../models/organization.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendNotFound,
} from "../utils/response.js";

// Codes look like "7F3A-91C2-0B5D-E8A4"; accept any case and
// spacing, reject anything else before touching the database.
const normalizeCode = (raw) =>
  String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const CODE_PATTERN = /^[A-Z0-9-]{8,40}$/;

const publicStatus = (certificate) => {
  if (
    certificate.status === "revoked" ||
    certificate.verification?.status === "revoked"
  ) {
    return "revoked";
  }

  if (certificate.status !== "issued") {
    return "invalid";
  }

  if (
    certificate.validUntil &&
    new Date(certificate.validUntil) < new Date()
  ) {
    return "expired";
  }

  return "valid";
};

export const verifyCertificate = asyncHandler(async (req, res) => {
  const code = normalizeCode(req.params.code);

  if (!CODE_PATTERN.test(code)) {
    return sendNotFound(res, "Certificate not found");
  }

  const certificate = await Certificate.findOne({
    "verification.verificationCode": code,
    isDeleted: { $ne: true },
  })
    .select(
      "instituteId title type status issueDate validUntil revokedAt certificateNumber recipientSnapshot.name issuer.organizationName verification.status"
    )
    .lean();

  if (!certificate) {
    return sendNotFound(res, "Certificate not found");
  }

  let organizationName = certificate.issuer?.organizationName ?? null;

  if (!organizationName) {
    const org = await Organization.findById(certificate.instituteId)
      .select("name")
      .lean();
    organizationName = org?.name ?? null;
  }

  // Best-effort counter; never blocks the answer.
  Certificate.updateOne(
    { _id: certificate._id },
    {
      $inc: { "verification.verificationCount": 1 },
      $set: { "verification.lastVerifiedAt": new Date() },
    }
  ).catch(() => {});

  const status = publicStatus(certificate);

  return sendSuccess(res, {
    message: "Certificate found",
    data: {
      code,
      status,
      valid: status === "valid",
      holderName: certificate.recipientSnapshot?.name ?? null,
      title: certificate.title,
      type: certificate.type ?? null,
      organizationName,
      certificateNumber: certificate.certificateNumber ?? null,
      issueDate: certificate.issueDate ?? null,
      validUntil: certificate.validUntil ?? null,
      revokedAt: status === "revoked" ? certificate.revokedAt ?? null : null,
    },
  });
});
