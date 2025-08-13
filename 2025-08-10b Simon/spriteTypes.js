class PlayerFighterSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        // Particle emitter positioned at the BCK side
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.emitter = null;
    this._emitterOffset = { x: 0, y: 48 }; // Now on the opposite (BACK) side
        this._emitterRadius = 12;
        this._emitterColor = '#fff';
        // Helper for random white/yellow color
        function randomWhiteYellow() {
            // White: rgb(220-255,220-255,220-255)
            // Yellow: rgb(220-255,220-255,80-180)
            if (Math.random() < 0.5) {
                // White
                const v = Math.floor(220 + Math.random() * 35);
                return `rgb(${v},${v},${v})`;
            } else {
                // Yellow
                const r = Math.floor(220 + Math.random() * 35);
                const g = Math.floor(220 + Math.random() * 35);
                const b = Math.floor(80 + Math.random() * 100);
                return `rgb(${r},${g},${b})`;
            }
        }
        this._emitterParticleConfig = {
            emissionRate: 18,
            shape: 'circle',
            color: randomWhiteYellow,
            size: 10.5, // 7 * 1.5
            direction: Math.PI/2, // Downward in local space (BACK)
            speed: 120, // 80 * 1.5
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
    // Draw brown circle with dark brown stroke
    ctx.beginPath();
    ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
    ctx.fillStyle = '#8B5A2B';
    ctx.fill();
    ctx.strokeStyle = '#4B2E09'; // dark brown
    ctx.lineWidth = 6;
    ctx.stroke();
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

// PlayerCarSprite: light blue rectangle body, dark blue wheels, dark blue triangle nose
class PlayerCarSprite extends window.Sprite {
    constructor(opts) {
        super(opts);
        this.particleSystem = opts.particleSystem || window.spriteTestParticleSystem;
        this.leftEmitter = null;
        this.rightEmitter = null;
        // Emitter config for brown rotating triangles that shrink (half size)
        // Helper to generate a random brown or gray shade
        this._randomBrown = function() {
            // Brown: rgb(90-160, 60-110, 40-80)
            const r = Math.floor(90 + Math.random() * 70);
            const g = Math.floor(60 + Math.random() * 50);
            const b = Math.floor(40 + Math.random() * 40);
            return `rgb(${r},${g},${b})`;
        };
        this._emitterConfig = {
            emissionRate: 12,
            shape: 'square',
            color: () => this._randomBrown(), // function for random brown color
            size: 9, // half previous size
            direction: Math.PI / 2, // Downward in local space (back)
            speed: 120, // higher initial speed
            lifetime: 0.7,
            fade: false, // do not fade
            shrink: true, // shrink
            shrinkInsteadOfFade: true, // ensure shrink, not fade
            rotate: true // rotate
        };
    // Back wheel emitter positions (slightly closer to center x)
    this._leftWheelOffset = { x: -24, y: 42 };
    this._rightWheelOffset = { x: 24, y: 42 };
        if (this.particleSystem) {
            this.leftEmitter = this.particleSystem.addEmitter({
                x: this.x + this._leftWheelOffset.x,
                y: this.y + this._leftWheelOffset.y,
                ...this._emitterConfig,
                shrinkInsteadOfFade: true,
                zLayer: -1
            });
            this.rightEmitter = this.particleSystem.addEmitter({
                x: this.x + this._rightWheelOffset.x,
                y: this.y + this._rightWheelOffset.y,
                ...this._emitterConfig,
                shrinkInsteadOfFade: true,
                zLayer: -1
            });
        }
    }
    draw(ctx) {
        // Update emitter positions to follow sprite
        if (this.leftEmitter) {
            this.leftEmitter.x = this.x + Math.cos(this.rotation) * this._leftWheelOffset.x - Math.sin(this.rotation) * this._leftWheelOffset.y;
            this.leftEmitter.y = this.y + Math.sin(this.rotation) * this._leftWheelOffset.x + Math.cos(this.rotation) * this._leftWheelOffset.y;
            this.leftEmitter.direction = this.rotation + Math.PI / 2;
        }
        if (this.rightEmitter) {
            this.rightEmitter.x = this.x + Math.cos(this.rotation) * this._rightWheelOffset.x - Math.sin(this.rotation) * this._rightWheelOffset.y;
            this.rightEmitter.y = this.y + Math.sin(this.rotation) * this._rightWheelOffset.x + Math.cos(this.rotation) * this._rightWheelOffset.y;
            this.rightEmitter.direction = this.rotation + Math.PI / 2;
        }

        // Draw emitters below the car sprite (if custom draw method exists)
        if (this.particleSystem && typeof this.particleSystem.draw === 'function') {
            // Only draw particles for this sprite's emitters
            // This assumes the system draws all particles, so skip here unless you have per-emitter draw
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, -this.scale); // Vertically flipped for consistency
        // Draw wheels (dark blue) behind body
        ctx.fillStyle = '#1565C0';
        // Front left wheel (moved slightly back, half distance, bigger)
        ctx.fillRect(-32, -42, 24, 24);
        // Front right wheel (moved slightly back, half distance, bigger)
        ctx.fillRect(8, -42, 24, 24);
        // Rear left wheel (moved slightly forward, half distance, bigger)
        ctx.fillRect(-32, 18, 24, 24);
        // Rear right wheel (moved slightly forward, half distance, bigger)
        ctx.fillRect(8, 18, 24, 24);
        // Draw car body (thinner x, longer y)
        ctx.fillStyle = '#64B5F6'; // light blue
        ctx.fillRect(-20, -48, 40, 96); // Centered rectangle, width 40, height 96
        // Draw nose triangle (dark blue, centered inside main rectangle, points backward)
        ctx.fillStyle = '#1565C0';
        ctx.beginPath();
        ctx.moveTo(0, 0 + 24); // tip of triangle (centered, points backward)
        ctx.lineTo(-14, 0 - 14); // left base
        ctx.lineTo(14, 0 - 14); // right base
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Draw debug graphics from base Sprite
        super.draw(ctx);
    }
}

window.PlayerCarSprite = PlayerCarSprite;
