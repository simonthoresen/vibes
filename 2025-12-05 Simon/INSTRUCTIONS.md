# Wizard Terrain Modifier - Game Design Document

## Overview
A multiplayer JavaScript game where players take on the role of wizards inhabiting a large island world. Players can modify terrain in real-time, affecting the landscape and liquid flow systems. The world is rendered as a 3D heightmap with physics-based water simulation.

## Core Features

### 1. World & Terrain System
- **Heightmap-Based World**: Large island terrain generated from a heightmap
  - Heightmap stored as a 2D grid of elevation values
  - Island surrounded by sea at base elevation (0)
  - Terrain heights range from -100 to +500 units
  - **Configurable Island Size**:
    - Square grid dimensions: 64x64, 128x128, 256x256, 512x512, or custom
    - Player-selectable when creating game (Host Game menu)
    - Larger islands support more players and longer gameplay
    - Affects memory usage and performance: 64x64 (minimal), 512x512 (high detail)
  
  - **Island Generation Bounds**:
    - Island fills approximately 60-70% of the heightmap with terrain above sea level
    - Center of map is highest probability for land
    - Edges gradually transition to sea
    - Generated terrain respects the square boundary
  
  - **Out-of-Bounds Behavior**:
    - Player can move beyond the heightmap boundary
    - Out-of-bounds terrain elevation: Fixed -50 units (shallow sea level)
    - Cannot modify terrain height outside bounds (spells have no effect)
    - Terrain mesh doesn't render outside bounds (culled)
    - Water flows to edge and stops (simulated as having fixed elevation)
    - Visual indicator: Horizon shows endless sea beyond island edge
    - Server validates that spell casts don't target out-of-bounds area

- **Procedural Generation**:
  - **Seed-Based**: World generated from a single seed value for reproducibility
    - Same seed always generates identical terrain
    - Player-selectable seed or auto-generated random seed
  
  - **Generation Algorithm**:
    - Multi-layered Perlin/Simplex noise at different scales
    - Primary layer: Large landmass features (1-4 octaves, large frequency)
    - Secondary layer: Hills and valleys (3-6 octaves, medium frequency)
    - Tertiary layer: Surface detail (4-8 octaves, high frequency)
    - Blend layers with weighted averages
    - Apply island mask to ensure water surrounds terrain within bounds
    - Scale output to height range (-100 to +500)
    - Optional smoothing pass to reduce harshness
  
  - **Island Generation**:
    - Generate base Perlin noise across entire grid (within configured size)
    - Apply radial falloff: Center highest, edges decrease to sea level
    - Ensure perimeter is all water (-100 elevation) or near-sea level
    - Control: Island size (configurable), roughness, number of peaks
    - Island occupies central 60-70% of heightmap area

- **3D Rendering**:
  - WebGL-based 3D renderer
  - Terrain rendered as triangulated mesh from heightmap
  - Efficient LOD (Level of Detail) system for distant terrain
  - Dynamic mesh updates when terrain is modified
  - **Texture Splatting System** (see below)

- **Texture Splatting & Material System**:
  - **Texture Selection Rules**: Based on local terrain properties
    
    **Elevation-Based Textures**:
    - Sand (0-15 units): Beach/dunes texture near sea level
    - Grass (15-100 units): Grassy meadows, common texture
    - Forest (50-150 units): Darker green, densely packed trees
    - Rock (100+ units): Gray/brown rocky texture on mountains
    - Snow (350+ units): White snow texture on peaks
    - Water (0 and below): Already rendered as water mesh
    
    **Slope-Based Textures** (priority override):
    - Steep slope (>45°): Use rock/cliff texture regardless of elevation
    - Medium slope (25-45°): Rock-grass blend
    - Gentle slope (<25°): Use primary elevation texture
    
    **Feature-Based Textures**:
    - Scorched/burned: Dark charred texture after fireball spells
    - Overgrown: Dense vegetation texture after bloom spells
    - Cracked/fractured: Fault-line texture after earthquake spells
    - Icy: Frosted/blue-tinted texture after freeze spells
  
  - **Implementation**:
    - Calculate slope at each vertex using height differences to neighbors
    - Store texture rules in lookup table (elevation ranges, slope thresholds)
    - Per-vertex blending: Interpolate between textures at boundaries
    - Use splatmap (RGBA texture) to blend up to 4 textures per pixel
    - Multiple splatmaps for more textures if needed
    - Pre-calculate texture weights in heightmap update phase
    - Cache texture assignments to minimize per-frame calculations
  
  - **Texture Properties**:
    - Diffuse color map (main color)
    - Normal map (for surface detail and lighting)
    - Roughness map (for material properties)
    - Ambient Occlusion map (for shadow detail)
  
  - **Transitions**:
    - Smooth blending at elevation boundaries (not hard edges)
    - Blend 2-3 textures in transition zones
    - Avoid obvious texture seams using noise-based blending

### 1.5 Environmental Objects System

