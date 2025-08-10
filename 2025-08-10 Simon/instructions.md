    - Explosion particles are rendered on the same z-layer as the item that exploded.
Explosion Effects:

    - When an item explodes, it generates an explosion of rotating particles that match the shape of the item:
        - Cars explode into rectangles
        - Turrets explode into circles
        - Planes explode into triangles
    - The particles move outward from the explosion and fade away.
Afterburner Effect:

    - Each plane has an afterburner effect rendered behind it using particles.
    - The particles flow in the opposite direction of the plane's movement.
Visual Representation:

    - Cars are rendered as rectangles and are always rotated to point in the direction they are moving.
    - Turrets are rendered as circles.
    - Planes are rendered as triangles and are rotated so that the tip points in the direction they are flying.
Power-Ups:

If the player kills all enemy planes in a wave, a power-up appears at the location where the last enemy plane of the wave was destroyed.
    - The power-up is rendered as a yellow star that pulsates.
    - The star is placed on the same z-layer as enemy planes.
    - Stars can be picked up by flying into them.
    - Stars cannot be destroyed.
    - Stars are fixed in world coordinates and will scroll out of the screen and vanish if not picked up.
Z-Ordering (Rendering Order):

Layers and entities should be rendered in the following order (from back to front):
    1. Ground
    2. Turrets
    3. Cars
    4. Bullets from turrets and cars
    5. Clouds
    6. Bullets from the player
    7. Enemy planes
    8. Player plane
Cloud Layer:

There is a layer of clouds above the ground. Clouds are rendered as squares of varying shapes and sizes, colored white with varying transparency.

Cloud Movement:
    - Clouds move faster than the ground layers.
    - Each cloud square can have slight variation in vertical speed.
World & Scrolling:

The world is infinite, with the plane always flying northward. The ground scrolls past below the plane.

Ground:
    - Made up of randomly placed squares of varying sizes.
    - Rendered as a series of 3 parallax layers.
    - Each layer further behind is a darker color than the one in front.

Parallax Layers:
    - 3 layers total.
    - The top layer is the brightest and contains turrets and cars.
    - Turrets are fixed on the top layer and do not move.
    - Cars drive around on the top layer but cannot move where there is no ground square (they would fall off).
Enemy Types:

1. Enemy Plane:
    - Flies in from the top of the screen and exits at the bottom.
    - Planes spawn in waves of 10, staggered so they follow each other.
    - Each wave uses a shared, fixed path chosen at random. The path is a sine-wave with varying width and amplitude.
    - The player can crash with enemy planes.

2. Turret:
    - Stationary on the ground.
    - Shoots bullets directly at the player in a straight line.
    - The player cannot crash with turrets.

3. Car:
    - Moves on the ground.
    - Shoots at the player just like the turret (bullets move in a straight line toward the player).
    - The player cannot crash with cars.

All enemies can be killed by the player shooting at them.
Game Concept: Top-Down Shooter

You control a plane in a top-down shooter game. The plane can be moved using the AWSD keys:
    - W: Move up
    - A: Move left
    - S: Move down
    - D: Move right

The plane automatically shoots a continuous stream of bullets forward. Your objective is to navigate and shoot enemies while avoiding obstacles.
# Instructions for Creating a JavaScript Game

## 1. Project Setup
- Create a new folder for your game assets and code.
- Add an `index.html` file for your game interface.
- Add a `game.js` file for your game logic.
- Optionally, create folders for images (`assets/`), sounds (`sounds/`), and styles (`styles/`).

## 2. HTML Structure
- In `index.html`, set up a basic HTML5 structure.
- Add a `<canvas>` element for rendering the game.
- Link your `game.js` script at the end of the `<body>`.

## 3. Game Loop
- In `game.js`, set up a main game loop using `requestAnimationFrame`.
- Update game state and render graphics in each frame.

## 4. Input Handling
- Listen for keyboard and/or mouse events to control the game.
- Update player or game state based on input.

## 5. Game Objects
- Define classes or objects for players, enemies, and other entities.
- Manage their properties (position, speed, health, etc.) and behaviors.

## 6. Rendering
Use the Canvas API to draw game objects each frame.
Clear the canvas before each draw to avoid artifacts.

### Geometric Primitive Rendering
- Draw all game objects using geometric primitives (rectangles, circles, triangles, polygons) with the Canvas API.
- Use `fillStyle` for color and `globalAlpha` for transparency.
- Example:
```js
// Draw a square
ctx.globalAlpha = 0.7;
ctx.fillStyle = '#3498db';
ctx.fillRect(x, y, size, size);

// Draw a circle
ctx.globalAlpha = 0.5;
ctx.fillStyle = '#e74c3c';
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();

// Draw a triangle
ctx.globalAlpha = 1;
ctx.fillStyle = '#2ecc71';
ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.lineTo(x3, y3);
ctx.closePath();
ctx.fill();
```

