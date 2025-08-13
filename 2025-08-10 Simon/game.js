// Top-Down Shooter Game Implementation
// See instructions.md for full game design

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Utility Functions ---
function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// --- Game Constants ---
const PLAYER_SPEED = 5;
const BULLET_SPEED = 12;
const ENEMY_PLANE_SPEED = 3;
const ENEMY_WAVE_SIZE = 10;
const ENEMY_WAVE_GAP = 80;
const ENEMY_WAVE_INTERVAL = 300;
const ENEMY_PLANE_PATHS = 5;
const ENEMY_PLANE_AMPLITUDE_RANGE = [60, 180];
const ENEMY_PLANE_WIDTH_RANGE = [120, 320];
const TURRET_BULLET_SPEED = 7;
const CAR_SPEED = 2.5;
const POWERUP_SIZE = 32;
const STAR_PULSE_SPEED = 0.02;
const PARTICLE_FADE = 0.03;
const CLOUD_LAYER_COUNT = 1;
const PARALLAX_LAYERS = 3;

// --- Z-Layer Definitions ---
const Z_LAYERS = {
  GROUND: 1,
  TURRET: 2,
  CAR: 3,
  ENEMY_BULLET: 4,
  CLOUD: 5,
  PLAYER_BULLET: 6,
  ENEMY_PLANE: 7,
  PLAYER: 8,
  PARTICLE: {
    CAR: 3,
    TURRET: 2,
    PLANE: 7
  },
  POWERUP: 7
};

// --- Input State ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// --- Game State ---
// --- Audio ---
const sounds = {
  playerShoot: new Audio('player_shoot.wav'),
  turretShoot: new Audio('turret_shoot.wav'),
  explode1: new Audio('explode1.wav'),
  explode2: new Audio('explode2.wav')
};
sounds.playerShoot.volume = 0.25;
let player, bullets, enemyPlanes, turrets, cars, enemyBullets, clouds, groundSquares, particles, powerUps, score, waveTimer;

function resetGame() {
  player = {
    x: WIDTH / 2,
    y: HEIGHT - 120,
    w: 40,
    h: 60, // 50% longer than wide
    angle: 0, // Always point upwards (north)
    alive: true
  };
  bullets = [];
  enemyPlanes = [];
  turrets = [];
  cars = [];
  enemyBullets = [];
  clouds = [];
  groundSquares = [];
  particles = [];
  powerUps = [];
  score = 0;
  waveTimer = 0;
  generateGround();
  generateTurretsAndCars();
  generateClouds();
}

// --- Ground Generation ---
function generateGround() {
  groundSquares = [];
  for (let layer = 0; layer < PARALLAX_LAYERS; layer++) {
    for (let i = 0; i < 60; i++) { // Increased from 30 to 60 for higher density
      groundSquares.push({
        layer,
        x: rand(0, WIDTH),
        y: rand(-HEIGHT, HEIGHT),
        w: rand(120, 320 - layer * 60), // Increased size range
        h: rand(120, 320 - layer * 60), // Increased size range
        color: `rgb(${40 + layer*40},${60 + layer*30},${40 + layer*20})`,
        dark: layer
      });
    }
  }
}

// --- Turrets and Cars ---
function generateTurretsAndCars() {
  turrets = [];
  cars = [];
  // Spawn turrets on fastest ground layer squares (highest layer index)
  let fastestLayer = Math.max(...groundSquares.map(g => g.layer));
  let fastestGround = groundSquares.filter(g => g.layer === fastestLayer);
  for (let i = 0; i < 8; i++) {
    let square = fastestGround[Math.floor(rand(0, fastestGround.length))];
    turrets.push({
      ground: square,
      x: square.x + square.w/2,
      y: square.y + square.h/2,
      r: 24,
      cooldown: rand(60, 120)
    });
  }
  // No car spawning
}

