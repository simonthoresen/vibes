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
            
            // Draw enemy health bar
            this.drawHealthBar(enemy.x, enemy.y - 10, enemy.width, 5, enemy.health, enemy.maxHealth);
        });
    }

    drawProjectiles(projectiles) {
        projectiles.forEach(proj => {
            // Check projectile type by color
            const isPiercingBow = proj.color === '#8b4513';
            const isDragonBow = proj.color === '#f77';
            const isBowProjectile = isPiercingBow || isDragonBow;
            
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
            } else {
                // Use circle for non-bow projectiles
                this.ctx.fillStyle = proj.color;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
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
            const angle = Date.now() * Math.PI * 2 / 1000 + phaseOffset;
            const scytheX = playerCenterX + Math.cos(angle) * weapon.orbitRadius;
            const scytheY = playerCenterY + Math.sin(angle) * weapon.orbitRadius;

            this.ctx.beginPath();
            this.ctx.arc(scytheX, scytheY, weapon.range, 0, Math.PI * 2);
            this.ctx.fillStyle = weapon.color;
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = weapon.color;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = weapon.color;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
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

    drawHealthBar(x, y, width, height, currentHealth, maxHealth) {
        // Background (red)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(x, y, width, height);
        
        // Health (green)
        this.ctx.fillStyle = '#00ff00';
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
