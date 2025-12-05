// WebSocket Server for hosting games
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const games = new Map();
const players = new Map();

wss.on('connection', (ws) => {
    console.log('[SERVER] ✓ New client connected');
    console.log(`[SERVER] Total connections: ${wss.clients.size}`);
    
    let playerId = null;
    let currentGame = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[MESSAGE] Received type: ${data.type}`);
            
            switch (data.type) {
                case 'JOIN':
                    console.log(`[JOIN] Player joining - name: ${data.name}`);
                    handlePlayerJoin(ws, data, (id, gameId) => {
                        playerId = id;
                        currentGame = gameId;
                        console.log(`[JOIN] ✓ Player assigned: ${id} in game: ${gameId}`);
                    });
                    break;
                    
                case 'SPELL_CAST':
                    console.log(`[SPELL] Cast spell ${data.spellIndex} at (${data.x}, ${data.z})`);
                    handleSpellCast(currentGame, data);
                    break;
                    
                case 'PLAYER_MOVE':
                    console.log(`[MOVE] Player ${playerId} moved to (${data.x}, ${data.y}, ${data.z})`);
                    handlePlayerMove(currentGame, playerId, data);
                    break;
                    
                case 'PING':
                    console.log(`[PING] Received ping from ${playerId}`);
                    ws.send(JSON.stringify({ type: 'PONG' }));
                    break;
                    
                default:
                    console.log(`[MESSAGE] Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('[ERROR] Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`[DISCONNECT] Client disconnected (playerId: ${playerId})`);
        console.log(`[SERVER] Total connections now: ${wss.clients.size}`);
        if (playerId && currentGame) {
            handlePlayerLeave(currentGame, playerId);
        }
    });

    ws.on('error', (error) => {
        console.error('[ERROR] WebSocket error:', error);
    });
});

function handlePlayerJoin(ws, data, callback) {
    const playerId = 'player_' + Date.now() + '_' + Math.random();
    const gameId = 'game_default';
    
    console.log(`[GAME] handlePlayerJoin started`);
    console.log(`[GAME] playerId: ${playerId}`);
    console.log(`[GAME] gameId: ${gameId}`);

    if (!games.has(gameId)) {
        console.log(`[GAME] Creating new game: ${gameId}`);
        games.set(gameId, {
            players: new Map(),
            heightmap: null,
            waterVolume: null,
        });
    }

    const game = games.get(gameId);
    console.log(`[GAME] Game retrieved, current players: ${game.players.size}`);
    
    game.players.set(playerId, {
        id: playerId,
        name: data.name || 'Player',
        position: { x: 64, y: 0, z: 64 },
        ws: ws,
    });
    
    console.log(`[GAME] Player added to game, now ${game.players.size} players`);

    // Send world state to player
    console.log(`[NETWORK] Sending WORLD_STATE to client`);
    const worldState = {
        type: 'WORLD_STATE',
        data: {
            gameId,
            size: 128,
            seed: 12345,
        },
    };
    console.log(`[NETWORK] WORLD_STATE payload:`, worldState);
    ws.send(JSON.stringify(worldState));
    console.log(`[NETWORK] ✓ WORLD_STATE sent`);

    // Notify other players
    console.log(`[GAME] Notifying ${game.players.size - 1} other players of join`);
    for (const [id, player] of game.players) {
        if (id !== playerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'PLAYER_JOIN',
                playerId,
                name: data.name,
            }));
            console.log(`[NETWORK] ✓ PLAYER_JOIN sent to ${id}`);
        }
    }

    callback(playerId, gameId);
}

function handleSpellCast(gameId, data) {
    console.log(`[SPELL] handleSpellCast for game: ${gameId}`);
    const game = games.get(gameId);
    if (!game) {
        console.error(`[SPELL] Game not found: ${gameId}`);
        return;
    }

    console.log(`[SPELL] Broadcasting spell to ${game.players.size} players`);
    // Broadcast spell cast to all players
    for (const [, player] of game.players) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'SPELL_CAST',
                data,
            }));
            console.log(`[SPELL] ✓ Spell broadcast sent`);
        }
    }
}

function handlePlayerMove(gameId, playerId, data) {
    console.log(`[MOVE] handlePlayerMove for ${playerId} in game ${gameId}`);
    const game = games.get(gameId);
    if (!game) {
        console.error(`[MOVE] Game not found: ${gameId}`);
        return;
    }

    const player = game.players.get(playerId);
    if (player) {
        player.position = { x: data.x, y: data.y, z: data.z };
        console.log(`[MOVE] Position updated for ${playerId}`);

        // Broadcast to other players
        let broadcast = 0;
        for (const [id, otherPlayer] of game.players) {
            if (id !== playerId && otherPlayer.ws.readyState === WebSocket.OPEN) {
                otherPlayer.ws.send(JSON.stringify({
                    type: 'PLAYER_MOVE',
                    playerId,
                    x: data.x,
                    y: data.y,
                    z: data.z,
                }));
                broadcast++;
            }
        }
        console.log(`[MOVE] Broadcasted to ${broadcast} players`);
    } else {
        console.error(`[MOVE] Player not found: ${playerId}`);
    }
}

function handlePlayerLeave(gameId, playerId) {
    console.log(`[LEAVE] handlePlayerLeave for ${playerId} in game ${gameId}`);
    const game = games.get(gameId);
    if (!game) {
        console.error(`[LEAVE] Game not found: ${gameId}`);
        return;
    }

    game.players.delete(playerId);
    console.log(`[LEAVE] Player removed, ${game.players.size} players remain`);

    // Notify other players
    console.log(`[LEAVE] Notifying ${game.players.size} players of leave`);
    for (const [, player] of game.players) {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'PLAYER_LEAVE',
                playerId,
            }));
            console.log(`[LEAVE] ✓ PLAYER_LEAVE sent`);
        }
    }
}

server.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SERVER] ✓ Wizard Terrain Modifier server started`);
    console.log(`[SERVER] Listening on port ${PORT}`);
    console.log(`[SERVER] Open http://localhost:${PORT} in browser`);
    console.log(`[SERVER] Ready to accept connections`);
    console.log(`${'='.repeat(60)}\n`);
});
