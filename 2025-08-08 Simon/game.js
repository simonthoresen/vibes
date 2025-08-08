const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_BULLET_SPEED = 4;
const ENEMY_PLANE_SPEED = 2;
const PARTICLE_LIFETIME = 120;

let keys = {};
let player;
let bullets = [], enemies = [], turrets = [], enemyBullets = [], particles = [];
let life = 5, score = 0;
let highscore = parseInt(localStorage.getItem("highscore") || "0");
let backgroundLayers = [
    Array.from({ length: 20 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 300 })),
    Array.from({ length: 30 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 250 })),
    Array.from({ length: 40 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 200 }))
];
let screenFlash = 0;
let screenShake = 0;
let gameStarted = false, gameOver = false;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vector(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vector(this.x * s, this.y * s); }
    normalize() {
        const len = Math.hypot(this.x, this.y);
        return len === 0 ? new Vector(0, 0) : new Vector(this.x / len, this.y / len);
    }
}

class GameObject {
    constructor(x, y) {
        this.pos = new Vector(x, y);
    }
    update() {}
    draw() {}
}

class Player extends GameObject {
    constructor() {
        super(canvas.width / 2, canvas.height - 60);
        this.shootCooldown = 0;
    }
    update() {
        if (keys["ArrowLeft"] || keys["a"]) this.pos.x -= PLAYER_SPEED;
        if (keys["ArrowRight"] || keys["d"]) this.pos.x += PLAYER_SPEED;
        if (keys["ArrowUp"] || keys["w"]) this.pos.y -= PLAYER_SPEED;
        if (keys["ArrowDown"] || keys["s"]) this.pos.y += PLAYER_SPEED;

        if (this.shootCooldown-- <= 0) {
            bullets.push(new Bullet(this.pos.x, this.pos.y - 15));
            this.shootCooldown = 5;
        }

        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(
                this.pos.x - 5 + Math.random() * 10,
                this.pos.y + 10,
                0, 2, 30, "white", "rect"
            ));
        }
    }
    draw() {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y - 10);
        ctx.lineTo(this.pos.x - 10, this.pos.y + 10);
        ctx.lineTo(this.pos.x + 10, this.pos.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Bullet extends GameObject {
    update() { this.pos.y -= BULLET_SPEED; }
    draw() {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class EnemyPlane extends GameObject {
    constructor(offset, amplitude = 200, frequency = 20, centerX = canvas.width / 2) {
        super(0, -20);
        this.offset = offset;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.velocity = ENEMY_PLANE_SPEED + 1;
        this.centerX = centerX;
    }
    update() {
        this.offset++;
        this.pos.x = Math.sin(this.offset / this.frequency) * this.amplitude + this.centerX;
        this.pos.y += this.velocity;
    }
    draw() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        const dx = Math.sin((this.offset + 1) / this.frequency) * this.amplitude - Math.sin(this.offset / this.frequency) * this.amplitude;
        const angle = Math.atan2(this.velocity, dx);
        ctx.rotate(angle + 3 * Math.PI / 2);
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-10, -10);
        ctx.lineTo(10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

class Turret extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.cooldown = 0;
    }
    update() {
        if (this.cooldown-- <= 0) {
            const dir = player.pos.sub(this.pos).normalize();
            enemyBullets.push(new EnemyBullet(this.pos.x, this.pos.y, dir.x * ENEMY_BULLET_SPEED, dir.y * ENEMY_BULLET_SPEED));
            this.cooldown = 90;
        }
        this.pos.y += 1;
    }
    draw() {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnemyBullet extends GameObject {
    constructor(x, y, dx, dy) {
        super(x, y);
        this.vel = new Vector(dx, dy);
    }
    update() { this.pos = this.pos.add(this.vel); }
    draw() {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Particle extends GameObject {
    constructor(x, y, dx, dy, lifetime, color, shape) {
        super(x, y);
        this.vel = new Vector(dx, dy);
        this.lifetime = lifetime;
        this.color = color;
        this.shape = shape;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.lifetime--;
    }
    draw() {
        const alpha = Math.max(0, this.lifetime / PARTICLE_LIFETIME);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        if (this.shape === "circle") {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === "rect") {
            ctx.fillRect(this.pos.x, this.pos.y, 3, 6);
        } else if (this.shape === "triangle") {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.lineTo(this.pos.x - 4, this.pos.y + 6);
            ctx.lineTo(this.pos.x + 4, this.pos.y + 6);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function spawnTurrets() {
    if (turrets.length < 2) {
        const x = Math.random() * (canvas.width - 40) + 20;
        turrets.push(new Turret(x, -20));
    }
}

function spawnEnemyPlanes() {
    const sharedOffset = Math.random() * 1000;
    const sharedAmplitude = 100 + Math.random() * 200;
    const sharedFrequency = 10 + Math.random() * 20;
    const sharedCenter = 100 + Math.random() * (canvas.width - 200);
    let delay = 0;
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            enemies.push(new EnemyPlane(sharedOffset + i * 10, sharedAmplitude, sharedFrequency, sharedCenter));
        }, delay);
        delay += 200;
    }
}

function checkCollision(a, b, dist) {
    return a.pos.sub(b.pos).x ** 2 + a.pos.sub(b.pos).y ** 2 < dist ** 2;
}

function explode(obj, color, shape) {
    for (let i = 0; i < 15; i++) {
        const dx = (Math.random() - 0.5) * 4;
        const dy = (Math.random() - 0.5) * 4;
        particles.push(new Particle(obj.pos.x, obj.pos.y, dx, dy, PARTICLE_LIFETIME, color, shape));
    }
}

function drawLives() {
    const radius = 10;
    const spacing = 25;
    const totalWidth = spacing * 5;
    const startX = canvas.width / 2 + totalWidth / 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(startX - i * spacing, 20, radius, 0, Math.PI * 2);
        ctx.fillStyle = i < life ? "white" : "black";
        ctx.strokeStyle = "white";
        ctx.fill();
        ctx.stroke();
    }
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Score: " + score + " | Highscore: " + highscore, canvas.width / 2, 50);
}

const newgameImage = new Image();
newgameImage.src = "newgame.png";

function drawStartScreen() {
    if (newgameImage.complete) {
        const x = canvas.width / 2 - newgameImage.width / 2;
        const y = canvas.height / 2 - newgameImage.height / 2;
        ctx.drawImage(newgameImage, x, y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, newgameImage.width, newgameImage.height);
    }
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACE to Start", canvas.width / 2, canvas.height / 2 + 220);
}

const gameoverImage = new Image();
gameoverImage.src = "gameover.png";

function drawGameOver() {
    if (gameoverImage.complete) {
        const x = canvas.width / 2 - gameoverImage.width / 2;
        const y = canvas.height / 2 - gameoverImage.height / 2;
        ctx.drawImage(gameoverImage, x, y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, gameoverImage.width, gameoverImage.height);
    }
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 220);
    ctx.fillText("Highscore: " + highscore, canvas.width / 2, canvas.height / 2 + 260);
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 300);
}

function gameLoop() {
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
        screenShake--;
    }
    ctx.fillStyle = "#402000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layerColors = ["#3b2b1a", "#503b25", "#6b4e2e"];
    const layerSpeeds = [0.4, 0.7, 1];
    backgroundLayers.forEach((layer, i) => {
        ctx.fillStyle = layerColors[i];
        layer.forEach(tile => {
            ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
            tile.y += layerSpeeds[i];
            if (tile.y > canvas.height) {
                tile.y = -tile.size;
                tile.x = Math.random() * canvas.width;
            }
        });
    });
    ctx.restore();

    if (screenFlash > 0) {
        ctx.fillStyle = (life === 1) ? "red" : "white";
        ctx.globalAlpha = screenFlash / 10;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        screenFlash--;
    }

    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (gameOver) {
        drawGameOver();
        requestAnimationFrame(gameLoop);
        return;
    }

    player.update();
    player.draw();

    bullets.forEach(b => b.update());
    bullets.forEach(b => b.draw());
    bullets = bullets.filter(b => b.pos.y > -10);

    turrets.forEach(t => t.update());
    turrets.forEach(t => t.draw());
    turrets = turrets.filter(t => t.pos.y < canvas.height + 20);

    enemyBullets.forEach(b => b.update());
    enemyBullets.forEach(b => b.draw());
    enemyBullets = enemyBullets.filter(b => b.pos.y < canvas.height + 10);

    enemies.forEach(e => e.update());
    enemies.forEach(e => e.draw());
    enemies = enemies.filter(e => e.pos.y < canvas.height + 20);

    particles.forEach(p => p.update());
    particles.forEach(p => p.draw());
    particles = particles.filter(p => p.lifetime > 0);

    for (let e of enemies) {
        for (let b of bullets) {
            if (checkCollision(e, b, 15)) {
                explode(e, "red", "triangle");
                enemies.splice(enemies.indexOf(e), 1);
                bullets.splice(bullets.indexOf(b), 1);
                score += 10;
                break;
            }
        }
        if (checkCollision(player, e, 20)) {
            explode(e, "red", "triangle");
            explode(player, "white", "triangle");
            enemies.splice(enemies.indexOf(e), 1);
            life--;
            screenFlash = 15;
            screenShake = 30;
        }
    }

    for (let t of turrets) {
        for (let b of bullets) {
            if (checkCollision(t, b, 15)) {
                explode(t, "green", "circle");
                turrets.splice(turrets.indexOf(t), 1);
                bullets.splice(bullets.indexOf(b), 1);
                score += 20;
                break;
            }
        }
    }

    for (let b of enemyBullets) {
        if (checkCollision(player, b, 15)) {
            explode(player, "white", "triangle");
            enemyBullets.splice(enemyBullets.indexOf(b), 1);
            life--;
            screenFlash = 15;
            screenShake = 30;
        }
    }

    if (life <= 0) {
        gameOver = true;
        if (score > highscore) {
            highscore = score;
            localStorage.setItem("highscore", highscore);
        }
    }

    drawLives();
    drawScore();

    if (Math.random() < 0.01) spawnTurrets();
    if (Math.random() < 0.01) spawnEnemyPlanes();

    requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === " " && !gameStarted) {
        player = new Player();
        gameStarted = true;
    }
    if (e.key === "r" && gameOver) {
        bullets = [];
        enemies = [];
        turrets = [];
        enemyBullets = [];
        particles = [];
        life = 5;
        score = 0;
        gameOver = false;
        player = new Player();
    }
});

window.addEventListener("keyup", e => keys[e.key] = false);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

drawStartScreen();
requestAnimationFrame(gameLoop);
