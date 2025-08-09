class Obelisk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.maxHealth = 10;
        this.health = 10;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4); // Rotate to make a diamond
        ctx.fillStyle = "gray";
        ctx.beginPath();
        ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
