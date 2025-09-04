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

            // Check if ally is dead
            if (ally.health <= 0) {
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

    updateFlyingSkull(ally, deltaTime) {
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
                
                // Simple behavior: chase enemy if far, attack if close
                if (targetDistance <= ally.attackRange) {
                    // In attack range - attack the enemy
                    this.tryAttackEnemy(ally, ally.currentTarget);
                    
                    // Move slightly towards enemy to stay engaged, but slowly
                    if (targetDistance > ally.attackRange * 0.8) {
                        this.moveTowardsTarget(ally, ally.currentTarget, deltaTime, 0.5);
                    }
                } else {
                    // Too far - chase the enemy smoothly
                    this.moveTowardsTarget(ally, ally.currentTarget, deltaTime, 1.5);
                }
            } else {
                // Current target is invalid, clear it and find new one
                ally.currentTarget = closestEnemy;
            }
        } else {
            // No enemies - return to player and hover nearby
            ally.currentTarget = null;
            const player = this.gameState.player;
            const distanceToPlayer = this.getDistance(ally, player);
            
            if (distanceToPlayer > 120) {
                // Too far from player, move closer
                this.moveTowardsTarget(ally, player, deltaTime, 1);
            }
            // If close enough to player, just stay put
        }
        
        // Keep within screen bounds
        this.constrainToScreen(ally);
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
}
