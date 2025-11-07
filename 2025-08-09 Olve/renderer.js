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
        
        // Load custom accessories image if it exists
        this.customAccessoriesImage = null;
        this.loadCustomAccessories();
        
        this.fastArrowImage = new Image();
        this.fastArrowImage.src = 'images/fast_arrow.png';
        this.fastArrowImageLoaded = false;
        this.fastArrowImage.onload = () => {
            this.fastArrowImageLoaded = true;
        };
        
        // Load dark fountain sprite for Ralsei beam
        this.darkFountainImage = new Image();
        this.darkFountainImage.src = 'images/dark_fountain.png';
        this.darkFountainImageLoaded = false;
        this.darkFountainImage.onload = () => {
            this.darkFountainImageLoaded = true;
        };
        
        // Load Ralsei player sprite
        this.ralseiPlayerImage = new Image();
        this.ralseiPlayerImage.src = 'images/ralsei.png';
        this.ralseiPlayerImageLoaded = false;
        this.ralseiPlayerImage.onload = () => {
            this.ralseiPlayerImageLoaded = true;
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
        
        // Load fast bow sprite
        this.fastBowImage = new Image();
        this.fastBowImage.src = 'images/fast_bow.png';
        this.fastBowImageLoaded = false;
        this.fastBowImage.onload = () => {
            this.fastBowImageLoaded = true;
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

        // Load trap sprites
        this.spikeTrapImage = new Image();
        this.spikeTrapImage.src = 'images/spike_trap.png';
        this.spikeTrapImageLoaded = false;
        this.spikeTrapImage.onload = () => {
            this.spikeTrapImageLoaded = true;
            console.log('Spike Trap image loaded successfully');
        };
        this.spikeTrapImage.onerror = () => {
            console.error('Failed to load Spike Trap image: images/spike_trap.png');
        };

        this.explosiveMineImage = new Image();
        this.explosiveMineImage.src = 'images/Landmine.png';
        this.explosiveMineImageLoaded = false;
        this.explosiveMineImage.onload = () => {
            this.explosiveMineImageLoaded = true;
            console.log('Explosive Mine image loaded successfully');
        };
        this.explosiveMineImage.onerror = () => {
            console.error('Failed to load Explosive Mine image: images/Landmine.png');
        };

        this.cobwebImage = new Image();
        this.cobwebImage.src = 'images/cobweb.png';
        this.cobwebImageLoaded = false;
        this.cobwebImage.onload = () => {
            this.cobwebImageLoaded = true;
            console.log('Cobweb image loaded successfully');
        };
        this.cobwebImage.onerror = () => {
            console.error('Failed to load Cobweb image: images/cobweb.png');
        };

        this.umbrellaImage = new Image();
        this.umbrellaImage.src = 'images/umbrella.png';
        this.umbrellaImageLoaded = false;
        this.umbrellaImage.onload = () => {
            this.umbrellaImageLoaded = true;
            console.log('Umbrella image loaded successfully');
        };
        this.umbrellaImage.onerror = () => {
            console.error('Failed to load Umbrella image: images/umbrella.png');
        };
    }

    setWeaponSystem(weaponSystem) {
        this.weaponSystem = weaponSystem;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPlayer(player) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        // Draw poison aura if player has poison cloud weapon
        this.drawPoisonAura(player, centerX, centerY);

        // Check if player has any Ralsei weapons
        const hasRalseiWeapon = player.weapons && player.weapons.some(weapon => weapon.id === 'RALSEI');
        
        if (hasRalseiWeapon && this.ralseiPlayerImageLoaded) {
            // Draw Ralsei sprite when player has Ralsei weapons
            this.ctx.save();
            
            // Apply invulnerability flashing effect
            if (player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
                this.ctx.globalAlpha = 0.5; // Make semi-transparent during invulnerability flash
            }
            
            // Draw the Ralsei sprite centered on the player
            const size = player.width * 1.2; // Make Ralsei slightly larger than the circle
            this.ctx.drawImage(
                this.ralseiPlayerImage,
                centerX - size/2,
                centerY - size/2,
                size,
                size
            );
            
            this.ctx.restore();
        } else {
            // Draw player with current skin (color + optional custom accessories)
            // First, always draw the base colored character
            this.ctx.fillStyle = player.invulnerable ?
                (Math.floor(Date.now() / 100) % 2 === 0 ? '#ffffff' : (player.skin === 'custom' ? '#ff6b6b' : player.skin.color)) :
                (player.skin === 'custom' ? '#ff6b6b' : player.skin.color);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, player.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Then, draw custom accessories on top if they exist
            const customAccessories = localStorage.getItem('customAccessories');
            if (customAccessories && this.customAccessoriesImage) {
                // Create a circular clipping path for accessories too
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, player.width / 2, 0, Math.PI * 2);
                this.ctx.clip();
                
                // Draw the custom accessories on top
                const size = player.width;
                this.ctx.drawImage(
                    this.customAccessoriesImage, 
                    centerX - size/2, 
                    centerY - size/2, 
                    size, 
                    size
                );
                
                this.ctx.restore();
            }
        }

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
            // Handle beam projectiles (like Ralsei beam)
            if (proj.isBeam) {
                if (this.darkFountainImageLoaded) {
                    this.ctx.save();
                    
                    // Calculate beam parameters
                    const beamLength = Math.sqrt(
                        Math.pow(proj.endX - proj.x, 2) + 
                        Math.pow(proj.endY - proj.y, 2)
                    );
                    const beamAngle = Math.atan2(proj.endY - proj.y, proj.endX - proj.x);
                    
                    // Move to beam start position
                    this.ctx.translate(proj.x, proj.y);
                    this.ctx.rotate(beamAngle);
                    
                    // Set alpha for beam visibility
                    this.ctx.globalAlpha = 0.9;
                    
                    // Draw the dark fountain sprite stretched along the beam length
                    // Repeat the sprite pattern along the beam
                    const spriteWidth = this.darkFountainImage.width;
                    const spriteHeight = this.darkFountainImage.height;
                    const numRepetitions = Math.ceil(beamLength / spriteWidth);
                    
                    // Scale height to match beam width
                    const scaleY = proj.width / spriteHeight;
                    
                    for (let i = 0; i < numRepetitions; i++) {
                        const x = i * spriteWidth;
                        const drawWidth = Math.min(spriteWidth, beamLength - x);
                        
                        if (drawWidth > 0) {
                            this.ctx.drawImage(
                                this.darkFountainImage,
                                0, 0, drawWidth, spriteHeight, // Source rectangle
                                x, -proj.width/2, drawWidth, proj.width // Destination rectangle
                            );
                        }
                    }
                    
                    this.ctx.restore();
                } else {
                    // Fallback to gradient rendering if image not loaded
                    this.ctx.save();
                    
                    // Create gradient for beam effect
                    const gradient = this.ctx.createLinearGradient(proj.x, proj.y, proj.endX, proj.endY);
                    gradient.addColorStop(0, proj.color + 'CC'); // Semi-transparent start
                    gradient.addColorStop(0.5, proj.color); // Full color middle
                    gradient.addColorStop(1, proj.color + '44'); // Very transparent end
                    
                    // Draw beam as thick line
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = proj.width;
                    this.ctx.lineCap = 'round';
                    this.ctx.globalAlpha = 0.8;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(proj.x, proj.y);
                    this.ctx.lineTo(proj.endX, proj.endY);
                    this.ctx.stroke();
                    
                    // Add glow effect
                    this.ctx.strokeStyle = proj.color + '44';
                    this.ctx.lineWidth = proj.width * 2;
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                }
                return;
            }
            
            // Check projectile type by color and weapon reference
            const isPiercingBow = proj.color === '#8b4513';
            const isDragonBow = proj.color === '#f77';
            const isTripleBow = proj.color === '#9d4edd' || (proj.weapon && proj.weapon.name === 'Triple Bow');
            const isBowProjectile = isPiercingBow || isDragonBow || isTripleBow;
            const isStaffProjectile = proj.type === 'staff';
            
            if (isBowProjectile) {
                // Determine which sprite to use
                let useSprite = false;
                let spriteImage = null;
                
                if (isTripleBow && this.fastArrowImageLoaded) {
                    useSprite = true;
                    spriteImage = this.fastArrowImage;
                } else if (isDragonBow && this.dragonArrowImageLoaded) {
                    useSprite = true;
                    spriteImage = this.dragonArrowImage;
                } else if (isPiercingBow && this.arrowImageLoaded) {
                    useSprite = true;
                    spriteImage = this.arrowImage;
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
                    
                    // Determine sprite size based on weapon type
                    let spriteSize = 40; // Default size
                    let spriteWidth = 40; // Default width
                    let spriteHeight = 40; // Default height
                    
                    if (isTripleBow) {
                            spriteWidth = 8.75; // Halved again for fast arrows
                            spriteHeight = 35; // Keep original height
                    } else if (isDragonBow) {
                        spriteSize = 45; // Slightly larger for dragon arrows
                        spriteWidth = spriteHeight = spriteSize;
                    } else if (isPiercingBow) {
                        spriteSize = 40; // Standard size for regular arrows
                        spriteWidth = spriteHeight = spriteSize;
                    }
                    
                    // Draw arrow sprite centered
                    this.ctx.drawImage(
                        spriteImage, 
                        -spriteWidth / 2, 
                        -spriteHeight / 2, 
                        spriteWidth, 
                        spriteHeight
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
        
        // Find the highest priority bow weapon for sprite rendering
        const bowPriority = {
            'TRIPLE_BOW': 3,
            'DRAGON_BOW': 2,
            'BOW': 1
        };
        
        let highestPriorityBow = null;
        let highestPriority = 0;
        
        Object.values(weaponGroups).forEach(weapons => {
            const weapon = weapons[0];
            if (weapon.type === 'ranged') {
                const priority = bowPriority[weapon.id] || 0;
                if (priority > highestPriority) {
                    highestPriority = priority;
                    highestPriorityBow = weapon.id;
                }
            }
        });

        Object.values(weaponGroups).forEach(weapons => {
            this.drawWeaponGroup(weapons, playerCenterX, playerCenterY, player, highestPriorityBow);
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

    drawWeaponGroup(weapons, playerCenterX, playerCenterY, player, highestPriorityBow) {
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
                this.drawBowAiming(weapon, count, playerCenterX, playerCenterY, player, highestPriorityBow);
                break;
            case 'staff':
                this.drawStaffWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'summon':
                this.drawSummonWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'trap':
                this.drawTrapWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'umbrella':
                this.drawUmbrellaWeapon(weapon, count, playerCenterX, playerCenterY, player);
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

    drawBowAiming(weapon, count, playerCenterX, playerCenterY, player, highestPriorityBow) {
        // Only show bow sprite if this is the highest priority bow
        if (weapon.id !== highestPriorityBow) {
            return; // Don't render sprite for lower priority bows
        }
        
        // Determine which bow sprite to use based on weapon color and name
        const isDragonBow = weapon.color === '#f77'; // Dragon bow color
        const isPiercingBow = weapon.color === '#8b4513'; // Piercing bow color
        const isTripleBow = weapon.color === '#9d4edd' || weapon.name === 'Triple Bow'; // Triple bow color or name
        
        let useBowSprite = false;
        let bowImage = null;
        
        if (isTripleBow && this.fastBowImageLoaded) {
            useBowSprite = true;
            bowImage = this.fastBowImage;
        } else if (isDragonBow && this.dragonBowImageLoaded) {
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
            // Determine bow size based on weapon type
            let bowSize = 50; // Default size
            let bowWidth = 50; // Default width
            let bowHeight = 50; // Default height
            
            if (isTripleBow) {
                    bowWidth = 11.25; // Halved again for fast bow
                    bowHeight = 45; // Keep original height
            } else if (isDragonBow) {
                bowSize = 55; // Larger for dragon bow
                bowWidth = bowHeight = bowSize;
            } else if (isPiercingBow) {
                bowSize = 50; // Standard size for regular bow
                bowWidth = bowHeight = bowSize;
            }
            
            // Calculate position to draw the bow (Triple Bow moved further forward)
            const distanceMultiplier = isTripleBow ? 0.5 : 0.3; // Move Triple Bow further forward
            const bowX = playerCenterX + Math.cos(player.rotation) * (Math.max(bowWidth, bowHeight) * distanceMultiplier);
            const bowY = playerCenterY + Math.sin(player.rotation) * (Math.max(bowWidth, bowHeight) * distanceMultiplier);
            
            // Save current canvas state
            this.ctx.save();
            
            // Move to bow position
            this.ctx.translate(bowX, bowY);
            
            // Rotate to match player rotation
            this.ctx.rotate(player.rotation);
            
            // Draw bow sprite centered
            this.ctx.drawImage(
                bowImage,
                -bowWidth / 2,
                -bowHeight / 2,
                bowWidth,
                bowHeight
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

    drawHUD(gameState) {
        this.ctx.save();
        
        // Check if new weapons are available and show notification
        const availableWeapons = this.checkAvailableWeapons(gameState);
        if (availableWeapons > 0) {
            // Draw notification for new weapons with flashing effect
            const flashIntensity = Math.sin(Date.now() / 300) * 0.3 + 0.7; // Flash between 0.4 and 1.0
            this.ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity})`; // Gold background with flash
            this.ctx.fillRect(10, 10, 180, 30);
            
            this.ctx.fillStyle = '#000000'; // Black text
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`${availableWeapons} weapon${availableWeapons > 1 ? 's' : ''} available!`, 20, 20);
        }
        
        this.ctx.restore();
    }

    checkAvailableWeapons(gameState) {
        // Count weapons that can be purchased
        if (!gameState.getWeaponTree || !gameState.getPurchasedWeapons) return 0;
        
        const weaponTree = gameState.getWeaponTree();
        const purchased = gameState.getPurchasedWeapons();
        let available = 0;
        
        Object.entries(weaponTree.unified.weapons).forEach(([weaponKey, weapon]) => {
            const isPurchased = purchased.unified && purchased.unified[weaponKey];
            const canAfford = gameState.player.weaponTreePoints >= weapon.cost;
            
            // Check if requirements are met
            let requirementsMet = true;
            if (weapon.requires && !isPurchased) {
                requirementsMet = weapon.requires.every(req => purchased.unified && purchased.unified[req]);
            }
            
            const canPurchase = canAfford && !isPurchased && requirementsMet && weapon.cost > 0;
            if (canPurchase) available++;
        });
        
        return available;
    }

    drawTrapWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        // Trap weapon deployment indicators removed - no visual indicators drawn
    }

    drawUmbrellaWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        // Draw a single umbrella to the right of the player to show they're holding it
        if (this.umbrellaImageLoaded && count > 0) {
            this.ctx.save();
            
            const umbrellaSize = 75; // 2.5x larger size (30 * 2.5 = 75)
            const offsetX = 25; // Distance to the right of the player
            const offsetY = -25.5; // Lowered by 17 pixels from -42.5
            
            // Position umbrella to the right of the player
            const x = playerCenterX + offsetX - umbrellaSize / 2;
            const y = playerCenterY + offsetY - umbrellaSize / 2;
            
            // Add subtle floating animation to make it feel alive
            const floatOffset = Math.sin(Date.now() * 0.002) * 1;
            
            this.ctx.globalAlpha = 0.9;
            this.ctx.drawImage(
                this.umbrellaImage,
                x,
                y + floatOffset,
                umbrellaSize,
                umbrellaSize
            );
            
            this.ctx.restore();
        }
    }

    drawTraps(traps) {
        if (!traps || traps.length === 0) return;

        traps.forEach(trap => {
            this.ctx.save();

            // Set alpha based on trap state
            let alpha = 0.8;
            if (!trap.active) {
                alpha = 0.4;
            } else if (trap.halfTransparent) {
                alpha = 0.5; // Half transparent after being used
            }
            
            // Draw trap base
            this.ctx.fillStyle = trap.armed ? trap.color : '#666666';
            this.ctx.globalAlpha = alpha;
            
            switch (trap.weaponId) {
                case 'SPIKE_TRAP':
                    this.drawSpikeTrap(trap);
                    break;
                case 'WEB_LAUNCHER':
                    this.drawWebTrap(trap);
                    break;
                case 'EXPLOSIVE_MINE':
                    this.drawExplosiveMine(trap);
                    break;
                case 'POISON_CLOUD':
                    this.drawPoisonCloud(trap);
                    break;
            }

            // Draw arming indicator if not yet armed
            if (!trap.armed) {
                this.ctx.globalAlpha = 0.7;
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([3, 3]);
                this.ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
            }

            this.ctx.restore();
        });
    }

    drawSpikeTrap(trap) {
        // Use sprite if loaded, otherwise fall back to shape drawing
        if (this.spikeTrapImageLoaded) {
            // Draw the spike trap sprite
            this.ctx.drawImage(
                this.spikeTrapImage,
                trap.x,
                trap.y,
                trap.width,
                trap.height
            );
        } else {
            // Fallback to shape drawing if sprite not loaded
            // Draw trap base
            this.ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
            
            // Draw spikes if armed
            if (trap.armed) {
                this.ctx.fillStyle = '#888888';
                const spikeCount = 4;
                const spikeWidth = trap.width / spikeCount;
                
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = trap.x + i * spikeWidth + spikeWidth / 2;
                    const spikeY = trap.y + trap.height / 2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(spikeX - spikeWidth / 4, trap.y + trap.height);
                    this.ctx.lineTo(spikeX, trap.y + trap.height / 4);
                    this.ctx.lineTo(spikeX + spikeWidth / 4, trap.y + trap.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }

    drawWebTrap(trap) {
        // Draw cobweb sprite if loaded, otherwise fall back to manual web pattern
        if (this.cobwebImageLoaded && trap.active) {
            this.ctx.save();
            
            // Apply transparency if the trap is half transparent
            if (trap.halfTransparent) {
                this.ctx.globalAlpha = 0.5;
            } else {
                this.ctx.globalAlpha = 0.8; // Slightly transparent for visual appeal
            }
            
            const centerX = trap.x + trap.width / 2;
            const centerY = trap.y + trap.height / 2;
            const size = trap.width; // Use trap size for the sprite
            
            // Draw the cobweb sprite centered on the trap
            this.ctx.drawImage(
                this.cobwebImage,
                centerX - size / 2,
                centerY - size / 2,
                size,
                size
            );
            
            this.ctx.restore();
        } else if (trap.active) {
            // Fallback to manual web pattern if sprite isn't loaded
            this.ctx.globalAlpha = 0.6;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([]);
            
            const centerX = trap.x + trap.width / 2;
            const centerY = trap.y + trap.height / 2;
            const radius = trap.width / 2;
            
            // Draw web lines
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(
                    centerX + Math.cos(angle) * radius,
                    centerY + Math.sin(angle) * radius
                );
                this.ctx.stroke();
            }
            
            // Draw concentric circles
            for (let r = radius / 3; r < radius; r += radius / 3) {
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1.0; // Reset alpha
        }
    }

    drawExplosiveMine(trap) {
        // Skip drawing if mine is blinking and currently invisible
        if (trap.isBlinking && !trap.visible) {
            return;
        }
        
        // Use sprite if loaded, otherwise fall back to shape drawing
        if (this.explosiveMineImageLoaded) {
            // Draw the explosive mine sprite
            this.ctx.drawImage(
                this.explosiveMineImage,
                trap.x,
                trap.y,
                trap.width,
                trap.height
            );
        } else {
            // Fallback to shape drawing if sprite not loaded
            // Draw mine body
            this.ctx.fillStyle = trap.color;
            this.ctx.beginPath();
            this.ctx.arc(trap.x + trap.width / 2, trap.y + trap.height / 2, trap.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw warning indicators if armed
        if (trap.armed) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            
            // If blinking, make the warning more intense
            if (trap.isBlinking) {
                this.ctx.globalAlpha = 1.0; // Full opacity when visible during blinking
                this.ctx.lineWidth = 3; // Thicker outline when blinking
            } else {
                this.ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.5 + 0.5; // Normal blinking effect
            }
            
            this.ctx.beginPath();
            this.ctx.arc(trap.x + trap.width / 2, trap.y + trap.height / 2, trap.width / 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw proximity detection range indicator (dotted blue circle)
            this.ctx.globalAlpha = 0.3;
            this.ctx.strokeStyle = '#00aaff';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([3, 3]);
            this.ctx.beginPath();
            this.ctx.arc(
                trap.x + trap.width / 2, 
                trap.y + trap.height / 2, 
                trap.triggerRange, 
                0, 
                Math.PI * 2
            );
            this.ctx.stroke();
            
            // Draw explosion radius indicator (faint orange)
            this.ctx.globalAlpha = 0.1;
            this.ctx.strokeStyle = '#ff6600';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(
                trap.x + trap.width / 2, 
                trap.y + trap.height / 2, 
                trap.explosionRadius, 
                0, 
                Math.PI * 2
            );
            this.ctx.stroke();
            
            // Reset line dash for other drawings
            this.ctx.setLineDash([]);
        }
    }

    drawPoisonCloud(trap) {
        // Draw thick poison gas cloud with dense particles
        if (trap.active) {
            const centerX = trap.x + trap.width / 2;
            const centerY = trap.y + trap.height / 2;
            const radius = trap.width / 2;
            const time = Date.now() / 1000;
            
            // Get particle multiplier from settings
            const particleMultiplier = this.gameState?.settings?.particleMultiplier ?? 1.0;
            
            // If particle multiplier is 0, just show a green transparent circle
            if (particleMultiplier === 0) {
                this.ctx.globalAlpha = 0.25;
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return;
            }
            
            // Create much denser cloud of poison particles (scaled by multiplier)
            const baseParticleCount = 120; // Base particles for thicker cloud
            const particleCount = Math.round(baseParticleCount * particleMultiplier);
            
            for (let i = 0; i < particleCount; i++) {
                // Use particle index for consistent positioning (no random jumping)
                const baseAngle = (i * 137.5) * (Math.PI / 180); // Golden angle distribution
                const baseDistance = (i % 20) / 20 * radius; // Consistent radial distribution
                
                // Very slow, gentle floating motion based on particle index
                const gentleSwirl = time * 0.05 + i * 0.02; // Even slower movement
                const particleX = centerX + Math.cos(baseAngle + gentleSwirl) * baseDistance;
                const particleY = centerY + Math.sin(baseAngle + gentleSwirl) * baseDistance;
                
                // Consistent particle sizes based on index
                const particleSize = 1 + (i % 4);
                
                // Slower, gentler pulsing opacity based on index
                const opacity = 0.15 + Math.abs(Math.sin(time * 0.3 + i * 0.1)) * 0.25; // Much slower pulsing
                
                // Consistent color based on particle index
                const greenShades = ['#32CD32', '#90EE90', '#98FB98', '#00FF32', '#228B22'];
                const color = greenShades[i % greenShades.length];
                
                this.ctx.globalAlpha = opacity;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Add more larger floating particles for extra thickness (scaled by multiplier)
            const baseFloatingCount = 25;
            const floatingCount = Math.round(baseFloatingCount * particleMultiplier);
            
            for (let i = 0; i < floatingCount; i++) { // More floating particles
                const angle = (i * Math.PI * 2) / baseFloatingCount + time * 0.02; // Much slower orbit
                const distance = radius * 0.7 + Math.sin(time * 0.2 + i) * (radius * 0.1); // Gentler variation
                const particleX = centerX + Math.cos(angle) * distance;
                const particleY = centerY + Math.sin(angle) * distance;
                
                const floatingOpacity = 0.2 + Math.sin(time * 0.2 + i) * 0.2; // Slower opacity change
                
                this.ctx.globalAlpha = floatingOpacity;
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.restore();
    }

    drawPoisonAura(player, centerX, centerY) {
        // Check if player has poison cloud weapon
        const hasPoisonCloud = player.weapons.some(weapon => weapon.id === 'POISON_CLOUD');
        if (!hasPoisonCloud) return;

        // Get aura config from constants
        const auraRadius = 64; // TILE_SIZE * 2
        const baseParticleCount = 60;
        
        this.ctx.save();
        
        const time = Date.now() * 0.001; // Convert to seconds
        
        // Get particle multiplier from settings
        const particleMultiplier = this.gameState?.settings?.particleMultiplier ?? 1.0;
        
        // If particle multiplier is 0, just show a green transparent circle
        if (particleMultiplier === 0) {
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#90EE90';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            return;
        }
        
        // Draw poison aura particles around player (scaled by multiplier)
        const particleCount = Math.round(baseParticleCount * particleMultiplier);
        
        for (let i = 0; i < particleCount; i++) {
            // Use golden angle for even distribution
            const angle = (i * 137.5) * (Math.PI / 180);
            
            // Create swirling motion around player
            const swirlingOffset = Math.sin(time * 2 + i * 0.5) * 8;
            const distance = (auraRadius * 0.3) + ((i % 15) / 15 * auraRadius * 0.7) + swirlingOffset;
            
            const particleX = centerX + Math.cos(angle + time * 0.5) * distance;
            const particleY = centerY + Math.sin(angle + time * 0.5) * distance;
            
            // Pulsing opacity
            const pulseOpacity = 0.3 + Math.sin(time * 3 + i * 0.2) * 0.2;
            
            this.ctx.globalAlpha = pulseOpacity;
            this.ctx.fillStyle = '#90EE90'; // Light green
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawUmbrellaRain() {
        // Check if weaponSystem is available and has rain state
        if (!this.weaponSystem || !this.weaponSystem.rainState) return;

        const rainDroplets = this.weaponSystem.rainState.rainDroplets;
        if (!rainDroplets || rainDroplets.length === 0) return;

        const isThunderStorm = this.weaponSystem.rainState.thunderStormActive;
        const isExtremeRain = this.weaponSystem.rainState.extremeRainActive;

        this.ctx.save();

        // Draw rain droplets
        rainDroplets.forEach(droplet => {
            const stormType = droplet.stormType;
            
            if (stormType === 'thunder') {
                // Thunder storm droplets - electric blue with sparks and random variation
                this.ctx.strokeStyle = '#1E90FF'; // Electric blue
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.95;

                // Create jagged, organic line with connected random points
                this.ctx.beginPath();
                const segments = 6;
                const segmentHeight = 30 / segments;
                this.ctx.moveTo(droplet.x, droplet.y);
                
                for (let i = 1; i <= segments; i++) {
                    const randomOffsetX = (Math.random() - 0.5) * 3; // Random horizontal variation
                    const randomOffsetY = Math.random() * 2; // Slight vertical variation
                    const x = droplet.x + 5 * (i / segments) + randomOffsetX;
                    const y = droplet.y + (segmentHeight * i) + randomOffsetY;
                    this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();

                // Electric droplet with stronger glow at final position
                const finalX = droplet.x + 5 + (Math.random() - 0.5) * 2;
                const finalY = droplet.y + 30;
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.globalAlpha = 1.0;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.beginPath();
                this.ctx.arc(finalX, finalY, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else if (stormType === 'extreme') {
                // Extreme rain droplets - bigger, brighter with organic variation
                this.ctx.strokeStyle = '#00BFFF'; // Bright blue
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.9;

                // Create connected random path
                this.ctx.beginPath();
                const segments = 5;
                const segmentHeight = 25 / segments;
                this.ctx.moveTo(droplet.x, droplet.y);
                
                for (let i = 1; i <= segments; i++) {
                    const randomOffsetX = (Math.random() - 0.5) * 2; // Random horizontal variation
                    const randomOffsetY = Math.random() * 1.5; // Slight vertical variation
                    const x = droplet.x + 4 * (i / segments) + randomOffsetX;
                    const y = droplet.y + (segmentHeight * i) + randomOffsetY;
                    this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();

                // Bigger droplet at the bottom with random position variation
                const finalX = droplet.x + 4 + (Math.random() - 0.5) * 1.5;
                const finalY = droplet.y + 25;
                this.ctx.fillStyle = '#00BFFF';
                this.ctx.globalAlpha = 1.0;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = '#00BFFF';
                this.ctx.beginPath();
                this.ctx.arc(finalX, finalY, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else {
                // Normal rain droplets with subtle organic variation
                this.ctx.strokeStyle = '#87CEEB'; // Sky blue color
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.7;

                // Create slightly wavy connected line
                this.ctx.beginPath();
                const segments = 3;
                const segmentHeight = 15 / segments;
                this.ctx.moveTo(droplet.x, droplet.y);
                
                for (let i = 1; i <= segments; i++) {
                    const randomOffsetX = (Math.random() - 0.5) * 1; // Subtle horizontal variation
                    const randomOffsetY = Math.random() * 0.5; // Very slight vertical variation
                    const x = droplet.x + 2 * (i / segments) + randomOffsetX;
                    const y = droplet.y + (segmentHeight * i) + randomOffsetY;
                    this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();

                // Add a small droplet at the bottom with slight position variation
                const finalX = droplet.x + 2 + (Math.random() - 0.5) * 1;
                const finalY = droplet.y + 15;
                this.ctx.fillStyle = '#00BFFF'; // Deep sky blue
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(finalX, finalY, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.restore();

        // Draw thunder strikes
        if (this.weaponSystem.rainState.thunderStrikes) {
            this.drawThunderStrikes();
        }

        // Add rain overlay effect for atmosphere
        if (rainDroplets.length > 0) {
            this.ctx.save();
            
            if (isThunderStorm) {
                // Dark stormy overlay with electric flashes
                const flashIntensity = Math.sin(Date.now() / 150) * 0.15 + 0.25; // More dramatic flashing
                this.ctx.fillStyle = `rgba(25, 25, 112, ${flashIntensity})`; // Midnight blue with flash
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else if (isExtremeRain) {
                // Intense storm overlay during extreme rain
                const flashIntensity = Math.sin(Date.now() / 100) * 0.1 + 0.15; // Flashing effect
                this.ctx.fillStyle = `rgba(70, 130, 180, ${flashIntensity})`; // Darker blue with flash
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Normal rain overlay
                this.ctx.fillStyle = 'rgba(135, 206, 235, 0.05)'; // Very light blue overlay
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            this.ctx.restore();
        }
    }

    drawThunderStrikes() {
        if (!this.weaponSystem.rainState.thunderStrikes) return;

        this.ctx.save();

        this.weaponSystem.rainState.thunderStrikes.forEach(strike => {
            const age = Date.now() - strike.createdAt;
            const progress = Math.min(age / strike.duration, 1); // Clamp progress to max 1
            const alpha = Math.max(0, 1 - progress); // Ensure alpha never goes negative

            // Only draw if still visible
            if (alpha > 0) {
                // Draw lightning bolt from top of screen to target
                this.ctx.strokeStyle = '#FFFF00'; // Bright yellow
                this.ctx.lineWidth = 4;
                this.ctx.globalAlpha = alpha;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#FFFF00';

                // Create zigzag lightning pattern
                this.ctx.beginPath();
                const startY = 0;
                const endY = strike.y;
                const segments = 8;
                const segmentHeight = endY / segments;
                
                this.ctx.moveTo(strike.x, startY);
                
                for (let i = 1; i <= segments; i++) {
                    const y = startY + (segmentHeight * i);
                    const offset = (Math.random() - 0.5) * 30; // Random zigzag
                    const x = strike.x + offset;
                    this.ctx.lineTo(x, y);
                }
                
                this.ctx.stroke();

                // Add impact flash at target location
                const radius = Math.max(1, 15 * alpha); // Ensure radius is never negative or zero
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = alpha * 0.8;
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(strike.x, strike.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
    }

    loadCustomAccessories() {
        const customAccessoriesData = localStorage.getItem('customAccessories');
        if (customAccessoriesData) {
            this.customAccessoriesImage = new Image();
            this.customAccessoriesImage.onload = () => {
                console.log('Custom accessories loaded successfully');
            };
            this.customAccessoriesImage.src = customAccessoriesData;
        }
    }

    refreshCustomAccessories() {
        this.loadCustomAccessories();
    }
}
