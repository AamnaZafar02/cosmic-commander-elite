const express = require('express');
const User = require('../models/User');
// Removed GameScore model usage
const { authenticateToken } = require('../middleware/auth');
const { scoreLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { validateScore, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/game/save-score
// @desc    Save game score
// @access  Private
// (Removed duplicate router.post('/save-score', ...) definition)
router.post('/save-score', 
    scoreLimiter,
    authenticateToken,
    validateScore,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { 
                score, 
                aliensDefeated = 0, 
                levelReached = 1, 
                survivalTime = 0, 
                accuracy = 0,
                shotsFired = 0,
                shotsHit = 0,
                powerupsCollected = 0,
                maxCombo = 1,
                gameMode = 'normal',
                difficulty = 'normal'
            } = req.body;
            
            const userId = req.user.userId;

            // Validate score is reasonable (anti-cheat basic check)
            const maxReasonableScore = levelReached * 10000 + aliensDefeated * 200;
            if (score > maxReasonableScore) {
                return res.status(400).json({ 
                    message: 'Score appears to be invalid',
                    error: 'INVALID_SCORE'
                });
            }

            // Update user's highScore and stats directly
            const user = await User.findById(userId);
            let isNewHighScore = false;
            if (user) {
                if (score > (user.highScore || 0)) {
                    user.highScore = score;
                    user.aliensDefeated = Math.max(user.aliensDefeated || 0, aliensDefeated);
                    user.levelReached = Math.max(user.levelReached || 1, levelReached);
                    user.survivalTime = Math.max(user.survivalTime || 0, survivalTime);
                    user.accuracy = Math.max(user.accuracy || 0, accuracy);
                    user.shotsFired = Math.max(user.shotsFired || 0, shotsFired);
                    user.shotsHit = Math.max(user.shotsHit || 0, shotsHit);
                    user.powerupsCollected = Math.max(user.powerupsCollected || 0, powerupsCollected);
                    user.maxCombo = Math.max(user.maxCombo || 1, maxCombo);
                    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
                    user.totalScore = (user.totalScore || 0) + score;
                    isNewHighScore = true;
                    await user.save();
                } else {
                    // Always increment games played and total score
                    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
                    user.totalScore = (user.totalScore || 0) + score;
                    await user.save();
                }
            }

            res.json({ 
                message: 'Score saved successfully',
                newHighScore: isNewHighScore
            });
// (Removed duplicate catch block and closing braces)

        } catch (error) {
            console.error('Save score error:', error);
            res.status(500).json({ 
                message: 'Error saving score',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/game/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/leaderboard', 
    apiLimiter,
    async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);
            console.log(`Fetching leaderboard with limit: ${limit}`);
            
            const leaderboard = await User.getLeaderboard(limit);
            console.log(`Leaderboard fetched: ${leaderboard.length} users`);
            console.log('Leaderboard data:', leaderboard.map(u => ({ 
                username: u.username, 
                highScore: u.highScore, 
                id: u._id 
            })));
            
            res.json(leaderboard);
        } catch (error) {
            console.error('Leaderboard error:', error);
            res.status(500).json({ 
                message: 'Error fetching leaderboard',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/game/user-stats/:userId
// @desc    Get user statistics
// @access  Private
router.get('/user-stats/:userId', 
    apiLimiter,
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.params.userId;
            
            // Ensure user can only access their own stats or is admin
            if (userId !== req.user.userId.toString()) {
                return res.status(403).json({ 
                    message: 'Access denied',
                    error: 'ACCESS_DENIED'
                });
            }

            const user = await User.findById(userId).select('-password');
            const userRank = await User.getUserRank(userId);
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
            }
            // No recentGames or bestScores, so return empty arrays and stats from user fields
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
                    rank: userRank
                },
                recentGames: [],
                bestScores: [],
                statistics: {
                    averageScore: user.highScore || 0,
                    averageAccuracy: user.accuracy || 0,
                    averageSurvivalTime: user.survivalTime || 0
                }
            });

        } catch (error) {
            console.error('User stats error:', error);
            res.status(500).json({ 
                message: 'Error fetching user statistics',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/game/daily-challenge
// @desc    Get daily challenge information
// @access  Public
router.get('/daily-challenge', 
    apiLimiter,
    async (req, res) => {
        try {
            const today = new Date();
            // No dailyStats, so return default stats
            // Generate daily challenge based on date
            const challengeTypes = [
                {
                    name: 'Alien Exterminator',
                    description: 'Destroy 50 aliens without taking damage',
                    target: 50,
                    type: 'aliensDefeated'
                },
                {
                    name: 'Survival Master',
                    description: 'Survive for 300 seconds',
                    target: 300,
                    type: 'survivalTime'
                },
                {
                    name: 'Precision Strike',
                    description: 'Achieve 85% accuracy or higher',
                    target: 85,
                    type: 'accuracy'
                },
                {
                    name: 'Score Hunter',
                    description: 'Reach a score of 5000 points',
                    target: 5000,
                    type: 'score'
                }
            ];

            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const todayChallenge = challengeTypes[dayOfYear % challengeTypes.length];

            res.json({
                challenge: todayChallenge,
                date: today.toISOString().split('T')[0],
                dailyStats: {
                    gamesPlayed: 0,
                    totalScore: 0,
                    avgScore: 0,
                    uniquePlayers: 0
                }
            });

        } catch (error) {
            console.error('Daily challenge error:', error);
            res.status(500).json({ 
                message: 'Error fetching daily challenge',
                error: 'SERVER_ERROR'
            });
        }
    }
);

// @route   GET /api/game/global-stats
// @desc    Get global game statistics
// @access  Public
router.get('/global-stats', 
    apiLimiter,
    async (req, res) => {
        try {
            // No globalStats, so return default stats
            res.json({
                totalGames: 0,
                totalPlayers: await User.countDocuments({ isActive: true }),
                totalScore: globalStats.totalScore || 0,
                totalAliensDefeated: globalStats.totalAliensDefeated || 0,
                averageScore: Math.round(globalStats.avgScore || 0),
                averageAccuracy: Math.round(globalStats.avgAccuracy || 0),
                averageSurvivalTime: Math.round(globalStats.avgSurvivalTime || 0),
                highestScore: globalStats.highestScore || 0,
                longestSurvival: globalStats.longestSurvival || 0,
                highestLevel: globalStats.highestLevel || 1,
                lastUpdated: new Date()
            });

        } catch (error) {
            console.error('Global stats error:', error);
            res.status(500).json({ 
                message: 'Error fetching global statistics',
                error: 'SERVER_ERROR'
            });
        }
    }
);

module.exports = router;