- **Trees**:
  - **Generation**: Spawned during island creation
    - Placed on stable terrain (slope < 25°, elevation 20-300 units)
    - Use perlin noise cluster pattern for realistic forest groupings
    - Density varies by region based on secondary noise layer
    - Avoid placement too close to steep cliffs or water
    - Can spawn in grassy or forest-textured areas
  
  - **Tree Model** (Low-Poly):
    - Trunk: Cylinder (8-16 sides) with brown material
    - Canopy: 1-2 cone or sphere meshes with green material
    - Total: 100-300 polygons per tree
    - Height: 8-15 units
    - Texture: Simple repeating bark texture on trunk, leaf texture on canopy
  
  - **Physics**:
    - Initially rooted (kinematic, no physics until knocked over)
    - Rooted flag: Must be true when spawned
    - On impact from spells/projectiles >threshold: Set rooted=false
    - Once falling: Dynamic rigid body with gravity, friction, and collision
    - Can roll/slide down slopes
    - Stop moving when velocity near zero (sleep flag)
  
  - **Burning System**:
    - Trees can catch fire from Fireball spell or other fire effects
    - Burning flag tracks fire state
    - Visual: Change material to darker orange/red tint
    - Emit smoke and flame particles from canopy
    - Burning lasts 10-30 seconds, then tree is destroyed
    - Drop charred remains (small low-poly ash debris)
    - Wood/ash particles scatter when fully burned
    - Cannot be re-rooted once burned
  
  - **Interaction**:
    - Block line-of-sight (for spell targeting)
    - Block player movement until displaced
    - Can be frozen (locked in place temporarily)
    - Can be blown over by Tornado spell
    - Create sound on impact (thud, crack)

- **Rocks**:
  - **Generation**: Spawned during island creation
    - Placed on stable-to-moderate terrain (slope < 40°, elevation -50 to 400 units)
    - More common at higher elevations and steep areas
    - Cluster in formations on mountain peaks
    - Use noise-based placement similar to trees
  
  - **Rock Model** (Low-Poly):
    - Irregular shape: Use procedural generation or pre-made low-poly shapes
    - Jagged, geometric appearance (20-60 polygon versions at different LODs)
    - Grayscale material with normal map for detail
    - Various sizes: 0.5-3 unit scale
    - No texture UV seams (mostly procedural shading)
  
  - **Physics**:
    - Always dynamic (can roll/tumble)
    - Heavy default mass (resists movement but can roll down slopes)
    - Affected by gravity and slope
    - Can be pushed by spells and player explosions
    - Roll naturally down hills and gather in valleys
    - Settle and sleep when velocity near zero
  
  - **Interaction**:
    - Block player movement and line-of-sight
    - Can be broken by Meteor Strike or Earthquake spells
    - Break into smaller rock fragments (3-5 pieces)
    - Fragments roll downhill
    - Create dust particles on impact
    - Sound effects on collision (crashing rock sounds)

- **Grass Patches**:
  - **Generation**: Placed on gentle slopes with grass texture
    - Distributed across grassy areas
    - Cluster in small patches (5-20 blades per patch)
    - More common in lower-elevation areas (20-100 units)
    - Avoid placement on steep slopes or rock areas
  
  - **Rendering** (Ultra-Efficient):
    - Each grass blade: Simple quad (2 triangles) with 1-pixel wide blade texture
    - Facing camera billboard mode (always face viewer)
    - Texture: Simple thin green leaf shape
    - No separate geometry per blade; use instancing
    - All grass in region batched into single mesh per 64x64 chunk
  
  - **Wind Animation**:
    - Sine wave animation in vertex shader
    - Wind speed varies: 0.5-2.0 units/sec
    - Blade height: 0.3-1.0 units
    - Sway amplitude: 0.1-0.3 units horizontal
    - Different offset per blade for natural stagger
    - Wind direction: Consistent across all grass, can change slowly
  
  - **Wind System** (Global):
    - Base wind speed and direction
    - Occasionally shift direction (every 10-30 seconds)
    - Smooth interpolation between wind changes
    - Stored as uniform in shader for all vegetation
    - Can be affected by tornado spell (temporarily increase wind)
  
  - **Destruction**:
    - Grass removed if terrain is modified in area
    - Regenerate when terrain stabilizes
    - Destroyed by fire or heavy impact
    - Regenerate naturally over time (1-2 minutes) on undamaged terrain

- **Physics Configuration**:
  - **Tree Mass**: 10-20 kg (rooted initially)
  - **Rock Mass**: 50-200 kg (varies by size)
  - **Friction**: 0.6 for rocks, 0.8 for trees
  - **Restitution**: 0.2 (low bounce)
  - **Collision Groups**: Objects interact with terrain and each other
  - **Sleep Threshold**: Velocity < 0.1 units/sec

