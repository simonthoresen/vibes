
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let gameMode = null; // 'story' or 'endless'

// Key binding configuration
const keyBindings = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd'
};

// Save key bindings to local storage
function saveKeyBindings() {
  localStorage.setItem('keyBindings', JSON.stringify(keyBindings));
}

// Load key bindings from local storage
function loadKeyBindings() {
  const saved = localStorage.getItem('keyBindings');
  if (saved) {
    Object.assign(keyBindings, JSON.parse(saved));
    updateKeyBindButtons();
  }
}

// Update the key bind button displays
function updateKeyBindButtons() {
  document.querySelectorAll('.keybind-button').forEach(button => {
    const action = button.dataset.action;
    button.textContent = keyBindings[action].toUpperCase();
  });
}

// Helper functions for showing/hiding menus
function showMenu(menu, isCheatMenu = false) {
  const darkOverlay = document.getElementById("darkOverlay");
  darkOverlay.style.display = "block";
  // Make overlay darker for cheat menu
  darkOverlay.style.background = isCheatMenu ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.7)";
  menu.style.display = "block";
}

function hideMenu(menu) {
  const darkOverlay = document.getElementById("darkOverlay");
  darkOverlay.style.display = "none";
  menu.style.display = "none";
}

function showVictoryScreen() {
  gameStarted = false;
  const victoryScreen = document.getElementById("victoryScreen");
  victoryScreen.style.display = "block";
  canvas.style.display = "none";
  document.getElementById("xpBarContainer").style.display = "none";
}

const keys = {};
let gamePaused = false;
let gameStarted = false;
let gameRunning = false;
let fadeOpacity = 0;
let fadingIn = false;
let fadingOut = false;

// Konami Code tracking
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

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
const highscoreStartDisplay = document.getElementById("highscoreStartDisplay");

let highscore = localStorage.getItem("obeliskHighscore") || 0;
highscoreStartDisplay.innerText = highscore;

const loreButton = document.getElementById("loreButton");
const endlessButton = document.getElementById("endlessButton");

const obelisk = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 30,
  maxHealth: 10,
  health: 10,
  shieldDefense: 0, // Extra defense from shield
  hasShield: false, // Whether the shield is active
};

const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2 - 100,
  radius: 15,
  speed: 0.5,
  fireRate: 500,
  lastShot: 0,
  level: 1,
  xp: 0,
  xpToLevel: 10,
  health: 5,
  maxHealth: 5,
  multiShot: 0,
  bulletDamage: 1,
  bulletSize: 4, // Base bullet size
  magnetStrength: 0.05,
  shieldActive: false,
  shieldTimer: 0,
  shieldBlinkTimer: 0,
  hasHeatSeek: false,
  xpMultiplier: 1,
};

let enemies = [];
let bullets = [];
let xpOrbs = [];
let particles = [];

// Store all available upgrades globally
const normalUpgrades = [
  { 
    name: "Faster Fire Rate",
    description: "Shoot 15% faster, letting you unleash more bullets",
    apply: () => (player.fireRate *= 0.85) 
  },
  { 
    name: "Move Speed +20%",
    description: "Become more agile, perfect for dodging enemies",
    apply: () => (player.speed *= 1.2) 
  },
  { 
    name: "Bullet Speed +50%",
    description: "Your bullets travel faster, making them harder to dodge",
    apply: () => bullets.forEach((b) => (b.speed *= 1.5)) 
  },
  { 
    name: "Max Health +5",
    description: "Increase the players durability by 5 and heal to full health",
    apply: () => { player.maxHealth += 5; player.health += 5; } 
  },
  { 
    name: "Heal +5",
    description: "Restore 5 of the players health points",
    apply: () => player.health = Math.min(player.maxHealth, player.health + 5) 
  },
  { 
    name: "Multi-Projectiles",
    description: "Add another projectile to your attack pattern",
    apply: () => player.multiShot++ 
  },
  { 
    name: "Stronger Bullets",
    description: "Each bullet deals +1 damage to enemies",
    apply: () => player.bulletDamage++ 
  },
  { 
    name: "Stronger XP Magnet",
    description: "Increase your XP collection range by 40%",
    apply: () => player.magnetStrength *= 1.4 
  },
  {
    name: "Obelisk Healing",
    description: "Restore 5 health points to the obelisk",
    apply: () => {
      obelisk.health = Math.min(obelisk.maxHealth, obelisk.health + 5);
    }
  },
  {
    name: "Obelisk Shield",
    description: "Add 5 defense to the obelisk with a protective shield",
    apply: () => {
      obelisk.shieldDefense += 5;
      obelisk.hasShield = true;
    }
  },
  {
    name: "Bigger Bullets",
    description: "Increase bullet size by 75%, making them much easier to hit with",
    apply: () => {
      player.bulletSize *= 1.75; // Increased from 50% to 75% growth
      // Update existing bullets too
      bullets.forEach(b => b.radius = player.bulletSize);
    }
  },
  {
    name: "Battle Focus",
    description: "Become invincible for 10 seconds",
    apply: () => {
      player.shieldActive = true;
      player.shieldTimer = 10000; // 10 seconds in milliseconds
      player.shieldBlinkTimer = 0;
    }
  }
];

