export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Load arrow sprites
        this.arrowImage = new Image();
        this.arrowImage.src = 'images/arrow.png';
        this.arrowImageLoaded = false;
        this.arrowImage.onload = () => {
            this.arrowImageLoaded = true;
        };
        
        this.dragonArrowImage = new Image();
        this.dragonArrowImage.src = 'images/dragon-arrow.png';
        this.dragonArrowImageLoaded = false;
        this.dragonArrowImage.onload = () => {
            this.dragonArrowImageLoaded = true;
        };
        
        // Load sword sprites
        this.swordImage = new Image();
        this.swordImage.src = 'images/Sword.png';
        this.swordImageLoaded = false;
        this.swordImage.onload = () => {
            this.swordImageLoaded = true;
        };
        
        this.dragonSwordImage = new Image();
        this.dragonSwordImage.src = 'images/dragon-sword.png';
        this.dragonSwordImageLoaded = false;
        this.dragonSwordImage.onload = () => {
            this.dragonSwordImageLoaded = true;
        };
        
        // Load bow sprite
        this.bowImage = new Image();
        this.bowImage.src = 'images/Bow.png';
        this.bowImageLoaded = false;
        this.bowImage.onload = () => {
            this.bowImageLoaded = true;
        };
        
        // Load dragon bow sprite
        this.dragonBowImage = new Image();
        this.dragonBowImage.src = 'images/dragon-bow.png';
        this.dragonBowImageLoaded = false;
        this.dragonBowImage.onload = () => {
            this.dragonBowImageLoaded = true;
        };
        
        // Load scythe sprites
        this.scytheImage = new Image();
        this.scytheImage.src = 'images/normal-scythe.png';
        this.scytheImageLoaded = false;
        this.scytheImage.onload = () => {
            this.scytheImageLoaded = true;
        };

        this.dragonScytheImage = new Image();
        this.dragonScytheImage.src = 'images/dragon-scythe.png';
        this.dragonScytheImageLoaded = false;
        this.dragonScytheImage.onload = () => {
            this.dragonScytheImageLoaded = true;
        };
        
        // Load nature scythe sprite
        this.natureScytheImage = new Image();
        this.natureScytheImage.src = 'images/Nature-scythe.png';
        this.natureScytheImageLoaded = false;
        this.natureScytheImage.onload = () => {
            this.natureScytheImageLoaded = true;
        };
        
        // Load crystal scythe sprite
        this.crystalScytheImage = new Image();
        this.crystalScytheImage.src = 'images/Crystal-scythe.png';
        this.crystalScytheImageLoaded = false;
        this.crystalScytheImage.onload = () => {
            this.crystalScytheImageLoaded = true;
        };

        // Load staff sprites
        this.fireStaffImage = new Image();
        this.fireStaffImage.src = 'images/Fire_staff.png';
        this.fireStaffImageLoaded = false;
        this.fireStaffImage.onload = () => {
            this.fireStaffImageLoaded = true;
            console.log('Fire Staff image loaded successfully');
        };
        this.fireStaffImage.onerror = () => {
            console.error('Failed to load Fire Staff image: images/Fire_staff.png');
        };

        this.iceStaffImage = new Image();
        this.iceStaffImage.src = 'images/Ice_staff.png';
        this.iceStaffImageLoaded = false;
        this.iceStaffImage.onload = () => {
            this.iceStaffImageLoaded = true;
        };

        this.lightningStaffImage = new Image();
        this.lightningStaffImage.src = 'images/lightning_staff.png';
        this.lightningStaffImageLoaded = false;
        this.lightningStaffImage.onload = () => {
            this.lightningStaffImageLoaded = true;
        };

        this.healingStaffImage = new Image();
        this.healingStaffImage.src = 'images/Healing_staff.png';
        this.healingStaffImageLoaded = false;
        this.healingStaffImage.onload = () => {
            this.healingStaffImageLoaded = true;
        };

        // Load throwing weapon sprites
        this.spiritBladeImage = new Image();
        this.spiritBladeImage.src = 'images/Spirit_blade.png';
        this.spiritBladeImageLoaded = false;
        this.spiritBladeImage.onload = () => {
            this.spiritBladeImageLoaded = true;
            console.log('Spirit Blade image loaded successfully');
        };
        this.spiritBladeImage.onerror = () => {
            console.error('Failed to load Spirit Blade image: images/Spirit_blade.png');
        };

        this.boomerangImage = new Image();
        this.boomerangImage.src = 'images/Boomerang.png';
        this.boomerangImageLoaded = false;
        this.boomerangImage.onload = () => {
            this.boomerangImageLoaded = true;
            console.log('Boomerang image loaded successfully');
        };
        this.boomerangImage.onerror = () => {
            console.error('Failed to load Boomerang image: images/Boomerang.png');
        };

        this.throwingAxeImage = new Image();
        this.throwingAxeImage.src = 'images/throwing_axe.png';
        this.throwingAxeImageLoaded = false;
        this.throwingAxeImage.onload = () => {
            this.throwingAxeImageLoaded = true;
            console.log('Throwing Axe image loaded successfully');
        };
        this.throwingAxeImage.onerror = () => {
            console.error('Failed to load Throwing Axe image: images/throwing_axe.png');
        };

        this.chakramImage = new Image();
        this.chakramImage.src = 'images/Chakram.png';
        this.chakramImageLoaded = false;
        this.chakramImage.onload = () => {
            this.chakramImageLoaded = true;
            console.log('Chakram image loaded successfully');
        };
        this.chakramImage.onerror = () => {
            console.error('Failed to load Chakram image: images/Chakram.png');
        };

        // Load skull minion sprite for flaming skull orbital weapon
        this.skullMinionImage = new Image();
        this.skullMinionImage.src = 'images/Skull_minion.png';
        this.skullMinionImageLoaded = false;
        this.skullMinionImage.onload = () => {
            this.skullMinionImageLoaded = true;
            console.log('Skull Minion image loaded successfully');
        };
        this.skullMinionImage.onerror = () => {
            console.error('Failed to load Skull Minion image: images/Skull_minion.png');
        };

        // Load summon orb sprite for cursed orb visual indicator
        this.summonOrbImage = new Image();
        this.summonOrbImage.src = 'images/summon_orb.png';
        this.summonOrbImageLoaded = false;
        this.summonOrbImage.onload = () => {
            this.summonOrbImageLoaded = true;
            console.log('Summon Orb image loaded successfully');
        };
        this.summonOrbImage.onerror = () => {
            console.error('Failed to load Summon Orb image: images/summon_orb.png');
        };

        // Load eyeball minion sprites for demons
        this.eyeballMinionImage = new Image();
        this.eyeballMinionImage.src = 'images/eyeball_minion.png';
        this.eyeballMinionImageLoaded = false;
        this.eyeballMinionImage.onload = () => {
            this.eyeballMinionImageLoaded = true;
            console.log('Eyeball Minion image loaded successfully');
        };
        this.eyeballMinionImage.onerror = () => {
            console.error('Failed to load Eyeball Minion image: images/eyeball_minion.png');
        };

        this.eyeballMinionAttackImage = new Image();
        this.eyeballMinionAttackImage.src = 'images/eyeball_minion_attack.png';
        this.eyeballMinionAttackImageLoaded = false;
        this.eyeballMinionAttackImage.onload = () => {
            this.eyeballMinionAttackImageLoaded = true;
            console.log('Eyeball Minion Attack image loaded successfully');
        };
        this.eyeballMinionAttackImage.onerror = () => {
            console.error('Failed to load Eyeball Minion Attack image: images/eyeball_minion_attack.png');
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPlayer(player) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        // Draw player with current skin color and invulnerability effect
        this.ctx.fillStyle = player.invulnerable ?
            (Math.floor(Date.now() / 100) % 2 === 0 ? '#ffffff' : player.skin.color) :
            player.skin.color;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, player.width / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw player health bar
        this.drawHealthBar(player.x, player.y - 15, player.width * 1.5, 6, player.health, player.maxHealth);
    }

    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            // Draw enemy with hit effect
            this.ctx.fillStyle = enemy.hitTime && Date.now() - enemy.hitTime < 100 ? 
                '#ff0000' : enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Draw frozen enemy overlay
            if (enemy.isFrozen || enemy.isStunned) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5; // Semi-transparent
                this.ctx.fillStyle = '#00FFFF'; // Cyan color
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Draw ice crystal pattern
                this.ctx.globalAlpha = 0.8;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                
                // Draw ice lines across the enemy
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.x, enemy.y);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                this.ctx.moveTo(enemy.x + enemy.width, enemy.y);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
            
            // Draw enemy health bar
            this.drawHealthBar(enemy.x, enemy.y - 10, enemy.width, 5, enemy.health, enemy.maxHealth);
        });
    }

    drawAllies(allies) {
        if (!allies || allies.length === 0) return;
        
        allies.forEach(ally => {
            // Draw ally with subtle glow effect to distinguish from enemies
            this.ctx.save();
            
            // Special rendering for flaming skull with sprite
            if (ally.type === 'orbital_skull' && ally.sprite) {
                if (this.skullMinionImageLoaded) {
                    // Add glow effect for skull
                    this.ctx.shadowColor = ally.color;
                    this.ctx.shadowBlur = 8;
                    
                    // Draw the skull sprite
                    this.ctx.drawImage(this.skullMinionImage, ally.x, ally.y, ally.width, ally.height);
                    
                    // Remove shadow
                    this.ctx.shadowBlur = 0;
                } else {
                    // Fallback to colored rectangle if sprite not loaded
                    this.ctx.shadowColor = ally.color;
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillStyle = ally.color;
                    this.ctx.fillRect(ally.x, ally.y, ally.width, ally.height);
                    this.ctx.shadowBlur = 0;
                }
            } else if (ally.type === 'demon' && ally.sprite) {
                // Special rendering for demons with sprite
                if (this.eyeballMinionImageLoaded) {
                    // Add purple glow effect for demon
                    this.ctx.shadowColor = '#800080';
                    this.ctx.shadowBlur = 10;
                    
                    // Draw the demon sprite with double size
                    const spriteWidth = ally.width * 2;
                    const spriteHeight = ally.height * 2;
                    const offsetX = ally.x - ally.width / 2; // Center the larger sprite
                    const offsetY = ally.y - ally.height / 2;
                    this.ctx.drawImage(this.eyeballMinionImage, offsetX, offsetY, spriteWidth, spriteHeight);
                    
                    // Remove shadow
                    this.ctx.shadowBlur = 0;
                } else {
                    // Fallback to colored rectangle if sprite not loaded
                    this.ctx.shadowColor = ally.color;
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillStyle = ally.color;
                    this.ctx.fillRect(ally.x, ally.y, ally.width, ally.height);
                    this.ctx.shadowBlur = 0;
                }
            } else {
                // Standard ally rendering for non-skull, non-demon allies
                // Add glow effect
                this.ctx.shadowColor = ally.color;
                this.ctx.shadowBlur = 8;
                
                // Draw ally body with hit effect (skip hit effect for flaming skulls)
                const showHitEffect = ally.type !== 'orbital_skull' && ally.hitTime && Date.now() - ally.hitTime < 100;
                this.ctx.fillStyle = showHitEffect ? '#ffffff' : ally.color;
                this.ctx.fillRect(ally.x, ally.y, ally.width, ally.height);
                
                // Remove shadow for border
                this.ctx.shadowBlur = 0;
                
                // Draw a friendly border to distinguish from enemies
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(ally.x, ally.y, ally.width, ally.height);
            }
            
            this.ctx.restore();
            
            // Draw ally health bar (green background for friendlies) - skip for flaming skulls and demons
            if (ally.type !== 'orbital_skull' && ally.type !== 'demon') {
                this.drawHealthBar(ally.x, ally.y - 10, ally.width, 4, ally.health, ally.maxHealth, '#228B22', '#90EE90');
            }
            
            // Draw duration indicator (small bar showing remaining time) - skip for permanent allies
            if (!ally.permanent) {
                const now = Date.now();
                const timeRemaining = ally.duration - (now - ally.spawnTime);
                const durationPercent = Math.max(0, timeRemaining / ally.duration);
                
                if (durationPercent < 0.3) { // Only show when less than 30% time left
                    this.ctx.fillStyle = durationPercent < 0.1 ? '#ff4444' : '#ffaa44';
                    const durationBarWidth = ally.width * 0.8;
                    const durationBarHeight = 2;
                    const durationBarX = ally.x + (ally.width - durationBarWidth) / 2;
                    const durationBarY = ally.y - 16;
                    
                    this.ctx.fillRect(durationBarX, durationBarY, durationBarWidth * durationPercent, durationBarHeight);
                }
            }
        });
    }

    drawProjectiles(projectiles) {
        projectiles.forEach(proj => {
            // Check projectile type by color
            const isPiercingBow = proj.color === '#8b4513';
            const isDragonBow = proj.color === '#f77';
            const isBowProjectile = isPiercingBow || isDragonBow;
            const isStaffProjectile = proj.type === 'staff';
            
            if (isBowProjectile) {
                // Determine which sprite to use
                let useSprite = false;
                let spriteImage = null;
                
                if (isPiercingBow && this.arrowImageLoaded) {
                    useSprite = true;
                    spriteImage = this.arrowImage;
                } else if (isDragonBow && this.dragonArrowImageLoaded) {
                    useSprite = true;
                    spriteImage = this.dragonArrowImage;
                }
                
                if (useSprite) {
                    // Calculate rotation angle based on projectile velocity
                    const angle = Math.atan2(proj.dy, proj.dx);
                    
                    // Save current canvas state
                    this.ctx.save();
                    
                    // Move to projectile position
                    this.ctx.translate(proj.x, proj.y);
                    
                    // Rotate to match projectile direction + 90 degrees
                    this.ctx.rotate(angle + Math.PI / 2);
                    
                    // Draw arrow sprite centered with very large size for maximum visibility
                    const spriteSize = 60; // Increased from 40 to 60 for maximum visibility
                    this.ctx.drawImage(
                        spriteImage, 
                        -spriteSize / 2, 
                        -spriteSize / 2, 
                        spriteSize, 
                        spriteSize
                    );
                    
                    // Restore canvas state
                    this.ctx.restore();
                } else {
                    // Fallback to circle if sprite not loaded
                    this.ctx.fillStyle = proj.color;
                    this.ctx.beginPath();
                    this.ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (isStaffProjectile) {
                // Draw staff projectiles as glowing orbs with special effects
                this.ctx.save();
                
                // Create glowing effect
                this.ctx.shadowColor = proj.color;
                this.ctx.shadowBlur = 15;
                
                // Draw outer glow
                this.ctx.fillStyle = proj.color + '40'; // Semi-transparent
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, proj.width * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw inner core
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = proj.color;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            } else if (proj.type === 'throwing') {
                // Handle throwing weapons with sprites
                let useSprite = false;
                let spriteImage = null;
                
                // Check if this is a Spirit Blade
                if (proj.spectral && this.spiritBladeImageLoaded) {
                    useSprite = true;
                    spriteImage = this.spiritBladeImage;
                }
                // Check if this is a Boomerang (identify by weapon name or returning property)
                else if (proj.weapon && proj.weapon.name === 'Boomerang' && this.boomerangImageLoaded) {
                    useSprite = true;
                    spriteImage = this.boomerangImage;
                }
                // Check if this is a Throwing Axe
                else if (proj.weapon && proj.weapon.name === 'Throwing Axe' && this.throwingAxeImageLoaded) {
                    useSprite = true;
                    spriteImage = this.throwingAxeImage;
                }
                // Check if this is a Chakram
                else if (proj.weapon && proj.weapon.name === 'Chakram' && this.chakramImageLoaded) {
                    useSprite = true;
                    spriteImage = this.chakramImage;
                }
                
                if (useSprite) {
                    // Calculate rotation - use projectile's rotation property for spinning effect
                    const angle = proj.rotation || 0;
                    
                    // Save current canvas state
                    this.ctx.save();
                    
                    // Move to projectile position and center it
                    this.ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);
                    
                    // Rotate for spinning effect
                    this.ctx.rotate(angle);
                    
                    // Draw sprite centered with proper size
                    const spriteSize = 40;
                    this.ctx.drawImage(
                        spriteImage, 
                        -spriteSize / 2, 
                        -spriteSize / 2, 
                        spriteSize, 
                        spriteSize
                    );
                    
                    // Restore canvas state
                    this.ctx.restore();
                } else {
                    // Fallback to circle for throwing weapons without sprites
                    this.ctx.fillStyle = proj.color;
                    this.ctx.beginPath();
                    this.ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if ((proj.type === 'demon_projectile' || proj.type === 'demon_explosion') && this.eyeballMinionAttackImageLoaded) {
                // Special rendering for demon projectiles with sprite
                // Calculate rotation angle based on projectile velocity
                const angle = Math.atan2(proj.dy, proj.dx);
                
                // Save current canvas state
                this.ctx.save();
                
                // Move to projectile position
                this.ctx.translate(proj.x, proj.y);
                
                // Rotate to match projectile direction and add 10 degrees left tilt
                const leftTilt = -10 * Math.PI / 180; // Convert 10 degrees to radians (negative for left)
                this.ctx.rotate(angle + leftTilt);
                
                // Draw demon projectile sprite centered
                const spriteSize = proj.type === 'demon_explosion' ? 16 : 20; // Slightly smaller for explosion projectiles
                this.ctx.drawImage(
                    this.eyeballMinionAttackImage, 
                    -spriteSize / 2, 
                    -spriteSize / 2, 
                    spriteSize, 
                    spriteSize
                );
                
                // Restore canvas state
                this.ctx.restore();
            } else {
                // Use circle for non-bow, non-demon projectiles
                this.ctx.fillStyle = proj.color;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawFrostZones(frostZones) {
        frostZones.forEach(zone => {
            const now = Date.now();
            const age = now - zone.createdAt;
            const agePercent = age / zone.duration;
            const alpha = Math.max(0.1, 1 - agePercent); // Fade out over time
            
            this.ctx.save();
            
            // Draw frost zone as a semi-transparent blue circle
            this.ctx.globalAlpha = alpha * 0.3;
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw frost zone border
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add snowflake-like effect
            this.ctx.globalAlpha = alpha * 0.8;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const innerRadius = zone.radius * 0.3;
                const outerRadius = zone.radius * 0.9;
                
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(
                    zone.x + Math.cos(angle) * innerRadius,
                    zone.y + Math.sin(angle) * innerRadius
                );
                this.ctx.lineTo(
                    zone.x + Math.cos(angle) * outerRadius,
                    zone.y + Math.sin(angle) * outerRadius
                );
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }

    drawWeapons(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        // Group weapons by their ID for stacking effects
        const weaponGroups = this.groupWeaponsByType(player.weapons);

        Object.values(weaponGroups).forEach(weapons => {
            this.drawWeaponGroup(weapons, playerCenterX, playerCenterY, player);
        });
    }

    groupWeaponsByType(weapons) {
        const weaponGroups = {};
        weapons.forEach(weapon => {
            if (!weaponGroups[weapon.id]) {
                weaponGroups[weapon.id] = [];
            }
            weaponGroups[weapon.id].push(weapon);
        });
        return weaponGroups;
    }

    drawWeaponGroup(weapons, playerCenterX, playerCenterY, player) {
        const weapon = weapons[0];
        const count = weapons.length;

        switch (weapon.type) {
            case 'melee':
                this.drawMeleeWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'spinning':
                this.drawSpinningWeapon(weapon, count, playerCenterX, playerCenterY);
                break;
            case 'ranged':
                this.drawBowAiming(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'staff':
                this.drawStaffWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'summon':
                this.drawSummonWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
        }
    }

    drawMeleeWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        // Check weapon type by color
        const isNormalSword = weapon.color === '#c0c0c0';
        const isDragonSword = weapon.color === '#f55';
        const isSwordWeapon = isNormalSword || isDragonSword;
        
        if (isSwordWeapon) {
            // Determine which sword sprite to use
            let useSwordSprite = false;
            let swordImage = null;
            
            if (isNormalSword && this.swordImageLoaded) {
                useSwordSprite = true;
                swordImage = this.swordImage;
            } else if (isDragonSword && this.dragonSwordImageLoaded) {
                useSwordSprite = true;
                swordImage = this.dragonSwordImage;
            }
            
            if (useSwordSprite) {
                // Draw sword sprite pointing in the direction of aim
                const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
                
                // Calculate position so the hilt (handle end) aligns with the arc tip
                const swordX = playerCenterX + Math.cos(player.rotation) * (scaledRange * 0.5);
                const swordY = playerCenterY + Math.sin(player.rotation) * (scaledRange * 0.5);
                
                // Save current canvas state
                this.ctx.save();
                
                // Move to sword position
                this.ctx.translate(swordX, swordY);
                
                // Rotate to match player rotation + 45 degrees to the right
                this.ctx.rotate(player.rotation + Math.PI / 4);
                
                // Draw sword sprite centered and sized to match arc length
                const swordSize = scaledRange; // Size to match the arc length
                this.ctx.drawImage(
                    swordImage,
                    -swordSize / 2,
                    -swordSize / 2,
                    swordSize,
                    swordSize
                );
                
                // Restore canvas state
                this.ctx.restore();
                
                // Add attack effect if recently attacked
                if (Date.now() - (player.lastAttacks[weapon.id] || 0) < 100) {
                    this.ctx.save();
                    this.ctx.translate(swordX, swordY);
                    this.ctx.rotate(player.rotation + Math.PI / 4);
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.drawImage(
                        swordImage,
                        -swordSize / 2,
                        -swordSize / 2,
                        swordSize,
                        swordSize
                    );
                    this.ctx.restore();
                }
            } else {
                // Fallback to arc if sprite not loaded
                const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
                const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
                
                this.ctx.beginPath();
                this.ctx.arc(
                    playerCenterX,
                    playerCenterY,
                    scaledRange,
                    player.rotation - scaledArcSize / 2,
                    player.rotation + scaledArcSize / 2
                );
                this.ctx.lineTo(playerCenterX, playerCenterY);
                this.ctx.closePath();

                this.ctx.fillStyle = `${weapon.color}33`;
                this.ctx.fill();
                this.ctx.strokeStyle = weapon.color;
                this.ctx.stroke();

                // Add attack effect
                if (Date.now() - (player.lastAttacks[weapon.id] || 0) < 100) {
                    this.ctx.fillStyle = `${weapon.color}66`;
                    this.ctx.fill();
                }
            }
        } else {
            // Draw original arc for other melee weapons
            const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
            const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
            
            this.ctx.beginPath();
            this.ctx.arc(
                playerCenterX,
                playerCenterY,
                scaledRange,
                player.rotation - scaledArcSize / 2,
                player.rotation + scaledArcSize / 2
            );
            this.ctx.lineTo(playerCenterX, playerCenterY);
            this.ctx.closePath();

            this.ctx.fillStyle = `${weapon.color}33`;
            this.ctx.fill();
            this.ctx.strokeStyle = weapon.color;
            this.ctx.stroke();

            // Add attack effect
            if (Date.now() - (player.lastAttacks[weapon.id] || 0) < 100) {
                this.ctx.fillStyle = `${weapon.color}66`;
                this.ctx.fill();
            }
        }
    }

    drawSpinningWeapon(weapon, count, playerCenterX, playerCenterY) {
        for (let i = 0; i < count; i++) {
            const phaseOffset = (i * 2 * Math.PI) / count;
            
            // Check if this is a dragon scythe for special behavior
            const isDragonScythe = weapon.oscillating && weapon.spinSpeed;
            
            let angle, currentOrbitRadius;
            
            if (isDragonScythe) {
                // Dragon scythe: faster spin and oscillating distance
                const spinSpeed = weapon.spinSpeed || 1;
                angle = Date.now() * Math.PI * 2 / 1000 * spinSpeed + phaseOffset;
                
                // Oscillate the orbit radius (back and forth movement)
                const oscillationSpeed = 0.002; // Speed of oscillation
                const oscillationAmount = weapon.orbitRadius * 0.4; // How much it moves back and forth
                const baseRadius = weapon.orbitRadius * 0.8; // Base distance
                currentOrbitRadius = baseRadius + Math.sin(Date.now() * oscillationSpeed) * oscillationAmount;
            } else {
                // Regular scythe behavior
                angle = Date.now() * Math.PI * 2 / 1000 + phaseOffset;
                currentOrbitRadius = weapon.orbitRadius;
            }
            
            const scytheX = playerCenterX + Math.cos(angle) * currentOrbitRadius;
            const scytheY = playerCenterY + Math.sin(angle) * currentOrbitRadius;

            // Check which type of scythe and if sprites are loaded
            const isCrystalScythe = weapon.name === 'Crystal Scythe';
            const isNatureScythe = weapon.name === 'Nature Scythe';
            const isRegularScythe = weapon.color === '#800080' && !isDragonScythe;
            const isDragonScytheSprite = isDragonScythe;
            if (isCrystalScythe && this.crystalScytheImageLoaded) {
                // Draw crystal scythe sprite
                this.ctx.save();
                this.ctx.translate(scytheX, scytheY);
                const rotationSpeed = 0.03;
                const currentRotation = (Date.now() * rotationSpeed) % (2 * Math.PI);
                this.ctx.rotate(currentRotation);
                const scytheSize = weapon.range * 2;
                this.ctx.drawImage(
                    this.crystalScytheImage,
                    -scytheSize / 2,
                    -scytheSize / 2,
                    scytheSize,
                    scytheSize
                );
                this.ctx.restore();
            } else if (isNatureScythe && this.natureScytheImageLoaded) {
                // Draw nature scythe sprite
                this.ctx.save();
                this.ctx.translate(scytheX, scytheY);
                const rotationSpeed = 0.03;
                const currentRotation = (Date.now() * rotationSpeed) % (2 * Math.PI);
                this.ctx.rotate(currentRotation);
                const scytheSize = weapon.range * 2;
                this.ctx.drawImage(
                    this.natureScytheImage,
                    -scytheSize / 2,
                    -scytheSize / 2,
                    scytheSize,
                    scytheSize
                );
                this.ctx.restore();
            } else if (isRegularScythe && this.scytheImageLoaded) {
                // Draw regular scythe sprite
                this.ctx.save();
                
                // Move to scythe position
                this.ctx.translate(scytheX, scytheY);
                
                // Proper rotation calculation - keep it within 0 to 2π range
                const rotationSpeed = 0.03; // 3x faster rotation (was 0.01)
                const currentRotation = (Date.now() * rotationSpeed) % (2 * Math.PI);
                this.ctx.rotate(currentRotation);
                
                // Debug: Log rotation in a readable range
                if (Math.floor(Date.now() / 1000) % 2 === 0 && Date.now() % 100 < 16) {
                    console.log('Scythe rotation (radians):', currentRotation);
                }
                
                // Draw scythe sprite centered and sized to match the collider
                const scytheSize = weapon.range * 2; // Smaller sprite size to match collision area
                this.ctx.drawImage(
                    this.scytheImage,
                    -scytheSize / 2,
                    -scytheSize / 2,
                    scytheSize,
                    scytheSize
                );
                
                this.ctx.restore();
            } else if (isDragonScytheSprite && this.dragonScytheImageLoaded) {
                // Draw dragon scythe sprite
                this.ctx.save();
                
                // Move to scythe position
                this.ctx.translate(scytheX, scytheY);
                
                // Proper rotation calculation - keep it within 0 to 2π range
                const rotationSpeed = 0.03; // 3x faster rotation (was 0.01)
                const currentRotation = (Date.now() * rotationSpeed) % (2 * Math.PI);
                this.ctx.rotate(currentRotation);
                
                // Draw dragon scythe sprite centered and sized to match the collider
                const scytheSize = weapon.range * 2; // Smaller sprite size
                this.ctx.drawImage(
                    this.dragonScytheImage,
                    -scytheSize / 2,
                    -scytheSize / 2,
                    scytheSize,
                    scytheSize
                );
                
                this.ctx.restore();
            } else {
                // Draw circle for dragon scythe or if sprite not loaded
                this.ctx.beginPath();
                this.ctx.arc(scytheX, scytheY, weapon.range, 0, Math.PI * 2);
                this.ctx.fillStyle = weapon.color;
                this.ctx.fill();
                
                // Add glow effect
                this.ctx.shadowColor = weapon.color;
                this.ctx.shadowBlur = isDragonScythe ? 15 : 10; // Bigger glow for dragon scythe
                this.ctx.strokeStyle = weapon.color;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }
    }

    drawBowAiming(weapon, count, playerCenterX, playerCenterY, player) {
        // Determine which bow sprite to use based on weapon color
        const isDragonBow = weapon.color === '#f77'; // Dragon bow color
        const isPiercingBow = weapon.color === '#8b4513'; // Piercing bow color
        
        let useBowSprite = false;
        let bowImage = null;
        
        if (isDragonBow && this.dragonBowImageLoaded) {
            useBowSprite = true;
            bowImage = this.dragonBowImage;
        } else if (isPiercingBow && this.bowImageLoaded) {
            useBowSprite = true;
            bowImage = this.bowImage;
        } else if (this.bowImageLoaded) {
            // Fallback to regular bow for other bow types
            useBowSprite = true;
            bowImage = this.bowImage;
        }
        
        if (useBowSprite) {
            // Draw bow sprite pointing in the aiming direction
            const bowSize = 60; // Increased from 40 to 60 for better visibility
            
            // Calculate position to draw the bow (touching the player)
            const bowX = playerCenterX + Math.cos(player.rotation) * (bowSize * 0.3);
            const bowY = playerCenterY + Math.sin(player.rotation) * (bowSize * 0.3);
            
            // Save current canvas state
            this.ctx.save();
            
            // Move to bow position
            this.ctx.translate(bowX, bowY);
            
            // Rotate to match player rotation
            this.ctx.rotate(player.rotation);
            
            // Draw bow sprite centered
            this.ctx.drawImage(
                bowImage,
                -bowSize / 2,
                -bowSize / 2,
                bowSize,
                bowSize
            );
            
            // Restore canvas state
            this.ctx.restore();
        } else {
            // Fallback to red rectangle if bow image not loaded
            const aimLength = 40; // Length of the aiming indicator
            const aimWidth = 8;   // Width of the aiming indicator
            
            // Calculate end position of the aiming indicator
            const aimEndX = playerCenterX + Math.cos(player.rotation) * aimLength;
            const aimEndY = playerCenterY + Math.sin(player.rotation) * aimLength;
            
            // Save current canvas state
            this.ctx.save();
            
            // Set red color for the aiming indicator
            this.ctx.fillStyle = '#ff0000';
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            
            // Draw rectangle from player center to aim direction
            this.ctx.beginPath();
            this.ctx.moveTo(playerCenterX, playerCenterY);
            this.ctx.lineTo(aimEndX, aimEndY);
            this.ctx.lineWidth = aimWidth;
            this.ctx.stroke();
            
            // Restore canvas state
            this.ctx.restore();
        }
    }

    drawStaffWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        // Determine which staff sprite to use based on weapon sprite property
        let staffImage = null;
        let staffImageLoaded = false;

        switch (weapon.sprite) {
            case 'Fire_staff.png':
                staffImage = this.fireStaffImage;
                staffImageLoaded = this.fireStaffImageLoaded;
                break;
            case 'Ice_staff.png':
                staffImage = this.iceStaffImage;
                staffImageLoaded = this.iceStaffImageLoaded;
                break;
            case 'lightning_staff.png':
                staffImage = this.lightningStaffImage;
                staffImageLoaded = this.lightningStaffImageLoaded;
                break;
            case 'Healing_staff.png':
                staffImage = this.healingStaffImage;
                staffImageLoaded = this.healingStaffImageLoaded;
                break;
        }

        // Special handling for Fire Staff - use sprite if loaded, otherwise use fallback
        if (weapon.sprite === 'Fire_staff.png') {
            console.log('Drawing Fire Staff - Image loaded:', staffImageLoaded, 'Image exists:', !!staffImage);
            if (staffImage && staffImageLoaded) {
                // Draw Fire Staff sprite pointing toward the aiming direction
                const staffSize = 80 + (count - 1) * 12; // Much larger and more visible with more staves
                
                // Position the staff outside the player, similar to sword positioning
                const staffDistance = 25; // Distance from player center - closer to player
                const staffX = playerCenterX + Math.cos(player.rotation) * staffDistance;
                const staffY = playerCenterY + Math.sin(player.rotation) * staffDistance;
                
                console.log('Drawing Fire Staff sprite with size:', staffSize, 'at position:', staffX, staffY);
                
                // Save current canvas state
                this.ctx.save();
                
                // Move to staff position (outside player)
                this.ctx.translate(staffX, staffY);
                
                // Rotate to face player rotation (aiming direction)
                this.ctx.rotate(player.rotation);
                
                // Draw Fire Staff sprite
                this.ctx.drawImage(
                    staffImage,
                    -staffSize / 2,
                    -staffSize / 2,
                    staffSize,
                    staffSize
                );
                
                // Restore canvas state
                this.ctx.restore();
            } else {
                console.log('Using Fire Staff fallback rectangle');
                // Fallback rectangle for Fire Staff if sprite not loaded
                const aimLength = 60 + (count - 1) * 10;
                const aimWidth = 8 + (count - 1) * 2;
                
                const aimEndX = playerCenterX + Math.cos(player.rotation) * aimLength;
                const aimEndY = playerCenterY + Math.sin(player.rotation) * aimLength;
                
                this.ctx.save();
                this.ctx.strokeStyle = weapon.color; // Fire Staff orange-red color
                this.ctx.lineWidth = aimWidth;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(playerCenterX, playerCenterY);
                this.ctx.lineTo(aimEndX, aimEndY);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        } else {
            // Handle all other staff weapons with their sprites
            if (staffImage && staffImageLoaded) {
                // Draw staff sprite pointing toward the aiming direction
                const staffSize = 80 + (count - 1) * 12; // Same size as Fire Staff
                
                // Position the staff outside the player, same as Fire Staff
                const staffDistance = 25; // Same distance as Fire Staff
                const staffX = playerCenterX + Math.cos(player.rotation) * staffDistance;
                const staffY = playerCenterY + Math.sin(player.rotation) * staffDistance;
                
                console.log('Drawing', weapon.sprite, 'sprite with size:', staffSize, 'at position:', staffX, staffY);
                
                // Save current canvas state
                this.ctx.save();
                
                // Move to staff position (outside player)
                this.ctx.translate(staffX, staffY);
                
                // Rotate to face player rotation (aiming direction)
                this.ctx.rotate(player.rotation);
                
                // Draw staff sprite
                this.ctx.drawImage(
                    staffImage,
                    -staffSize / 2,
                    -staffSize / 2,
                    staffSize,
                    staffSize
                );
                
                // Restore canvas state
                this.ctx.restore();
            } else {
                // Fallback rectangle if sprite not loaded
                const aimLength = 60 + (count - 1) * 10;
                const aimWidth = 8 + (count - 1) * 2;
                
                const aimEndX = playerCenterX + Math.cos(player.rotation) * aimLength;
                const aimEndY = playerCenterY + Math.sin(player.rotation) * aimLength;
                
                this.ctx.save();
                this.ctx.strokeStyle = weapon.color;
                this.ctx.lineWidth = aimWidth;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(playerCenterX, playerCenterY);
                this.ctx.lineTo(aimEndX, aimEndY);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        }
    }

    drawSummonWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        // Draw orbiting timing orb instead of static circle
        const now = Date.now();
        const lastAttack = player.lastAttacks[weapon.id] || 0;
        const timeSinceAttack = now - lastAttack;
        
        // Calculate orb position based on timing cycle
        // Full cycle = 90 seconds (60s cooldown + 30s demon duration)
        // But we want the orb to complete one orbit in 30 seconds
        const totalCycle = 90000; // 90 seconds total cycle
        const orbitalPeriod = 30000; // 30 seconds per orbit
        const cycleProgress = (timeSinceAttack % totalCycle) / totalCycle;
        
        // Orb orbits around player - one full orbit = 30 seconds
        const orbitalAngle = (now / orbitalPeriod) * Math.PI * 2;
        const orbitRadius = 50;
        const orbX = playerCenterX + Math.cos(orbitalAngle) * orbitRadius;
        const orbY = playerCenterY + Math.sin(orbitalAngle) * orbitRadius;
        
        // Emit purple flame particles from the top of the orb periodically
        if (!this.lastOrbParticleTime) this.lastOrbParticleTime = 0;
        if (now - this.lastOrbParticleTime > 120) { // Emit particles every 120ms
            this.lastOrbParticleTime = now;
            if (this.particleEngine) {
                // Create 3 larger particle bursts from the top of the orb
                for (let i = 0; i < 3; i++) {
                    const topX = orbX + (Math.random() - 0.5) * 12; // Wider horizontal spread at top
                    const topY = orbY - orbSize * 0.8; // Position at top of orb
                    
                    this.particleEngine.createExplosion(topX, topY, {
                        particleCount: 2,
                        colors: ['#8B0091', '#9932CC', '#BA55D3', '#DA70D6'], // Purple flame colors
                        minSize: 3,
                        maxSize: 6,
                        minSpeed: 0.5,
                        maxSpeed: 1.5,
                        minLife: 500,
                        maxLife: 900,
                        gravity: -0.03 // Gentle upward float
                    });
                }
            }
        }
        
        this.ctx.save();
        
        // Draw orbital path (faint)
        this.ctx.strokeStyle = weapon.color + '20';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, orbitRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Determine orb state based on timing
        let orbColor = weapon.color;
        let orbSize = 8;
        let orbAlpha = 0.8;
        
        if (timeSinceAttack < 30000) {
            // Demons are active - bright, pulsing orb
            orbColor = '#00FF00'; // Green for active
            orbSize = 10 + Math.sin(now * 0.01) * 2;
            orbAlpha = 0.9 + Math.sin(now * 0.008) * 0.1;
        } else if (timeSinceAttack < 60000) {
            // Cooldown period - dimmer, smaller orb
            orbColor = '#FF6600'; // Orange for cooldown
            orbSize = 6;
            orbAlpha = 0.5;
        } else {
            // Ready to summon - bright, glowing orb
            orbColor = weapon.color;
            orbSize = 12 + Math.sin(now * 0.01) * 3;
            orbAlpha = 1.0;
            
            // Add glow effect when ready
            this.ctx.shadowColor = weapon.color;
            this.ctx.shadowBlur = 15;
        }
        
        // Draw the orbiting orb using sprite or fallback
        this.ctx.globalAlpha = orbAlpha;
        
        if (this.summonOrbImageLoaded) {
            // Use summon_orb.png sprite - doubled size
            const spriteSize = orbSize * 4; // Doubled from orbSize * 2
            this.ctx.drawImage(
                this.summonOrbImage, 
                orbX - spriteSize / 2, 
                orbY - spriteSize / 2, 
                spriteSize, 
                spriteSize
            );
        } else {
            // Fallback to colored circle if sprite not loaded
            this.ctx.fillStyle = orbColor;
            this.ctx.beginPath();
            this.ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add inner core
            this.ctx.globalAlpha = orbAlpha * 0.8;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(orbX, orbY, orbSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Show minion count if weapon has summoned allies
        if (this.gameState && this.gameState.allies) {
            const minionCount = this.gameState.allies.filter(ally => ally.sourceWeapon === weapon.id).length;
            const maxMinions = weapon.maxMinions * count;
            
            if (minionCount > 0) {
                this.ctx.save();
                this.ctx.fillStyle = weapon.color;
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${minionCount}/${maxMinions}`, playerCenterX, playerCenterY - 70);
                this.ctx.restore();
            }
        }
    }

    drawHealthBar(x, y, width, height, currentHealth, maxHealth, bgColor = '#ff0000', healthColor = '#00ff00') {
        // Background (default red, or custom)
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, width, height);
        
        // Health (default green, or custom)
        this.ctx.fillStyle = healthColor;
        const healthPercent = currentHealth / maxHealth;
        this.ctx.fillRect(x, y, width * healthPercent, height);
    }

    drawOpenWorldBackground() {
        // Draw grass background
        this.ctx.fillStyle = '#458B00';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBuildings(buildings) {
        buildings.forEach(building => {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Draw door
            this.ctx.fillStyle = '#4A2800';
            this.ctx.fillRect(building.door.x, building.door.y, building.door.width, building.door.height);

            // Show weapon indicator if present
            if (building.interior.weapon) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(building.door.x + 15, building.door.y - 10, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawNightOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 40, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawText(text, x, y, options = {}) {
        const {
            font = '20px Arial',
            color = 'white',
            align = 'left',
            baseline = 'top'
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    drawParticles(particleEngine) {
        if (particleEngine && particleEngine.render) {
            particleEngine.render(this.ctx);
        }
    }
}
