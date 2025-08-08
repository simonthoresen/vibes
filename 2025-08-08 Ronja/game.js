
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = {};
let gamePaused = false;
let gameStarted = false;
let gameRunning = false;
let fadeOpacity = 0;
let fadingIn = false;
let fadingOut = false;

let enemySpeed = 0.3;
let enemySpawnInterval = 900;
let enemySpawnTimer = 0;

let bossActive = false;
let bossSpawned = false;
let inBossFight = false;

let enemyHealthMultiplier = 1;
let obeliskDamageMultiplier = 1;

let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;

const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const highscoreStartDisplay = document.getElementById("highscoreStartDisplay");

let highscore = localStorage.getItem("obeliskHighscore") || 0;
highscoreStartDisplay.innerText = highscore;

const obelisk = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 30,
  maxHealth: 10,
  health: 10,
};

const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2 - 100,
  radius: 15,
  speed: 2,
  fireRate: 500,
  lastShot: 0,
  level: 1,
  xp: 0,
  xpToLevel: 10,
  health: 5,
  maxHealth: 5,
  multiShot: 0,
  bulletDamage: 1,
  magnetStrength: 0.05,
};

let enemies = [];
let bullets = [];
let xpOrbs = [];

const cutsceneData = [
  {
    img: "cutscene1.png",
    text: "Long ago, there existed many obelisks.\nThey helped guide the dead to their resting place.\nBut monsters soon came to destroy them and devour the souls of the dead."
  },
  {
    img: "cutscene2.png",
    text: "Luckily, those who knew of the obelisks came to protect them—\nwhether through magic or technology."
  },
  {
    img: "cutscene3.png",
    text: "Now it’s your turn to protect the obelisk."
  }
];

let currentCutsceneSlide = 0;

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "Escape" && gameStarted && !fadingIn && !fadingOut) {
    togglePause();
  }
});

window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

startButton.addEventListener("click", () => {
  if (!gameStarted) {
    startScreen.style.display = "none";
    startCutscene();
  }
});

document.getElementById("resumeButton").onclick = () => {
  togglePause();
};

document.getElementById("quitButton").onclick = () => {
  location.reload();
};

function startCutscene() {
  const cutscene = document.getElementById("cutscene");
  const img = document.getElementById("cutsceneImage");
  const text = document.getElementById("cutsceneText");

  cutscene.style.display = "block";
  currentCutsceneSlide = 0;
  img.src = cutsceneData[0].img;
  text.innerText = cutsceneData[0].text;
}

