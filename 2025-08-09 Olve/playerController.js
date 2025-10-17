import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class PlayerController {
    constructor(gameState, inputManager) {
        this.gameState = gameState;
        this.inputManager = inputManager;
        this.particleEngine = null;
        this.renderer = null;
        this.lastUmbrellaPoofTime = 0; // Cooldown for umbrella poof visual effect
    }

    setParticleEngine(particleEngine) {
        this.particleEngine = particleEngine;
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    getUmbrellaSprite() {
        // Try to get umbrella sprite from renderer
        if (this.renderer && this.renderer.umbrellaImage && this.renderer.umbrellaImageLoaded) {
            return this.renderer.umbrellaImage;
        }
        return null; // Will use fallback circle in particle engine
    }

    update() {
        if (this.gameState.isPaused || this.gameState.deathSequence) {
            return;
        }

        this.updateMovement();
        this.updateInvulnerability();
        this.wrapPosition();
    }

    updateMovement() {
        const timeScale = this.gameState.timeScale || 1;
        const keybinds = this.gameState.settings.keybinds;
        const speed = this.gameState.player.speed * timeScale;

        // Handle keyboard input
        if (this.inputManager.isKeyPressed(keybinds.up)) {
            this.gameState.player.y -= speed;
        }
        if (this.inputManager.isKeyPressed(keybinds.down)) {
            this.gameState.player.y += speed;
        }
        if (this.inputManager.isKeyPressed(keybinds.left)) {
            this.gameState.player.x -= speed;
        }
        if (this.inputManager.isKeyPressed(keybinds.right)) {
            this.gameState.player.x += speed;
        }

        // Handle virtual joystick input
        if (this.gameState.settings.virtualJoystick && this.inputManager.isMoving()) {
            const virtualInput = this.inputManager.getVirtualInput();
            console.log('Using virtual input for movement:', virtualInput);
            this.gameState.player.x += virtualInput.deltaX * speed * 1.5; // Slightly faster for touch
            this.gameState.player.y += virtualInput.deltaY * speed * 1.5;
        }
    }

    updateInvulnerability() {
        if (this.gameState.player.invulnerable && 
            !this.gameState.player.permanentInvulnerability && 
            Date.now() - this.gameState.player.lastHit >= this.gameState.player.invulnerabilityDuration) {
            this.gameState.player.invulnerable = false;
        }
    }

    wrapPosition() {
        const player = this.gameState.player;
        
        if (player.x < 0) player.x = CANVAS_WIDTH;
        if (player.x > CANVAS_WIDTH) player.x = 0;
        if (player.y < 0) player.y = CANVAS_HEIGHT;
        if (player.y > CANVAS_HEIGHT) player.y = 0;
    }

    takeDamage(damage) {
        if (this.gameState.player.invulnerable) {
            return false;
        }

        // Check for Null Barrier effect (shop exclusive item)
        if (this.gameState.passiveItems && this.gameState.passiveItems.NULL_BARRIER) {
            const now = Date.now();
            const nullBarrier = this.gameState.passiveItems.NULL_BARRIER;
            const stackMultiplier = nullBarrier.stackMultiplier;
            
            // Initialize null barrier state if not exists
            if (!this.gameState.nullBarrierState) {
                this.gameState.nullBarrierState = {
                    lastActivation: 0,
                    cooldown: Math.max(1000, 5000 / stackMultiplier) // Cooldown decreases with stacks (min 1 second)
                };
            }
            
            const nullBarrierState = this.gameState.nullBarrierState;
            
            // Check if we can activate null barrier
            if (now - nullBarrierState.lastActivation >= nullBarrierState.cooldown) {
                // Activate null barrier - reduce damage and start damage reduction period
                const damageReduction = Math.min(0.9, 0.5 * stackMultiplier); // Damage reduction increases with stacks (max 90%)
                damage = damage * (1 - damageReduction);
                
                // Set damage reduction for next 1 second
                this.gameState.nullBarrierActive = true;
                this.gameState.nullBarrierEndTime = now + 1000;
                this.gameState.nullBarrierReduction = damageReduction;
                
                nullBarrierState.lastActivation = now;
                
                console.log(`🛡️ [NULL BARRIER] Activated! Damage reduced by ${(damageReduction * 100).toFixed(0)}% for 1 second (${nullBarrier.count} items equipped, ${nullBarrier.stackMultiplier}x multiplier)`);
                
                // Create visual effect
                if (this.particleEngine && this.particleEngine.createShieldEffect) {
                    const centerX = this.gameState.player.x + this.gameState.player.width / 2;
                    const centerY = this.gameState.player.y + this.gameState.player.height / 2;
                    this.particleEngine.createShieldEffect(centerX, centerY, '#e63946');
                }
            } else if (this.gameState.nullBarrierActive && now < this.gameState.nullBarrierEndTime) {
                // Apply ongoing damage reduction
                const originalDamage = damage;
                damage = damage * (1 - this.gameState.nullBarrierReduction);
                console.log(`🛡️ [NULL BARRIER] Ongoing protection! Damage ${originalDamage.toFixed(1)} → ${damage.toFixed(1)} (${(this.gameState.nullBarrierReduction * 100).toFixed(0)}% reduction)`);
            }
            
            // Clean up expired barrier
            if (this.gameState.nullBarrierActive && now >= this.gameState.nullBarrierEndTime) {
                this.gameState.nullBarrierActive = false;
            }
        }

        // Check for umbrella dodge chance
        const umbrellaWeapons = this.gameState.player.weapons.filter(weapon => weapon.id === 'UMBRELLA');
        if (umbrellaWeapons.length > 0) {
            // Calculate total dodge chance: 5% per umbrella, capped at 100%
            const totalDodgeChance = Math.min(umbrellaWeapons.length * 0.05, 1.0); // Cap at 100%
            
            if (Math.random() < totalDodgeChance) {
                // Damage dodged! Store this for visual feedback
                this.gameState.player.lastDodge = Date.now();
                this.gameState.player.dodgeCount = (this.gameState.player.dodgeCount || 0) + 1;
                
                console.log(`Damage dodged with umbrella! (${(totalDodgeChance * 100).toFixed(0)}% chance) - Total dodges: ${this.gameState.player.dodgeCount}`);
                
                // Create umbrella dodge particle effect with cooldown (500ms)
                const currentTime = Date.now();
                const poofCooldown = 500; // 500ms cooldown between poof effects
                
                if (this.particleEngine && this.particleEngine.createUmbrellaDodgeEffect && 
                    currentTime - this.lastUmbrellaPoofTime > poofCooldown) {
                    const centerX = this.gameState.player.x + this.gameState.player.width / 2;
                    const centerY = this.gameState.player.y + this.gameState.player.height / 2;
                    
                    // Get umbrella sprite from renderer if available
                    const umbrellaSprite = this.getUmbrellaSprite();
                    this.particleEngine.createUmbrellaDodgeEffect(centerX, centerY, umbrellaSprite);
                    this.lastUmbrellaPoofTime = currentTime;
                }
                
                return false; // No damage taken
            }
        }

        this.gameState.player.health = Math.max(0, this.gameState.player.health - damage);
        this.gameState.player.invulnerable = true;
        this.gameState.player.lastHit = Date.now();

        return true;
    }

    heal(amount) {
        this.gameState.player.health = Math.min(
            this.gameState.player.maxHealth,
            this.gameState.player.health + amount
        );
    }

    addWeapon(weapon) {
        this.gameState.player.weapons.push(weapon);
    }

    clearWeapons() {
        this.gameState.player.weapons = [];
        this.gameState.player.lastAttacks = {};
    }

    reset() {
        this.gameState.player.health = this.gameState.player.maxHealth;
        this.gameState.player.x = CANVAS_WIDTH / 2;
        this.gameState.player.y = CANVAS_HEIGHT / 2;
        this.gameState.player.invulnerable = false;
        this.gameState.player.rotation = 0;
        this.clearWeapons();
    }
}
