# Diagnostic Logging Guide

Comprehensive logging has been added to both server and client to help debug the "generating terrain" freeze issue.

## Server Logging (server.js)

### Connection Lifecycle
```
[SERVER] ✓ New client connected
[SERVER] Total connections: N
[SERVER] Connection closed
```

### Message Reception
```
[MESSAGE] Received type: JOIN/SPELL_CAST/PLAYER_MOVE/etc
```

### Player Join Handler
```
[JOIN] Player joining - name: PlayerName
[GAME_STATE] Creating new game...
[GAME_STATE] Current games: N
[GAME_STATE] New game created - ID: gameId, Players: N
[PLAYER] Assigning player playerId to game gameId
[WORLD_STATE] Generating terrain...
[WORLD_STATE] ✓ World generated with N terrain cells
[WORLD_STATE] Sending WORLD_STATE to client
[JOIN] ✓ Player assigned: playerId in game: gameId
```

### Spell Casting
```
[SPELL_CAST] Received spell cast: spellId
[BROADCAST] Broadcasting spell to N other players
```

### Player Movement
```
[PLAYER_MOVE] Player at (x, y, z)
[BROADCAST] Broadcasting position to N other players
```

### Player Disconnect
```
[PLAYER_LEAVE] Removing playerId from game gameId
[PLAYER_LEAVE] ✓ Player removed from game
```

### Startup
```
╔════════════════════════════════════════╗
║     GAME SERVER READY FOR ACTION       ║
║  Host: localhost | Port: 8080          ║
║  WebSocket: ws://localhost:8080        ║
║  Static Files: ./                      ║
╚════════════════════════════════════════╝
```

## Client Logging (js/networking.js)

### Connection Establishment
```
[CLIENT] Connecting to ws://localhost:8080...
[CLIENT] ✓ WebSocket connected
[CLIENT] Connection established
[CLIENT] ✓ JOIN message sent to server
```

### Message Reception
```
[CLIENT] Handling message type: WORLD_STATE
[CLIENT] Processing WORLD_STATE
[CLIENT] World data: {...}
[CLIENT] Calling game.loadWorldState()
[CLIENT] ✓ WORLD_STATE processed
```

### Player Management
```
[CLIENT] Adding player - ID: playerId, Name: PlayerName
[CLIENT] ✓ Player added: PlayerName
```

### Position Updates
```
[CLIENT] Updating position for player playerId to (x, y, z)
```

### Spell Casting
```
[CLIENT] Sending message type: SPELL_CAST
[CLIENT] ✓ Message sent
[CLIENT] Spell cast received
```

## Debugging Checklist

### Step 1: Check Server Startup
When running `node server.js`, you should see:
- ✓ The startup banner
- ✓ "[SERVER] ✓ New client connected" when browser connects

### Step 2: Check JOIN Message
In browser console (F12) when clicking "Host Game":
- ✓ "[CLIENT] Connecting to..." appears
- ✓ "[CLIENT] ✓ WebSocket connected" appears
- ✓ "[CLIENT] ✓ JOIN message sent to server" appears

In server terminal:
- ✓ "[MESSAGE] Received type: JOIN" appears
- ✓ "[JOIN] Player joining - name: PlayerName" appears

### Step 3: Check WORLD_STATE
In server terminal, after JOIN:
- ✓ "[WORLD_STATE] Generating terrain..." appears
- ✓ "[WORLD_STATE] ✓ World generated..." appears
- ✓ "[WORLD_STATE] Sending WORLD_STATE to client" appears

In browser console:
- ✓ "[CLIENT] Handling message type: WORLD_STATE" appears
- ✓ "[CLIENT] Processing WORLD_STATE" appears
- ✓ "[CLIENT] Calling game.loadWorldState()" appears

### Step 4: Check Loading Screen
After WORLD_STATE processing:
- ✓ Loading screen should disappear
- ✓ Game world should be visible
- ✓ "[CLIENT] ✓ WORLD_STATE processed" appears in console

## Common Issues & Solutions

### Issue: Client stuck on "Generating terrain..."
**Diagnosis**: 
- Check if "[CLIENT] ✗ Cannot send message" appears → WebSocket not ready
- Check if server shows no "[MESSAGE] Received type: JOIN" → Message not reaching server
- Check if server logs show WORLD_STATE generated but client never receives it → Network issue

**Solutions**:
1. Ensure Node.js is installed: `node --version`
2. Ensure npm packages installed: `npm install` in server directory
3. Check firewall isn't blocking localhost:8080
4. Check browser console for JavaScript errors (F12)
5. Verify server didn't crash (check server terminal output)

### Issue: Server crashes on JOIN
**Diagnosis**: Server logs show error after JOIN message
**Solution**: Check server.js for syntax errors; full error will be in server terminal

### Issue: Players don't see each other
**Diagnosis**: Client logs show all messages but other players not visible
**Solution**: Check game.js for addPlayer() implementation; may need debugging there

## How to Run with Logging

1. Open terminal in `2025-12-05 Simon` directory
2. Run: `node server.js`
3. Open browser: http://localhost:8080
4. Open browser console: F12 → Console tab
5. Click "Host Game" or "Join Game"
6. Watch both terminal and console for log messages
7. Compare timestamps to trace message flow

## Log Format

All logs use prefixes for easy filtering:
- `[SERVER]` - Server-side events
- `[MESSAGE]` - Message received
- `[CLIENT]` - Client-side events
- `[JOIN]` - Player join events
- `[GAME_STATE]` - Game creation/management
- `[WORLD_STATE]` - World generation/transmission
- `[SPELL_CAST]` - Spell events
- `[PLAYER_MOVE]` - Movement events
- `[PLAYER_LEAVE]` - Disconnect events
- `[BROADCAST]` - Message broadcasting
- `[ERROR]` - Error conditions
- `✓` - Success indicator
- `✗` - Failure indicator

Use browser console filter to show only relevant logs:
- Type in filter: `[WORLD_STATE]` to see only terrain logs
- Type: `[CLIENT]` to see only client-side events
- Type: `Error` to see only errors
