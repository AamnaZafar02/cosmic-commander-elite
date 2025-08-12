const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                message: 'Access token required',
                error: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cosmic-secret');
        
        // Get fresh user data from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(403).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ 
                message: 'Account deactivated',
                error: 'ACCOUNT_DEACTIVATED'
            });
        }

        req.user = {
            userId: user._id,
            username: user.username,
            email: user.email,
            userData: user
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                message: 'Invalid token',
                error: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                message: 'Token expired',
                error: 'TOKEN_EXPIRED'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Authentication error',
            error: 'AUTH_ERROR'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cosmic-secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
            req.user = {
                userId: user._id,
                username: user.username,
                email: user.email,
                userData: user
            };
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        req.user = null;
        next();
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required',
                error: 'AUTH_REQUIRED'
            });
        }

        const userRoles = req.user.userData.roles || ['user'];
        const hasRole = roles.some(role => userRoles.includes(role));
        
        if (!hasRole) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole
};
