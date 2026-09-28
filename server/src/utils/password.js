// server/src/utils/password.js

import bcrypt from "bcryptjs";
import ApiError from "./ApiError.js";

const DEFAULT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const getSaltRounds = () => {
  const configured = Number(
    process.env.BCRYPT_SALT_ROUNDS
  );

  if (
    Number.isInteger(configured) &&
    configured >= 10 &&
    configured <= 15
  ) {
    return configured;
  }

  return DEFAULT_SALT_ROUNDS;
};

const validatePasswordInput = (
  password
) => {
  if (
    typeof password !== "string" ||
    password.length === 0
  ) {
    throw ApiError.badRequest(
      "Password is required",
      "PASSWORD_REQUIRED"
    );
  }

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    throw ApiError.badRequest(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      "PASSWORD_TOO_SHORT"
    );
  }

  if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    throw ApiError.badRequest(
      `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
      "PASSWORD_TOO_LONG"
    );
  }

  return true;
};

const hashPassword = async (
  password,
  saltRounds = getSaltRounds()
) => {
  validatePasswordInput(password);

  return bcrypt.hash(
    password,
    saltRounds
  );
};

const comparePassword = async (
  password,
  passwordHash
) => {
  if (
    typeof password !== "string" ||
    typeof passwordHash !== "string" ||
    !passwordHash
  ) {
    return false;
  }

  try {
    return await bcrypt.compare(
      password,
      passwordHash
    );
  } catch {
    return false;
  }
};

const isPasswordHash = (
  value
) => {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  return /^\$2[aby]\$\d{2}\$/.test(
    value
  );
};

const needsRehash = (
  passwordHash,
  saltRounds = getSaltRounds()
) => {
  if (!isPasswordHash(passwordHash)) {
    return true;
  }

  const match =
    passwordHash.match(
      /^\$2[aby]\$(\d{2})\$/
    );

  if (!match) {
    return true;
  }

  const currentRounds =
    Number(match[1]);

  return (
    currentRounds !==
    Number(saltRounds)
  );
};

const verifyAndMaybeRehashPassword =
  async (
    password,
    passwordHash,
    saltRounds = getSaltRounds()
  ) => {
    const valid =
      await comparePassword(
        password,
        passwordHash
      );

    if (!valid) {
      return {
        valid: false,
        passwordHash,
        rehashed: false,
      };
    }

    if (
      needsRehash(
        passwordHash,
        saltRounds
      )
    ) {
      const newPasswordHash =
        await hashPassword(
          password,
          saltRounds
        );

      return {
        valid: true,
        passwordHash:
          newPasswordHash,
        rehashed: true,
      };
    }

    return {
      valid: true,
      passwordHash,
      rehashed: false,
    };
  };

const validatePasswordConfirmation = (
  password,
  confirmPassword
) => {
  if (
    password !== confirmPassword
  ) {
    throw ApiError.badRequest(
      "Passwords do not match",
      "PASSWORD_CONFIRMATION_MISMATCH"
    );
  }

  return true;
};

const checkPasswordStrength = (
  password
) => {
  if (
    typeof password !== "string"
  ) {
    return {
      valid: false,
      score: 0,
      requirements: {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
      },
    };
  }

  const requirements = {
    length:
      password.length >= 8,
    lowercase:
      /[a-z]/.test(password),
    uppercase:
      /[A-Z]/.test(password),
    number:
      /\d/.test(password),
    special:
      /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(
    requirements
  ).filter(Boolean).length;

  return {
    valid:
      requirements.length &&
      requirements.lowercase &&
      requirements.uppercase &&
      requirements.number &&
      requirements.special,
    score,
    requirements,
  };
};

export {
  DEFAULT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  getSaltRounds,
  validatePasswordInput,
  hashPassword,
  comparePassword,
  isPasswordHash,
  needsRehash,
  verifyAndMaybeRehashPassword,
  validatePasswordConfirmation,
  checkPasswordStrength,
};

export default {
  hashPassword,
  comparePassword,
  validatePasswordInput,
  validatePasswordConfirmation,
  verifyAndMaybeRehashPassword,
  checkPasswordStrength,
};
