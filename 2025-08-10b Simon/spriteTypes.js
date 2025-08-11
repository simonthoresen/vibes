// Sprite Types Definitions

class TurretSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        // Draw brown circle
        ctx.fillStyle = '#8B5A2B';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        // Draw dark brown triangle, vertically flipped
        ctx.fillStyle = '#4B2E09';
        ctx.beginPath();
        ctx.moveTo(0, 40); // bottom point (flipped)
        ctx.lineTo(32, -32); // top right (flipped)
        ctx.lineTo(-32, -32); // top left (flipped)
        ctx.closePath();
        ctx.fill();
        // Debug graphics
        if (window.SpriteDebugMode) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 18px Arial';
            ctx.fillText('FWD', 0, this.height/2 + 20);
            ctx.fillText('BCK', 0, -this.height/2 - 20);
            ctx.fillText('RGT', this.width/2 + 30, 0);
            ctx.fillText('LFT', -this.width/2 - 30, 0);
            ctx.restore();
        }
        ctx.restore();
    }
}

class EnemyFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
    // Draw wide, short dark red triangle (base plane), moved slightly backwards
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(0, 28); // bottom (was 36)
    ctx.lineTo(60, -32); // right (was -24)
    ctx.lineTo(-60, -32); // left (was -24)
    ctx.closePath();
    ctx.fill();
        // Draw narrow, tall lighter red triangle (top plane)
        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.moveTo(0, 48); // bottom
        ctx.lineTo(28, -48); // right
        ctx.lineTo(-28, -48); // left
        ctx.closePath();
        ctx.fill();
        // Debug graphics
        if (window.SpriteDebugMode) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 18px Arial';
            ctx.fillText('FWD', 0, this.height/2 + 20);
            ctx.fillText('BCK', 0, -this.height/2 - 20);
            ctx.fillText('RGT', this.width/2 + 30, 0);
            ctx.fillText('LFT', -this.width/2 - 30, 0);
            ctx.restore();
        }
        ctx.restore();
    }
}

window.TurretSprite = TurretSprite;
window.EnemyFighterSprite = EnemyFighterSprite;
// Add more sprite types here as needed