// --- Cloud Generation ---
function generateClouds() {
  clouds = [];
  for (let i = 0; i < 18; i++) {
    clouds.push({
      x: rand(0, WIDTH),
      y: rand(-HEIGHT, HEIGHT),
      w: rand(60, 180),
      h: rand(40, 120),
      alpha: rand(0.3, 0.8),
      speed: rand(2.5, 4.5)
    });
  }
}

// --- Enemy Plane Waves ---
function spawnEnemyWave() {
  let pathType = Math.floor(rand(0, ENEMY_PLANE_PATHS));
  let amplitude = rand(...ENEMY_PLANE_AMPLITUDE_RANGE);
  let width = rand(...ENEMY_PLANE_WIDTH_RANGE);
  let baseX = rand(120, WIDTH-120);
  let baseY = -60;
  for (let i = 0; i < ENEMY_WAVE_SIZE; i++) {
    enemyPlanes.push({
      x: baseX,
      y: baseY - i * ENEMY_WAVE_GAP,
      w: 36,
      h: 54, // 50% longer than wide
      angle: Math.PI/2,
      pathType,
      amplitude,
      width,
      t: 0,
      alive: true
    });
  }
}

// --- Game Loop ---
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function update() {
  // Respawn turrets if below max count
  const MAX_TURRETS = 8;
  if (turrets.length < MAX_TURRETS) {
    // Find a random ground square on the fastest layer
    let fastestLayer = Math.max(...groundSquares.map(g => g.layer));
    let fastestGround = groundSquares.filter(g => g.layer === fastestLayer);
    let square = fastestGround[Math.floor(rand(0, fastestGround.length))];
    turrets.push({
      ground: square,
      x: square.x + square.w/2,
      y: square.y + square.h/2,
      r: 24,
      cooldown: rand(60, 120)
    });
  }
  // Player movement
  if (player.alive) {
    if (keys['w']) player.y -= PLAYER_SPEED;
    if (keys['s']) player.y += PLAYER_SPEED;
    if (keys['a']) player.x -= PLAYER_SPEED;
    if (keys['d']) player.x += PLAYER_SPEED;
    player.x = clamp(player.x, 0, WIDTH);
    player.y = clamp(player.y, 0, HEIGHT);
  player.angle = 0; // Always point upwards (north)
  }

  // Player shooting (half the speed)
  if (player.alive && performance.now() % 12 < 3) {
    bullets.push({
      x: player.x,
      y: player.y - player.h/2,
      dx: 0,
      dy: -BULLET_SPEED,
      w: 8,
      h: 18,
      angle: -Math.PI/2,
      alive: true
    });
  // ...no sound when player shoots...
  }

  // Move bullets
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.y < -40) b.alive = false;
  });
  bullets = bullets.filter(b => b.alive);

  // Move enemy planes
  enemyPlanes.forEach((plane, idx) => {
    plane.t += ENEMY_PLANE_SPEED;
    let sine = Math.sin((plane.y + plane.t) / plane.width) * plane.amplitude;
    plane.x += sine * 0.01;
    plane.y += ENEMY_PLANE_SPEED;
    plane.angle = Math.PI/2 + Math.atan2(ENEMY_PLANE_SPEED, sine * 0.01);
  // ...existing code...
    // Remove planes off screen
    if (plane.y > HEIGHT + 60) plane.alive = false;
  });
  enemyPlanes = enemyPlanes.filter(p => p.alive);

  // Move enemy bullets
  enemyBullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < -40 || b.x > WIDTH+40 || b.y < -40 || b.y > HEIGHT+40) b.alive = false;
  });
  enemyBullets = enemyBullets.filter(b => b.alive);

  // Turret movement and shooting
  turrets.forEach(turret => {
    // Follow ground movement
    turret.x = turret.ground.x + turret.ground.w/2;
    turret.y = turret.ground.y + turret.ground.h/2;
    turret.cooldown--;
    if (turret.cooldown <= 0 && player.alive) {
      let dx = player.x - turret.x;
      let dy = player.y - turret.y;
      let len = Math.sqrt(dx*dx + dy*dy);
      dx /= len; dy /= len;
      enemyBullets.push({
        x: turret.x,
        y: turret.y,
        dx: dx * TURRET_BULLET_SPEED,
        dy: dy * TURRET_BULLET_SPEED,
        r: 7,
        alive: true
      });
      if (sounds.turretShoot) { sounds.turretShoot.currentTime = 0; sounds.turretShoot.play(); }
      turret.cooldown = rand(60, 120);
    }
  });

  // Move cars
  cars.forEach(car => {
    if (!car.target || Math.random() < 0.01) {
      let ground = groundSquares.filter(g => g.layer === 0);
      car.target = ground[Math.floor(rand(0, ground.length))];
    }
    let dx = car.target.x + car.target.w/2 - car.x;
    let dy = car.target.y + car.target.h/2 - car.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    if (len > 2) {
      car.x += (dx/len) * CAR_SPEED;
      car.y += (dy/len) * CAR_SPEED;
      car.angle = Math.atan2(dy, dx);
    }
    // Car shooting
    if (player.alive && Math.random() < 0.01) {
      let pdx = player.x - car.x;
      let pdy = player.y - car.y;
      let plen = Math.sqrt(pdx*pdx + pdy*pdy);
      pdx /= plen; pdy /= plen;
      enemyBullets.push({
        x: car.x,
        y: car.y,
        dx: pdx * TURRET_BULLET_SPEED,
        dy: pdy * TURRET_BULLET_SPEED,
        r: 7,
        alive: true
      });
    }
  });

  // Move clouds
  clouds.forEach(cloud => {
    cloud.y += cloud.speed;
    if (cloud.y > HEIGHT + 60) {
      cloud.x = rand(0, WIDTH);
      cloud.y = -rand(60, 180);
      cloud.w = rand(60, 180);
      cloud.h = rand(40, 120);
      cloud.alpha = rand(0.3, 0.8);
      cloud.speed = rand(2.5, 4.5);
    }
  });

  // Move ground
  groundSquares.forEach(g => {
    g.y += 1 + g.layer * 0.5;
    if (g.y > HEIGHT + 60) {
      g.x = rand(0, WIDTH);
      g.y = -rand(60, 180);
      g.w = rand(60, 180 - g.layer * 30);
      g.h = rand(60, 180 - g.layer * 30);
    }
  });

  // Power-ups
  powerUps.forEach(star => {
    star.y += ENEMY_PLANE_SPEED;
    if (star.y > HEIGHT + 60) star.alive = false;
    // Pickup
    if (player.alive && Math.abs(player.x - star.x) < POWERUP_SIZE && Math.abs(player.y - star.y) < POWERUP_SIZE) {
      star.alive = false;
      score += 100;
    }
  });
  powerUps = powerUps.filter(s => s.alive);

  // Particles
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.angle += p.rot;
    p.life -= PARTICLE_FADE;
  });
  particles = particles.filter(p => p.life > 0);

  // Collisions
  enemyPlanes.forEach((plane, idx) => {
    bullets.forEach(b => {
      if (plane.alive && b.alive && Math.abs(plane.x - b.x) < 24 && Math.abs(plane.y - b.y) < 24) {
        plane.alive = false;
        b.alive = false;
        spawnExplosion(plane.x, plane.y, 'plane');
        // Power-up spawn if last in wave
        if (enemyPlanes.filter(p => p.alive).length === 0) {
          powerUps.push({
            x: plane.x,
            y: plane.y,
            alive: true,
            pulse: 0,
            rotation: rand(0, Math.PI * 2)
          });
        }
      }
    });
    // Crash with player
    if (player.alive && plane.alive && Math.abs(plane.x - player.x) < 32 && Math.abs(plane.y - player.y) < 32) {
      player.alive = false;
      spawnExplosion(player.x, player.y, 'plane');
      setTimeout(() => { resetGame(); }, 1200); // Restart after 1.2s
    }
  });
  turrets.forEach(turret => {
    bullets.forEach(b => {
      if (Math.abs(turret.x - b.x) < 24 && Math.abs(turret.y - b.y) < 24) {
        spawnExplosion(turret.x, turret.y, 'turret');
        turret.remove = true; // Mark for removal
        b.alive = false;
      }
    });
  });
  turrets = turrets.filter(turret => !turret.remove);
  cars.forEach(car => {
    bullets.forEach(b => {
      if (Math.abs(car.x - b.x) < 24 && Math.abs(car.y - b.y) < 24) {
        spawnExplosion(car.x, car.y, 'car');
        car.x = -9999; // Remove car
        b.alive = false;
      }
    });
  });
  enemyBullets.forEach(b => {
    if (player.alive && Math.abs(player.x - b.x) < 18 && Math.abs(player.y - b.y) < 18) {
      player.alive = false;
      spawnExplosion(player.x, player.y, 'plane');
      setTimeout(() => { resetGame(); }, 1200); // Restart after 1.2s
    }
  });

  // Enemy wave spawn
  waveTimer--;
  if (waveTimer <= 0) {
    spawnEnemyWave();
    waveTimer = ENEMY_WAVE_INTERVAL;
  }
}