function togglePause() {
  gamePaused = !gamePaused;

  const pauseMenu = document.getElementById("pauseMenu");
  pauseMenu.style.display = gamePaused ? "block" : "none";

  // Update highscore display in pause menu
  if (gamePaused) {
    const highscoreDisplay = document.getElementById("highscoreDisplay");
    const currentHighscore = localStorage.getItem("obeliskHighscore") || 0;
    highscoreDisplay.innerText = currentHighscore;
  }
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

function update(deltaTime) {
  if (gamePaused) return;

  movePlayer();
  shootProjectiles(deltaTime);
  spawnEnemies(deltaTime);
  updateEnemies(deltaTime);
  updateBullets();
  updateXPOrbs();
  checkCollisions();

  if (inBossFight && !bossSpawned && enemies.length === 0) {
    spawnBoss();
    bossActive = true;
    bossSpawned = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawObelisk();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawXPOrbs();
  drawUI();
}



function movePlayer() {
  let dx = 0;
  let dy = 0;
  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    player.x += dx * player.speed;
    player.y += dy * player.speed;
  }
  player.x = Math.max(0, Math.min(WIDTH, player.x));
  player.y = Math.max(0, Math.min(HEIGHT, player.y));
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "cyan";
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = "red";
  ctx.fillRect(player.x - 15, player.y - 25, 30, 4);
  ctx.fillStyle = "green";
  ctx.fillRect(player.x - 15, player.y - 25, 30 * (player.health / player.maxHealth), 4);
}

function shootProjectiles(deltaTime) {
  player.lastShot += deltaTime;
  if (player.lastShot < player.fireRate) return;
  player.lastShot = 0;

  const dx = mouseX - player.x;
  const dy = mouseY - player.y;
  const baseAngle = Math.atan2(dy, dx);
  const angles = [baseAngle];
  const spread = 0.15;

  for (let i = 1; i <= player.multiShot; i++) {
    angles.push(baseAngle + spread * i);
    angles.push(baseAngle - spread * i);
  }

  angles.forEach((angle) => {
    bullets.push({
      x: player.x,
      y: player.y,
      angle,
      speed: 4,
      radius: 4,
      damage: player.bulletDamage,
    });
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  ctx.fillStyle = "white";
  bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

function spawnEnemies(deltaTime) {
  if (inBossFight || bossActive) return;
  enemySpawnTimer += deltaTime;
  if (enemySpawnTimer > enemySpawnInterval) {
    enemySpawnTimer = 0;
    enemies.push(createEnemy());
  }
}

function createEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  switch (side) {
    case 0: x = Math.random() * WIDTH; y = -20; break;
    case 1: x = WIDTH + 20; y = Math.random() * HEIGHT; break;
    case 2: x = Math.random() * WIDTH; y = HEIGHT + 20; break;
    case 3: x = -20; y = Math.random() * HEIGHT; break;
  }
  return {
    x, y,
    radius: 12,
    speed: enemySpeed,
    health: 1 * enemyHealthMultiplier,
    maxHealth: 1 * enemyHealthMultiplier,
    isBoss: false,
  };
}

function spawnBoss() {
  enemies.push({
    x: Math.random() * WIDTH,
    y: -40,
    radius: 30,
    speed: enemySpeed * 0.5,
    health: 10 * enemyHealthMultiplier,
    maxHealth: 10 * enemyHealthMultiplier,
    isBoss: true,
  });
}

function updateEnemies(deltaTime) {
  enemies.forEach((enemy) => {
    const dx = obelisk.x - enemy.x;
    const dy = obelisk.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    enemy.x += (dx / dist) * enemy.speed * deltaTime * 0.1;
    enemy.y += (dy / dist) * enemy.speed * deltaTime * 0.1;
  });
}

function drawEnemies() {
  enemies.forEach((e) => {
    // Draw enemy (red circle)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Draw green health bar above the enemy
    const barWidth = 20;
    const barHeight = 3;
    const healthPercent = Math.max(0, e.health / e.maxHealth);
    const healthBarWidth = barWidth * healthPercent;

    ctx.fillStyle = "limegreen";
    ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 10, healthBarWidth, barHeight);
  });
}


function updateXPOrbs() {
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    const dx = player.x - orb.x;
    const dy = player.y - orb.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 100) {
      orb.x += dx * player.magnetStrength;
      orb.y += dy * player.magnetStrength;
    }
    if (dist < player.radius + 5) {
      gainXP(orb.value);
      xpOrbs.splice(i, 1);
    }
  }
}

function drawXPOrbs() {
  ctx.fillStyle = "lime";
  xpOrbs.forEach((orb) => {
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

function gainXP(amount) {
  player.xp += amount;
  updateXPBar();
  if (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * 1.4);
    if (player.level % 5 === 0) {
      inBossFight = true;
      bossSpawned = false;
    }
    showLevelUpMenu();
  }
}

function updateXPBar() {
  const percent = (player.xp / player.xpToLevel) * 100;
  document.getElementById("xpBar").style.width = percent + "%";
}

function checkCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = b.x - enemy.x;
      const dy = b.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < b.radius + enemy.radius) {
        bullets.splice(j, 1);
        enemy.health -= b.damage;
        if (enemy.isBoss && enemy.health <= 0) {
          bossActive = false;
          inBossFight = false;
          enemyHealthMultiplier *= 2;
          obeliskDamageMultiplier *= 2;
          showLegendaryUpgradeMenu();
        }
        if (enemy.health <= 0) {
          xpOrbs.push({ x: enemy.x, y: enemy.y, value: 3 });
          enemies.splice(i, 1);
        }
        break;
      }
    }

    const dx = obelisk.x - enemy.x;
    const dy = obelisk.y - enemy.y;
    if (Math.hypot(dx, dy) < obelisk.radius + enemy.radius) {
      obelisk.health -= Math.round(1 * obeliskDamageMultiplier);
      enemies.splice(i, 1);
    }

    const px = player.x - enemy.x;
    const py = player.y - enemy.y;
    if (Math.hypot(px, py) < player.radius + enemy.radius) {
      player.health -= 1;
      enemies.splice(i, 1);
    }
  }
}

