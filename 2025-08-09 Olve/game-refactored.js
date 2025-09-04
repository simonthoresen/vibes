// Refactored Dungeon Crawler Game
// Import all modules
import { GameState } from './gameState.js';
import { InputManager } from './inputManager.js';
import { Renderer } from './renderer.js';
import { MenuManager } from './menuManager.js';
import { WeaponSystem } from './weaponSystem.js';
import { EnemySystem } from './enemySystem.js';
import { ProjectileSystem } from './projectileSystem.js';
import { PlayerController } from './playerController.js';
import { GameLoop } from './gameLoop.js';
import { ParticleEngine } from './particleEngine.js';
import { KONAMI_CODE, WEAPONS } from './constants.js';

class DungeonCrawlerGame {
    constructor() {
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Initialize core systems
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        // Default: show pause button unless user disables
        if (typeof this.gameState.settings.showPauseBtn === 'undefined') {
            this.gameState.settings.showPauseBtn = true;
        }
        
        // Initialize background audio
        this.backgroundAudio = null;
        this.gameplayMusic = null;
        this.initializeBackgroundAudio();
        this.initializeGameplayMusic();
        
        // Get canvas and initialize renderer
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Game canvas not found');
        }
        this.renderer = new Renderer(canvas);

        // Initialize game systems
        this.menuManager = new MenuManager(this.gameState);
        this.particleEngine = new ParticleEngine();
        this.weaponSystem = new WeaponSystem(this.gameState, this.particleEngine);
        this.enemySystem = new EnemySystem(this.gameState);
        this.projectileSystem = new ProjectileSystem(this.gameState, this.particleEngine);
        this.playerController = new PlayerController(this.gameState, this.inputManager);

        // Connect particle engine to systems that need it
        this.enemySystem.setParticleEngine(this.particleEngine);