## 6a. Efficient & Flexible Particle Engine
### Key Concepts
- Use object pooling to reuse particle objects and minimize garbage collection.
- Store particle properties (position, velocity, color, size, life) in arrays or typed arrays for fast access.
- Update and render particles in batches using the Canvas API.
- Allow customization of particle behaviors (gravity, wind, fade, etc.) via configuration objects or functions.
- Support different emission shapes (point, circle, area) and blending modes.
- Support multiple particle shapes (square, circle, triangle, etc.)
- Emit particles with the same shape as the source object

### Shape-Aware Particle Engine Example
```js
class Particle {
    constructor() {
        this.active = false;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.size = 1; this.color = '#fff';
        this.life = 0; this.maxLife = 0;
        this.shape = 'circle'; // 'square', 'triangle', etc.
        this.alpha = 1;
    }
    init(x, y, vx, vy, size, color, life, shape, alpha=1) {
        this.active = true;
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.size = size; this.color = color;
        this.life = 0; this.maxLife = life;
        this.shape = shape;
        this.alpha = alpha;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        if (this.life > this.maxLife) this.active = false;
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
        ctx.fillStyle = this.color;
        switch (this.shape) {
            case 'square':
                ctx.fillRect(this.x, this.y, this.size, this.size);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                break;
            // Add more shapes as needed
        }
        ctx.globalAlpha = 1;
    }
}

class ParticleEngine {
    constructor(maxParticles) {
        this.pool = Array.from({length: maxParticles}, () => new Particle());
    }
    emit(x, y, config) {
        for (let p of this.pool) {
            if (!p.active) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
                p.init(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    config.size,
                    config.color,
                    config.life,
                    config.shape,
                    config.alpha ?? 1
                );
                break;
            }
        }
    }
    updateAndDraw(ctx) {
        for (let p of this.pool) {
            if (p.active) {
                p.update();
                p.draw(ctx);
            }
        }
    }
}

// Usage example in your game loop:
// const engine = new ParticleEngine(500);
// engine.emit(x, y, {speedMin:1, speedMax:3, size:8, color:'#ff0', life:60, shape:'square', alpha:0.7});
// engine.updateAndDraw(ctx);
```

When emitting particles, pass the shape of the source object (e.g., 'square' for a player drawn as a square) so particles match the object's appearance.

## 7. Sound and Music
- Use the HTML5 `<audio>` element or JavaScript Audio API to play sounds and music.

## 7a. Rhythm-Based Gameplay & Beat Synchronization

### Key Concepts
- Define a global beat interval (e.g., 120 BPM = 500ms per beat).
- Schedule all sound effects and major events to occur on the next beat.
- Use visual indicators (glow, flashing, countdown) to show pending actions before the beat.
- Use a central clock or beat tracker to coordinate all timing.

### Example Beat Scheduler (game.js)
```js
// Beat settings
const BPM = 120;
const BEAT_INTERVAL = 60000 / BPM; // ms per beat
let lastBeatTime = performance.now();

// Beat tracker
function getNextBeatTime() {
    const now = performance.now();
    const beatsPassed = Math.ceil((now - lastBeatTime) / BEAT_INTERVAL);
    return lastBeatTime + beatsPassed * BEAT_INTERVAL;
}

// Schedule an event to the next beat
function scheduleToBeat(callback) {
    const now = performance.now();
    const nextBeat = getNextBeatTime();
    setTimeout(callback, nextBeat - now);
}

// Example: Delayed explosion to fit the beat
function triggerExplosion(x, y) {
    // Show glow or indicator
    showGlow(x, y);
    scheduleToBeat(() => {
        hideGlow(x, y);
        playExplosionSound();
        spawnExplosionParticles(x, y);
    });
}

function showGlow(x, y) {
    // Draw glow or indicator at (x, y)
}
function hideGlow(x, y) {
    // Remove glow
}
function playExplosionSound() {
    // Play sound
}
function spawnExplosionParticles(x, y) {
    // Emit particles
}
```

You can use this pattern for all major game events and sounds to keep everything in sync with the beat.

## 8. Win/Lose Conditions
- Implement logic to detect when the player wins or loses.
- Display messages or screens for game over or victory.

## 9. Polish
- Add graphics, animations, and sound effects.
- Test and refine gameplay.

## 10. Deployment
- Test your game in different browsers.
- Share your game by uploading the folder to a web server or hosting platform.

---

For more details, see [MDN Web Docs: 2D Canvas Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_canvas_games).
