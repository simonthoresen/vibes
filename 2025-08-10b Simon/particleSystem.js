// Particle System for 2D Game Engine
class Particle {
    constructor({ x, y, shape, color, size, speed, direction, rotation, lifetime, rotationSpeed, shrinkInsteadOfFade }) {
        this.x = x;
        this.y = y;
        this.shape = shape; // 'circle', 'triangle', 'square'
        this.color = color;
        this.size = size;
        this.initialSize = size;
        this.speed = speed;
        this.direction = direction; // radians
        this.rotation = rotation || 0; // radians
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;
        this.rotationSpeed = (typeof rotationSpeed === 'number') ? rotationSpeed : (Math.random() * 2 - 1) * 2; // random between -2 and 2 rad/s
        this.shrinkInsteadOfFade = !!shrinkInsteadOfFade;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;
        if (this.shrinkInsteadOfFade) {
            this.size = Math.max(0, this.initialSize * (1 - this.age / this.lifetime));
            this.alpha = 1;
        } else {
            this.alpha = Math.max(0, 1 - this.age / this.lifetime);
        }
        this.rotation += this.rotationSpeed * dt;
    }

    isAlive() {
        if (this.shrinkInsteadOfFade) {
            return this.size > 0 && this.age < this.lifetime;
        }
        return this.age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }
}

class ParticleEmitter {
    constructor({ x, y, emissionRate, shape, color, size, direction, speed, lifetime, radius }) {
        this.x = x;
        this.y = y;
        this.emissionRate = emissionRate; // particles/sec
        this.shape = shape;
        this.color = color;
        this.size = size;
        this.direction = direction;
        this.speed = speed;
        this.lifetime = lifetime;
        this.radius = radius || 0;
        this.timeSinceLast = 0;
    }

    emit(particleSystem, dt) {
        this.timeSinceLast += dt;
        const particlesToEmit = Math.floor(this.timeSinceLast * this.emissionRate);
        if (particlesToEmit > 0) {
            for (let i = 0; i < particlesToEmit; i++) {
                const angle = this.direction + (Math.random() - 0.5) * Math.PI / 4;
                const dist = Math.random() * this.radius;
                const px = this.x + Math.cos(angle) * dist;
                const py = this.y + Math.sin(angle) * dist;
                particleSystem.addParticle({
                    x: px,
                    y: py,
                    shape: this.shape,
                    color: this.color,
                    size: this.size,
                    speed: this.speed,
                    direction: angle,
                    rotation: Math.random() * Math.PI * 2,
                    lifetime: this.lifetime
                });
            }
            this.timeSinceLast -= particlesToEmit / this.emissionRate;
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.emitters = [];
    }

    addParticle(config) {
        this.particles.push(new Particle(config));
    }

    emitExplosion({ x, y, count, shape, color, size, speed, lifetime }) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const randomSpeed = speed * (0.5 + Math.random()); // random between 0.5x and 1.5x
            const randomLifetime = lifetime * (0.7 + Math.random() * 0.6); // random between 0.7x and 1.3x
            this.addParticle({
                x,
                y,
                shape,
                color,
                size,
                speed: randomSpeed,
                direction: angle,
                rotation: Math.random() * Math.PI * 2,
                lifetime: randomLifetime
            });
        }
    }

    // Hit effect: directional explosion
    emitHitEffect({ x, y, count, shape, color, size, speed, lifetime, direction, spread }) {
        // direction: radians, spread: radians (e.g. Math.PI/6)
        const adjustedSpread = spread * 1.5;
        for (let i = 0; i < count; i++) {
            const angle = direction + (Math.random() - 0.5) * adjustedSpread;
            const randomSpeed = speed * (0.5 + Math.random());
            const randomLifetime = lifetime * (0.4 + Math.random() * 0.4); // random between 0.4x and 0.8x
            const randomSize = size * (0.7 + Math.random() * 0.6); // random between 0.7x and 1.3x
            this.addParticle({
                x,
                y,
                shape,
                color,
                size: randomSize,
                speed: randomSpeed,
                direction: angle,
                rotation: Math.random() * Math.PI * 2,
                lifetime: randomLifetime,
                shrinkInsteadOfFade: true
            });
        }
    }

    addEmitter(config) {
        const emitter = new ParticleEmitter(config);
        this.emitters.push(emitter);
        return emitter;
    }

    update(dt) {
        for (const emitter of this.emitters) {
            emitter.emit(this, dt);
        }
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.isAlive();
        });
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }
}

// Export for usage in other files
window.ParticleSystem = ParticleSystem;
window.ParticleEmitter = ParticleEmitter;
window.Particle = Particle;
