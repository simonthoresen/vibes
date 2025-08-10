import { DEFAULT_KEYBINDS, PLAYER_SKINS } from './constants.js';

export class GameState {
    constructor() {
        this.gameMode = 'normal';
        this.isPaused = false;
        this.gameStarted = false;
        this.showMainMenu = true;
        this.showSkinMenu = false;
        this.gameCompleted = false;
        this.currentFloor = 0;
        this.floorCleared = true;
        this.enemyHPMultiplier = 1;
        this.deathSequence = false;
        this.timeScale = 1;
        
        this.player = this.createPlayer();
        this.enemies = [];
        this.projectiles = [];
        this.openWorld = this.createOpenWorldState();
        this.settings = {
            keybinds: { ...DEFAULT_KEYBINDS }
        };
    }

    createPlayer() {
        const savedSkinsUnlocked = localStorage.getItem('skinsUnlocked') === 'true';
        
        return {
            x: 400, // CANVAS_WIDTH / 2
            y: 300, // CANVAS_HEIGHT / 2
            width: 32, // TILE_SIZE
            height: 32, // TILE_SIZE
            speed: 3,
            health: 100,
            maxHealth: 100,
            weapons: [],
            lastAttacks: {},
            invulnerable: false,
            permanentInvulnerability: false,
            invulnerabilityDuration: 1000,
            lastHit: 0,
            rotation: 0,
            skin: PLAYER_SKINS[0],
            highestFloor: 0,
            skinsUnlocked: savedSkinsUnlocked,
            cheatsEnabled: false,
            oneHitKill: false
        };
    }

    createOpenWorldState() {
        return {
            time: 0,
            isNight: false,
            buildings: [],
            spawnedWeapons: [],
            DAY_DURATION: 90000,
            NIGHT_DURATION: 120000
        };
    }

    reset() {
        this.player = this.createPlayer();
        this.enemies = [];
        this.projectiles = [];
        this.currentFloor = 0;
        this.floorCleared = true;
        this.enemyHPMultiplier = 1;
        this.isPaused = false;
        this.gameStarted = false;
        this.gameCompleted = false;
        this.deathSequence = false;
        this.timeScale = 1;
    }
}
