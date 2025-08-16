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
        this.background = null;
        this.backgroundImage = null;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        requestAnimationFrame(() => this.gameLoop());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setBackground(imagePath) {
        return new Promise((resolve) => {
            this.background = imagePath;
            this.backgroundImage = new Image();
            this.backgroundImage.onload = () => resolve();
            this.backgroundImage.src = imagePath;
        });
    }

    async startNewGame(characterData) {
        // Create fade to black transition
        const overlay = await Transitions.fadeToBlack();
        
        // Initialize the character and game
        this.currentCharacter = new Character(characterData);
        this.isRunning = true;

        // Set the initial background if specified in worldConfig and wait for it to load
        if (characterData.worldConfig?.backgrounds) {
            const firstBackground = Object.values(characterData.worldConfig.backgrounds)[0];
            if (firstBackground) {
                await this.setBackground(firstBackground);
            }
        }

        // Switch to game screen
        this.menuManager.showScreen('game');
        
        // Draw the first frame
        this.draw();

        // Small delay to ensure the frame is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Fade from black
        await Transitions.fadeFromBlack(overlay);
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

        if (!this.isRunning) return;

        // Draw background if available
        if (this.backgroundImage && this.backgroundImage.complete) {
            // Draw background with proper aspect ratio and cover behavior
            const scale = Math.max(
                this.canvas.width / this.backgroundImage.width,
                this.canvas.height / this.backgroundImage.height
            );
            
            const newWidth = this.backgroundImage.width * scale;
            const newHeight = this.backgroundImage.height * scale;
            
            const left = (this.canvas.width - newWidth) / 2;
            const top = (this.canvas.height - newHeight) / 2;
            
            this.ctx.drawImage(this.backgroundImage, left, top, newWidth, newHeight);
        }

        if (!this.currentCharacter) return;

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
