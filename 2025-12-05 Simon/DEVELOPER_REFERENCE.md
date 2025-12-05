# Developer Quick Reference

## Architecture Overview

```
Browser Game Client
├── HTML Canvas (WebGL)
├── 35+ JavaScript Modules
└── WebSocket Connection to Server

Node.js Game Server
├── HTTP Server (static files)
├── WebSocket Server
├── Game State Management
└── Message Routing
```

## Key Module Dependencies

```
main.js (Game Orchestrator)
├── renderer.js → Three.js setup
├── terrain.js → heightmap data
├── water.js → liquid simulation
├── player.js → character controller
├── camera.js → camera control
├── spells.js → spell system
├── particleSystem.js → effects
├── environmentObjects.js → trees/rocks
├── windSystem.js → wind simulation
├── weatherSystem.js → weather states
├── cloudSystem.js → cloud rendering
├── skySystem.js → sky dome
├── timeSystem.js → game time
├── lightingSystem.js → sun/moon
├── grassSystem.js → grass rendering
├── ui.js → HUD
├── menuManager.js → menus
├── spellBar.js → spell UI
├── networking.js → WebSocket
└── config.js → all constants
```

## Common Tasks

### Adding a New System

1. Create file: `js/yourSystem.js`
2. Export class with `update(deltaTime)` method
3. Add to Game constructor: `this.yourSystem = null`
4. Initialize in createGame/joinGame
5. Update in game loop
6. Add dispose method cleanup

Example:
```javascript
// js/yourSystem.js
class YourSystem {
    constructor(scene, dependencies) {
        this.scene = scene;
    }
    
    update(deltaTime) {
        // Update logic
    }
    
    dispose() {
        // Cleanup
    }
}
```

### Adding a New Spell

1. Open `js/spells.js`
2. Add to CONFIG.SPELLS array:
```javascript
{
    index: 10,
    name: 'Your Spell',
    icon: 'icon',
    cooldown: 2,
    description: 'Description',
    terrainEffect: true
}
```
3. Add logic in `castSpell()` method
4. Add terrain modification or particle effect

### Modifying Terrain

```javascript
// Raise/lower terrain
this.terrain.modifyTerrain(x, z, radius, amount);

// Get height at position
const height = this.terrain.getHeightAt(x, z);

// Get slope at position
const slope = this.terrain.getSlopeAt(x, z);
```

### Spawning Particles

```javascript
const emitter = new ParticleEmitter(
    position,
    this.scene,
    {
        emission: 100,
        lifetime: 1,
        velocity: new THREE.Vector3(0, 10, 0),
        spread: 0.5
    }
);
this.particleSystem.addEmitter(emitter);
```

### Network Message

```javascript
// Send from client
this.networking.send({
    type: 'spellCast',
    x: pos.x,
    z: pos.z,
    spellIndex: 0
});

// Receive on server
case 'spellCast':
    game.broadcastMessage({
        type: 'spellEffect',
        x: msg.x,
        z: msg.z,
        spellIndex: msg.spellIndex
    });
    break;
```

## Configuration Reference

### Island Sizes
```javascript
CONFIG.TERRAIN.SIZES = {
    64: 64,    // Small
    128: 128,  // Medium (default)
    256: 256,  // Large
    512: 512   // Huge
}
```

### Time Settings
```javascript
CONFIG.TIME = {
    START_TIME: 6 * 60 * 60 * 1000,  // 6 AM
    CYCLE_DURATION: 20 * 60 * 1000   // 20 minutes = 24 game hours
}
```

### Spell Properties
```javascript
{
    index: 0,           // Spell number (0-9)
    name: 'Name',      // Display name
    icon: 'url',       // Icon path
    cooldown: 2,       // Cooldown in seconds
    description: 'Description',
    terrainEffect: true // Modifies terrain
}
```

### Particle Emitter Options
```javascript
{
    emission: 100,     // Particles per second
    lifetime: 1,       // Particle lifetime in seconds
    velocity: Vector3, // Initial velocity
    acceleration: Vector3,
    spread: 0.5,       // Velocity spread factor
    color: 0xff0000,   // Particle color
    size: 1            // Particle size
}
```

## File Organization

```
js/
├── Core (always load first)
│   └── config.js
├── Rendering
│   ├── renderer.js
│   └── textureSystem.js
├── World
│   ├── terrainGenerator.js
│   ├── terrain.js
│   ├── water.js
│   └── player.js
├── Camera & Input
│   ├── camera.js
│   ├── input.js
│   └── inputManager.js
├── Gameplay
│   ├── spells.js
│   ├── particleSystem.js
│   ├── particleEmitter.js
│   ├── particlePool.js
│   └── particleEffects.js
├── Environment
│   ├── environmentObjects.js
│   ├── grassSystem.js
│   ├── windSystem.js
│   ├── weatherSystem.js
│   ├── cloudSystem.js
│   └── skySystem.js
├── Lighting & Time
│   ├── lightingSystem.js
│   └── timeSystem.js
├── UI & Menus
│   ├── ui.js
│   ├── spellBar.js
│   ├── menuManager.js
│   └── settingsManager.js
├── Network
│   └── networking.js
└── Main
    └── main.js
```