        // Initialize game loop with all systems
        const systems = [
            this.playerController,
            this.weaponSystem,
            this.enemySystem,
            this.projectileSystem,
            this.particleEngine
        ];
        this.gameLoop = new GameLoop(this.gameState, systems, this.renderer);
    }

    initializeBackgroundAudio() {
        this.backgroundAudio = new Audio('sounds/cave-dripping-water.wav');
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = 1.0; // Set to 100% volume
    }

    initializeGameplayMusic() {
        this.gameplayMusic = new Audio('sounds/Banya-BeethovenVirusFullVersion.mp3');
        this.gameplayMusic.loop = true;
        this.gameplayMusic.volume = 0.5; // Set to 50% volume
    }

    startBackgroundAudio() {
        if (this.backgroundAudio && this.gameState.settings.menuSounds) {
            this.backgroundAudio.play().catch(error => {
                console.log('Background audio failed to play:', error);
            });
        }
    }

    stopBackgroundAudio() {
        if (this.backgroundAudio) {
            this.backgroundAudio.pause();
            this.backgroundAudio.currentTime = 0;
        }
    }

    startGameplayMusic() {
        if (this.gameplayMusic && this.gameState.settings.gameMusic) {
            this.gameplayMusic.play().catch(error => {
                console.log('Gameplay music failed to play:', error);
            });
        }
    }

    stopGameplayMusic() {
        if (this.gameplayMusic) {
            this.gameplayMusic.pause();
            this.gameplayMusic.currentTime = 0;
        }
    }

    setupEventListeners() {
        // Menu events
        document.addEventListener('game-start', () => this.handleGameStart());
        document.addEventListener('weapon-selected', (e) => this.handleWeaponSelected(e.detail));
        document.addEventListener('boss-defeated', () => this.handleBossDefeated());
        document.addEventListener('game-over', () => this.handleGameOver());
        document.addEventListener('game-completed', () => this.handleGameCompleted());

        // Input events
        document.addEventListener('input-keydown', (e) => this.handleKeyDown(e.detail));
        document.addEventListener('input-keyup', (e) => this.handleKeyUp(e.detail));

        // UI events
        this.setupUIEventHandlers();
        
        // Page visibility events for auto-pause
        this.setupPageVisibilityHandlers();
    }

    setupUIEventHandlers() {
        // Pause/Resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });

        // Pause button click
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.onclick = () => this.togglePause();
            console.log('Pause button click handler attached');
        } else {
            console.log('Pause button not found during setup');
        }

        // Settings toggle for pause button
        const showPauseBtnSetting = document.getElementById('showPauseBtnSetting');
        if (showPauseBtnSetting) {
            // Set initial state from gameState
            showPauseBtnSetting.checked = !!this.gameState.settings.showPauseBtn;
            showPauseBtnSetting.onchange = (e) => {
                this.gameState.settings.showPauseBtn = showPauseBtnSetting.checked;
                this.gameState.saveSettings();
                this.updatePauseBtnVisibility();
            };
        }

        // Settings toggle for scrollable cheat menu
        const scrollableCheatMenuSetting = document.getElementById('scrollableCheatMenuSetting');
        if (scrollableCheatMenuSetting) {
            // Set initial state from gameState
            scrollableCheatMenuSetting.checked = !!this.gameState.settings.scrollableCheatMenu;
            scrollableCheatMenuSetting.onchange = (e) => {
                this.gameState.settings.scrollableCheatMenu = scrollableCheatMenuSetting.checked;
                this.gameState.saveSettings();
            };
        }

        // Settings toggle for menu sounds
        const menuSoundsSetting = document.getElementById('menuSoundsSetting');
        if (menuSoundsSetting) {
            menuSoundsSetting.checked = !!this.gameState.settings.menuSounds;
            menuSoundsSetting.onchange = (e) => {
                this.gameState.settings.menuSounds = menuSoundsSetting.checked;
                this.gameState.saveSettings();
                // Immediately affect background audio if it's currently playing
                if (!this.gameState.settings.menuSounds && this.backgroundAudio && !this.backgroundAudio.paused) {
                    this.backgroundAudio.pause();
                } else if (this.gameState.settings.menuSounds && this.backgroundAudio && this.backgroundAudio.paused && 
                          (this.gameState.showMainMenu || this.isGameOverVisible())) {
                    this.backgroundAudio.play().catch(e => console.log('Could not resume background audio:', e));
                }
            };
        }

        // Settings toggle for game over sounds
        const gameOverSoundsSetting = document.getElementById('gameOverSoundsSetting');
        if (gameOverSoundsSetting) {
            gameOverSoundsSetting.checked = !!this.gameState.settings.gameOverSounds;
            gameOverSoundsSetting.onchange = (e) => {
                this.gameState.settings.gameOverSounds = gameOverSoundsSetting.checked;
                this.gameState.saveSettings();
                // Immediately affect background audio if we're on game over screen
                if (!this.gameState.settings.gameOverSounds && this.backgroundAudio && !this.backgroundAudio.paused && this.isGameOverVisible()) {
                    this.backgroundAudio.pause();
                } else if (this.gameState.settings.gameOverSounds && this.backgroundAudio && this.backgroundAudio.paused && this.isGameOverVisible()) {
                    this.backgroundAudio.play().catch(e => console.log('Could not resume background audio:', e));
                }
            };
        }

        // Settings toggle for game sounds
        const gameSoundsSetting = document.getElementById('gameSoundsSetting');
        if (gameSoundsSetting) {
            gameSoundsSetting.checked = !!this.gameState.settings.gameSounds;
            gameSoundsSetting.onchange = (e) => {
                this.gameState.settings.gameSounds = gameSoundsSetting.checked;
                this.gameState.saveSettings();
            };
        }

        // Settings toggle for game music
        const gameMusicSetting = document.getElementById('gameMusicSetting');
        if (gameMusicSetting) {
            gameMusicSetting.checked = !!this.gameState.settings.gameMusic;
            gameMusicSetting.onchange = (e) => {
                this.gameState.settings.gameMusic = gameMusicSetting.checked;
                this.gameState.saveSettings();
                // Immediately affect music playback
                if (!this.gameState.settings.gameMusic && this.gameplayMusic && !this.gameplayMusic.paused) {
                    this.gameplayMusic.pause();
                } else if (this.gameState.settings.gameMusic && this.gameplayMusic && this.gameplayMusic.paused && this.gameState.gameStarted && !this.gameState.showMainMenu) {
                    this.gameplayMusic.play().catch(e => console.log('Could not resume music:', e));
                }
            };
        }

        // Settings toggle for virtual joystick
        const virtualJoystickSetting = document.getElementById('virtualJoystickSetting');
        if (virtualJoystickSetting) {
            virtualJoystickSetting.checked = !!this.gameState.settings.virtualJoystick;
            console.log('Virtual joystick setting initialized:', this.gameState.settings.virtualJoystick);
            virtualJoystickSetting.onchange = (e) => {
                this.gameState.settings.virtualJoystick = virtualJoystickSetting.checked;
                this.gameState.saveSettings();
                console.log('Virtual joystick setting changed to:', virtualJoystickSetting.checked);
                this.updateVirtualJoystickVisibility();
            };
        } else {
            console.log('Virtual joystick setting element not found');
        }

        // Update pause button visibility on game start
        this.updatePauseBtnVisibility();
        
        // Update storage status indicator
        this.updateStorageStatus();

        // Initialize virtual joystick
        this.initializeVirtualJoystick();

        // Make methods available globally for HTML onclick handlers
        window.resumeGame = () => this.resumeGame();
        window.toggleSettings = () => this.toggleSettings();
        window.returnToMainMenu = () => this.quitToMenuImmediate();
        window.closeSettings = () => this.closeSettings();

        // Setup pause menu buttons (legacy approach using IDs)
        const resumeBtn = document.getElementById('resumeGame');
        const settingsBtn = document.getElementById('openSettings');
        const quitBtn = document.getElementById('quitToMenu');
        const cheatBtn = document.getElementById('cheatMenu');

        if (resumeBtn) resumeBtn.onclick = () => this.resumeGame();
        if (settingsBtn) settingsBtn.onclick = () => this.openSettings();
        if (quitBtn) quitBtn.onclick = () => this.quitToMenuImmediate();
        if (cheatBtn) cheatBtn.onclick = () => this.openCheatMenu();
    }

    setupPageVisibilityHandlers() {
        // Handle tab switching to auto-pause the game
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab became hidden - pause the game if it's running
                if (this.gameState.gameStarted && !this.gameState.isPaused && this.gameLoop && this.gameLoop.isRunning) {
                    this.pauseGame();
                }
            }
            // Note: We don't auto-resume when tab becomes visible - player must manually resume
        });

        // Also handle window blur/focus events as fallback for older browsers
        window.addEventListener('blur', () => {
            if (!document.hidden) { // Only if visibility API didn't trigger
                if (this.gameState.gameStarted && !this.gameState.isPaused && this.gameLoop && this.gameLoop.isRunning) {
                    this.pauseGame();
                }
            }
        });
    }

    handleGameStart() {
        this.showDoorTransition(() => {
            this.hideMainMenu();
            this.weaponSystem.setupWeaponSelection(false);
            this.updatePauseBtnVisibility();
        });
    }

    handleWeaponSelected(detail) {
        const { weapon, isBossReward } = detail;
        if (!isBossReward) {
            // Starting weapon selected - show zoom/fade effect, then start game
            const container = document.getElementById('weaponSelect');
            // Create overlay for zoom/fade
            let zoomFadeOverlay = document.getElementById('zoomFadeOverlay');
            if (!zoomFadeOverlay) {
                zoomFadeOverlay = document.createElement('div');
                zoomFadeOverlay.id = 'zoomFadeOverlay';
                zoomFadeOverlay.style.position = 'fixed';
                zoomFadeOverlay.style.top = '0';
                zoomFadeOverlay.style.left = '0';
                zoomFadeOverlay.style.width = '100vw';
                zoomFadeOverlay.style.height = '100vh';
                zoomFadeOverlay.style.background = "url('images/long_dark_corridor.png') center center / cover no-repeat";
                zoomFadeOverlay.style.zIndex = '3000';
                zoomFadeOverlay.style.transition = 'transform 1.2s, opacity 1.2s';
                zoomFadeOverlay.style.transform = 'scale(1)';
                zoomFadeOverlay.style.opacity = '0';
                document.body.appendChild(zoomFadeOverlay);
            }
            // Show overlay and animate zoom in
            setTimeout(() => {
                zoomFadeOverlay.style.opacity = '1';
                zoomFadeOverlay.style.transform = 'scale(1)';
                // Add a slight delay before zooming in
                setTimeout(() => {
                    zoomFadeOverlay.style.transform = 'scale(1)';
                    setTimeout(() => {
                        zoomFadeOverlay.style.transform = 'scale(2)';
                        setTimeout(() => {
                            // Fade in to black before playing sound and fading out into the game
                            zoomFadeOverlay.style.transition = 'background 0.6s, opacity 1.2s, transform 1.2s';
                            zoomFadeOverlay.style.background = '#000';
                            setTimeout(() => {
                                // Play start beep sound
                                const beep = new Audio('sounds/195912__acpascal__start-beep.wav');
                                beep.volume = 1.0;
                                beep.play().catch(() => {
                                    // Audio failed to play, skip sound and continue
                                    if (zoomFadeOverlay.parentNode) zoomFadeOverlay.parentNode.removeChild(zoomFadeOverlay);
                                    this.gameState.gameStarted = true;
                                    this.showGameContainer();
                                    this.updatePauseBtnVisibility();
                                    this.gameLoop.start();
                                });
                                beep.onended = () => {
                                    zoomFadeOverlay.style.opacity = '0';
                                    setTimeout(() => {
                                        if (zoomFadeOverlay.parentNode) zoomFadeOverlay.parentNode.removeChild(zoomFadeOverlay);
                                        this.gameState.gameStarted = true;
                                        this.showGameContainer();
                                        this.updatePauseBtnVisibility();
                                        this.gameLoop.start();
                                    }, 700);
                                };
                            }, 600); // Hold black for 600ms before playing sound
                        }, 900);
                    }, 350); // 350ms delay before zooming in
                }, 100);
            }, 100);
        } else {
            // Boss reward weapon - continue game
            this.gameLoop.start();
        }
    }

    handleBossDefeated() {
        this.gameLoop.stop();
        this.weaponSystem.setupWeaponSelection(true);
    }

    handleGameOver() {
        console.log('handleGameOver called');
        this.gameLoop.stop();
        this.showDeathSequence();
    }

    handleGameCompleted() {
        this.showCompletionScreen();
    }

    handleKeyDown(detail) {
        const { key } = detail;
        
        // Check for Konami code when paused
        if (this.gameState.isPaused && this.isPauseMenuVisible()) {
            if (this.inputManager.checkKonamiCode(key, KONAMI_CODE)) {
                this.hidePauseMenu();
                this.showCheatMenu();
            }
        }

        // Handle keybinding
        if (this.inputManager.listeningForKey) {
            if (key !== 'escape') {
                this.setKeybind(this.inputManager.listeningForKey, key);
            }
            this.inputManager.stopListeningForKey();
            this.updateKeybindDisplay();
        }
    }

    handleKeyUp(detail) {
        // Handle any key up events if needed
    }

    togglePause() {
        console.log('togglePause called - gameLoop.isRunning:', this.gameLoop.isRunning, 'gameOverVisible:', this.isGameOverVisible());
        if (!this.gameLoop.isRunning || this.isGameOverVisible()) {
            return;
        }

        if (this.gameState.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
        this.updatePauseBtnVisibility();
    }

    pauseGame() {
        if (!this.gameLoop.isRunning || this.isGameOverVisible()) return;
        
        // Move enemies away from player to prevent damage during pause
        this.pushEnemiesAwayFromPlayer();
        
        // Make player temporarily invulnerable
        this.gameState.player.invulnerable = true;
        this.gameState.player.lastHit = Date.now();
        
        this.gameState.isPaused = true;
        this.showPauseMenu();
        this.updatePauseBtnVisibility();
    }

    resumeGame() {
        // Give brief invulnerability after unpausing
        this.gameState.player.invulnerable = true;
        this.gameState.player.lastHit = Date.now();
        
        this.gameState.isPaused = false;
        this.hidePauseMenu();
        this.updatePauseBtnVisibility();
    }

    toggleSettings() {
        this.hidePauseMenu();
        this.showElement('settingsMenu');
    }

    closeSettings() {
        this.hideElement('settingsMenu');
        // Only show pause menu if we're in game, otherwise show main menu
        if (this.gameState.gameStarted) {
            this.showPauseMenu();
        } else {
            this.showMainMenu();
        }
    }

    quitToMainMenu() {
        this.showDoorTransition(() => {
            this.resetGameState();
            this.hideGameOverScreen();
            this.hidePauseMenu();
            this.hideGameContainer();
            this.showMainMenu();
        });
    }

    quitToMenuImmediate() {
        // Immediate quit from pause menu (no transition like the original)
        this.gameLoop.stop();
        this.hidePauseMenu();
        this.hideGameOverScreen();
        this.hideGameContainer();
        this.showMainMenu();
        
        // Reset game state
        this.gameState.reset();
        this.playerController.reset();
        this.projectileSystem.clear();
        this.particleEngine.clear();
        this.gameState.isPaused = false;
        this.gameState.gameStarted = false;
        this.gameState.gameCompleted = false;
    }

    pushEnemiesAwayFromPlayer() {
        const playerCenterX = this.gameState.player.x + this.gameState.player.width / 2;
        const playerCenterY = this.gameState.player.y + this.gameState.player.height / 2;
        
        this.gameState.enemies.forEach(enemy => {
            if (this.detectCollision(this.gameState.player, enemy)) {
                const dx = enemy.x + enemy.width / 2 - playerCenterX;
                const dy = enemy.y + enemy.height / 2 - playerCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist === 0) return;
                
                const pushDistance = enemy.width + this.gameState.player.width;
                enemy.x = playerCenterX + (dx / dist) * pushDistance - enemy.width / 2;
                enemy.y = playerCenterY + (dy / dist) * pushDistance - enemy.height / 2;
            }
        });
    }

    showDoorTransition(callback) {
        const doorTransition = document.querySelector('.door-transition');
        if (!doorTransition) {
            callback();
            return;
        }
        
        doorTransition.style.display = 'block';
        doorTransition.style.backgroundColor = 'transparent';
        doorTransition.offsetHeight; // Force reflow
        doorTransition.classList.add('active');
        
        setTimeout(() => {
            doorTransition.style.backgroundColor = 'black';
        }, 1700);
        
        setTimeout(() => {
            doorTransition.classList.remove('active');
            doorTransition.style.display = 'none';
            callback();
        }, 2200);
    }

    showDeathSequence() {
        console.log('showDeathSequence called');
        this.gameState.deathSequence = true;
        this.gameState.deathTime = Date.now();
        
        // Add red overlay effect
        const overlay = document.getElementById('deathOverlay');
        if (overlay) {
            console.log('Found deathOverlay, starting red effect');
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
            setTimeout(() => {
                overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
                
                setTimeout(() => {
                    overlay.style.backgroundColor = 'transparent';
                    console.log('About to call showGameOverScreen');
                    this.showGameOverScreen();
                }, 400);
            }, 100);
        } else {
            // Fallback if overlay doesn't exist
            console.log('No deathOverlay found, using fallback');
            setTimeout(() => this.showGameOverScreen(), 500);
        }
    }

    showGameOverScreen() {
        console.log('showGameOverScreen called');
        const gameOver = document.getElementById('gameOver');
        const floorsCleared = document.getElementById('floorsCleared');
        
        console.log('gameOver element:', gameOver);
        console.log('floorsCleared element:', floorsCleared);
        
        if (floorsCleared) {
            floorsCleared.textContent = this.gameState.currentFloor;
        }
        
        if (gameOver) {
            console.log('Setting gameOver display to flex');
            gameOver.style.display = 'flex';
            setTimeout(() => {
                console.log('Adding visible class to gameOver');
                gameOver.classList.add('visible');
            }, 100);
        }

        this.setupGameOverButtons();
        if (this.gameState.settings.gameOverSounds) {
            this.startBackgroundAudio(); // Start background audio for game over screen
        }
        this.stopGameplayMusic(); // Stop gameplay music for game over screen
    }

    setupGameOverButtons() {
        const tryAgainBtn = document.getElementById('tryAgain');
        const quitToMenuBtn = document.getElementById('quitToMenu');

        if (tryAgainBtn) {
            tryAgainBtn.onclick = () => this.restartGame();
        }

        if (quitToMenuBtn) {
            quitToMenuBtn.onclick = () => this.quitToMainMenu();
        }
    }

    restartGame() {
        this.showDoorTransition(() => {
            this.resetGameState();
            this.hideGameOverScreen();
            this.weaponSystem.setupWeaponSelection(false);
        });
    }

    quitToMainMenu() {
        // Create custom zoom-out transition with game-over-background.png
        const customTransition = document.createElement('div');
        customTransition.style.position = 'fixed';
        customTransition.style.top = '0';
        customTransition.style.left = '0';
        customTransition.style.width = '100%';
        customTransition.style.height = '100%';
        customTransition.style.background = 'url("images/game-over-background.png") center/cover no-repeat';
        customTransition.style.zIndex = '2002';
        customTransition.style.transform = 'scale(1)';
        customTransition.style.transition = 'transform 1.5s ease';
        document.body.appendChild(customTransition);
        
        // Create black overlay for fade effect
        const blackOverlay = document.createElement('div');
        blackOverlay.style.position = 'fixed';
        blackOverlay.style.top = '0';
        blackOverlay.style.left = '0';
        blackOverlay.style.width = '100%';
        blackOverlay.style.height = '100%';
        blackOverlay.style.backgroundColor = 'black';
        blackOverlay.style.opacity = '0';
        blackOverlay.style.zIndex = '2003';
        blackOverlay.style.transition = 'opacity 0.8s ease';
        document.body.appendChild(blackOverlay);
        
        // Start both zoom out and fade to black immediately
        customTransition.offsetHeight;
        requestAnimationFrame(() => {
            customTransition.style.transform = 'scale(0.1)'; // 1.5s duration
            blackOverlay.style.opacity = '1'; // 0.8s duration
        });
        
        // At 0.8s when screen is fully black, hide game over screen and reset game state
        setTimeout(() => {
            this.hideGameOverScreen();
            this.resetGameState();
            this.hideGameContainer();
            this.showMainMenu();
        }, 800);
        
        // Complete transition and cleanup at 1.5s, then fade out black to reveal main menu
        setTimeout(() => {
            document.body.removeChild(customTransition);
            
            // Start fading out the black overlay to reveal the main menu
            blackOverlay.style.transition = 'opacity 0.7s ease';
            blackOverlay.style.opacity = '0';
            
            // Remove black overlay after fade completes
            setTimeout(() => {
                document.body.removeChild(blackOverlay);
            }, 700);
        }, 1500);
    }

    resetGameState() {
        this.gameLoop.stop();
        this.gameState.reset();
        this.playerController.reset();
        this.projectileSystem.clear();
        this.particleEngine.clear();
    }

    showCompletionScreen() {
        // Implementation for game completion screen
        console.log('Game completed! Showing completion screen...');
    }

    // Utility methods for UI management
    detectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    setKeybind(action, key) {
        this.gameState.settings.keybinds[action] = key.toLowerCase();
        this.gameState.saveSettings();
    }

    updateKeybindDisplay() {
        document.querySelectorAll('.keybind-button').forEach(button => {
            const action = button.dataset.action;
            if (action && this.gameState.settings.keybinds[action]) {
                button.textContent = this.gameState.settings.keybinds[action].toUpperCase();
            }
        });
    }

    // UI visibility helpers
    showElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'flex';
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    showMainMenu() { 
        this.showElement('mainMenu'); 
        this.startBackgroundAudio();
    }
    hideMainMenu() { 
        this.hideElement('mainMenu'); 
        this.stopBackgroundAudio();
    }
    showGameContainer() { 
        this.showElement('gameContainer'); 
        this.updatePauseBtnVisibility();
        this.updateVirtualJoystickVisibility();
        this.stopBackgroundAudio(); // Stop background audio when game starts
        this.startGameplayMusic(); // Start gameplay music
    }
    hideGameContainer() { 
        this.hideElement('gameContainer'); 
        this.updatePauseBtnVisibility(); 
        this.updateVirtualJoystickVisibility();
        this.stopGameplayMusic(); 
    }
    showPauseMenu() { 
        this.showElement('pauseMenu'); 
        this.updateVirtualJoystickVisibility();
    }
    hidePauseMenu() { 
        this.hideElement('pauseMenu'); 
        this.updateVirtualJoystickVisibility();
    }
    showGameOverElement() { this.showElement('gameOver'); }
    hideGameOverScreen() { 
        this.hideElement('gameOver'); 
        this.stopBackgroundAudio();
    }

    updatePauseBtnVisibility() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (!pauseBtn) {
            console.log('Pause button not found');
            return;
        }
        console.log('Updating pause button visibility - gameStarted:', this.gameState.gameStarted, 'isPaused:', this.gameState.isPaused, 'showPauseBtn:', this.gameState.settings.showPauseBtn);
        // Only show if enabled in settings and game is running
        if (this.gameState.settings.showPauseBtn && this.gameState.gameStarted && !this.gameState.isPaused) {
            pauseBtn.style.display = 'block';
            console.log('Showing pause button');
        } else {
            pauseBtn.style.display = 'none';
            console.log('Hiding pause button');
        }
    }

    updateStorageStatus() {
        const statusElement = document.getElementById('storageStatus');
        if (statusElement) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (this.gameState.storageAvailable) {
                statusElement.textContent = 'Storage Status: Settings will be saved';
                statusElement.style.color = '#4CAF50'; // Green
            } else {
                if (isIOS) {
                    statusElement.textContent = 'Storage Status: Disabled (Try turning off Private Browsing)';
                } else {
                    statusElement.textContent = 'Storage Status: Settings will not persist (Private browsing?)';
                }
                statusElement.style.color = '#ff9800'; // Orange warning
            }
        }
    }

    initializeVirtualJoystick() {
        this.joystickState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };

        const joystickBase = document.querySelector('.joystick-base');
        const joystickKnob = document.getElementById('joystickKnob');

        if (joystickBase && joystickKnob) {
            console.log('Initializing joystick event handlers');
            
            // Touch events for mobile
            joystickBase.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('Touch start on joystick');
                const touch = e.touches[0];
                const rect = joystickBase.getBoundingClientRect();
                this.joystickState.active = true;
                this.joystickState.startX = rect.left + rect.width / 2;
                this.joystickState.startY = rect.top + rect.height / 2;
                this.updateJoystick(touch.clientX, touch.clientY);
            });

            document.addEventListener('touchmove', (e) => {
                if (this.joystickState.active) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.updateJoystick(touch.clientX, touch.clientY);
                }
            });

            document.addEventListener('touchend', (e) => {
                if (this.joystickState.active) {
                    console.log('Touch end on joystick');
                    this.joystickState.active = false;
                    this.resetJoystick();
                }
            });

            // Mouse events for desktop testing
            joystickBase.addEventListener('mousedown', (e) => {
                e.preventDefault();
                console.log('Mouse down on joystick');
                const rect = joystickBase.getBoundingClientRect();
                this.joystickState.active = true;
                this.joystickState.startX = rect.left + rect.width / 2;
                this.joystickState.startY = rect.top + rect.height / 2;
                this.updateJoystick(e.clientX, e.clientY);
            });

            document.addEventListener('mousemove', (e) => {
                if (this.joystickState.active) {
                    e.preventDefault();
                    this.updateJoystick(e.clientX, e.clientY);
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (this.joystickState.active) {
                    console.log('Mouse up on joystick');
                    this.joystickState.active = false;
                    this.resetJoystick();
                }
            });
        } else {
            console.log('Joystick elements not found:', { joystickBase, joystickKnob });
        }

        this.updateVirtualJoystickVisibility();
    }

    updateJoystick(clientX, clientY) {
        const maxDistance = 30; // Half of base radius (50px) minus knob radius (20px)
        
        console.log('Updating joystick position:', { clientX, clientY });
        
        this.joystickState.currentX = clientX;
        this.joystickState.currentY = clientY;
        
        let deltaX = clientX - this.joystickState.startX;
        let deltaY = clientY - this.joystickState.startY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }
        
        this.joystickState.deltaX = deltaX / maxDistance;
        this.joystickState.deltaY = deltaY / maxDistance;
        
        console.log('Joystick delta:', { 
            deltaX: this.joystickState.deltaX, 
            deltaY: this.joystickState.deltaY 
        });
        
        // Pass virtual input to inputManager
        if (this.inputManager) {
            this.inputManager.setVirtualInput(this.joystickState.deltaX, this.joystickState.deltaY);
        } else {
            console.log('InputManager not available');
        }
        
        const knob = document.getElementById('joystickKnob');
        if (knob) {
            knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        } else {
            console.log('Joystick knob not found');
        }
    }

    resetJoystick() {
        this.joystickState.deltaX = 0;
        this.joystickState.deltaY = 0;
        
        // Reset virtual input in inputManager
        if (this.inputManager) {
            this.inputManager.setVirtualInput(0, 0);
        }
        
        const knob = document.getElementById('joystickKnob');
        if (knob) {
            knob.style.transform = 'translate(-50%, -50%)';
        }
    }

    updateVirtualJoystickVisibility() {
        const joystick = document.getElementById('virtualJoystick');
        if (joystick) {
            // For debugging - show on all devices when enabled
            const shouldShow = this.gameState.settings.virtualJoystick && this.gameState.gameStarted && !this.gameState.isPaused;
            
            console.log('Virtual joystick visibility check:', {
                virtualJoystickSetting: this.gameState.settings.virtualJoystick,
                gameStarted: this.gameState.gameStarted,
                isPaused: this.gameState.isPaused,
                shouldShow: shouldShow
            });
            
            if (shouldShow) {
                joystick.style.display = 'block';
                joystick.classList.add('mobile-enabled');
                console.log('Showing virtual joystick');
            } else {
                joystick.style.display = 'none';
                joystick.classList.remove('mobile-enabled');
                console.log('Hiding virtual joystick');
            }
        } else {
            console.log('Virtual joystick element not found');
        }
    }

    isPauseMenuVisible() {
        const menu = document.getElementById('pauseMenu');
        return menu && menu.style.display === 'flex';
    }

    isGameOverVisible() {
        const screen = document.getElementById('gameOver');
        return screen && screen.style.display === 'flex';
    }

    showCheatMenu() {
        const cheatMenu = document.createElement('div');
        cheatMenu.id = 'cheatMenu';
        cheatMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const content = document.createElement('div');
        
        // Check if scrollable mode is enabled
        if (this.gameState.settings.scrollableCheatMenu) {
            content.style.cssText = `
                background-color: rgba(20, 20, 20, 0.95);
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                overflow-x: hidden;
                width: 400px;
            `;
        } else {
            content.style.cssText = `
                background-color: rgba(20, 20, 20, 0.95);
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                min-width: 300px;
            `;
        }

        const title = document.createElement('h1');
        title.textContent = 'Cheat Menu';
        title.style.cssText = `
            color: #ff0000;
            font-size: 36px;
            margin: 0 0 30px 0;
            text-shadow: 0 0 10px #ff0000;
        `;

        const buttonStyle = `
            background-color: #333;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            margin: 10px 0;
            width: 100%;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        // Weapon selection section
        const weaponSection = this.createWeaponSection(buttonStyle);
        
        // Floor selection section
        const floorSection = this.createFloorSection(buttonStyle);

        // Invincibility button
        const invincibilityButton = this.createInvincibilityButton(buttonStyle);

        // Unlock skins button
        const unlockSkinsButton = this.createUnlockSkinsButton(buttonStyle);

        // Re-lock skins button
        const relockSkinsButton = this.createRelockSkinsButton(buttonStyle);

        // One-hit kill button
        const oneHitKillButton = this.createOneHitKillButton(buttonStyle);

        // Close button
        const closeButton = this.createCloseButton(buttonStyle, cheatMenu);

        content.appendChild(title);
        content.appendChild(weaponSection);
        content.appendChild(floorSection);
        content.appendChild(invincibilityButton);
        content.appendChild(unlockSkinsButton);
        content.appendChild(relockSkinsButton);
        content.appendChild(oneHitKillButton);
        content.appendChild(closeButton);
        cheatMenu.appendChild(content);
        document.body.appendChild(cheatMenu);
    }

    createWeaponSection(buttonStyle) {
        const weaponSection = document.createElement('div');
        weaponSection.style.cssText = 'margin: 20px 0; text-align: left;';
        
        const weaponTitle = document.createElement('h3');
        weaponTitle.textContent = 'Weapon Selection';
        weaponTitle.style.cssText = 'color: white; margin-bottom: 10px;';
        weaponSection.appendChild(weaponTitle);

        const weapons = ['Sword', 'Scythe', 'Dragon Bow', 'Dragon Sword', 'Dragon Scythe', 'Nature Scythe', 'Crystal Scythe'];
        
        // Add amount selector
        const amountControl = document.createElement('div');
        amountControl.style.cssText = 'margin-bottom: 20px; display: flex; align-items: center;';
        
        const amountLabel = document.createElement('label');
        amountLabel.textContent = 'Stack amount: ';
        amountLabel.style.color = 'white';
        amountLabel.style.marginRight = '10px';
        
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.min = '1';
        amountInput.max = '5';
        amountInput.value = '1';
        amountInput.style.cssText = 'width: 60px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
        
        amountControl.appendChild(amountLabel);
        amountControl.appendChild(amountInput);
        weaponSection.appendChild(amountControl);

        weapons.forEach(weapon => {
            const weaponControl = document.createElement('div');
            weaponControl.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = weapon.replace(/\s+/g, '') + 'Check';
            const weaponKey = weapon.replace(/\s+/g, '_').toUpperCase();
            checkbox.checked = this.gameState.player.weapons.some(w => w.id === weaponKey);
            checkbox.style.marginRight = '10px';
            
            const label = document.createElement('label');
            label.htmlFor = weapon.replace(/\s+/g, '') + 'Check';
            label.textContent = weapon;
            label.style.color = 'white';
            
            weaponControl.appendChild(checkbox);
            weaponControl.appendChild(label);
            weaponSection.appendChild(weaponControl);
        });

        // Create confirm button
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm Weapons';
        confirmButton.style.cssText = buttonStyle + 'margin-top: 20px;';
        
        this.addButtonHoverEffect(confirmButton);
        
        confirmButton.onclick = () => {
            this.gameState.player.cheatsEnabled = true;
            this.gameState.player.weapons = [];
            
            // Add selected weapons with their stack amounts
            weapons.forEach(weapon => {
                const checkbox = document.getElementById(weapon.replace(/\s+/g, '') + 'Check');
                if (checkbox.checked) {
                    const amount = parseInt(amountInput.value);
                    for (let i = 0; i < amount; i++) {
                        const weaponKey = weapon.replace(/\s+/g, '_').toUpperCase();
                        // Use the WEAPONS constant directly instead of async import
                        const weaponData = {...WEAPONS[weaponKey]};
                        weaponData.id = weaponKey;
                        this.gameState.player.weapons.push(weaponData);
                    }
                }
            });
            
            // Visual feedback
            confirmButton.style.backgroundColor = '#2a5';
            confirmButton.textContent = 'Weapons Updated!';
            setTimeout(() => {
                if (!confirmButton.matches(':hover')) {
                    confirmButton.style.backgroundColor = '#333';
                }
                confirmButton.textContent = 'Confirm Weapons';
            }, 1000);
        };

        weaponSection.appendChild(confirmButton);
        return weaponSection;
    }

    createFloorSection(buttonStyle) {
        const floorSection = document.createElement('div');
        floorSection.style.cssText = 'margin: 20px 0; text-align: left;';
        
        const floorTitle = document.createElement('h3');
        floorTitle.textContent = 'Floor Selection';
        floorTitle.style.cssText = 'color: white; margin-bottom: 10px;';
        floorSection.appendChild(floorTitle);

        const floorControl = document.createElement('div');
        floorControl.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const floorInput = document.createElement('input');
        floorInput.type = 'number';
        floorInput.min = '1';
        floorInput.value = this.gameState.currentFloor || 1;
        floorInput.style.cssText = 'width: 80px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
        
        const setFloorBtn = document.createElement('button');
        setFloorBtn.textContent = 'Set Floor';
        setFloorBtn.style.cssText = buttonStyle + 'width: auto; margin: 0;';
        
        this.addButtonHoverEffect(setFloorBtn);
        
        setFloorBtn.onclick = () => {
            this.gameState.player.cheatsEnabled = true;
            const newFloor = parseInt(floorInput.value);
            this.gameState.currentFloor = newFloor;
            this.gameState.floorCleared = true;
            if (newFloor >= 100) {
                this.gameState.player.skinsUnlocked = true;
            }
            
            // Visual feedback
            setFloorBtn.style.backgroundColor = '#2a5';
            setFloorBtn.textContent = 'Floor Set!';
            setTimeout(() => {
                if (!setFloorBtn.matches(':hover')) {
                    setFloorBtn.style.backgroundColor = '#333';
                }
                setFloorBtn.textContent = 'Set Floor';
            }, 1000);
        };
        
        floorControl.appendChild(floorInput);
        floorControl.appendChild(setFloorBtn);
        floorSection.appendChild(floorControl);
        return floorSection;
    }

    createInvincibilityButton(buttonStyle) {
        const invincibilityButton = document.createElement('button');
        invincibilityButton.textContent = 'Toggle Permanent Invincibility';
        invincibilityButton.style.cssText = buttonStyle;
        
        this.addButtonHoverEffect(invincibilityButton);
        
        invincibilityButton.onclick = () => {
            this.gameState.player.cheatsEnabled = true;
            this.gameState.player.permanentInvulnerability = !this.gameState.player.permanentInvulnerability;
            this.gameState.player.invulnerable = this.gameState.player.permanentInvulnerability;
            invincibilityButton.style.backgroundColor = this.gameState.player.permanentInvulnerability ? '#2a5' : '#333';
            invincibilityButton.textContent = this.gameState.player.permanentInvulnerabilities ? 'Permanent Invincibility: ON' : 'Toggle Permanent Invincibility';
        };

        return invincibilityButton;
    }

    createUnlockSkinsButton(buttonStyle) {
        const unlockSkinsButton = document.createElement('button');
        unlockSkinsButton.textContent = 'Unlock All Skins';
        unlockSkinsButton.style.cssText = buttonStyle;
        
        this.addButtonHoverEffect(unlockSkinsButton);
        
        unlockSkinsButton.onclick = () => {
            this.gameLoop.stop();
            
            this.gameState.player.cheatsEnabled = true;
            this.gameState.player.skinsUnlocked = true;
            localStorage.setItem('skinsUnlocked', 'true');
            unlockSkinsButton.style.backgroundColor = '#2a5';
            unlockSkinsButton.textContent = 'All Skins Unlocked!';
            
            // Update skins button in main menu if it exists
            if (this.menuManager) {
                this.menuManager.updateSkinsButton();
            }
        };

        return unlockSkinsButton;
    }

    createRelockSkinsButton(buttonStyle) {
        const relockSkinsButton = document.createElement('button');
        relockSkinsButton.textContent = 'Re-lock Skins';
        relockSkinsButton.style.cssText = buttonStyle;
        
        this.addButtonHoverEffect(relockSkinsButton);
        
        relockSkinsButton.onclick = () => {
            this.gameState.player.cheatsEnabled = true;
            this.gameState.player.skinsUnlocked = false;
            localStorage.setItem('skinsUnlocked', 'false');
            relockSkinsButton.style.backgroundColor = '#2a5';
            relockSkinsButton.textContent = 'Skins Re-locked!';
            
            // Update skins button in main menu if it exists
            if (this.menuManager) {
                this.menuManager.updateSkinsButton();
            }
            
            // Visual feedback timeout
            setTimeout(() => {
                if (!relockSkinsButton.matches(':hover')) {
                    relockSkinsButton.style.backgroundColor = '#333';
                }
                relockSkinsButton.textContent = 'Re-lock Skins';
            }, 1000);
        };

        return relockSkinsButton;
    }

    createOneHitKillButton(buttonStyle) {
        const oneHitKillButton = document.createElement('button');
        oneHitKillButton.textContent = 'Toggle One-Hit Kill';
        oneHitKillButton.style.cssText = buttonStyle;
        
        this.addButtonHoverEffect(oneHitKillButton);
        
        oneHitKillButton.onclick = () => {
            this.gameState.player.cheatsEnabled = true;
            this.gameState.player.oneHitKill = !this.gameState.player.oneHitKill;
            oneHitKillButton.style.backgroundColor = this.gameState.player.oneHitKill ? '#2a5' : '#333';
            oneHitKillButton.textContent = this.gameState.player.oneHitKill ? 'One-Hit Kill: ON' : 'Toggle One-Hit Kill';
        };

        return oneHitKillButton;
    }

    createCloseButton(buttonStyle, cheatMenu) {
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = buttonStyle;
        
        this.addButtonHoverEffect(closeButton);
        
        closeButton.onclick = () => {
            document.body.removeChild(cheatMenu);
            this.showPauseMenu();
        };

        return closeButton;
    }

    addButtonHoverEffect(button) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = '#2a5';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            if (!button.textContent.includes('ON') && !button.textContent.includes('Updated') && !button.textContent.includes('Set!') && !button.textContent.includes('Unlocked')) {
                button.style.backgroundColor = '#333';
            }
        });
    }

    // Additional placeholder methods for features that may need implementation
    openCheatMenu() {
        this.showCheatMenu();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new DungeonCrawlerGame();
        console.log('Dungeon Crawler Game initialized successfully!');
        
        // Make game instance available globally for debugging
        window.game = game;
        
        // Start background audio for initial main menu
        game.startBackgroundAudio();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});

// When spawning or updating enemies, scale their speed by gameState.enemyHPMultiplier
// Example for enemy creation:
// ...existing code...
    // When setting enemy speed:
    // enemy.speed = baseSpeed * this.gameState.enemyHPMultiplier;
// ...existing code...
// If you have a function or loop where you set enemy.health *= this.gameState.enemyHPMultiplier;
// Add:
// enemy.speed *= this.gameState.enemyHPMultiplier;
// ...existing code...
