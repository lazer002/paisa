// server/src/validators/authValidator.js

import Joi from "joi";

import { ROLES } from "../config/constants.js";
import {
  email,
  phone,
  strongPassword,
  objectId,
  trimmedString,
  uuid,
} from "../utils/validation.js";

const roleValues = Object.values(ROLES);

const registerSchema = Joi.object({
  email: email.required(),

  phone: phone
    .optional()
    .allow(null, ""),

  password: strongPassword.required(),

  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),

  name: trimmedString(2, 100).required(),

  role: Joi.string()
    .valid(...roleValues)
    .optional(),

  instituteId: objectId
    .optional()
    .allow(null, ""),

  deviceId: uuid
    .optional()
    .allow(null, ""),

  deviceName: trimmedString(1, 150)
    .optional()
    .allow(null, ""),
})
  .custom(
    (value, helpers) => {
      if (
        value.roles?.includes(
          ROLES.SUPER_ADMIN
        )
      ) {
        return helpers.error(
          "any.invalid",
          {
            message:
              "super_admin cannot be assigned through public registration",
          }
        );
      }

      return value;
    }
  )
  .messages({
    "any.invalid":
      "{{#message}}",
  });

const loginSchema = Joi.object({
  email: email.required(),

  password:
    Joi.string()
      .min(1)
      .max(128)
      .required(),

  deviceId:
    uuid.optional().allow(
      null,
      ""
    ),

  deviceName:
    trimmedString(1, 150)
      .optional()
      .allow(
        null,
        ""
      ),
});

const refreshSchema =
  Joi.object({
    refreshToken:
      Joi.string()
        .trim()
        .min(20)
        .max(4096)
        .optional()
        .allow(null, ""),
  });

const logoutSchema =
  Joi.object({
    refreshToken:
      Joi.string()
        .trim()
        .min(20)
        .max(4096)
        .optional()
        .allow(null, ""),
  });

const forgotPasswordSchema =
  Joi.object({
    email:
      email.required(),
  });

const resetPasswordSchema =
  Joi.object({
    token:
      Joi.string()
        .trim()
        .min(20)
        .max(4096)
        .required(),

    password:
      strongPassword.required(),

    confirmPassword:
      Joi.any()
        .valid(
          Joi.ref("password")
        )
        .required()
        .messages({
          "any.only":
            "Passwords do not match",
          "any.required":
            "Password confirmation is required",
        }),
  });

const changePasswordSchema =
  Joi.object({
    currentPassword:
      Joi.string()
        .min(1)
        .max(128)
        .required(),

    newPassword:
      strongPassword.required(),

    confirmPassword:
      Joi.any()
        .valid(
          Joi.ref("newPassword")
        )
        .required()
        .messages({
          "any.only":
            "Passwords do not match",
          "any.required":
            "Password confirmation is required",
        }),
  }).custom(
    (value, helpers) => {
      if (
        value.currentPassword ===
        value.newPassword
      ) {
        return helpers.error(
          "any.invalid",
          {
            message:
              "New password must be different from current password",
          }
        );
      }

      return value;
    }
  )
  .messages({
    "any.invalid":
      "{{#message}}",
  });

const verifyEmailSchema =
  Joi.object({
    token:
      Joi.string()
        .trim()
        .min(20)
        .max(4096)
        .required(),
  });

const resendVerificationSchema =
  Joi.object({
    email:
      email.required(),
  });

const revokeSessionSchema =
  Joi.object({
    sessionId:
      uuid.required(),
  });

const authSchemas = Object.freeze({
  register: registerSchema,
  login: loginSchema,
  refresh: refreshSchema,
  logout: logoutSchema,
  forgotPassword:
    forgotPasswordSchema,
  resetPassword:
    resetPasswordSchema,
  changePassword:
    changePasswordSchema,
  verifyEmail:
    verifyEmailSchema,
  resendVerification:
    resendVerificationSchema,
  revokeSession:
    revokeSessionSchema,
});

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  revokeSessionSchema,
  authSchemas,
};

export default authSchemas;
