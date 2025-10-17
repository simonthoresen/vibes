import { WEAPONS, COMPANION_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class WeaponSystem {
    constructor(gameState, particleEngine = null) {
        this.gameState = gameState;
        this.particleEngine = particleEngine;
        this.projectileSystem = null;
    }
    
    setProjectileSystem(projectileSystem) {
        this.projectileSystem = projectileSystem;
        console.log(`🔗 [WEAPON SYSTEM] ProjectileSystem connected for Voltage Loop integration`);
    }

    update(deltaTime) {
        // Handle orbital weapons (create companions if needed)
        this.updateOrbitalWeapons();
        
        // Update traps (check triggers, apply effects, remove expired)
        this.updateTraps(deltaTime);
        
        // Handle Ralsei healing
        this.updateRalseiHealing();
        
        // Continuously attempt to attack enemies
        this.attack();
    }

    updateOrbitalWeapons() {
        if (!this.gameState.allies) {
            this.gameState.allies = [];
        }

        const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
        const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;

        // Group weapons by their ID to handle stacking
        const weaponGroups = this.groupWeapons();

        // Check for orbital weapons that need companions
        Object.values(weaponGroups).forEach(weapons => {
            const weapon = weapons[0];
            const count = weapons.length;

            if (weapon.type === 'orbital' && weapon.id === 'FLAMING_SKULL') {
                const existingSkulls = this.gameState.allies.filter(ally => 
                    ally.sourceWeapon === weapon.id && ally.type === 'orbital_skull'
                ).length;

                const neededSkulls = count - existingSkulls;
                for (let i = 0; i < neededSkulls; i++) {
                    this.createOrbitalSkull(weapon, playerCenterX, playerCenterY, existingSkulls + i, count);
                }
            }
        });
    }

    attack() {
        if (this.gameState.isPaused || this.gameState.player.health <= 0 || this.gameState.deathSequence) {
            return;
        }
        
        const now = Date.now();
        const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
        const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;
        
        const closestEnemy = this.findClosestEnemy(playerCenterX, playerCenterY);
        if (!closestEnemy) return;

        // Update player rotation to face the closest enemy
        this.updatePlayerRotation(playerCenterX, playerCenterY, closestEnemy);

        // Group weapons by their ID to handle stacking
        const weaponGroups = this.groupWeapons();

        // Process passive shop exclusive items first (they don't attack but need state tracking)
        this.processPassiveItems(weaponGroups);
        
        // Periodic debug check for Voltage Loop state
        if (!this.lastVoltageDebug || now - this.lastVoltageDebug > 3000) { // Every 3 seconds
            this.lastVoltageDebug = now;
            if (this.gameState.passiveItems && this.gameState.passiveItems.VOLTAGE_LOOP) {
                const voltageLoop = this.gameState.passiveItems.VOLTAGE_LOOP;
                const voltageState = this.gameState.voltageLoopState;
                console.log(`🔋 [VOLTAGE LOOP STATUS] Active! ${voltageLoop.count} stacks, hit count: ${voltageState?.hitCount || 0}/5, total arcs: ${voltageState?.totalArcsTriggered || 0}`);
            } else {
                console.log(`🔋 [VOLTAGE LOOP STATUS] Not active - no passive items found`);
            }
        }

        // Process each weapon group
        Object.values(weaponGroups).forEach(weapons => {
            const weapon = weapons[0];
            
            // Skip passive items (they don't attack)
            if (weapon.type === 'passive') {
                console.log(`⏭️ [WEAPON SKIP] Skipping passive weapon: ${weapon.name}`);
                return;
            }
            
            console.log(`⚔️ [WEAPON PROCESS] Processing weapon: ${weapon.name} (${weapon.type}), Count: ${weapons.length}`);
            this.processWeaponGroup(weapons, now, playerCenterX, playerCenterY, closestEnemy);
        });

        // Process poison aura if player has poison cloud weapon
        this.processPoisonAura(now, playerCenterX, playerCenterY);

        // Process umbrella rain effect if player has 20+ umbrellas
        this.processUmbrellaRain(now);
    }

    findClosestEnemy(playerCenterX, playerCenterY) {
        let closestEnemy = null;
        let closestDistance = Infinity;

        this.gameState.enemies.forEach(enemy => {
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const dx = enemyCenterX - playerCenterX;
            const dy = enemyCenterY - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    }

    updatePlayerRotation(playerCenterX, playerCenterY, closestEnemy) {
        this.gameState.player.rotation = Math.atan2(
            closestEnemy.y + closestEnemy.height / 2 - playerCenterY,
            closestEnemy.x + closestEnemy.width / 2 - playerCenterX
        );
    }

    groupWeapons() {
        const weaponGroups = {};
        
        console.log(`🔍 [WEAPON GROUPING] Processing ${this.gameState.player.weapons.length} weapons:`, 
            this.gameState.player.weapons.map(w => `${w.name}(${w.id}, type:${w.type})`));
            
        // DEBUG: If we only have passive items and no attacking weapons, add a basic Bow for testing
        const hasAttackingWeapons = this.gameState.player.weapons.some(w => w.type !== 'passive');
        const hasVoltageLoop = this.gameState.player.weapons.some(w => w.id === 'VOLTAGE_LOOP');
        
        if (!hasAttackingWeapons && hasVoltageLoop) {
            console.log(`⚠️ [AUTO-FIX] Voltage Loop found but no attacking weapons! Adding Bow for testing...`);
            // Add a basic bow for testing
            const bowWeapon = {
                id: 'BOW',
                name: 'Bow (Auto-added for Voltage Loop test)',
                damage: 25,
                range: 300,
                cooldown: 1000,
                color: '#8B4513',
                type: 'projectile',
                projectileSpeed: 8
            };
            this.gameState.player.weapons.push(bowWeapon);
            // Regroup weapons after adding the bow
            return this.groupWeapons();
        }
        
        this.gameState.player.weapons.forEach(weapon => {
            if (!weaponGroups[weapon.id]) {
                weaponGroups[weapon.id] = [];
            }
            weaponGroups[weapon.id].push(weapon);
        });
        
        const groupSummary = Object.entries(weaponGroups).map(([id, weapons]) => `${id}:${weapons.length}`).join(', ');
        console.log(`🔍 [WEAPON GROUPING] Created groups: ${groupSummary}`);
        
        // Special focus on passive items
        const passiveGroups = Object.entries(weaponGroups).filter(([id, weapons]) => weapons[0].type === 'passive');
        if (passiveGroups.length > 0) {
            console.log(`🔮 [WEAPON GROUPING] Passive items found:`, passiveGroups.map(([id, weapons]) => `${id}:${weapons.length} (${weapons[0].name})`));
        } else {
            console.log(`❌ [WEAPON GROUPING] No passive items found in weapon groups`);
        }
        
        return weaponGroups;
    }

    processWeaponGroup(weapons, now, playerCenterX, playerCenterY, closestEnemy) {
        const weapon = weapons[0];
        const count = weapons.length;
        
        // Check weapon cooldown (faster with more weapons)
        let scaledCooldown = weapon.cooldown / count;
        
        // Apply Wraith Drive fire rate bonus if active
        if (this.gameState.wraithDriveState && this.gameState.wraithDriveState.endTime > now) {
            const wraithState = this.gameState.wraithDriveState;
            const wraithDrive = this.gameState.passiveItems ? this.gameState.passiveItems.WRAITH_DRIVE : null;
            
            if (wraithDrive) {
                const fireRateIncrease = 0.01 * wraithDrive.stackMultiplier; // 1% per stack, doubles with item stacks
                const fireRateBonus = wraithState.stacks * fireRateIncrease;
                const originalCooldown = scaledCooldown;
                scaledCooldown = scaledCooldown / (1 + fireRateBonus); // Reduce cooldown = faster fire rate
                
                if (fireRateBonus > 0) {
                    console.log(`💀 [WRAITH DRIVE] Applying fire rate bonus to ${weapon.name}: +${(fireRateBonus * 100).toFixed(1)}% (${originalCooldown.toFixed(0)}ms → ${scaledCooldown.toFixed(0)}ms cooldown)`);
                }
            }
        } else if (this.gameState.wraithDriveState && this.gameState.wraithDriveState.endTime <= now) {
            // Clean up expired wraith drive state
            this.gameState.wraithDriveState.stacks = 0;
        }
        
        // Special fire rate bonus for Ralsei when you have 5+ weapons
        if (weapon.special === 'ralsei_instant_kill_beam') {
            if (count >= 20) {
                // Insane fire rate: 0.1 second cooldown for 20+ Ralsei
                scaledCooldown = 100;
            } else if (count >= 10) {
                // Ultra fire rate: 1 second cooldown for 10+ Ralsei
                scaledCooldown = 1000;
            } else if (count >= 5) {
                // Fast fire rate: 5 seconds cooldown for 5+ Ralsei
                scaledCooldown = 5000;
            }
            // Otherwise use normal scaling: weapon.cooldown / count
        }
        
        // Apply Ice Staff attack speed reduction if enemies are in frost zones
        if (weapon.sprite === 'Ice_staff.png' && this.gameState.iceStaffSlowEndTime && now < this.gameState.iceStaffSlowEndTime) {
            scaledCooldown = scaledCooldown / weapon.attackSpeedReduction; // Increase cooldown (slower attack)
        }
        
        const timeSinceLastAttack = now - (this.gameState.player.lastAttacks[weapon.id] || 0);
        
        if (timeSinceLastAttack < scaledCooldown) {
            if (Math.random() < 0.001) { // 0.1% chance to log cooldown blocks
                console.log(`⏰ [COOLDOWN BLOCK] ${weapon.name} on cooldown: ${timeSinceLastAttack.toFixed(0)}/${scaledCooldown.toFixed(0)}ms`);
            }
            return;
        }
        
        console.log(`🔥 [WEAPON ATTACK] ${weapon.name} attacking! Cooldown: ${scaledCooldown.toFixed(0)}ms, Count: ${count}`);
        
        // Update last attack time for this weapon
        this.gameState.player.lastAttacks[weapon.id] = now;
        
        // Handle Thermal Converter effect (shop exclusive item)
        if (this.gameState.passiveItems && this.gameState.passiveItems.THERMAL_CONVERTER) {
            const thermalConverter = this.gameState.passiveItems.THERMAL_CONVERTER;
            
            // Initialize thermal converter state if not exists
            if (!this.gameState.thermalConverterState) {
                this.gameState.thermalConverterState = {
                    heat: 0,
                    lastFiring: 0
                };
            }
            
            const thermalState = this.gameState.thermalConverterState;
            
            // If we haven't fired for 1+ seconds, reset heat
            if (now - thermalState.lastFiring > 1000) {
                thermalState.heat = 0;
            }
            
            thermalState.lastFiring = now;
            thermalState.heat = Math.min(thermalState.heat + 1, 10); // Cap at 10 stacks
            
            console.log(`🔥 [THERMAL CONVERTER] Heat buildup: ${thermalState.heat}/10 (${thermalConverter.count} items equipped)`);
            
            // At 10 stacks, mark for ignite effect on next hit (don't ignite all enemies immediately)
            if (thermalState.heat >= 10) {
                thermalState.igniteReady = true; // Flag that next hit should ignite
                console.log(`🔥 [THERMAL CONVERTER] 10 heat stacks reached! Next attack will ignite enemies hit.`);
            }
        }

        switch (weapon.type) {
            case 'ranged':
                this.handleRangedAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'spinning':
                this.handleSpinningAttack(weapon, count, playerCenterX, playerCenterY, now);
                break;
            case 'melee':
                this.handleMeleeAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'staff':
                this.handleStaffAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'throwing':
                this.handleThrowingAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'summon':
                this.handleSummonAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'orbital':
                this.handleOrbitalAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy);
                break;
            case 'trap':
                this.handleTrapDeployment(weapon, count, playerCenterX, playerCenterY);
                break;
            case 'umbrella':
                // Umbrella weapons are passive and don't need active processing
                // Their effect is handled in the takeDamage method
                break;
            case 'passive':
                // Shop exclusive passive items - their effects are handled elsewhere
                // Just track them for stacking calculations
                this.handlePassiveItem(weapon, count);
                break;
        }
    }

    handleRangedAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        // Add some lead to the shot based on enemy movement
        const closestDistance = Math.sqrt(
            Math.pow(closestEnemy.x - playerCenterX, 2) + 
            Math.pow(closestEnemy.y - playerCenterY, 2)
        );
        const leadTime = closestDistance / weapon.projectileSpeed;
        const predictedX = closestEnemy.x + (closestEnemy.dx || 0) * leadTime;
        const predictedY = closestEnemy.y + (closestEnemy.dy || 0) * leadTime;
        
        const baseAngle = Math.atan2(
            predictedY + closestEnemy.height / 2 - playerCenterY,
            predictedX + closestEnemy.width / 2 - playerCenterX
        );
        
        // Handle special beam weapons (like Ralsei)
        if (weapon.special === 'ralsei_instant_kill_beam') {
            // Get all living enemies sorted by distance
            const allEnemies = this.gameState.enemies
                .filter(enemy => enemy.isAlive)
                .map(enemy => ({
                    enemy: enemy,
                    distance: Math.sqrt(
                        Math.pow(enemy.x + enemy.width/2 - playerCenterX, 2) + 
                        Math.pow(enemy.y + enemy.height/2 - playerCenterY, 2)
                    )
                }))
                .sort((a, b) => a.distance - b.distance);

            // Create all beams simultaneously, each targeting a different enemy when possible
            const targetsUsed = new Set();
            const beamTargets = [];
            
            // First pass: assign unique enemies to beams
            for (let i = 0; i < count; i++) {
                let assignedTarget = null;
                let assignedAngle = baseAngle;
                
                // Find the next available enemy
                for (const enemyData of allEnemies) {
                    if (!targetsUsed.has(enemyData.enemy.id || enemyData.enemy)) {
                        assignedTarget = enemyData.enemy;
                        targetsUsed.add(enemyData.enemy.id || enemyData.enemy);
                        
                        // Calculate precise angle to this enemy with prediction
                        const predictedX = assignedTarget.x + (assignedTarget.dx || 0) * leadTime;
                        const predictedY = assignedTarget.y + (assignedTarget.dy || 0) * leadTime;
                        
                        assignedAngle = Math.atan2(
                            predictedY + assignedTarget.height / 2 - playerCenterY,
                            predictedX + assignedTarget.width / 2 - playerCenterX
                        );
                        break;
                    }
                }
                
                // If no unique enemy available, spread beams around the battlefield
                if (!assignedTarget && allEnemies.length > 0) {
                    // Use random enemy with angle spread to cover more area
                    const randomEnemy = allEnemies[Math.floor(Math.random() * allEnemies.length)].enemy;
                    const spreadAngle = (Math.PI * 2 / count) * i; // Distribute evenly in circle
                    assignedAngle = baseAngle + spreadAngle + (Math.random() - 0.5) * 0.2;
                    assignedTarget = randomEnemy;
                }
                
                beamTargets.push({ enemy: assignedTarget, angle: assignedAngle });
            }
            
            // Second pass: create all beams simultaneously
            beamTargets.forEach(target => {
                this.createBeamProjectile(weapon, playerCenterX, playerCenterY, target.angle);
            });
            
            return;
        }
        
        // Handle multi-shot weapons (like Triple Bow)
        if (weapon.multiShot && weapon.multiShot > 1) {
            const shotsPerInstance = weapon.multiShot;
            const spreadAngle = weapon.spreadAngle || 0.2; // Default spread if not specified
            
            for (let i = 0; i < count; i++) {
                // For each weapon instance, create multiple shots
                for (let j = 0; j < shotsPerInstance; j++) {
                    let shotSpread;
                    if (weapon.name === 'Triple Bow' && shotsPerInstance === 3 && j === 1) {
                        // Middle arrow: random angle between the two outer arrows
                        const left = -(spreadAngle);
                        const right = spreadAngle;
                        shotSpread = left + Math.random() * (right - left);
                    } else {
                        shotSpread = (j - (shotsPerInstance - 1) / 2) * spreadAngle;
                    }
                    // Add random inaccuracy to ALL shots (including center shot)
                    const randomInaccuracy = (Math.random() - 0.5) * spreadAngle * 0.5;
                    const finalAngle = baseAngle + shotSpread + randomInaccuracy;
                    this.createProjectile(weapon, playerCenterX, playerCenterY, finalAngle);
                }
            }
        } else {
            // Create multiple projectiles based on weapon count (normal behavior)
            for (let i = 0; i < count; i++) {
                const spreadAngle = (i - (count - 1) / 2) * 0.1;
                const leadAngle = baseAngle + spreadAngle;
                this.createProjectile(weapon, playerCenterX, playerCenterY, leadAngle);
            }
        }
        
        // Apply Fractal Lens effect (shop exclusive item)
        if (this.gameState.passiveItems && this.gameState.passiveItems.FRACTAL_LENS) {
            const fractalLens = this.gameState.passiveItems.FRACTAL_LENS;
            const now = Date.now();
            
            // Initialize fractal lens state if not exists
            if (!this.gameState.fractalLensState) {
                this.gameState.fractalLensState = {
                    lastTrigger: 0
                };
            }
            
            const fractalState = this.gameState.fractalLensState;
            
            // Check if 3 seconds have passed since last trigger
            if (now - fractalState.lastTrigger >= 3000) {
                fractalState.lastTrigger = now;
                
                // Count nearby enemies within 300 pixels
                const detectionRange = 300;
                const nearbyEnemies = this.gameState.enemies.filter(enemy => {
                    const dx = enemy.x + enemy.width/2 - playerCenterX;
                    const dy = enemy.y + enemy.height/2 - playerCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance <= detectionRange && enemy.health > 0;
                }).length;
                
                const baseMaxProjectiles = 5;
                const maxAdditionalProjectiles = Math.min(nearbyEnemies, baseMaxProjectiles * fractalLens.stackMultiplier); // Max projectiles double per stack
                
                // Fire additional projectiles
                for (let i = 0; i < maxAdditionalProjectiles; i++) {
                    const additionalAngle = baseAngle + (Math.random() - 0.5) * Math.PI/2; // Random spread around base angle
                    this.createProjectile(weapon, playerCenterX, playerCenterY, additionalAngle);
                }
                
                if (maxAdditionalProjectiles > 0) {
                    console.log(`🧠 [FRACTAL LENS] 3-second trigger! +${maxAdditionalProjectiles} projectiles based on ${nearbyEnemies} nearby enemies (${fractalLens.count} items equipped, max ${baseMaxProjectiles * fractalLens.stackMultiplier})`);
                } else if (nearbyEnemies === 0) {
                    console.log(`🧠 [FRACTAL LENS] 3-second trigger, but no nearby enemies found (${fractalLens.count} items equipped)`);
                }
            }
        }
    }

    handleSpinningAttack(weapon, count, playerCenterX, playerCenterY, now) {
        // Multiple scythes at different angles
        for (let i = 0; i < count; i++) {
            const phaseOffset = (i * 2 * Math.PI) / count;
            
            // Check if this is a dragon scythe for special behavior
            const isDragonScythe = weapon.oscillating && weapon.spinSpeed;
            
            let angle, currentOrbitRadius;
            
            if (isDragonScythe) {
                // Dragon scythe: faster spin and oscillating distance
                const spinSpeed = weapon.spinSpeed || 1;
                angle = now * Math.PI * 2 / 1000 * spinSpeed + phaseOffset;
                
                // Oscillate the orbit radius (back and forth movement)
                const oscillationSpeed = 0.002; // Speed of oscillation
                const oscillationAmount = weapon.orbitRadius * 0.4; // How much it moves back and forth
                const baseRadius = weapon.orbitRadius * 0.8; // Base distance
                currentOrbitRadius = baseRadius + Math.sin(now * oscillationSpeed) * oscillationAmount;
            } else {
                // Regular scythe behavior
                angle = now * Math.PI * 2 / 1000 + phaseOffset;
                currentOrbitRadius = weapon.orbitRadius;
            }
            
            const scytheX = playerCenterX + Math.cos(angle) * currentOrbitRadius;
            const scytheY = playerCenterY + Math.sin(angle) * currentOrbitRadius;

            this.gameState.enemies.forEach(enemy => {
                // Check if the circular scythe hitbox intersects with the enemy rectangle
                const scytheRadius = weapon.range; // Scythe sprite radius (sprite size is weapon.range * 2)
                
                // Find the closest point on the enemy rectangle to the scythe center
                const closestX = Math.max(enemy.x, Math.min(scytheX, enemy.x + enemy.width));
                const closestY = Math.max(enemy.y, Math.min(scytheY, enemy.y + enemy.height));
                
                // Calculate distance from scythe center to closest point on enemy rectangle
                const dx = scytheX - closestX;
                const dy = scytheY - closestY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if the distance is less than or equal to the scythe radius
                if (distance <= scytheRadius) {
                    this.damageEnemy(enemy, weapon, now);
                }
            });
        }
    }

    handleMeleeAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        // Check corners and center of enemy hitbox
        const checkPoints = [
            { x: closestEnemy.x, y: closestEnemy.y },
            { x: closestEnemy.x + closestEnemy.width, y: closestEnemy.y },
            { x: closestEnemy.x, y: closestEnemy.y + closestEnemy.height },
            { x: closestEnemy.x + closestEnemy.width, y: closestEnemy.y + closestEnemy.height },
            { x: closestEnemy.x + closestEnemy.width / 2, y: closestEnemy.y + closestEnemy.height / 2 }
        ];

        // Check if any point is within the arc
        const isInArc = this.checkMeleeHit(checkPoints, playerCenterX, playerCenterY, weapon, count);
        
        if (isInArc) {
            const scaledDamage = weapon.damage * count;
            this.damageEnemy(closestEnemy, { ...weapon, damage: scaledDamage }, Date.now());
        }
    }

    checkMeleeHit(checkPoints, playerCenterX, playerCenterY, weapon, count) {
        for (const point of checkPoints) {
            const dx = point.x - playerCenterX;
            const dy = point.y - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angleToPoint = Math.atan2(dy, dx);
            
            let angleDiff = angleToPoint - this.gameState.player.rotation;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Increased arc size and damage with more swords
            const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
            const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
            
            if (Math.abs(angleDiff) <= scaledArcSize / 2 && distance <= scaledRange) {
                return true;
            }
        }
        return false;
    }

    handleStaffAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        if (!closestEnemy) return;

        // Initialize shot counters if not present
        if (!this.gameState.player.staffShotCounters) {
            this.gameState.player.staffShotCounters = {};
        }
        if (!this.gameState.player.staffShotCounters[weapon.id]) {
            this.gameState.player.staffShotCounters[weapon.id] = 0;
        }

        // Create staff projectile with special effects
        for (let i = 0; i < count; i++) {
            const spreadAngle = (i - (count - 1) / 2) * 0.2; // Slight spread for multiple staves
            const angleToEnemy = Math.atan2(
                closestEnemy.y + closestEnemy.height / 2 - playerCenterY,
                closestEnemy.x + closestEnemy.width / 2 - playerCenterX
            ) + spreadAngle;

            // Increment shot counter for this weapon
            this.gameState.player.staffShotCounters[weapon.id]++;
            const shotNumber = this.gameState.player.staffShotCounters[weapon.id];

            // Create staff projectile
            const staffProjectile = {
                x: playerCenterX,
                y: playerCenterY,
                dx: Math.cos(angleToEnemy) * weapon.speed,
                dy: Math.sin(angleToEnemy) * weapon.speed,
                width: 8,
                height: 8,
                damage: weapon.damage,
                range: weapon.range,
                color: weapon.color,
                startX: playerCenterX,
                startY: playerCenterY,
                type: 'staff',
                special: weapon.special,
                weapon: weapon, // Reference to original weapon for special effects
                hitEnemies: new Set(),
                shotNumber: shotNumber // Track which shot this is
            };

            this.gameState.projectiles.push(staffProjectile);
        }
    }

    handleThrowingAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        if (!closestEnemy) return;

        // Special handling for Chakram - limit to one per weapon owned
        if (weapon.bouncing) {
            // Count existing chakrams on screen
            const existingChakrams = this.gameState.projectiles.filter(p => 
                p.type === 'throwing' && p.bouncing
            ).length;
            
            // Don't throw any chakrams if we're at the limit
            if (existingChakrams >= count) {
                return; // Exit completely - no chakrams thrown
            }
            
            // Only create the missing chakrams
            count = count - existingChakrams;
        }

        // Calculate stacking bonuses for special weapons like Chakram
        let stackedSpeed = weapon.speed;
        let stackedDamage = weapon.damage;
        
        if (weapon.bouncing && weapon.bounceSpeedIncrease) {
            // For bouncing weapons like Chakram, increase speed and damage per stack
            const totalChakrams = this.gameState.projectiles.filter(p => 
                p.type === 'throwing' && p.bouncing
            ).length + count; // Total after this throw
            stackedSpeed = weapon.speed * Math.pow(weapon.bounceSpeedIncrease, totalChakrams - 1);
            stackedDamage = weapon.damage * totalChakrams; // Scale with total chakrams
        }

        // Create throwing weapon projectiles
        for (let i = 0; i < count; i++) {
            const spreadAngle = (i - (count - 1) / 2) * 0.15; // Slight spread for multiple weapons
            const angleToEnemy = Math.atan2(
                closestEnemy.y + closestEnemy.height / 2 - playerCenterY,
                closestEnemy.x + closestEnemy.width / 2 - playerCenterX
            ) + spreadAngle;

            // Create throwing weapon projectile
            const throwingProjectile = {
                x: playerCenterX,
                y: playerCenterY,
                dx: Math.cos(angleToEnemy) * stackedSpeed,
                dy: Math.sin(angleToEnemy) * stackedSpeed,
                width: 30,
                height: 30,
                damage: stackedDamage,
                range: weapon.range,
                color: weapon.color,
                startX: playerCenterX,
                startY: playerCenterY,
                maxDistance: weapon.maxDistance,
                returnSpeed: weapon.returnSpeed,
                type: 'throwing',
                weapon: weapon,
                hitEnemies: new Set(),
                piercing: true, // All throwing weapons pierce by default
                spectral: weapon.spectral || false,
                bouncing: weapon.bouncing || false,
                bounceDuration: weapon.bounceDuration || 0,
                noReturn: weapon.noReturn || false,
                returning: false, // Will be set to true when it starts returning
                rotation: 0,
                spinSpeed: weapon.spinSpeed || 0.2,
                distanceTraveled: 0
            };

            this.gameState.projectiles.push(throwingProjectile);
        }
    }

    createProjectile(weapon, x, y, angle) {
        console.log(`🏹 [PROJECTILE CREATED] ${weapon.name} projectile created at (${x.toFixed(1)}, ${y.toFixed(1)}) with damage ${weapon.damage}`);
        
        this.gameState.projectiles.push({
            x,
            y,
            dx: Math.cos(angle) * weapon.projectileSpeed,
            dy: Math.sin(angle) * weapon.projectileSpeed,
            width: 30,
            height: 30,
            damage: this.gameState.player.oneHitKill ? 9999 : weapon.damage,
            color: weapon.color,
            piercing: weapon.piercing,
            hitEnemies: new Set(),
            type: weapon.type, // Add weapon type
            weapon: weapon // Add weapon reference for sprite rendering
        });
    }

    createBeamProjectile(weapon, x, y, angle) {
        // Create a beam that instantly hits all enemies in its path
        const beamEndX = x + Math.cos(angle) * weapon.beamLength;
        const beamEndY = y + Math.sin(angle) * weapon.beamLength;
        
        this.gameState.projectiles.push({
            x,
            y,
            endX: beamEndX,
            endY: beamEndY,
            angle: angle,
            width: weapon.beamWidth,
            height: weapon.beamLength,
            damage: 99999, // Instant kill damage
            color: weapon.color,
            piercing: true,
            hitEnemies: new Set(),
            type: 'beam',
            weapon: weapon,
            isBeam: true,
            lifetime: 200, // Beam visible for 200ms
            createdAt: Date.now()
        });

        // Immediately check for beam collisions with all enemies
        this.checkBeamCollisions(x, y, beamEndX, beamEndY, angle, weapon);
    }

    checkBeamCollisions(beamStartX, beamStartY, beamEndX, beamEndY, angle, weapon) {
        const beamWidth = weapon.beamWidth;
        
        this.gameState.enemies.forEach(enemy => {
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            
            // Check if enemy is within the beam path
            const distanceToBeam = this.pointToLineDistance(
                enemyCenterX, enemyCenterY,
                beamStartX, beamStartY,
                beamEndX, beamEndY
            );
            
            if (distanceToBeam <= beamWidth / 2) {
                // Instant kill the enemy
                enemy.health = 0;
                enemy.hitTime = Date.now();
                enemy.markedForDeath = true;
                
                // Create special beam hit effect
                if (this.particleEngine) {
                    this.particleEngine.createExplosionEffect(
                        enemyCenterX,
                        enemyCenterY,
                        '#FF69B4' // Pink explosion for Ralsei beam
                    );
                }
            }
        });
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate distance from point (px, py) to line segment (x1, y1) to (x2, y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));
        
        const xx = x1 + param * C;
        const yy = y1 + param * D;
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    damageEnemy(enemy, weapon, hitTime) {
        let damage = this.gameState.player.oneHitKill ? enemy.maxHealth || 9999 : weapon.damage;
        
        // Add set bonus damage if applicable
        const setBonusDamage = this.calculateSetBonusDamage(enemy, weapon);
        damage += setBonusDamage;
        
        const enemyWillDie = enemy.health - damage <= 0;
        
        enemy.health -= damage;
        enemy.hitTime = hitTime;
        
        console.log(`🎯 [WEAPON SYSTEM HIT] Enemy hit by weapon! Name: ${weapon.name}, Type: ${weapon.type}, Damage: ${damage}`);
        
        // DEBUG: Add version check to verify cache invalidation
        if (!this.weaponVersionLogged) {
            this.weaponVersionLogged = true;
            console.log(`🔧 [VERSION CHECK] WeaponSystem loaded - Voltage Loop duplicate logic REMOVED (should only be in projectileSystem.js)`);
        }
        
        // NOTE: Voltage Loop logic removed from weapon system - it should ONLY trigger on projectile hits in projectileSystem.js
        // This prevents duplicate/conflicting hit counting between weapon and projectile systems
        
        // Create particle effect for hit (if enemy doesn't die, death effect will be handled elsewhere)
        if (this.particleEngine && !enemyWillDie) {
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height / 2;
            
            if (enemy.isBoss) {
                this.particleEngine.createBossHitEffect(centerX, centerY, enemy.color);
            } else {
                this.particleEngine.createEnemyHitEffect(centerX, centerY, enemy.color);
            }
        }
        
        // Log set bonus damage for debugging (can be removed later)
        if (setBonusDamage > 0) {
            console.log(`Scythe set bonus! Extra ${setBonusDamage} damage (1% of ${enemy.maxHealth || enemy.health} max HP)`);
        }
    }

    setupWeaponSelection(isBossReward = false) {
        const weaponOptions = document.getElementById('weaponOptions');
        const container = document.getElementById('weaponSelect');
        if (!weaponOptions || !container) return;

        weaponOptions.innerHTML = '';
        const title = document.querySelector('.weapon-container h2');
        if (title) {
            title.textContent = isBossReward ? 'Choose an Additional Weapon' : 'Choose Your Starting Weapon';
        }

        // Fade-in and background for starting weapon selection only
        if (!isBossReward) {
            container.style.background = "#000";
            container.style.transition = "background 1s";
            // Add fade overlay if not present
            let fadeOverlay = document.getElementById('fadeOverlay');
            if (!fadeOverlay) {
                fadeOverlay = document.createElement('div');
                fadeOverlay.id = 'fadeOverlay';
                fadeOverlay.style.position = 'fixed';
                fadeOverlay.style.top = '0';
                fadeOverlay.style.left = '0';
                fadeOverlay.style.width = '100vw';
                fadeOverlay.style.height = '100vh';
                fadeOverlay.style.background = '#000';
                fadeOverlay.style.zIndex = '2000';
                fadeOverlay.style.opacity = '1';
                fadeOverlay.style.transition = 'opacity 1.2s';
                document.body.appendChild(fadeOverlay);
            }
            setTimeout(() => {
                container.style.background = "url('images/long_dark_corridor.png') center center / cover no-repeat";
                fadeOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (fadeOverlay.parentNode) fadeOverlay.parentNode.removeChild(fadeOverlay);
                }, 1300);
            }, 100);
        } else {
            container.style.background = 'rgba(0,0,0,0.9)';
        }
        container.style.display = 'flex';

        // Get unlocked weapons from weapon tree
        let unlockedWeaponIds = this.gameState.getUnlockedWeapons();
        
        // If no weapons are unlocked (first time), unlock the basic weapons
        if (unlockedWeaponIds.length === 0) {
            // Auto-unlock basic weapons for first time players
            const basicWeapons = ['sword', 'scythe', 'bow'];
            basicWeapons.forEach(weaponKey => {
                this.gameState.purchaseWeapon('unified', weaponKey);
            });
            unlockedWeaponIds = this.gameState.getUnlockedWeapons();
        }
        
        // Filter available weapons to only unlocked ones
        let weaponsList = Object.entries(WEAPONS).filter(([id]) => 
            unlockedWeaponIds.includes(id)
        );
        
        // Add shop exclusive items to the loot pool (for boss rewards only)
        if (isBossReward) {
            console.log(`🎁 [BOSS REWARD] Adding shop exclusive items to loot pool. Regular weapons available: ${weaponsList.length}`);
            
            // Add shop exclusive weapons from constants (can be obtained multiple times for stacking)
            const shopExclusiveWeaponIds = [
                'ENTROPY_REACTOR',
                'VOLTAGE_LOOP', 
                'THERMAL_CONVERTER',
                'WRAITH_DRIVE',
                'NULL_BARRIER',
                'FRACTAL_LENS'
            ];
            
            let shopExclusiveAdded = 0;
            shopExclusiveWeaponIds.forEach(weaponId => {
                if (WEAPONS[weaponId]) {
                    weaponsList.push([weaponId, WEAPONS[weaponId]]);
                    shopExclusiveAdded++;
                    console.log(`🎁 [BOSS REWARD] Added ${WEAPONS[weaponId].name} to loot pool`);
                } else {
                    console.log(`❌ [BOSS REWARD] ${weaponId} not found in WEAPONS constant`);
                }
            });
            
            console.log(`🎁 [BOSS REWARD] Total weapons in pool: ${weaponsList.length} (${shopExclusiveAdded} shop exclusive items added)`);
        }
        
        // Shuffle and take up to 3 weapons to choose from
        this.shuffleArray(weaponsList);
        const weaponsToShow = weaponsList.slice(0, Math.min(3, weaponsList.length));
        
        if (isBossReward) {
            console.log(`🎁 [BOSS REWARD] Showing weapons:`, weaponsToShow.map(([id, weapon]) => `${weapon.name} (${id}, isShopExclusive: ${weapon.isShopExclusive})`));
        }
        
        weaponsToShow.forEach(([id, weapon]) => {
            const option = this.createWeaponOption(id, weapon, isBossReward);
            weaponOptions.appendChild(option);
        });
    }

    createWeaponOption(id, weapon, isBossReward) {
        const option = document.createElement('div');
        option.className = 'weapon-choice';
        option.style.border = `2px solid ${weapon.color}`;
        
        // Handle shop exclusive items differently
        if (weapon.isShopExclusive) {
            option.innerHTML = `
                <h3 style="color: ${weapon.color}; margin: 0 0 10px 0;">${weapon.name}</h3>
                <div style="color: #aaa; margin: 10px 0; font-size: 14px;">${weapon.description}</div>
                <div style="padding: 10px; background-color: ${weapon.color}; color: black; border-radius: 5px; margin-top: 10px; font-weight: bold;">
                    SPECIAL RELIC
                </div>
            `;
        } else {
            // Regular weapon display
            const description = this.getWeaponDescription(weapon);
            
            option.innerHTML = `
                <h3 style="color: ${weapon.color}; margin: 0 0 10px 0;">${weapon.name}</h3>
                <div style="color: #aaa; margin: 10px 0; font-size: 14px;">${description}</div>
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Damage:</span>
                        <span style="color: ${weapon.color}">${weapon.damage}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Speed:</span>
                        <span style="color: ${weapon.color}">${(1000/weapon.cooldown).toFixed(1)} /s</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Range:</span>
                        <span style="color: ${weapon.color}">${(weapon.range/32).toFixed(1)}x</span>
                    </div>
                </div>
                <div style="padding: 10px; background-color: ${weapon.color}; color: black; border-radius: 5px; margin-top: 10px; font-weight: bold;">
                    ${weapon.type.toUpperCase()}
                </div>
            `;
        }
        
        option.onclick = () => this.selectWeapon(id, weapon, isBossReward);
        
        return option;
    }

    getWeaponDescription(weapon) {
        switch (weapon.type) {
            case 'melee':
                return `A ${weapon.name.toLowerCase()} that deals ${weapon.damage} damage in a ${Math.round(weapon.arcSize * 180 / Math.PI)}° arc`;
            case 'spinning':
                return `A mystical ${weapon.name.toLowerCase()} that orbits around you, dealing ${weapon.damage} damage to anything it touches`;
            case 'ranged':
                return `A powerful ${weapon.name.toLowerCase()} that shoots ${weapon.piercing ? 'piercing' : ''} projectiles dealing ${weapon.damage} damage`;
            case 'staff':
                if (weapon.special === 'healing_over_time') {
                    return `A magical ${weapon.name.toLowerCase()} that deals ${weapon.damage} damage while healing you ${weapon.healAmount} HP every ${weapon.healInterval/1000} seconds`;
                } else if (weapon.special === 'frost_zone_periodic') {
                    return `A magical ${weapon.name.toLowerCase()} that deals ${weapon.damage} damage and creates frost zones every 5th shot. Enemies in zones for 3s freeze for 2s and lose 25% speed permanently`;
                } else if (weapon.special === 'fire_explosion_dot') {
                    return `A magical ${weapon.name.toLowerCase()} that deals ${weapon.damage} damage with explosions that set enemies on fire for 3 seconds, dealing ${weapon.fireDotDamage} damage every 0.5s`;
                } else {
                    return `A magical ${weapon.name.toLowerCase()} that launches ${weapon.special.replace('_', ' ')} projectiles dealing ${weapon.damage} damage`;
                }
            case 'summon':
                if (weapon.id === 'CURSED_ORB') {
                    return `A cursed ${weapon.name.toLowerCase()} that summons huge demons every 60s. Demons have ${weapon.baseMinionHealth}HP (doubles per stack), shoot ${weapon.baseMinionDamage}dmg projectiles (doubles per stack), and reflect damage back to attackers. Lasts ${weapon.minionDuration/1000}s.`;
                } else if (weapon.id === 'FLAMING_SKULL') {
                    return `A ${weapon.name.toLowerCase()} that summons permanent skull companions. Each skull shoots blue lightning for ${weapon.baseMinionDamage}dmg every second (damage and speed double per stack). Never despawns.`;
                } else {
                    return `A legendary ${weapon.name.toLowerCase()} that summons powerful companions`;
                }
            default:
                return '';
        }
    }

    selectWeapon(id, weapon, isBossReward) {
        // Create new weapon object
        const newWeapon = { ...weapon, id };
        
        // Handle shop exclusive items
        if (weapon.isShopExclusive && weapon.shopItemKey) {
            // Add shop exclusive item to weapons for stacking
            if (isBossReward) {
                this.gameState.player.weapons.push(newWeapon);
                this.gameState.floorCleared = true;
            } else {
                this.gameState.player.weapons = [newWeapon];
            }
            
            // Also mark the shop item as purchased (for shop display purposes)
            const purchasedItems = this.gameState.loadPurchasedShopItems();
            purchasedItems[weapon.shopItemKey] = true;
            this.gameState.savePurchasedShopItems(purchasedItems);
            
            console.log(`Shop exclusive item ${weapon.name} obtained and added to weapons for stacking!`);
            
            // Show a special message
            setTimeout(() => {
                alert(`🎉 You found a rare ${weapon.name}!\n\nThis special relic has been added to your arsenal and can stack with additional copies for enhanced effects!`);
            }, 100);
        } else {
            // Regular weapon selection
            if (isBossReward) {
                this.gameState.player.weapons.push(newWeapon);
                this.gameState.floorCleared = true;
            } else {
                this.gameState.player.weapons = [newWeapon];
            }
        }

        // Hide weapon selection
        const container = document.getElementById('weaponSelect');
        if (container) {
            container.style.display = 'none';
        }

        // Dispatch event for game to handle next steps
        this.dispatchEvent('weapon-selected', { weapon: newWeapon, isBossReward });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    handleSummonAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        // Initialize companions array in game state if not present
        if (!this.gameState.allies) {
            this.gameState.allies = [];
        }

        // Handle different summon types
        if (weapon.id === 'CURSED_ORB') {
            this.handleCursedOrbSummon(weapon, count, playerCenterX, playerCenterY);
        } else if (weapon.id === 'FLAMING_SKULL') {
            this.handleFlamingSkullSummon(weapon, count, playerCenterX, playerCenterY);
        }
    }

    handleCursedOrbSummon(weapon, count, playerCenterX, playerCenterY) {
        // Count existing demons for this weapon
        const existingDemons = this.gameState.allies.filter(ally => 
            ally.sourceWeapon === weapon.id && ally.type === 'demon'
        ).length;
        
        const maxDemons = weapon.maxMinions * count; // More orbs = more demons

        // Don't summon if we already have max demons
        if (existingDemons >= maxDemons) {
            return;
        }

        // Get companion type
        const companionType = COMPANION_TYPES.DEMON;
        if (!companionType) {
            console.error('DEMON companion type not found');
            return;
        }

        // Summon all missing demons at once (when first orb triggers, summon for all orbs)
        const demonsToSummon = maxDemons - existingDemons;
        for (let i = 0; i < demonsToSummon; i++) {
            // Create new demon with scaling based on weapon count
            const demon = this.createDemon(companionType, weapon, playerCenterX, playerCenterY, count);
            this.gameState.allies.push(demon);

            // Create summoning effect particles for each demon
            if (this.particleEngine) {
                this.particleEngine.createSummonEffect(demon.x + demon.width/2, demon.y + demon.height/2, weapon.color);
            }
        }
    }

    handleFlamingSkullSummon(weapon, count, playerCenterX, playerCenterY) {
        // For flaming skulls, we only summon if we don't have any yet or if we got another weapon
        const existingSkulls = this.gameState.allies.filter(ally => 
            ally.sourceWeapon === weapon.id && ally.type === 'skull_companion'
        ).length;

        const maxSkulls = weapon.maxMinions * count; // More skulls = more companions

        // Don't summon if we already have max skulls
        if (existingSkulls >= maxSkulls) {
            return;
        }

        // Get companion type
        const companionType = COMPANION_TYPES.SKULL_COMPANION;
        if (!companionType) {
            console.error('SKULL_COMPANION companion type not found');
            return;
        }

        // Create new skull companion
        const skull = this.createSkullCompanion(companionType, weapon, playerCenterX, playerCenterY, count);
        this.gameState.allies.push(skull);

        // Create summoning effect particles
        if (this.particleEngine) {
            this.particleEngine.createSummonEffect(skull.x + skull.width/2, skull.y + skull.height/2, weapon.color);
        }
    }

    handleOrbitalAttack(weapon, count, playerCenterX, playerCenterY, closestEnemy) {
        // Initialize allies array in game state if not present
        if (!this.gameState.allies) {
            this.gameState.allies = [];
        }

        // For flaming skull, ensure we have exactly count orbital companions
        if (weapon.id === 'FLAMING_SKULL') {
            const existingSkulls = this.gameState.allies.filter(ally => 
                ally.sourceWeapon === weapon.id && ally.type === 'orbital_skull'
            ).length;

            const neededSkulls = count - existingSkulls;
            for (let i = 0; i < neededSkulls; i++) {
                this.createOrbitalSkull(weapon, playerCenterX, playerCenterY, existingSkulls + i, count);
            }
        }
    }

    createOrbitalSkull(weapon, playerCenterX, playerCenterY, index, count) {
        // Position the skull in orbit around the player
        const angle = (index * 2 * Math.PI) / Math.max(1, this.gameState.player.weapons.filter(w => w.id === 'FLAMING_SKULL').length);
        const radius = weapon.orbitRadius || 100;
        
        // Calculate scaling based on weapon count
        const damageMultiplier = Math.pow(2, count - 1); // 2x damage per stack (doubles each time)
        const speedMultiplier = Math.min(2, 1 + (count - 1) * 0.3); // Max 2x speed, +30% per stack
        const attackSpeedMultiplier = Math.pow(0.5, count - 1); // 2x faster attacks per stack (half cooldown each time)
        
        const skull = {
            x: playerCenterX + Math.cos(angle) * radius - 24,
            y: playerCenterY + Math.sin(angle) * radius - 32,
            width: 48,
            height: 64,
            health: 999999, // Immortal
            maxHealth: 999999,
            damage: Math.floor(weapon.damage * damageMultiplier),
            speed: 3 * speedMultiplier, // Base speed 3 with scaling
            type: 'orbital_skull',
            sourceWeapon: weapon.id,
            sprite: weapon.sprite,
            orbitAngle: angle,
            orbitRadius: radius,
            lastAttack: 0,
            attackCooldown: Math.floor(weapon.cooldown * attackSpeedMultiplier),
            attackRange: weapon.attackRange,
            permanent: true,
            spawnTime: Date.now(),
            weaponCount: count // Store count for reference
        };

        this.gameState.allies.push(skull);

        // Create summoning effect particles
        if (this.particleEngine) {
            this.particleEngine.createSummonEffect(skull.x + skull.width/2, skull.y + skull.height/2, weapon.color);
        }
    }

    createDemon(companionType, weapon, playerCenterX, playerCenterY, count) {
        // Spawn near player but not on top
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = 80;
        const x = playerCenterX + Math.cos(angle) * spawnDistance - companionType.width / 2;
        const y = playerCenterY + Math.sin(angle) * spawnDistance - companionType.height / 2;

        // Calculate scaled stats based on weapon count
        const healthMultiplier = Math.pow(2, count - 1); // Doubles each time
        const damageMultiplier = Math.pow(2, count - 1); // Doubles each time

        const demon = {
            ...companionType,
            x: x,
            y: y,
            maxHealth: weapon.baseMinionHealth * healthMultiplier,
            health: weapon.baseMinionHealth * healthMultiplier,
            damage: weapon.baseMinionDamage * damageMultiplier,
            sourceWeapon: weapon.id,
            weaponCount: count,
            spawnTime: Date.now(),
            duration: weapon.minionDuration, // Fixed 30s duration
            lastAttack: 0,
            target: null,
            type: 'demon',
            isCompanion: true,
            projectileSpeed: weapon.projectileSpeed,
            attackRate: weapon.attackRate
        };

        return demon;
    }

    createSkullCompanion(companionType, weapon, playerCenterX, playerCenterY, count) {
        // Spawn near player but not on top
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = 60;
        const x = playerCenterX + Math.cos(angle) * spawnDistance - companionType.width / 2;
        const y = playerCenterY + Math.sin(angle) * spawnDistance - companionType.height / 2;

        // Calculate scaled stats - damage and attack speed double each time
        const damageMultiplier = Math.pow(2, count - 1); // Doubles each time
        const attackSpeedMultiplier = Math.pow(0.5, count - 1); // Halves cooldown each time (faster attacks)

        const skull = {
            ...companionType,
            x: x,
            y: y,
            maxHealth: companionType.health, // Always immortal
            health: companionType.health,
            damage: weapon.baseMinionDamage * damageMultiplier,
            sourceWeapon: weapon.id,
            weaponCount: count,
            spawnTime: Date.now(),
            duration: 0, // Permanent
            lastAttack: 0,
            target: null,
            type: 'skull_companion',
            isCompanion: true,
            attackCooldown: companionType.attackCooldown * attackSpeedMultiplier,
            attackRange: weapon.attackRange
        };

        return skull;
    }

    // Trap handling methods
    handleTrapDeployment(weapon, count, playerCenterX, playerCenterY) {
        const now = Date.now();
        
        // Deploy multiple traps based on weapon count
        for (let i = 0; i < count; i++) {
            this.deployTrap(weapon, playerCenterX, playerCenterY, i, count, now);
        }
    }

    deployTrap(weapon, playerCenterX, playerCenterY, index, totalCount, now) {
        // Calculate random deployment position anywhere on the map
        const trapSize = weapon.area || 32;
        const margin = trapSize; // Keep traps away from edges
        
        const x = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
        const y = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin);

        const trap = {
            id: `${weapon.id}_${now}_${index}`,
            weaponId: weapon.id,
            name: weapon.name,
            x: x,
            y: y,
            width: weapon.area || 32,
            height: weapon.area || 32,
            damage: weapon.damage,
            sprite: weapon.sprite,
            color: weapon.color,
            trigger: weapon.trigger,
            triggerRange: weapon.triggerRange || weapon.area || 32,
            explosionRadius: weapon.explosionRadius,
            slowEffect: weapon.slowEffect,
            dotDamage: weapon.dotDamage,
            dotInterval: weapon.dotInterval,
            duration: weapon.duration,
            armTime: weapon.armTime || 0,
            blinkDuration: weapon.blinkDuration || 0,
            proximityWarningTime: weapon.proximityWarningTime || 0,
            deployTime: now,
            armed: weapon.armTime ? false : true,
            active: true,
            visible: true,
            isBlinking: false,
            proximityTriggered: false,
            proximityTriggerTime: 0,
            triggered: false,
            exploded: false,
            halfTransparent: false,
            triggerTime: 0,
            explodeTime: 0,
            affectedEnemies: new Set(), // Track enemies for DoT effects
            lastDotTick: now
        };

        // Initialize traps array if it doesn't exist
        if (!this.gameState.traps) {
            this.gameState.traps = [];
        }

        this.gameState.traps.push(trap);
    }

    updateTraps(deltaTime) {
        if (!this.gameState.traps) return;

        const now = Date.now();
        
        // Update existing traps
        this.gameState.traps = this.gameState.traps.filter(trap => {
            // Check if trap has expired naturally
            if (now - trap.deployTime > trap.duration) {
                return false;
            }

            // Check if spike trap or explosive mine should despawn after being used
            if ((trap.weaponId === 'SPIKE_TRAP' && trap.triggered) || 
                (trap.weaponId === 'EXPLOSIVE_MINE' && trap.exploded)) {
                const timeAfterUse = trap.triggered ? (now - trap.triggerTime) : (now - trap.explodeTime);
                
                // For explosive mines, despawn immediately after exploding
                // For spike traps, despawn 0.5 seconds after being triggered
                const despawnDelay = trap.weaponId === 'EXPLOSIVE_MINE' ? 0 : 500;
                if (timeAfterUse >= despawnDelay) {
                    return false;
                }
            }

            // Arm trap if enough time has passed
            if (!trap.armed && now - trap.deployTime >= trap.armTime) {
                trap.armed = true;
            }

            if (trap.armed && trap.active) {
                this.processTrapLogic(trap, now);
            }

            return true;
        });
    }

    processTrapLogic(trap, now) {
        switch (trap.weaponId) {
            case 'SPIKE_TRAP':
                this.processSpikeTraps(trap, now);
                break;
            case 'WEB_LAUNCHER':
                this.processWebTrap(trap, now);
                break;
            case 'EXPLOSIVE_MINE':
                this.processExplosiveMine(trap, now);
                break;
            case 'POISON_CLOUD':
                this.processPoisonCloud(trap, now);
                break;
        }
    }

    processSpikeTraps(trap, now) {
        // Check for enemies in trigger range (only enemies can trigger, not allies or player)
        const enemiesInRange = this.gameState.enemies.filter(enemy => {
            const dx = (enemy.x + enemy.width / 2) - (trap.x + trap.width / 2);
            const dy = (enemy.y + enemy.height / 2) - (trap.y + trap.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= trap.triggerRange;
        });

        if (enemiesInRange.length > 0 && !trap.triggered) {
            // Trigger trap - damage all enemies in range
            enemiesInRange.forEach(enemy => {
                enemy.health -= trap.damage;
                if (enemy.health <= 0) {
                    enemy.markedForDeath = true;
                }
            });

            // Create damage particles
            if (this.particleEngine) {
                this.particleEngine.createExplosion(
                    trap.x + trap.width / 2,
                    trap.y + trap.height / 2,
                    trap.color,
                    15
                );
            }

            // Mark as triggered and make half transparent immediately
            trap.triggered = true;
            trap.triggerTime = now;
            trap.halfTransparent = true; // Become half transparent immediately
        }
    }

    processWebTrap(trap, now) {
        // Continuously slow enemies in the web area and deal damage on first contact
        this.gameState.enemies.forEach(enemy => {
            const dx = (enemy.x + enemy.width / 2) - (trap.x + trap.width / 2);
            const dy = (enemy.y + enemy.height / 2) - (trap.y + trap.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= trap.width / 2) {
                // Apply slow effect
                if (!enemy.webbed) {
                    enemy.originalSpeed = enemy.speed;
                    enemy.webbed = true;
                    
                    // Deal 1 damage when enemy first enters web
                    enemy.health -= trap.damage;
                    if (enemy.health <= 0) {
                        enemy.markedForDeath = true;
                    }
                }
                enemy.speed = enemy.originalSpeed * trap.slowEffect;
                enemy.webbedUntil = now + 1000; // Effect lasts 1 second after leaving web
            }
        });
    }

    processExplosiveMine(trap, now) {
        let shouldExplode = false;
        const timeLeft = trap.duration - (now - trap.deployTime);
        
        // Start blinking when close to natural detonation
        if (timeLeft <= trap.blinkDuration && !trap.proximityTriggered) {
            trap.isBlinking = true;
            // Calculate blink frequency - faster as time gets closer to detonation
            const blinkSpeed = Math.max(100, timeLeft / 10); // Faster blinking as time runs out
            trap.visible = Math.floor(now / blinkSpeed) % 2 === 0;
        }

        // Check proximity trigger (only enemies can trigger, not allies or player)
        if (trap.trigger.includes('proximity') && !trap.proximityTriggered) {
            const enemiesInRange = this.gameState.enemies.filter(enemy => {
                const dx = (enemy.x + enemy.width / 2) - (trap.x + trap.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (trap.y + trap.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= trap.triggerRange;
            });
            
            // Start proximity warning when enemy gets close
            if (enemiesInRange.length > 0) {
                trap.proximityTriggered = true;
                trap.proximityTriggerTime = now;
                trap.isBlinking = true; // Override any existing blinking
            }
        }

        // Handle proximity warning blinking
        if (trap.proximityTriggered) {
            const timeSinceProximity = now - trap.proximityTriggerTime;
            
            // Rapid blinking during proximity warning
            const rapidBlinkSpeed = 100; // Very fast blinking
            trap.visible = Math.floor(now / rapidBlinkSpeed) % 2 === 0;
            
            // Explode after proximity warning time
            if (timeSinceProximity >= trap.proximityWarningTime) {
                shouldExplode = true;
            }
        }

        // Check timer trigger (natural expiration)
        if (trap.trigger.includes('timer') && now - trap.deployTime >= trap.duration) {
            shouldExplode = true;
        }

        if (shouldExplode && !trap.exploded) {
            // Damage all enemies in explosion radius
            this.gameState.enemies.forEach(enemy => {
                const dx = (enemy.x + enemy.width / 2) - (trap.x + trap.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (trap.y + trap.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= trap.explosionRadius) {
                    // Apply damage with distance falloff
                    const damageMultiplier = 1 - (distance / trap.explosionRadius) * 0.5;
                    const finalDamage = Math.floor(trap.damage * damageMultiplier);
                    enemy.health -= finalDamage;
                    if (enemy.health <= 0) {
                        enemy.markedForDeath = true;
                    }
                }
            });

            // Create explosion particles
            if (this.particleEngine) {
                this.particleEngine.createExplosion(
                    trap.x + trap.width / 2,
                    trap.y + trap.height / 2,
                    {
                        particleCount: 30,
                        colors: ['#ff4444', '#ff8844', '#ffaa44', '#ffcc44', '#ff0000'],
                        minSize: 3,
                        maxSize: 8,
                        minSpeed: 4,
                        maxSpeed: 12,
                        minLife: 300,
                        maxLife: 600
                    }
                );
            }

            // Mark as exploded and make half transparent immediately
            trap.exploded = true;
            trap.explodeTime = now;
            trap.halfTransparent = true; // Become half transparent immediately
        }
    }

    processPoisonCloud(trap, now) {
        // Apply DoT damage to enemies in the poison cloud
        this.gameState.enemies.forEach(enemy => {
            const dx = (enemy.x + enemy.width / 2) - (trap.x + trap.width / 2);
            const dy = (enemy.y + enemy.height / 2) - (trap.y + trap.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= trap.width / 2) {
                // Initialize poison tracking for this enemy if needed
                if (!enemy.poisonEffects) {
                    enemy.poisonEffects = new Map();
                }

                const trapId = trap.id;
                const lastPoisonTick = enemy.poisonEffects.get(trapId) || 0;

                // Apply poison damage if enough time has passed for this specific enemy/trap combination
                if (now - lastPoisonTick >= trap.dotInterval) {
                    // Calculate poison damage scaling with poison cloud weapon count
                    const poisonCloudWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'POISON_CLOUD');
                    const basePoisonDamage = 0.05; // 5% base damage
                    const bonusDamagePerStack = 0.05; // +5% per additional poison cloud weapon
                    const totalPoisonPercent = basePoisonDamage + (bonusDamagePerStack * poisonCloudWeapons.length);
                    const poisonDamage = Math.ceil(enemy.maxHealth * totalPoisonPercent);
                    
                    enemy.health -= poisonDamage;
                    if (enemy.health <= 0) {
                        enemy.markedForDeath = true;
                    }

                    // Update the last poison tick for this enemy/trap combination
                    enemy.poisonEffects.set(trapId, now);

                    // Create poison particles for visual effect
                    if (this.particleEngine) {
                        this.particleEngine.createEnemyHitEffect(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#90EE90'
                        );
                    }
                }
            } else {
                // Enemy left the poison cloud, start lingering poison effect
                if (enemy.poisonEffects && enemy.poisonEffects.has(trap.id)) {
                    const poisonData = enemy.poisonEffects.get(trap.id);
                    
                    // If this is a number (old format), convert to object format
                    if (typeof poisonData === 'number') {
                        enemy.poisonEffects.set(trap.id, {
                            lastTick: poisonData,
                            exitTime: now,
                            isLingering: true
                        });
                    } else if (!poisonData.isLingering) {
                        // Mark as lingering when enemy exits cloud
                        poisonData.exitTime = now;
                        poisonData.isLingering = true;
                    }
                }
            }
        });

        // Process lingering poison effects for enemies outside clouds
        this.gameState.enemies.forEach(enemy => {
            if (!enemy.poisonEffects) return;

            enemy.poisonEffects.forEach((poisonData, trapId) => {
                // Handle old number format
                if (typeof poisonData === 'number') return;

                if (poisonData.isLingering) {
                    const timeSinceExit = now - poisonData.exitTime;
                    
                    // Continue poison for 1 second after exiting
                    if (timeSinceExit <= 1000) {
                        const timeSinceLastTick = now - poisonData.lastTick;
                        
                        if (timeSinceLastTick >= trap.dotInterval) {
                            // Apply lingering poison damage (5% of max health)
                            const poisonDamage = Math.ceil(enemy.maxHealth * 0.05);
                            enemy.health -= poisonDamage;
                            if (enemy.health <= 0) {
                                enemy.markedForDeath = true;
                            }

                            poisonData.lastTick = now;

                            // Create poison particles for visual effect
                            if (this.particleEngine) {
                                this.particleEngine.createEnemyHitEffect(
                                    enemy.x + enemy.width / 2,
                                    enemy.y + enemy.height / 2,
                                    '#90EE90'
                                );
                            }
                        }
                    } else {
                        // Remove poison effect after 1 second
                        enemy.poisonEffects.delete(trapId);
                    }
                }
            });
        });
    }

    processPoisonAura(now, playerCenterX, playerCenterY) {
        // Check if player has poison cloud weapon
        const hasPoisonCloud = this.gameState.player.weapons.some(weapon => weapon.id === 'POISON_CLOUD');
        if (!hasPoisonCloud) return;

        const poisonCloudWeapon = WEAPONS.POISON_CLOUD;
        const auraConfig = poisonCloudWeapon.aura;

        // Apply poison damage to enemies within aura radius
        this.gameState.enemies.forEach(enemy => {
            const dx = (enemy.x + enemy.width / 2) - playerCenterX;
            const dy = (enemy.y + enemy.height / 2) - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= auraConfig.radius) {
                // Initialize poison aura tracking for this enemy if needed
                if (!enemy.poisonAuraEffects) {
                    enemy.poisonAuraEffects = {};
                }

                const lastAuraTick = enemy.poisonAuraEffects.lastTick || 0;

                // Apply poison damage if enough time has passed
                if (now - lastAuraTick >= auraConfig.dotInterval) {
                    // Calculate poison aura damage scaling with poison cloud weapon count
                    const poisonCloudWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'POISON_CLOUD');
                    const basePoisonDamage = 0.05; // 5% base damage
                    const bonusDamagePerStack = 0.05; // +5% per additional poison cloud weapon
                    const totalPoisonPercent = basePoisonDamage + (bonusDamagePerStack * poisonCloudWeapons.length);
                    const auraPoisonDamage = Math.ceil(enemy.maxHealth * totalPoisonPercent);
                    
                    // Apply poison damage
                    enemy.health -= auraPoisonDamage;
                    if (enemy.health <= 0) {
                        enemy.markedForDeath = true;
                    }

                    // Update the last poison tick
                    enemy.poisonAuraEffects.lastTick = now;

                    // Create poison particles for visual effect
                    if (this.particleEngine) {
                        this.particleEngine.createEnemyHitEffect(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#90EE90'
                        );
                    }
                }
            }
        });
    }

    processUmbrellaRain(now) {
        // Check if player has 20+ umbrella weapons
        const umbrellaWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'UMBRELLA');
        if (umbrellaWeapons.length < 20) return;

        // Initialize rain tracking if needed
        if (!this.rainState) {
            this.rainState = {
                lastRainTick: 0,
                rainDroplets: [],
                extremeRainActive: false,
                extremeRainStart: 0,
                extremeRainDuration: 3000, // 3 seconds
                lastExtremeRainCheck: 0,
                extremeRainCooldown: 15000, // 15 seconds between possible extreme rain
                thunderStormActive: false,
                thunderStormStart: 0,
                thunderStormDuration: 60000, // 60 seconds
                lastThunderStormCheck: 0,
                thunderStormCooldown: 120000, // 2 minutes between possible thunder storms
                lastThunderStrike: 0,
                thunderStrikeCooldown: 1000 // 1 second between thunder strikes
            };
        }

        // Check for thunder storms (less frequent, longer duration)
        if (now - this.rainState.lastThunderStormCheck >= 5000) { // Check every 5 seconds
            this.rainState.lastThunderStormCheck = now;
            
            // 5% chance every 5 seconds to trigger thunder storm (if not on cooldown)
            if (!this.rainState.thunderStormActive && !this.rainState.extremeRainActive &&
                now - (this.rainState.thunderStormStart + this.rainState.thunderStormDuration) >= this.rainState.thunderStormCooldown) {
                
                if (Math.random() < 0.05) {
                    this.rainState.thunderStormActive = true;
                    this.rainState.thunderStormStart = now;
                    console.log("THUNDER STORM ACTIVATED!");
                }
            }
        }

        // Check for extreme rain bursts (only if no thunder storm)
        if (!this.rainState.thunderStormActive && now - this.rainState.lastExtremeRainCheck >= 1000) { // Check every second
            this.rainState.lastExtremeRainCheck = now;
            
            // 8% chance per second to trigger extreme rain (if not on cooldown)
            if (!this.rainState.extremeRainActive && 
                now - (this.rainState.extremeRainStart + this.rainState.extremeRainDuration) >= this.rainState.extremeRainCooldown) {
                
                if (Math.random() < 0.08) {
                    this.rainState.extremeRainActive = true;
                    this.rainState.extremeRainStart = now;
                    console.log("EXTREME RAIN BURST ACTIVATED!");
                }
            }
        }

        // Check if thunder storm should end
        if (this.rainState.thunderStormActive && 
            now - this.rainState.thunderStormStart >= this.rainState.thunderStormDuration) {
            this.rainState.thunderStormActive = false;
            console.log("Thunder storm ended");
        }

        // Check if extreme rain should end
        if (this.rainState.extremeRainActive && 
            now - this.rainState.extremeRainStart >= this.rainState.extremeRainDuration) {
            this.rainState.extremeRainActive = false;
            console.log("Extreme rain burst ended");
        }

        // Process thunder strikes during thunder storm
        if (this.rainState.thunderStormActive && 
            now - this.rainState.lastThunderStrike >= this.rainState.thunderStrikeCooldown) {
            this.processThunderStrike(now);
            this.rainState.lastThunderStrike = now;
        }

        // Determine rain intensity based on storm type
        const isThunderStorm = this.rainState.thunderStormActive;
        const isExtremeRain = this.rainState.extremeRainActive && !isThunderStorm;
        
        let rainInterval, dropletsPerTick, speedMultiplier, damageMultiplier;
        
        if (isThunderStorm) {
            // Thunder storm: 1.5x more rain than extreme rain
            rainInterval = 35; // Even faster than extreme rain
            dropletsPerTick = 67; // 1.5x the extreme rain amount (45 * 1.5)
            speedMultiplier = 1.3;
            damageMultiplier = 1.5;
        } else if (isExtremeRain) {
            // Extreme rain burst
            rainInterval = 50;
            dropletsPerTick = 45;
            speedMultiplier = 1.2;
            damageMultiplier = 1.5;
        } else {
            // Normal rain
            rainInterval = 200;
            dropletsPerTick = 15;
            speedMultiplier = 1.0;
            damageMultiplier = 1.0;
        }
        
        // Create new rain droplets
        if (now - this.rainState.lastRainTick >= rainInterval) {
            // Create multiple rain droplets across the screen
            for (let i = 0; i < dropletsPerTick; i++) {
                const droplet = {
                    x: Math.random() * (CANVAS_WIDTH + 200) - 100, // Slightly wider than screen
                    y: -50, // Start above screen
                    speed: (300 + Math.random() * 200) * speedMultiplier,
                    damage: 0.1 * damageMultiplier,
                    createdAt: now,
                    hitEnemies: new Set(), // Track which enemies this droplet has hit
                    stormType: isThunderStorm ? 'thunder' : (isExtremeRain ? 'extreme' : 'normal')
                };
                this.rainState.rainDroplets.push(droplet);
            }
            this.rainState.lastRainTick = now;
        }

        // Update existing rain droplets
        this.rainState.rainDroplets = this.rainState.rainDroplets.filter(droplet => {
            // Move droplet down
            const deltaTime = (now - droplet.createdAt) / 1000;
            droplet.y = -50 + (droplet.speed * deltaTime);

            // Remove droplets that have fallen off screen
            if (droplet.y > CANVAS_HEIGHT + 50) {
                return false;
            }

            // Check collision with enemies
            this.gameState.enemies.forEach(enemy => {
                if (droplet.hitEnemies.has(enemy.id)) return; // Already hit this enemy

                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                
                // Check if droplet hits enemy (simple collision)
                if (Math.abs(droplet.x - enemyCenterX) < enemy.width / 2 && 
                    Math.abs(droplet.y - enemyCenterY) < enemy.height / 2) {
                    
                    // Apply amplified poison damage (10% of max health)
                    const rainDamage = Math.ceil(enemy.maxHealth * droplet.damage);
                    enemy.health -= rainDamage;
                    
                    if (enemy.health <= 0) {
                        enemy.markedForDeath = true;
                    }

                    // Mark this enemy as hit by this droplet
                    droplet.hitEnemies.add(enemy.id);

                    // Create visual effect
                    if (this.particleEngine) {
                        this.particleEngine.createEnemyHitEffect(
                            enemyCenterX,
                            enemyCenterY,
                            '#00BFFF' // Blue for rain effect
                        );
                    }
                }
            });

            return true;
        });
    }

    processThunderStrike(now) {
        // Create list of all possible targets (enemies + player if they have 20+ umbrellas)
        const possibleTargets = [...this.gameState.enemies];
        
        // Players with 20+ umbrellas can be hit by thunder (only source of damage for them)
        const umbrellaWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'UMBRELLA');
        if (umbrellaWeapons.length >= 20) {
            possibleTargets.push({
                isPlayer: true,
                x: this.gameState.player.x,
                y: this.gameState.player.y,
                width: this.gameState.player.width,
                height: this.gameState.player.height
            });
        }

        if (possibleTargets.length === 0) return;

        // Select random target
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        // For player targets, add 30% hit chance
        if (target.isPlayer && Math.random() > 0.3) {
            console.log("Thunder strike missed the player (70% chance to miss)");
            return; // Thunder strike misses the player
        }
        
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        // Create thunder strike effect
        if (!this.rainState.thunderStrikes) {
            this.rainState.thunderStrikes = [];
        }

        const thunderStrike = {
            x: targetCenterX,
            y: targetCenterY,
            createdAt: now,
            duration: 500, // Thunder visual lasts 0.5 seconds
            target: target
        };

        this.rainState.thunderStrikes.push(thunderStrike);

        // Apply damage
        if (target.isPlayer) {
            // Thunder damage CANNOT be dodged - bypasses all umbrella dodge mechanics
            // This is the only way players with 20+ umbrellas can take damage
            const oldHealth = this.gameState.player.health;
            this.gameState.player.health = Math.max(0, this.gameState.player.health - 25);
            
            console.log(`Thunder struck player for 25 damage! Health: ${oldHealth} -> ${this.gameState.player.health} (UNDODGEABLE)`);
            
            // Set brief invulnerability frames using the game's proper system
            this.gameState.player.invulnerable = true;
            this.gameState.player.lastHit = Date.now();
            // Note: invulnerability will be removed by playerController.updateInvulnerability()
            // after the normal invulnerabilityDuration (1000ms)
            
            if (this.gameState.player.health <= 0) {
                // Player death will be handled by the main game loop
                console.log("Player killed by thunder strike!");
            }
        } else {
            // Damage enemy
            target.health -= 25;
            if (target.health <= 0) {
                target.markedForDeath = true;
            }
        }

        // Create visual effect
        if (this.particleEngine) {
            this.particleEngine.createEnemyHitEffect(
                targetCenterX,
                targetCenterY,
                '#FFFF00' // Yellow for thunder effect
            );
        }

        // Clean up old thunder strikes
        this.rainState.thunderStrikes = this.rainState.thunderStrikes.filter(
            strike => now - strike.createdAt < strike.duration
        );
    }

    // Check if player has complete scythe set (at least one of each scythe type)
    hasCompleteScytheSet() {
        const scytheTypes = ['SCYTHE', 'DRAGON_SCYTHE', 'NATURE_SCYTHE', 'CRYSTAL_SCYTHE'];
        const unlockedWeapons = this.gameState.getUnlockedWeapons();
        
        return scytheTypes.every(scytheType => unlockedWeapons.includes(scytheType));
    }

    // Calculate additional damage based on set bonuses
    calculateSetBonusDamage(enemy, weapon) {
        let bonusDamage = 0;
        
        // Scythe set bonus
        const scytheTypes = ['SCYTHE', 'DRAGON_SCYTHE', 'NATURE_SCYTHE', 'CRYSTAL_SCYTHE'];
        if (scytheTypes.includes(weapon.id) && this.hasCompleteScytheSet()) {
            bonusDamage += Math.max(1, Math.round((enemy.maxHealth || enemy.health) * 0.01));
        }

        // Bow set bonus
        const bowTypes = ['BOW', 'DRAGON_BOW', 'TRIPLE_BOW'];
        if (bowTypes.includes(weapon.id) && this.hasCompleteBowSet()) {
            bonusDamage += Math.max(1, Math.round((enemy.maxHealth || enemy.health) * 0.01));
        }

        return bonusDamage;
    }

    hasCompleteBowSet() {
        // Check if player has at least 1 of each bow type
        const bowTypes = ['BOW', 'DRAGON_BOW', 'TRIPLE_BOW'];
        const playerWeapons = this.gameState.player.weapons.map(w => w.id);
        return bowTypes.every(type => playerWeapons.includes(type));
    }

    updateRalseiHealing() {
        // Check if player has Ralsei weapon
        const ralseiWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'RALSEI');
        if (ralseiWeapons.length === 0) return;

        const now = Date.now();
        const weapon = WEAPONS.RALSEI;
        
        // Initialize healing tracking if needed
        if (!this.gameState.player.ralseiHealingState) {
            this.gameState.player.ralseiHealingState = {
                lastHealTime: 0
            };
        }

        const healingState = this.gameState.player.ralseiHealingState;
        const weaponCount = ralseiWeapons.length;

        // Heal player (scales with weapon count)
        if (now - healingState.lastHealTime >= weapon.healInterval) {
            const totalHealAmount = weapon.healAmount * weaponCount;
            if (this.gameState.player.health < this.gameState.player.maxHealth) {
                this.gameState.player.health = Math.min(
                    this.gameState.player.maxHealth,
                    this.gameState.player.health + totalHealAmount
                );

                // Create healing particle effect
                if (this.particleEngine) {
                    this.particleEngine.createHealingEffect(
                        this.gameState.player.x + this.gameState.player.width / 2,
                        this.gameState.player.y + this.gameState.player.height / 2,
                        '#FF69B4' // Pink color for Ralsei
                    );
                }
            }
            healingState.lastHealTime = now;
        }
    }

    handlePassiveItem(weapon, count) {
        // Store passive item info for use by other systems
        // The stacking effects are handled where the actual mechanics are processed
        if (!this.gameState.passiveItems) {
            this.gameState.passiveItems = {};
        }
        
        // Store the count for each passive item type for stacking calculations
        this.gameState.passiveItems[weapon.id] = {
            count: count,
            stackMultiplier: Math.pow(2, count - 1) // Effects double per stack
        };
        
        console.log(`🔮 [SHOP EXCLUSIVE DEBUG] ${weapon.name}: ${count} stacks detected, ${this.gameState.passiveItems[weapon.id].stackMultiplier}x effect multiplier active`);
    }

    processPassiveItems(weaponGroups) {
        // Process all passive shop exclusive items to update their state
        const passiveWeaponIds = [
            'ENTROPY_REACTOR',
            'VOLTAGE_LOOP', 
            'THERMAL_CONVERTER',
            'WRAITH_DRIVE',
            'NULL_BARRIER',
            'FRACTAL_LENS'
        ];

        console.log(`🔄 [PASSIVE PROCESSING] Checking for passive items in weapon groups:`, Object.keys(weaponGroups));

        let foundPassiveItems = 0;
        passiveWeaponIds.forEach(weaponId => {
            if (weaponGroups[weaponId]) {
                const weapons = weaponGroups[weaponId];
                const weapon = weapons[0];
                const count = weapons.length;
                
                console.log(`🔮 [PASSIVE PROCESSING] Found ${weaponId}: ${count} stacks, processing...`);
                
                // Call handlePassiveItem to update the passive items state
                this.handlePassiveItem(weapon, count);
                foundPassiveItems++;
            }
        });
        
        if (foundPassiveItems === 0) {
            console.log(`⚠️ [PASSIVE PROCESSING] No passive shop exclusive items found in current weapons`);
        }
    }
}