- **File Structure Addition**:
  ```
  ├── js/
  │   ├── environmentObjects.js  # Tree/rock spawning and management
  │   ├── treeManager.js         # Tree-specific logic, burning
  │   ├── rockManager.js         # Rock-specific logic, destruction
  │   ├── grassSystem.js         # Grass rendering and wind animation
  │   ├── physics.js             # Physics engine integration
  │   └── windSystem.js          # Global wind system
  ├── assets/
  │   ├── models/
  │   │   ├── tree.obj           # Tree model
  │   │   └── rock.obj           # Rock model (or procedurally generated)
  │   ├── textures/
  │   │   ├── bark.png           # Tree trunk texture
  │   │   ├── leaves.png         # Tree canopy texture
  │   │   ├── rock.png           # Rock texture
  │   │   ├── grass_blade.png    # Single grass blade texture
  │   │   └── ash.png            # Ash particle texture
  ```

### 2. Player Character
- **Character Model**: Flat 2D sprite (billboarded)
  - Always faces camera
  - Walks on terrain surface, maintaining elevation from heightmap
  - Smooth movement and animation states (idle, walking, casting)

- **Movement**:
  - WASD for movement (configurable in settings)
  - Character slides up/down slopes naturally based on terrain
  - Max movement speed: 10 units/sec
  - Acceleration/deceleration for smooth feel
  - **Jumping**:
    - Spacebar to jump (configurable in settings)
    - Jump height: 5-8 units, affected by gravity
    - Can jump while airborne for double-jump (optional feature)
    - Landing creates small dust particle effect

- **Wizard Abilities**:
  - Terrain modification spells (raise/lower terrain)
  - Spell targeting: raycast from camera through cursor
  - Area-of-effect modifications (circular brush)
  - Modification radius: 10-30 units adjustable
  - Intensity: 1-5 height units per cast adjustable

### 3. Camera System
- **Free-Roaming Orbital Camera**:
  - Orbits around the player character
  - Can move up/down freely (not restricted to terrain)
  - Mouse look for rotation (right-click drag)
  - Scroll wheel for zoom (distance from player: 5-100 units)
  - Smooth follow of player movement
  - Camera height independent of terrain

- **Controls**:
  - Right-click + drag: Rotate camera around player
  - Scroll wheel: Zoom in/out
  - Player position always centered on screen

### 4. Liquid System (Water/Lava)
- **Fluid Simulation**:
  - Physics-based water that responds to terrain slope
  - Water flows downhill following terrain gradient
  - Support for multiple liquid types (water, lava, etc.)
  - Each liquid cell tracks: volume, source (if artificial), age

- **Water Mechanics**:
  - Water seeks lowest points on map
  - Flows into valleys and creates rivers
  - Forms waterfalls at terrain edges
  - Accumulates in low basins
  - Eventually reaches sea level or creates lakes
  - Multiple passes per frame to simulate flow dynamics

- **Simulation Algorithm**:
  - Heightmap-based shallow water equations
  - Each terrain grid cell tracks water volume/depth
  - Per-frame update:
    1. Calculate water level = terrain height + water depth
    2. Calculate pressure gradients to adjacent cells
    3. Flow water downslope from high to low cells
    4. Evaporate small amounts over time (optional)
  - Update frequency: Every 2-4 game frames for performance

- **Visual Rendering**:
  - Transparent/translucent water surface
  - Animated water shader with wave patterns
  - Waterfalls render as streaming particles or geometry
  - Different colors for different liquid types

### 5. Terrain Modification System
- **Spell Categories**:

  **Terrain Manipulation**:
  1. **Raise Terrain**: Lift ground in circular area
  2. **Lower Terrain**: Depress ground in circular area
  3. **Level Terrain**: Flatten area to average height
  4. **Smooth Terrain**: Blend area with surroundings
  5. **Add Water Source**: Create a water spring at location

  **Offensive Spells**:
  6. **Fireball**: Launch explosive projectile that damages terrain and creates impact crater
     - Leaves scorched earth (darkened texture)
     - Can ignite vegetation or objects
     - Creates heat distortion visual effect
     - Radius of effect: 15-25 units
     - Cooldown: 2 seconds
  
  7. **Tornado**: Create spinning vortex that lifts and scatters terrain
     - Moves across terrain following player aim direction
     - Deforms terrain in chaotic pattern
     - Lifts water and disperses it
     - Visual: Rotating funnel with particle effects
     - Duration: 3-5 seconds
     - Cooldown: 4 seconds

  8. **Lightning Storm**: Strike multiple ground locations with lightning
     - Random strikes in targeted area over duration
     - Creates impact craters and burns terrain
     - Electrifies water (visual glow effect)
     - Area coverage: 30-40 unit radius
     - Duration: 3-4 seconds
     - Cooldown: 5 seconds

  9. **Meteor Strike**: Summon falling meteors from sky
     - Multiple meteors rain down in sequence
     - Large impact craters on terrain
     - Sends tremor waves across landscape
     - Affects broad area: 50+ unit radius
     - Duration: 4-6 seconds
     - Cooldown: 6 seconds

  **Utility Spells**:
  10. **Time Warp**: Reverse recent terrain changes in area
      - Undo last N seconds of modifications locally
      - Visual rewind effect as terrain animates back
      - Radius: 20-30 units
      - Cooldown: 3 seconds

  11. **Ice Storm**: Freeze terrain and water in area
      - Temporarily solidifies flowing water
      - Creates icy terrain texture
      - Slows down any liquid flow
      - Duration: 10-15 seconds
      - Radius: 25-35 units
      - Cooldown: 3 seconds

  12. **Earthquakes**: Shake and fracture terrain
      - Creates fault lines and crevasses
      - Triggers avalanches on slopes
      - Can rupture terrain into islands
      - Magnitude adjustable
      - Cooldown: 4 seconds

  **Defensive Spells**:
  13. **Terrain Shield**: Create raised barrier of earth
      - Instantly raises wall of terrain
      - Blocks spell effects and projectiles
      - Wall height: 10-20 units
      - Duration: 5-10 seconds
      - Cooldown: 3 seconds

  14. **Healing Restore**: Repair damaged terrain to original state
      - Reverses damage in small area
      - Fills in craters and smooths damage
      - Only affects recent damage
      - Radius: 15-20 units
      - Cooldown: 2 seconds

  **Environmental Spells**:
  15. **Vegetation Bloom**: Overgrow plant life instantly
      - Changes terrain texture to overgrown
      - Can hide terrain modifications
      - Visual indicator of spell area
      - Cooldown: 1 second

  16. **Earthquake Crack**: Create deep chasms/valleys
      - Splits terrain into separate sections
      - Creates dramatic valleys and canyons
      - Can redirect water flow
      - Visual: Glowing fault line
      - Cooldown: 5 seconds

