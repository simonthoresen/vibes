export class GameLoop {
    constructor(gameState, systems, renderer) {
        this.gameState = gameState;
        this.systems = systems;
        this.renderer = renderer;
        this.isRunning = false;
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
    }

    loop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime - (deltaTime % this.frameTime);
        }

        requestAnimationFrame(() => this.loop());
    }

    update(deltaTime) {
        if (this.gameState.isPaused) {
            return;
        }

        // Update all systems
        this.systems.forEach(system => {
            if (system.update) {
                system.update(deltaTime);
            }
        });

        // Handle floor progression
        this.handleFloorProgression();
    }

    render() {
        this.renderer.clear();

        // Render game elements
        this.renderer.drawWeapons(this.gameState.player);
        this.renderer.drawEnemies(this.gameState.enemies);
        this.renderer.drawProjectiles(this.gameState.projectiles);
        this.renderer.drawPlayer(this.gameState.player);
        
        // Render particles on top
        const particleEngine = this.systems.find(system => system.constructor.name === 'ParticleEngine');
        if (particleEngine) {
            this.renderer.drawParticles(particleEngine);
        }
    }

    handleFloorProgression() {
        if (this.gameState.floorCleared) {
            this.gameState.currentFloor++;
            this.gameState.floorCleared = false;
            this.gameState.enemies = [];

            // Update highest floor and check for unlocks
            this.updatePlayerProgress();

            // Check for game completion
            if (this.gameState.currentFloor === 100 && !this.gameState.gameCompleted) {
                this.handleGameCompletion();
                return;
            }
            
            // Show floor transition
            this.showFloorTransition();
            
            // Spawn enemies for new floor
            this.spawnFloorEnemies();
        }
    }

    updatePlayerProgress() {
        if (this.gameState.currentFloor > this.gameState.player.highestFloor) {
            this.gameState.player.highestFloor = this.gameState.currentFloor;
            
            if (this.gameState.currentFloor >= 100 && !this.gameState.player.skinsUnlocked) {
                this.unlockSkins();
            }
        }
    }

    unlockSkins() {
        this.gameState.player.skinsUnlocked = true;
        localStorage.setItem('skinsUnlocked', 'true');
        
        // Show unlock message
        this.showUnlockMessage('Skins Unlocked!');
    }

    handleGameCompletion() {
        this.gameState.gameCompleted = true;
        this.stop();
        this.dispatchEvent('game-completed');
    }

    showFloorTransition() {
        const floorText = document.createElement('div');
        floorText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            color: white;
            text-shadow: 0 0 10px #fff;
            z-index: 1000;
            pointer-events: none;
        `;
        floorText.textContent = `Floor ${this.gameState.currentFloor}`;
        document.body.appendChild(floorText);
        
        setTimeout(() => {
            if (document.body.contains(floorText)) {
                document.body.removeChild(floorText);
            }
        }, 2000);
    }

    showUnlockMessage(message) {
        const unlockMessage = document.createElement('div');
        unlockMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            color: gold;
            text-shadow: 0 0 10px gold;
            z-index: 1000;
            pointer-events: none;
        `;
        unlockMessage.textContent = message;
        document.body.appendChild(unlockMessage);
        
        setTimeout(() => {
            if (document.body.contains(unlockMessage)) {
                document.body.removeChild(unlockMessage);
            }
        }, 3000);
    }

    spawnFloorEnemies() {
        // Find enemy system and spawn enemies
        const enemySystem = this.systems.find(system => system.constructor.name === 'EnemySystem');
        if (enemySystem) {
            enemySystem.spawnFloorEnemies();
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}
