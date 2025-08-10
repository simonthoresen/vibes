export class MenuManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.setupMainMenu();
        this.setupSkinMenu();
        this.setupPauseMenu();
        this.setupSettingsMenu();
    }

    setupMainMenu() {
        const mainMenu = document.createElement('div');
        mainMenu.id = 'mainMenu';
        mainMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('images/dungeon-door.png') center/cover no-repeat;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const content = this.createMenuContent();
        const title = this.createTitle('Dungeon Crawler');
        
        const startButton = this.createButton('Start Game', () => this.startGame(), true);
        const settingsButton = this.createButton('Settings', () => this.showSettings());
        const skinsButton = this.createSkinsButton();

        content.appendChild(title);
        content.appendChild(startButton);
        content.appendChild(settingsButton);
        content.appendChild(skinsButton);
        
        mainMenu.appendChild(content);
        document.body.appendChild(mainMenu);
    }

    setupSkinMenu() {
        const skinMenu = document.createElement('div');
        skinMenu.id = 'skinMenu';
        skinMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: default !important;
        `;

        const content = this.createMenuContent();
        const title = this.createTitle('Select Skin');
        const skinsGrid = this.createSkinsGrid();
        const backButton = this.createButton('Back', () => this.hideSkinMenu());

        content.appendChild(title);
        content.appendChild(skinsGrid);
        content.appendChild(backButton);
        skinMenu.appendChild(content);
        document.body.appendChild(skinMenu);
    }

    setupPauseMenu() {
        // Pause menu is likely already in HTML, just need to handle its logic
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            // Setup pause menu event handlers if needed
        }
    }

    setupSettingsMenu() {
        // Settings menu is likely already in HTML, just need to handle its logic
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) {
            // Setup settings menu event handlers if needed
        }
    }

    createMenuContent() {
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 40px;
            text-align: center;
            min-width: 300px;
        `;
        return content;
    }

    createTitle(text) {
        const title = document.createElement('h1');
        title.textContent = text;
        title.style.cssText = `
            color: white;
            font-size: 48px;
            margin: 0 0 30px 0;
            text-shadow: 0 0 10px #fff;
        `;
        return title;
    }

    createButton(text, onClick, isStart = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
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
        
        button.onclick = onClick;
        this.addButtonHoverEffects(button, isStart);
        return button;
    }

    createSkinsButton() {
        const skinsButton = this.createButton(
            this.gameState.player.skinsUnlocked ? 'Change Skin' : 'Skins (Unlock at Floor 100)',
            () => {
                if (this.gameState.player.skinsUnlocked) {
                    this.showSkinMenu();
                }
            }
        );

        if (!this.gameState.player.skinsUnlocked) {
            skinsButton.style.opacity = '0.5';
            skinsButton.style.cursor = 'not-allowed';
        }

        return skinsButton;
    }

    createSkinsGrid() {
        const skinsGrid = document.createElement('div');
        skinsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        `;

        // Import PLAYER_SKINS from constants
        import('./constants.js').then(({ PLAYER_SKINS }) => {
            PLAYER_SKINS.forEach(skin => {
                const skinContainer = this.createSkinOption(skin);
                skinsGrid.appendChild(skinContainer);
            });
        });

        return skinsGrid;
    }

    createSkinOption(skin) {
        const skinOption = document.createElement('div');
        skinOption.style.cssText = `
            background-color: ${skin.color};
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin: 10px auto;
            transition: transform 0.3s ease;
            border: 3px solid ${skin === this.gameState.player.skin ? '#fff' : 'transparent'};
            cursor: pointer;
        `;

        skinOption.onclick = () => this.selectSkin(skin, skinOption);
        this.addSkinHoverEffects(skinOption);

        const skinName = document.createElement('div');
        skinName.textContent = skin.name;
        skinName.style.cssText = `
            color: white;
            margin-top: 5px;
            font-size: 14px;
        `;

        const skinContainer = document.createElement('div');
        skinContainer.appendChild(skinOption);
        skinContainer.appendChild(skinName);
        return skinContainer;
    }

    addButtonHoverEffects(button, isStart = false) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = isStart ? '#4CAF50' : '#444';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = '#333';
        });
    }

    addSkinHoverEffects(skinOption) {
        skinOption.addEventListener('mouseenter', () => {
            skinOption.style.transform = 'scale(1.1)';
        });
        
        skinOption.addEventListener('mouseleave', () => {
            skinOption.style.transform = 'scale(1)';
        });
    }

    selectSkin(skin, skinOption) {
        this.gameState.player.skin = skin;
        
        // Update visual selection
        document.querySelectorAll('#skinMenu .skin-option').forEach(opt => {
            opt.style.border = '3px solid transparent';
        });
        skinOption.style.border = '3px solid #fff';
    }

    startGame() {
        this.hideMainMenu();
        this.dispatchEvent('game-start');
    }

    showSettings() {
        this.hideMainMenu();
        this.showElement('settingsMenu');
    }

    showSkinMenu() {
        this.hideMainMenu();
        this.showElement('skinMenu');
    }

    hideSkinMenu() {
        this.hideElement('skinMenu');
        this.showMainMenu();
    }

    showMainMenu() {
        this.showElement('mainMenu');
    }

    hideMainMenu() {
        this.hideElement('mainMenu');
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'flex';
        }
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}
