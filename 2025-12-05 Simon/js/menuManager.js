// Menu Manager
class MenuManager {
    constructor(game) {
        this.game = game;
        this.setupMenuHandlers();
    }

    setupMenuHandlers() {
        // Main Menu
        document.getElementById('hostGameBtn').addEventListener('click', () => {
            this.showMenu('hostGameMenu');
        });

        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.showMenu('joinGameMenu');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showMenu('settingsMenu');
            this.renderSettings();
        });

        // Host Game Menu
        document.getElementById('createGameBtn').addEventListener('click', () => {
            const size = parseInt(document.getElementById('islandSize').value);
            const seed = document.getElementById('seedInput').value || null;
            const maxPlayers = parseInt(document.getElementById('maxPlayers').value);

            this.game.createGame(size, seed, maxPlayers);
        });

        // Join Game Menu
        document.getElementById('connectBtn').addEventListener('click', () => {
            const host = document.getElementById('hostInput').value;
            const name = document.getElementById('playerName').value || 'Player';

            this.game.joinGame(host, name);
        });

        // Back Buttons
        document.querySelectorAll('#backBtn, #backBtn2, #backBtn3').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showMenu('mainMenu');
            });
        });

        // Pause Menu
        document.getElementById('resumeBtn').addEventListener('click', () => {
            document.getElementById('pauseMenu').classList.remove('active');
            document.getElementById('menuContainer').classList.add('hidden');
            this.game.isGameRunning = true;
        });

        document.getElementById('pauseSettingsBtn').addEventListener('click', () => {
            this.showMenu('settingsMenu');
            this.renderSettings();
        });

        document.getElementById('quitToMenuBtn').addEventListener('click', () => {
            this.game.quitGame();
            this.showMenu('mainMenu');
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            window.close();
        });
    }

    showMenu(menuId) {
        console.log(`[MENU] Showing menu: ${menuId}`);
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.remove('active');
        });
        const menuElement = document.getElementById(menuId);
        if (!menuElement) {
            console.error(`[MENU] Menu element not found: ${menuId}`);
            return;
        }
        menuElement.classList.add('active');

        if (menuId === 'mainMenu') {
            console.log('[MENU] Unhiding menu container');
            document.getElementById('menuContainer').classList.remove('hidden');
        }
        console.log(`[MENU] ✓ Menu shown: ${menuId}`);
    }

    renderSettings() {
        const settingsContent = document.getElementById('settingsContent');
        settingsContent.innerHTML = `
            <label>Graphics Quality:</label>
            <select id="graphicsQuality">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
            </select>

            <label>Master Volume:</label>
            <input type="range" id="masterVolume" min="0" max="1" step="0.1" value="1">

            <label>Mouse Sensitivity:</label>
            <input type="range" id="mouseSensitivity" min="0.1" max="5" step="0.1" value="1">

            <button class="menu-btn" id="resetControlsBtn">Reset Controls to Defaults</button>
        `;

        document.getElementById('graphicsQuality').addEventListener('change', (e) => {
            settingsManager.setGraphicsQuality(e.target.value);
        });

        document.getElementById('masterVolume').addEventListener('change', (e) => {
            settingsManager.setSetting('masterVolume', parseFloat(e.target.value));
        });

        document.getElementById('mouseSensitivity').addEventListener('change', (e) => {
            settingsManager.setSetting('mouseSensitivity', parseFloat(e.target.value));
        });

        document.getElementById('resetControlsBtn').addEventListener('click', () => {
            inputManager.resetKeybinds();
            alert('Controls reset to defaults');
        });
    }

    hideMenus() {
        document.getElementById('menuContainer').classList.add('hidden');
    }
}
