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
                            // STUN servers for NAT discovery
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:stun2.l.google.com:19302' },
                            { urls: 'stun:stun3.l.google.com:19302' },
                            { urls: 'stun:stun4.l.google.com:19302' },

                            // TURN servers for relaying when direct connection fails
                            // Using free public TURN servers
                            {
                                urls: 'turn:openrelay.metered.ca:80',
                                username: 'openrelayproject',
                                credential: 'openrelayproject'
                            },
                            {
                                urls: 'turn:openrelay.metered.ca:443',
                                username: 'openrelayproject',
                                credential: 'openrelayproject'
                            },
                            {
                                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                                username: 'openrelayproject',
                                credential: 'openrelayproject'
                            }
                        ],
                        iceTransportPolicy: 'all' // Try all connection methods
                    },
                    debug: 2 // Enable PeerJS debug logging
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

        console.log('[DEBUG] Connecting to peer:', peerId);
        console.log('[DEBUG] My peer ID:', this.myPeerId);
        console.log('[DEBUG] Peer object state:', this.peer);
        const conn = this.peer.connect(peerId, { reliable: true });
        console.log('[DEBUG] Connection object created:', conn);
        console.log('[DEBUG] Connection metadata:', { peer: conn.peer, open: conn.open, type: conn.type });
        this.setupConnection(conn);
    }

    handleIncomingConnection(conn) {
        console.log('[DEBUG] Incoming connection from:', conn.peer);
        console.log('[DEBUG] Incoming connection metadata:', { peer: conn.peer, open: conn.open, type: conn.type });
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        console.log('[DEBUG] Setting up connection listeners for:', conn.peer);

        // Add timeout detection
        const connectionTimeout = setTimeout(() => {
            if (!conn.open) {
                console.error('[DEBUG] ⏰ Connection timeout after 30 seconds for:', conn.peer);
                console.error('[DEBUG] Connection state:', {
                    open: conn.open,
                    peerConnection: conn.peerConnection ? conn.peerConnection.connectionState : 'no peerConnection',
                    iceConnectionState: conn.peerConnection ? conn.peerConnection.iceConnectionState : 'no peerConnection',
                    iceGatheringState: conn.peerConnection ? conn.peerConnection.iceGatheringState : 'no peerConnection'
                });
            }
        }, 30000);

        // Monitor ICE connection state
        setTimeout(() => {
            if (conn.peerConnection) {
                console.log('[DEBUG] Adding ICE state monitors');
                conn.peerConnection.oniceconnectionstatechange = () => {
                    console.log('[DEBUG] 🧊 ICE connection state:', conn.peerConnection.iceConnectionState);
                };
                conn.peerConnection.onconnectionstatechange = () => {
                    console.log('[DEBUG] 🔗 Connection state:', conn.peerConnection.connectionState);
                };
            }
        }, 100);

        conn.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log('[DEBUG] ✅ Connection OPEN event fired for:', conn.peer);
            console.log('[DEBUG] Connection is now open:', conn.open);
            this.connections.set(conn.peer, conn);
            console.log('[DEBUG] Total connections:', this.connections.size);

            // Create remote player
            console.log('[DEBUG] Creating remote player for:', conn.peer);
            const remotePlayer = new RemotePlayer(this.scene, conn.peer);
            this.remotePlayers.set(conn.peer, remotePlayer);
            console.log('[DEBUG] Remote player created successfully');

            if (this.onPlayerJoined) {
                console.log('[DEBUG] Calling onPlayerJoined callback');
                this.onPlayerJoined(conn.peer);
            }

            // Send initial handshake
            console.log('[DEBUG] Sending handshake to:', conn.peer);
            conn.send({
                type: 'handshake',
                peerId: this.myPeerId
            });
            console.log('[DEBUG] Handshake sent');
        });

        conn.on('data', (data) => {
            console.log('[DEBUG] 📨 Data received from:', conn.peer, data);
            this.handleMessage(conn.peer, data);
        });

        conn.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log('[DEBUG] ❌ Connection CLOSE event for:', conn.peer);
            this.handleDisconnection(conn.peer);
        });

        conn.on('error', (err) => {
            clearTimeout(connectionTimeout);
            console.error('[DEBUG] 🔴 Connection ERROR event for', conn.peer, ':', err);
            console.error('[DEBUG] Error details:', { type: err.type, message: err.message });
            this.handleDisconnection(conn.peer);
        });

        console.log('[DEBUG] All event listeners attached for:', conn.peer);
    }

    handleMessage(peerId, data) {
        console.log('[DEBUG] Handling message from:', peerId, 'type:', data.type);
        switch (data.type) {
            case 'handshake':
                console.log('[DEBUG] ✅ Received handshake from:', peerId);
                break;

            case 'playerUpdate':
                const remotePlayer = this.remotePlayers.get(peerId);
                if (remotePlayer && data.state) {
                    remotePlayer.setState(data.state);
                } else {
                    console.warn('[DEBUG] ⚠️ No remote player found for:', peerId);
                }
                break;

            default:
                console.log('[DEBUG] ⚠️ Unknown message type:', data.type);
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
