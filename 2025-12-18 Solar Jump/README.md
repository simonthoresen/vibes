# 🌍 Solar Jump 🚀

A multiplayer gravity-based space game built with Three.js and PeerJS where players jump between planets in our solar system!

## Features

- **Solar System Simulation**: All 8 planets orbiting the sun with realistic (scaled) orbits
- **Moons**: One moon per planet (where applicable)
- **Gravity Physics**: Players and grenades are affected by the gravity of all celestial bodies
- **Planet Hopping**: Jump high enough and nearby planets can pull you to them
- **Grenade Combat**: Throw grenades affected by gravity - arc them between planets!
- **Toon Shading**: Stylized cel-shaded graphics
- **Third Person Camera**: Follow mode and free-roaming mode (toggle with Tab)
- **Multiplayer**: Host or join games using PeerJS for peer-to-peer connections

## Controls

- **WASD** - Move on planet surface / Boost in air
- **Space** - Jump (when on ground) / Jetpack boost (when airborne)
- **Left Click** - Throw grenade
- **Tab** - Toggle camera mode (Follow/Sun View)
- **Mouse** - Look around (Follow) / Rotate around sun (Sun View)
- **Mouse Wheel** - Zoom in/out (Sun View only)

## How to Play

1. **Start a Server**:
   ```bash
   npm run dev
   ```
   Or use any HTTP server:
   ```bash
   python -m http.server 8080
   ```

2. **Open the game** in your browser at `http://localhost:8080`

3. **Multiplayer Setup**:
   - **To Host**: Click "Host Game", share your Peer ID with friends
   - **To Join**: Click "Join Game", enter the host's Peer ID, click "Connect"
   - Click "Start Game" to begin

4. **Gameplay**:
   - Move around on planets using WASD
   - Jump with Space - if you jump high enough and another planet is nearby, you might transfer to it!
   - Throw grenades at other players with Left Click
   - Grenades are affected by gravity and can orbit between planets

## Game Mechanics

### Gravity System
- All celestial bodies exert gravitational force on players and grenades
- Larger planets (Jupiter, Saturn) have stronger gravity
- **Increased gravity strength prevents players from leaving the solar system**
- Players can still "orbit transfer" by jumping when planets are close

### Planet Movement
- Planets orbit the sun at different speeds
- Inner planets move faster than outer planets
- Distances are minimized for frequent close encounters

### Player Movement

**On Ground:**
- WASD moves relative to the planet surface
- Space bar jumps upward (reduced force to keep in solar system)
- Player stays anchored to planet surface

**In Air:**
- WASD activates directional boosters for maneuvering
- Space bar activates jetpack (upward boost)
- Jetpack uses an energy system that recharges when not in use
- Gravity from all planets continuously affects trajectory

### Combat
- Grenades are affected by all planetary gravity
- Throw grenades in arcs between planets
- Grenades explode on impact or after 5 seconds

### Camera Modes

**Follow Mode (Default):**
- Third-person view behind player
- Mouse controls player look direction
- Grenades throw toward camera forward

**Sun View Mode:**
- Camera orbits around the sun (center of system)
- Mouse movement rotates around sun
- Mouse wheel zooms in/out (20-200m distance)
- Great for observing the entire solar system

## Technical Details

- **Rendering**: Three.js with toon shading materials
- **Networking**: PeerJS for P2P multiplayer (no server required)
- **Physics**: Custom gravity simulation
- **Architecture**: Modular ES6 design

## File Structure

```
├── index.html          # Main HTML file with UI
├── package.json        # Project configuration
└── src/
    ├── main.js         # Game initialization and loop
    ├── solarSystem.js  # Planet and sun creation/updates
    ├── physics.js      # Gravity calculations
    ├── player.js       # Player controller
    ├── input.js        # Keyboard/mouse input handling
    ├── camera.js       # Camera controller
    ├── grenade.js      # Grenade physics and explosions
    └── network.js      # PeerJS multiplayer networking
```

## Development

The game uses ES6 modules and loads Three.js from CDN. No build step required!

### Adding Features

- **More planets**: Edit `planetData` in `solarSystem.js`
- **Adjust gravity**: Change `G` constant in `physics.js`
- **Modify player physics**: Edit values in `player.js`
- **Change toon shading**: Modify gradient maps in `solarSystem.js`

## Tips & Tricks

- Watch the "Nearest Planet" indicator to time your jumps
- Planets with moons create complex gravity fields
- Try throwing grenades while in free-fall between planets
- Use the free camera mode (Tab) to scout planet positions
- Outer planets move slower - easier to land on!

## Browser Compatibility

Requires a modern browser with:
- WebGL support
- ES6 modules support
- WebRTC support (for multiplayer)

Tested on Chrome, Firefox, and Edge.

## License

MIT

---

**Have fun jumping between planets! 🌎🌙🪐**
