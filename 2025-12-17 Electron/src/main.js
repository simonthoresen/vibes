import { Game } from './Game.js';
import { World } from './World.js';
import { Player } from './Player.js';
import { Controls } from './Controls.js';
import { NetworkManager } from './NetworkManager.js';

class GameApp {
    constructor() {
        this.game = null;
        this.world = null;
        this.player = null;
        this.controls = null;
        this.networkManager = null;

        this.init();
    }

    async init() {
        // Create game
        const container = document.getElementById('game-container');
        this.game = new Game(container);

        // Create world
        this.world = new World(this.game.scene);

        // Create local player
        this.player = new Player(this.game.scene, true, 0x00ff00); // Green for local player

        // Create controls
        this.controls = new Controls(this.game.camera, this.game.renderer.domElement);

        // Initialize network manager
        this.networkManager = new NetworkManager(this.game.scene);

        try {
            const peerId = await this.networkManager.init();
            this.updateUI(peerId);
            this.setupNetworkCallbacks();
        } catch (error) {
            console.error('Failed to initialize networking:', error);
            document.getElementById('connection-status').textContent = 'Network initialization failed';
        }

        // Setup UI event handlers
        this.setupUIHandlers();

        // Start game loop
        this.animate();
    }

    setupNetworkCallbacks() {
        this.networkManager.onPlayerJoined = (peerId) => {
            console.log('Player joined:', peerId);
            this.updatePlayersList();
        };

        this.networkManager.onPlayerLeft = (peerId) => {
            console.log('Player left:', peerId);
            this.updatePlayersList();
        };
    }

    setupUIHandlers() {
        // Copy peer ID button
        const copyBtn = document.getElementById('copy-id-btn');
        copyBtn.addEventListener('click', () => {
            const peerId = this.networkManager.myPeerId;
            navigator.clipboard.writeText(peerId).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            });
        });

        // Connect button
        const connectBtn = document.getElementById('connect-btn');
        const peerIdInput = document.getElementById('peer-id-input');

        connectBtn.addEventListener('click', () => {
            const peerId = peerIdInput.value.trim();
            if (peerId) {
                this.networkManager.connectToPeer(peerId);
                peerIdInput.value = '';
                document.getElementById('connection-status').textContent = 'Connecting...';
            }
        });

        // Allow Enter key to connect
        peerIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                connectBtn.click();
            }
        });
    }

    updateUI(peerId) {
        document.getElementById('my-peer-id').textContent = peerId;
        document.getElementById('connection-status').textContent = 'Ready to connect';
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        const playerCount = document.getElementById('player-count');

        // Clear list
        playersList.innerHTML = '<li>You (Local)</li>';

        // Add connected players
        const peers = this.networkManager.getConnectedPeers();
        peers.forEach((peerId) => {
            const li = document.createElement('li');
            li.textContent = peerId.substring(0, 8) + '...';
            playersList.appendChild(li);
        });

        // Update count
        playerCount.textContent = this.networkManager.getPlayerCount();

        // Update connection status
        const status = document.getElementById('connection-status');
        if (peers.length > 0) {
            status.textContent = `Connected to ${peers.length} player(s)`;
            status.classList.add('connected');
        } else {
            status.textContent = 'Ready to connect';
            status.classList.remove('connected');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.game.getDeltaTime();

        // Update controls
        this.controls.update(this.game.camera);

        // Update player
        const moveDirection = this.controls.getMoveDirection();
        const rotation = this.controls.getRotation();

        this.player.rotation.copy(rotation);
        this.player.update(deltaTime, moveDirection);

        // Handle jump
        if (this.controls.isJumping()) {
            this.player.jump();
        }

        // Update camera to follow player
        this.game.camera.position.copy(this.player.position);

        // Broadcast player state to network
        if (this.networkManager) {
            this.networkManager.broadcastPlayerState(this.player.getState());
            this.networkManager.update(deltaTime);
        }

        // Render
        this.game.render();
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
