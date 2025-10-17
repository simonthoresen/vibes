import { DEFAULT_KEYBINDS, PLAYER_SKINS, WEAPONS } from './constants.js';

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
        const savedSkinName = localStorage.getItem('playerSkin') || localStorage.getItem('selectedSkin');
        
        let playerSkin = PLAYER_SKINS.find(s => s.name === savedSkinName) || PLAYER_SKINS[0];
        
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
            skin: playerSkin,
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
        // Handle both old branch-based calls and new unified structure
        const weapon = branch === 'unified' 
            ? tree.unified?.weapons[weaponKey]
            : tree.unified?.weapons[weaponKey]; // All weapons are now in unified branch
        
        if (!weapon) {
            console.error(`Weapon not found: branch=${branch}, weaponKey=${weaponKey}`);
            return false;
        }
        if (this.player.weaponTreePoints < weapon.cost) return false;
        
        // Check requirements
        if (weapon.requires) {
            const purchased = this.loadWeaponTreeUpgrades();
            const purchasedWeapons = purchased.unified || {};
            
            for (const req of weapon.requires) {
                if (!purchasedWeapons[req]) {
                    return false; // Requirement not met
                }
            }
        }
        
        // Purchase the weapon
        this.player.weaponTreePoints -= weapon.cost;
        this.saveWeaponTreePoints(this.player.weaponTreePoints);
        
        // Save purchase - always save to unified branch
        const purchased = this.loadWeaponTreeUpgrades();
        if (!purchased.unified) purchased.unified = {};
        purchased.unified[weaponKey] = true;
        this.saveWeaponTreeUpgrades(purchased);
        
        // Update in-memory state
        this.player.weaponTreeUpgrades = purchased;
        
        // Trigger callbacks to notify about points change AFTER everything is saved
        this.triggerPointsChanged();
        
        console.log(`Weapon ${weaponKey} purchased successfully in unified tree`);
        
        // Validate state after purchase
        this.validateWeaponTreeState();
        
        return true;
    }

    // Debug method to validate weapon tree state
    validateWeaponTreeState() {
        const purchased = this.loadWeaponTreeUpgrades();
        const tree = this.getWeaponTree();
        
        if (!purchased.unified) {
            console.warn('No unified purchases found in weapon tree state');
            return;
        }
        
        const purchasedCount = Object.keys(purchased.unified).length;
        const totalWeapons = Object.keys(tree.unified.weapons).length;
        
        console.log(`Weapon Tree State: ${purchasedCount}/${totalWeapons} weapons unlocked`);
        
        // Check for any inconsistencies
        Object.entries(purchased.unified).forEach(([weaponKey, isPurchased]) => {
            if (!tree.unified.weapons[weaponKey]) {
                console.error(`Purchased weapon ${weaponKey} not found in tree definition!`);
            }
        });
    }

    // Check if a weapon is unlocked
    isWeaponUnlocked(branch, weaponKey) {
        const purchased = this.loadWeaponTreeUpgrades();
        // Handle both old branch-based calls and new unified structure
        if (branch === 'unified' || !branch) {
            return !!(purchased.unified && purchased.unified[weaponKey]);
        }
        // Legacy support for old branch calls
        return !!(purchased.unified && purchased.unified[weaponKey]);
    }

    // Get all unlocked weapons for weapon selection
    getUnlockedWeapons() {
        const tree = this.getWeaponTree();
        const purchased = this.loadWeaponTreeUpgrades();
        const purchasedWeapons = purchased.unified || {};
        const unlocked = [];
        
        // Use unified tree structure
        Object.entries(tree.unified.weapons).forEach(([weaponKey, weapon]) => {
            if (purchasedWeapons[weaponKey]) {
                unlocked.push(weapon.weaponId);
            }
        });
        
        return unlocked;
    }

    // Reset all game data including weapon tree and shop exclusive items
    resetAllGameData() {
        try {
            console.log('🗑️ [RESET ALL DATA] Starting complete game data reset...');
            
            // Clear all game progress data
            localStorage.removeItem('weaponTreeUpgrades');
            localStorage.removeItem('weaponTreePoints');
            localStorage.removeItem('purchasedShopItems');
            localStorage.removeItem('shopData');
            localStorage.removeItem('skinsUnlocked');
            localStorage.removeItem('playerSkin');
            localStorage.removeItem('selectedSkin');
            localStorage.removeItem('customAccessories');
            localStorage.removeItem('customSkin');
            
            console.log('🗑️ [RESET ALL DATA] Cleared localStorage items');
            
            // Reset weapon tree points to 0
            this.player.weaponTreePoints = 0;
            this.saveWeaponTreePoints(0);
            
            // Reset the player's weapon tree upgrades in memory
            this.player.weaponTreeUpgrades = {};
            
            // Reset skin settings
            this.player.skinsUnlocked = false;
            this.player.skinName = 'default';
            
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
            
            // Reset shop exclusive items state
            this.savePurchasedShopItems({});
            
            console.log('🗑️ [RESET ALL DATA] All game data reset successfully - weapon tree, shop items, skins, and cosmetics cleared');
            return true;
        } catch (error) {
            console.log('🗑️ [RESET ALL DATA] Failed to reset game data:', error);
            return false;
        }
    }
    
    // Legacy method name for backwards compatibility
    resetWeaponTree() {
        return this.resetAllGameData();
    }

    // Shop System
    getShopExclusiveItems() {
        return {
            entropyReactor: {
                name: '⚔️ Entropy Reactor',
                type: 'Weapon Core',
                description: 'Every second you continuously deal damage to the same enemy, your damage against that target increases by +10%, stacking up to +100%. The bonus resets if you stop hitting that enemy for 1 second.',
                baseCost: 250,
                isShopExclusive: true
            },
            voltageLoop: {
                name: '⚡ Voltage Loop',
                type: 'Augment',
                description: 'Every 5th hit releases a lightning arc that jumps to up to 3 nearby enemies, dealing 30% weapon damage each.',
                baseCost: 180,
                isShopExclusive: true
            },
            thermalConverter: {
                name: '🔥 Thermal Converter',
                type: 'Core Upgrade',
                description: 'Each second of continuous firing increases your weapon\'s heat by 1. At 10 stacks, your attacks ignite enemies for 2% of their max HP over 3 seconds, then heat resets.',
                baseCost: 200,
                isShopExclusive: true
            },
            wraithDrive: {
                name: '💀 Wraith Drive',
                type: 'Passive Relic',
                description: 'Killing an enemy grants +1% fire rate for 10 seconds, stacking up to +20%. Refreshes duration on new kills.',
                baseCost: 160,
                isShopExclusive: true
            },
            nullBarrier: {
                name: '🩸 Null Barrier',
                type: 'Defensive Relic',
                description: 'Taking damage reduces all incoming damage by 50% for the next 1 second (cooldown: 5 seconds).',
                baseCost: 220,
                isShopExclusive: true
            },
            fractalLens: {
                name: '🧠 Fractal Lens',
                type: 'Special Relic',
                description: 'Every 3 seconds, your next shot fires an additional projectile per enemy nearby (up to +5).',
                baseCost: 300,
                isShopExclusive: true
            }
        };
    }

    getWeaponTreeItemsForShop() {
        const weaponTree = this.getWeaponTree();
        const purchasedWeapons = this.loadWeaponTreeUpgrades();
        const unlockedWeapons = purchasedWeapons.unified || {};
        const shopWeapons = {};

        // Get weapons that have requirements met (regardless of purchase status)
        Object.entries(weaponTree.unified.weapons).forEach(([weaponKey, weapon]) => {
            const hasCost = weapon.cost > 0;
            
            // Skip free weapons (basic weapons like sword, scythe, bow)
            if (!hasCost) {
                return;
            }

            // Check if requirements are met
            let requirementsMet = true;
            if (weapon.requires && weapon.requires.length > 0) {
                requirementsMet = weapon.requires.every(reqWeapon => !!unlockedWeapons[reqWeapon]);
            }
            
            // Add weapons that have requirements met (whether purchased or not)
            if (requirementsMet) {
                // Use the weapon tree key as the shop key, but verify the weapon exists in WEAPONS
                const weaponExists = weapon.weaponId && WEAPONS[weapon.weaponId];
                
                if (weaponExists) {
                    shopWeapons[weaponKey] = {
                        name: `⚔️ ${weapon.name}`,
                        type: 'Weapon Upgrade',
                        description: `Permanently unlock this weapon upgrade for future runs. Original weapon tree cost: ${weapon.cost} points.`,
                        baseCost: Math.floor(weapon.cost * 1.5), // Shop cost is 1.5x weapon tree cost
                        isShopExclusive: false,
                        weaponTreeKey: weaponKey,
                        weaponId: weapon.weaponId
                    };
                } else {
                    console.warn(`Weapon tree item ${weaponKey} references non-existent weapon ${weapon.weaponId}`);
                }
            }
        });

        return shopWeapons;
    }

    getShopItems() {
        const exclusiveItems = this.getShopExclusiveItems();
        const weaponItems = this.getWeaponTreeItemsForShop();
        
        return {
            ...exclusiveItems,
            ...weaponItems
        };
    }

    loadShopData() {
        try {
            const savedShopData = localStorage.getItem('shopData');
            if (savedShopData) {
                const data = JSON.parse(savedShopData);
                // Check if it's a new hour and refresh is needed
                const now = new Date();
                const currentHour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
                if (data.lastRefresh !== currentHour) {
                    return this.generateNewShopData();
                }
                return data;
            }
            return this.generateNewShopData();
        } catch (error) {
            console.log('Failed to load shop data:', error);
            return this.generateNewShopData();
        }
    }

    saveShopData(shopData) {
        try {
            localStorage.setItem('shopData', JSON.stringify(shopData));
            console.log('Shop data saved:', shopData);
        } catch (error) {
            console.log('Failed to save shop data:', error);
        }
    }

    generateNewShopData() {
        const allItems = this.getShopItems();
        const exclusiveItems = this.getShopExclusiveItems();
        const weaponItems = this.getWeaponTreeItemsForShop();
        
        const exclusiveKeys = Object.keys(exclusiveItems);
        const weaponKeys = Object.keys(weaponItems);
        
        let finalSelection = [];
        
        // Always try to have exactly 3 items
        const targetItems = 3;
        
        // If we have available weapon items, prioritize mixing them with exclusives
        if (weaponKeys.length > 0) {
            // Try to get 1-2 weapon items and 1-2 exclusive items
            const weaponCount = Math.min(2, weaponKeys.length);
            const exclusiveCount = Math.min(targetItems - weaponCount, exclusiveKeys.length);
            
            const selectedWeapons = this.getRandomItems(weaponKeys, weaponCount);
            const selectedExclusives = this.getRandomItems(exclusiveKeys, exclusiveCount);
            
            finalSelection = [...selectedWeapons, ...selectedExclusives];
        } else {
            // No available weapons, use only exclusive items
            finalSelection = this.getRandomItems(exclusiveKeys, Math.min(targetItems, exclusiveKeys.length));
        }
        
        // If we still don't have enough items, pad with more exclusives
        while (finalSelection.length < targetItems && finalSelection.length < exclusiveKeys.length) {
            const remaining = exclusiveKeys.filter(key => !finalSelection.includes(key));
            if (remaining.length > 0) {
                const additional = this.getRandomItems(remaining, Math.min(targetItems - finalSelection.length, remaining.length));
                finalSelection.push(...additional);
            } else {
                break;
            }
        }
        
        // Shuffle the final selection
        finalSelection = this.getRandomItems(finalSelection, finalSelection.length);
        
        const discounts = [25, 50, 75];
        
        const now = new Date();
        const currentHour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        
        const shopData = {
            lastRefresh: currentHour,
            items: finalSelection.map(itemKey => {
                const item = allItems[itemKey];
                // Only apply discounts to non-exclusive items (weapon tree items)
                const discount = item.isShopExclusive ? 0 : discounts[Math.floor(Math.random() * discounts.length)];
                
                return {
                    key: itemKey,
                    discount: discount
                };
            })
        };
        
        this.saveShopData(shopData);
        return shopData;
    }

    getRandomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    forceRefreshShop() {
        const newShopData = this.generateNewShopData();
        console.log('Shop forcibly refreshed:', newShopData);
        return newShopData;
    }

    loadPurchasedShopItems() {
        try {
            const savedItems = localStorage.getItem('purchasedShopItems');
            return savedItems ? JSON.parse(savedItems) : {};
        } catch (error) {
            console.log('Failed to load purchased shop items:', error);
            return {};
        }
    }

    savePurchasedShopItems(items) {
        try {
            localStorage.setItem('purchasedShopItems', JSON.stringify(items));
            console.log('Purchased shop items saved:', items);
        } catch (error) {
            console.log('Failed to save purchased shop items:', error);
        }
    }

    purchaseShopItem(itemKey) {
        const shopItems = this.getShopItems();
        const shopData = this.loadShopData();
        const purchasedItems = this.loadPurchasedShopItems();
        
        // Check if item is already purchased
        if (purchasedItems[itemKey]) {
            return { success: false, message: 'Item already purchased!' };
        }
        
        // Find the item in current shop
        const shopItem = shopData.items.find(item => item.key === itemKey);
        if (!shopItem) {
            return { success: false, message: 'Item not available in current shop!' };
        }
        
        const item = shopItems[itemKey];
        const effectiveDiscount = item.isShopExclusive ? 0 : shopItem.discount;
        const discountedCost = Math.floor(item.baseCost * (1 - effectiveDiscount / 100));
        
        // Check if player has enough points
        if (this.player.weaponTreePoints < discountedCost) {
            return { success: false, message: 'Not enough points!' };
        }
        
        // Purchase the item
        this.player.weaponTreePoints -= discountedCost;
        this.saveWeaponTreePoints(this.player.weaponTreePoints);
        
        // Mark as purchased in shop
        purchasedItems[itemKey] = true;
        this.savePurchasedShopItems(purchasedItems);
        
        // If this is a weapon tree item, also unlock it in the weapon tree
        if (!item.isShopExclusive && item.weaponTreeKey) {
            const weaponTreeUpgrades = this.loadWeaponTreeUpgrades();
            if (!weaponTreeUpgrades.unified) {
                weaponTreeUpgrades.unified = {};
            }
            weaponTreeUpgrades.unified[item.weaponTreeKey] = true;
            this.saveWeaponTreeUpgrades(weaponTreeUpgrades);
            this.player.weaponTreeUpgrades = weaponTreeUpgrades;
            
            console.log(`Weapon ${item.weaponTreeKey} unlocked in weapon tree via shop purchase`);
        }
        
        // Trigger points changed callback
        this.triggerPointsChanged();
        
        return { success: true, message: `${item.name} purchased successfully!` };
    }

    getShopItemsByCurrentRotation() {
        const shopData = this.loadShopData();
        const shopItems = this.getShopItems();
        const purchasedItems = this.loadPurchasedShopItems();
        const weaponTreeUpgrades = this.loadWeaponTreeUpgrades();
        const unlockedWeapons = weaponTreeUpgrades.unified || {};
        
        // Check if any items are missing and regenerate if needed
        const missingItems = shopData.items.filter(shopItem => !shopItems[shopItem.key]);
        if (missingItems.length > 0) {
            console.warn(`Found ${missingItems.length} missing shop items, regenerating shop data:`, missingItems.map(item => item.key));
            // Regenerate shop data and try again
            const newShopData = this.generateNewShopData();
            this.saveShopData(newShopData);
            return this.getShopItemsByCurrentRotation(); // Recursive call with new data
        }

        return shopData.items.map(shopItem => {
            const item = shopItems[shopItem.key];
            
            // This should not happen now due to the check above, but keep as safety
            if (!item) {
                console.warn(`Shop item not found: ${shopItem.key}, skipping this item`);
                return null;
            }
            
            // Apply discount only if item allows discounts (non-exclusive items)
            const effectiveDiscount = item.isShopExclusive ? 0 : shopItem.discount;
            const discountedCost = Math.floor(item.baseCost * (1 - effectiveDiscount / 100));
            
            // Check if item is purchased from shop OR unlocked in weapon tree (for weapon tree items)
            let isPurchased = !!purchasedItems[shopItem.key];
            if (!item.isShopExclusive && item.weaponTreeKey) {
                // For weapon tree items, also check if they're unlocked in the weapon tree
                isPurchased = isPurchased || !!unlockedWeapons[item.weaponTreeKey];
            }
            
            return {
                ...item,
                key: shopItem.key,
                discount: effectiveDiscount,
                originalCost: item.baseCost,
                cost: discountedCost,
                isPurchased: isPurchased
            };
        }).filter(item => item !== null); // Filter out any null items
    }

    reset() {
        this.player = this.createPlayer();
        this.enemies = [];
        this.projectiles = [];
        this.allies = []; // Clear minions/allies when starting new game
        this.traps = []; // Clear deployed traps when starting new game
        this.frostZones = []; // Clear frost zones when starting new game
        this.currentFloor = 0;
        this.floorCleared = true;
        this.enemyHPMultiplier = 1;
        this.isPaused = false;
        this.gameStarted = false;
        this.gameCompleted = false;
        this.deathSequence = false;
        this.timeScale = 1;
        
        // Clear passive items state that might persist
        this.passiveItems = null;
        this.entropyReactorState = null;
        this.voltageLoopState = null;
        
        // Clear any other persistent state that might have been added
        this.thermalConverterState = null;
        this.wraithDriveState = null;
        this.nullBarrierState = null;
        this.fractalLensState = null;
        
        console.log('🔄 [GAME RESET] Cleared allies, traps, frost zones, passive items, and all persistent game state');
    }
}
