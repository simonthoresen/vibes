import * as THREE from 'three';
import { SolarSystem } from './solarSystem.js';
import { Physics } from './physics.js';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { Camera } from './camera.js';
import { GrenadeManager } from './grenade.js';
import { NetworkManager } from './network.js';
import { ParticleEmitter } from './particles.js';

class Game {
    constructor() {
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.solarSystem = null;
        this.physics = null;
        this.inputManager = null;
        this.grenadeManager = null;
        this.networkManager = null;
        
        this.localPlayer = null;
        this.remotePlayers = new Map();
        
        this.lastTime = 0;
        this.gameStarted = false;
        
        // Debug mode
        this.debugMode = false;
        this.debugWireframes = [];
        this.debugAxes = null;
        this.debugAxisLabels = null;
        
        this.setupUI();
    }

    async init() {
        // Setup Three.js
        console.log('Starting game initialization...');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        console.log('Scene created');
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = 'gameCanvas';
        console.log('Renderer created:', window.innerWidth, 'x', window.innerHeight);

        // Create camera
        this.camera = new Camera(window.innerWidth / window.innerHeight);
        console.log('Camera created');

        // Create solar system
        this.solarSystem = new SolarSystem(this.scene);
        console.log('Solar system created');

        // Create physics
        this.physics = new Physics(this.solarSystem);
        console.log('Physics system created');

        // Create input manager
        this.inputManager = new InputManager();
        console.log('Input manager created');

        // Create grenade manager
        this.grenadeManager = new GrenadeManager(this.scene, this.physics);
        console.log('Grenade manager created');

        // Create network manager
        this.networkManager = new NetworkManager();
        this.setupNetworkCallbacks();
        console.log('Network manager created');

        // Setup resize handler
        window.addEventListener('resize', () => this.onResize());

        console.log('✓ Game initialized successfully');
    }

    setupUI() {
        const hostBtn = document.getElementById('hostBtn');
        const joinBtn = document.getElementById('joinBtn');
        const startBtn = document.getElementById('startBtn');
        const connectBtn = document.getElementById('connectBtn');

        hostBtn.addEventListener('click', () => this.onHostGame());
        joinBtn.addEventListener('click', () => this.onJoinGame());
        startBtn.addEventListener('click', () => this.onStartGame());
        connectBtn.addEventListener('click', () => this.onConnect());
    }

    setupNetworkCallbacks() {
        this.networkManager.onPlayerJoin = (id, name) => {
            console.log('Player joined:', name, id);
            this.addRemotePlayer(id, name);
            this.updatePlayerCount();
        };

        this.networkManager.onPlayerLeave = (id) => {
            console.log('Player left:', id);
            this.removeRemotePlayer(id);
            this.updatePlayerCount();
        };

        this.networkManager.onPlayerUpdate = (id, data) => {
            const player = this.remotePlayers.get(id);
            if (player) {
                player.updateFromNetwork(data);
            }
        };

        this.networkManager.onGrenadeThrown = (position, direction, velocity) => {
            const pos = new THREE.Vector3(position.x, position.y, position.z);
            const dir = new THREE.Vector3(direction.x, direction.y, direction.z);
            const vel = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
            this.grenadeManager.throwGrenade(pos, dir, vel);
        };
    }

    async onHostGame() {
        const playerName = document.getElementById('playerName').value || 'Player';
        
        try {
            const peerId = await this.networkManager.initialize(playerName);
            this.networkManager.hostGame();
            
            document.getElementById('myPeerId').textContent = peerId;
            document.getElementById('hostSection').classList.remove('hidden');
            document.getElementById('hostBtn').disabled = true;
            document.getElementById('joinBtn').disabled = true;
            
            console.log('Game hosted');
        } catch (error) {
            console.error('Failed to host game:', error);
            alert('Failed to host game. Please try again.');
        }
    }

    onJoinGame() {
        document.getElementById('joinSection').classList.remove('hidden');
        document.getElementById('hostBtn').disabled = true;
        document.getElementById('joinBtn').disabled = true;
    }

