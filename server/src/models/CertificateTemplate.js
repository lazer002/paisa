// server/src/models/CertificateTemplate.js
//
// An organization's certificate design: wording, signatory, accent colour and
// style. Issuing a certificate copies the design into
// Certificate.template.configuration, so later edits never change certificates
// already issued.

import mongoose from "mongoose";
import crypto from "node:crypto";

export const CERTIFICATE_STYLES = ["classic", "modern"];

const certificateTemplateSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `ctpl_${crypto.randomBytes(16).toString("base64url")}`,
    },

    name: { type: String, required: true, trim: true, maxlength: 120 },

    heading: { type: String, trim: true, maxlength: 120, default: "Certificate" },
    intro: { type: String, trim: true, maxlength: 200, default: "This is to certify that" },
    awardLine: { type: String, trim: true, maxlength: 200, default: "has been awarded" },
    footerNote: { type: String, trim: true, maxlength: 300, default: null },

    signatoryName: { type: String, trim: true, maxlength: 120, default: null },
    signatoryTitle: { type: String, trim: true, maxlength: 120, default: null },

    accentColor: {
      type: String,
      trim: true,
      match: /^#[0-9a-fA-F]{6}$/,
      default: "#1e3a5f",
    },

    style: { type: String, enum: CERTIFICATE_STYLES, default: "classic" },

    // The organization's template used when none is picked.
    isDefault: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

certificateTemplateSchema.index({ instituteId: 1, name: 1 }, { unique: true });

/** The design fields copied onto an issued certificate. */
export const designOf = (template) => ({
  heading: template.heading,
  intro: template.intro,
  awardLine: template.awardLine,
  footerNote: template.footerNote,
  signatoryName: template.signatoryName,
  signatoryTitle: template.signatoryTitle,
  accentColor: template.accentColor,
  style: template.style,
});

export const CertificateTemplate =
  mongoose.models.CertificateTemplate ||
  mongoose.model("CertificateTemplate", certificateTemplateSchema);

export default CertificateTemplate;