const legendaryUpgrades = [
  { 
    name: "Heat Seeking Bullets", 
    description: "Your bullets will track nearby enemies",
    apply: () => player.hasHeatSeek = true 
  },
  { 
    name: "Ultra Magnet", 
    description: "Massively increase XP collection range by 20x",
    apply: () => player.magnetStrength *= 20 
  },
  { 
    name: "Mega Health Boost", 
    description: "Gain 20 maximum health and heal to full",
    apply: () => { player.maxHealth += 20; player.health += 20; } 
  },
  { 
    name: "Double Damage", 
    description: "Double the damage of all your bullets",
    apply: () => player.bulletDamage *= 2 
  },
  { 
    name: "Rapid Fire", 
    description: "Fire twice as fast, turning you into a bullet storm",
    apply: () => player.fireRate *= 0.5 
  }
];

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

  // Check for Konami Code
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      konamiIndex = 0;
      showPasswordPanel();
    }
  } else {
    konamiIndex = 0;
    // If the new key is the start of the sequence, count it
    if (e.key === konamiCode[0]) {
      konamiIndex = 1;
    }
  }

  if (e.key === "Escape" && gameStarted && !fadingIn && !fadingOut) {
    const menu = document.getElementById("levelUpMenu");
    // Check if cheat menu is visible
    if (menu.style.display === "block") {
      hideMenu(menu);
      gamePaused = false;
    } else {
      togglePause();
    }
  }
});

window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// Set up key binding system
document.getElementById("settingsButton").addEventListener("click", () => {
  showMenu(document.getElementById("settingsMenu"));
});

let activeKeyBindButton = null;

document.querySelectorAll('.keybind-button').forEach(button => {
  button.addEventListener('click', (e) => {
    // Reset any previously active button
    if (activeKeyBindButton) {
      activeKeyBindButton.style.background = '#333';
    }
    
    activeKeyBindButton = e.target;
    activeKeyBindButton.style.background = '#555';
    activeKeyBindButton.textContent = 'Press a key...';
    
    // One-time event listener for the next keypress
    const keyHandler = (e) => {
      e.preventDefault();
      const newKey = e.key.toLowerCase();
      
      // Don't allow Escape as a binding
      if (newKey === 'escape') {
        activeKeyBindButton.style.background = '#333';
        activeKeyBindButton.textContent = keyBindings[activeKeyBindButton.dataset.action].toUpperCase();
        activeKeyBindButton = null;
        document.removeEventListener('keydown', keyHandler);
        return;
      }
      
      // Update the binding
      keyBindings[activeKeyBindButton.dataset.action] = newKey;
      activeKeyBindButton.textContent = newKey.toUpperCase();
      activeKeyBindButton.style.background = '#333';
      activeKeyBindButton = null;
      
      // Save the new bindings
      saveKeyBindings();
      
      document.removeEventListener('keydown', keyHandler);
    };
    
    document.addEventListener('keydown', keyHandler, { once: true });
  });
});

// Load saved key bindings when the game starts
loadKeyBindings();

function startGame() {
  gameStarted = true;
  gameRunning = true;
  canvas.style.display = "block";
  document.getElementById("xpBarContainer").style.display = "block";
  requestAnimationFrame(gameLoop);
}

loreButton.addEventListener("click", () => {
  if (!gameStarted) {
    gameMode = 'story';
    startScreen.style.display = "none";
    startCutscene();
  }
});