    async onConnect() {
        const playerName = document.getElementById('playerName').value || 'Player';
        const hostPeerId = document.getElementById('peerId').value;
        
        if (!hostPeerId) {
            alert('Please enter a peer ID');
            return;
        }

        try {
            await this.networkManager.initialize(playerName);
            await this.networkManager.joinGame(hostPeerId);
            
            document.getElementById('joinSection').classList.add('hidden');
            document.getElementById('connectBtn').disabled = true;
            
            console.log('Connected to game');
        } catch (error) {
            console.error('Failed to join game:', error);
            alert('Failed to join game. Please check the peer ID and try again.');
        }
    }

    onStartGame() {
        if (!this.gameStarted) {
            this.startGame();
        }
    }

    startGame() {
        console.log('Starting game...');
        this.gameStarted = true;
        
        // Hide menu
        const menu = document.getElementById('menu');
        console.log('Menu element:', menu);
        menu.classList.add('hidden');
        console.log('Menu hidden');

        // Create local player
        const playerName = document.getElementById('playerName').value || 'Player';
        console.log('Creating player:', playerName);
        
        this.localPlayer = new Player(
            this.scene,
            this.physics,
            this.networkManager.peerId || 'local',
            playerName,
            true
        );
        console.log('Local player created at:', this.localPlayer.getPosition());

        // Start game loop
        this.lastTime = performance.now();
        console.log('Starting game loop...');
        this.gameLoop();

        console.log('✓ Game started successfully');
    }

    addRemotePlayer(id, name) {
        if (!this.remotePlayers.has(id)) {
            const player = new Player(this.scene, this.physics, id, name, false);
            this.remotePlayers.set(id, player);
        }
    }

    removeRemotePlayer(id) {
        const player = this.remotePlayers.get(id);
        if (player) {
            player.destroy();
            this.remotePlayers.delete(id);
        }
    }

    updatePlayerCount() {
        const count = 1 + this.remotePlayers.size;
        document.getElementById('playerCount').textContent = count;
    }

