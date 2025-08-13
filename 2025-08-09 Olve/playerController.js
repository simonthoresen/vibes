import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class PlayerController {
    constructor(gameState, inputManager) {
        this.gameState = gameState;
        this.inputManager = inputManager;
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
