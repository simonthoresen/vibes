export class NetworkManager {
    constructor() {
        this.peer = null;
        this.connections = new Map();
        this.isHost = false;
        this.peerId = null;
        this.playerName = 'Player';
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onPlayerUpdate = null;
        this.onGrenadeThrown = null;
    }

    async initialize(playerName) {
        this.playerName = playerName;
        
        return new Promise((resolve, reject) => {
            this.peer = new Peer();
            
            this.peer.on('open', (id) => {
                this.peerId = id;
                console.log('Peer initialized with ID:', id);
                resolve(id);
            });

            this.peer.on('error', (error) => {
                console.error('Peer error:', error);
                reject(error);
            });

            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });
        });
    }

    hostGame() {
        this.isHost = true;
        console.log('Hosting game with ID:', this.peerId);
    }

    async joinGame(hostId) {
        if (!this.peer) {
            throw new Error('Peer not initialized');
        }

        const conn = this.peer.connect(hostId);
        
        return new Promise((resolve, reject) => {
            conn.on('open', () => {
                console.log('Connected to host');
                this.handleConnection(conn);
                
                // Send join message
                conn.send({
                    type: 'join',
                    id: this.peerId,
                    name: this.playerName
                });
                
                resolve();
            });

            conn.on('error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }

    handleIncomingConnection(conn) {
        console.log('Incoming connection from:', conn.peer);
        
        conn.on('open', () => {
            this.handleConnection(conn);
        });
    }

    handleConnection(conn) {
        this.connections.set(conn.peer, conn);

        conn.on('data', (data) => {
            this.handleMessage(data, conn);
        });

        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            this.connections.delete(conn.peer);
            
            if (this.onPlayerLeave) {
                this.onPlayerLeave(conn.peer);
            }
        });

        conn.on('error', (error) => {
            console.error('Connection error:', error);
        });
    }

    handleMessage(data, conn) {
        switch (data.type) {
            case 'join':
                if (this.onPlayerJoin) {
                    this.onPlayerJoin(data.id, data.name);
                }
                
                // If host, broadcast to other players
                if (this.isHost) {
                    this.broadcast({
                        type: 'playerJoined',
                        id: data.id,
                        name: data.name
                    }, conn.peer);
                }
                break;

            case 'playerJoined':
                if (this.onPlayerJoin) {
                    this.onPlayerJoin(data.id, data.name);
                }
                break;

            case 'playerUpdate':
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(data.id, data.playerData);
                }
                break;

            case 'grenadeThrown':
                if (this.onGrenadeThrown) {
                    this.onGrenadeThrown(data.position, data.direction, data.velocity);
                }
                break;
        }
    }

    sendPlayerUpdate(playerData) {
        const message = {
            type: 'playerUpdate',
            id: this.peerId,
            playerData: {
                position: { x: playerData.position.x, y: playerData.position.y, z: playerData.position.z },
                rotation: { x: playerData.rotation.x, y: playerData.rotation.y, z: playerData.rotation.z },
                velocity: { x: playerData.velocity.x, y: playerData.velocity.y, z: playerData.velocity.z }
            }
        };

        this.broadcast(message);
    }

    sendGrenadeThrown(position, direction, velocity) {
        const message = {
            type: 'grenadeThrown',
            position: { x: position.x, y: position.y, z: position.z },
            direction: { x: direction.x, y: direction.y, z: direction.z },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z }
        };

        this.broadcast(message);
    }

    broadcast(message, excludePeer = null) {
        this.connections.forEach((conn, peerId) => {
            if (peerId !== excludePeer && conn.open) {
                try {
                    conn.send(message);
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        });
    }

    getConnectedPlayers() {
        return Array.from(this.connections.keys());
    }

    disconnect() {
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        
        if (this.peer) {
            this.peer.destroy();
        }
    }
}
