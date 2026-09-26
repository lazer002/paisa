// server/src/models/counter.js

import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Counter key is required"],
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
      index: true,
    },

    seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Counter sequence must be a safe integer",
      },
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

counterSchema.index(
  { key: 1 },
  {
    unique: true,
    name: "counter_key_unique",
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

counterSchema.virtual(
  "nextSequence"
).get(function () {
  return this.seq + 1;
});

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

counterSchema.methods.increment =
  function () {
    if (
      !Number.isSafeInteger(
        this.seq
      )
    ) {
      throw new Error(
        "Counter sequence is invalid"
      );
    }

    this.seq += 1;

    return this.seq;
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

const Counter =
  mongoose.models.Counter ||
  mongoose.model(
    "Counter",
    counterSchema
  );

export default Counter;