- **Spell Modification Constraints**:
  - Don't allow terrain modifications outside heightmap bounds
  - Don't allow terrain below sea level (-100)
  - Don't allow terrain above max height (+500)
  - Smooth modifications at brush edges to avoid hard edges
  - Cooldown between casts (0.5-1 second)
  - Mana/energy system if desired
  - Server validates all spell casts are within bounds before applying

- **Undo/History**:
  - Track terrain state changes
  - Limited undo stack (last 10-20 actions)
  - Network sync of all terrain modifications

### 6. Multiplayer System

- **Hybrid Client-Server Architecture**:
  - Game client can act as both player client AND server simultaneously
  - Anyone can host a game by pressing "Host Game" in menu
  - Host runs a lightweight server embedded in the game client
  - Other players connect to the host as remote clients
  - Host player has no latency advantage (same game loop as remote players)

- **Session Management**:
  - **Hosting**: Player launches game, selects "Host Game"
    - Choose island size: 64x64, 128x128, 256x256, 512x512, or custom
    - Input or generate seed for world
    - Set world parameters: difficulty, player limit, etc.
    - Server starts listening on configurable port (default 8080)
    - Host generates a session ID (e.g., random 6-char alphanumeric)
    - Display session ID/join code and optional NAT traversal info
    - All clients receive same island size, seed, and generate identical terrain locally
  
  - **Joining**: Player selects "Join Game"
    - Enter host's IP address and port OR session ID (if using relay)
    - Attempt WebSocket connection to host
    - Receive initial world state (heightmap, water state, other players)
    - Sync join notification to all players
  
  - **Player Limit**: 2-8 players per session (configurable)
  - **Session Persistence**: Host maintains game state while players are connected
  - **Host Migration** (optional): If host leaves, elect new host to continue game

- **Network Architecture**:
  - Primary: WebSocket for client-server communication
  - Fallback: WebRTC data channels for peer-to-peer if direct connection fails
  - Relay server (optional): For NAT traversal if players can't connect directly
  - Connection establishment: Client initiates connection to host IP:port

- **Authority Model**:
  - Host/server has authority over:
    - Terrain state (all modifications validated)
    - Liquid simulation state
    - Collision and spell effects
  - Client-side prediction for:
    - Player movement (interpolated on other clients)
    - Camera position (local only)
    - Spell casting (confirmed by server)
  - Server validates all player actions before applying

- **Synchronization**:
  - **Initial Sync**: New player receives:
    - Island size and seed
    - Complete heightmap data
    - Current water volume map
    - All active players' positions and states
    - Game configuration and world parameters
    - All clients generate terrain identically from seed and size
  
  - **Continuous Updates**:
    - Player positions: 20-30 Hz to all other players
    - Terrain modifications: 10 Hz or event-based (only changed cells)
    - Liquid flow state: 5 Hz or every N simulation steps
    - Chat/emotes: As needed

  - **Terrain Change Protocol**:
    - Player casts spell, sends modification request to host
    - Host validates spell (in range, on cooldown, etc.)
    - Host applies modification to heightmap
    - Host broadcasts delta update to all clients
    - All clients apply same modification identically
  
  - **Liquid State Consistency**:
    - Water simulated on server using fixed random seed
    - Simulated identically on all clients using same seed
    - Periodic checksum verification to catch desyncs

- **Networking Details**:
  - Message Format: JSON over WebSocket
  - Update frequency: 20-30 Hz for positions, event-driven for terrain
  - Bandwidth optimization:
    - Delta compression: Only send changed heightmap cells
    - Position quantization: Round to 0.1 unit precision
    - Compress large data (heightmaps) with gzip
    - Throttle updates based on available bandwidth
  - Latency handling:
    - Display remote players with interpolation
    - Queue incoming state updates
    - Show latency indicator in UI