function drawObelisk() {
  ctx.save();
  ctx.translate(obelisk.x, obelisk.y);
  ctx.rotate(Math.PI / 4); // Rotate to make a diamond
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.rect(-obelisk.radius, -obelisk.radius, obelisk.radius * 2, obelisk.radius * 2);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.fillText(`Obelisk Health: ${Math.round(obelisk.health)}`, 10, 20);
  ctx.fillText(`Player Health: ${player.health}`, 10, 40);
  ctx.fillText(`Level: ${player.level}`, 10, 60);
}

function showLevelUpMenu() {
  gamePaused = true;
  const menu = document.getElementById("levelUpMenu");
  menu.innerHTML = "<h2>Level Up! Choose an Upgrade</h2>";
  const upgrades = [
    { name: "Faster Fire Rate", apply: () => (player.fireRate *= 0.85) },
    { name: "Move Speed +20%", apply: () => (player.speed *= 1.2) },
    { name: "Bullet Speed +50%", apply: () => bullets.forEach((b) => (b.speed *= 1.5)) },
    { name: "Max Health +5", apply: () => { player.maxHealth += 5; player.health += 5; } },
    { name: "Heal +5", apply: () => player.health = Math.min(player.maxHealth, player.health + 5) },
    { name: "Multi-Projectiles", apply: () => player.multiShot++ },
    { name: "Stronger Bullets", apply: () => player.bulletDamage++ },
    { name: "Stronger XP Magnet", apply: () => player.magnetStrength *= 2.5 },
  ];
  const choices = upgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
  choices.forEach((upg) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerText = upg.name;
    div.onclick = () => {
      upg.apply();
      menu.style.display = "none";
      gamePaused = false;
      enemySpeed += 0.05;
      enemySpawnInterval = Math.max(300, enemySpawnInterval - 100);
    };
    menu.appendChild(div);
  });
  menu.style.display = "block";
}

function showLegendaryUpgradeMenu() {
  gamePaused = true;
  const menu = document.getElementById("levelUpMenu");
  menu.innerHTML = "<h2>Legendary Upgrade! Choose One</h2>";
  const upgrades = [
    { name: "Laser Barrage", apply: () => player.multiShot += 3 },
    { name: "Ultra Magnet", apply: () => player.magnetStrength *= 5 },
    { name: "Mega Health Boost", apply: () => { player.maxHealth += 20; player.health += 20; } },
    { name: "Double Damage", apply: () => player.bulletDamage *= 2 },
    { name: "Rapid Fire", apply: () => player.fireRate *= 0.5 },
  ];
  const choices = upgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
  choices.forEach((upg) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerText = upg.name;
    div.onclick = () => {
      upg.apply();
      menu.style.display = "none";
      gamePaused = false;
    };
    menu.appendChild(div);
  });
  menu.style.display = "block";
}

