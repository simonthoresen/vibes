// Peer is loaded globally via script tag in index.html
import { RemotePlayer } from './RemotePlayer.js';

export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.peer = null;
        this.myPeerId = null;
        this.connections = new Map(); // peerId -> connection
        this.remotePlayers = new Map(); // peerId -> RemotePlayer

        // Callbacks
        this.onReady = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;

        // Update rate
        this.updateInterval = 50; // ms (20 updates per second)
        this.lastUpdateTime = 0;
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                // Initialize PeerJS with public server
                this.peer = new Peer({
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' }
                        ]
                    }
                });

                this.peer.on('open', (id) => {
                    console.log('My peer ID is: ' + id);
                    this.myPeerId = id;
                    if (this.onReady) this.onReady(id);
                    resolve(id);
                });

                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });

                this.peer.on('error', (err) => {
                    console.error('PeerJS error:', err);
                    reject(err);
                });

                this.peer.on('disconnected', () => {
                    console.log('Disconnected from PeerJS server');
                    // Try to reconnect
                    if (!this.peer.destroyed) {
                        this.peer.reconnect();
                    }
                });

            } catch (error) {
                console.error('Failed to initialize PeerJS:', error);
                reject(error);
            }
        });
    }

    connectToPeer(peerId) {
        if (peerId === this.myPeerId) {
            console.warn('Cannot connect to yourself');
            return;
        }

        if (this.connections.has(peerId)) {
            console.warn('Already connected to peer:', peerId);
            return;
        }

        console.log('Connecting to peer:', peerId);
        const conn = this.peer.connect(peerId, { reliable: true });
        this.setupConnection(conn);
    }

    handleIncomingConnection(conn) {
        console.log('Incoming connection from:', conn.peer);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('open', () => {
            console.log('Connection established with:', conn.peer);
            this.connections.set(conn.peer, conn);

            // Create remote player
            const remotePlayer = new RemotePlayer(this.scene, conn.peer);
            this.remotePlayers.set(conn.peer, remotePlayer);

            if (this.onPlayerJoined) {
                this.onPlayerJoined(conn.peer);
            }

            // Send initial handshake
            conn.send({
                type: 'handshake',
                peerId: this.myPeerId
            });
        });

        conn.on('data', (data) => {
            this.handleMessage(conn.peer, data);
        });

        conn.on('close', () => {
            console.log('Connection closed with:', conn.peer);
            this.handleDisconnection(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Connection error with', conn.peer, ':', err);
            this.handleDisconnection(conn.peer);
        });
    }

    handleMessage(peerId, data) {
        switch (data.type) {
            case 'handshake':
                console.log('Received handshake from:', peerId);
                break;

            case 'playerUpdate':
                const remotePlayer = this.remotePlayers.get(peerId);
                if (remotePlayer && data.state) {
                    remotePlayer.setState(data.state);
                }
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleDisconnection(peerId) {
        // Remove connection
        this.connections.delete(peerId);

        // Remove remote player
        const remotePlayer = this.remotePlayers.get(peerId);
        if (remotePlayer) {
            remotePlayer.destroy();
            this.remotePlayers.delete(peerId);
        }

        if (this.onPlayerLeft) {
            this.onPlayerLeft(peerId);
        }
    }

    broadcastPlayerState(playerState) {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) {
            return; // Throttle updates
        }
        this.lastUpdateTime = now;

        const message = {
            type: 'playerUpdate',
            state: playerState
        };

        this.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    update(deltaTime) {
        // Update all remote players
        this.remotePlayers.forEach((player) => {
            player.update(deltaTime);
        });
    }

    getConnectedPeers() {
        return Array.from(this.connections.keys());
    }

    getPlayerCount() {
        return this.connections.size + 1; // +1 for local player
    }

    destroy() {
        // Close all connections
        this.connections.forEach((conn) => {
            conn.close();
        });
        this.connections.clear();

        // Destroy all remote players
        this.remotePlayers.forEach((player) => {
            player.destroy();
        });
        this.remotePlayers.clear();

        // Destroy peer
        if (this.peer) {
            this.peer.destroy();
        }
    }
}