- **Connection Management**:
  - Heartbeat/ping every 5 seconds to detect disconnects
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s)
  - Timeout: Disconnect after 15 seconds no response
  - Handle mid-game disconnections gracefully
  - Player leaves game if disconnect not recovered within 30 seconds
  - Inform other players when someone disconnects

### 7. Particle System
- **Overview**: Efficient, scalable particle engine for weather, spell effects, and environmental visuals
  - Support for thousands of particles without significant performance impact
  - Pool-based particle allocation for memory efficiency
  - GPU-accelerated rendering using instancing

- **Particle Types**:
  - **Spell Effects**: Fireballs, lightning, tornado debris, meteor trails
  - **Weather**: Rain, snow, fog, dust storms, clouds (see Weather System section), lensflare
  - **Environmental**: Waterfalls, steam, smoke, embers, sparks
  - **Impact Effects**: Dust clouds, debris, terrain explosions
  - **Ambient**: Floating particles, magical auras, light effects, stars (night sky)

- **Architecture**:
  - **Particle Emitters**: Individual sources that spawn particles
    - Position, velocity, lifetime, color, size parameters
    - Emission rate: particles per second (configurable)
    - Emission shape: point, sphere, cone, line
  
  - **Particle Pools**: Pre-allocated arrays of particles
    - Avoid garbage collection during gameplay
    - Reuse particle objects across emitters
    - Configurable max particles (e.g., 10,000)
  
  - **GPU Instancing**: Render many particles with single draw call
    - Use BufferGeometry for particle data
    - Instance matrix for position/rotation/scale
    - Reduces draw calls from thousands to <10

- **Particle Properties**:
  - Position, velocity, acceleration
  - Lifetime (age/maxAge)
  - Color (start/end for fade effects)
  - Size (start/end for scaling effects)
  - Rotation and angular velocity
  - Opacity/transparency
  - Custom properties (heat, wind influence, etc.)

- **Update System**:
  - Per-frame update of all active particles
    - Apply velocity and acceleration
    - Update lifetime
    - Interpolate color and size based on age
    - Remove particles when lifetime expires
  - Efficient iteration only over active particles
  - Optional physics (gravity, drag, wind)

- **Spell Effect Examples**:
  - **Fireball**: Orange/red particles expanding outward with upward drift
  - **Lightning**: Bright blue/white particles following strike path
  - **Tornado**: Spiraling debris particles rotating around center
  - **Meteor**: Glowing particles trailing behind falling objects
  - **Explosion**: Dust cloud expanding radially with some particles falling
  - **Burning Trees**: Orange/red flames and gray smoke particles streaming upward
  - **Rock Impact**: Dust cloud particles expanding outward from impact point
  - **Grass Sway**: Wind-driven animation (not particles, but procedural)

- **Weather System**:
  - **Cloud System**:
    - Cloud meshes positioned in sky above island
    - Multiple cloud types: Cumulus (small/fluffy), Stratus (large layers), Nimbus (dark/heavy)
    - Cloud density and type affected by weather state
    - Sunny: Few small cumulus clouds (2-5)
    - Cloudy: Medium cloud coverage (10-15 clouds)
    - Rainy: Dense dark nimbus clouds (20-30)
    - Stormy: Very dark, fast-moving clouds (30-40+)
    - Wind-driven movement: Clouds move at different speeds per altitude layer
    - Smooth transitions between weather states (clouds move in/out over time)
    - Layered rendering: Clouds at different heights for depth
    - Optional: Cloud shadows cast on terrain below
  
  - **Weather States**:
    - **Sunny**: Few clouds, clear sky, bright lighting
      - Rain density: 0%
      - Cloud density: Low (2-5)
      - Cloud color: White/light gray
      - Sky color: Bright blue
    
    - **Cloudy**: Medium cloud coverage, dim lighting
      - Rain density: 0%
      - Cloud density: Medium (10-15)
      - Cloud color: Light to medium gray
      - Sky color: Overcast blue
    
    - **Rainy**: Heavy clouds, rain particles, dim lighting
      - Rain density: 50-100%
      - Cloud density: High (20-30)
      - Cloud color: Dark gray to black
      - Sky color: Very dark blue/gray
      - Thunder sounds (optional)
    
    - **Stormy**: Very dark clouds, heavy rain, wind gusts
      - Rain density: 100%
      - Cloud density: Very high (30-40+)
      - Cloud color: Nearly black
      - Sky color: Dark purple/gray
      - Wind speed multiplier: 2-3x
      - Lightning flashes (bright white) every 2-5 seconds
      - Thunder sounds with delay
  
  - **Weather Transitions**:
    - Gradual change: 30-60 seconds to transition between states
    - Clouds fade in/out smoothly
    - Lighting transitions over time
    - Rain particles fade in/out
    - Wind changes gradually
  
  - **Rain**: Falling particles from sky with wind drift
    - Density adjustable by weather state
    - Splash particles on terrain/water impact
    - Wind-based horizontal velocity
  
  - **Snow**: Slower, drifting particles with swirl
    - Accumulation (optional visual effect)
    - Wind sensitivity
  
  - **Dust Storms**: Turbulent particle movement
    - Swirling patterns
    - Variable opacity
    - Affects visibility
  
  - **Fog**: Larger semi-transparent particles
    - Denser near ground
    - Optional particle system or shader-based

