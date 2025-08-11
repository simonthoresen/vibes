// Sprite System for 2D Game Engine
window.SpriteDebugMode = true;

class Sprite {
    constructor({ type = 'generic', x = 0, y = 0, width = 32, height = 32, rotation = 0, scale = 1 }) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.scale = scale;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        // Example: render as a filled rectangle (override in subclasses or custom draw)
        ctx.fillStyle = '#888';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        if (window.SpriteDebugMode) {
            // Draw bounding box
            ctx.save();
            ctx.strokeStyle = '#FFFF00'; // bright yellow
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.restore();

            // Draw orientation labels
            ctx.save();
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFFF00'; // bright yellow
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Draw '+' at sprite's local origin
            ctx.font = 'bold 24px Arial';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 18px Arial';
            // Forward (decreasing y)
            ctx.fillText('FWD', 0, -this.height/2 - 20);
            // Backward (increasing y)
            ctx.fillText('BCK', 0, this.height/2 + 20);
            // Right (increasing x)
            ctx.fillText('RGT', this.width/2 + 30, 0);
            // Left (decreasing x)
            ctx.fillText('LFT', -this.width/2 - 30, 0);
            ctx.restore();
        }
        ctx.restore();
    }
}

class SpriteManager {
    constructor() {
        this.sprites = [];
    }

    addSprite(sprite) {
        this.sprites.push(sprite);
    }

    clear() {
        this.sprites = [];
    }

    draw(ctx) {
        for (const sprite of this.sprites) {
            sprite.draw(ctx);
        }
    }
}

window.Sprite = Sprite;
window.SpriteManager = SpriteManager;
