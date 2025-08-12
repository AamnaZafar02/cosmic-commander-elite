const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String,
        minlength: 6
    },
    googleId: { 
        type: String,
        sparse: true
    },
    profilePicture: { 
        type: String, 
        default: '' 
    },
    highScore: { 
        type: Number, 
        default: 0 
    },
    totalGamesPlayed: { 
        type: Number, 
        default: 0 
    },
    totalPlayTime: {
        type: Number,
        default: 0
    },
    achievements: [{
        name: String,
        description: String,
        unlockedAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        soundEnabled: {
            type: Boolean,
            default: true
        },
        musicEnabled: {
            type: Boolean,
            default: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'normal', 'hard'],
            default: 'normal'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ highScore: -1 });
userSchema.index({ googleId: 1 });

// Virtual for user's rank
userSchema.virtual('rank').get(function() {
    // This would need to be populated separately in queries
    return this._rank || null;
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Method to add achievement
userSchema.methods.addAchievement = function(name, description) {
    if (!this.achievements.some(achievement => achievement.name === name)) {
        this.achievements.push({ name, description });
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ highScore: -1 })
        .limit(limit)
        .select('username highScore profilePicture createdAt');
};

// Static method to get user rank
userSchema.statics.getUserRank = async function(userId) {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const rank = await this.countDocuments({
        highScore: { $gt: user.highScore },
        isActive: true
    }) + 1;
    
    return rank;
};

module.exports = mongoose.model('User', userSchema);
