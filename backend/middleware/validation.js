const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Validation rules for user login
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Validation rules for score submission
const validateScore = [
    body('score')
        .isInt({ min: 0 })
        .withMessage('Score must be a positive integer'),
    
    body('aliensDefeated')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Aliens defeated must be a positive integer'),
    
    body('levelReached')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Level reached must be at least 1'),
    
    body('survivalTime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Survival time must be a positive integer'),
    
    body('accuracy')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Accuracy must be between 0 and 100')
];

// Validation rules for profile update
const validateProfileUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('settings.soundEnabled')
        .optional()
        .isBoolean()
        .withMessage('Sound enabled must be a boolean'),
    
    body('settings.musicEnabled')
        .optional()
        .isBoolean()
        .withMessage('Music enabled must be a boolean'),
    
    body('settings.difficulty')
        .optional()
        .isIn(['easy', 'normal', 'hard'])
        .withMessage('Difficulty must be easy, normal, or hard')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(400).json({
            message: 'Validation failed',
            errors: errorMessages
        });
    }
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateScore,
    validateProfileUpdate,
    handleValidationErrors
};
