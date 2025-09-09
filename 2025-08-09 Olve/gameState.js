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
        
        // Callback system for when points change
        this.onPointsChangedCallbacks = [];
        
        this.player = this.createPlayer();
        this.enemies = [];
        this.projectiles = [];
        this.traps = []; // Array to store deployed traps
        this.openWorld = this.createOpenWorldState();
        this.settings = this.loadSettings();
        console.log('GameState constructor - loaded settings:', this.settings);
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
            menuSoundsVolume: 1.0,        // Changed from boolean to volume level (0.0 - 1.0)
            gameOverSoundsVolume: 1.0,    // Changed from boolean to volume level (0.0 - 1.0)
            gameMusicVolume: 0.5,         // Changed from boolean to volume level (0.0 - 1.0)
            virtualJoystick: false,
            particleMultiplier: 1.0       // Particle density setting (0.0 - 2.0)
        };

        // Check for old format settings and clear them
        try {
            const oldSettings = localStorage.getItem('gameSettings');
            if (oldSettings) {
                const parsed = JSON.parse(oldSettings);
                // If we find old boolean format, clear localStorage and use defaults
                if (typeof parsed.menuSounds === 'boolean' || 
                    typeof parsed.gameMusic === 'boolean' || 
                    typeof parsed.gameOverSounds === 'boolean') {
                    console.log('Found old boolean audio settings, clearing localStorage and using new volume format');
                    localStorage.removeItem('gameSettings');
                    return defaultSettings;
                }
            }
        } catch (error) {
            console.log('Error checking for old settings format:', error);
        }

        // Try localStorage first
        let savedSettings = null;
        try {
            savedSettings = localStorage.getItem('gameSettings');
            console.log('Raw saved settings from localStorage:', savedSettings);
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
                console.log('Parsed saved settings:', parsed);
                // Merge with defaults to ensure all settings exist
                const mergedSettings = {
                    ...defaultSettings,
                    ...parsed,
                    keybinds: { ...defaultSettings.keybinds, ...(parsed.keybinds || {}) }
                };
                console.log('Final merged settings:', mergedSettings);
                return mergedSettings;
            } catch (error) {
                console.log('Failed to parse saved settings, using defaults:', error);
                return defaultSettings;
            }
        }
        
        console.log('No saved settings found, using defaults:', defaultSettings);
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
            oneHitKill: false,
            weaponTreePoints: this.loadWeaponTreePoints(),
            weaponTreeUpgrades: this.loadWeaponTreeUpgrades(),
            displayedWeaponTreePoints: this.loadWeaponTreePoints(), // For smooth animation
            pendingWeaponTreePoints: 0, // Points earned but not yet shown in menu
            lastMenuPoints: this.loadWeaponTreePoints() // Points last seen in menu
        };
    }

    // Method to register callbacks for when points change
    onPointsChanged(callback) {
        if (!this.onPointsChangedCallbacks) {
            this.onPointsChangedCallbacks = [];
        }
        this.onPointsChangedCallbacks.push(callback);
    }

    // Method to trigger all point change callbacks
    triggerPointsChanged() {
        if (!this.onPointsChangedCallbacks) {
            return;
        }
        this.onPointsChangedCallbacks.forEach(callback => {
            try {
                callback(this.player.weaponTreePoints);
            } catch (error) {
                console.error('Error in points changed callback:', error);
            }
        });
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

    loadWeaponTreePoints() {
        try {
            const savedPoints = localStorage.getItem('weaponTreePoints');
            return savedPoints ? parseInt(savedPoints, 10) : 0;
        } catch (error) {
            console.log('Failed to load weapon tree points:', error);
            return 0;
        }
    }

    loadWeaponTreeUpgrades() {
        try {
            const savedUpgrades = localStorage.getItem('weaponTreeUpgrades');
            return savedUpgrades ? JSON.parse(savedUpgrades) : {};
        } catch (error) {
            console.log('Failed to load weapon tree upgrades:', error);
            return {};
        }
    }

    saveWeaponTreePoints(points) {
        try {
            localStorage.setItem('weaponTreePoints', points.toString());
            console.log('Weapon tree points saved:', points);
        } catch (error) {
            console.log('Failed to save weapon tree points:', error);
        }
    }

    saveWeaponTreeUpgrades(upgrades) {
        try {
            localStorage.setItem('weaponTreeUpgrades', JSON.stringify(upgrades));
            console.log('Weapon tree upgrades saved:', upgrades);
        } catch (error) {
            console.log('Failed to save weapon tree upgrades:', error);
        }
    }

    addWeaponTreePoints(floors) {
        this.player.weaponTreePoints += floors;
        this.player.pendingWeaponTreePoints += floors;
        this.saveWeaponTreePoints(this.player.weaponTreePoints);
        
        console.log(`Earned ${floors} weapon tree points (total: ${this.player.weaponTreePoints}, pending: ${this.player.pendingWeaponTreePoints})`);
        
        // Trigger callbacks to notify about points change
        this.triggerPointsChanged();
    }

    // Smooth points animation system
    startPointsAnimation(onUpdate, onComplete) {
        if (this.player.pendingWeaponTreePoints <= 0) {
            onComplete && onComplete();
            return;
        }

        const startPoints = this.player.displayedWeaponTreePoints;
        const targetPoints = this.player.weaponTreePoints;
        const totalDifference = targetPoints - startPoints;
        
        if (totalDifference <= 0) {
            onComplete && onComplete();
            return;
        }

        const animationDuration = Math.min(2000, totalDifference * 100); // Max 2 seconds, 100ms per point
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            // Ease-out animation for smoother feeling
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentDisplayed = Math.floor(startPoints + (totalDifference * easeProgress));
            this.player.displayedWeaponTreePoints = currentDisplayed;
            
            onUpdate && onUpdate(currentDisplayed);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.player.displayedWeaponTreePoints = targetPoints;
                this.player.pendingWeaponTreePoints = 0;
                this.player.lastMenuPoints = targetPoints;
                onUpdate && onUpdate(targetPoints);
                onComplete && onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Check if there are points to animate
    hasPendingPointsAnimation() {
        return this.player.pendingWeaponTreePoints > 0;
    }

    // Reset animation state (for immediate updates)
    syncDisplayedPoints() {
        this.player.displayedWeaponTreePoints = this.player.weaponTreePoints;
        this.player.pendingWeaponTreePoints = 0;
        this.player.lastMenuPoints = this.player.weaponTreePoints;
    }

    // Get current display points for UI
    getDisplayedWeaponTreePoints() {
        return this.player.displayedWeaponTreePoints;
    }

    // Get weapon tree structure - One big interconnected tree
    getWeaponTree() {
        return {
            // Single unified weapon tree
            unified: {
                name: 'Weapon Mastery Tree',
                color: '#FFD700', // Gold color for the unified tree
                unlocked: true,
                weapons: {
                    // ROW 0: Starting weapons (Free)
                    sword: { 
                        name: 'Sword', 
                        weaponId: 'SWORD',
                        cost: 0,
                        position: { row: 0, col: 1 } 
                    },
                    scythe: { 
                        name: 'Scythe', 
                        weaponId: 'SCYTHE',
                        cost: 0,
                        position: { row: 0, col: 4 } 
                    },
                    bow: { 
                        name: 'Bow', 
                        weaponId: 'BOW',
                        cost: 0,
                        position: { row: 0, col: 7 } 
                    },

                    // ROW 1: First tier upgrades
                    dragonSword: { 
                        name: 'Dragon Sword', 
                        weaponId: 'DRAGON_SWORD',
                        cost: 15, 
                        requires: ['sword'],
                        position: { row: 1, col: 1 } 
                    },
                    dragonScythe: { 
                        name: 'Dragon Scythe', 
                        weaponId: 'DRAGON_SCYTHE',
                        cost: 50, 
                        requires: ['scythe'],
                        position: { row: 1, col: 4 } 
                    },
                    dragonBow: { 
                        name: 'Dragon Bow', 
                        weaponId: 'DRAGON_BOW',
                        cost: 20, 
                        requires: ['bow'],
                        position: { row: 1, col: 7 } 
                    },

                    // ROW 2: Second tier (requires first tier)
                    fireStaff: { 
                        name: 'Fire Staff', 
                        weaponId: 'FIRE_STAFF',
                        cost: 25, 
                        requires: ['dragonBow'],
                        position: { row: 2, col: 8 } 
                    },

                    // ROW 3: Third tier (staff branches)
                    healingStaff: { 
                        name: 'Healing Staff', 
                        weaponId: 'HEALING_STAFF',
                        cost: 18, 
                        requires: ['fireStaff'],
                        position: { row: 3, col: 6 } 
                    },
                    iceStaff: { 
                        name: 'Ice Staff', 
                        weaponId: 'ICE_STAFF',
                        cost: 20, 
                        requires: ['fireStaff'],
                        position: { row: 3, col: 8 } 
                    },
                    lightningStaff: { 
                        name: 'Lightning Staff', 
                        weaponId: 'LIGHTNING_STAFF',
                        cost: 22, 
                        requires: ['fireStaff'],
                        position: { row: 3, col: 9 } 
                    },

                    // ROW 4: Cross-branch combinations
                    natureScythe: { 
                        name: 'Nature Scythe', 
                        weaponId: 'NATURE_SCYTHE',
                        cost: 25, 
                        requires: ['dragonScythe', 'healingStaff'],
                        position: { row: 4, col: 4 } 
                    },
                    boomerang: { 
                        name: 'Boomerang', 
                        weaponId: 'BOOMERANG',
                        cost: 30, 
                        requires: ['dragonBow'],
                        position: { row: 4, col: 7 } 
                    },

                    // ROW 5: Advanced combinations requiring cross-branch
                    throwingAxe: { 
                        name: 'Throwing Axe', 
                        weaponId: 'THROWING_AXE',
                        cost: 12, 
                        requires: ['dragonSword', 'boomerang'],
                        position: { row: 5, col: 0 } 
                    },
                    
                    spiritBlade: { 
                        name: 'Spirit Blade', 
                        weaponId: 'SPIRIT_BLADE',
                        cost: 35, 
                        requires: ['dragonSword', 'throwingAxe'],
                        position: { row: 5, col: 2 } 
                    },

                    // ROW 6: Higher tier combinations
                    chakram: { 
                        name: 'Chakram', 
                        weaponId: 'CHAKRAM',
                        cost: 45, 
                        requires: ['throwingAxe', 'spiritBlade'],
                        position: { row: 6, col: 1 } 
                    },
                    crystalScythe: { 
                        name: 'Crystal Scythe', 
                        weaponId: 'CRYSTAL_SCYTHE',
                        cost: 40, 
                        requires: ['natureScythe', 'dragonScythe', 'spiritBlade'],
                        position: { row: 6, col: 4 } 
                    },
                    spikeTrap: { 
                        name: 'Spike Trap', 
                        weaponId: 'SPIKE_TRAP',
                        cost: 35, 
                        requires: ['spiritBlade', 'healingStaff'],
                        position: { row: 6, col: 6 } 
                    },

                    // ROW 7: Elite weapons
                    flamingSkull: { 
                        name: 'Flaming Skull', 
                        weaponId: 'FLAMING_SKULL',
                        cost: 60, 
                        requires: ['crystalScythe', 'lightningStaff'],
                        position: { row: 7, col: 5 } 
                    },
                    explosiveMine: { 
                        name: 'Explosive Mine', 
                        weaponId: 'EXPLOSIVE_MINE',
                        cost: 40, 
                        requires: ['spikeTrap'],
                        position: { row: 7, col: 6 } 
                    },
                    webLauncher: { 
                        name: 'Web Launcher', 
                        weaponId: 'WEB_LAUNCHER',
                        cost: 45, 
                        requires: ['spikeTrap', 'chakram'],
                        position: { row: 7, col: 2 } 
                    },
                    tripleBow: { 
                        name: 'Triple Bow', 
                        weaponId: 'TRIPLE_BOW',
                        cost: 55, 
                        requires: ['lightningStaff', 'crystalScythe'],
                        position: { row: 7, col: 8 } 
                    },

                    // ROW 8: Master tier
                    cursedOrb: { 
                        name: 'Cursed Orb', 
                        weaponId: 'CURSED_ORB',
                        cost: 80, 
                        requires: ['flamingSkull', 'iceStaff'],
                        position: { row: 8, col: 5 } 
                    },
                    poisonCloud: { 
                        name: 'Poison Cloud', 
                        weaponId: 'POISON_CLOUD',
                        cost: 55, 
                        requires: ['webLauncher', 'explosiveMine'],
                        position: { row: 8, col: 3 } 
                    },

                    // ROW 10: Ultimate weapon
                    umbrella: { 
                        name: 'The Umbrella', 
                        weaponId: 'UMBRELLA',
                        cost: 100, 
                        requires: ['poisonCloud', 'flamingSkull', 'cursedOrb', 'chakram'],
                        position: { row: 10, col: 4 } 
                    }
                }
            }
        };
    }

    // Purchase a weapon unlock
    purchaseWeapon(branch, weaponKey) {
        const tree = this.getWeaponTree();
        const weapon = tree[branch]?.weapons[weaponKey];
        
        if (!weapon) return false;
        if (this.player.weaponTreePoints < weapon.cost) return false;
        
        // Check requirements
        if (weapon.requires) {
            const purchased = this.loadWeaponTreeUpgrades();
            const branchPurchased = purchased[branch] || {};
            
            for (const req of weapon.requires) {
                if (!branchPurchased[req]) {
                    return false; // Requirement not met
                }
            }
        }
        
        // Purchase the weapon
        this.player.weaponTreePoints -= weapon.cost;
        this.saveWeaponTreePoints(this.player.weaponTreePoints);
        
        // Save purchase
        const purchased = this.loadWeaponTreeUpgrades();
        if (!purchased[branch]) purchased[branch] = {};
        purchased[branch][weaponKey] = true;
        this.saveWeaponTreeUpgrades(purchased);
        
        // Trigger callbacks to notify about points change AFTER everything is saved
        this.triggerPointsChanged();
        
        return true;
    }

    // Check if a weapon is unlocked
    isWeaponUnlocked(branch, weaponKey) {
        const purchased = this.loadWeaponTreeUpgrades();
        return !!(purchased[branch] && purchased[branch][weaponKey]);
    }

    // Get all unlocked weapons for weapon selection
    getUnlockedWeapons() {
        const tree = this.getWeaponTree();
        const unlocked = [];
        
        Object.entries(tree).forEach(([branchKey, branch]) => {
            Object.entries(branch.weapons).forEach(([weaponKey, weapon]) => {
                if (this.isWeaponUnlocked(branchKey, weaponKey)) {
                    unlocked.push(weapon.weaponId);
                }
            });
        });
        
        return unlocked;
    }

    // Reset weapon tree progress to just basic weapons
    resetWeaponTree() {
        try {
            // Clear all saved upgrades
            localStorage.removeItem('weaponTreeUpgrades');
            
            // Reset weapon tree points to 0
            this.player.weaponTreePoints = 0;
            this.saveWeaponTreePoints(0);
            
            // Reset the player's weapon tree upgrades in memory
            this.player.weaponTreeUpgrades = {};
            
            // Auto-unlock basic weapons again
            const basicWeapons = ['sword', 'scythe', 'bow'];
            const upgrades = {
                unified: {}
            };
            
            basicWeapons.forEach(weaponKey => {
                upgrades.unified[weaponKey] = true;
            });
            
            // Save the basic weapons as unlocked
            this.saveWeaponTreeUpgrades(upgrades);
            this.player.weaponTreeUpgrades = upgrades;
            
            console.log('Weapon tree progress reset successfully');
            return true;
        } catch (error) {
            console.log('Failed to reset weapon tree progress:', error);
            return false;
        }
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
