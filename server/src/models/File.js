// server/src/models/File.js
//
// One stored upload. The bytes live in the storage provider under
// `storageKey`; this record holds who uploaded it, what it is for and which
// record it belongs to. Downloads go through GET /api/files/:id/download,
// which authorizes against the linked record (see fileController.js).

import mongoose from "mongoose";
import crypto from "node:crypto";

import env from "../config/env.js";

export const FILE_PURPOSES = Object.freeze([
  "employee_document",
  "study_material",
  "submission",
  "avatar",
  "chat_attachment",
]);

export const FILE_LINK_KINDS = Object.freeze([
  "employee_document",
  "study_material",
  "submission",
  "user",
  "message",
]);

/**
 * private   – only the uploader (and org admins) until it is linked
 * linked    – whoever may see the linked record
 * institute – anyone signed in to the same organization (avatars)
 */
export const FILE_VISIBILITIES = Object.freeze([
  "private",
  "linked",
  "institute",
]);

const fileSchema = new mongoose.Schema(
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
      default: () => `file_${crypto.randomBytes(16).toString("base64url")}`,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Sanitized client name; display / Content-Disposition only. */
    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
      required: true,
    },

    storageProvider: {
      type: String,
      enum: ["local", "s3"],
      required: true,
      immutable: true,
    },

    storageKey: {
      type: String,
      required: true,
      immutable: true,
      maxlength: 300,
    },

    mimeType: {
      type: String,
      trim: true,
      maxlength: 150,
      required: true,
    },

    extension: {
      type: String,
      trim: true,
      maxlength: 10,
      required: true,
    },

    size: {
      type: Number,
      min: 0,
      required: true,
    },

    checksum: {
      type: String,
      maxlength: 128,
      default: null,
    },

    purpose: {
      type: String,
      enum: FILE_PURPOSES,
      required: true,
      index: true,
    },

    linkedResource: {
      kind: {
        type: String,
        enum: [...FILE_LINK_KINDS, null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    visibility: {
      type: String,
      enum: FILE_VISIBILITIES,
      default: "private",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        // Storage layout is internal.
        delete ret.storageKey;
        return ret;
      },
    },
  }
);

fileSchema.index(
  { instituteId: 1, "linkedResource.kind": 1, "linkedResource.id": 1 },
  { name: "file_linked_resource" }
);

fileSchema.index(
  { instituteId: 1, uploadedBy: 1, createdAt: -1 },
  { name: "file_uploader" }
);

/** Download path the client uses for a stored file. */
export const fileDownloadPath = (publicId) =>
  `${env.API_PREFIX || "/api"}/files/${publicId}/download`;

export const File =
  mongoose.models.File || mongoose.model("File", fileSchema);

export default File;
