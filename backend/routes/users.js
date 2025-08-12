const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
// Removed GameScore model usage
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validateProfileUpdate, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', 
    apiLimiter,
    authenticateToken,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.userId).select('-password');
            
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
            }

            const userRank = await User.getUserRank(user._id);
            // No recentGames, so return empty array or stats from user fields
            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    highScore: user.highScore,
                    totalGamesPlayed: user.totalGamesPlayed,
                    totalPlayTime: user.totalPlayTime,
                    profilePicture: user.profilePicture,
                    achievements: user.achievements,
                    settings: user.settings,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    rank: userRank
                },
                recentGames: []
            });

        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ 
                message: 'Error fetching profile',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
    apiLimiter,
    authenticateToken,
    validateProfileUpdate,
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            const updateData = req.body;

            // Remove sensitive fields that shouldn't be updated this way
            delete updateData.password;
            delete updateData.email; // Email updates require special verification
            delete updateData.highScore;
            delete updateData.totalGamesPlayed;
            delete updateData.achievements;

            // Check if username is being updated and is available
            if (updateData.username) {
                const existingUser = await User.findOne({ 
                    username: updateData.username,
                    _id: { $ne: userId }
                });
                
                if (existingUser) {
                    return res.status(400).json({ 
                        message: 'Username is already taken',
                        error: 'USERNAME_TAKEN'
                    });
                }
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
            }

            res.json({
                message: 'Profile updated successfully',
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
            console.error('Profile update error:', error);
            
            if (error.code === 11000) {
                return res.status(400).json({ 
                    message: 'Username is already taken',
                    error: 'USERNAME_TAKEN'
                });
            }
            
            res.status(500).json({ 
                message: 'Error updating profile',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password',
    apiLimiter,
    authenticateToken,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    message: 'Current password and new password are required',
                    error: 'MISSING_FIELDS'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    message: 'New password must be at least 6 characters long',
                    error: 'PASSWORD_TOO_SHORT'
                });
            }

            const user = await User.findById(req.user.userId);
            
            if (!user.password) {
                return res.status(400).json({ 
                    message: 'Cannot change password for OAuth users',
                    error: 'OAUTH_USER'
                });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ 
                    message: 'Current password is incorrect',
                    error: 'INVALID_CURRENT_PASSWORD'
                });
            }

            // Hash new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            user.password = hashedNewPassword;
            await user.save();

            res.json({
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ 
                message: 'Error changing password',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/users/:userId/public
// @desc    Get public user profile
// @access  Public
router.get('/:userId/public',
    apiLimiter,
    async (req, res) => {
        try {
            const userId = req.params.userId;
            
            const user = await User.findById(userId)
                .select('username highScore totalGamesPlayed profilePicture createdAt achievements');
            
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
            }

            const userRank = await User.getUserRank(userId);
            // No bestScores, so return empty array or just highScore
            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    highScore: user.highScore,
                    totalGamesPlayed: user.totalGamesPlayed,
                    profilePicture: user.profilePicture,
                    createdAt: user.createdAt,
                    rank: userRank,
                    achievements: user.achievements.slice(0, 5) // Show only first 5 achievements
                },
                bestScores: []
            });

        } catch (error) {
            console.error('Public profile error:', error);
            res.status(500).json({ 
                message: 'Error fetching public profile',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Public
router.get('/search',
    apiLimiter,
    async (req, res) => {
        try {
            const { q, limit = 10 } = req.query;
            
            if (!q || q.length < 2) {
                return res.status(400).json({ 
                    message: 'Search query must be at least 2 characters',
                    error: 'QUERY_TOO_SHORT'
                });
            }

            const users = await User.find({
                username: { $regex: q, $options: 'i' },
                isActive: true
            })
            .select('username highScore profilePicture')
            .limit(Math.min(parseInt(limit), 20))
            .sort({ highScore: -1 });

            res.json(users);

        } catch (error) {
            console.error('User search error:', error);
            res.status(500).json({ 
                message: 'Error searching users',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account',
    apiLimiter,
    authenticateToken,
    async (req, res) => {
        try {
            const { password } = req.body;
            const user = await User.findById(req.user.userId);

            // Verify password for regular users
            if (user.password && password) {
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(400).json({ 
                        message: 'Password is incorrect',
                        error: 'INVALID_PASSWORD'
                    });
                }
            }

            // Deactivate account instead of deleting
            user.isActive = false;
            user.email = `deleted_${Date.now()}_${user.email}`;
            user.username = `deleted_${Date.now()}_${user.username}`;
            await user.save();

            res.json({
                message: 'Account deactivated successfully'
            });

        } catch (error) {
            console.error('Account deactivation error:', error);
            res.status(500).json({ 
                message: 'Error deactivating account',
                error: 'SERVER_ERROR'
            });
        }
    }
);

module.exports = router;
