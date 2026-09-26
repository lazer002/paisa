import mongoose from "mongoose";

/**
 * Server-side refresh session store.
 *
 * Every login creates one row. The refresh token cookie must map to a row
 * here to be accepted. Deleting the row = instant logout everywhere.
 *
 * Rotation: every time a refresh token is used, the row's tokenHash is
 * replaced and the token itself is re-issued. If an OLD (already-rotated)
 * token is ever presented again, that's evidence of theft — we kill the
 * whole family.
 */
const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // sha256 hash of the raw refresh token — we never store the raw token
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    // family id for rotation/theft detection
    familyId: {
      type: String,
      required: true,
      index: true,
    },

    // the hash that was just rotated out — one reuse = theft
    previousHash: {
      type: String,
      default: null,
    },

    userAgent: String,
    ip: String,

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL-ish cleanup: expired sessions are useless anyway
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshSessionSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

export default mongoose.models.RefreshSession ||
  mongoose.model("RefreshSession", refreshSessionSchema);
