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
        this.storageAvailable = false; // Track if storage is working
        
        this.player = this.createPlayer();
        this.enemies = [];
        this.projectiles = [];
        this.openWorld = this.createOpenWorldState();
        this.settings = this.loadSettings();
        this.checkStorageAvailability();
    }

    checkStorageAvailability() {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        try {
            const testKey = 'storage-test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.storageAvailable = true;
            console.log('localStorage is available' + (isIOS ? ' (iOS device)' : ''));
        } catch (error) {
            console.log('localStorage not available' + (isIOS ? ' (iOS device)' : '') + ', checking sessionStorage');
            if (isIOS) {
                console.log('iOS detected - localStorage may be disabled in private browsing mode');
            }
            try {
                const testKey = 'storage-test';
                sessionStorage.setItem(testKey, 'test');
                sessionStorage.removeItem(testKey);
                this.storageAvailable = true;
                console.log('sessionStorage is available as fallback');
            } catch (error2) {
                this.storageAvailable = false;
                console.log('No storage available - settings will not persist');
                if (isIOS) {
                    console.log('iOS users: Try disabling private browsing mode to enable settings persistence');
                }
            }
        }
    }

    loadSettings() {
        // Load settings from localStorage or use defaults
        const defaultSettings = {
            keybinds: { ...DEFAULT_KEYBINDS },
            showPauseBtn: true,
            scrollableCheatMenu: false,
            scrollableSettingsMenu: false,
            menuSounds: true,
            gameOverSounds: true,
            gameSounds: true,
            gameMusic: true,
            virtualJoystick: false
        };

        // Try localStorage first
        let savedSettings = null;
        try {
            savedSettings = localStorage.getItem('gameSettings');
        } catch (error) {
            console.log('Failed to access localStorage:', error);
        }

        // If localStorage failed, try sessionStorage
        if (!savedSettings) {
            try {
                savedSettings = sessionStorage.getItem('gameSettings');
                console.log('Loaded settings from sessionStorage fallback');
            } catch (error) {
                console.log('Failed to access sessionStorage:', error);
            }
        }

        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Merge with defaults to ensure all settings exist
                return {
                    ...defaultSettings,
                    ...parsed,
                    keybinds: { ...defaultSettings.keybinds, ...(parsed.keybinds || {}) }
                };
            } catch (error) {
                console.log('Failed to parse saved settings, using defaults:', error);
                return defaultSettings;
            }
        }
        
        return defaultSettings;
    }

    saveSettings(retryCount = 0) {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                console.log('localStorage not supported by this browser');
                return this.tryAlternativeStorage();
            }
            
            // Test if we can actually write to localStorage (fails in private browsing)
            const testKey = 'localStorage-test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            // Save the actual settings
            const settingsString = JSON.stringify(this.settings);
            localStorage.setItem('gameSettings', settingsString);
            console.log('Settings saved successfully to localStorage:', settingsString);
            
            // Verify the save worked by reading it back
            const verification = localStorage.getItem('gameSettings');
            if (verification === settingsString) {
                this.storageAvailable = true;
                return true;
            } else {
                throw new Error('Verification failed - saved data does not match');
            }
        } catch (error) {
            console.log('Failed to save settings to localStorage (attempt ' + (retryCount + 1) + '):', error);
            console.log('Error details:', error.name, error.message);
            
            // Retry once for iOS intermittent failures
            if (retryCount === 0) {
                console.log('Retrying localStorage save...');
                setTimeout(() => this.saveSettings(1), 100);
                return false;
            }
            
            // Try alternative storage methods for iOS
            this.storageAvailable = false;
            return this.tryAlternativeStorage();
        }
    }

    tryAlternativeStorage() {
        try {
            // Try sessionStorage as fallback
            if (typeof sessionStorage !== 'undefined') {
                const settingsString = JSON.stringify(this.settings);
                sessionStorage.setItem('gameSettings', settingsString);
                console.log('Settings saved to sessionStorage as fallback:', settingsString);
                return true;
            }
        } catch (error) {
            console.log('Alternative storage also failed:', error);
            // Could implement cookie-based storage here as last resort
        }
        return false;
    }

    createPlayer() {
        const savedSkinsUnlocked = localStorage.getItem('skinsUnlocked') === 'true';
        const savedSkinName = localStorage.getItem('selectedSkin');
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
            skin: PLAYER_SKINS.find(s => s.name === savedSkinName) || PLAYER_SKINS[0],
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
