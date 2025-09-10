import { ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class EnemySystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.particleEngine = null; // Will be set by the main game
    }

    setParticleEngine(particleEngine) {
        this.particleEngine = particleEngine;
    }

    setPlayerController(playerController) {
        this.playerController = playerController;
    }

    spawnFloorEnemies() {
        const isBossFloor = this.gameState.currentFloor % 5 === 0;
        
        if (isBossFloor) {
            this.spawnBoss();
        } else {
            this.spawnRegularEnemies();
        }
    }

    spawnBoss() {
        const boss = {
            ...ENEMY_TYPES.DRAGON,
            x: CANVAS_WIDTH / 2,
            y: -ENEMY_TYPES.DRAGON.height,
            maxHealth: ENEMY_TYPES.DRAGON.health * this.gameState.enemyHPMultiplier,
            health: ENEMY_TYPES.DRAGON.health * this.gameState.enemyHPMultiplier,
            isBoss: true
        };
        
        this.gameState.enemies.push(boss);
    }

    spawnRegularEnemies() {
        const baseEnemies = 3 + Math.floor(this.gameState.currentFloor / 2);
        
        for (let i = 0; i < baseEnemies; i++) {
            const enemy = this.createRegularEnemy();
            this.gameState.enemies.push(enemy);
        }
    }

    createRegularEnemy() {
        // More skeletons early game, more slimes later game
        const skeletonChance = Math.max(0.3, 0.8 - (this.gameState.currentFloor * 0.05));
        const enemyType = Math.random() < skeletonChance ? ENEMY_TYPES.SKELETON : ENEMY_TYPES.SLIME;
        
        const spawnPosition = this.getRandomSpawnPosition(enemyType);
        const scaledHealth = enemyType.health * this.gameState.enemyHPMultiplier;
        
        return {
            ...enemyType,
            x: spawnPosition.x,
            y: spawnPosition.y,
            health: scaledHealth,
            maxHealth: scaledHealth
        };
    }

    getRandomSpawnPosition(enemyType) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // top
                x = Math.random() * CANVAS_WIDTH;
                y = -enemyType.height;
                break;
            case 1: // right
                x = CANVAS_WIDTH + enemyType.width;
                y = Math.random() * CANVAS_HEIGHT;
                break;
            case 2: // bottom
                x = Math.random() * CANVAS_WIDTH;
                y = CANVAS_HEIGHT + enemyType.height;
                break;
            case 3: // left
                x = -enemyType.width;
                y = Math.random() * CANVAS_HEIGHT;
                break;
        }

        return { x, y };
    }

    update() {
        const now = Date.now();
        
        this.gameState.enemies.forEach(enemy => {
            // Handle web effects
            if (enemy.webbed && enemy.webbedUntil && now > enemy.webbedUntil) {
                // Restore original speed when web effect expires
                if (enemy.originalSpeed !== undefined) {
                    enemy.speed = enemy.originalSpeed;
                    delete enemy.originalSpeed;
                }
                enemy.webbed = false;
                delete enemy.webbedUntil;
            }
            
            this.updateEnemyMovement(enemy);
        });

        // Check for player collisions with enemies
        this.checkPlayerCollisions();

        // Check for ally collisions with enemies
        this.checkAllyCollisions();

        // Remove dead enemies and check for floor completion
        const initialEnemyCount = this.gameState.enemies.length;
        let killedBoss = false;
        
        const aliveEnemies = this.gameState.enemies.filter(enemy => {
            if (enemy.health <= 0) {
                // Check if we killed a boss
                if (enemy.isBoss) {
                    killedBoss = true;
                }
                
                // Create death particle effect
                if (this.particleEngine) {
                    const centerX = enemy.x + enemy.width / 2;
                    const centerY = enemy.y + enemy.height / 2;
                    this.particleEngine.createEnemyDeathEffect(centerX, centerY, enemy.color);
                }
                return false;
            }
            return true;
        });
        
        const hadEnemies = initialEnemyCount > 0;
        this.gameState.enemies = aliveEnemies;
        
        if (hadEnemies && this.gameState.enemies.length === 0) {
            this.gameState.floorCleared = true;
        }

        // Check for boss defeat and weapon reward
        if (killedBoss) {
            this.handleBossDefeat();
        }
    }

    updateEnemyMovement(enemy) {
        const prevX = enemy.x;
        const prevY = enemy.y;

        // Calculate distances both directly and through screen wrapping
        let dx = this.gameState.player.x - enemy.x;
        let dy = this.gameState.player.y - enemy.y;
        
        // Check if wrapping around horizontally would be shorter
        if (Math.abs(dx) > CANVAS_WIDTH / 2) {
            dx = dx > 0 ? -(CANVAS_WIDTH - Math.abs(dx)) : CANVAS_WIDTH - Math.abs(dx);
        }
        
        // Check if wrapping around vertically would be shorter
        if (Math.abs(dy) > CANVAS_HEIGHT / 2) {
            dy = dy > 0 ? -(CANVAS_HEIGHT - Math.abs(dy)) : CANVAS_HEIGHT - Math.abs(dy);
        }
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Check if enemy is frozen/stunned
            if (enemy.isStunned || enemy.isFrozen) {
                // Frozen enemies cannot move
                return;
            }
            
            // Calculate effective speed with all modifiers
            let effectiveSpeed = enemy.speed;
            
            // Apply permanent speed reduction if present
            if (enemy.permanentSpeedReduction) {
                effectiveSpeed *= enemy.permanentSpeedReduction;
            }
            
            // Apply temporary slow effect if present
            if (enemy.slowEffect && enemy.slowEndTime && Date.now() < enemy.slowEndTime) {
                effectiveSpeed *= enemy.slowEffect;
            }
            
            // Move enemy and handle screen wrapping
            const timeScale = this.gameState.timeScale || 1;
            enemy.x += (dx / dist) * effectiveSpeed * timeScale;
            enemy.y += (dy / dist) * effectiveSpeed * timeScale;
            
            // Wrap around screen edges
            this.wrapEnemyPosition(enemy);
        }

        // Store movement for prediction
        enemy.dx = enemy.x - prevX;
        enemy.dy = enemy.y - prevY;
    }

    wrapEnemyPosition(enemy) {
        if (enemy.x < 0) enemy.x = CANVAS_WIDTH;
        if (enemy.x > CANVAS_WIDTH) enemy.x = 0;
        if (enemy.y < 0) enemy.y = CANVAS_HEIGHT;
        if (enemy.y > CANVAS_HEIGHT) enemy.y = 0;
    }

    handleBossDefeat() {
        // Double enemy HP after boss fight
        this.gameState.enemyHPMultiplier *= 2;
        
        // Trigger weapon selection
        this.dispatchEvent('boss-defeated');
    }

    checkPlayerCollisions() {
        if (this.gameState.player.invulnerable || this.gameState.isPaused) {
            return;
        }

        this.gameState.enemies.forEach(enemy => {
            if (this.detectCollision(this.gameState.player, enemy)) {
                this.damagePlayer(enemy.damage);
            }
        });
    }

    detectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    damagePlayer(damage) {
        console.log(`Player taking ${damage} damage, current health: ${this.gameState.player.health}`);
        
        // Use playerController's takeDamage method to respect umbrella dodge chance
        if (this.playerController && this.playerController.takeDamage) {
            const damageTaken = this.playerController.takeDamage(damage);
            if (!damageTaken) {
                console.log(`Damage dodged by umbrella! (particle effect handled in playerController)`);
                return; // Don't create damage effects if dodged
            }
        } else {
            // Fallback to direct damage if playerController isn't available
            this.gameState.player.health = Math.max(0, this.gameState.player.health - damage);
            this.gameState.player.invulnerable = true;
            this.gameState.player.lastHit = Date.now();
        }
        
        // Create player damage particle effect
        if (this.particleEngine) {
            const centerX = this.gameState.player.x + this.gameState.player.width / 2;
            const centerY = this.gameState.player.y + this.gameState.player.height / 2;
            this.particleEngine.createPlayerDamageEffect(centerX, centerY);
        }
        
        console.log(`Player health after damage: ${this.gameState.player.health}`);
        
        // Update health display
        const healthElement = document.getElementById('health');
        if (healthElement) {
            healthElement.textContent = 
                `HP: ${Math.round(this.gameState.player.health)}/${this.gameState.player.maxHealth}`;
        }
        
        // Check for game over
        if (this.gameState.player.health <= 0 && !this.gameState.deathSequence) {
            console.log('Player health is 0, triggering game over');
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        console.log('triggerGameOver called in EnemySystem');
        this.gameState.deathSequence = true;
        this.gameState.deathTime = Date.now();
        this.gameState.timeScale = 1;
        
        console.log('Dispatching game-over event');
        this.dispatchEvent('game-over');
    }

    checkAllyCollisions() {
        if (!this.gameState.allies || this.gameState.allies.length === 0) {
            return;
        }

        this.gameState.enemies.forEach(enemy => {
            this.gameState.allies.forEach(ally => {
                // Skip collision for flaming skulls - they are intangible
                if (ally.type === 'orbital_skull') {
                    return;
                }
                
                if (this.detectCollision(ally, enemy)) {
                    // Enemy attacks ally
                    this.damageAlly(ally, enemy.damage, enemy);
                }
            });
        });
    }

    damageAlly(ally, damage, attacker = null) {
        ally.health = Math.max(0, ally.health - damage);
        ally.hitTime = Date.now();
        
        // Handle reflection damage for demons
        if (ally.reflectsDamage && attacker && attacker.health > 0) {
            const reflectionDamage = Math.floor(damage * 0.5); // Reflect 50% of damage
            attacker.health = Math.max(0, attacker.health - reflectionDamage);
            attacker.hitTime = Date.now();
            
            // Create reflection damage effect on the attacker
            if (this.particleEngine) {
                const attackerCenterX = attacker.x + attacker.width / 2;
                const attackerCenterY = attacker.y + attacker.height / 2;
                this.particleEngine.createExplosion(attackerCenterX, attackerCenterY, {
                    particleCount: 6,
                    colors: ['#8B0000', '#FF0000', '#FF4500'],
                    minSize: 2,
                    maxSize: 4,
                    minSpeed: 3,
                    maxSpeed: 8,
                    minLife: 300,
                    maxLife: 600,
                    gravity: 0
                });
            }
        }
        
        // Create ally damage particle effect
        if (this.particleEngine) {
            const centerX = ally.x + ally.width / 2;
            const centerY = ally.y + ally.height / 2;
            this.particleEngine.createAllyDamageEffect(centerX, centerY, '#ff4444');
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}