endlessButton.addEventListener("click", () => {
  if (!gameStarted) {
    gameMode = 'endless';
    startScreen.style.display = "none";
    startGame();
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

  canvas.style.display = "none";
  document.getElementById("xpBarContainer").style.display = "none";
  cutscene.style.display = "block";
  currentCutsceneSlide = 0;
  img.src = cutsceneData[0].img;
  text.innerText = cutsceneData[0].text;
}



// Helper function for setting player level
function setPlayerLevel(level) {
  level = Math.min(20, Math.max(1, parseInt(level)));
  while (player.level < level) {
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * 1.4);
    if (player.level % 5 === 0) {
      enemyHealthMultiplier *= 2;
      obeliskDamageMultiplier *= 2;
    }
  }
  updateXPBar();
}

function showPasswordPanel() {
  gamePaused = true;
  const menu = document.getElementById("levelUpMenu");
  showMenu(menu, true);
  menu.innerHTML = `
    <div style="position: relative;">
      <button style="position: absolute; right: -10px; top: -10px; background: #333; color: red; border: none; width: 24px; height: 24px; border-radius: 12px; cursor: pointer; font-weight: bold; line-height: 24px; padding: 0;" 
        onclick="hideMenu(document.getElementById('levelUpMenu')); gamePaused = false;">✖</button>
      <h2 style='color: gold'>🔒 Enter Password 🔒</h2>
    </div>
    <div style="margin: 20px 0;">
      <input type="password" id="cheatPassword" style="width: 200px; padding: 5px; background: #333; color: white; border: 1px solid gold;">
      <button onclick="checkCheatPassword()" style="margin-left: 10px; padding: 5px 10px; background: #444; color: gold; border: 1px solid gold; cursor: pointer;">Submit</button>
    </div>`;
}

function checkCheatPassword() {
  const password = document.getElementById("cheatPassword").value;
  if (password === "Shadow milks power") {
    hideMenu(document.getElementById("levelUpMenu"));
    showCheatMenu();
  } else {
    const input = document.getElementById("cheatPassword");
    input.style.border = "1px solid red";
    input.value = "";
    input.placeholder = "Incorrect password";
    setTimeout(() => {
      input.style.border = "1px solid gold";
      input.placeholder = "";
    }, 1000);
  }
}

function showCheatMenu() {
  gamePaused = true;
  const menu = document.getElementById("levelUpMenu");
  showMenu(menu, true); // Use helper function with darker overlay
  
  menu.style.width = '90%'; // Make menu wider
  menu.style.maxWidth = '1200px'; // But not too wide
  menu.style.padding = '20px';
  menu.style.boxSizing = 'border-box';
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.gap = '20px';
  
  menu.innerHTML = `
    <div style="position: relative; text-align: center; margin-bottom: 20px;">
      <button style="position: absolute; right: -10px; top: -10px; background: #333; color: red; border: none; width: 24px; height: 24px; border-radius: 12px; cursor: pointer; font-weight: bold; line-height: 24px; padding: 0;" 
        onclick="hideMenu(document.getElementById('levelUpMenu')); gamePaused = false;">✖</button>
      <h2 style='color: gold; margin: 0;'>🎮 Cheat Menu 🎮</h2>
    </div>

    <!-- Level Selector Section -->
    <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 0 auto; width: fit-content;">
      <div style="color: gold; font-size: 18px; margin-bottom: 10px;">Set Player Level</div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        Current Level: 
        <input type="number" id="levelSelect" min="1" max="20" value="${player.level}" 
          style="width: 60px; padding: 5px; background: #333; color: white; border: 1px solid gold;">
        <button onclick="setPlayerLevel(parseInt(document.getElementById('levelSelect').value))"
          style="padding: 5px 15px; background: #444; color: gold; border: 1px solid gold; cursor: pointer;">
          Set Level
        </button>
      </div>
    </div>

    <!-- Upgrades Buttons Container -->
    <div style="display: flex; justify-content: center; gap: 20px;">
      <!-- Normal Upgrades Button -->
      <button id="normalUpgradesBtn" 
        style="padding: 15px 30px; 
        background: rgba(0,255,255,0.1); 
        border: 2px solid cyan; 
        color: cyan; 
        font-size: 18px; 
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s;">
        💠 Normal Upgrades
      </button>

      <!-- Legendary Upgrades Button -->
      <button id="legendaryUpgradesBtn" 
        style="padding: 15px 30px; 
        background: rgba(255,215,0,0.1); 
        border: 2px solid gold; 
        color: gold; 
        font-size: 18px; 
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s;">
        ⭐ Legendary Upgrades
      </button>
    </div>

    <!-- Upgrades Containers (Hidden by default) -->
    <div id="normalUpgradesPanel" style="display: none; margin-top: 20px;">
      <div style="background: rgba(0,255,255,0.1); padding: 15px; border-radius: 10px; border: 2px solid cyan;">
        <h3 style='text-align: center; color: cyan; margin: 0 0 15px 0;'>Normal Upgrades</h3>
        <div id="normalUpgradesContainer" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;"></div>
      </div>
    </div>

    <div id="legendaryUpgradesPanel" style="display: none; margin-top: 20px;">
      <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; border: 2px solid gold;">
        <h3 style='text-align: center; color: gold; margin: 0 0 15px 0;'>Legendary Upgrades</h3>
        <div id="legendaryUpgradesContainer" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;"></div>
      </div>
    </div>
  `;

  // Get containers and buttons
  const normalContainer = document.getElementById('normalUpgradesContainer');
  const legendaryContainer = document.getElementById('legendaryUpgradesContainer');
  const normalBtn = document.getElementById('normalUpgradesBtn');
  const legendaryBtn = document.getElementById('legendaryUpgradesBtn');
  const normalPanel = document.getElementById('normalUpgradesPanel');
  const legendaryPanel = document.getElementById('legendaryUpgradesPanel');

  // Add button hover effects
  [normalBtn, legendaryBtn].forEach(btn => {
    btn.onmouseover = () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.filter = 'brightness(1.2)';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'scale(1)';
      btn.style.filter = 'brightness(1)';
    };
  });

  // Add click handlers
  normalBtn.onclick = () => {
    normalPanel.style.display = normalPanel.style.display === 'none' ? 'block' : 'none';
    legendaryPanel.style.display = 'none';
    normalBtn.style.background = normalPanel.style.display === 'none' ? 'rgba(0,255,255,0.1)' : 'rgba(0,255,255,0.3)';
    legendaryBtn.style.background = 'rgba(255,215,0,0.1)';
  };

  legendaryBtn.onclick = () => {
    legendaryPanel.style.display = legendaryPanel.style.display === 'none' ? 'block' : 'none';
    normalPanel.style.display = 'none';
    legendaryBtn.style.background = legendaryPanel.style.display === 'none' ? 'rgba(255,215,0,0.1)' : 'rgba(255,215,0,0.3)';
    normalBtn.style.background = 'rgba(0,255,255,0.1)';
  };

  // Get and display normal upgrades
  const normalUpgrades = [
    { name: "Faster Fire Rate", apply: () => player.fireRate *= 0.85 },
    { name: "Move Speed +20%", apply: () => player.speed *= 1.2 },
    { name: "Bullet Speed +50%", apply: () => bullets.forEach(b => b.speed *= 1.5) },
    { name: "Max Health +5", apply: () => { player.maxHealth += 5; player.health += 5; } },
    { name: "Multi-Projectiles", apply: () => player.multiShot++ },
    { name: "Stronger Bullets", apply: () => player.bulletDamage++ },
    { name: "XP Magnet Range +40%", apply: () => player.magnetStrength *= 1.4 },
    { name: "Obelisk Heal +5", apply: () => obelisk.health = Math.min(obelisk.maxHealth, obelisk.health + 5) },
    { name: "Bigger Bullets", apply: () => bullets.forEach(b => b.radius = (b.radius || 4) * 1.5) },
    { name: "Obelisk Shield", description: "Add 5 defense to the obelisk with a protective shield", 
      apply: () => { obelisk.shieldDefense += 5; obelisk.hasShield = true; } }
  ];

  normalUpgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.style.padding = "8px";
    div.style.cursor = "pointer";
    div.style.transition = "all 0.2s";
    div.style.background = "rgba(0,0,0,0.2)";
    div.style.border = "1px solid cyan";
    div.style.borderRadius = "5px";
    div.style.textAlign = "center";
    div.style.minHeight = "40px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.innerHTML = `<div class="upgrade-name" style="font-size: 13px; color: cyan; line-height: 1.2;">${upg.name}</div>`;
    div.onmouseover = () => div.style.transform = "scale(1.02)";
    div.onmouseout = () => div.style.transform = "scale(1)";
    div.onclick = () => {
      upg.apply();
      div.style.backgroundColor = "rgba(0, 255, 255, 0.2)";
      setTimeout(() => div.style.backgroundColor = "rgba(0,0,0,0.2)", 200);
    };
    normalContainer.appendChild(div);
  });

  // Add legendary upgrades section header
  const legendaryHeader = document.createElement("div");
  legendaryHeader.innerHTML = "<h3 style='margin: 20px 0 10px 0; color: gold'>Legendary Upgrades</h3>";
  menu.appendChild(legendaryHeader);

  // Get and display legendary upgrades
  const legendaryUpgrades = [
    { name: "Heat Seeking Bullets", apply: () => player.hasHeatSeek = true },
    { name: "Ultra Magnet", apply: () => player.magnetStrength *= 20 },
    { name: "Mega Health +20", apply: () => { player.maxHealth += 20; player.health += 20; } },
    { name: "Double Damage", apply: () => player.bulletDamage *= 2 },
    { name: "Rapid Fire", apply: () => player.fireRate *= 0.5 },
    { name: "Double XP", apply: () => player.xpMultiplier *= 2 }
  ];

  legendaryUpgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.style.padding = "8px";
    div.style.cursor = "pointer";
    div.style.transition = "all 0.2s";
    div.style.background = "rgba(0,0,0,0.2)";
    div.style.border = "1px solid gold";
    div.style.borderRadius = "5px";
    div.style.textAlign = "center";
    div.style.minHeight = "40px";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.innerHTML = `<div class="upgrade-name" style="color: gold; font-size: 13px; line-height: 1.2;">⭐ ${upg.name}</div>`;
    div.onmouseover = () => div.style.transform = "scale(1.02)";
    div.onmouseout = () => div.style.transform = "scale(1)";
    div.onclick = () => {
      upg.apply();
      div.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
      setTimeout(() => div.style.backgroundColor = "rgba(0,0,0,0.2)", 200);
    };
    legendaryContainer.appendChild(div);
  });

  // Note: Close button removed in favor of corner X and ESC key

  menu.style.display = "block";
}

