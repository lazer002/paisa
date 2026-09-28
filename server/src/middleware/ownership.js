// server/src/middleware/ownership.js

import mongoose from "mongoose";

import crypto from "node:crypto";import { AppError } from "../utils/errorHandler.js";
import { Roles } from "../models/User.js";

const checkOwnership = (Model, options = {}) => {
  const {
    ownerField = "owner",
    parentModel = null,
    parentField = null,
    parentOwnerField = "owner",
    allowMissingOwner = false,
  } = options;

  if (!Model || typeof Model.findById !== "function") {
    throw new TypeError(
      "checkOwnership requires a valid Mongoose model"
    );
  }

  if (parentModel && typeof parentModel.findById !== "function") {
    throw new TypeError(
      "parentModel must be a valid Mongoose model"
    );
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          401,
          "UNAUTHORIZED"
        );
      }

      if (req.user.role === Roles.SUPER_ADMIN) {
        return next();
      }

      const resourceId = req.params?.id;

      if (!resourceId) {
        throw new AppError(
          "Resource ID is required",
          400,
          "ID_REQUIRED"
        );
      }

      if (!mongoose.isValidObjectId(resourceId)) {
        throw new AppError(
          "Invalid resource ID",
          400,
          "INVALID_ID"
        );
      }

      const fields = [ownerField];

      if (parentField) {
        fields.push(parentField);
      }

      const document = await Model.findById(resourceId)
        .select(fields.join(" "))
        .lean();

      if (!document) {
        throw new AppError(
          "Resource not found",
          404,
          "NOT_FOUND"
        );
      }

      let ownerId = document[ownerField];

      if (
        !ownerId &&
        parentModel &&
        parentField
      ) {
        const parentId = document[parentField];

        if (!parentId) {
          if (!allowMissingOwner) {
            throw new AppError(
              "Resource ownership could not be determined",
              403,
              "OWNERSHIP_NOT_FOUND"
            );
          }
        } else {
          if (!mongoose.isValidObjectId(parentId)) {
            throw new AppError(
              "Invalid parent resource ID",
              400,
              "INVALID_PARENT_ID"
            );
          }

          const parent = await parentModel
            .findById(parentId)
            .select(parentOwnerField)
            .lean();

          if (!parent) {
            throw new AppError(
              "Parent resource not found",
              404,
              "PARENT_NOT_FOUND"
            );
          }

          ownerId = parent[parentOwnerField];
        }
      }

      if (!ownerId) {
        if (allowMissingOwner) {
          req.resourceId = resourceId;
          req.resource = {
            id: resourceId,
            ownerId: null,
          };

          return next();
        }

        throw new AppError(
          "Resource ownership could not be determined",
          403,
          "OWNERSHIP_NOT_FOUND"
        );
      }

      if (
        String(ownerId) !== String(req.user._id)
      ) {
        throw new AppError(
          "You do not have permission to access this resource",
          403,
          "FORBIDDEN"
        );
      }

      req.resourceId = resourceId;

      req.resource = {
        id: resourceId,
        ownerId,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const checkInstituteOwnership = (
  Model,
  options = {}
) => {
  const {
    instituteField = "instituteId",
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          401,
          "UNAUTHORIZED"
        );
      }

      if (req.user.role === Roles.SUPER_ADMIN) {
        return next();
      }

      const resourceId = req.params?.id;

      if (!resourceId) {
        throw new AppError(
          "Resource ID is required",
          400,
          "ID_REQUIRED"
        );
      }

      if (!mongoose.isValidObjectId(resourceId)) {
        throw new AppError(
          "Invalid resource ID",
          400,
          "INVALID_ID"
        );
      }

      if (!req.user.instituteId) {
        throw new AppError(
          "Organization context is required",
          403,
          "INSTITUTE_REQUIRED"
        );
      }

      const document = await Model.findById(resourceId)
        .select(instituteField)
        .lean();

      if (!document) {
        throw new AppError(
          "Resource not found",
          404,
          "NOT_FOUND"
        );
      }

      if (
        !document[instituteField] ||
        String(document[instituteField]) !==
          String(req.user.instituteId)
      ) {
        throw new AppError(
          "You do not have permission to access this resource",
          403,
          "FORBIDDEN"
        );
      }

      req.resourceId = resourceId;

      req.resource = {
        id: resourceId,
        instituteId: document[instituteField],
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export {
  checkOwnership,
  checkInstituteOwnership,
};
