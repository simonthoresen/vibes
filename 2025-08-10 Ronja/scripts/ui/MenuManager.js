class MenuManager {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'title';
        this.screens = new Map();
        this.setupScreens();
        this.setupEventListeners();
    }

    setupScreens() {
        // Get all screens
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens.set(screen.id.replace('-screen', ''), screen);
        });
    }

    setupEventListeners() {
        // Title screen
        document.getElementById('start-button').addEventListener('click', () => {
            this.showScreen('character-select');
        });

        // Character selection
        const navLeft = document.querySelector('.nav-arrow.left');
        const navRight = document.querySelector('.nav-arrow.right');
        navLeft.addEventListener('click', () => this.game.characterSelect.previousCharacter());
        navRight.addEventListener('click', () => this.game.characterSelect.nextCharacter());

        document.getElementById('new-game').addEventListener('click', () => {
            const character = this.game.characterSelect.getCurrentCharacter();
            if (character) {
                this.game.startNewGame(character);
            }
        });

        document.getElementById('load-game').addEventListener('click', () => {
            const character = this.game.characterSelect.getCurrentCharacter();
            if (character && SaveSystem.hasSave(character.id)) {
                this.game.loadGame(character);
            }
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showScreen('title');
        });

        // Pause menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentScreen === 'game') {
                this.togglePauseMenu();
            }
        });

        document.getElementById('resume').addEventListener('click', () => {
            this.hidePauseMenu();
        });

        document.getElementById('save-game').addEventListener('click', () => {
            this.game.saveGame();
            this.hidePauseMenu();
        });

        document.getElementById('to-main-menu').addEventListener('click', () => {
            this.showScreen('title');
        });
    }

    showScreen(screenId) {
        // Hide all screens
        this.screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    togglePauseMenu() {
        const pauseMenu = this.screens.get('pause-menu');
        pauseMenu.classList.toggle('active');
    }

    hidePauseMenu() {
        const pauseMenu = this.screens.get('pause-menu');
        pauseMenu.classList.remove('active');
    }
}