function setPlayerLevel(level) {
  level = Math.min(20, Math.max(1, parseInt(level)));
  while (player.level < level) {
    player.level++;
    player.xpToLevel = Math.floor(player.xpToLevel * 1.4);
    if (player.level % 5 === 0) {
      enemyHealthMultiplier *= 2;
      obeliskDamageMultiplier *= 2;
    }
  }
  updateXPBar();
}

function togglePause() {
  gamePaused = !gamePaused;

  const pauseMenu = document.getElementById("pauseMenu");
  const darkOverlay = document.getElementById("darkOverlay");
  
  if (gamePaused) {
    showMenu(pauseMenu);
  } else {
    hideMenu(pauseMenu);
  }
  darkOverlay.style.display = gamePaused ? "block" : "none";

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

  // Ensure deltaTime is reasonable (cap at 32ms to prevent huge jumps)
  deltaTime = Math.min(deltaTime, 32);

  // Update shield timer
  if (player.shieldActive) {
    player.shieldTimer -= deltaTime;

    // Start blinking in last 5 seconds
    if (player.shieldTimer <= 5000) {
      player.shieldBlinkTimer += deltaTime;
      // Blink every 400ms (slower blink)
      if (player.shieldBlinkTimer >= 400) {
        player.shieldBlinkTimer = 0;
      }
    }

    if (player.shieldTimer <= 0) {
      player.shieldActive = false;
      player.shieldTimer = 0;
      player.shieldBlinkTimer = 0;
    }
  }

  movePlayer();
  shootProjectiles(deltaTime);
  spawnEnemies(deltaTime);
  updateEnemies(deltaTime);
  updateBullets(deltaTime);
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
  updateParticles();
  drawParticles();
  drawUI();
}