- **Day/Night Cycle**:
  - **Cycle Duration**: Configurable (default 20 minutes real-time = 1 full day/night cycle)
  - **Sun System**:
    - Sun orbits overhead from east to west
    - Position calculated from time: starts at horizon (east), reaches zenith at noon, sets at horizon (west)
    - Lighting: DirectionalLight follows sun position
    - Intensity varies: Lower at sunrise/sunset, peak at noon
    - Color varies: Warm orange/red at sunrise/sunset, white at noon
    - Sunray effect (lensflare when looking at sun)
  
  - **Moon System**:
    - Moon follows opposite path to sun
    - Rises when sun sets, sets when sun rises
    - Same lighting system as sun (but dimmer)
    - Moon phases: Waxing/waning crescent, half-moon, full moon (optional cycling)
    - Position varies throughout night (similar to sun during day)
  
  - **Sky Color**:
    - Transitions smoothly based on sun angle
    - Dawn: Orange/pink gradient
    - Day: Blue with white clouds
    - Dusk: Orange/purple gradient
    - Night: Deep blue/black with stars
  
  - **Ambient Lighting**:
    - Bright and warm: During day
    - Dark and cool: During night
    - Transition smoothly over 2-3 minutes at dawn/dusk
  
  - **Stars**:
    - Static star field visible at night
    - Stars fade in at dusk, fade out at dawn
    - Optional: Twinkling effect
  
  - **Lensflare Effect** (Sun):
    - Triggered when camera looks toward sun (within ~30° cone)
    - Bright white center with concentric rings
    - Rays or streaks extending from center
    - Fades in/out as sun enters/leaves view
    - Increases intensity as sun gets higher in sky
    - Optional post-processing effect or particle-based
  
  - **Time Progression**:
    - Server maintains authoritative time
    - Sent to all clients on join: current time-of-day
    - All clients simulate time identically based on starting time
    - Seamless looping: Day cycles continuously
    - Game clock displays HUD time (optional)

- **Performance Optimization**:
  - **Culling**: Don't update/render particles far from camera
  - **LOD**: Reduce particle count at distance
  - **Emission Throttling**: Reduce new particles when budget exceeded
  - **Batching**: Group emitters with same material into single drawcall
  - **Memory Management**: Pre-allocate pools, avoid allocation during gameplay
  - **Shader Optimization**: Use simple shaders for particles
  - **Budget System**: Hard limit on total active particles (configurable per quality level)

- **Configuration**:
  ```javascript
  ParticleConfig {
    maxParticles: 10000,           // Total particle budget
    emitterLimit: 50,              // Max simultaneous emitters
    spellEffectParticles: 200,     // Per spell effect
    weatherParticles: 2000,        // Active weather
    impactParticles: 300,          // Per impact event
    cullingDistance: 200,          // Only update within distance
    qualityLevels: {
      low: { maxParticles: 2000, emitterLimit: 20 },
      medium: { maxParticles: 5000, emitterLimit: 35 },
      high: { maxParticles: 10000, emitterLimit: 50 }
    }
  }
  ```

- **File Structure Addition**:
  ```
  ├── js/
  │   ├── particleSystem.js       # Main particle engine
  │   ├── particleEmitter.js      # Individual emitter class
  │   ├── particlePool.js         # Memory pooling system
  │   └── particleEffects.js      # Pre-built effects (spells, weather)
  ```

### 8. User Interface
- **HUD Elements**:
  - **Spell Slot Bar** (Bottom of Screen):
    - 10 spell slots displayed in horizontal row
    - Each slot shows: Spell icon, name, keybind label, cooldown timer
    - Currently selected spell highlighted with glow/border
    - Cooldown visual: Radial progress indicator or dimmed overlay
    - Spell slots numbered 1-10 (default keys 1,2,3,4,5,6,7,8,9,0)
    - Click spell slot to select (mouse alternative to keyboard)
    - Hover shows tooltip: Spell name, description, cooldown time
  
  - **Status Bars** (Top-left):
    - Player health (if applicable)
    - Mana/energy (if applicable)
    - Current spell selected indicator
  
  - **Player Info** (Top-right):
    - Connected player names and their positions
    - Connection latency to server
    - FPS counter (debug mode toggle)
  
  - **World Info** (Center-bottom below spell bar):
    - Terrain modification radius indicator (circular outline on terrain)
    - Crosshair or targeting reticle
    - Current wind direction indicator (arrow)
  
  - **Chat/Messages** (Bottom-left):
    - Chat messages from other players
    - System messages (player joined, spell cast, etc.)
    - Input field when typing

