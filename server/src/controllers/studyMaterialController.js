// src/controllers/studyMaterialController.js

import { StudyMaterial } from "../models/StudyMaterial.js";
import { Class } from "../models/Class.js";

import { asyncHandler } from "../utils/errorHandler.js";
import { resolveRef } from "../utils/resolveRef.js";
import { visibleClassIdsFor } from "../utils/parentScope.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const VISIBILITIES = [
  "class_only",
  "institute",
  "public",
];

// Tenant filter for every non-super_admin query.
const tenantScope = (req) =>
  req.user.role === "super_admin"
    ? {}
    : { instituteId: req.user.instituteId };

// Clients send class publicIds; ObjectIds are still accepted.
const resolveClassId = (req, reference) =>
  resolveRef(Class, reference, {
    label: "Class",
    scope: tenantScope(req),
  });

// A material tied to a class is class-only unless the caller says
// otherwise; one without a class can only be institute-wide (or public).
const pickVisibility = (
  requested,
  classId
) => {
  if (requested === undefined) {
    return classId
      ? "class_only"
      : "institute";
  }

  if (!VISIBILITIES.includes(requested)) {
    return { error: "Invalid visibility" };
  }

  if (
    requested === "class_only" &&
    !classId
  ) {
    return {
      error:
        "A class is required for class-only materials",
    };
  }

  return requested;
};

export const createStudyMaterial = asyncHandler(
  async (req, res) => {
    const {
      title,
      description,
      classId,
      subject,
      type,
      url,
      fileSize,
      visibility,
    } = req.body;

    if (!title || !url) {
      return sendError(
        res,
        400,
        "Title and URL are required"
      );
    }

    const resolvedClassId =
      await resolveClassId(
        req,
        classId
      );

    const resolvedVisibility =
      pickVisibility(
        visibility,
        resolvedClassId
      );

    if (resolvedVisibility?.error) {
      return sendError(
        res,
        400,
        resolvedVisibility.error
      );
    }

    const material =
      await StudyMaterial.create({
        instituteId:
          req.user.instituteId,

        classId:
          resolvedClassId,

        visibility:
          resolvedVisibility,

        uploadedBy:
          req.user._id,

        title,
        description,
        subject,

        type:
          type || "other",

        url,
        fileSize,
      });

    sendCreated(
      res,
      "Study material uploaded",
      material
    );
  }
);

export const getStudyMaterials = asyncHandler(
  async (req, res) => {
    const query = {};

    if (
      req.user.role !==
      "super_admin"
    ) {
      query.instituteId =
        req.user.instituteId;
    }

    // Teacher sees only materials
    // they uploaded
    if (
      req.user.role ===
      "teacher"
    ) {
      query.uploadedBy =
        req.user._id;
    }

    // Students and parents see institute-wide/public materials plus
    // class-only materials of the classes they (or their children) are in.
    const visibleClasses =
      await visibleClassIdsFor(req.user);

    if (visibleClasses) {
      query.$or = [
        { visibility: { $in: ["institute", "public"] } },
        { visibility: "class_only", classId: { $in: visibleClasses } },
      ];
    }

    if (req.query.classId) {
      query.classId =
        await resolveClassId(
          req,
          req.query.classId
        );
    }

    if (req.query.subject) {
      query.subject = {
        $regex:
          req.query.subject,
        $options: "i",
      };
    }

    if (req.query.type) {
      query.type =
        req.query.type;
    }

    const materials =
      await StudyMaterial.find(
        query
      )
        .populate(
          "uploadedBy",
          "name"
        )
        .populate(
          "classId",
          "publicId name subject"
        )
        .sort({
          createdAt: -1,
        });

    sendSuccess(
      res,
      "Study materials fetched",
      materials
    );
  }
);

export const updateStudyMaterial =
  asyncHandler(async (req, res) => {
    const material =
      await StudyMaterial.findOne({
        publicId:
          req.params.publicId,
      });

    if (!material) {
      return sendNotFound(
        res,
        "Material not found"
      );
    }

    if (
      req.user.role !==
        "super_admin" &&
      String(
        material.instituteId
      ) !==
        String(
          req.user.instituteId
        )
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (
      req.user.role ===
        "teacher" &&
      String(
        material.uploadedBy
      ) !==
        String(
          req.user._id
        )
    ) {
      return sendForbidden(
        res,
        "You can only edit your own materials"
      );
    }

    const allowedFields = [
      "title",
      "description",
      "subject",
      "type",
      "url",
      "fileSize",
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    // Class and visibility move together: the model's
    // class-only rule runs on save, not on findOneAndUpdate.
    if (
      req.body.classId !== undefined ||
      req.body.visibility !== undefined
    ) {
      const nextClassId =
        req.body.classId !== undefined
          ? await resolveClassId(
              req,
              req.body.classId
            )
          : material.classId;

      const nextVisibility =
        pickVisibility(
          req.body.visibility,
          nextClassId
        );

      if (nextVisibility?.error) {
        return sendError(
          res,
          400,
          nextVisibility.error
        );
      }

      updates.classId =
        nextClassId || null;

      updates.visibility =
        nextVisibility;
    }

    updates.updatedBy =
      req.user._id;

    const updated =
      await StudyMaterial.findOneAndUpdate(
        {
          publicId:
            req.params.publicId,
        },
        updates,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "uploadedBy",
          "name"
        )
        .populate(
          "classId",
          "publicId name subject"
        );

    sendSuccess(
      res,
      "Material updated",
      updated
    );
  });

export const deleteStudyMaterial =
  asyncHandler(async (req, res) => {
    const material =
      await StudyMaterial.findOne({
        publicId:
          req.params.publicId,
      });

    if (!material) {
      return sendNotFound(
        res,
        "Material not found"
      );
    }

    if (
      req.user.role !==
        "super_admin" &&
      String(
        material.instituteId
      ) !==
        String(
          req.user.instituteId
        )
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (
      req.user.role ===
        "teacher" &&
      String(
        material.uploadedBy
      ) !==
        String(
          req.user._id
        )
    ) {
      return sendForbidden(
        res,
        "You can only delete your own materials"
      );
    }

    await StudyMaterial.deleteOne({
      publicId:
        req.params.publicId,
    });

    sendSuccess(
      res,
      "Material deleted"
    );
  });