// server/src/models/Pipeline.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const PIPELINE_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
];

const PIPELINE_TYPES = [
  "sales",
  "admissions",
  "enrollment",
  "renewal",
  "support",
  "custom",
];

const STAGE_TYPES = [
  "open",
  "won",
  "lost",
];

const FORECAST_CATEGORIES = [
  "pipeline",
  "best_case",
  "commit",
  "closed",
  "omitted",
];

const stageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },

    key: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    order: {
      type: Number,
      min: 0,
      required: true,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    type: {
      type: String,
      enum: STAGE_TYPES,
      default: "open",
    },

    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    forecastCategory: {
      type: String,
      enum: FORECAST_CATEGORIES,
      default: "pipeline",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    requiresReason: {
      type: Boolean,
      default: false,
    },

    requiresCloseDate: {
      type: Boolean,
      default: false,
    },

    requiresAmount: {
      type: Boolean,
      default: false,
    },

    autoClose: {
      type: Boolean,
      default: false,
    },

    autoTasks: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            maxlength: 300,
          },

          type: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "task",
          },

          dueInDays: {
            type: Number,
            min: 0,
            max: 3650,
            default: 1,
          },

          priority: {
            type: String,
            enum: [
              "low",
              "normal",
              "high",
              "urgent",
            ],
            default: "normal",
          },
        },
      ],
      default: [],
    },

    requiredFields: {
      type: [String],
      default: [],
    },

    allowedNextStages: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  }
);

const assignmentRuleSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    strategy: {
      type: String,
      enum: [
        "round_robin",
        "least_loaded",
        "manual",
        "weighted",
      ],
      default: "manual",
    },

    users: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          weight: {
            type: Number,
            min: 1,
            max: 100,
            default: 1,
          },

          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },

    departments: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const permissionSchema = new mongoose.Schema(
  {
    view: {
      type: [String],
      default: [],
    },

    create: {
      type: [String],
      default: [],
    },

    update: {
      type: [String],
      default: [],
    },

    delete: {
      type: [String],
      default: [],
    },

    manageStages: {
      type: [String],
      default: [],
    },

    managePipeline: {
      type: [String],
      default: [],
    },

    viewForecast: {
      type: [String],
      default: [],
    },

    export: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const automationSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    createFollowUpTask: {
      type: Boolean,
      default: true,
    },

    createActivityOnStageChange: {
      type: Boolean,
      default: true,
    },

    notifyOwnerOnStageChange: {
      type: Boolean,
      default: false,
    },

    notifyManagerOnWon: {
      type: Boolean,
      default: false,
    },

    notifyManagerOnLost: {
      type: Boolean,
      default: false,
    },

    notifyOwnerBeforeClose: {
      type: Boolean,
      default: false,
    },

    closeReminderDays: {
      type: Number,
      min: 0,
      max: 365,
      default: 3,
    },
  },
  {
    _id: false,
  }
);

const pipelineSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                               */
    /* ====================================================================== */

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
    `pip_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                              */
    /* ====================================================================== */

    pipelineCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      index: true,
    },

    externalId: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    type: {
      type: String,
      enum: PIPELINE_TYPES,
      default: "sales",
      index: true,
    },

    status: {
      type: String,
      enum: PIPELINE_STATUSES,
      default: "draft",
      index: true,
    },

    /* ====================================================================== */
    /* DISPLAY                                                                */
    /* ====================================================================== */

    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    icon: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    order: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ====================================================================== */
    /* STAGES                                                                 */
    /* ====================================================================== */

    stages: {
      type: [stageSchema],
      default: [],
    },

    defaultStageKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    wonStageKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    lostStageKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                             */
    /* ====================================================================== */

    assignment: {
      type: assignmentRuleSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* PERMISSIONS                                                            */
    /* ====================================================================== */

    permissions: {
      type: permissionSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* AUTOMATION                                                             */
    /* ====================================================================== */

    automation: {
      type: automationSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* VALIDATION / WORKFLOW                                                  */
    /* ====================================================================== */

    settings: {
      requireExpectedCloseDate: {
        type: Boolean,
        default: false,
      },

      requireAmount: {
        type: Boolean,
        default: false,
      },

      allowNegativeAmount: {
        type: Boolean,
        default: false,
      },

      allowReopen: {
        type: Boolean,
        default: true,
      },

      allowStageSkipping: {
        type: Boolean,
        default: true,
      },

      allowBackwardStageMovement: {
        type: Boolean,
        default: true,
      },

      automaticallySetProbability: {
        type: Boolean,
        default: true,
      },

      automaticallySetForecastCategory: {
        type: Boolean,
        default: true,
      },
    },

    /* ====================================================================== */
    /* FORECAST                                                               */
    /* ====================================================================== */

    forecast: {
      enabled: {
        type: Boolean,
        default: true,
      },

      defaultCategory: {
        type: String,
        enum: FORECAST_CATEGORIES,
        default: "pipeline",
      },

      includeWeightedPipeline: {
        type: Boolean,
        default: true,
      },
    },

    /* ====================================================================== */
    /* OWNERSHIP / MANAGEMENT                                                 */
    /* ====================================================================== */

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* ANALYTICS CACHE                                                        */
    /* ====================================================================== */

    statistics: {
      totalDeals: {
        type: Number,
        min: 0,
        default: 0,
      },

      openDeals: {
        type: Number,
        min: 0,
        default: 0,
      },

      wonDeals: {
        type: Number,
        min: 0,
        default: 0,
      },

      lostDeals: {
        type: Number,
        min: 0,
        default: 0,
      },

      cancelledDeals: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalPipelineAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      weightedPipelineAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      wonAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lostAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageDealSize: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageSalesCycleDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      winRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      lastCalculatedAt: {
        type: Date,
        default: null,
      },
    },

    /* ====================================================================== */
    /* TAGS / CUSTOM DATA                                                     */
    /* ====================================================================== */

    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* AUDIT                                                                  */
    /* ====================================================================== */

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

    /* ====================================================================== */
    /* LIFECYCLE                                                              */
    /* ====================================================================== */

    activatedAt: {
      type: Date,
      default: null,
    },

    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
  },
  {
    timestamps: true,
    versionKey: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* ============================================================================
 * INDEXES
 * ========================================================================== */

pipelineSchema.index(
  {
    instituteId: 1,
    pipelineCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_pipeline_code",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    slug: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_pipeline_slug",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    status: 1,
    order: 1,
  },
  {
    name: "pipeline_listing",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
  },
  {
    name: "pipeline_type_status",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    isDefault: 1,
  },
  {
    name: "default_pipeline",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    managerId: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "manager_pipelines",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "department_pipelines",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    tags: 1,
  },
  {
    name: "pipeline_tags",
  }
);

pipelineSchema.index(
  {
    instituteId: 1,
    name: "text",
    description: "text",
  },
  {
    name: "pipeline_search",
    weights: {
      name: 10,
      description: 5,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

pipelineSchema.pre(
  "validate",
  function (next) {
    if (
      this.stages.length >
      100
    ) {
      return next(
        new Error(
          "Pipeline cannot contain more than 100 stages"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Pipeline cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.assignment.users.length >
      500
    ) {
      return next(
        new Error(
          "Pipeline cannot contain more than 500 assignment users"
        )
      );
    }

    const keys =
      new Set();

    const orders =
      new Set();

    for (
      const stage of this.stages
    ) {
      if (
        keys.has(stage.key)
      ) {
        return next(
          new Error(
            `Duplicate pipeline stage key: ${stage.key}`
          )
        );
      }

      if (
        orders.has(stage.order)
      ) {
        return next(
          new Error(
            `Duplicate pipeline stage order: ${stage.order}`
          )
        );
      }

      keys.add(stage.key);
      orders.add(stage.order);

      if (
        stage.autoTasks.length >
        20
      ) {
        return next(
          new Error(
            "A pipeline stage cannot contain more than 20 automatic tasks"
          )
        );
      }
    }

    if (
      this.defaultStageKey &&
      !keys.has(
        this.defaultStageKey
      )
    ) {
      return next(
        new Error(
          "Default stage does not exist in pipeline stages"
        )
      );
    }

    if (
      this.wonStageKey &&
      !keys.has(
        this.wonStageKey
      )
    ) {
      return next(
        new Error(
          "Won stage does not exist in pipeline stages"
        )
      );
    }

    if (
      this.lostStageKey &&
      !keys.has(
        this.lostStageKey
      )
    ) {
      return next(
        new Error(
          "Lost stage does not exist in pipeline stages"
        )
      );
    }

    const defaultStages =
      this.stages.filter(
        (stage) =>
          stage.isDefault
      );

    if (
      defaultStages.length >
      1
    ) {
      return next(
        new Error(
          "Pipeline can have only one default stage"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

pipelineSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
    "active"
  );
});

pipelineSchema.virtual(
  "stageCount"
).get(function () {
  return this.stages.length;
});

pipelineSchema.virtual(
  "activeStageCount"
).get(function () {
  return this.stages.filter(
    (stage) =>
      stage.isActive
  ).length;
});

pipelineSchema.virtual(
  "openStages"
).get(function () {
  return this.stages.filter(
    (stage) =>
      stage.type ===
      "open"
  );
});

pipelineSchema.virtual(
  "wonStage"
).get(function () {
  return this.stages.find(
    (stage) =>
      stage.key ===
      this.wonStageKey
  );
});

pipelineSchema.virtual(
  "lostStage"
).get(function () {
  return this.stages.find(
    (stage) =>
      stage.key ===
      this.lostStageKey
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

pipelineSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

pipelineSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

pipelineSchema.query.byType =
  function (
    type
  ) {
    return this.where({
      type,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

pipelineSchema.methods.getStage =
  function (
    key
  ) {
    return this.stages.find(
      (stage) =>
        stage.key ===
        key
    );
  };

pipelineSchema.methods.getDefaultStage =
  function () {
    if (
      this.defaultStageKey
    ) {
      return this.getStage(
        this.defaultStageKey
      );
    }

    return (
      this.stages.find(
        (stage) =>
          stage.isDefault
      ) ||
      this.stages
        .filter(
          (stage) =>
            stage.isActive
        )
        .sort(
          (
            a,
            b
          ) =>
            a.order -
            b.order
        )[0] ||
      null
    );
  };

pipelineSchema.methods.addStage =
  async function ({
    name,
    key,
    description = null,
    order = null,
    type = "open",
    probability = 0,
    forecastCategory = "pipeline",
    isDefault = false,
  } = {}) {
    if (
      !name ||
      !key
    ) {
      throw new Error(
        "Stage name and key are required"
      );
    }

    const normalizedKey =
      String(key)
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          "_"
        );

    if (
      this.stages.some(
        (stage) =>
          stage.key ===
          normalizedKey
      )
    ) {
      throw new Error(
        "Pipeline stage key already exists"
      );
    }

    const nextOrder =
      this.stages.length
        ? Math.max(
            ...this.stages.map(
              (stage) =>
                stage.order
            )
          ) + 1
        : 0;

    const stage =
      this.stages.create({
        name,
        key: normalizedKey,
        description,
        order:
          order === null
            ? nextOrder
            : order,
        type,
        probability,
        forecastCategory,
        isDefault,
      });

    if (
      isDefault
    ) {
      this.stages.forEach(
        (item) => {
          item.isDefault =
            false;
        }
      );

      stage.isDefault =
        true;

      this.defaultStageKey =
        normalizedKey;
    }

    this.stages.push(
      stage
    );

    if (
      type ===
        "won" &&
      !this.wonStageKey
    ) {
      this.wonStageKey =
        normalizedKey;
    }

    if (
      type ===
        "lost" &&
      !this.lostStageKey
    ) {
      this.lostStageKey =
        normalizedKey;
    }

    return this.save();
  };

pipelineSchema.methods.updateStage =
  async function (
    stageId,
    updates = {}
  ) {
    const stage =
      this.stages.id(
        stageId
      );

    if (
      !stage
    ) {
      throw new Error(
        "Pipeline stage not found"
      );
    }

    const allowedFields = [
      "name",
      "description",
      "order",
      "color",
      "type",
      "probability",
      "forecastCategory",
      "isActive",
      "requiresReason",
      "requiresCloseDate",
      "requiresAmount",
      "autoClose",
      "requiredFields",
      "allowedNextStages",
    ];

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        stage[field] =
          updates[field];
      }
    }

    return this.save();
  };

pipelineSchema.methods.removeStage =
  async function (
    stageId
  ) {
    const stage =
      this.stages.id(
        stageId
      );

    if (
      !stage
    ) {
      throw new Error(
        "Pipeline stage not found"
      );
    }

    if (
      stage.key ===
        this.defaultStageKey ||
      stage.key ===
        this.wonStageKey ||
      stage.key ===
        this.lostStageKey
    ) {
      throw new Error(
        "Default, won, or lost stage cannot be removed"
      );
    }

    stage.deleteOne();

    return this.save();
  };

pipelineSchema.methods.reorderStages =
  async function (
    orderedKeys
  ) {
    if (
      !Array.isArray(
        orderedKeys
      ) ||
      orderedKeys.length !==
        this.stages.length
    ) {
      throw new Error(
        "Complete stage key order is required"
      );
    }

    const existingKeys =
      new Set(
        this.stages.map(
          (stage) =>
            stage.key
        )
      );

    const incomingKeys =
      new Set(
        orderedKeys
      );

    if (
      incomingKeys.size !==
        existingKeys.size ||
      [...existingKeys].some(
        (key) =>
          !incomingKeys.has(
            key
          )
      )
    ) {
      throw new Error(
        "Invalid stage ordering"
      );
    }

    orderedKeys.forEach(
      (
        key,
        index
      ) => {
        const stage =
          this.getStage(
            key
          );

        stage.order =
          index;
      }
    );

    return this.save();
  };

pipelineSchema.methods.activate =
  async function ({
    activatedBy = null,
  } = {}) {
    if (
      this.stages.length <
      2
    ) {
      throw new Error(
        "Pipeline must contain at least two stages before activation"
      );
    }

    if (
      !this.getDefaultStage()
    ) {
      throw new Error(
        "Pipeline requires a default stage"
      );
    }

    if (
      !this.wonStageKey
    ) {
      throw new Error(
        "Pipeline requires a won stage"
      );
    }

    if (
      !this.lostStageKey
    ) {
      throw new Error(
        "Pipeline requires a lost stage"
      );
    }

    this.status =
      "active";

    this.activatedAt =
      new Date();

    this.activatedBy =
      activatedBy;

    return this.save();
  };

pipelineSchema.methods.deactivate =
  async function () {
    this.status =
      "inactive";

    return this.save();
  };

pipelineSchema.methods.archive =
  async function ({
    archivedBy = null,
  } = {}) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    this.archivedBy =
      archivedBy;

    return this.save();
  };

pipelineSchema.methods.setDefault =
  async function () {
    this.isDefault =
      true;

    return this.save();
  };

pipelineSchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !this.tags.includes(
        normalized
      )
    ) {
      this.tags.push(
        normalized
      );
    }

    return this.save();
  };

pipelineSchema.methods.removeTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    this.tags =
      this.tags.filter(
        (item) =>
          item !== normalized
      );

    return this.save();
  };

pipelineSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

pipelineSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

pipelineSchema.statics.findActiveForInstitute =
  function (
    instituteId
  ) {
    return this.find({
      instituteId,
      status: "active",
      isDeleted: false,
    }).sort({
      order: 1,
      createdAt: 1,
    });
  };

pipelineSchema.statics.findDefaultForInstitute =
  function (
    instituteId
  ) {
    return this.findOne({
      instituteId,
      isDefault: true,
      status: "active",
      isDeleted: false,
    });
  };

pipelineSchema.statics.findByType =
  function (
    instituteId,
    type
  ) {
    return this.find({
      instituteId,
      type,
      isDeleted: false,
    }).sort({
      order: 1,
    });
  };

pipelineSchema.statics.findStageAcrossPipelines =
  function (
    instituteId,
    stageKey
  ) {
    return this.findOne({
      instituteId,
      "stages.key":
        String(
          stageKey
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Pipeline =
  mongoose.models.Pipeline ||
  mongoose.model(
    "Pipeline",
    pipelineSchema
  );

export {
  PIPELINE_STATUSES,
  PIPELINE_TYPES,
  STAGE_TYPES,
  FORECAST_CATEGORIES,
};
