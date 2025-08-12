import { WEAPONS } from './constants.js';

export class WeaponSystem {
    constructor(gameState, particleEngine = null) {
        this.gameState = gameState;
        this.particleEngine = particleEngine;
    }

    update(deltaTime) {
        // Continuously attempt to attack enemies
        this.attack();
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
        const scaledCooldown = weapon.cooldown / count;
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
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const dx = enemyCenterX - scytheX;
                const dy = enemyCenterY - scytheY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= enemy.width / 2 + weapon.range) {
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

    createProjectile(weapon, x, y, angle) {
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
        // Filter dragon weapons for starting selection
        if (!isBossReward && Math.random() > 0.05) {
            weaponsList = weaponsList.filter(([id]) => !id.includes('DRAGON'));
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

    // When scaling enemy HP after boss fight, also scale speed
    scaleEnemyStatsAfterBoss() {
        this.gameState.enemyHPMultiplier *= 2;
        // Scale speed for all current and future enemies, including bosses
        this.gameState.enemies.forEach(enemy => {
            enemy.speed *= 2;
        });
        // Also scale base speed for future bosses if you use a base value
        if (this.gameState.bossBaseSpeed) {
            this.gameState.bossBaseSpeed *= 2;
        }
        this.gameState.enemySpeedMultiplier = (this.gameState.enemySpeedMultiplier || 1) * 2;
    }
}