function movePlayer(deltaTime = 16.67) {
  let dx = 0;
  let dy = 0;
  if (keys[keyBindings.up]) dy -= 1;
  if (keys[keyBindings.down]) dy += 1;
  if (keys[keyBindings.left]) dx -= 1;
  if (keys[keyBindings.right]) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    const timeScale = deltaTime / 16.67; // normalize to 60fps
    player.x += dx * player.speed * timeScale;
    player.y += dy * player.speed * timeScale;
  }
  player.x = Math.max(0, Math.min(WIDTH, player.x));
  player.y = Math.max(0, Math.min(HEIGHT, player.y));
}

function drawPlayer() {
  // Draw shield effect if active
  if (player.shieldActive) {
    // In last 5 seconds, blink the shield
    if (player.shieldTimer <= 5000) {
      if (player.shieldBlinkTimer < 200) {  // Show shield for first half of blink cycle
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
      }
    } else {
      // Solid shield effect before last 5 seconds
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    }
  }

  // Draw player
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
      speed: 6,
      radius: player.bulletSize, // Use player's bullet size instead of fixed value
      damage: player.bulletDamage,
      isHeatSeeking: player.hasHeatSeek,
      isOffscreen: false,
      initialAngle: angle, // Store the initial angle for tracking within a cone
      trackingStrength: 0.03 // Increased tracking for more noticeable curving
    });
  });
}

