# Wizard Terrain Modifier

A multiplayer 3D terrain modification game where players cast spells to reshape a dynamic island world.

## Quick Start

### Prerequisites
- Node.js v14+ ([Download](https://nodejs.org/))
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Setup (First Time)

```bash
cd "2025-12-05 Simon"
npm install
node server.js
```

Then open `index.html` in your browser.

## Game Features

✓ **Real-time Multiplayer** - Play with friends on shared island
✓ **Terrain Modification** - 10 powerful spells to reshape the world
✓ **Physics-Based Water** - Liquid flows realistically downhill
✓ **Procedural Generation** - Infinite islands from seeds
✓ **Dynamic Lighting** - Day/night cycle with sun/moon
✓ **Weather System** - Clouds, rain, storms with wind effects
✓ **Environment Objects** - Trees, rocks spawn naturally
✓ **Grass & Wind** - Animated flora responds to wind

## Controls

| Action | Keys |
|--------|------|
| Move | W/A/S/D |
| Jump | Spacebar |
| Rotate Camera | Right Mouse + Drag |
| Zoom | Scroll Wheel |
| Cast Spell | 1-0 Keys |

## Game Modes

### Host Game
1. Click "Host Game"
2. Select island size (64-512)
3. Create and wait for others to join

### Join Game
1. Click "Join Game"
2. Enter host address: `localhost:8080`
3. Enter player name
4. Connect and play

## Spells

1. **Raise Terrain** - Lift the ground
2. **Lower Terrain** - Dig downward
3. **Level** - Flatten ground
4. **Smooth** - Reduce jagged edges
5. **Fireball** - Explosive blast
6. **Lightning** - Electric strike
7. **Tornado** - Spinning vortex
8. **Meteor** - Falling projectile
9. **Water Source** - Create water
10. **Time Warp** - Slow effect

## Architecture

- **Frontend**: Three.js 3D rendering, vanilla JavaScript
- **Backend**: Node.js WebSocket server
- **Terrain**: Procedural Perlin noise generation
- **Physics**: Custom water simulation and particle effects
- **Network**: Real-time multiplayer synchronization

## File Structure

```
├── index.html              # Main game entry point
├── styles.css              # UI styling (600+ lines)
├── package.json            # Dependencies (ws, simplex-noise)
├── server.js               # WebSocket game server
└── js/
    ├── main.js             # Game orchestration
    ├── config.js           # Game constants
    ├── terrain.js          # Heightmap & mesh
    ├── terrainGenerator.js # Procedural generation
    ├── player.js           # Player character
    ├── camera.js           # Orbital camera
    ├── spells.js           # Spell system (10 spells)
    ├── water.js            # Physics-based water
    ├── particleSystem.js   # Particle effects
    ├── windSystem.js       # Wind simulation
    ├── grassSystem.js      # Animated grass
    ├── weatherSystem.js    # Weather state machine
    ├── cloudSystem.js      # Cloud rendering
    ├── skySystem.js        # Sky dome with colors
    ├── lightingSystem.js   # Sun/moon lighting
    ├── timeSystem.js       # Day/night cycle
    ├── environmentObjects.js # Trees & rocks
    ├── networking.js       # WebSocket client
    ├── ui.js               # HUD & menus
    ├── spellBar.js         # Spell slot UI
    ├── menuManager.js      # Menu navigation
    ├── input.js            # Input handling
    ├── inputManager.js     # Configurable keybinds
    ├── settingsManager.js  # Persistent settings
    ├── renderer.js         # Three.js setup
    └── textureSystem.js    # Height-based textures
```

## Performance

- **FPS Target**: 60 on mid-range hardware
- **Recommended**: GTX 1060+, 8GB RAM, SSD
- **Island Sizes**: 64x64 (small), 128x128 (medium), 256x256 (large), 512x512 (huge)

## Troubleshooting

**Server won't start**
- Install Node.js and npm
- Run `npm install` to get dependencies

**Game won't load**
- Hard refresh browser (Ctrl+Shift+R)
- Check server is running (`node server.js`)
- Check console for errors (F12)

**Low FPS**
- Reduce island size in settings
- Lower graphics quality
- Close other applications

## Development

The game is built with:
- **Three.js** for 3D rendering
- **WebSocket (ws)** for networking
- **Simplex-noise** for terrain generation
- Vanilla JavaScript (ES6+)

All systems are modular and loosely coupled for easy expansion.

## License

Educational project - Feel free to modify and extend!
