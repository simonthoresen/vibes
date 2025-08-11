class PlayerFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        // Particle emitter positioned at the BCK side
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.emitter = null;
    this._emitterOffset = { x: 0, y: 48 }; // Now on the opposite (BACK) side
        this._emitterRadius = 12;
        this._emitterColor = '#fff';
        this._emitterParticleConfig = {
            emissionRate: 18,
            shape: 'circle',
            color: '#fff',
            size: 7,
            direction: Math.PI/2, // Downward in local space (BACK)
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
    ctx.scale(this.scale, -this.scale); // Vertically flipped
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
    // (Emitter circle removed)
        ctx.restore();
        // Update emitter position to follow sprite
        if (this.emitter) {
            this.emitter.x = this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y;
            this.emitter.y = this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y;
            this.emitter.direction = this.rotation + Math.PI/2; // Backward relative to sprite
        }
        // Draw debug graphics from base Sprite
        super.draw(ctx);
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
    ctx.scale(this.scale, -this.scale); // Vertically flipped
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
        ctx.restore();
        // Draw debug graphics from base Sprite
        super.draw(ctx);
    }
}

class EnemyFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        // Particle emitter positioned behind the light red triangle
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.emitter = null;
    this._emitterOffset = { x: 0, y: 48 }; // Now on the opposite (BACK) side
        this._emitterRadius = 12;
        this._emitterColor = '#fff';
        this._emitterParticleConfig = {
            emissionRate: 18,
            shape: 'circle',
            color: '#fff',
            size: 7,
            direction: Math.PI/2, // Downward in local space (BACK)
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
    ctx.scale(this.scale, -this.scale); // Vertically flipped
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
    // (Emitter circle removed)
        ctx.restore();
        // Update emitter position to follow sprite
        if (this.emitter) {
            this.emitter.x = this.x + Math.cos(this.rotation) * this._emitterOffset.x - Math.sin(this.rotation) * this._emitterOffset.y;
            this.emitter.y = this.y + Math.sin(this.rotation) * this._emitterOffset.x + Math.cos(this.rotation) * this._emitterOffset.y;
            this.emitter.direction = this.rotation + Math.PI/2; // Backward relative to sprite
        }
        // Draw debug graphics from base Sprite
        super.draw(ctx);
    }
}

window.TurretSprite = TurretSprite;
window.EnemyFighterSprite = EnemyFighterSprite;
// Add more sprite types here as needed
