class Enemy {
    constructor(x, y, isBoss = false, healthMultiplier = 1, speed = 0.3) {
        this.x = x;
        this.y = y;
        this.isBoss = isBoss;
        this.radius = isBoss ? 30 : 12;
        this.speed = isBoss ? speed * 0.5 : speed;
        this.health = isBoss ? 10 * healthMultiplier : 1 * healthMultiplier;
        this.maxHealth = this.health;
    }

    update(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        this.x += (dx / dist) * this.speed * deltaTime * 0.1;
        this.y += (dy / dist) * this.speed * deltaTime * 0.1;
    }

    draw(ctx) {
        // Draw enemy
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Draw health bar
        const barWidth = 20;
        const barHeight = 3;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const healthBarWidth = barWidth * healthPercent;

        ctx.fillStyle = "limegreen";
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, healthBarWidth, barHeight);
    }

    static spawn(width, height, isBoss = false, healthMultiplier = 1, speed = 0.3) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: x = Math.random() * width; y = -20; break;
            case 1: x = width + 20; y = Math.random() * height; break;
            case 2: x = Math.random() * width; y = height + 20; break;
            case 3: x = -20; y = Math.random() * height; break;
        }

        return new Enemy(x, y, isBoss, healthMultiplier, speed);
    }
}