function gameOver() {
  const screen = document.getElementById("gameOverScreen");
  const currentLevelDisplay = document.getElementById("currentLevelDisplay");
  const finalHighscoreDisplay = document.getElementById("finalHighscoreDisplay");

  // Show final level
  currentLevelDisplay.innerText = player.level;

  // Check and update highscore
  if (player.level > highscore) {
    highscore = player.level;
    localStorage.setItem("obeliskHighscore", highscore);
  }
  finalHighscoreDisplay.innerText = highscore;

  // Update text depending on win or game over
  const header = screen.querySelector("h2");
  const restartButton = document.getElementById("restartButton");
  const resumeButton = document.createElement("button");
  resumeButton.className = "start-button";
  resumeButton.id = "resumeFromVictory";
  resumeButton.innerText = "Resume";
  
  if (player.level >= 20) {
    header.innerText = "🎉 YOU WON 🎉";
    restartButton.style.display = "none";

    // Add Resume Button
    if (!document.getElementById("resumeFromVictory")) {
      
    }

    resumeButton.onclick = () => {
      screen.style.display = "none";
      gamePaused = false;
      requestAnimationFrame(gameLoop);
    };
  } else {
    header.innerText = "Game Over";
    restartButton.style.display = "inline-block";

    const existing = document.getElementById("resumeFromVictory");
    if (existing) existing.remove();
  }

  screen.style.display = "block";
}

let lastTime = performance.now();
function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  if (gameStarted) {
    if (fadingOut) {
      fadeOpacity += 0.02;
      if (fadeOpacity >= 1) {
        fadeOpacity = 1;
        fadingOut = false;
        fadingIn = true;
      }
    } else if (fadingIn) {
      fadeOpacity -= 0.02;
      if (fadeOpacity <= 0) {
        fadeOpacity = 0;
        fadingIn = false;
      }
    }

    if (!fadingOut && !fadingIn) {
      update(deltaTime);
    }
    draw();
    drawFadeOverlay();
  }

  if ((obelisk.health > 0 && player.health > 0) || !gameStarted) {
    requestAnimationFrame(gameLoop);
  } else {
    gameOver();
  }
}

document.getElementById("nextCutscene").addEventListener("click", () => {
  currentCutsceneSlide++;
  if (currentCutsceneSlide < cutsceneData.length) {
    const data = cutsceneData[currentCutsceneSlide];
    document.getElementById("cutsceneImage").src = data.img;
    document.getElementById("cutsceneText").innerText = data.text;
  } else {
    document.getElementById("cutscene").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("xpBarContainer").style.display = "block";
    gameStarted = true;
    fadingOut = true;
  }
});
document.getElementById("skipCutscene").addEventListener("click", () => {
  document.getElementById("cutscene").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("xpBarContainer").style.display = "block";
  gameStarted = true;
  fadingOut = true;
});

requestAnimationFrame(gameLoop);

function drawStartMenu() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#fff";
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("The Obelisk of Demise", WIDTH / 2, HEIGHT / 2 - 100);

  ctx.font = "24px sans-serif";
  ctx.fillText("Click to Begin", WIDTH / 2, HEIGHT / 2 + 20);
}

function drawFadeOverlay() {
  if (fadeOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

window.onload = () => {
  document.getElementById("restartButton").onclick = () => {
  document.getElementById("gameOverScreen").style.display = "none";
  startScreen.style.display = "none";
  gameStarted = true;
  fadingIn = false;
  fadingOut = false;

  // Reset player stats
  player.level = 1;
  player.xp = 0;
  player.xpToLevel = 10;
  player.health = player.maxHealth = 5;
  player.bulletDamage = 1;
  player.multiShot = 0;
  player.magnetStrength = 0.05;
  player.fireRate = 500;
  player.speed = 2;

  obelisk.health = obelisk.maxHealth = 10;

  enemies = [];
  bullets = [];
  xpOrbs = [];

  enemySpeed = 0.3;
  enemySpawnInterval = 900;
  enemySpawnTimer = 0;

  bossActive = false;
  bossSpawned = false;
  inBossFight = false;
  enemyHealthMultiplier = 1;
  obeliskDamageMultiplier = 1;

  updateXPBar();

  // Restart the game loop
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};
};