function updateBullets(deltaTime = 16.67) { // Default to 60fps if no deltaTime
  const timeScale = deltaTime / 16.67; // Normalize to 60fps

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // Check if bullet is off screen first
    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      b.isOffscreen = true; // Mark as off screen
      bullets.splice(i, 1);
      continue; // Skip the rest of the loop for this bullet
    }

    // Heat seeking behavior - only if not marked as off screen
    if (b.isHeatSeeking && enemies.length > 0 && !b.isOffscreen) {
      // Find the closest enemy in the direction we're shooting
      let bestEnemy = null;
      let bestScore = Infinity;
      
      enemies.forEach(enemy => {
        const dx = enemy.x - b.x;
        const dy = enemy.y - b.y;
        const dist = Math.hypot(dx, dy);
        
        // Calculate angle between bullet's current direction and enemy
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = enemyAngle - b.initialAngle;
        // Normalize angle difference to [-PI, PI]
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Score based on distance and angle difference
        // Lower score is better
        const angleWeight = 2; // How much we care about angle vs distance
        const score = dist * (1 + Math.abs(angleDiff) * angleWeight);
        
        // Only consider enemies within a 90-degree cone of our shot
        if (Math.abs(angleDiff) < Math.PI / 4 && score < bestScore) {
          bestScore = score;
          bestEnemy = enemy;
        }
      });

      if (bestEnemy) {
        // Calculate angle to enemy
        const dx = bestEnemy.x - b.x;
        const dy = bestEnemy.y - b.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Gradually adjust bullet angle towards enemy with reduced tracking
        let angleDiff = targetAngle - b.angle;
        // Normalize angle difference to [-PI, PI]
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Use stronger tracking for more noticeable curving
        b.angle += angleDiff * 0.03;
      }
    }

    // Move bullet with delta time compensation
    b.x += Math.cos(b.angle) * b.speed * timeScale;
    b.y += Math.sin(b.angle) * b.speed * timeScale;
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
  // Calculate level-based multipliers (gets stronger each boss fight)
  const bossLevel = Math.floor(player.level / 5);
  const healthMultiplier = 1 + (bossLevel * 0.5); // Each boss is 50% stronger than the last
  const speedMultiplier = 1 + (bossLevel * 0.2); // Each boss is 20% faster than the last

  enemies.push({
    x: Math.random() * WIDTH,
    y: -40,
    radius: 35, // Slightly larger
    speed: enemySpeed * 0.8 * speedMultiplier, // Faster than before but still manageable
    health: 15 * enemyHealthMultiplier * healthMultiplier, // Much more health
    maxHealth: 15 * enemyHealthMultiplier * healthMultiplier,
    isBoss: true,
    damageMultiplier: 1 + (bossLevel * 0.3), // Bosses deal more damage as levels progress
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
    const baseRange = 100;
    const magnetRange = baseRange * (player.magnetStrength / 0.05); // 0.05 is the base magnetStrength
    if (dist < magnetRange) {
      orb.x += dx * 0.05; // Use base magnet strength for consistent pull speed
      orb.y += dy * 0.05;
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
  // In story mode, don't gain XP after level 20
  if (gameMode === 'story' && player.level >= 20) {
    return;
  }

  const multipliedAmount = Math.floor(amount * player.xpMultiplier);
  player.xp += multipliedAmount;
  updateXPBar();
  if (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    player.level++;
    
    // Check for story mode completion
    if (gameMode === 'story' && player.level >= 20) {
      gameOver(true); // Pass true to indicate victory
      return;
    }
    
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
          
          // Victory condition for story mode level 20
          if (gameMode === 'story' && player.level >= 20) {
            showVictoryScreen();
            return;
          }
          
          enemyHealthMultiplier *= 2;
          obeliskDamageMultiplier *= 2;
          showLegendaryUpgradeMenu();
        }
        if (enemy.health <= 0) {
          // Activate kill shield if player has the upgrade
          if (player.killShieldDuration) {
            player.shieldTime = player.killShieldDuration;
          }
          spawnDeathParticles(enemy.x, enemy.y);
          // Bosses give more XP, scaled with level
          const xpValue = enemy.isBoss ? 10 + Math.floor(player.level / 5) * 5 : 3;
          xpOrbs.push({ x: enemy.x, y: enemy.y, value: xpValue });
          enemies.splice(i, 1);
        }
        break;
      }
    }

    const dx = obelisk.x - enemy.x;
    const dy = obelisk.y - enemy.y;
    if (Math.hypot(dx, dy) < obelisk.radius + enemy.radius) {
      if (enemy.isBoss) {
        // If a boss hits the obelisk, instant game over
        obelisk.health = 0;
        gameStarted = false;
        gameRunning = false;
        canvas.style.display = "none"; // Hide the game canvas
        gameOver(false);  // Show game over screen with defeat condition
      } else {
        // Regular enemies do normal damage
        let damage = Math.round(1 * obeliskDamageMultiplier * (enemy.damageMultiplier || 1));
        if (obelisk.hasShield && obelisk.shieldDefense > 0) {
          // Shield absorbs damage and is reduced
          if (damage <= obelisk.shieldDefense) {
            // Shield absorbs all damage
            obelisk.shieldDefense -= damage;
            damage = 0;
          } else {
            // Shield breaks and remaining damage goes through
            damage -= obelisk.shieldDefense;
            obelisk.shieldDefense = 0;
            obelisk.hasShield = false;
          }
        }
        obelisk.health -= damage;
      }
      enemies.splice(i, 1);
    }

    const px = player.x - enemy.x;
    const py = player.y - enemy.y;
    if (Math.hypot(px, py) < player.radius + enemy.radius) {
      // Only take damage if not shielded
      if (!player.shieldActive) {
        player.health -= 1;
      }
      enemies.splice(i, 1);
    }
  }
}

