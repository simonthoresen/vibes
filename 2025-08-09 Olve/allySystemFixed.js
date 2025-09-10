import { COMPANION_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class AllySystem {
    constructor(gameState, particleEngine = null) {
        this.gameState = gameState;
        this.particleEngine = particleEngine;
    }

    setParticleEngine(particleEngine) {
        this.particleEngine = particleEngine;
    }

    update(deltaTime) {
        if (!this.gameState.allies) {
            this.gameState.allies = [];
            return;
        }

        // Update ally behavior and remove expired ones
        this.gameState.allies = this.gameState.allies.filter(ally => {
            // Check if ally has expired (skip permanent allies)
            if (!ally.permanent) {
                const now = Date.now();
                if (ally.duration && now - ally.spawnTime > ally.duration) {
                    // Create despawn effect
                    if (this.particleEngine) {
                        this.particleEngine.createAllyDespawnEffect(
                            ally.x + ally.width / 2, 
                            ally.y + ally.height / 2, 
                            ally.color
                        );
                    }
                    return false;
                }
            }

            // Check if ally is dead (skip immortal flaming skulls)
            if (ally.type !== 'orbital_skull' && ally.health <= 0) {
                // Special explosive death for demons
                if (ally.type === 'demon') {
                    this.createDemonExplosiveProjectiles(ally);
                }
                
                // Create death effect
                if (this.particleEngine) {
                    this.particleEngine.createAllyDeathEffect(
                        ally.x + ally.width / 2, 
                        ally.y + ally.height / 2, 
                        ally.color
                    );
                }
                return false;
            }

            // Update ally behavior
            this.updateAlly(ally, deltaTime);
            return true;
        });
    }

    updateAlly(ally, deltaTime) {
        // Handle orbital skulls differently
        if (ally.type === 'orbital_skull') {
            this.updateFlyingSkull(ally, deltaTime);
            return;
        }

        // Handle demons as stationary turrets
        if (ally.type === 'demon') {
            this.updateDemon(ally, deltaTime);
            return;
        }

        // Find closest enemy to attack
        const closestEnemy = this.findClosestEnemy(ally);
        
        if (closestEnemy) {
            ally.target = closestEnemy;
            
            // Move towards enemy or attack if in range
            const distanceToEnemy = this.getDistance(ally, closestEnemy);
            
            if (distanceToEnemy <= ally.attackRange) {
                // Attack if in range and cooldown is ready
                this.tryAttackEnemy(ally, closestEnemy);
            } else {
                // Move towards enemy
                this.moveTowardsTarget(ally, closestEnemy, deltaTime);
            }
        } else {
            // No enemies, move towards player
            this.moveTowardsPlayer(ally, deltaTime);
        }

        // Keep allies within screen bounds
        this.constrainToScreen(ally);
    }

    updateDemon(ally, deltaTime) {
        // Add purple flame particle effect from the top of demons periodically
        if (!ally.lastParticleTime) ally.lastParticleTime = 0;
        const now = Date.now();
        if (now - ally.lastParticleTime > 150) { // Emit particles every 150ms
            ally.lastParticleTime = now;
            if (this.particleEngine) {
                const topX = ally.x + ally.width / 2;
                const topY = ally.y + ally.height * 0.1; // Position near top of demon cube
                
                // Create multiple larger particle bursts from the top
                for (let i = 0; i < 3; i++) {
                    const offsetX = topX + (Math.random() - 0.5) * ally.width * 0.5; // Wider horizontal spread
                    const offsetY = topY + (Math.random() - 0.5) * ally.height * 0.1; // Small vertical spread
                    
                    this.particleEngine.createExplosion(offsetX, offsetY, {
                        particleCount: 2,
                        colors: ['#8B0091', '#9932CC', '#BA55D3', '#DA70D6'], // Purple flame colors
                        minSize: 4,
                        maxSize: 8,
                        minSpeed: 0.6,
                        maxSpeed: 1.8,
                        minLife: 600,
                        maxLife: 1000,
                        gravity: -0.04 // Gentle upward float
                    });
                }
            }
        }

        // Demons are stationary turrets - they don't move, only attack
        const closestEnemy = this.findClosestEnemy(ally);
        
        if (closestEnemy) {
            ally.target = closestEnemy;
            const distanceToEnemy = this.getDistance(ally, closestEnemy);
            
            // Attack if in range and cooldown is ready
            if (distanceToEnemy <= ally.attackRange) {
                this.tryDemonAttack(ally, closestEnemy);
            }
        }
        // Demons stay where they are summoned - no movement or bounds checking
    }

    updateFlyingSkull(ally, deltaTime) {
        // Add blue fire particle effect periodically
        if (!ally.lastParticleTime) ally.lastParticleTime = 0;
        const now = Date.now();
        if (now - ally.lastParticleTime > 80) { // Emit particles every 80ms for more frequency
            ally.lastParticleTime = now;
            if (this.particleEngine) {
                const centerX = ally.x + ally.width / 2;
                const topY = ally.y + ally.height * 0.2; // Position near top of sprite
                
                // Create multiple small particle bursts concentrated at the top
                for (let i = 0; i < 3; i++) {
                    const offsetX = centerX + (Math.random() - 0.5) * ally.width * 0.3; // Small horizontal spread
                    const offsetY = topY + (Math.random() - 0.5) * ally.height * 0.1; // Very small vertical spread
                    
                    this.particleEngine.createExplosion(offsetX, offsetY, {
                        particleCount: 2,
                        colors: ['#0080ff', '#00bfff', '#87ceeb'],
                        minSize: 1,
                        maxSize: 2,
                        minSpeed: 0.5,
                        maxSpeed: 1.5,
                        minLife: 400,
                        maxLife: 800,
                        gravity: -0.05 // Gentle upward float
                    });
                }
            }
        }

        // Clean up dead targets
        if (ally.currentTarget && (ally.currentTarget.health <= 0 || !this.gameState.enemies.includes(ally.currentTarget))) {
            ally.currentTarget = null;
        }
        
        // Find closest enemy to chase and attack
        const closestEnemy = this.findClosestEnemy(ally);
        
        if (closestEnemy) {
            // Don't switch targets too quickly to prevent teleporting behavior
            if (!ally.currentTarget || this.getDistance(ally, ally.currentTarget) > this.getDistance(ally, closestEnemy) + 50) {
                ally.currentTarget = closestEnemy;
            }
            
            // Validate current target is still alive and exists
            if (ally.currentTarget && ally.currentTarget.health > 0 && this.gameState.enemies.includes(ally.currentTarget)) {
                const targetDistance = this.getDistance(ally, ally.currentTarget);
                
                // Attack if in range
                if (targetDistance <= ally.attackRange) {
                    this.tryAttackEnemy(ally, ally.currentTarget);
                }
                
                // Always move towards target with constant speed (like enemies do)
                if (targetDistance > 30) { // Minimum distance to avoid jittering
                    this.moveTowardsTargetSmooth(ally, ally.currentTarget);
                }
            } else {
                // Current target is invalid, clear it and find new one
                ally.currentTarget = closestEnemy;
            }
        } else {
            // No enemies - return to player
            ally.currentTarget = null;
            const player = this.gameState.player;
            const distanceToPlayer = this.getDistance(ally, player);
            
            if (distanceToPlayer > 80) {
                this.moveTowardsTargetSmooth(ally, player);
            }
        }
        
        // Keep within screen bounds
        this.constrainToScreen(ally);
    }

    moveTowardsTargetSmooth(ally, target) {
        // Calculate direction vector (same as enemy movement)
        const dx = (target.x + target.width / 2) - (ally.x + ally.width / 2);
        const dy = (target.y + target.height / 2) - (ally.y + ally.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Use timeScale like enemies do for consistent movement
            const timeScale = this.gameState.timeScale || 1;
            const speed = ally.speed; // Constant speed, no custom speed parameter
            
            // Move using the same formula as enemies
            ally.x += (dx / dist) * speed * timeScale;
            ally.y += (dy / dist) * speed * timeScale;
        }
    }

    findClosestEnemy(ally) {
        if (!this.gameState.enemies || this.gameState.enemies.length === 0) {
            return null;
        }

        let closest = null;
        let closestDistance = Infinity;

        for (const enemy of this.gameState.enemies) {
            const distance = this.getDistance(ally, enemy);
            if (distance < closestDistance) {
                closest = enemy;
                closestDistance = distance;
            }
        }

        return closest;
    }

    getDistance(entity1, entity2) {
        const dx = (entity1.x + entity1.width / 2) - (entity2.x + entity2.width / 2);
        const dy = (entity1.y + entity1.height / 2) - (entity2.y + entity2.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }

    moveTowardsTarget(ally, target, deltaTime, customSpeed = null) {
        const dx = (target.x + target.width / 2) - (ally.x + ally.width / 2);
        const dy = (target.y + target.height / 2) - (ally.y + ally.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const moveSpeed = (customSpeed || ally.speed) * deltaTime; // Removed * 60 to slow down movement
            ally.x += (dx / distance) * moveSpeed;
            ally.y += (dy / distance) * moveSpeed;
        }
    }

    moveAwayFromTarget(ally, target, deltaTime, speed) {
        const dx = (ally.x + ally.width / 2) - (target.x + target.width / 2); // Reversed direction
        const dy = (ally.y + ally.height / 2) - (target.y + target.height / 2); // Reversed direction
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const moveSpeed = speed * deltaTime * 60;
            ally.x += (dx / distance) * moveSpeed;
            ally.y += (dy / distance) * moveSpeed;
        }
    }

    circleAroundTarget(ally, target, deltaTime, speed) {
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;
        const allyCenterX = ally.x + ally.width / 2;
        const allyCenterY = ally.y + ally.height / 2;

        // Calculate current angle relative to target
        const currentAngle = Math.atan2(allyCenterY - targetCenterY, allyCenterX - targetCenterX);
        
        // Add rotation (clockwise)
        const rotationSpeed = 2; // radians per second
        const newAngle = currentAngle + rotationSpeed * deltaTime;
        
        // Calculate new position maintaining current distance
        const distance = Math.sqrt(
            Math.pow(allyCenterX - targetCenterX, 2) + 
            Math.pow(allyCenterY - targetCenterY, 2)
        );
        
        const newX = targetCenterX + Math.cos(newAngle) * distance - ally.width / 2;
        const newY = targetCenterY + Math.sin(newAngle) * distance - ally.height / 2;
        
        ally.x = newX;
        ally.y = newY;
    }

    hoverAroundPlayer(ally, deltaTime) {
        const player = this.gameState.player;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        // Initialize hover angle if not present
        if (!ally.hoverAngle) {
            ally.hoverAngle = Math.random() * Math.PI * 2;
        }

        // Update hover angle for gentle floating motion
        ally.hoverAngle += deltaTime * 0.001; // Slow hovering
        
        // Small circular hovering motion around player
        const hoverRadius = 60;
        const hoverX = playerCenterX + Math.cos(ally.hoverAngle) * hoverRadius;
        const hoverY = playerCenterY + Math.sin(ally.hoverAngle) * hoverRadius;
        
        // Gently move towards hover position
        const dx = hoverX - (ally.x + ally.width / 2);
        const dy = hoverY - (ally.y + ally.height / 2);
        
        ally.x += dx * deltaTime * 0.002;
        ally.y += dy * deltaTime * 0.002;
    }

    moveTowardsPlayer(ally, deltaTime) {
        const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
        const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;
        const allyCenterX = ally.x + ally.width / 2;
        const allyCenterY = ally.y + ally.height / 2;

        const dx = playerCenterX - allyCenterX;
        const dy = playerCenterY - allyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only move if far from player (don't crowd the player)
        if (distance > 80) {
            const moveSpeed = ally.speed * deltaTime; // Removed * 60 to slow down movement
            ally.x += (dx / distance) * moveSpeed;
            ally.y += (dy / distance) * moveSpeed;
        }
    }

    tryDemonAttack(ally, enemy) {
        const now = Date.now();
        if (now - ally.lastAttack < ally.attackCooldown) {
            return;
        }

        ally.lastAttack = now;

        // Create a projectile towards the enemy
        const centerX = ally.x + ally.width / 2;
        const centerY = ally.y + ally.height / 2;
        const targetX = enemy.x + enemy.width / 2;
        const targetY = enemy.y + enemy.height / 2;

        // Calculate direction
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const speed = ally.projectileSpeed || 6;
            const projectile = {
                x: centerX - 8, // Center the projectile
                y: centerY - 8,
                dx: (dx / distance) * speed,
                dy: (dy / distance) * speed,
                width: ally.projectileSize || 16,
                height: ally.projectileSize || 16,
                damage: ally.damage,
                color: ally.color,
                type: 'demon_projectile',
                sourceType: 'ally',
                piercing: false,
                hitEnemies: new Set(),
                range: ally.attackRange,
                distanceTraveled: 0,
                maxDistance: 2000, // Can travel across the entire map
                startX: centerX,
                startY: centerY
            };

            // Add to projectile system
            if (this.gameState.projectiles) {
                this.gameState.projectiles.push(projectile);
            }

            // Create muzzle flash effect
            if (this.particleEngine) {
                this.particleEngine.createExplosion(centerX, centerY, {
                    particleCount: 4,
                    colors: [ally.color, '#FF4500'],
                    minSize: 2,
                    maxSize: 4,
                    minSpeed: 2,
                    maxSpeed: 5,
                    minLife: 200,
                    maxLife: 400,
                    gravity: 0
                });
            }
        }
    }

    tryAttackEnemy(ally, enemy) {
        const now = Date.now();
        if (now - ally.lastAttack < ally.attackCooldown) {
            return;
        }

        ally.lastAttack = now;

        // Handle special attacks for orbital skulls
        if (ally.type === 'orbital_skull' && ally.sourceWeapon === 'FLAMING_SKULL') {
            // Blue lightning is instant hit, no projectile needed
            enemy.health -= ally.damage;
        } else {
            // Standard melee attack
            enemy.health -= ally.damage;
        }

        // Create attack effect particles
        if (this.particleEngine) {
            if (ally.type === 'orbital_skull') {
                this.particleEngine.createLightningEffect(
                    ally.x + ally.width / 2,
                    ally.y + ally.height / 2,
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    '#00BFFF'
                );
            } else {
                this.particleEngine.createAllyAttackEffect(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    ally.color
                );
            }
        }

        // Add score for ally kills (instant damage, so check here)
        if (enemy.health <= 0 && enemy.points) {
            this.gameState.score += Math.floor(enemy.points / 2); // Half points for ally kills
        }
    }

    constrainToScreen(ally) {
        // Keep allies within screen bounds with some margin
        const margin = 10;
        ally.x = Math.max(margin, Math.min(CANVAS_WIDTH - ally.width - margin, ally.x));
        ally.y = Math.max(margin, Math.min(CANVAS_HEIGHT - ally.height - margin, ally.y));
    }

    // Handle allies taking damage (from enemy attacks)
    damageAlly(ally, damage) {
        // Flaming skulls are immortal and immune to damage
        if (ally.type === 'orbital_skull') {
            return;
        }
        
        ally.health -= damage;
        
        // Create damage effect
        if (this.particleEngine) {
            this.particleEngine.createAllyDamageEffect(
                ally.x + ally.width / 2,
                ally.y + ally.height / 2,
                '#ff4444'
            );
        }
    }

    // Get all allies for rendering system
    getAllies() {
        return this.gameState.allies || [];
    }

    // Create explosive projectiles when a demon dies
    createDemonExplosiveProjectiles(demon) {
        const centerX = demon.x + demon.width / 2;
        const centerY = demon.y + demon.height / 2;
        const projectileCount = 8; // 8 projectiles in all directions
        
        // Create projectiles in a circle pattern
        for (let i = 0; i < projectileCount; i++) {
            const angle = (i * 2 * Math.PI) / projectileCount;
            const speed = demon.projectileSpeed || 6;
            
            const projectile = {
                x: centerX - 8, // Center the projectile
                y: centerY - 8,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                width: 16,
                height: 16,
                damage: Math.floor(demon.damage * 0.75), // 75% of demon's damage
                color: demon.color,
                type: 'demon_explosion',
                sourceType: 'ally',
                piercing: false,
                hitEnemies: new Set(), // Initialize hit tracking
                distanceTraveled: 0,
                maxDistance: 200, // Remove after 200 pixels
                startX: centerX,
                startY: centerY
            };
            
            // Add to projectile system
            if (this.gameState.projectiles) {
                this.gameState.projectiles.push(projectile);
            }
        }
        
        // Create explosive visual effect
        if (this.particleEngine) {
            this.particleEngine.createExplosion(centerX, centerY, {
                particleCount: 20,
                colors: ['#8B0000', '#FF0000', '#FF4500', '#FFA500'],
                minSize: 3,
                maxSize: 8,
                minSpeed: 4,
                maxSpeed: 12,
                minLife: 400,
                maxLife: 800,
                gravity: 0.1
            });
        }
    }
}

