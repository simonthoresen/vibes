class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.menuManager = new MenuManager(this);
        this.characterSelect = new CharacterSelect();
        this.inputSystem = new InputSystem();
        this.currentCharacter = null;
        this.isRunning = false;
        this.camera = { x: 0, y: 0 };

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        requestAnimationFrame(() => this.gameLoop());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startNewGame(characterData) {
        this.currentCharacter = new Character(characterData);
        this.isRunning = true;
        this.menuManager.showScreen('game');
    }

    loadGame(characterData) {
        const saveData = SaveSystem.load(characterData.id);
        if (!saveData) return;

        this.currentCharacter = new Character(characterData);
        this.currentCharacter.position = saveData.position;
        this.isRunning = true;
        this.menuManager.showScreen('game');
    }

    saveGame() {
        if (!this.currentCharacter) return;

        SaveSystem.save(this.currentCharacter.id, {
            position: { ...this.currentCharacter.position },
            // Add other game state data here
        });
    }

    update() {
        if (!this.isRunning || !this.currentCharacter) return;

        // Update character
        this.currentCharacter.update(this.inputSystem);

        // Update camera to follow character
        const targetX = this.currentCharacter.position.x - this.canvas.width / 2;
        const targetY = this.currentCharacter.position.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * Config.CAMERA_LERP;
        this.camera.y += (targetY - this.camera.y) * Config.CAMERA_LERP;

        // Clamp camera to world bounds
        const bounds = this.currentCharacter.getWorldBounds();
        this.camera.x = Math.max(bounds.left, Math.min(bounds.right - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(bounds.top, Math.min(bounds.bottom - this.canvas.height, this.camera.y));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.isRunning || !this.currentCharacter) return;

        // Draw game world
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw character
        this.currentCharacter.draw(this.ctx, this.camera);

        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}
