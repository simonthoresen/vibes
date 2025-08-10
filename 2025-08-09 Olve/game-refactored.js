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
    }

    setupUIEventHandlers() {
        // Pause/Resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });

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

    handleGameStart() {
        this.showDoorTransition(() => {
            this.hideMainMenu();
            this.weaponSystem.setupWeaponSelection(false);
        });
    }

    handleWeaponSelected(detail) {
        const { weapon, isBossReward } = detail;
        
        if (!isBossReward) {
            // Starting weapon selected - initialize game
            this.gameState.gameStarted = true;
            this.showGameContainer();
            this.gameLoop.start();
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
        if (!this.gameLoop.isRunning || this.isGameOverVisible()) {
            return;
        }

        if (this.gameState.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
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
    }

    resumeGame() {
        // Give brief invulnerability after unpausing
        this.gameState.player.invulnerable = true;
        this.gameState.player.lastHit = Date.now();
        
        this.gameState.isPaused = false;
        this.hidePauseMenu();
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
        this.showDoorTransition(() => {
            this.resetGameState();
            this.hideGameOverScreen();
            this.hideGameContainer();
            this.showMainMenu();
        });
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

    showMainMenu() { this.showElement('mainMenu'); }
    hideMainMenu() { this.hideElement('mainMenu'); }
    showGameContainer() { this.showElement('gameContainer'); }
    hideGameContainer() { this.hideElement('gameContainer'); }
    showPauseMenu() { this.showElement('pauseMenu'); }
    hidePauseMenu() { this.hideElement('pauseMenu'); }
    showGameOverElement() { this.showElement('gameOver'); }
    hideGameOverScreen() { this.hideElement('gameOver'); }

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
        content.style.cssText = `
            background-color: rgba(20, 20, 20, 0.95);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            min-width: 300px;
        `;

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

        // One-hit kill button
        const oneHitKillButton = this.createOneHitKillButton(buttonStyle);

        // Close button
        const closeButton = this.createCloseButton(buttonStyle, cheatMenu);

        content.appendChild(title);
        content.appendChild(weaponSection);
        content.appendChild(floorSection);
        content.appendChild(invincibilityButton);
        content.appendChild(unlockSkinsButton);
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

        const weapons = ['Piercing bow', 'Sword', 'Scythe', 'Dragon bow', 'Dragon sword'];
        
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
            invincibilityButton.textContent = this.gameState.player.permanentInvulnerability ? 'Permanent Invincibility: ON' : 'Toggle Permanent Invincibility';
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
            const skinsButton = document.querySelector('#mainMenu button:nth-child(4)');
            if (skinsButton) {
                skinsButton.textContent = 'Change Skin';
                skinsButton.style.opacity = '1';
            }
        };

        return unlockSkinsButton;
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
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
