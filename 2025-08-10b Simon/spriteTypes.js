class PlayerFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        // Particle emitter positioned at the BCK side
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.emitter = null;
    this._emitterOffset = { x: 0, y: -48 }; // FORWARD side (relative to sprite center)
        this._emitterRadius = 12;
        this._emitterColor = '#fff';
        this._emitterParticleConfig = {
            emissionRate: 18,
            shape: 'circle',
            color: '#fff',
            size: 7,
            direction: -Math.PI/2, // Upward in local space
            speed: 80,
            lifetime: 0.7,
            radius: 0
        };
        // Create emitter
        if (this.particleSystem) {
            this.emitter = this.particleSystem.addEmitter({
                x: this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y,
                y: this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y,
                ...this._emitterParticleConfig
            });
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
    // Draw first wide, short blue triangle (main wing, less tall, moved forward)
    ctx.fillStyle = '#1565C0'; // deep blue
    ctx.beginPath();
    ctx.moveTo(0, 10); // bottom (was 28)
    ctx.lineTo(60, -34); // right (was -16)
    ctx.lineTo(-60, -34); // left (was -16)
    ctx.closePath();
    ctx.fill();
        // (Smaller dark triangle removed)
    // Draw narrow, tall lighter blue triangle (top plane)
    ctx.fillStyle = '#64B5F6'; // light blue
    ctx.beginPath();
    ctx.moveTo(0, 48); // bottom
    ctx.lineTo(28, -48); // right
    ctx.lineTo(-28, -48); // left
    ctx.closePath();
    ctx.fill();
        // Draw emitter as a white circle at the BCK side
        ctx.save();
        ctx.fillStyle = this._emitterColor;
        ctx.beginPath();
        ctx.arc(this._emitterOffset.x, this._emitterOffset.y, this._emitterRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Debug graphics
        if (window.SpriteDebugMode) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 14px Arial';
            // Move labels closer to bounding box (10px gap)
            ctx.save();
            ctx.translate(0, this.height/2 + 10);
            ctx.rotate(Math.PI); // 180 degrees
            ctx.fillText('FORWARD', 0, 0);
            ctx.restore();
            ctx.fillText('BACK', 0, -this.height/2 - 10);
            ctx.save();
            ctx.translate(this.width/2 + 10, 0);
            ctx.rotate(Math.PI / 2); // 90 degrees clockwise
            ctx.fillText('RIGHT', 0, 0);
            ctx.restore();
            ctx.save();
            ctx.translate(-this.width/2 - 10, 0);
            ctx.rotate(3 * Math.PI / 2); // 270 degrees clockwise
            ctx.fillText('LEFT', 0, 0);
            ctx.restore();
            ctx.restore();
        }
        ctx.restore();
        // Update emitter position to follow sprite
        if (this.emitter) {
            this.emitter.x = this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y;
            this.emitter.y = this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y;
            this.emitter.direction = this.rotation - Math.PI/2; // Upward relative to sprite
        }
    }
}

window.PlayerFighterSprite = PlayerFighterSprite;
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
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 14px Arial';
            // Move labels closer to bounding box (10px gap)
            ctx.save();
            ctx.translate(0, this.height/2 + 10);
            ctx.rotate(Math.PI); // 180 degrees
            ctx.fillText('FORWARD', 0, 0);
            ctx.restore();
            ctx.fillText('BACK', 0, -this.height/2 - 10);
            ctx.save();
            ctx.translate(this.width/2 + 10, 0);
            ctx.rotate(Math.PI / 2); // 90 degrees clockwise
            ctx.fillText('RIGHT', 0, 0);
            ctx.restore();
            ctx.save();
            ctx.translate(-this.width/2 - 10, 0);
            ctx.rotate(3 * Math.PI / 2); // 270 degrees clockwise
            ctx.fillText('LEFT', 0, 0);
            ctx.restore();
            ctx.restore();
        }
        ctx.restore();
    }
}

class EnemyFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        // Particle emitter positioned behind the light red triangle
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.emitter = null;
    this._emitterOffset = { x: 0, y: -48 }; // In front of the light red triangle (FWD side, relative to sprite center)
        this._emitterRadius = 12;
        this._emitterColor = '#fff';
        this._emitterParticleConfig = {
            emissionRate: 18,
            shape: 'circle',
            color: '#fff',
            size: 7,
            direction: -Math.PI/2, // Upward in local space
            speed: 80,
            lifetime: 0.7,
            radius: 0
        };
        // Create emitter
        if (this.particleSystem) {
            this.emitter = this.particleSystem.addEmitter({
                x: this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y,
                y: this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y,
                ...this._emitterParticleConfig
            });
        }
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
        // Draw emitter as a white circle behind the light red triangle
        ctx.save();
        ctx.fillStyle = this._emitterColor;
        ctx.beginPath();
        ctx.arc(this._emitterOffset.x, this._emitterOffset.y, this._emitterRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Debug graphics
        if (window.SpriteDebugMode) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
            ctx.font = 'bold 14px Arial';
            // Move labels closer to bounding box (10px gap)
            ctx.save();
            ctx.translate(0, this.height/2 + 10);
            ctx.rotate(Math.PI); // 180 degrees
            ctx.fillText('FORWARD', 0, 0);
            ctx.restore();
            ctx.fillText('BACK', 0, -this.height/2 - 10);
            ctx.save();
            ctx.translate(this.width/2 + 10, 0);
            ctx.rotate(Math.PI / 2); // 90 degrees clockwise
            ctx.fillText('RIGHT', 0, 0);
            ctx.restore();
            ctx.save();
            ctx.translate(-this.width/2 - 10, 0);
            ctx.rotate(3 * Math.PI / 2); // 270 degrees clockwise
            ctx.fillText('LEFT', 0, 0);
            ctx.restore();
            ctx.restore();
        }
        ctx.restore();
        // Update emitter position to follow sprite
        if (this.emitter) {
            this.emitter.x = this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y;
            this.emitter.y = this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y;
            this.emitter.direction = this.rotation - Math.PI/2; // Upward relative to sprite
        }
    }
}

window.TurretSprite = TurretSprite;
window.EnemyFighterSprite = EnemyFighterSprite;
// Add more sprite types here as needed
