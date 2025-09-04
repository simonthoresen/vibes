import { WEAPONS, COMPANION_TYPES } from './constants.js';

export class WeaponSystem {
    constructor(gameState, particleEngine = null) {
        this.gameState = gameState;
        this.particleEngine = particleEngine;
        
        // Sound pool for bow shooting to prevent lag
        this.bowSoundPool = [];
        this.activeBowSounds = 0;
        this.maxConcurrentBowSounds = 3; // Increased to 3 for faster sound effects
        this.currentSoundIndex = 0; // For round-robin sound selection
        this.initializeBowSoundPool();
    }

    initializeBowSoundPool() {
        // Pre-create bow sound instances for reuse
        for (let i = 0; i < this.maxConcurrentBowSounds; i++) {
            const sound = new Audio('sounds/bow-shooting.wav');
            sound.volume = 0.7;
            sound.preload = 'auto'; // Ensure fast loading
            
            // Handle when sound ends to free up the slot
            sound.addEventListener('ended', () => {
                this.activeBowSounds = Math.max(0, this.activeBowSounds - 1);
            });
            
            // Also handle errors to prevent stuck counters
            sound.addEventListener('error', () => {
                this.activeBowSounds = Math.max(0, this.activeBowSounds - 1);
            });
            
            // Optimize for fast restart
            sound.addEventListener('loadeddata', () => {
                sound.fastRestart = true;
            });
            
            this.bowSoundPool.push(sound);
        }
        
        console.log(`Initialized bow sound pool with ${this.maxConcurrentBowSounds} sounds`);
    }

    playBowSound() {
        if (!this.gameState.settings || !this.gameState.settings.gameSounds) {
            return;
        }
        
        // Always play a sound - either find available or use round-robin
        let availableSound = this.bowSoundPool.find(sound => 
            sound.paused || sound.ended || sound.currentTime === 0
        );
        
        // If no available sound, use round-robin to cycle through sounds
        if (!availableSound) {
            availableSound = this.bowSoundPool[this.currentSoundIndex];
            this.currentSoundIndex = (this.currentSoundIndex + 1) % this.maxConcurrentBowSounds;
        }
        
        if (availableSound) {
            // Track active sounds but don't prevent playing
            if (this.activeBowSounds < this.maxConcurrentBowSounds) {
                this.activeBowSounds++;
            }
            
            // Reset and play immediately for fast response
            availableSound.currentTime = 0;
            availableSound.play().catch(error => {
                // Silently handle errors to prevent console spam
                this.activeBowSounds = Math.max(0, this.activeBowSounds - 1);
            });
        }
    }

    update(deltaTime) {
        // Handle orbital weapons (create companions if needed)
        this.updateOrbitalWeapons();
        
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
                    this.createOrbitalSkull(weapon, playerCenterX, playerCenterY, existingSkulls + i);
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

        // Process each weapon group
        Object.values(weaponGroups).forEach(weapons => {
            this.processWeaponGroup(weapons, now, playerCenterX, playerCenterY, closestEnemy);
        });
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
        this.gameState.player.weapons.forEach(weapon => {
            if (!weaponGroups[weapon.id]) {
                weaponGroups[weapon.id] = [];
            }
            weaponGroups[weapon.id].push(weapon);
        });
        return weaponGroups;
    }

