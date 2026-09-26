// server/src/utils/validation.js

import Joi from "joi";

const objectId = Joi.string()
  .trim()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .messages({
    "string.pattern.base": "Invalid ID format",
  });

const email = Joi.string()
  .trim()
  .lowercase()
  .email()
  .max(254);

const password = Joi.string()
  .min(8)
  .max(128);

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  search: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .default(""),

  sortBy: Joi.string()
    .trim()
    .max(50)
    .default("createdAt"),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc"),
});

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(422).json({
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      });
    }

    req[source] = value;

    next();
  };
};

const validateBody = (schema) => validate(schema, "body");

const validateQuery = (schema) => validate(schema, "query");

const validateParams = (schema) => validate(schema, "params");

const idParamSchema = Joi.object({
  id: objectId.required(),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: password.required(),
});

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: email.required(),

  password: password.required(),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),

  role: Joi.string()
    .valid(
      "super_admin",
      "admin",
      "teacher",
      "student",
      "hr",
      "employee"
    )
    .default("employee"),

  instituteId: objectId.allow(null, ""),
});

const profileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  avatarUrl: Joi.string()
    .trim()
    .uri()
    .max(2048)
    .allow("", null),
}).min(1);

const organizationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  type: Joi.string()
    .valid(
      "school",
      "college",
      "coaching",
      "company"
    )
    .required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("", null),

  contact: Joi.object({
    email: email.allow("", null),
    phone: Joi.string()
      .trim()
      .max(30)
      .allow("", null),
    website: Joi.string()
      .trim()
      .uri()
      .max(2048)
      .allow("", null),
    address: Joi.string()
      .trim()
      .max(500)
      .allow("", null),
  }),

  logo: Joi.string()
    .trim()
    .uri()
    .max(2048)
    .allow("", null),
});

const classSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  subject: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("", null),

  teacherId: objectId.allow(null, ""),

  studentIds: Joi.array()
    .items(objectId)
    .max(1000)
    .default([]),

  schedule: Joi.object({
    days: Joi.array()
      .items(
        Joi.string().valid(
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        )
      )
      .max(7),

    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .allow("", null),

    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .allow("", null),
  }),

  room: Joi.string()
    .trim()
    .max(100)
    .allow("", null),

  maxStudents: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .allow(null),
});

const assignmentSchema = Joi.object({
  classId: objectId.required(),

  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  description: Joi.string()
    .trim()
    .max(5000)
    .allow("", null),

  instructions: Joi.string()
    .trim()
    .max(10000)
    .allow("", null),

  dueDate: Joi.date()
    .iso()
    .allow(null),

  maxScore: Joi.number()
    .min(0)
    .max(100000)
    .default(100),

  attachments: Joi.array()
    .items(
      Joi.string()
        .trim()
        .uri()
        .max(2048)
    )
    .max(20)
    .default([]),

  status: Joi.string()
    .valid("draft", "published", "closed")
    .default("draft"),
});

const submissionSchema = Joi.object({
  assignmentId: objectId.required(),

  content: Joi.string()
    .trim()
    .min(1)
    .max(50000)
    .required(),

  attachments: Joi.array()
    .items(
      Joi.string()
        .trim()
        .uri()
        .max(2048)
    )
    .max(20)
    .default([]),
});

const gradeSubmissionSchema = Joi.object({
  score: Joi.number()
    .min(0)
    .max(100000)
    .required(),

  feedback: Joi.string()
    .trim()
    .max(10000)
    .allow("", null),
});

const attendanceSchema = Joi.object({
  classId: objectId.required(),

  date: Joi.date()
    .iso()
    .required(),

  records: Joi.array()
    .items(
      Joi.object({
        userId: objectId.required(),

        status: Joi.string()
          .valid(
            "present",
            "absent",
            "late",
            "leave"
          )
          .required(),

        notes: Joi.string()
          .trim()
          .max(1000)
          .allow("", null),
      })
    )
    .min(1)
    .max(1000)
    .required(),
});

