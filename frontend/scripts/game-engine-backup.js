// Game Engine - Core game mechanics and rendering
// Updated: v4.0.1 - Fixed emoji rendering, optimized performance, perfect speed balance
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
        this.gameSpeed = 1.0; // Perfect smooth speed - MATCHED WITH LOCALHOST
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60; // Smooth 60 FPS
        this.frameTime = 1000 / this.targetFPS;
        this.enemySpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        
        // Performance optimization for live servers
        this.maxParticles = 50; // Reduced particle count for better performance
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
        // Mobile touch buttons (2-button system: MOVE and FIRE)
        const moveBtn = document.getElementById('moveBtn');
        const fireBtn = document.getElementById('fireBtn');
        
        // Touch state for movement direction
        this.moveDirection = 0; // -1 for left, 1 for right, 0 for none
        this.lastMoveTime = 0;

        if (moveBtn) {
            let moveStartX = 0;
            
            moveBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveStartX = e.touches[0].clientX;
                this.touchControls.moving = true;
            });
            
            moveBtn.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (this.touchControls.moving) {
                    const currentX = e.touches[0].clientX;
                    const deltaX = currentX - moveStartX;
                    
                    // Determine movement direction based on swipe
                    if (Math.abs(deltaX) > 20) { // Minimum swipe distance
                        if (deltaX > 0) {
                            this.touchControls.left = false;
                            this.touchControls.right = true;
                        } else {
                            this.touchControls.left = true;
                            this.touchControls.right = false;
                        }
                    }
                }
            });
            
            moveBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls.moving = false;
                this.touchControls.left = false;
                this.touchControls.right = false;
            });
            
            // Alternative tap-based movement for easier use
            moveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentTime = Date.now();
                
                // Toggle between left and right movement on tap
                if (currentTime - this.lastMoveTime > 300) {
                    this.moveDirection = this.moveDirection === 1 ? -1 : 1;
                    this.lastMoveTime = currentTime;
                    
                    // Apply movement for a short duration
                    if (this.moveDirection === 1) {
                        this.touchControls.right = true;
                        setTimeout(() => { this.touchControls.right = false; }, 200);
                    } else {
                        this.touchControls.left = true;
                        setTimeout(() => { this.touchControls.left = false; }, 200);
                    }
                }
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
            speed: 5.5, // Increased speed to match enemies
            health: 3,
            maxHealth: 3,
            lastShot: 0,
            shootCooldown: 250, // Normal balanced shooting speed
            invulnerable: false,
            invulnerabilityTime: 0,
            thrustOffset: 0
        };
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // EXACT LOCALHOST SPEED: Fixed and consistent deltaTime 
        // This ensures the exact same performance as localhost (port 5000)
        if (this.deltaTime > 30) this.deltaTime = 16; // Cap at 60fps equivalent
        if (this.deltaTime < 10) this.deltaTime = 16; // Minimum consistent time
        
        // Fixed timestep for perfect speed matching with localhost
        const fixedDeltaTime = 16; // Fixed 60fps timestep

        if (!this.isPaused) {
            // Use fixed timestep for consistent movement matching localhost
            this.update(fixedDeltaTime);
        }
        
        // Enable smoothing for better visuals
        this.ctx.imageSmoothingEnabled = true;
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
        
        // Performance cleanup every 3 seconds (more frequent)
        this.cleanupTimer += deltaTime;
        if (this.cleanupTimer > 3000) {
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

        // Smooth horizontal movement only (no vertical movement)
        let moveX = 0;

        // Keyboard controls (left/right only)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveX = -1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveX = 1;
        }

        // Mobile touch controls (left/right only)
        if (this.touchControls.left) {
            moveX = -1;
        }
        if (this.touchControls.right) {
            moveX = 1;
        }

        // Continuous fire for mobile or spacebar
        if ((this.touchControls.fire || this.keys['Space']) && this.isRunning) {
            this.shoot();
        }

        // MATCHED WITH LOCALHOST: Perfect movement speed
        const moveSpeed = this.player.speed * (deltaTime * 0.25); // Exact movement speed matching localhost
        this.player.x += moveX * moveSpeed;

        // Keep player within horizontal bounds only
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));

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
                speed: 15, // Faster double shot bullets
                damage: 1,
                type: 'double'
            });
            
            this.bullets.push({
                x: centerX + 9,
                y: startY,
                width: 6,
                height: 20,
                speed: 15, // Faster double shot bullets
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
                speed: 12, // Much faster normal bullets
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
        const speed = deltaTime * 0.22; // MATCHED WITH LOCALHOST: Exact bullet speed
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed * speed;
            return bullet.y > -bullet.height;
        });
    }

    updateEnemyBullets(deltaTime) {
        const speed = deltaTime * 0.28; // MATCHED WITH LOCALHOST: Exact enemy bullet speed
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed * speed;
            return bullet.y < this.height + bullet.height;
        });
    }

    updateEnemies(deltaTime) {
        const speed = deltaTime * 0.22; // MATCHED WITH LOCALHOST: Exact enemy movement speed
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
                    speed: 12, // Much faster enemy bullets for proper challenge
                    damage: 1
                });
                
                // Reset shoot timer with longer random interval
                enemy.shootTimer = 2000 + Math.random() * 3000;
            }
        });

        this.enemies = this.enemies.filter(enemy => enemy.y < this.height + enemy.height);
    }

    updateObstacles(deltaTime) {
        const speed = deltaTime * 0.22; // MATCHED WITH LOCALHOST: Exact obstacle speed
        this.obstacles.forEach(obstacle => {
            obstacle.y += obstacle.speed * speed;
            obstacle.rotation += obstacle.rotationSpeed * deltaTime * 0.1;
        });

        this.obstacles = this.obstacles.filter(obstacle => obstacle.y < this.height + obstacle.size);
    }

    updatePowerups(deltaTime) {
        const speed = deltaTime * 0.22; // MATCHED WITH LOCALHOST: Exact powerup speed
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

    forceEnemySpawn() {
        // Function to force enemy spawn - called at game start
        const enemyType = Math.random();
        this.createEnemy(enemyType);
        console.log("FORCE SPAWNED ENEMY");
    }
    
    spawnEnemies(deltaTime) {
        // OPTIMIZED ENEMY SPAWN SYSTEM for live performance
        this.enemySpawnTimer += deltaTime * 1.5; // Reduced spawn frequency
        
        // Limit enemy count for better performance
        if (this.enemySpawnTimer > 2000 && this.enemies.length < 6) { // Reduced max enemies
            this.enemySpawnTimer = 0;
            
            const enemyType = Math.random();
            this.createEnemy(enemyType);
            console.log("SPAWNING ENEMY");
        }
    }
    
    createEnemy(enemyType) {
            // enemyType is passed from calling function
            let enemy;
            
            // Ensure enemies are spread out horizontally for better gameplay
            // Divide canvas into 5 sections and randomly place in one section
            const section = Math.floor(Math.random() * 5);
            const sectionWidth = this.width / 5;
            const xPosition = (section * sectionWidth) + (Math.random() * (sectionWidth - 40));
            
            if (enemyType < 0.7) {
                // Small Alien (70% chance) - Small and fast
                enemy = {
                    x: xPosition,
                    y: -30,
                    width: 25, // Small size
                    height: 20,
                    speed: 2 + Math.random() * 1, // 2-3 speed
                    health: 1,
                    type: 'alien_small',
                    shootTimer: 2000 + Math.random() * 2000,
                    color: '#ff4444'
                };
            } else if (enemyType < 0.9) {
                // Fast Small Alien (20% chance) - Same size, faster
                enemy = {
                    x: xPosition,
                    y: -30,
                    width: 25, // Same small size
                    height: 20,
                    speed: 3 + Math.random() * 1.5, // 3-4.5 speed (faster)
                    health: 1,
                    type: 'alien_fast',
                    shootTimer: 1800 + Math.random() * 1500, // Faster shooting
                    color: '#ff6666'
                };
            } else {
                // Obstacle Enemy (10% chance) - Moving obstacles
                enemy = {
                    x: xPosition,
                    y: -40,
                    width: 30, // Small size
                    height: 25,
                    speed: 1.5 + Math.random() * 1, // 1.5-2.5 speed
                    health: 1, // Reduced health
                    type: 'obstacle_enemy',
                    shootTimer: 3000 + Math.random() * 2000,
                    color: '#ff8888',
                    rotation: 0,
                    rotationSpeed: 0.02
                };
            }
            
            this.enemies.push(enemy);
    }

    spawnObstacles(deltaTime) {
        this.obstacleSpawnTimer += deltaTime;
        
        if (this.obstacleSpawnTimer > 4000) { // Reduced frequency for performance
            this.obstacleSpawnTimer = 0;
            
            const obstacleType = Math.random();
            let obstacle;
            
            if (obstacleType < 0.8) {
                // Small asteroid (80% chance) - Fast and simple
                const size = Math.random() * 15 + 25; // Smaller for performance
                obstacle = {
                    x: Math.random() * (this.width - size),
                    y: -size,
                    size: size,
                    speed: 2.5 + Math.random() * 1.5, // 2.5-4
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.05,
                    type: 'asteroid_small',
                    health: 1 // Reduced health for faster cleanup
                };
            } else {
                // Medium asteroid (20% chance) - Reduced from 3 types to 2
                const size = Math.random() * 15 + 40;
                obstacle = {
                    x: Math.random() * (this.width - size),
                    y: -size,
                    size: size,
                    speed: 1.5 + Math.random() * 1, // 1.5-2.5
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.04,
                    type: 'asteroid_medium',
                    health: 2
                };
            }
            
            this.obstacles.push(obstacle);
        }
    }

    spawnPowerups(deltaTime) {
        this.powerupSpawnTimer += deltaTime;
        
        if (this.powerupSpawnTimer > 10000) { // Slightly less frequent for performance
            this.powerupSpawnTimer = 0;
            
            const powerupType = Math.random();
            let powerup;
            
            if (powerupType < 0.7) {
                // Star power-up (70% of power-ups) - Double fire
                powerup = {
                    x: Math.random() * (this.width - 30),
                    y: -30,
                    size: 25,
                    speed: 1.5,
                    rotation: 0,
                    type: 'star',
                    collected: false,
                    glow: 0,
                    sparkleTimer: 0
                };
            } else {
                // Heart power-up (30% of power-ups) - Extra life
                powerup = {
                    x: Math.random() * (this.width - 25),
                    y: -25,
                    size: 22,
                    speed: 1.5,
                    rotation: 0,
                    type: 'heart',
                    collected: false,
                    pulse: 0,
                    beatTimer: 0
                };
            }
            
            this.powerups.push(powerup);
        }
    }

    checkCollisions() {
        // Bullet vs Enemy collisions - MUCH IMPROVED detection for easier hits
        for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
            const bullet = this.bullets[bulletIndex];
            let bulletHit = false;
            
            for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
                const enemy = this.enemies[enemyIndex];
                
        // Create expanded hit area for enemies
        const expandedEnemy = {
            x: enemy.x - 20, // Expand left (was 15)
            y: enemy.y - 20, // Expand top (was 15)
            width: enemy.width + 40, // Expand width (was 30)
            height: enemy.height + 40 // Expand height (was 30)
        };                // Use expanded area for collision check - much more forgiving
                if (this.isColliding(bullet, expandedEnemy)) {
                    // Remove bullet and damage enemy
                    this.bullets.splice(bulletIndex, 1);
                    enemy.health--;
                    bulletHit = true;
                    
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
                    break; // Exit enemy loop since bullet hit
                }
            }
            
            if (bulletHit) continue; // Skip to next bullet
        }

        // Bullet vs Obstacle collisions - IMPROVED with expanded hit areas
        for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
            const bullet = this.bullets[bulletIndex];
            
            for (let obstacleIndex = this.obstacles.length - 1; obstacleIndex >= 0; obstacleIndex--) {
                const obstacle = this.obstacles[obstacleIndex];
                
                // Create expanded hit area for obstacles
                const expandedObstacle = {
                    x: obstacle.x - 20, // Expand left (was 15)
                    y: obstacle.y - 20, // Expand top (was 15)
                    width: obstacle.size + 40, // Expand width (was 30)
                    height: obstacle.size + 40 // Expand height (was 30)
                };
                
                // Check collision with expanded area - much more forgiving
                if (this.isColliding(bullet, expandedObstacle)) {
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
                    break; // Exit obstacle loop since bullet hit
                }
            }
        }

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
        // IMPROVED collision detection with larger hit area for easier hits
        // This makes the game more forgiving for hits, so bullets that are close to enemies will register
        const padding = 20; // INCREASED padding for MUCH easier hit detection (was 15)
        
        // Expand the hit area for enemies and obstacles
        const expandedRect2 = {
            x: rect2.x - padding,
            y: rect2.y - padding,
            width: rect2.width + (padding * 2),
            height: rect2.height + (padding * 2)
        };
        
        return rect1.x < expandedRect2.x + expandedRect2.width &&
               rect1.x + rect1.width > expandedRect2.x &&
               rect1.y < expandedRect2.y + expandedRect2.height &&
               rect1.y + rect1.height > expandedRect2.y;
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

        // Force update lives in gameManager
        if (window.gameManager) {
            console.log('Player damaged! Health:', this.player.health);
            window.gameManager.updateLives(this.player.health);
            
            if (this.player.health <= 0) {
                console.log('Game Over - No health left');
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
        this.ctx.fillStyle = 'rgba(4, 0, 20, 0.95)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add cosmic nebula effect
        const gradient = this.ctx.createRadialGradient(
            this.width * 0.3, this.height * 0.2, 0,
            this.width * 0.3, this.height * 0.2, this.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(20, 0, 50, 0.15)');
        gradient.addColorStop(0.5, 'rgba(0, 20, 60, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add a second nebula for depth
        const gradient2 = this.ctx.createRadialGradient(
            this.width * 0.7, this.height * 0.8, 0,
            this.width * 0.7, this.height * 0.8, this.width * 0.6
        );
        gradient2.addColorStop(0, 'rgba(50, 0, 80, 0.1)');
        gradient2.addColorStop(0.6, 'rgba(0, 30, 70, 0.03)');
        gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient2;
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
            
            // More dynamic twinkling
            star.opacity = 0.5 + Math.sin(star.twinkle) * 0.5;
            
            // Add some color variation to stars
            const hue = (star.size * 50) % 360; // Size-based hue variation
            const saturation = 20 + Math.sin(star.twinkle * 0.5) * 20; // Changing saturation
            
            this.ctx.globalAlpha = star.opacity;
            
            // Larger stars get colored, smaller stars stay white
            if (star.size > 1.5) {
                this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, 90%, 1)`;
                this.ctx.shadowColor = `hsla(${hue}, ${saturation}%, 80%, 1)`;
            } else {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = '#ffffff';
            }
            
            this.ctx.shadowBlur = star.size * 2;
            
            // Draw circular stars for better appearance
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size / 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add extra glow to larger stars
            if (star.size > 2) {
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.globalAlpha = star.opacity * 0.3;
                this.ctx.fill();
            }
            
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
        
        // Engine thrust with enhanced glow
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.shadowColor = '#ffcc00';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, this.player.height / 2 - 3);
        this.ctx.lineTo(0, this.player.height / 2 + 15 + this.player.thrustOffset);
        this.ctx.lineTo(8, this.player.height / 2 - 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Blue inner thrust
        this.ctx.fillStyle = '#00ccff';
        this.ctx.shadowColor = '#00ccff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-4, this.player.height / 2 - 1);
        this.ctx.lineTo(0, this.player.height / 2 + 8 + this.player.thrustOffset);
        this.ctx.lineTo(4, this.player.height / 2 - 1);
        this.ctx.closePath();
        this.ctx.fill();

        // Reset shadow for ship body
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';

        // Main ship body - blue with yellow accents (like screenshot)
        this.ctx.fillStyle = '#4A90E2'; // Blue body
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 3, this.player.height / 3);
        this.ctx.lineTo(this.player.width / 3, this.player.height / 3);
        this.ctx.closePath();
        this.ctx.fill();

        // Yellow cockpit/front section
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 6, this.player.height / 6);
        this.ctx.lineTo(this.player.width / 6, this.player.height / 6);
        this.ctx.closePath();
        this.ctx.fill();

        // Wing details
        this.ctx.fillStyle = '#2E5C8A'; // Darker blue for wings
        this.ctx.fillRect(-this.player.width / 3, this.player.height / 4, 8, 8);
        this.ctx.fillRect(this.player.width / 3 - 8, this.player.height / 4, 8, 8);

        // Ship outline for better visibility
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 3, this.player.height / 3);
        this.ctx.lineTo(this.player.width / 3, this.player.height / 3);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw emoji multiple times for better visibility
        this.ctx.fillText('🚀', 0, -5);
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🚀', 0, -5);

        // Rocket nose cone with enhanced glow
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-9, -this.player.height / 4);
        this.ctx.lineTo(9, -this.player.height / 4);
        this.ctx.closePath();
        this.ctx.fill();

        // Side fins with enhanced color
        this.ctx.fillStyle = '#0099dd';
        this.ctx.shadowColor = '#0099dd';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-this.player.width / 2, 0, 9, 22);
        this.ctx.fillRect(this.player.width / 2 - 9, 0, 9, 22);
        
        // Cockpit window with enhanced glow
        this.ctx.fillStyle = '#88ddff';
        this.ctx.shadowColor = '#88ddff';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-4, -10, 8, 12);

        this.ctx.restore();
    }

    renderBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            
            if (bullet.type === 'double') {
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.shadowColor = '#ffcc00';
            } else {
                this.ctx.fillStyle = '#00e4ff';
                this.ctx.shadowColor = '#00e4ff';
            }
            
            this.ctx.shadowBlur = 12;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Add bullet emoji (clear, no background)
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = '#ffffff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('⚡', bullet.x + bullet.width/2, bullet.y + bullet.height/2);
            
            // Add energy trail
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(bullet.x - 1, bullet.y + bullet.height, bullet.width + 2, 10);
            
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
            
            // Add rotation for obstacle enemies
            if (enemy.type === 'obstacle_enemy' && enemy.rotation !== undefined) {
                this.ctx.rotate(enemy.rotation);
                enemy.rotation += enemy.rotationSpeed || 0.02;
            }
            
            // Clear enemy rendering with emojis (like localhost)
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (enemy.type === 'alien_small') {
                // Small alien with proper emoji 👾
                this.ctx.font = `bold ${enemy.width + 8}px Arial`;
                this.ctx.fillStyle = '#00ff00'; // Green glow effect
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('👾', 0, 0);
                this.ctx.fillText('👾', 0, 0);
                this.ctx.fill();
                
            } else if (enemy.type === 'alien_fast') {
                // Fast alien with proper emoji 👾 - red glow for speed
                this.ctx.font = `bold ${enemy.width + 10}px Arial`;
                this.ctx.fillStyle = '#ff4444';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('👾', 0, 0);
                this.ctx.fillText('👾', 0, 0);
                this.ctx.strokeText('�', 0, 0); // Add white outline for contrast
                this.ctx.fillText('�', 0, 0);
                
            } else if (enemy.type === 'obstacle_enemy') {
                // Obstacle enemy - custom drawn asteroid (NO EMOJIS)
                this.ctx.fillStyle = '#d0a060';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                
                // Main asteroid body (irregular circle)
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width/2.2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Crater details (darker brown)
                this.ctx.fillStyle = '#8b6914';
                this.ctx.beginPath();
                this.ctx.arc(-4, -2, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(3, 3, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(0, -5, 1, 0, Math.PI * 2);
                this.ctx.fill();
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
            
            // Reset shadows
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
            
            if (obstacle.type === 'asteroid_small') {
                // Small rocky asteroid - brown/gray
                this.ctx.fillStyle = '#8B7355'; // Brown/tan
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, obstacle.size * 0.3, obstacle.size * 0.25, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Dark spots
                this.ctx.fillStyle = '#654321';
                this.ctx.beginPath();
                this.ctx.ellipse(-3, -2, 2, 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(2, 1, 1.5, 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
            } else if (obstacle.type === 'asteroid_large') {
                // Large space rock - darker gray
                this.ctx.fillStyle = '#696969'; // Dim gray
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, obstacle.size * 0.4, obstacle.size * 0.35, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Craters/impact marks
                this.ctx.fillStyle = '#2F4F4F'; // Dark slate gray
                this.ctx.beginPath();
                this.ctx.ellipse(-5, -3, 3, 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(4, 2, 2, 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(0, 5, 2.5, 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
            } else {
                // Default space debris - metallic
                this.ctx.fillStyle = '#708090'; // Slate gray
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, obstacle.size * 0.35, obstacle.size * 0.3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Metallic highlights
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.beginPath();
                this.ctx.ellipse(-2, -2, 2, 1, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // White outline for visibility
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, obstacle.size * 0.4, obstacle.size * 0.35, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
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
                // Enhanced star power-up with glow
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#FFD700';
                
                // Draw multi-pointed star
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                const spikes = 5;
                const outerRadius = powerup.size * 0.4;
                const innerRadius = outerRadius * 0.4;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                
                // Add sparkle effect
                powerup.sparkleTimer = (powerup.sparkleTimer || 0) + 0.1;
                if (Math.sin(powerup.sparkleTimer) > 0.5) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(-1, -1, 2, 2);
                }
                
            } else if (powerup.type === 'heart') {
                // Enhanced heart power-up with pulse
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = '#FF1493';
                
                // Draw heart shape
                this.ctx.fillStyle = '#FF1493';
                this.ctx.strokeStyle = '#DC143C';
                this.ctx.lineWidth = 2;
                
                powerup.beatTimer = (powerup.beatTimer || 0) + 0.15;
                const pulseScale = 1 + Math.sin(powerup.beatTimer) * 0.2;
                this.ctx.scale(pulseScale, pulseScale);
                
                this.ctx.beginPath();
                const size = powerup.size * 0.3;
                this.ctx.moveTo(0, -size * 0.3);
                this.ctx.bezierCurveTo(-size * 0.5, -size * 0.8, -size * 1.2, -size * 0.3, 0, size * 0.5);
                this.ctx.bezierCurveTo(size * 1.2, -size * 0.3, size * 0.5, -size * 0.8, 0, -size * 0.3);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Add gleam effect
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.ellipse(-size * 0.3, -size * 0.4, size * 0.2, size * 0.1, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
            } else {
                // Default power-up
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerup.size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
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
