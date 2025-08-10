class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 2;
        this.fireRate = 500;
        this.lastShot = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 10;
        this.health = 5;
        this.maxHealth = 5;
        this.multiShot = 0;
        this.bulletDamage = 1;
        this.magnetStrength = 0.05;
    }

    move(keys, width, height) {
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
            this.x += dx * this.speed;
            this.y += dy * this.speed;
        }
        
        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
    }

    draw(ctx) {
        // Draw player
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "cyan";
        ctx.fill();
        ctx.closePath();

        // Draw health bar
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 15, this.y - 25, 30, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.health / this.maxHealth), 4);
    }

    shoot(mouseX, mouseY, deltaTime) {
        this.lastShot += deltaTime;
        if (this.lastShot < this.fireRate) return null;
        
        this.lastShot = 0;
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const baseAngle = Math.atan2(dy, dx);
        const angles = [baseAngle];
        const spread = 0.15;

        for (let i = 1; i <= this.multiShot; i++) {
            angles.push(baseAngle + spread * i);
            angles.push(baseAngle - spread * i);
        }

        return angles.map(angle => ({
            x: this.x,
            y: this.y,
            angle,
            speed: 4,
            radius: 4,
            damage: this.bulletDamage
        }));
    }

    gainXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.4);
            return true;
        }
        return false;
    }
}