    processWeaponGroup(weapons, now, playerCenterX, playerCenterY, closestEnemy) {
        const weapon = weapons[0];
        const count = weapons.length;
        
        // Check weapon cooldown (faster with more weapons)
        let scaledCooldown = weapon.cooldown / count;
        
        // Apply Ice Staff attack speed reduction if enemies are in frost zones
        if (weapon.sprite === 'Ice_staff.png' && this.gameState.iceStaffSlowEndTime && now < this.gameState.iceStaffSlowEndTime) {
            scaledCooldown = scaledCooldown / weapon.attackSpeedReduction; // Increase cooldown (slower attack)
        }
        
        if (now - (this.gameState.player.lastAttacks[weapon.id] || 0) < scaledCooldown) {
            return;
        }
        
        // Update last attack time for this weapon
        this.gameState.player.lastAttacks[weapon.id] = now;

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
        
        // Create multiple projectiles based on weapon count
        for (let i = 0; i < count; i++) {
            const spreadAngle = (i - (count - 1) / 2) * 0.1;
            const leadAngle = Math.atan2(
                predictedY + closestEnemy.height / 2 - playerCenterY,
                predictedX + closestEnemy.width / 2 - playerCenterX
            ) + spreadAngle;

            this.createProjectile(weapon, playerCenterX, playerCenterY, leadAngle);
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
        // Play bow shooting sound for bow weapons using sound pool
        if (weapon.name && (weapon.name.includes('Bow') || weapon.name.includes('bow'))) {
            this.playBowSound();
        }
        
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
            hitEnemies: new Set()
        });
    }

    damageEnemy(enemy, weapon, hitTime) {
        const damage = this.gameState.player.oneHitKill ? enemy.maxHealth || 9999 : weapon.damage;
        const enemyWillDie = enemy.health - damage <= 0;
        
        enemy.health -= damage;
        enemy.hitTime = hitTime;
        
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

        // Get available weapons
        let weaponsList = Object.entries(WEAPONS);
        // Filter dragon weapons and legendary summon weapons for starting selection
        if (!isBossReward && Math.random() > 0.05) {
            weaponsList = weaponsList.filter(([id]) => !id.includes('DRAGON') && !id.includes('CURSED_ORB') && !id.includes('FLAMING_SKULL'));
        }
        // Shuffle and take first 3
        this.shuffleArray(weaponsList);
        weaponsList.slice(0, 3).forEach(([id, weapon]) => {
            const option = this.createWeaponOption(id, weapon, isBossReward);
            weaponOptions.appendChild(option);
        });
    }

    createWeaponOption(id, weapon, isBossReward) {
        const option = document.createElement('div');
        option.className = 'weapon-choice';
        option.style.border = `2px solid ${weapon.color}`;
        
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
        const newWeapon = { ...weapon, id };
        
        if (isBossReward) {
            this.gameState.player.weapons.push(newWeapon);
            this.gameState.floorCleared = true;
        } else {
            this.gameState.player.weapons = [newWeapon];
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

        // Create new demon with scaling based on weapon count
        const demon = this.createDemon(companionType, weapon, playerCenterX, playerCenterY, count);
        this.gameState.allies.push(demon);

        // Create summoning effect particles
        if (this.particleEngine) {
            this.particleEngine.createSummonEffect(demon.x + demon.width/2, demon.y + demon.height/2, weapon.color);
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
                this.createOrbitalSkull(weapon, playerCenterX, playerCenterY, existingSkulls + i);
            }
        }
    }

    createOrbitalSkull(weapon, playerCenterX, playerCenterY, index) {
        // Position the skull in orbit around the player
        const angle = (index * 2 * Math.PI) / Math.max(1, this.gameState.player.weapons.filter(w => w.id === 'FLAMING_SKULL').length);
        const radius = weapon.orbitRadius || 100;
        
        const skull = {
            x: playerCenterX + Math.cos(angle) * radius - 16,
            y: playerCenterY + Math.sin(angle) * radius - 16,
            width: 32,
            height: 32,
            health: 999999, // Immortal
            maxHealth: 999999,
            damage: weapon.damage,
            speed: 3, // Flying speed for autonomous movement
            type: 'orbital_skull',
            sourceWeapon: weapon.id,
            sprite: weapon.sprite,
            orbitAngle: angle,
            orbitRadius: radius,
            lastAttack: 0,
            attackCooldown: weapon.cooldown,
            attackRange: weapon.attackRange,
            permanent: true,
            spawnTime: Date.now()
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
            duration: weapon.minionDuration,
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
}
