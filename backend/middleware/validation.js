const Joi = require('joi');

/**
 * Middleware factory for request validation
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Replace request body with validated value
    req.body = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  telegramAuth: Joi.object({
    telegramId: Joi.string().required(),
    username: Joi.string().allow('', null),
    firstName: Joi.string().allow('', null),
    lastName: Joi.string().allow('', null),
    photoUrl: Joi.string().uri().allow('', null),
    authData: Joi.string().required(),
    referralCode: Joi.string().optional()
  }),
  
  // Game schemas
  gameComplete: Joi.object({
    score: Joi.number().integer().min(0).required(),
    durationSeconds: Joi.number().integer().min(1).max(600).required()
  }),
  
  // Social verification
  verifySubscription: Joi.object({
    platform: Joi.string().valid('YOUTUBE', 'TIKTOK', 'FACEBOOK', 'TELEGRAM').required(),
    channelId: Joi.string().required(),
    proof: Joi.string().optional()
  }),
  
  // Admin schemas
  createChannel: Joi.object({
    platform: Joi.string().valid('YOUTUBE', 'TIKTOK', 'FACEBOOK', 'TELEGRAM').required(),
    channelId: Joi.string().required(),
    channelName: Joi.string().required(),
    channelUrl: Joi.string().uri().required(),
    pointsReward: Joi.number().integer().min(1).default(100),
    verificationMethod: Joi.string().valid('API', 'MANUAL', 'BOT').default('API')
  }),
  
  updateChannel: Joi.object({
    channelName: Joi.string().optional(),
    channelUrl: Joi.string().uri().optional(),
    pointsReward: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
    verificationMethod: Joi.string().valid('API', 'MANUAL', 'BOT').optional()
  })
};

module.exports = { validate, schemas };