- **Menus**:
  - Main menu: Host Game, Join Game, Settings, Quit
  - Host Game: Set world parameters, view session ID, start game
  - Join Game: Enter IP/port or session ID, enter player name
  - Pause menu: Resume, invite friends (share code), settings, quit to menu
  - In-game info: Current players, their positions, latency to each

- **Settings Menu - Controls Tab**:
  - **Spell Keybinds**: Remappable list of 10 spell slots
    - Default: 1,2,3,4,5,6,7,8,9,0
    - Click to rebind: Select slot, press desired key
    - Validate: Prevent duplicate keybinds
    - Reset to Defaults button
  
  - **Movement Controls**:
    - Forward (default W)
    - Back (default S)
    - Left (default A)
    - Right (default D)
    - Jump (default Space)
    - Sprint (default Shift) - optional
  
  - **Camera Controls**:
    - Rotate camera (default Right Mouse Drag)
    - Zoom in/out (default Scroll Wheel)
    - Alternative: Arrow keys for rotation
  
  - **UI Controls**:
    - Pause (default ESC)
    - Chat (default Enter)
    - Player list (default Tab)
  
  - **World Configuration** (Host Game menu):
    - Island size selection: 64x64, 128x128, 256x256, 512x512, custom
    - Seed input (optional, auto-generate if blank)
    - World difficulty
    - Max players
    - Day/night cycle speed
    - Weather frequency
  
  - **General Settings**:
    - Graphics quality (low/medium/high)
    - Sound volume (master, effects, music)
    - Display resolution and fullscreen toggle
    - Mouse sensitivity for camera

- **Visual Feedback**:
  - Cursor changes based on spell selected
  - Highlight on terrain where spell will affect
  - Particle effects for spell casting
  - Sound effects for spell casts and terrain changes
  - Spell slots flash when cooldown completes
  - Visual feedback when spell unavailable (grayed out)

## Technical Implementation Details

### Graphics Stack
- **Graphics Stack**
- **Heightmap Format**: Uint16Array or Float32Array
- **Mesh Generation**: Procedural mesh from heightmap grid
- **Shader System**: Custom shaders for terrain, water, sprites

### Networking Stack
- **WebSocket Server**: Embedded in game client for hosting
  - Listen on configurable port (default 8080)
  - Handle multiple concurrent client connections
  - Message routing and broadcast
  
- **Connection Protocol**:
  - Client initiates: `ws://host-ip:port`
  - Handshake: Client sends join request with player name
  - Server responds with game state or rejection
  - Maintain persistent connection throughout session
  
- **Message Types**:
  - `PLAYER_MOVE`: Position and rotation updates
  - `SPELL_CAST`: Terrain modification request with validation
  - `TERRAIN_UPDATE`: Terrain delta from server to clients
  - `LIQUID_UPDATE`: Liquid state synchronization
  - `PLAYER_JOIN`: New player joined notification
  - `PLAYER_LEAVE`: Player disconnected
  - `CHAT`: Chat messages between players
  - `PING/PONG`: Connection keep-alive
  
- **Libraries**:
  - ws (Node.js) or native WebSocket for server
  - ws client or native WebSocket for client connections

### Performance Optimization
- **Terrain LOD**: Reduce polygon count for distant terrain
- **Frustum Culling**: Only render visible terrain and objects
- **Instancing**: Draw multiple sprites and grass blades efficiently
- **Spatial Partitioning**: Divide world into chunks for updates and culling
- **Water Simulation**: Update only affected cells, not entire map
- **Particle System**: GPU-instanced rendering, object pooling, culling (see Particle System section)
- **Object Culling**: Only simulate physics and render trees/rocks within camera frustum
- **Grass Batching**: All grass in chunk rendered with single draw call via instancing
- **Physics LOD**: Reduce physics update frequency for distant objects
- **Cloud LOD**: Simplify distant clouds, reduce cloud count at distance
- **Lighting Optimization**: Use baked lighting where possible, shadow map caching

### Graphics Stack
- **Framework**: Three.js or Babylon.js for 3D rendering
- **Heightmap Format**: Uint16Array or Float32Array
- **Mesh Generation**: Procedural mesh from heightmap grid
- **Shader System**: Custom shaders for terrain, water, sprites
- **Noise Library**: Perlin or Simplex noise for procedural generation
  - Use library like `simplex-noise` or `perlin-noise-3d` npm packages
  - Seed-based RNG for deterministic generation

### Texture System
- **Texture Assets**:
  - Sand: Beach/sandy texture (low elevation)
  - Grass: Grassy meadow texture (mid elevation)
  - Forest: Dense green/tree texture (mid-high elevation)
  - Rock: Gray rocky/cliff texture (steep slopes)
  - Snow: White snow texture (high elevation, >350 units)
  - Scorched: Burned/charred texture
  - Overgrown: Heavily vegetated texture
  - Cracked: Fault-line/fractured texture
  - Icy: Frosted/crystalline texture

