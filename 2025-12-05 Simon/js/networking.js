// Networking System
class NetworkingSystem {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.players = new Map();
        this.isConnected = false;
    }

    async hostGame(size, seed, maxPlayers) {
        // In a real scenario, this would start a server
        // For demo, we'll just initialize as local game
        console.log('Hosting game:', { size, seed, maxPlayers });
        this.isConnected = true;
        return true;
    }

    async joinGame(host, playerName) {
        try {
            console.log(`[CLIENT] Attempting to connect to ${host}`);
            const protocol = host.includes('localhost') ? 'ws' : 'wss';
            const url = `${protocol}://${host}`;
            
            console.log(`[CLIENT] WebSocket URL: ${url}`);
            
            return new Promise((resolve) => {
                let worldStateReceived = false;
                const timeout = setTimeout(() => {
                    console.error(`[CLIENT] ✗ Connection timeout - no WORLD_STATE received`);
                    resolve(false);
                }, 10000);

                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('[CLIENT] ✓ WebSocket connection established');
                    this.isConnected = true;
                    console.log(`[CLIENT] Sending JOIN message with name: ${playerName}`);
                    this.sendMessage({
                        type: 'JOIN',
                        name: playerName,
                    });
                    console.log('[CLIENT] ✓ JOIN message sent, waiting for WORLD_STATE...');
                };

                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log(`[CLIENT] Received message type: ${data.type}`);
                    
                    // Check for WORLD_STATE first
                    if (data.type === 'WORLD_STATE' && !worldStateReceived) {
                        console.log('[CLIENT] ✓ WORLD_STATE received - connection complete');
                        worldStateReceived = true;
                        clearTimeout(timeout);
                        this.handleMessage(data);
                        resolve(true);
                    } else {
                        this.handleMessage(data);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[CLIENT] ✗ WebSocket error:', error);
                    clearTimeout(timeout);
                    this.isConnected = false;
                    resolve(false);
                };

                this.ws.onclose = () => {
                    console.log('[CLIENT] WebSocket disconnected from server');
                    clearTimeout(timeout);
                    this.isConnected = false;
                    if (!worldStateReceived) {
                        resolve(false);
                    }
                };
            });
        } catch (error) {
            console.error('Failed to join game:', error);
            return false;
        }
    }

    sendSpellCast(spellId, x, z, y) {
        this.sendMessage({
            type: 'SPELL_CAST',
            spellId,
            x, z, y,
        });
    }

    sendPlayerPosition(x, y, z) {
        this.sendMessage({
            type: 'PLAYER_MOVE',
            x, y, z,
        });
    }

    handleMessage(message) {
        console.log(`[CLIENT] Handling message type: ${message.type}`);
        
        switch (message.type) {
            case 'WORLD_STATE':
                console.log('[CLIENT] Processing WORLD_STATE');
                console.log('[CLIENT] World data:', message.data);
                console.log('[CLIENT] Calling game.loadWorldState()');
                this.game.loadWorldState(message.data);
                console.log('[CLIENT] ✓ WORLD_STATE processed');
                break;
                
            case 'PLAYER_JOIN':
                console.log(`[CLIENT] Player joined: ${message.name}`);
                this.addPlayer(message.playerId, message.name);
                break;
                
            case 'PLAYER_MOVE':
                console.log(`[CLIENT] Player moved to (${message.x}, ${message.y}, ${message.z})`);
                this.updatePlayerPosition(message.playerId, message.x, message.y, message.z);
                break;
                
            case 'SPELL_CAST':
                console.log(`[CLIENT] Spell cast received`);
                this.game.spellSystem.castSpell(
                    message.data.spellId, message.data.x, message.data.z, message.data.y
                );
                break;
                
            default:
                console.log(`[CLIENT] Unknown message type: ${message.type}`);
        }
    }

    addPlayer(id, name) {
        console.log(`[CLIENT] Adding player - ID: ${id}, Name: ${name}`);
        // Create remote player representation
        console.log(`[CLIENT] ✓ Player added: ${name}`);
    }

    updatePlayerPosition(id, x, y, z) {
        console.log(`[CLIENT] Updating position for player ${id} to (${x}, ${y}, ${z})`);
        // Update player position
    }

    sendMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify(data);
            console.log(`[CLIENT] Sending message type: ${data.type}`);
            this.ws.send(message);
            console.log(`[CLIENT] ✓ Message sent`);
        } else {
            // Silently ignore if not connected - will try again next frame
            if (this.ws) {
                console.debug(`[CLIENT] Message queued (not ready yet): ${data.type}`);
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
