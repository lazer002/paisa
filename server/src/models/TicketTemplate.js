// server/src/models/TicketTemplate.js
//
// Canned responses ("reply templates") for support staff.
// One list per organization; inserted into the ticket reply box.

import mongoose from "mongoose";

import crypto from "node:crypto";

const ticketTemplateSchema = new mongoose.Schema(
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
      index: true,
      default: () =>
        `ttp_${crypto.randomBytes(16).toString("base64url")}`,
    },

    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 120,
      required: true,
    },

    body: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 5000,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ticketTemplateSchema.index(
  { instituteId: 1, name: 1 },
  { unique: true, name: "tenant_ticket_template_name" }
);

export const TicketTemplate =
  mongoose.models.TicketTemplate ||
  mongoose.model("TicketTemplate", ticketTemplateSchema);

export default TicketTemplate;