## Debug Tips

### Check FPS
- Look at top-left HUD counter
- Target: 60 FPS
- If lower, reduce island size or quality

### Console Logging
```javascript
// Add anywhere
console.log('System state:', this.variableName);
console.time('operationName');
// ... operation ...
console.timeEnd('operationName');
```

### Performance Profiling
- Chrome: F12 → Performance tab → Record
- Firefox: Shift+F5 → Performance tab
- Look for dropped frames in timeline

### Network Debugging
```javascript
// In networking.js
this.socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    console.log('Received:', msg.type, msg);
});
```

### Terrain Visualization
```javascript
// In main.js update
if (DEBUG_TERRAIN) {
    const height = this.terrain.getHeightAt(playerX, playerZ);
    const slope = this.terrain.getSlopeAt(playerX, playerZ);
    console.log(`Height: ${height}, Slope: ${slope}`);
}
```

## Common Bugs & Fixes

### Game Won't Start
- Check console for errors (F12)
- Verify all scripts load (Network tab)
- Check server running (`node server.js`)
- Check port 8080 free

### Terrain Not Updating
- Verify spell cast network message sent
- Check terrain heightmap dimensions
- Ensure mesh.geometry.attributes updated
- Check needsUpdate flag set

### Camera Clipping Through Terrain
- Adjust camera height offset in `js/camera.js`
- Check terrain collision detection
- Verify player height offset

### Low FPS
- Monitor draw calls in Three.js stats
- Reduce particle emitter counts
- Lower terrain resolution
- Disable shadow maps if needed

### Network Lag
- Check server capacity
- Reduce update frequency in config
- Enable message throttling
- Check network latency (HUD shows)

## Git Workflow (Recommended)

```bash
# Branch for new feature
git checkout -b feature/new-system

# Make changes, test
# ...

# Commit with clear message
git commit -m "Add: New system with feature X"

# Merge back to main
git checkout main
git merge feature/new-system
git branch -d feature/new-system
```

## Testing Checklist Template

```javascript
// test.js - Quick test script
function runTests() {
    // Test terrain generation
    const terrain = new Terrain(scene, 128);
    console.assert(terrain.size === 128, 'Terrain size');
    
    // Test spell casting
    const spell = spellSystem.spells[0];
    console.assert(spell.index === 0, 'Spell index');
    
    // Test networking
    networking.send({type: 'test'});
    console.assert(networking.isConnected, 'Network connected');
}
```

## Environment Variables

Set in `config.js` or via URL params:
```javascript
// config.js
const DEBUG = true;        // Enable debug logging
const MAX_FPS = 60;        // Frame rate limit
const NETWORK_DEBUG = false; // Log all network messages
const PHYSICS_DEBUG = false; // Draw debug shapes
```

## Asset Pipeline

### Images
- PNG format recommended
- Size: power of 2 (256x256, 512x512)
- Place in `assets/` directory

### Audio (when implemented)
- WAV/OGG format
- Place in `sounds/` directory

### Textures (procedural)
- Generated in code
- Canvas-based splatmap generation
- Height/slope-based colors

## Performance Optimization Ideas

1. **LOD (Level of Detail)**
   - Lower poly terrain far from camera
   - Disable distant particle emitters

2. **Object Pooling**
   - Already used for particles
   - Apply to projectiles

3. **Frustum Culling**
   - Skip rendering off-screen objects
   - Reduce draw calls

4. **Instancing**
   - Already used for grass
   - Use for trees/rocks

5. **Texture Atlasing**
   - Combine splatmap layers
   - Reduce texture binds

## Resources

### Documentation
- THREE.js Docs: https://threejs.org/docs/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Perlin Noise: https://en.wikipedia.org/wiki/Perlin_noise

### Tools
- Three.js Editor: https://threejs.org/editor/
- Chrome DevTools: F12 (Windows/Linux), Cmd+Opt+I (Mac)
- WebGL Debugger: https://www.khronos.org/webgl/

### References
- Game Architecture: Game Engine Architecture (3rd edition)
- Networking: High Performance Browser Networking
- Graphics: Real-Time Rendering (4th edition)

## Code Style Guidelines

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_PLAYERS = 8;

// Variables: camelCase
let playerPosition = new THREE.Vector3();

// Classes: PascalCase
class SpellSystem { }

// Methods: camelCase
update(deltaTime) { }

// Private: _leadingUnderscore (convention)
_internalMethod() { }

// Comments
// Single line comment
/* Multi-line
   comment
*/

// JSDoc (optional)
/**
 * Updates the system
 * @param {number} deltaTime - Time since last frame
 */
update(deltaTime) { }
```

## Version Control Tips

Ignore files:
```
node_modules/
*.log
.DS_Store
.cache/
dist/
```

Good commit messages:
- `Add: New feature description`
- `Fix: Bug description`
- `Refactor: Code improvement`
- `Docs: Documentation update`
- `Perf: Performance optimization`

---

**Last Updated**: Current
**Maintained By**: Development Team
**Status**: Active Development