function drawObelisk() {
  // Draw shield if active
  if (obelisk.hasShield && obelisk.shieldDefense > 0) {
    ctx.save();
    ctx.translate(obelisk.x, obelisk.y);
    ctx.rotate(Math.PI / 4); // Rotate to make a diamond
    ctx.strokeStyle = "rgba(0, 150, 255, 0.6)"; // Blue color for shield
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Draw shield slightly larger than the obelisk
    const shieldSize = obelisk.radius + 8;
    ctx.rect(-shieldSize, -shieldSize, shieldSize * 2, shieldSize * 2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  // Draw main obelisk
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
  showMenu(menu);
  menu.innerHTML = "<h2>Level Up! Choose an Upgrade</h2>";
  const choices = normalUpgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
  choices.forEach((upg) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <div class="upgrade-name">${upg.name}</div>
      <div class="upgrade-description">${upg.description}</div>
    `;
    div.onclick = () => {
      upg.apply();
      hideMenu(menu);
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
  showMenu(menu);
  menu.innerHTML = "<h2>Legendary Upgrade! Choose One</h2>";
  const choices = legendaryUpgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
  choices.forEach((upg) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <div class="upgrade-name">${upg.name}</div>
      <div class="upgrade-description">${upg.description}</div>
    `;
    div.onclick = () => {
      upg.apply();
      hideMenu(menu);
      gamePaused = false;
    };
    menu.appendChild(div);
  });
  menu.style.display = "block";
}

function gameOver(victory = false) {
  const screen = document.getElementById("gameOverScreen");
  const currentLevelDisplay = document.getElementById("currentLevelDisplay");
  const finalHighscoreDisplay = document.getElementById("finalHighscoreDisplay");
  const header = screen.querySelector("h2");
  const message = document.getElementById("gameOverMessage");
  
  // Ensure the game over screen is visible
  screen.style.display = "block";
  canvas.style.display = "none";

  // Set the message based on game mode and outcome
  if (gameMode === 'story') {
    if (victory) {
      header.innerText = "Victory!";
      header.style.color = "#00ff00";
      message.innerText = "You have defeated the Obelisk and saved the realm!";
      currentLevelDisplay.innerText = player.level;
    } else {
      header.innerText = "Game Over";
      header.style.color = "#ff0000";
      message.innerText = "The darkness has prevailed... Try again!";
      currentLevelDisplay.innerText = player.level;
    }
  } else {
    header.innerText = "Game Over";
    header.style.color = "#ffffff";
    currentLevelDisplay.innerText = player.level;
  }

  // Check and update highscore
  const storedHighscore = localStorage.getItem("obeliskHighscore") || "0";
  const currentHighscore = parseInt(storedHighscore);
  
  if (player.level > currentHighscore) {
    // New highscore achieved!
    highscore = player.level;
    localStorage.setItem("obeliskHighscore", highscore);
    finalHighscoreDisplay.style.color = "#ffd700"; // Gold color
    finalHighscoreDisplay.innerText = highscore + " (New Record!)";
  } else {
    // Display current highscore
    finalHighscoreDisplay.style.color = "#ffffff";
    finalHighscoreDisplay.innerText = currentHighscore;
  }

  // Get the restart button reference
  const restartButton = document.getElementById("restartButton");
  
  // Main menu button handler
  mainMenuBtn.onclick = () => {
    screen.style.display = "none";
    document.getElementById("startScreen").style.display = "block";
    canvas.style.display = "none";
    document.getElementById("xpBarContainer").style.display = "none";
    gameStarted = false;
    gameRunning = false;
    // Reset all game state
    player.level = 1;
    player.xp = 0;
    player.xpToLevel = 10;
    enemies = [];
    bullets = [];
    xpOrbs = [];
  };

  // Buttons are already created in the HTML
  mainMenuButton.innerText = "Main Menu";
  mainMenuButton.style.marginLeft = "10px";
  mainMenuButton.style.display = "inline-block";
  
  // Set up main menu button click handler
  mainMenuButton.onclick = () => {
    // Hide game over screen and show start screen
    screen.style.display = "none";
    document.getElementById("startScreen").style.display = "block";
    canvas.style.display = "none";
    document.getElementById("xpBarContainer").style.display = "none";
    
    // Reset all game state variables
    gameStarted = false;
    gameRunning = false;
    gamePaused = false;
    fadingIn = false;
    fadingOut = false;
    fadeOpacity = 0;
    
    // Reset game objects and player stats
    player.x = WIDTH / 2;
    player.y = HEIGHT / 2 - 100;
    player.level = 1;
    player.xp = 0;
    player.xpToLevel = 10;
    player.health = player.maxHealth = 5;
    player.bulletDamage = 1;
    player.multiShot = 0;
    player.magnetStrength = 0.05;
    player.fireRate = 500;
    player.speed = 0.8; // Keep the updated speed value
    player.shieldActive = false;
    player.shieldTimer = 0;
    player.shieldBlinkTimer = 0;
    player.hasHeatSeek = false;
    player.xpMultiplier = 1;
    
    obelisk.x = WIDTH / 2;
    obelisk.y = HEIGHT / 2;
    obelisk.health = obelisk.maxHealth = 10;
    
    // Reset enemies and game progression
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
    
    // Reset XP bar
    updateXPBar();
    
    // Restart game loop timing
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  };
  
  // Game over buttons are now handled in HTML

  if (player.level >= 20) {
    header.innerText = "🎉 YOU WON 🎉";
    
    resumeButton.onclick = () => {
      screen.style.display = "none";
      gamePaused = false;
      requestAnimationFrame(gameLoop);
    };

    buttonContainer.appendChild(resumeButton);
    buttonContainer.appendChild(mainMenuButton);

    if (!document.getElementById("resumeFromVictory")) {
      screen.appendChild(resumeButton);
    }
  } else {
    header.innerText = "Game Over";
    restartButton.style.display = "inline-block";

    const existing = document.getElementById("resumeFromVictory");
    if (existing) existing.remove();
  }

  // Show the game over screen
  screen.style.display = "block";
}

let lastTime = performance.now();
function gameLoop(currentTime) {
  if (!gameStarted || !gameRunning || gamePaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  if (gameStarted && gameRunning && !gamePaused) {
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
    movePlayer(deltaTime);
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
    startGame();
  }
});

document.getElementById("skipCutscene").addEventListener("click", () => {
  document.getElementById("cutscene").style.display = "none";
  startGame();
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

function createParticle(x, y, color) {
  const speed = 2 + Math.random() * 2;
  const angle = Math.random() * Math.PI * 2;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    color,
    size: 3 + Math.random() * 3
  };
}

function spawnDeathParticles(x, y) {
  const colors = ['#ff0000', '#ff4400', '#ff6600'];
  for (let i = 0; i < 12; i++) {
    particles.push(createParticle(x, y, colors[Math.floor(Math.random() * colors.length)]));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawFadeOverlay() {
  if (fadeOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

window.onload = () => {
  document.getElementById("restartButton").onclick = () => {
    // Hide screens
    document.getElementById("gameOverScreen").style.display = "none";
    startScreen.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("xpBarContainer").style.display = "block";
    
    // Reset game state
    gameStarted = true;
    gameRunning = true;
    gamePaused = false;
    fadingIn = false;
    fadingOut = false;
    fadeOpacity = 0;
    
    // Reset player stats and position
    player.x = WIDTH / 2;
    player.y = HEIGHT / 2 - 100;
    player.level = 1;
    player.xp = 0;
    player.xpToLevel = 10;
    player.health = player.maxHealth = 5;
    player.bulletDamage = 1;
    player.multiShot = 0;
    player.magnetStrength = 0.05;
    player.fireRate = 500;
    player.speed = 0.8;
    player.hasHeatSeek = false;
    player.shieldActive = false;
    player.shieldTimer = 0;
    player.shieldBlinkTimer = 0;
    player.xpMultiplier = 1;
    player.bulletSize = 4;
    
    // Reset obelisk
    obelisk.x = WIDTH / 2;
    obelisk.y = HEIGHT / 2;
    obelisk.health = obelisk.maxHealth = 10;
    obelisk.hasShield = false;
    obelisk.shieldDefense = 0;
    
    // Clear all arrays
    enemies = [];
    bullets = [];
    xpOrbs = [];
    
    // Reset enemy settings
    enemySpeed = 0.3;
    enemySpawnInterval = 900;
    enemySpawnTimer = 0;
    bossActive = false;
    bossSpawned = false;
    inBossFight = false;
    enemyHealthMultiplier = 1;
    obeliskDamageMultiplier = 1;
    
    // Reset UI
    updateXPBar();
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Handle menu button
document.getElementById("menuButton").onclick = () => {
  // Hide game over screen
  document.getElementById("gameOverScreen").style.display = "none";
  // Show start screen
  startScreen.style.display = "block";
  // Reset game state
  gameStarted = false;
  gameRunning = false;
  gamePaused = false;
  fadingIn = false;
  fadingOut = false;
  fadeOpacity = 0;
};

// Handle victory restart button
document.getElementById("victoryRestartButton").onclick = () => {
  location.reload();
};

  // Restart the game loop
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};
