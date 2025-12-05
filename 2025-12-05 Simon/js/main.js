// Main Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.isGameRunning = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.gameSize = 128;
        this.gameSeed = null;

        // Systems
        this.renderer = null;
        this.terrain = null;
        this.water = null;
        this.player = null;
        this.camera = null;
        this.spellSystem = null;
        this.particleSystem = null;
        this.networking = null;
        this.ui = null;
        this.menuManager = null;
        this.windSystem = null;
        this.weatherSystem = null;
        this.timeSystem = null;
        this.lightingSystem = null;
        this.spellBar = null;
        this.environmentObjects = null;
        this.grassSystem = null;
        this.cloudSystem = null;
        this.skySystem = null;

        this.lastTime = Date.now();
        this.frameRate = 0;

        this.initialize();
    }

    async initialize() {
        console.log('Initializing game...');

        // Create renderer
        this.renderer = new Renderer(this.canvas);
        console.log('[INIT] Renderer created');

        // Create networking system
        this.networking = new NetworkingSystem(this);
        console.log('[INIT] Networking system created');

        // Create UI system
        this.ui = new UISystem(this);
        console.log('[INIT] UI system created');

        // Create menu manager
        this.menuManager = new MenuManager(this);
        console.log('[INIT] Menu manager created');

        // Show initial menu
        console.log('[INIT] Showing main menu');
        this.menuManager.showMenu('mainMenu');

        // Setup input
        inputHandler.handleInput = inputHandler.handleInput.bind(inputHandler);

        console.log('Game initialized');
    }

    async createGame(size, seed, maxPlayers) {
        console.log('Creating hosted game...');
        this.ui.showLoadingScreen('Generating terrain...');
        this.gameSize = size;
        this.gameSeed = seed;

        try {
            // Create time system first (needed by other systems)
            console.log('[GAME] 1/10 Creating time system...');
            this.timeSystem = new TimeSystem();
            this.ui.updateLoadingProgress(0.10);

            // Create terrain
            console.log('[GAME] 2/10 Creating terrain...');
            await this.delay(50);
            this.terrain = new Terrain(this.renderer.scene, this.gameSize);
            console.log(`[GAME]   ✓ Terrain created (${this.gameSize}x${this.gameSize})`);
            this.ui.updateLoadingProgress(0.25);

            // Create water system
            console.log('[GAME] 3/10 Creating water system...');
            await this.delay(50);
            this.water = new WaterSystem(this.renderer.scene, this.terrain);
            this.ui.updateLoadingProgress(0.35);

            // Create particle system
            console.log('[GAME] 4/10 Creating particle system...');
            this.particleSystem = new ParticleSystem(this.renderer.scene);
            this.ui.updateLoadingProgress(0.40);

            // Create environment objects
            console.log('[GAME] 5/10 Creating environment objects...');
            this.environmentObjects = new EnvironmentObjects(this.renderer.scene, this.terrain);
            this.environmentObjects.spawn();
            console.log(`[GAME]   ✓ Spawned ${this.environmentObjects.trees.length} trees, ${this.environmentObjects.rocks.length} rocks`);
            this.ui.updateLoadingProgress(0.50);

            // Create player
            console.log('[GAME] 6/10 Creating player...');
            this.player = new Player(this.renderer.scene, this.terrain);
            this.ui.updateLoadingProgress(0.55);

            // Create camera
            console.log('[GAME] 7/10 Creating camera...');
            this.camera = new CameraController(this.renderer.camera, this.player);
            this.ui.updateLoadingProgress(0.60);

            // Create spell system
            console.log('[GAME] 8/10 Creating spell system...');
            this.spellSystem = new SpellSystem(
                this.renderer.scene,
                this.terrain,
                this.particleSystem,
                this.networking
            );
            this.ui.updateLoadingProgress(0.65);

            // Create other systems
            console.log('[GAME] 9/10 Creating ambient systems...');
            this.windSystem = new WindSystem();
            this.weatherSystem = new WeatherSystem();
            this.lightingSystem = new LightingSystem(this.renderer.scene, this.timeSystem);
            this.skySystem = new SkySystem(this.renderer.scene, this.timeSystem);
            this.grassSystem = new GrassSystem(this.renderer.scene, this.terrain, this.windSystem);
            this.grassSystem.generate();
            this.cloudSystem = new CloudSystem(this.renderer.scene);
            this.cloudSystem.generate();
            this.ui.updateLoadingProgress(0.80);

            // Create spell bar
            console.log('[GAME] 10/10 Creating UI...');
            this.spellBar = new SpellBar(this.spellSystem);
            this.ui.updateLoadingProgress(1.0);

            console.log('[GAME] ✓ Game created successfully');
            
            await this.delay(200);
            this.ui.hideLoadingScreen();

            // Host the game
            console.log('[GAME] Hosting game...');
            await this.networking.hostGame(size, seed, maxPlayers);

            // Start game loop
            this.isGameRunning = true;
            this.menuManager.hideMenus();

            this.ui.showMessage('Game started! You are the host.', 'system');
            
            this.gameLoop();
        } catch (error) {
            console.error('[GAME] ✗ Error creating game:', error);
            this.ui.hideLoadingScreen();
            this.ui.showMessage(`Error creating game: ${error.message}`, 'error');
        }
    }

    async joinGame(host, playerName) {
        console.log('Joining game...');
        this.ui.showLoadingScreen('Connecting to server...');

        const connected = await this.networking.joinGame(host, playerName);

        if (!connected) {
            this.ui.hideLoadingScreen();
            this.ui.showMessage('Failed to connect to server', 'error');
            return;
        }

        // Once joinGame resolves, the WORLD_STATE has been received
        // and loadWorldState() has been called
        console.log('✓ Server connected and world loaded');
    }

    gameLoop = () => {
        if (!this.isGameRunning) return;

        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Update systems
        this.update(deltaTime);

        // Render
        this.renderer.render();

        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        // Handle input
        inputHandler.handleInput(this);

        // Update player
        if (this.player) {
            this.player.update(null, deltaTime);
        }

        // Update camera
        if (this.camera) {
            this.camera.update();
        }

        // Update spells
        if (this.spellSystem) {
            this.spellSystem.update(deltaTime);
            this.spellBar.update();
        }

        // Update particles
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }

        // Update water
        if (this.water) {
            this.water.update(deltaTime);
        }

        // Update environment objects
        if (this.environmentObjects) {
            this.environmentObjects.update(deltaTime);
        }

        // Update systems (order matters!)
        if (this.timeSystem) this.timeSystem.update(deltaTime);
        if (this.windSystem) this.windSystem.update(deltaTime);
        if (this.weatherSystem) this.weatherSystem.update(deltaTime);
        if (this.lightingSystem) this.lightingSystem.update(deltaTime);
        if (this.skySystem) this.skySystem.update(deltaTime);
        if (this.grassSystem) this.grassSystem.update(deltaTime);
        if (this.cloudSystem) this.cloudSystem.update(deltaTime, this.windSystem, this.weatherSystem);

        // Update UI
        if (this.ui) {
            this.ui.update(deltaTime);
        }

        // Send player position to server
        if (this.networking && this.player) {
            // Throttle to network update rate
            if (Math.random() < deltaTime * CONFIG.NETWORKING.UPDATE_RATE / 60) {
                const pos = this.player.getPosition();
                this.networking.sendPlayerPosition(pos.x, pos.y, pos.z);
            }
        }
    }

    quitGame() {
        console.log('[CLEANUP] Shutting down game...');
        this.isGameRunning = false;
        
        try {
            if (this.networking) {
                console.log('[CLEANUP] Disconnecting from server...');
                this.networking.disconnect();
            }
            
            console.log('[CLEANUP] Disposing game systems...');
            if (this.terrain) {
                this.terrain.dispose();
                console.log('[CLEANUP]   ✓ Terrain disposed');
            }
            if (this.water) {
                this.water.dispose();
                console.log('[CLEANUP]   ✓ Water disposed');
            }
            if (this.player) {
                this.player.dispose();
                console.log('[CLEANUP]   ✓ Player disposed');
            }
            if (this.particleSystem) {
                this.particleSystem.dispose();
                console.log('[CLEANUP]   ✓ Particles disposed');
            }
            if (this.environmentObjects) {
                this.environmentObjects.dispose();
                console.log('[CLEANUP]   ✓ Environment objects disposed');
            }
            if (this.grassSystem) {
                this.grassSystem.dispose();
                console.log('[CLEANUP]   ✓ Grass disposed');
            }
            if (this.cloudSystem) {
                this.cloudSystem.dispose();
                console.log('[CLEANUP]   ✓ Clouds disposed');
            }
            if (this.skySystem) {
                this.skySystem.dispose();
                console.log('[CLEANUP]   ✓ Sky disposed');
            }
            if (this.lightingSystem) {
                this.lightingSystem.dispose();
                console.log('[CLEANUP]   ✓ Lighting disposed');
            }
            
            console.log('[CLEANUP] ✓ Game shutdown complete');
            
            // Show menu
            this.menuManager.showMenu('mainMenu');
        } catch (error) {
            console.error('[CLEANUP] ✗ Error during cleanup:', error);
        }
    }

    loadWorldState(data) {
        console.log('Loading world state from server...');
        console.log('World data:', data);
        
        // Load world state from server
        this.gameSize = data.size || 128;
        this.gameSeed = data.seed;
        
        console.log(`[WORLD] Creating systems for size=${this.gameSize}, seed=${this.gameSeed}`);
        
        try {
            // Create time system first
            console.log('[WORLD] 1/10 Creating time system...');
            this.timeSystem = new TimeSystem();
            this.ui.updateLoadingProgress(0.10);

            // Create terrain
            console.log('[WORLD] 2/10 Creating terrain...');
            this.terrain = new Terrain(this.renderer.scene, this.gameSize);
            console.log(`[WORLD]   ✓ Terrain created (heightmap: ${this.terrain.size}x${this.terrain.size})`);
            this.ui.updateLoadingProgress(0.25);

            // Create water system
            console.log('[WORLD] 3/10 Creating water system...');
            this.water = new WaterSystem(this.renderer.scene, this.terrain);
            console.log('[WORLD]   ✓ Water system created');
            this.ui.updateLoadingProgress(0.35);

            // Create particle system
            console.log('[WORLD] 4/10 Creating particle system...');
            this.particleSystem = new ParticleSystem(this.renderer.scene);
            this.ui.updateLoadingProgress(0.40);

            // Create environment objects
            console.log('[WORLD] 5/10 Creating environment objects...');
            this.environmentObjects = new EnvironmentObjects(this.renderer.scene, this.terrain);
            this.environmentObjects.spawn();
            console.log('[WORLD]   ✓ Environment objects spawned');
            this.ui.updateLoadingProgress(0.50);

            // Create player
            console.log('[WORLD] 6/10 Creating player...');
            this.player = new Player(this.renderer.scene, this.terrain);
            this.ui.updateLoadingProgress(0.55);

            // Create camera
            console.log('[WORLD] 7/10 Creating camera...');
            this.camera = new CameraController(this.renderer.camera, this.player);
            this.ui.updateLoadingProgress(0.60);

            // Create spell system
            console.log('[WORLD] 8/10 Creating spell system...');
            this.spellSystem = new SpellSystem(
                this.renderer.scene,
                this.terrain,
                this.particleSystem,
                this.networking
            );
            this.ui.updateLoadingProgress(0.65);

            // Create ambient systems
            console.log('[WORLD] 9/10 Creating ambient systems (weather, sky, lighting, grass, clouds)...');
            this.windSystem = new WindSystem();
            this.weatherSystem = new WeatherSystem();
            this.lightingSystem = new LightingSystem(this.renderer.scene, this.timeSystem);
            this.skySystem = new SkySystem(this.renderer.scene, this.timeSystem);
            this.grassSystem = new GrassSystem(this.renderer.scene, this.terrain, this.windSystem);
            this.grassSystem.generate();
            this.cloudSystem = new CloudSystem(this.renderer.scene);
            this.cloudSystem.generate();
            console.log('[WORLD]   ✓ All ambient systems created');
            this.ui.updateLoadingProgress(0.85);

            // Create spell bar
            console.log('[WORLD] 10/10 Creating UI (spell bar)...');
            this.spellBar = new SpellBar(this.spellSystem);
            this.ui.updateLoadingProgress(0.95);

            console.log('[WORLD] ✓ All systems created successfully');
            console.log(`[WORLD] Total objects: ${this.environmentObjects.trees.length} trees, ${this.environmentObjects.rocks.length} rocks, ${this.environmentObjects.grassPatches.length} grass patches`);
            
            this.ui.updateLoadingProgress(1.0);
            
            // Hide loading screen and start game
            console.log('[WORLD] Starting game loop...');
            this.ui.hideLoadingScreen();
            
            this.isGameRunning = true;
            this.menuManager.hideMenus();

            this.ui.showMessage('Connected to server - Welcome to Wizard Terrain Modifier!', 'system');

            this.gameLoop();
        } catch (error) {
            console.error('[WORLD] ✗ Error loading world:', error);
            this.ui.hideLoadingScreen();
            this.ui.showMessage(`Error loading world: ${error.message}`, 'error');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create game instance when page loads
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new Game();
    window.gameInstance = gameInstance;
});