    gameLoop() {
        if (!this.gameStarted) return;

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        try {
            this.update(deltaTime);
            this.render();
        } catch (error) {
            console.error('Error in game loop:', error);
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Get input
        const input = this.inputManager.getInput();
        
        // Toggle debug mode with 'D' key
        if (input.toggleDebug) {
            this.toggleDebugMode();
            input.toggleDebug = false; // Prevent repeated toggles
        }

        // Toggle camera mode
        if (input.toggleCamera) {
            const mode = this.camera.toggleMode();
            document.getElementById('cameraMode').textContent = 
                mode === 'follow' ? 'Follow' : 'Sun View';
            this.inputManager.resetToggle();
        }

        // Update player
        if (this.localPlayer) {
            this.localPlayer.update(deltaTime, input, input.mouseDelta);

            // Throw grenade
            if (input.shoot) {
                const direction = this.camera.getForwardDirection();
                this.grenadeManager.throwGrenade(
                    this.localPlayer.getPosition(),
                    direction,
                    this.localPlayer.getVelocity()
                );

                // Broadcast grenade
                this.networkManager.sendGrenadeThrown(
                    this.localPlayer.getPosition(),
                    direction,
                    this.localPlayer.getVelocity()
                );
            }

            // Send player update to network (throttled)
            if (Math.random() < 0.1) { // Send ~10% of frames
                this.networkManager.sendPlayerUpdate(this.localPlayer.getNetworkData());
            }
        } else {
            console.warn('No local player in update');
        }

        // Update camera
        if (this.camera) {
            this.camera.update(this.localPlayer, input, deltaTime);
        } else {
            console.warn('No camera in update');
        }

        // Update solar system
        if (this.solarSystem) {
            this.solarSystem.update(deltaTime);
        }

        // Update grenades
        if (this.grenadeManager) {
            this.grenadeManager.update(deltaTime);
        }

        // Update UI
        this.updateUI();
        
        // Update debug visuals
        this.updateDebugVisuals();
    }

    updateUI() {
        if (this.localPlayer) {
            const velocity = this.localPlayer.getVelocity().length().toFixed(2);
            document.getElementById('velocity').textContent = velocity;

            const nearest = this.solarSystem.getNearestBody(this.localPlayer.getPosition());
            if (nearest) {
                const distance = this.localPlayer.getPosition().distanceTo(nearest.mesh.position).toFixed(1);
                document.getElementById('nearestPlanet').textContent = 
                    `${nearest.name} (${distance}m)`;
            }
        }
    }

    render() {
        try {
            this.renderer.render(this.scene, this.camera.getCamera());
        } catch (error) {
            console.error('Error rendering:', error);
        }
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.resize(width / height);
        this.renderer.setSize(width, height);
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
        
        if (this.debugMode) {
            // Create wireframes for all planets
            const bodies = this.solarSystem.getCelestialBodies();
            bodies.forEach(body => {
                if (body.mesh && body.name !== 'Sun') {
                    const wireframeGeometry = new THREE.WireframeGeometry(body.mesh.geometry);
                    const wireframeMaterial = new THREE.LineBasicMaterial({ 
                        color: 0xffff00, // Yellow
                        linewidth: 2 
                    });
                    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                    wireframe.position.copy(body.mesh.position);
                    wireframe.rotation.copy(body.mesh.rotation);
                    wireframe.scale.copy(body.mesh.scale);
                    this.scene.add(wireframe);
                    this.debugWireframes.push({ wireframe, mesh: body.mesh, body });
                }
            });
            
            // Create axes helper for player with labels
            if (this.localPlayer && this.localPlayer.mesh) {
                this.debugAxes = new THREE.AxesHelper(2);
                // Flip Z axis scale to point forward (-Z) instead of backward (+Z)
                this.debugAxes.scale.z = -1;
                this.localPlayer.mesh.add(this.debugAxes);
                
                // Create text labels for axes
                this.debugAxisLabels = [];
                const labels = [
                    { text: 'right', position: new THREE.Vector3(2.5, 0, 0), color: 0xff0000 },
                    { text: 'up', position: new THREE.Vector3(0, 2.5, 0), color: 0x00ff00 },
                    { text: 'forward', position: new THREE.Vector3(0, 0, -2.5), color: 0x0000ff }
                ];
                
                labels.forEach(({ text, position, color }) => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 64;
                    
                    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
                    context.font = 'Bold 48px Arial';
                    context.textAlign = 'center';
                    context.fillText(text, 128, 48);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                    const sprite = new THREE.Sprite(spriteMaterial);
                    sprite.position.copy(position);
                    sprite.scale.set(1, 0.25, 1);
                    
                    this.localPlayer.mesh.add(sprite);
                    this.debugAxisLabels.push(sprite);
                });
            }
        } else {
            // Remove wireframes
            this.debugWireframes.forEach(({ wireframe }) => {
                this.scene.remove(wireframe);
                wireframe.geometry.dispose();
                wireframe.material.dispose();
            });
            this.debugWireframes = [];
            
            // Remove axes helper and labels
            if (this.debugAxes && this.localPlayer && this.localPlayer.mesh) {
                this.localPlayer.mesh.remove(this.debugAxes);
                this.debugAxes.dispose();
                this.debugAxes = null;
            }
            
            if (this.debugAxisLabels && this.localPlayer && this.localPlayer.mesh) {
                this.debugAxisLabels.forEach(sprite => {
                    this.localPlayer.mesh.remove(sprite);
                    sprite.material.map.dispose();
                    sprite.material.dispose();
                });
                this.debugAxisLabels = null;
            }
        }
    }
    
    updateDebugVisuals() {
        if (this.debugMode) {
            // Update wireframe positions/rotations to match planets
            this.debugWireframes.forEach(({ wireframe, mesh, body }) => {
                wireframe.position.copy(mesh.position);
                wireframe.rotation.copy(mesh.rotation);
                
                // Change color to red if this is the planet player is stuck on
                const isStuckPlanet = this.localPlayer && 
                                     this.localPlayer.currentPlanet === body;
                wireframe.material.color.setHex(isStuckPlanet ? 0xff0000 : 0xffff00);
            });
        }
    }
}

// Start the game
console.log('🚀 Solar Jump - Initializing...');
const game = new Game();
game.init().then(() => {
    console.log('✓ Game fully initialized and ready');
    // Auto-host and start game
    game.onHostGame().then(() => {
        // Give it a moment for hosting to complete, then start
        setTimeout(() => game.onStartGame(), 500);
    });
}).catch(error => {
    console.error('✗ Failed to initialize game:', error);
});
