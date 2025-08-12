// Game Engine - Core game mechanics and rendering
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.enemyBullets = [];
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 0.4; // Much slower speed
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.enemySpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        
        // Performance optimization
        this.maxParticles = 150;
        this.cleanupTimer = 0;
        
        // Player power-ups
        this.doubleShot = false;
        this.doubleShotTime = 0;
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // Mobile touch controls
        this.touchControls = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false
        };
        
        this.initializeInput();
        this.setupStarField();
        this.initializeMobileControls();
    }

    initializeInput() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.isRunning) {
                this.shoot();
            }
        });

        // Touch input for mobile - DISABLED for button controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        
        // Disable direct canvas touch - use buttons instead
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default but don't move player
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default
        });
    }

    setupStarField() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: Math.random() * 3 + 1,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.initializePlayer();
        this.gameLoop();
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }

    reset() {
        this.bullets = [];
        this.enemies = [];
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.enemyBullets = [];
        this.enemySpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        this.doubleShot = false;
        this.doubleShotTime = 0;
        this.initializePlayer();
    }

    initializeMobileControls() {
        // Mobile touch buttons
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const fireBtn = document.getElementById('fireBtn');

        if (upBtn) {
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.up = true;
            });
            upBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.up = false;
            });
        }

        if (downBtn) {
            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.down = true;
            });
            downBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.down = false;
            });
        }

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.left = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.left = false;
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.right = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.right = false;
            });
        }

        if (fireBtn) {
            fireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.fire = true;
                if (this.isRunning) {
                    this.shoot();
                }
            });
            fireBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.fire = false;
            });
        }
    }

    initializePlayer() {
        this.player = {
            x: this.width / 2 - 25,
            y: this.height - 120,
            width: 50,
            height: 60,
            speed: 7,
            health: 3,
            maxHealth: 3,
            lastShot: 0,
            shootCooldown: 150,
            invulnerable: false,
            invulnerabilityTime: 0,
            thrustOffset: 0
        };
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap deltaTime to prevent large jumps and control speed
        if (this.deltaTime > 50) this.deltaTime = 50;
        if (this.deltaTime < 16) this.deltaTime = 16; // Minimum 16ms (60 FPS max)

        if (!this.isPaused) {
            // Apply game speed control
            this.update(this.deltaTime * this.gameSpeed);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateObstacles(deltaTime);
        this.updatePowerups(deltaTime);
        this.updateParticles(deltaTime);
        this.updateEnemyBullets(deltaTime);
        this.updateStars(deltaTime);
        this.updatePowerUpTimers(deltaTime);
        this.checkCollisions();
        this.spawnEnemies(deltaTime);
        this.spawnObstacles(deltaTime);
        this.spawnPowerups(deltaTime);
        
        // Performance cleanup every 5 seconds
        this.cleanupTimer += deltaTime;
        if (this.cleanupTimer > 5000) {
            this.cleanup();
            this.cleanupTimer = 0;
        }
    }

    updatePlayer(deltaTime) {
        if (!this.player) return;

        // Handle invulnerability
        if (this.player.invulnerable) {
            this.player.invulnerabilityTime -= deltaTime;
            if (this.player.invulnerabilityTime <= 0) {
                this.player.invulnerable = false;
            }
        }

        // Smooth keyboard and mobile movement
        let moveX = 0;
        let moveY = 0;

        // Keyboard controls
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveX = -1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveX = 1;
        }
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            moveY = -1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            moveY = 1;
        }

        // Mobile touch controls
        if (this.touchControls.left) {
            moveX = -1;
        }
        if (this.touchControls.right) {
            moveX = 1;
        }
        if (this.touchControls.up) {
            moveY = -1;
        }
        if (this.touchControls.down) {
            moveY = 1;
        }

        // Continuous fire for mobile
        if (this.touchControls.fire && this.isRunning) {
            this.shoot();
        }

        // Apply movement with bounds checking and deltaTime
        const moveSpeed = this.player.speed * (deltaTime * 0.03); // Ultra slow movement
        this.player.x += moveX * moveSpeed;
        this.player.y += moveY * moveSpeed;

        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.height - this.player.height, this.player.y));

        // Update thrust animation
        this.player.thrustOffset = Math.sin(Date.now() * 0.02) * 3;
    }

    updatePowerUpTimers(deltaTime) {
        if (this.doubleShot) {
            this.doubleShotTime -= deltaTime;
            if (this.doubleShotTime <= 0) {
                this.doubleShot = false;
            }
        }
    }

    shoot() {
        if (!this.player || !this.isRunning || this.isPaused) return;
        
        const currentTime = Date.now();
        if (currentTime - this.player.lastShot < this.player.shootCooldown) return;

        const centerX = this.player.x + this.player.width / 2;
        const startY = this.player.y;

        if (this.doubleShot) {
            // Double shot power-up
            this.bullets.push({
                x: centerX - 15,
                y: startY,
                width: 6,
                height: 20,
                speed: 10,
                damage: 1,
                type: 'double'
            });
            
            this.bullets.push({
                x: centerX + 9,
                y: startY,
                width: 6,
                height: 20,
                speed: 10,
                damage: 1,
                type: 'double'
            });
        } else {
            // Normal shot
            this.bullets.push({
                x: centerX - 3,
                y: startY,
                width: 6,
                height: 18,
                speed: 12,
                damage: 1,
                type: 'normal'
            });
        }

        this.player.lastShot = currentTime;

        // Add muzzle flash particles
        this.createParticles(centerX, startY, 3, '#00d4ff', 'small');

        if (window.gameManager) {
            window.gameManager.shotsFired++;
        }
    }

    updateBullets(deltaTime) {
        const speed = deltaTime * 0.5; // Normalize speed based on deltaTime
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed * speed;
            return bullet.y > -bullet.height;
        });
    }

    updateEnemyBullets(deltaTime) {
        const speed = deltaTime * 0.3; // Normalize speed based on deltaTime
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed * speed;
            return bullet.y < this.height + bullet.height;
        });
    }

    updateEnemies(deltaTime) {
        const speed = deltaTime * 0.15; // Normalize speed based on deltaTime
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed * speed;
            
            // Enemy shooting with deltaTime consideration
            enemy.shootTimer -= deltaTime;
            if (enemy.shootTimer <= 0 && enemy.y > 50 && enemy.y < this.height - 100) {
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 12,
                    speed: 8, // Fixed speed value
                    damage: 1
                });
                
                // Reset shoot timer with random interval
                enemy.shootTimer = 1000 + Math.random() * 2000;
            }
        });

        this.enemies = this.enemies.filter(enemy => enemy.y < this.height + enemy.height);
    }

    updateObstacles(deltaTime) {
        const speed = deltaTime * 0.12; // Normalize speed
        this.obstacles.forEach(obstacle => {
            obstacle.y += obstacle.speed * speed;
            obstacle.rotation += obstacle.rotationSpeed * deltaTime * 0.1;
        });

        this.obstacles = this.obstacles.filter(obstacle => obstacle.y < this.height + obstacle.size);
    }

    updatePowerups(deltaTime) {
        const speed = deltaTime * 0.1; // Normalize speed
        this.powerups.forEach(powerup => {
            powerup.y += powerup.speed * speed;
            powerup.rotation += 0.05 * deltaTime * 0.1;
        });

        this.powerups = this.powerups.filter(powerup => powerup.y < this.height + powerup.size);
    }

    updateParticles(deltaTime) {
        const speed = deltaTime * 0.08; // Normalize speed
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * speed;
            particle.y += particle.vy * speed;
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            return particle.life > 0;
        });
        
        // Limit particles to prevent slowdown
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }

    updateStars(deltaTime) {
        const speed = deltaTime * 0.05; // Normalize speed
        this.stars.forEach(star => {
            star.y += star.speed * speed;
            if (star.y > this.height) {
                star.y = -5;
                star.x = Math.random() * this.width;
            }
        });
    }

    spawnEnemies(deltaTime) {
        this.enemySpawnTimer += deltaTime;
        
        if (this.enemySpawnTimer > 3000) { // Spawn every 3 seconds (much slower)
            this.enemySpawnTimer = 0;
            
            const enemyType = Math.random();
            let enemy;
            
            if (enemyType < 0.7) {
                // Fast Scout (70% chance) - Fast but weak
                enemy = {
                    x: Math.random() * (this.width - 50),
                    y: -50,
                    width: 45,
                    height: 35,
                    speed: 3.5 + Math.random() * 2, // Fast: 3.5-5.5
                    health: 1,
                    type: 'alien_scout',
                    shootTimer: 1500 + Math.random() * 1000,
                    color: '#ff4444'
                };
            } else if (enemyType < 0.9) {
                // Medium Fighter (20% chance) - Balanced
                enemy = {
                    x: Math.random() * (this.width - 60),
                    y: -60,
                    width: 55,
                    height: 45,
                    speed: 2 + Math.random() * 1.5, // Medium: 2-3.5
                    health: 2,
                    type: 'alien_fighter',
                    shootTimer: 1000 + Math.random() * 1000,
                    color: '#ff6666'
                };
            } else {
                // Heavy Destroyer (10% chance) - Slow but strong
                enemy = {
                    x: Math.random() * (this.width - 80),
                    y: -80,
                    width: 75,
                    height: 60,
                    speed: 1 + Math.random() * 1, // Slow: 1-2
                    health: 3,
                    type: 'alien_destroyer',
                    shootTimer: 800 + Math.random() * 800,
                    color: '#ff8888'
                };
            }
            
            this.enemies.push(enemy);
        }
    }

    spawnObstacles(deltaTime) {
        this.obstacleSpawnTimer += deltaTime;
        
        if (this.obstacleSpawnTimer > 3000) { // Spawn every 3 seconds
            this.obstacleSpawnTimer = 0;
            
            const obstacleType = Math.random();
            let obstacle;
            
            if (obstacleType < 0.6) {
                // Small asteroid (60% chance) - Fast
                const size = Math.random() * 25 + 35;
                obstacle = {
                    x: Math.random() * (this.width - size),
                    y: -size,
                    size: size,
                    speed: 3 + Math.random() * 2, // Fast: 3-5
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.08,
                    type: 'asteroid_small',
                    health: 2
                };
            } else if (obstacleType < 0.85) {
                // Medium asteroid (25% chance) - Medium speed
                const size = Math.random() * 20 + 50;
                obstacle = {
                    x: Math.random() * (this.width - size),
                    y: -size,
                    size: size,
                    speed: 2 + Math.random() * 1.5, // Medium: 2-3.5
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.06,
                    type: 'asteroid_medium',
                    health: 3
                };
            } else {
                // Large asteroid (15% chance) - Slow but dangerous
                const size = Math.random() * 30 + 70;
                obstacle = {
                    x: Math.random() * (this.width - size),
                    y: -size,
                    size: size,
                    speed: 1 + Math.random() * 1, // Slow: 1-2
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.04,
                    type: 'asteroid_large',
                    health: 5
                };
            }
            
            this.obstacles.push(obstacle);
        }
    }

    spawnPowerups(deltaTime) {
        this.powerupSpawnTimer += deltaTime;
        
        if (this.powerupSpawnTimer > 12000) { // Spawn every 12 seconds (rare)
            this.powerupSpawnTimer = 0;
            
            const powerupType = Math.random();
            let powerup;
            
            if (powerupType < 0.6) {
                // Double shot star (60% of power-ups)
                powerup = {
                    x: Math.random() * (this.width - 30),
                    y: -30,
                    size: 25,
                    speed: 2.5, // Fixed speed
                    rotation: 0,
                    type: 'star',
                    collected: false,
                    glow: 0
                };
            } else {
                // Health heart (40% of power-ups, very rare overall)
                powerup = {
                    x: Math.random() * (this.width - 25),
                    y: -25,
                    size: 20,
                    speed: 2.5, // Fixed speed
                    rotation: 0,
                    type: 'heart',
                    collected: false,
                    pulse: 0
                };
            }
            
            this.powerups.push(powerup);
        }
    }

    checkCollisions() {
        // Bullet vs Enemy collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    // Remove bullet and damage enemy
                    this.bullets.splice(bulletIndex, 1);
                    enemy.health--;
                    
                    // Create hit particles
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 6, '#ffaa00', 'medium');
                    
                    if (enemy.health <= 0) {
                        // Create explosion particles
                        this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 12, '#ff4444', 'large');
                        this.enemies.splice(enemyIndex, 1);
                        
                        if (window.gameManager) {
                            let scoreValue = 10; // All aliens give 10 points
                            if (enemy.type === 'alien_advanced') scoreValue = 10;
                            if (enemy.type === 'alien_boss') scoreValue = 10;
                            
                            window.gameManager.addScore(scoreValue);
                            window.gameManager.aliensDefeated++;
                        }
                    }
                }
            });
        });

        // Bullet vs Obstacle collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            this.obstacles.forEach((obstacle, obstacleIndex) => {
                const obstacleRect = {
                    x: obstacle.x,
                    y: obstacle.y,
                    width: obstacle.size,
                    height: obstacle.size
                };
                
                if (this.isColliding(bullet, obstacleRect)) {
                    this.bullets.splice(bulletIndex, 1);
                    obstacle.health--;
                    
                    // Create impact particles
                    this.createParticles(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, 4, '#999999', 'small');
                    
                    if (obstacle.health <= 0) {
                        // Create destruction particles
                        this.createParticles(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, 8, '#666666', 'medium');
                        this.obstacles.splice(obstacleIndex, 1);
                        
                        if (window.gameManager) {
                            window.gameManager.addScore(5); // All obstacles give 5 points
                        }
                    }
                }
            });
        });

        // Player vs Enemy collisions
        if (this.player && !this.player.invulnerable) {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(this.player, enemy)) {
                    this.enemies.splice(enemyIndex, 1);
                    this.damagePlayer();
                }
            });
        }

        // Player vs Obstacle collisions
        if (this.player && !this.player.invulnerable) {
            this.obstacles.forEach((obstacle, obstacleIndex) => {
                const obstacleRect = {
                    x: obstacle.x,
                    y: obstacle.y,
                    width: obstacle.size,
                    height: obstacle.size
                };
                
                if (this.isColliding(this.player, obstacleRect)) {
                    this.damagePlayer();
                }
            });
        }

        // Player vs Enemy Bullets
        if (this.player && !this.player.invulnerable) {
            this.enemyBullets.forEach((bullet, bulletIndex) => {
                if (this.isColliding(this.player, bullet)) {
                    this.enemyBullets.splice(bulletIndex, 1);
                    this.damagePlayer();
                }
            });
        }

        // Player vs Powerups
        if (this.player) {
            this.powerups.forEach((powerup, powerupIndex) => {
                const powerupRect = {
                    x: powerup.x,
                    y: powerup.y,
                    width: powerup.size,
                    height: powerup.size
                };
                
                if (this.isColliding(this.player, powerupRect)) {
                    this.powerups.splice(powerupIndex, 1);
                    this.collectPowerup(powerup);
                }
            });
        }
    }

    collectPowerup(powerup) {
        // Create collection particles
        this.createParticles(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2, 8, '#00ff88', 'medium');
        
        // Add 10 points for collecting any powerup
        if (window.gameManager) {
            window.gameManager.addScore(10);
        }
        
        if (powerup.type === 'star') {
            this.doubleShot = true;
            this.doubleShotTime = 10000; // 10 seconds
            
            if (window.gameManager) {
                window.gameManager.showPowerupMessage('Double Shot Activated! +10 points');
            }
        } else if (powerup.type === 'heart') {
            if (this.player.health < this.player.maxHealth) {
                this.player.health++;
                
                if (window.gameManager) {
                    window.gameManager.updateLives(this.player.health);
                    window.gameManager.showPowerupMessage('Health Restored! +10 points');
                }
            } else {
                if (window.gameManager) {
                    window.gameManager.showPowerupMessage('Health Full! +10 points');
                }
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    damagePlayer() {
        if (!this.player || this.player.invulnerable) return;

        this.player.health--;
        this.player.invulnerable = true;
        this.player.invulnerabilityTime = 2000; // 2 seconds

        // Create damage particles
        this.createParticles(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            15,
            '#ff4444',
            'large'
        );

        if (window.gameManager) {
            window.gameManager.updateLives(this.player.health);
            
            if (this.player.health <= 0) {
                window.gameManager.gameOver();
            }
        }
    }

    createParticles(x, y, count, color, size = 'medium') {
        const sizeMultiplier = size === 'small' ? 0.5 : size === 'large' ? 1.5 : 1;
        const speedMultiplier = size === 'small' ? 0.7 : size === 'large' ? 1.3 : 1;
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 8 * speedMultiplier,
                vy: (Math.random() - 0.5) * 8 * speedMultiplier,
                life: 800 + Math.random() * 400,
                maxLife: 1200,
                alpha: 1,
                color: color,
                size: (Math.random() * 3 + 2) * sizeMultiplier
            });
        }
    }

    cleanup() {
        // Remove off-screen entities to prevent memory issues
        this.enemies = this.enemies.filter(enemy => 
            enemy.y > -100 && enemy.y < this.height + 100
        );
        
        this.obstacles = this.obstacles.filter(obstacle => 
            obstacle.y > -obstacle.size && obstacle.y < this.height + obstacle.size
        );
        
        this.powerups = this.powerups.filter(powerup => 
            powerup.y > -50 && powerup.y < this.height + 50
        );
        
        this.bullets = this.bullets.filter(bullet => 
            bullet.y > -bullet.height && bullet.y < this.height
        );
        
        this.enemyBullets = this.enemyBullets.filter(bullet => 
            bullet.y > -bullet.height && bullet.y < this.height + bullet.height
        );
        
        // Limit particles to prevent slowdown
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
    }

    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(0, 8, 20, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw stars
        this.renderStars();

        // Draw game objects
        this.renderPlayer();
        this.renderBullets();
        this.renderEnemies();
        this.renderObstacles();
        this.renderPowerups();
        this.renderEnemyBullets();
        this.renderParticles();

        // Draw pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.font = 'bold 48px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#00d4ff';
            this.ctx.shadowBlur = 20;
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            this.ctx.shadowBlur = 0;
        }
    }

    renderStars() {
        this.stars.forEach(star => {
            this.ctx.save();
            star.twinkle += 0.1;
            star.opacity = 0.3 + Math.sin(star.twinkle) * 0.3;
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = star.size;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
            this.ctx.restore();
        });
    }

    renderPlayer() {
        if (!this.player) return;

        this.ctx.save();
        
        // Flashing effect when invulnerable
        if (this.player.invulnerable) {
            this.ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        }

        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        this.ctx.translate(centerX, centerY);
        
        // Engine thrust
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.shadowColor = '#ffaa00';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, this.player.height / 2 - 5);
        this.ctx.lineTo(0, this.player.height / 2 + 15 + this.player.thrustOffset);
        this.ctx.lineTo(12, this.player.height / 2 - 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Blue inner thrust
        this.ctx.fillStyle = '#00aaff';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(-6, this.player.height / 2 - 2);
        this.ctx.lineTo(0, this.player.height / 2 + 8 + this.player.thrustOffset);
        this.ctx.lineTo(6, this.player.height / 2 - 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Main rocket body
        this.ctx.shadowColor = '#00d4ff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 3, this.player.height / 3);
        this.ctx.lineTo(this.player.width / 3, this.player.height / 3);
        this.ctx.closePath();
        this.ctx.fill();

        // Add rocket emoji (clear, no background)
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🚀', 0, -5);

        // Rocket nose cone
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-8, -this.player.height / 4);
        this.ctx.lineTo(8, -this.player.height / 4);
        this.ctx.closePath();
        this.ctx.fill();

        // Side fins
        this.ctx.fillStyle = '#0088cc';
        this.ctx.fillRect(-this.player.width / 2, 0, 8, 20);
        this.ctx.fillRect(this.player.width / 2 - 8, 0, 8, 20);
        
        // Cockpit window
        this.ctx.fillStyle = '#88ddff';
        this.ctx.shadowBlur = 3;
        this.ctx.fillRect(-4, -10, 8, 12);

        this.ctx.restore();
    }

    renderBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            
            if (bullet.type === 'double') {
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.shadowColor = '#ffaa00';
            } else {
                this.ctx.fillStyle = '#00d4ff';
                this.ctx.shadowColor = '#00d4ff';
            }
            
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Add bullet emoji (clear, no background)
            this.ctx.shadowBlur = 0;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚡', bullet.x + bullet.width/2, bullet.y + bullet.height/2);
            
            // Add energy trail
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillRect(bullet.x - 1, bullet.y + bullet.height, bullet.width + 2, 8);
            
            this.ctx.restore();
        });
    }

    renderEnemyBullets() {
        this.enemyBullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.fillStyle = '#ff4444';
            this.ctx.shadowColor = '#ff4444';
            this.ctx.shadowBlur = 6;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Add energy trail
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(bullet.x - 1, bullet.y - 8, bullet.width + 2, 8);
            
            this.ctx.restore();
        });
    }

    renderEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height / 2;
            this.ctx.translate(centerX, centerY);
            
            if (enemy.type === 'alien_basic') {
                // Basic alien - simple design with clear emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('👽', 0, 0);
                
            } else if (enemy.type === 'alien_advanced') {
                // Advanced alien - clear emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('👾', 0, 0);
                
            } else if (enemy.type === 'alien_boss') {
                // Boss alien - clear emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 34px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🛸', 0, 0);
            }
            
            this.ctx.restore();
        });
    }

    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            const centerX = obstacle.x + obstacle.size / 2;
            const centerY = obstacle.y + obstacle.size / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(obstacle.rotation);
            
            if (obstacle.type === 'asteroid_small') {
                // Small asteroid - clear emoji only
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 26px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🪨', 0, 0);
                
            } else if (obstacle.type === 'asteroid_large') {
                // Large asteroid - clear emoji only
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('☄️', 0, 0);
                
            } else {
                // Default asteroid - clear emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🌑', 0, 0);
            }
            
            this.ctx.restore();
        });
    }

    renderPowerups() {
        this.powerups.forEach(powerup => {
            this.ctx.save();
            const centerX = powerup.x + powerup.size / 2;
            const centerY = powerup.y + powerup.size / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(powerup.rotation);
            
            if (powerup.type === 'star') {
                // Star power-up - clear emoji only
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⭐', 0, 0);
                
            } else if (powerup.type === 'heart') {
                // Heart power-up - clear emoji only
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('❤️', 0, 0);
                
                // Add pulse effect
                const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                this.ctx.scale(pulseScale, pulseScale);
                
            } else {
                // Default power-up - clear emoji
                this.ctx.shadowBlur = 0;
                this.ctx.font = 'bold 26px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('✨', 0, 0);
            }
            
            this.ctx.restore();
        });
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            this.ctx.restore();
        });
    }
}