- **Splatmap Generation**:
  - Pre-compute texture weights for each vertex
  - Store in RGBA texture channels (up to 4 textures blended)
  - Regenerate splatmaps only when terrain changes significantly
  - Use trilinear filtering for smooth texture transitions

### File Structure
```
game/
├── index.html              # Main entry point
├── server.js              # Embedded WebSocket server (runs when hosting)
├── js/
│   ├── main.js            # Game initialization
│   ├── renderer.js        # 3D rendering system
│   ├── terrain.js         # Heightmap & terrain mesh
│   ├── terrainGenerator.js # Procedural terrain generation from seed
│   ├── textureSystem.js   # Texture splatting & material selection
│   ├── environmentObjects.js  # Tree/rock spawning and management
│   ├── treeManager.js     # Tree-specific logic, burning, rooting
│   ├── rockManager.js     # Rock-specific logic, destruction
│   ├── grassSystem.js     # Grass rendering and wind animation
│   ├── windSystem.js      # Global wind system
│   ├── weatherSystem.js   # Weather state management and transitions
│   ├── cloudSystem.js     # Cloud rendering and movement
│   ├── skySystem.js       # Sky color, stars, and day/night cycle
│   ├── lightingSystem.js  # Sun/moon lighting, lensflare effects
│   ├── timeSystem.js      # Game time progression and synchronization
│   ├── physics.js         # Physics engine integration
│   ├── water.js           # Liquid simulation
│   ├── player.js          # Player character logic and jumping
│   ├── camera.js          # Camera controller
│   ├── spells.js          # Terrain modification spells
│   ├── particleSystem.js  # Main particle engine
│   ├── particleEmitter.js # Individual emitter class
│   ├── particlePool.js    # Memory pooling system
│   ├── particleEffects.js # Pre-built effects (spells, weather)
│   ├── networking.js      # Client-side networking (connect/send/receive)
│   ├── hostServer.js      # Host server logic (runs in separate worker/thread)
│   ├── input.js           # Input handling and keybind management
│   ├── inputManager.js    # Configurable keybinds, control remapping
│   ├── ui.js              # UI rendering (including HUD spell bar)
│   ├── spellBar.js        # Spell slot UI and rendering
│   ├── settingsManager.js # Settings persistence and management
│   ├── menuManager.js     # Host/Join game menus
│   └── config.js          # Game constants & settings
├── assets/
│   ├── models/
│   │   ├── tree.obj           # Tree model
│   │   └── rock.obj           # Rock model (or procedurally generated)
│   ├── textures/
│   │   ├── bark.png           # Tree trunk texture
│   │   ├── leaves.png         # Tree canopy texture
│   │   ├── rock.png           # Rock texture
│   │   ├── grass_blade.png    # Single grass blade texture
│   │   └── ash.png            # Ash particle texture
│   ├── sounds/
│   └── models/
├── package.json           # Node dependencies
└── styles.css             # UI styling
```

## Game Loop
1. **Input**: Capture player input (movement, spells, camera)
2. **Update Physics**: 
   - Update player position based on movement
   - Simulate liquid flow
   - Update water surface
3. **Synchronize Network**: Send updates to server, receive changes
4. **Render**:
   - Update camera position
   - Render terrain mesh
   - Render water
   - Render player sprites (self + other players)
   - Render UI/HUD
5. **Repeat**: 60 FPS target

## Control Scheme

### Movement
- **W/A/S/D**: Move forward/left/back/right
- **Spacebar**: Jump
- **Shift**: Sprint (optional)

### Camera
- **Right Mouse Button + Drag**: Rotate camera
- **Scroll Wheel**: Zoom in/out
- **Arrow Keys**: Alternative camera rotation

### Spells
- **1-0 Keys**: Select and cast spell slots 1-10 (default keybinds, configurable)
- **Left Mouse Button**: Alternative spell cast (after slot selected)
- **Right Mouse Button Hold**: Preview spell area/trajectory
- **Q/E**: Adjust spell intensity/radius (optional)
- **F**: Toggle terrain highlight

### UI
- **ESC**: Pause menu
- **Tab**: Player list
- **Enter**: Chat (if applicable)

## Performance Targets
- **FPS**: 60 on mid-range hardware
- **Render Time**: <16ms per frame
- **Network Latency**: <100ms recommended
- **Max Players**: 4-8 per server instance
- **Max World Size**: 512x512 heightmap tiles

## Future Enhancements
- Seasonal changes and weather effects
- Destructible objects and NPCs
- More advanced spell types (elementals, transmutation)
- Persistent worlds with save/load
- Leaderboards and achievements
- Voice chat integration
- Mobile/touch controls
- Procedural terrain generation
- Custom map editor

## Success Criteria
- ✓ Multiplayer game runs stable at 60 FPS
- ✓ Terrain modifications visible across all players
- ✓ Water physics simulate realistically
- ✓ Camera controls feel responsive and smooth
- ✓ Multiple players can simultaneously modify terrain
- ✓ Game playable for 30+ minutes without issues
