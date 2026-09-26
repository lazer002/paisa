// server/src/models/RefreshSession.js

import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* USER                                                                    */
    /* ---------------------------------------------------------------------- */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* TOKEN ROTATION                                                          */
    /* ---------------------------------------------------------------------- */

    // SHA-256 hash of the current refresh token.
    // Never store the raw refresh token.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: false,
      trim: true,
      minlength: 64,
      maxlength: 64,
      match: /^[a-f0-9]{64}$/,
    },

    // Token family used to detect refresh-token theft/reuse.
    familyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      minlength: 16,
      maxlength: 128,
    },

    // Hash of the token immediately rotated out.
    previousHash: {
      type: String,
      default: null,
      trim: true,
      minlength: 64,
      maxlength: 64,
      match: /^[a-f0-9]{64}$/,
    },

    /* ---------------------------------------------------------------------- */
    /* CLIENT INFORMATION                                                      */
    /* ---------------------------------------------------------------------- */

    userAgent: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    ip: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* LIFECYCLE                                                               */
    /* ---------------------------------------------------------------------- */

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },

    revokedReason: {
      type: String,
      enum: [
        "logout",
        "rotation_reuse",
        "expired",
        "password_change",
        "account_disabled",
        "security_action",
        "admin_revoke",
        "unknown",
      ],
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    lastRotatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* -------------------------------------------------------------------------- */
/* INDEXES                                                                    */
/* -------------------------------------------------------------------------- */

// MongoDB automatically removes expired sessions.
refreshSessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: "refresh_session_expiry_ttl",
  }
);

// Fast lookup for all sessions belonging to a user.
refreshSessionSchema.index(
  { userId: 1, revokedAt: 1 },
  {
    name: "refresh_session_user_active",
  }
);

// Useful for revoking an entire token family.
refreshSessionSchema.index(
  { familyId: 1, revokedAt: 1 },
  {
    name: "refresh_session_family_active",
  }
);

// Useful for security/session-management screens.
refreshSessionSchema.index(
  { userId: 1, createdAt: -1 },
  {
    name: "refresh_session_user_created",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

refreshSessionSchema.pre("validate", function (next) {
  if (
    this.expiresAt &&
    this.expiresAt <= this.createdAt
  ) {
    return next(
      new Error(
        "Refresh session expiration must be after creation"
      )
    );
  }

  if (
    this.revokedAt &&
    this.revokedAt > new Date()
  ) {
    return next(
      new Error(
        "Revocation date cannot be in the future"
      )
    );
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

refreshSessionSchema.virtual("isActive").get(
  function () {
    return (
      !this.revokedAt &&
      this.expiresAt > new Date()
    );
  }
);

refreshSessionSchema.virtual("isExpired").get(
  function () {
    return this.expiresAt <= new Date();
  }
);

refreshSessionSchema.virtual("isRevoked").get(
  function () {
    return Boolean(this.revokedAt);
  }
);

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

refreshSessionSchema.methods.isCurrentlyActive =
  function () {
    return (
      !this.revokedAt &&
      this.expiresAt > new Date()
    );
  };

refreshSessionSchema.methods.revoke =
  async function (
    reason = "unknown"
  ) {
    if (this.revokedAt) {
      return this;
    }

    this.revokedAt = new Date();
    this.revokedReason = reason;

    await this.save();

    return this;
  };

refreshSessionSchema.methods.rotate =
  async function (
    newTokenHash,
    nextExpiresAt
  ) {
    if (!newTokenHash) {
      throw new Error(
        "New token hash is required for rotation"
      );
    }

    if (
      !/^[a-f0-9]{64}$/.test(
        newTokenHash
      )
    ) {
      throw new Error(
        "Invalid refresh token hash"
      );
    }

    if (
      !nextExpiresAt ||
      new Date(nextExpiresAt) <= new Date()
    ) {
      throw new Error(
        "Invalid refresh session expiration"
      );
    }

    this.previousHash = this.tokenHash;
    this.tokenHash = newTokenHash;
    this.expiresAt = new Date(
      nextExpiresAt
    );
    this.lastRotatedAt = new Date();
    this.lastUsedAt = new Date();

    await this.save();

    return this;
  };

refreshSessionSchema.methods.touch =
  async function () {
    if (!this.isCurrentlyActive()) {
      return this;
    }

    this.lastUsedAt = new Date();

    await this.save({
      validateModifiedOnly: true,
    });

    return this;
  };

/* -------------------------------------------------------------------------- */
/* STATIC METHODS                                                             */
/* -------------------------------------------------------------------------- */

refreshSessionSchema.statics.findActiveByTokenHash =
  function (tokenHash) {
    return this.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    });
  };

refreshSessionSchema.statics.findByTokenHash =
  function (tokenHash) {
    return this.findOne({
      $or: [
        { tokenHash },
        { previousHash: tokenHash },
      ],
    });
  };

refreshSessionSchema.statics.revokeUserSessions =
  function (
    userId,
    reason = "security_action"
  ) {
    return this.updateMany(
      {
        userId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
  };

refreshSessionSchema.statics.revokeFamily =
  function (
    familyId,
    reason = "rotation_reuse"
  ) {
    return this.updateMany(
      {
        familyId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
  };

refreshSessionSchema.statics.cleanupExpired =
  function () {
    return this.deleteMany({
      expiresAt: {
        $lte: new Date(),
      },
    });
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

const RefreshSession =
  mongoose.models.RefreshSession ||
  mongoose.model(
    "RefreshSession",
    refreshSessionSchema
  );

export default RefreshSession;