function spawnExplosion(x, y, type) {
  let shape, color, z;
  if (type === 'car') { shape = 'rect'; color = '#ffb347'; z = Z_LAYERS.PARTICLE.CAR; }
  if (type === 'turret') {
    shape = 'circle'; color = '#aaf'; z = Z_LAYERS.PARTICLE.TURRET;
    if (sounds.explode2) { sounds.explode2.currentTime = 0; sounds.explode2.play(); }
  }
  if (type === 'plane') {
    shape = 'triangle'; color = '#f44'; z = Z_LAYERS.PARTICLE.PLANE;
    if (sounds.explode1) { sounds.explode1.currentTime = 0; sounds.explode1.play(); }
  }
  for (let i = 0; i < 18; i++) {
    let angle = rand(0, Math.PI*2);
    let speed = rand(4, 14); // More spaced out
    let ttl = rand(0.5, 1.5); // Random time to live
    particles.push({
      x, y,
      dx: Math.cos(angle)*speed,
      dy: Math.sin(angle)*speed,
      angle,
      rot: rand(-0.2, 0.2),
      life: ttl,
      shape,
      color,
      z
    });
  }
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // --- Render by Z-Layer ---
  // 1. Ground
  groundSquares.forEach(g => {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = g.color;
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.restore();
  });
  // 2. Turrets
  turrets.forEach(turret => {
    ctx.save();
    ctx.fillStyle = '#aaf';
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, turret.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
  // 3. Cars
  cars.forEach(car => {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(-car.w/2, -car.h/2, car.w, car.h);
    ctx.restore();
  });
  // 4. Bullets from turrets and cars
  enemyBullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
  // 5. Clouds
  clouds.forEach(cloud => {
    ctx.save();
    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cloud.x, cloud.y, cloud.w, cloud.h);
    ctx.restore();
  });
  // 6. Bullets from player
  bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
  ctx.arc(b.x, b.y, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
  // 7. Enemy planes
  enemyPlanes.forEach(plane => {
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.angle);
    ctx.fillStyle = '#f44';
    ctx.beginPath();
    ctx.moveTo(0, -plane.h/2);
    ctx.lineTo(-plane.w/2, plane.h/2);
    ctx.lineTo(plane.w/2, plane.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // Power-ups (stars)
  powerUps.forEach(star => {
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(star.rotation || 0);
    let pulse = 1 + Math.sin(performance.now()*STAR_PULSE_SPEED)*0.2;
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      let angle = Math.PI*2*i/5;
      let x = Math.cos(angle)*POWERUP_SIZE/2;
      let y = Math.sin(angle)*POWERUP_SIZE/2;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // 8. Player plane
  if (player.alive) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(-player.w/2, player.h/2);
    ctx.lineTo(player.w/2, player.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // ...existing code...
  // Particles (explosions)
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') ctx.fillRect(-10, -6, 20, 12);
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fill();
    }
    if (p.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(-10, 10);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
  // Score
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText('Score: ' + score, 24, 40);
  ctx.restore();
}

resetGame();
gameLoop();
