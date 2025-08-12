const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Updated: Enhanced visibility and optimized performance - v4.0.0
// Import configurations and middleware
const connectDB = require('./backend/config/database');
require('./backend/config/passport');

// Import routes
const authRoutes = require('./backend/routes/auth');
const gameRoutes = require('./backend/routes/game');
const userRoutes = require('./backend/routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://cosmic-commander-elite.onrender.com', process.env.RENDER_EXTERNAL_URL] 
        : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'null'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'cosmic-commander-secret-key-' + Math.random(),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/cosmic-commander',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Serve game page
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'game.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Cosmic Commander Elite API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /auth/register',
                login: 'POST /auth/login',
                googleAuth: 'GET /auth/google',
                logout: 'POST /auth/logout',
                verify: 'GET /auth/verify'
            },
            game: {
                saveScore: 'POST /api/game/save-score',
                leaderboard: 'GET /api/game/leaderboard',
                userStats: 'GET /api/game/user-stats',
                globalStats: 'GET /api/game/global-stats',
                dailyChallenge: 'GET /api/game/daily-challenge'
            },
            users: {
                profile: 'GET /api/users/profile',
                updateProfile: 'PUT /api/users/profile',
                changePassword: 'PUT /api/users/change-password',
                publicProfile: 'GET /api/users/:userId/public',
                search: 'GET /api/users/search',
                deleteAccount: 'DELETE /api/users/account'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            message: 'Something went wrong!',
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
    
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: err.name || 'ServerError',
        stack: err.stack
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            message: 'API endpoint not found',
            error: 'NOT_FOUND'
        });
    }
    
    // For non-API routes, serve the main app
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cosmic Commander Elite Server`);
    console.log(`🌟 Server running on port ${PORT}`);
    console.log(`🎮 Game URL: http://localhost:${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ Ready for space combat!`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n🛑 Gracefully shutting down...');
    server.close(() => {
        console.log('💤 Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
