class GameState {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.WIDTH = canvas.width;
        this.HEIGHT = canvas.height;
        
        this.reset();
        this.setupEventListeners();
    }

    reset() {
        this.keys = {};
        this.mouseX = this.WIDTH / 2;
        this.mouseY = this.HEIGHT / 2;
        
        this.gamePaused = false;
        this.gameStarted = false;
        this.gameRunning = false;
        this.fadeOpacity = 0;
        this.fadingIn = false;
        this.fadingOut = false;

        this.enemySpeed = 0.3;
        this.enemySpawnInterval = 900;
        this.enemySpawnTimer = 0;
        this.enemyHealthMultiplier = 1;
        this.obeliskDamageMultiplier = 1;

        this.bossActive = false;
        this.bossSpawned = false;
        this.inBossFight = false;

        // Initialize game objects
        this.player = new Player(this.WIDTH / 2, this.HEIGHT / 2 - 100);
        this.obelisk = new Obelisk(this.WIDTH / 2, this.HEIGHT / 2);
        this.enemies = [];
        this.bullets = [];
        this.xpOrbs = [];

        // Load highscore
        this.highscore = localStorage.getItem("obeliskHighscore") || 0;
    }

    setupEventListeners() {
        window.addEventListener("keydown", (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === "Escape" && this.gameStarted && !this.fadingIn && !this.fadingOut) {
                this.togglePause();
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    update(deltaTime) {
        if (this.gamePaused) return;

        // Update player
        this.player.move(this.keys, this.WIDTH, this.HEIGHT);
        const newBullets = this.player.shoot(this.mouseX, this.mouseY, deltaTime);
        if (newBullets) this.bullets.push(...newBullets);

        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update projectiles and collectibles
        this.updateBullets();
        this.updateXPOrbs();
        
        // Check all collisions
        this.checkCollisions();

        // Boss fight logic
        if (this.inBossFight && !this.bossSpawned && this.enemies.length === 0) {
            this.enemies.push(Enemy.spawn(this.WIDTH, this.HEIGHT, true, this.enemyHealthMultiplier, this.enemySpeed));
            this.bossActive = true;
            this.bossSpawned = true;
        }
    }

    updateEnemies(deltaTime) {
        if (!this.inBossFight && !this.bossActive) {
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer > this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                this.enemies.push(Enemy.spawn(this.WIDTH, this.HEIGHT, false, this.enemyHealthMultiplier, this.enemySpeed));
            }
        }

        this.enemies.forEach(enemy => enemy.update(this.obelisk.x, this.obelisk.y, deltaTime));
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            
            if (bullet.x < 0 || bullet.x > this.WIDTH || bullet.y < 0 || bullet.y > this.HEIGHT) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateXPOrbs() {
        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i];
            const dx = this.player.x - orb.x;
            const dy = this.player.y - orb.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 100) {
                orb.x += dx * this.player.magnetStrength;
                orb.y += dy * this.player.magnetStrength;
            }
            
            if (dist < this.player.radius + 5) {
                const levelUp = this.player.gainXP(orb.value);
                this.xpOrbs.splice(i, 1);
                this.updateXPBar();
                
                if (levelUp) {
                    if (this.player.level % 5 === 0) {
                        this.inBossFight = true;
                        this.bossSpawned = false;
                    }
                    this.showLevelUpMenu();
                }
            }
        }
    }

    checkCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Check bullet collisions
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (Math.hypot(dx, dy) < bullet.radius + enemy.radius) {
                    this.bullets.splice(j, 1);
                    enemy.health -= bullet.damage;
                    
                    if (enemy.health <= 0) {
                        if (enemy.isBoss) {
                            this.handleBossDeath();
                        }
                        this.xpOrbs.push({ x: enemy.x, y: enemy.y, value: 3 });
                        this.enemies.splice(i, 1);
                    }
                    break;
                }
            }

            // Check obelisk collision
            const dxObelisk = this.obelisk.x - enemy.x;
            const dyObelisk = this.obelisk.y - enemy.y;
            if (Math.hypot(dxObelisk, dyObelisk) < this.obelisk.radius + enemy.radius) {
                this.obelisk.health -= Math.round(1 * this.obeliskDamageMultiplier);
                this.enemies.splice(i, 1);
                continue;
            }

            // Check player collision
            const dxPlayer = this.player.x - enemy.x;
            const dyPlayer = this.player.y - enemy.y;
            if (Math.hypot(dxPlayer, dyPlayer) < this.player.radius + enemy.radius) {
                this.player.health -= 1;
                this.enemies.splice(i, 1);
            }
        }
    }

    handleBossDeath() {
        this.bossActive = false;
        this.inBossFight = false;
        this.enemyHealthMultiplier *= 2;
        this.obeliskDamageMultiplier *= 2;
        this.showLegendaryUpgradeMenu();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // Draw game objects
        this.obelisk.draw(this.ctx);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw bullets
        this.ctx.fillStyle = "white";
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Draw XP orbs
        this.ctx.fillStyle = "lime";
        this.xpOrbs.forEach(orb => {
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Draw UI
        this.drawUI();
        this.drawFadeOverlay();
    }

    drawUI() {
        this.ctx.fillStyle = "white";
        this.ctx.fillText(`Obelisk Health: ${Math.round(this.obelisk.health)}`, 10, 20);
        this.ctx.fillText(`Player Health: ${this.player.health}`, 10, 40);
        this.ctx.fillText(`Level: ${this.player.level}`, 10, 60);
    }

    drawFadeOverlay() {
        if (this.fadeOpacity > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeOpacity})`;
            this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }
    }

    drawStartMenu() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        this.ctx.fillStyle = "#fff";
        this.ctx.font = "48px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("The Obelisk of Demise", this.WIDTH / 2, this.HEIGHT / 2 - 100);

        this.ctx.font = "24px sans-serif";
        this.ctx.fillText("Click to Begin", this.WIDTH / 2, this.HEIGHT / 2 + 20);
    }

    updateXPBar() {
        const percent = (this.player.xp / this.player.xpToLevel) * 100;
        document.getElementById("xpBar").style.width = percent + "%";
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseMenu = document.getElementById("pauseMenu");
        pauseMenu.style.display = this.gamePaused ? "block" : "none";

        if (this.gamePaused) {
            const highscoreDisplay = document.getElementById("highscoreDisplay");
            highscoreDisplay.innerText = localStorage.getItem("obeliskHighscore") || 0;
        }
    }

    showLevelUpMenu() {
        this.gamePaused = true;
        const menu = document.getElementById("levelUpMenu");
        menu.innerHTML = "<h2>Level Up! Choose an Upgrade</h2>";
        
        const upgrades = [
            { name: "Faster Fire Rate", apply: () => this.player.fireRate *= 0.85 },
            { name: "Move Speed +20%", apply: () => this.player.speed *= 1.2 },
            { name: "Max Health +5", apply: () => { 
                this.player.maxHealth += 5; 
                this.player.health += 5; 
            }},
            { name: "Heal +5", apply: () => {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);
            }},
            { name: "Multi-Projectiles", apply: () => this.player.multiShot++ },
            { name: "Stronger Bullets", apply: () => this.player.bulletDamage++ },
            { name: "Stronger XP Magnet", apply: () => this.player.magnetStrength *= 2.5 }
        ];

        this.createUpgradeMenu(menu, upgrades, () => {
            this.enemySpeed += 0.05;
            this.enemySpawnInterval = Math.max(300, this.enemySpawnInterval - 100);
        });
    }

    showLegendaryUpgradeMenu() {
        this.gamePaused = true;
        const menu = document.getElementById("levelUpMenu");
        menu.innerHTML = "<h2>Legendary Upgrade! Choose One</h2>";
        
        const upgrades = [
            { name: "Laser Barrage", apply: () => this.player.multiShot += 3 },
            { name: "Ultra Magnet", apply: () => this.player.magnetStrength *= 5 },
            { name: "Mega Health Boost", apply: () => {
                this.player.maxHealth += 20;
                this.player.health += 20;
            }},
            { name: "Double Damage", apply: () => this.player.bulletDamage *= 2 },
            { name: "Rapid Fire", apply: () => this.player.fireRate *= 0.5 }
        ];

        this.createUpgradeMenu(menu, upgrades);
    }

    createUpgradeMenu(menu, upgrades, additionalEffect = null) {
        const choices = upgrades.sort(() => 0.5 - Math.random()).slice(0, 3);
        choices.forEach(upgrade => {
            const div = document.createElement("div");
            div.className = "upgrade";
            div.innerText = upgrade.name;
            div.onclick = () => {
                upgrade.apply();
                menu.style.display = "none";
                this.gamePaused = false;
                if (additionalEffect) additionalEffect();
            };
            menu.appendChild(div);
        });
        menu.style.display = "block";
    }
}