const leaveSchema = Joi.object({
  type: Joi.string()
    .valid(
      "sick",
      "casual",
      "earned",
      "maternity",
      "paternity",
      "other"
    )
    .required(),

  startDate: Joi.date()
    .iso()
    .required(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref("startDate"))
    .required(),

  reason: Joi.string()
    .trim()
    .min(2)
    .max(3000)
    .required(),
});

const leaveStatusSchema = Joi.object({
  status: Joi.string()
    .valid("approved", "rejected")
    .required(),

  rejectionReason: Joi.string()
    .trim()
    .max(2000)
    .allow("", null),
});

const payrollSchema = Joi.object({
  employeeId: objectId.required(),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required(),

  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .required(),

  basicSalary: Joi.number()
    .min(0)
    .max(100000000)
    .required(),

  allowances: Joi.object({
    hra: Joi.number().min(0).default(0),
    transport: Joi.number().min(0).default(0),
    medical: Joi.number().min(0).default(0),
    other: Joi.number().min(0).default(0),
  }).default({}),

  deductions: Joi.object({
    pf: Joi.number().min(0).default(0),
    tax: Joi.number().min(0).default(0),
    other: Joi.number().min(0).default(0),
  }).default({}),

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("", null),
});

const payrollStatusSchema = Joi.object({
  status: Joi.string()
    .valid("processed", "paid")
    .required(),
});

const departmentSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  code: Joi.string()
    .trim()
    .max(50)
    .allow("", null),

  head: objectId.allow(null, ""),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("", null),
});

const announcementSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  content: Joi.string()
    .trim()
    .min(1)
    .max(10000)
    .required(),

  targetRoles: Joi.array()
    .items(
      Joi.string().valid(
        "all",
        "super_admin",
        "admin",
        "teacher",
        "student",
        "hr",
        "employee"
      )
    )
    .min(1)
    .required(),

  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("medium"),

  expiresAt: Joi.date()
    .iso()
    .allow(null),

  isActive: Joi.boolean()
    .default(true),
});

const studyMaterialSchema = Joi.object({
  classId: objectId.allow(null, ""),

  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  description: Joi.string()
    .trim()
    .max(5000)
    .allow("", null),

  subject: Joi.string()
    .trim()
    .max(150)
    .allow("", null),

  type: Joi.string()
    .valid(
      "pdf",
      "video",
      "document",
      "link",
      "image",
      "other"
    )
    .required(),

  url: Joi.string()
    .trim()
    .uri()
    .max(2048)
    .required(),

  fileSize: Joi.number()
    .integer()
    .min(0)
    .max(10000000000)
    .allow(null),

  isPublic: Joi.boolean()
    .default(true),
});

const userCreateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: email.required(),

  password: password.required(),

  role: Joi.string()
    .valid(
      "admin",
      "teacher",
      "student",
      "hr",
      "employee"
    )
    .required(),

  instituteId: objectId.allow(null, ""),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("", null),
});

const updateUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  avatarUrl: Joi.string()
    .trim()
    .uri()
    .max(2048)
    .allow("", null),

  status: Joi.string()
    .valid("active", "inactive"),
}).min(1);

const validateObjectId = (value) => {
  return /^[a-fA-F0-9]{24}$/.test(String(value));
};



export {
  objectId,
  email,
  password,

  paginationSchema,
  idParamSchema,

  loginSchema,
  registerSchema,
  profileSchema,

  organizationSchema,
  classSchema,
  assignmentSchema,
  submissionSchema,
  gradeSubmissionSchema,
  attendanceSchema,

  leaveSchema,
  leaveStatusSchema,

  payrollSchema,
  payrollStatusSchema,

  departmentSchema,
  announcementSchema,
  studyMaterialSchema,

  userCreateSchema,
  updateUserSchema,

  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateObjectId,
};