const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', 
    authLimiter,
    validateRegistration,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { username, email, password } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: existingUser.email === email ? 
                        'User with this email already exists' : 
                        'Username is already taken',
                    error: 'USER_EXISTS'
                });
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Create new user
            const user = new User({
                username,
                email,
                password: hashedPassword
            });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    username: user.username,
                    email: user.email
                },
                process.env.JWT_SECRET || 'cosmic-secret',
                { expiresIn: '7d' }
            );

            // Return user data without password
            res.status(201).json({
                message: 'User created successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    highScore: user.highScore,
                    totalGamesPlayed: user.totalGamesPlayed,
                    profilePicture: user.profilePicture,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(400).json({ 
                    message: `${field === 'email' ? 'Email' : 'Username'} is already taken`,
                    error: 'DUPLICATE_KEY'
                });
            }
            
            res.status(500).json({ 
                message: 'Server error during registration',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
    authLimiter,
    validateLogin,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ 
                    message: 'Invalid email or password',
                    error: 'INVALID_CREDENTIALS'
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(400).json({ 
                    message: 'Account has been deactivated',
                    error: 'ACCOUNT_DEACTIVATED'
                });
            }

            // Validate password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ 
                    message: 'Invalid email or password',
                    error: 'INVALID_CREDENTIALS'
                });
            }

            // Update last login
            await user.updateLastLogin();

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    username: user.username,
                    email: user.email
                },
                process.env.JWT_SECRET || 'cosmic-secret',
                { expiresIn: '7d' }
            );

            // Return user data without password
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    highScore: user.highScore,
                    totalGamesPlayed: user.totalGamesPlayed,
                    profilePicture: user.profilePicture,
                    settings: user.settings,
                    lastLogin: user.lastLogin
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                message: 'Server error during login',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            // Update last login
            await req.user.updateLastLogin();

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: req.user._id, 
                    username: req.user.username,
                    email: req.user.email
                },
                process.env.JWT_SECRET || 'cosmic-secret',
                { expiresIn: '7d' }
            );
            
            // Redirect to game with token and user data
            const userData = encodeURIComponent(JSON.stringify({
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                highScore: req.user.highScore,
                totalGamesPlayed: req.user.totalGamesPlayed,
                profilePicture: req.user.profilePicture
            }));

            res.redirect(`/game?token=${token}&user=${userData}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect('/login?error=auth_failed');
        }
    }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public
router.post('/logout', (req, res) => {
    res.json({ 
        message: 'Logout successful',
        success: true
    });
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                message: 'No token provided',
                valid: false
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cosmic-secret');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return res.status(403).json({ 
                message: 'Invalid token or user not found',
                valid: false
            });
        }

        res.json({
            valid: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                highScore: user.highScore,
                totalGamesPlayed: user.totalGamesPlayed,
                profilePicture: user.profilePicture,
                settings: user.settings
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(403).json({ 
            message: 'Invalid token',
            valid: false
        });
    }
});

module.exports = router;
