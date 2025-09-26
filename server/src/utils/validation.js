import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('super_admin', 'admin', 'teacher', 'student', 'hr', 'employee').required(),
  instituteId: Joi.string().optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('super_admin', 'admin', 'teacher', 'student', 'hr', 'employee').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  profile: Joi.object({
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    avatarUrl: Joi.string().uri().optional()
  }).optional()
});

// Institute validation schemas
export const createInstituteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('school', 'college', 'coaching', 'company').required(),
  address: Joi.string().optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().optional(),
  meta: Joi.object({
    industry: Joi.string().optional(),
    registrationNo: Joi.string().optional(),
    board: Joi.string().optional(),
    affiliationNo: Joi.string().optional()
  }).optional()
});

// Validation middleware
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};
