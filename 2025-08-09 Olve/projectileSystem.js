import { getCanvasWidth, getCanvasHeight } from './constants.js';

export class ProjectileSystem {
    constructor(gameState, particleEngine = null) {
        this.gameState = gameState;
        this.particleEngine = particleEngine;
    }

    update(deltaTime) {
        this.updateFrostZones();
        this.updateFireDots();
        this.updateProjectiles();
    }

    updateProjectiles() {
        this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
            // Move projectile
            proj.x += proj.dx;
            proj.y += proj.dy;

            // Track distance for projectiles with maxDistance (like explosive projectiles)
            // Skip distance tracking for Spirit Blade - it should travel to screen edges
            if (proj.maxDistance && proj.startX !== undefined && proj.startY !== undefined && !proj.spectral) {
                const dx = proj.x - proj.startX;
                const dy = proj.y - proj.startY;
                proj.distanceTraveled = Math.sqrt(dx * dx + dy * dy);
                
                if (proj.distanceTraveled >= proj.maxDistance) {
                    return false; // Remove projectile
                }
            }

            // Create fire particles for fire staff projectiles while flying
            if (proj.type === 'staff' && proj.weapon && proj.weapon.special === 'fire_explosion_dot') {
                this.createFireballTrail(proj);
            }

            // Create lightning particles for lightning staff projectiles while flying
            if (proj.type === 'staff' && proj.weapon && proj.weapon.special === 'chain_lightning') {
                this.createLightningTrail(proj);
            }

            // Create ice cubes for ice staff projectiles while flying
            if (proj.type === 'staff' && proj.weapon && proj.weapon.special === 'frost_zone_periodic') {
                this.createIceTrail(proj);
            }

            // Create healing orbs for healing staff projectiles while flying
            if (proj.type === 'staff' && proj.weapon && proj.weapon.special === 'healing_over_time') {
                this.createHealingTrail(proj);
            }

            // Handle throwing weapon behavior
            if (proj.type === 'throwing') {
                this.updateThrowingWeapon(proj);
            }

            // Check enemy collisions
            this.checkEnemyCollisions(proj);

            // Remove if out of bounds
            return this.isInBounds(proj);
        });
    }

    checkEnemyCollisions(projectile) {
        this.gameState.enemies.forEach(enemy => {
            // For throwing weapons, allow hitting the same enemy multiple times
            // by adding a cooldown instead of permanent tracking
            let canHit = true;
            
            if (projectile.type === 'throwing') {
                // All throwing weapons can hit the same enemy again after a short cooldown
                const now = Date.now();
                
                if (!projectile.enemyHitCooldowns) {
                    projectile.enemyHitCooldowns = new Map();
                }
                
                const lastHitTime = projectile.enemyHitCooldowns.get(enemy);
                if (lastHitTime && now - lastHitTime < 500) { // 500ms cooldown
                    canHit = false;
                }
            } else {
                // Regular projectiles use permanent hit tracking
                canHit = !projectile.hitEnemies.has(enemy);
            }
            
            if (canHit) {
                const dx = enemy.x + enemy.width / 2 - projectile.x;
                const dy = enemy.y + enemy.height / 2 - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= enemy.width / 2 + projectile.width / 2) {
                    this.hitEnemy(enemy, projectile);
                    
                    if (!projectile.piercing) {
                        // Mark projectile for removal
                        projectile.shouldRemove = true;
                    }
                }
            }
        });
    }

    hitEnemy(enemy, projectile) {
        const enemyWillDie = enemy.health - projectile.damage <= 0;
        
        enemy.health -= projectile.damage;
        enemy.hitTime = Date.now();
        
        // Handle hit tracking differently for throwing vs regular projectiles
        if (projectile.type === 'throwing') {
            // For all throwing weapons, use cooldown system instead of permanent tracking
            if (!projectile.enemyHitCooldowns) {
                projectile.enemyHitCooldowns = new Map();
            }
            projectile.enemyHitCooldowns.set(enemy, Date.now());
        } else {
            // Regular projectiles use permanent hit tracking
            projectile.hitEnemies.add(enemy);
        }
        
        // Handle staff weapon special effects
        if (projectile.type === 'staff' && projectile.weapon) {
            this.handleStaffSpecialEffects(enemy, projectile);
        }
        
        // Create particle effect for projectile hits (if enemy doesn't die)
        if (this.particleEngine && !enemyWillDie) {
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height / 2;
            
            if (enemy.isBoss) {
                this.particleEngine.createBossHitEffect(centerX, centerY, enemy.color);
            } else {
                this.particleEngine.createEnemyHitEffect(centerX, centerY, enemy.color);
            }
        }
    }

    handleStaffSpecialEffects(hitEnemy, projectile) {
        const weapon = projectile.weapon;
        const centerX = hitEnemy.x + hitEnemy.width / 2;
        const centerY = hitEnemy.y + hitEnemy.height / 2;

        switch (weapon.special) {
            case 'fire_explosion':
                // Create explosion that damages nearby enemies
                this.gameState.enemies.forEach(enemy => {
                    if (enemy === hitEnemy) return; // Skip the hit enemy
                    
                    const dx = enemy.x + enemy.width / 2 - centerX;
                    const dy = enemy.y + enemy.height / 2 - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= weapon.explosionRadius) {
                        enemy.health -= weapon.explosionDamage;
                        enemy.hitTime = Date.now();
                        
                        // Create explosion particle effect
                        if (this.particleEngine) {
                            this.particleEngine.createExplosionEffect(
                                enemy.x + enemy.width / 2, 
                                enemy.y + enemy.height / 2, 
                                '#FF4500'
                            );
                        }
                    }
                });
                break;
                
            case 'fire_explosion_dot':
                // Create explosion that damages nearby enemies and sets them on fire
                this.gameState.enemies.forEach(enemy => {
                    if (enemy === hitEnemy) {
                        // Apply fire DOT to the hit enemy
                        this.applyFireDot(enemy, weapon);
                        return;
                    }
                    
                    const dx = enemy.x + enemy.width / 2 - centerX;
                    const dy = enemy.y + enemy.height / 2 - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= weapon.explosionRadius) {
                        enemy.health -= weapon.explosionDamage;
                        enemy.hitTime = Date.now();
                        
                        // Apply fire DOT to enemies in explosion radius
                        this.applyFireDot(enemy, weapon);
                        
                        // Create explosion particle effect
                        if (this.particleEngine) {
                            this.particleEngine.createExplosionEffect(
                                enemy.x + enemy.width / 2, 
                                enemy.y + enemy.height / 2, 
                                '#FF4500'
                            );
                        }
                    }
                });
                break;
                
            case 'frost_zone':
                // Slow enemies in area and create frost effect
                this.gameState.enemies.forEach(enemy => {
                    const dx = enemy.x + enemy.width / 2 - centerX;
                    const dy = enemy.y + enemy.height / 2 - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= weapon.frostRadius) {
                        // Apply slow effect
                        enemy.slowEffect = weapon.slowEffect;
                        enemy.slowEndTime = Date.now() + weapon.slowDuration;
                        
                        // Create frost particle effect
                        if (this.particleEngine) {
                            this.particleEngine.createFrostEffect(
                                enemy.x + enemy.width / 2, 
                                enemy.y + enemy.height / 2, 
                                '#87CEEB'
                            );
                        }
                    }
                });
                break;
                
            case 'frost_zone_periodic':
                // Only create frost zone on every Nth shot
                if (projectile.shotNumber % weapon.frostZoneInterval === 0) {
                    this.createFrostZone(centerX, centerY, weapon);
                }
                break;
                
            case 'chain_lightning':
                // Create lightning explosion effect when projectile hits
                this.createLightningExplosion(centerX, centerY, projectile);
                
                // Chain lightning to nearby enemies
                this.chainLightning(hitEnemy, projectile, weapon.chainCount, weapon.chainRange);
                break;
                
            case 'healing_barrier':
                // Heal player and create protective barrier
                if (this.gameState.player.health < 100) {
                    this.gameState.player.health = Math.min(100, this.gameState.player.health + weapon.healAmount);
                }
                
                // Create barrier effect (temporary invincibility or damage reduction)
                this.gameState.player.barrierEndTime = Date.now() + weapon.barrierDuration;
                
                if (this.particleEngine) {
                    this.particleEngine.createHealingEffect(
                        this.gameState.player.x + this.gameState.player.width / 2,
                        this.gameState.player.y + this.gameState.player.height / 2,
                        '#32CD32'
                    );
                }
                break;
                
            case 'healing_over_time':
                // Heal player immediately and create healing effect
                if (this.gameState.player.health < 100) {
                    this.gameState.player.health = Math.min(100, this.gameState.player.health + weapon.healAmount);
                }
                
                if (this.particleEngine) {
                    this.particleEngine.createHealingEffect(
                        this.gameState.player.x + this.gameState.player.width / 2,
                        this.gameState.player.y + this.gameState.player.height / 2,
                        '#32CD32'
                    );
                }
                break;
        }
    }

    chainLightning(startEnemy, projectile, remainingChains, chainRange) {
        if (remainingChains <= 0) return;
        
        const startX = startEnemy.x + startEnemy.width / 2;
        const startY = startEnemy.y + startEnemy.height / 2;
        
        // Find closest enemy within range that hasn't been hit by this projectile
        let closestEnemy = null;
        let closestDistance = chainRange;
        
        this.gameState.enemies.forEach(enemy => {
            if (enemy === startEnemy || projectile.hitEnemies.has(enemy)) return;
            
            const dx = enemy.x + enemy.width / 2 - startX;
            const dy = enemy.y + enemy.height / 2 - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });
        
        if (closestEnemy) {
            // Damage the chained enemy
            closestEnemy.health -= projectile.damage * 0.7; // Reduced damage for chain
            closestEnemy.hitTime = Date.now();
            projectile.hitEnemies.add(closestEnemy);
            
            // Create lightning effect
            if (this.particleEngine) {
                this.particleEngine.createLightningEffect(
                    startX, startY,
                    closestEnemy.x + closestEnemy.width / 2,
                    closestEnemy.y + closestEnemy.height / 2,
                    '#8A2BE2' // Purple color matching the new lightning staff color
                );
            }
            
            // Continue chain
            this.chainLightning(closestEnemy, projectile, remainingChains - 1, chainRange);
        }
    }

    createLightningExplosion(x, y, projectile) {
        if (!this.particleEngine) return;
        
        // Create multiple lightning bolts shooting outward from the impact point
        const boltCount = 6 + Math.floor(Math.random() * 4); // 6-9 lightning bolts
        
        for (let i = 0; i < boltCount; i++) {
            // Calculate angles to spread lightning bolts evenly around the circle
            const baseAngle = (i / boltCount) * Math.PI * 2;
            const angleVariation = (Math.random() - 0.5) * 0.5; // Add some randomness
            const angle = baseAngle + angleVariation;
            
            // Random bolt length for variety
            const boltLength = 25 + Math.random() * 20; // 25-45 pixel bolts
            
            // Calculate end position
            const endX = x + Math.cos(angle) * boltLength;
            const endY = y + Math.sin(angle) * boltLength;
            
            // Create lightning bolt from impact point outward
            this.particleEngine.createLightningEffect(
                x, y, // Start from impact point
                endX, endY, // End at calculated position
                projectile.color // Use projectile's purple color
            );
        }
        
        // Also create some additional shorter bolts for more chaos
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const shortLength = 10 + Math.random() * 15; // 10-25 pixel short bolts
            
            const endX = x + Math.cos(angle) * shortLength;
            const endY = y + Math.sin(angle) * shortLength;
            
            this.particleEngine.createLightningEffect(
                x, y,
                endX, endY,
                projectile.color
            );
        }
    }

    isInBounds(projectile) {
        if (projectile.shouldRemove) return false;
        
        // Chakrams never get removed by bounds - they bounce forever
        if (projectile.type === 'throwing' && projectile.bouncing) {
            return true; // Always keep chakrams in bounds check
        }
        
        // Special handling for Spirit Blade - allow it to reach screen edges
        if (projectile.type === 'throwing' && projectile.spectral) {
            // Spirit Blade can go slightly outside bounds to trigger edge detection
            // but should be removed if it goes too far beyond the screen
            const buffer = 50; // Allow 50 pixels beyond screen edge
            return projectile.x >= -buffer && projectile.x <= getCanvasWidth() + buffer && 
                   projectile.y >= -buffer && projectile.y <= getCanvasHeight() + buffer;
        }
        
        // Regular bounds checking for other projectiles
        return projectile.x >= 0 && projectile.x <= getCanvasWidth() && 
               projectile.y >= 0 && projectile.y <= getCanvasHeight();
    }

    createProjectile(config) {
        const projectile = {
            x: config.x,
            y: config.y,
            dx: config.dx,
            dy: config.dy,
            width: config.width || 8,
            height: config.height || 8,
            damage: config.damage,
            color: config.color,
            piercing: config.piercing || false,
            hitEnemies: new Set()
        };

        this.gameState.projectiles.push(projectile);
        return projectile;
    }

    createFrostZone(x, y, weapon) {
        // Initialize frost zones array if not present
        if (!this.gameState.frostZones) {
            this.gameState.frostZones = [];
        }

        const frostZone = {
            x: x,
            y: y,
            radius: weapon.frostRadius,
            slowEffect: weapon.slowEffect,
            createdAt: Date.now(),
            duration: weapon.slowDuration,
            weapon: weapon
        };

        this.gameState.frostZones.push(frostZone);

        // Create visual effect
        if (this.particleEngine) {
            this.particleEngine.createFrostEffect(x, y, '#87CEEB');
        }
    }

    applyFireDot(enemy, weapon) {
        const now = Date.now();
        
        // Initialize fire DOT effect
        enemy.fireStartTime = now;
        enemy.fireEndTime = now + weapon.fireDotDuration;
        enemy.fireLastTick = now;
        enemy.fireDotDamage = weapon.fireDotDamage;
        enemy.fireDotInterval = weapon.fireDotInterval;
        enemy.isOnFire = true;
    }

    updateFireDots() {
        if (!this.gameState.enemies) return;
        
        const now = Date.now();
        
        this.gameState.enemies.forEach(enemy => {
            if (enemy.isOnFire && enemy.fireEndTime) {
                // Check if fire effect should end
                if (now >= enemy.fireEndTime) {
                    enemy.isOnFire = false;
                    enemy.fireStartTime = null;
                    enemy.fireEndTime = null;
                    enemy.fireLastTick = null;
                    enemy.fireParticleLastSpawn = null;
                    return;
                }
                
                // Apply fire damage over time
                if (now >= enemy.fireLastTick + enemy.fireDotInterval) {
                    enemy.health -= enemy.fireDotDamage;
                    enemy.fireLastTick = now;
                    enemy.hitTime = now; // Show hit effect
                }
                
                // Create continuous fire particles (every 150ms for more particles)
                if (!enemy.fireParticleLastSpawn) {
                    enemy.fireParticleLastSpawn = now;
                }
                
                const fireParticleInterval = 150; // More frequent particles
                if (now >= enemy.fireParticleLastSpawn + fireParticleInterval) {
                    // Create more fire particles for better visual effect
                    if (this.particleEngine) {
                        // Create 2-3 particles at once for better effect
                        for (let i = 0; i < 3; i++) {
                            this.particleEngine.createFireDotEffect(
                                enemy.x + enemy.width / 2 + (Math.random() - 0.5) * enemy.width,
                                enemy.y + Math.random() * enemy.height / 2, // Random height on enemy
                                ['#FF0000', '#FF6600', '#FFFF00', '#FF3300'] // Red, orange, yellow, bright red
                            );
                        }
                    }
                    enemy.fireParticleLastSpawn = now;
                }
            }
        });
    }

    updateFrostZones() {
        if (!this.gameState.frostZones) return;

        const now = Date.now();
        
        // Remove expired frost zones
        this.gameState.frostZones = this.gameState.frostZones.filter(zone => {
            return (now - zone.createdAt) < zone.duration;
        });

        // Apply frost effects to enemies in active zones
        let enemiesInFrostZones = false;
        
        this.gameState.frostZones.forEach(zone => {
            // Create frost zone particle effects
            this.createFrostZoneParticles(zone);
            
            this.gameState.enemies.forEach(enemy => {
                const dx = enemy.x + enemy.width / 2 - zone.x;
                const dy = enemy.y + enemy.height / 2 - zone.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= zone.radius) {
                    enemiesInFrostZones = true;
                    
                    // Initialize frost tracking if not present
                    if (!enemy.frostStartTime) {
                        enemy.frostStartTime = now;
                    }
                    
                    // Check if enemy should be frozen (after 3 seconds in frost)
                    const timeInFrost = now - enemy.frostStartTime;
                    if (timeInFrost >= zone.weapon.freezeTime && !enemy.isFrozen && !enemy.isStunned) {
                        // Freeze the enemy
                        enemy.isFrozen = true;
                        enemy.freezeStartTime = now;
                        enemy.stunEndTime = now + zone.weapon.stunDuration;
                        
                        // Apply permanent speed reduction when they eventually unfreeze
                        if (!enemy.permanentSpeedReduction) {
                            enemy.permanentSpeedReduction = zone.weapon.permanentSlowEffect;
                        }
                    }
                    
                    // Handle frozen enemies
                    if (enemy.isFrozen) {
                        if (now >= enemy.stunEndTime) {
                            // Unfreeze the enemy
                            enemy.isFrozen = false;
                            enemy.isStunned = false;
                            enemy.frostStartTime = null;
                            enemy.freezeStartTime = null;
                            enemy.iceParticleLastSpawn = null;
                        } else {
                            // Enemy is frozen - cannot move
                            enemy.isStunned = true;
                            // Create ice particles for frozen enemies
                            this.createFrozenEnemyParticles(enemy);
                        }
                    } else {
                        // Apply normal slow effect to unfrozen enemies in frost zones
                        enemy.slowEffect = zone.slowEffect;
                        enemy.slowEndTime = Math.max(enemy.slowEndTime || 0, now + 200);
                        // Create ice particles for slowed enemies (less frequent)
                        this.createSlowedEnemyParticles(enemy);
                    }
                } else {
                    // Enemy left frost zone - reset frost timer
                    if (enemy.frostStartTime && !enemy.isFrozen) {
                        enemy.frostStartTime = null;
                    }
                }
            });
        });

        // Apply Ice Staff attack speed reduction when enemies are in frost zones
        if (enemiesInFrostZones) {
            this.gameState.iceStaffSlowEndTime = now + 500; // Apply effect for next 500ms
        }
    }

    createFireballTrail(projectile) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this projectile if it doesn't exist
        if (!projectile.lastParticleTime) {
            projectile.lastParticleTime = 0;
        }
        
        const now = Date.now();
        const particleInterval = 50; // Create particles every 50ms for smooth trail
        
        if (now >= projectile.lastParticleTime + particleInterval) {
            // Calculate direction vector (normalized)
            const speed = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
            const dirX = projectile.dx / speed;
            const dirY = projectile.dy / speed;
            
            // Create particles behind the projectile (opposite to movement direction)
            const trailDistance = 15; // Distance behind projectile
            const trailX = projectile.x - dirX * trailDistance;
            const trailY = projectile.y - dirY * trailDistance;
            
            // Create 2-3 fire particles with some random spread
            for (let i = 0; i < 2; i++) {
                const spreadX = (Math.random() - 0.5) * 10; // Random spread
                const spreadY = (Math.random() - 0.5) * 10;
                
                this.particleEngine.createFireDotEffect(
                    trailX + spreadX,
                    trailY + spreadY,
                    ['#FF0000', '#FF6600', '#FFFF00', '#FF3300'] // Fire colors
                );
            }
            
            projectile.lastParticleTime = now;
        }
    }

    createLightningTrail(projectile) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this projectile if it doesn't exist
        if (!projectile.lastLightningParticleTime) {
            projectile.lastLightningParticleTime = 0;
        }
        
        const now = Date.now();
        const particleInterval = 75; // Create lightning particles every 75ms (slightly slower than fire)
        
        if (now >= projectile.lastLightningParticleTime + particleInterval) {
            // Calculate direction vector (normalized)
            const speed = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
            const dirX = projectile.dx / speed;
            const dirY = projectile.dy / speed;
            
            // Create small lightning beams starting from the projectile's current position
            const startX = projectile.x; // Start directly from projectile
            const startY = projectile.y;
            
            // Create 2-3 lightning bolts emanating from the projectile
            for (let i = 0; i < 3; i++) {
                const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.6; // 60% of a semicircle spread
                const boltLength = 20 + Math.random() * 15; // Random length 20-35px
                
                // Calculate direction pointing backwards and to the sides
                const baseAngle = Math.atan2(dirY, dirX) + Math.PI; // Opposite to movement direction
                const boltAngle = baseAngle + spreadAngle;
                
                // Calculate end position for the lightning bolt
                const endX = startX + Math.cos(boltAngle) * boltLength;
                const endY = startY + Math.sin(boltAngle) * boltLength;
                
                // Create a lightning effect directly connected to the projectile
                this.particleEngine.createLightningEffect(
                    startX, // Always start from projectile center
                    startY,
                    endX,
                    endY,
                    projectile.color // Use the purple projectile color
                );
            }
            
            projectile.lastLightningParticleTime = now;
        }
    }

    createIceTrail(projectile) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this projectile if it doesn't exist
        if (!projectile.lastIceParticleTime) {
            projectile.lastIceParticleTime = 0;
        }
        
        const now = Date.now();
        const particleInterval = 100; // Create ice cubes every 100ms (slower than fire/lightning)
        
        if (now >= projectile.lastIceParticleTime + particleInterval) {
            // Calculate direction vector (normalized)
            const speed = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
            const dirX = projectile.dx / speed;
            const dirY = projectile.dy / speed;
            
            // Create ice cubes starting from the projectile's current position
            const startX = projectile.x;
            const startY = projectile.y;
            
            // Create 2-3 ice cubes emanating from the projectile
            for (let i = 0; i < 3; i++) {
                const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.5; // 50% spread
                const cubeDistance = 15 + Math.random() * 10; // Random distance 15-25px
                
                // Calculate direction pointing backwards and to the sides
                const baseAngle = Math.atan2(dirY, dirX) + Math.PI; // Opposite to movement direction
                const cubeAngle = baseAngle + spreadAngle;
                
                // Calculate position for the ice cube
                const cubeX = startX + Math.cos(cubeAngle) * cubeDistance;
                const cubeY = startY + Math.sin(cubeAngle) * cubeDistance;
                
                // Create ice cube effect
                this.particleEngine.createIceCubeEffect(
                    cubeX,
                    cubeY,
                    projectile.color // Use the ice staff's cyan color
                );
            }
            
            projectile.lastIceParticleTime = now;
        }
    }

    createHealingTrail(projectile) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this projectile if it doesn't exist
        if (!projectile.lastHealingParticleTime) {
            projectile.lastHealingParticleTime = 0;
        }
        
        const now = Date.now();
        const particleInterval = 80; // Create healing orbs every 80ms (moderate frequency)
        
        if (now >= projectile.lastHealingParticleTime + particleInterval) {
            // Calculate direction vector (normalized)
            const speed = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
            const dirX = projectile.dx / speed;
            const dirY = projectile.dy / speed;
            
            // Create healing orbs starting from the projectile's current position
            const startX = projectile.x;
            const startY = projectile.y;
            
            // Create 2-3 healing orbs emanating from the projectile
            for (let i = 0; i < 2; i++) {
                const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.4; // 40% spread
                const orbDistance = 12 + Math.random() * 8; // Random distance 12-20px
                
                // Calculate direction pointing backwards and to the sides
                const baseAngle = Math.atan2(dirY, dirX) + Math.PI; // Opposite to movement direction
                const orbAngle = baseAngle + spreadAngle;
                
                // Calculate position for the healing orb
                const orbX = startX + Math.cos(orbAngle) * orbDistance;
                const orbY = startY + Math.sin(orbAngle) * orbDistance;
                
                // Create healing orb effect
                this.particleEngine.createHealingOrbEffect(
                    orbX,
                    orbY,
                    projectile.color // Use the healing staff's green color
                );
            }
            
            projectile.lastHealingParticleTime = now;
        }
    }

    updateThrowingWeapon(projectile) {
        // Update rotation for spinning effect
        projectile.rotation += projectile.spinSpeed;
        
        // Handle bouncing weapons (like Chakram) - skip all distance tracking
        if (projectile.bouncing) {
            this.updateBouncingWeapon(projectile);
            return;
        }
        
        // Track distance traveled for non-bouncing weapons only
        const frameDistance = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
        projectile.distanceTraveled += frameDistance;
        
        // Handle Spirit Blade - travels until screen edge then returns
        if (projectile.spectral) {
            this.updateSpiritBlade(projectile);
            return;
        }
        
        // Handle special weapons that don't return (like Spirit Blade)
        if (projectile.noReturn) {
            // Check if weapon should be removed (reached max distance)
            if (projectile.distanceTraveled >= projectile.maxDistance) {
                projectile.shouldRemove = true;
            }
            return;
        }
        
        // Check if weapon should start returning
        if (!projectile.returning && projectile.distanceTraveled >= projectile.maxDistance) {
            projectile.returning = true;
        }
        
        // Handle returning behavior for normal throwing weapons
        if (projectile.returning) {
            const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
            const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;
            
            // Calculate return direction
            const dx = playerCenterX - projectile.x;
            const dy = playerCenterY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if weapon reached player
            if (distance < 20) {
                // Mark for removal - weapon has returned
                projectile.shouldRemove = true;
                return;
            }
            
            // Update velocity to move toward player
            const returnDirection = Math.atan2(dy, dx);
            projectile.dx = Math.cos(returnDirection) * projectile.returnSpeed;
            projectile.dy = Math.sin(returnDirection) * projectile.returnSpeed;
        }
    }

    updateSpiritBlade(projectile) {
        // Use actual canvas dimensions
        const mapWidth = getCanvasWidth();
        const mapHeight = getCanvasHeight();
        
        // Check if Spirit Blade hit a screen edge
        if (!projectile.returning) {
            if (projectile.x <= 0 || projectile.x >= mapWidth - projectile.width ||
                projectile.y <= 0 || projectile.y >= mapHeight - projectile.height) {
                // Hit screen edge, start returning
                projectile.returning = true;
                
                // Clamp position to screen bounds
                projectile.x = Math.max(0, Math.min(mapWidth - projectile.width, projectile.x));
                projectile.y = Math.max(0, Math.min(mapHeight - projectile.height, projectile.y));
            }
        }
        
        // Handle return to player
        if (projectile.returning) {
            const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
            const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;
            
            // Calculate return direction
            const dx = playerCenterX - projectile.x;
            const dy = playerCenterY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if weapon reached player
            if (distance < 20) {
                // Mark for removal - weapon has returned
                projectile.shouldRemove = true;
                return;
            }
            
            // Update velocity to move toward player
            const returnDirection = Math.atan2(dy, dx);
            projectile.dx = Math.cos(returnDirection) * projectile.returnSpeed;
            projectile.dy = Math.sin(returnDirection) * projectile.returnSpeed;
        }
    }

    updateBouncingWeapon(projectile) {
        // Initialize bounce timer if not set
        if (!projectile.bounceStartTime) {
            projectile.bounceStartTime = Date.now();
        }
        
        // Chakrams never despawn - remove the duration check for bouncing weapons
        // This makes chakrams permanent until manually removed
        
        // Use actual canvas dimensions for bouncing
        const mapWidth = getCanvasWidth();
        const mapHeight = getCanvasHeight();
        
        // Bounce off walls with proper boundary checking
        if (projectile.x <= 0) {
            projectile.dx = Math.abs(projectile.dx); // Always bounce right
            projectile.x = 0;
        } else if (projectile.x >= mapWidth - projectile.width) {
            projectile.dx = -Math.abs(projectile.dx); // Always bounce left
            projectile.x = mapWidth - projectile.width;
        }
        
        if (projectile.y <= 0) {
            projectile.dy = Math.abs(projectile.dy); // Always bounce down
            projectile.y = 0;
        } else if (projectile.y >= mapHeight - projectile.height) {
            projectile.dy = -Math.abs(projectile.dy); // Always bounce up
            projectile.y = mapHeight - projectile.height;
        }
        
        // Add some randomness to bounces to make them more interesting
        if (Math.random() < 0.05) { // 5% chance per frame to slightly change direction
            const randomAngle = (Math.random() - 0.5) * 0.3; // Small random angle
            const currentAngle = Math.atan2(projectile.dy, projectile.dx);
            const newAngle = currentAngle + randomAngle;
            const speed = Math.sqrt(projectile.dx * projectile.dx + projectile.dy * projectile.dy);
            
            projectile.dx = Math.cos(newAngle) * speed;
            projectile.dy = Math.sin(newAngle) * speed;
        }
    }

    createFrostZoneParticles(zone) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this zone if it doesn't exist
        if (!zone.lastParticleTime) {
            zone.lastParticleTime = 0;
        }
        
        const now = Date.now();
        const particleInterval = 200; // Create frost zone particles every 200ms
        
        if (now >= zone.lastParticleTime + particleInterval) {
            // Create 3-5 ice cubes around the frost zone perimeter
            const cubeCount = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < cubeCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = zone.radius * (0.5 + Math.random() * 0.4); // 50-90% of radius
                
                const cubeX = zone.x + Math.cos(angle) * distance;
                const cubeY = zone.y + Math.sin(angle) * distance;
                
                this.particleEngine.createIceCubeEffect(cubeX, cubeY, '#87CEEB');
            }
            
            zone.lastParticleTime = now;
        }
    }

    createFrozenEnemyParticles(enemy) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this enemy if it doesn't exist
        if (!enemy.iceParticleLastSpawn) {
            enemy.iceParticleLastSpawn = 0;
        }
        
        const now = Date.now();
        const particleInterval = 150; // Frozen enemies emit ice frequently
        
        if (now >= enemy.iceParticleLastSpawn + particleInterval) {
            // Create 2-3 ice cubes around the frozen enemy
            const cubeCount = 2 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < cubeCount; i++) {
                const offsetX = (Math.random() - 0.5) * enemy.width * 1.5;
                const offsetY = (Math.random() - 0.5) * enemy.height * 1.5;
                
                const cubeX = enemy.x + enemy.width / 2 + offsetX;
                const cubeY = enemy.y + enemy.height / 2 + offsetY;
                
                this.particleEngine.createIceCubeEffect(cubeX, cubeY, '#87CEEB');
            }
            
            enemy.iceParticleLastSpawn = now;
        }
    }

    createSlowedEnemyParticles(enemy) {
        if (!this.particleEngine) return;
        
        // Initialize particle timer for this enemy if it doesn't exist
        if (!enemy.iceParticleLastSpawn) {
            enemy.iceParticleLastSpawn = 0;
        }
        
        const now = Date.now();
        const particleInterval = 400; // Slowed enemies emit ice less frequently than frozen
        
        if (now >= enemy.iceParticleLastSpawn + particleInterval) {
            // Create 1 ice cube around the slowed enemy
            const offsetX = (Math.random() - 0.5) * enemy.width;
            const offsetY = (Math.random() - 0.5) * enemy.height;
            
            const cubeX = enemy.x + enemy.width / 2 + offsetX;
            const cubeY = enemy.y + enemy.height / 2 + offsetY;
            
            this.particleEngine.createIceCubeEffect(cubeX, cubeY, '#87CEEB');
            
            enemy.iceParticleLastSpawn = now;
        }
    }

    clear() {
        this.gameState.projectiles = [];
        this.gameState.frostZones = [];
    }
}
