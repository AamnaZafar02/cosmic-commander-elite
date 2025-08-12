// Game Manager - Handles UI, scoring, and game state
class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new GameEngine(this.canvas);
        this.authManager = null;
        
        // Game statistics
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.startTime = 0;
        this.gameTime = 0;
        this.aliensDefeated = 0;
        this.shotsFired = 0;
        this.accuracy = 0;
        this.combo = 1;
        
        // Daily challenge
        this.dailyChallenge = {
            description: "Destroy 50 aliens without taking damage",
            progress: 0,
            target: 50,
            completed: false
        };
        
        this.initializeEventListeners();
        this.updateUI();
        
        // Initialize auth manager
        this.authManager = new GameAuthManager();
        window.gameAuthManager = this.authManager;
        
        // Load leaderboard after auth manager is initialized
        this.loadLeaderboard();
    }

    initializeEventListeners() {
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });

        // Game over modal buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            console.log("Play Again clicked");
            this.hideModal('gameOverModal');
            this.resetGame();
            setTimeout(() => {
                this.startGame();
            }, 100);
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.hideModal('gameOverModal');
            window.location.href = '/';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.engine.isRunning && !this.isGameOver) {
                    this.pauseGame();
                }
            }
        });
    }

    startGame() {
        this.resetGame();
        this.engine.start();
        
        // FORCE ENEMIES TO SPAWN INITIALLY - BALANCED SPAWN
        for (let i = 0; i < 4; i++) {
            this.engine.forceEnemySpawn();
        }
        
        // Setup continuous enemy spawning
        this.enemySpawnInterval = setInterval(() => {
            if (this.engine && this.engine.isRunning && !this.engine.isPaused) {
                // Only spawn if there aren't too many enemies already
                if (this.engine.enemies.length < 8) {
                    this.engine.forceEnemySpawn();
                    console.log("INTERVAL FORCE SPAWN");
                }
            }
        }, 1200); // More balanced spawn rate
        
        this.startTime = Date.now();
        this.gameTime = 0;
        this.isGameOver = false;
        
        // Update UI
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'block';
        
        // Start game timer
        this.gameTimer = setInterval(() => {
            if (!this.engine.isPaused && this.engine.isRunning) {
                this.gameTime = Date.now() - this.startTime;
                this.updateTimeDisplay();
                this.updateAccuracy();
            }
        }, 100);
    }

    pauseGame() {
        this.engine.pause();
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.engine.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> RESUME';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        }
    }

    resetGame() {
        console.log("RESET GAME CALLED");
        // Reset game statistics
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.aliensDefeated = 0;
        this.shotsFired = 0;
        this.accuracy = 0;
        this.combo = 1;
        
        // Reset daily challenge
        this.dailyChallenge.progress = 0;
        this.dailyChallenge.completed = false;
        
        // Reset engine properly with complete reload
        this.engine.stop();
        this.engine.reset();
        this.engine = new GameEngine(document.getElementById('gameCanvas'));
        this.engine.initializePlayer();
        
        // Clear all timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval);
            this.enemySpawnInterval = null;
        }
        
        // Hide game over screen
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }
        
        this.updateUI();
    }

    gameOver() {
        this.engine.stop();
        this.isGameOver = true;
        
        // Clear all timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval);
            this.enemySpawnInterval = null;
        }
        
        // Calculate final stats
        const survivalTime = Math.floor(this.gameTime / 1000);
        const finalAccuracy = this.shotsFired > 0 ? Math.round((this.aliensDefeated / this.shotsFired) * 100) : 0;
        
        // Update final stats in modal
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalAliens').textContent = this.aliensDefeated;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalTime').textContent = this.formatTime(survivalTime);
        document.getElementById('finalAccuracy').textContent = finalAccuracy + '%';
        
        // Save score if logged in
        if (this.authManager && this.authManager.isLoggedIn()) {
            this.saveScore({
                score: this.score,
                aliensDefeated: this.aliensDefeated,
                levelReached: this.level,
                survivalTime: survivalTime,
                accuracy: finalAccuracy
            });
        }
        
        // Show game over modal
        this.showModal('gameOverModal');
        
        // Update UI
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'none';
        
        // Reload leaderboard
        setTimeout(() => {
            this.loadLeaderboard();
        }, 1000);
    }

    async saveScore(gameData) {
        if (this.authManager) {
            await this.authManager.saveScore(gameData);
        }
    }

    addScore(points) {
        this.score += points * this.combo;
        this.updateScoreDisplay();
        
        // Update combo
        this.combo = Math.min(this.combo + 0.1, 5);
        this.updateComboDisplay();
        
        // Check for level up
        if (this.score > this.level * 100) {
            this.levelUp();
        }
        
        // Update daily challenge
        if (this.dailyChallenge.progress < this.dailyChallenge.target) {
            this.dailyChallenge.progress++;
            this.updateDailyChallengeDisplay();
        }
    }

    levelUp() {
        this.level++;
        this.updateLevelDisplay();
        
        // Increase game difficulty gradually
        this.engine.gameSpeed += 0.15; // Increase speed more noticeably per level
        
        // Increase spawn rates (make enemies and obstacles spawn faster)
        if (this.engine.enemySpawnRate) {
            this.engine.enemySpawnRate = Math.max(1000, this.engine.enemySpawnRate - 100); // Spawn faster but not too fast
        }
        if (this.engine.obstacleSpawnRate) {
            this.engine.obstacleSpawnRate = Math.max(2000, this.engine.obstacleSpawnRate - 150); // Spawn faster
        }
        
        // Show level up notification
        if (this.authManager) {
            this.authManager.showSuccess(`🎉 LEVEL ${this.level} REACHED! Speed: ${this.engine.gameSpeed.toFixed(1)}x`);
        }
        
        console.log(`Level ${this.level} reached! Game Speed: ${this.engine.gameSpeed.toFixed(2)}x`);
    }

    updateLives(newLives) {
        this.lives = newLives;
        this.updateLivesDisplay();
        
        // Reset combo on damage
        this.combo = 1;
        this.updateComboDisplay();
    }

    updateUI() {
        this.updateScoreDisplay();
        this.updateLivesDisplay();
        this.updateLevelDisplay();
        this.updateTimeDisplay();
        this.updateAccuracyDisplay();
        this.updateComboDisplay();
        this.updateDailyChallengeDisplay();
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = this.score.toLocaleString();
        }
    }

    updateLivesDisplay() {
        const livesElement = document.getElementById('livesValue');
        if (livesElement) {
            livesElement.textContent = this.lives;
        }
    }

    updateLevelDisplay() {
        const levelElement = document.getElementById('levelValue');
        if (levelElement) {
            levelElement.textContent = this.level;
        }
    }

    updateTimeDisplay() {
        const timeElement = document.getElementById('timeValue');
        if (timeElement) {
            const seconds = Math.floor(this.gameTime / 1000);
            timeElement.textContent = this.formatTime(seconds);
        }
    }

    updateAccuracyDisplay() {
        const accuracyElement = document.getElementById('accuracyValue');
        if (accuracyElement) {
            this.accuracy = this.shotsFired > 0 ? Math.round((this.aliensDefeated / this.shotsFired) * 100) : 0;
            accuracyElement.textContent = this.accuracy + '%';
        }
    }

    updateComboDisplay() {
        const comboElement = document.getElementById('comboValue');
        if (comboElement) {
            comboElement.textContent = 'x' + this.combo.toFixed(1);
        }
    }

    updateDailyChallengeDisplay() {
        const progressElement = document.getElementById('challengeProgress');
        if (progressElement) {
            progressElement.textContent = `${this.dailyChallenge.progress}/${this.dailyChallenge.target}`;
        }
    }

    updateAccuracy() {
        this.updateAccuracyDisplay();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async loadLeaderboard() {
        try {
            console.log('GameManager: Loading leaderboard...');
            let leaderboard = [];
            
            if (this.authManager) {
                leaderboard = await this.authManager.loadLeaderboard();
                console.log('GameManager: Received leaderboard data:', leaderboard);
            } else {
                console.log('GameManager: AuthManager not available');
            }
            
            this.updateLeaderboardDisplay(leaderboard);
        } catch (error) {
            console.error('GameManager: Error loading leaderboard:', error);
        }
    }

    updateLeaderboardDisplay(leaderboard) {
        console.log('GameManager: Updating leaderboard display with:', leaderboard);
        const leaderboardElement = document.getElementById('leaderboard');
        if (!leaderboardElement) {
            console.error('GameManager: Leaderboard element not found');
            return;
        }

        const ranks = ['🥇', '🥈', '🥉'];
        const leaderCards = leaderboardElement.querySelectorAll('.leader-card');
        console.log('GameManager: Found', leaderCards.length, 'leader cards');

        leaderCards.forEach((card, index) => {
            const rankElement = card.querySelector('.leader-rank');
            const nameElement = card.querySelector('.leader-name');
            const scoreElement = card.querySelector('.leader-score');

            if (leaderboard[index]) {
                console.log(`GameManager: Setting position ${index + 1}:`, leaderboard[index]);
                rankElement.textContent = ranks[index];
                nameElement.textContent = leaderboard[index].username;
                scoreElement.textContent = leaderboard[index].highScore.toLocaleString();
            } else {
                console.log(`GameManager: No data for position ${index + 1}, setting default`);
                rankElement.textContent = ranks[index];
                nameElement.textContent = 'No Record';
                scoreElement.textContent = '0';
            }
        });

        // Update user rank
        if (this.authManager && this.authManager.isLoggedIn()) {
            const user = this.authManager.getUser();
            const userRank = leaderboard.findIndex(player => player._id === user.id) + 1;
            const rankElement = document.getElementById('userRank');
            if (rankElement) {
                rankElement.textContent = userRank > 0 ? `#${userRank}` : '#--';
                console.log('GameManager: Set user rank to:', userRank > 0 ? `#${userRank}` : '#--');
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showPowerupMessage(message) {
        if (this.authManager) {
            this.authManager.showSuccess(message);
        } else {
            // Fallback if no auth manager
            console.log('Power-up collected:', message);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
