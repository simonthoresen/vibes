// Particle System - GPU-based instanced particle rendering
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.emitters = [];
        this.particlePool = new ParticlePool(CONFIG.PARTICLES.MAX_PARTICLES);
        this.material = this.createMaterial();
        this.maxParticles = CONFIG.PARTICLES.MAX_PARTICLES;
    }

    createMaterial() {
        return new THREE.PointsMaterial({
            size: 0.5,
            sizeAttenuation: true,
            transparent: true,
            vertexColors: true,
        });
    }

    createEmitter(config) {
        const emitter = new ParticleEmitter(config);
        this.emitters.push(emitter);
        return emitter;
    }

    update(deltaTime) {
        let activeParticles = 0;

        for (const emitter of this.emitters) {
            if (!emitter.alive) continue;

            emitter.update(deltaTime);
            activeParticles += emitter.particleCount;
        }

        // Remove dead emitters
        this.emitters = this.emitters.filter(e => e.alive);
    }

    render() {
        // Particle rendering happens through Three.js
    }

    dispose() {
        this.material.dispose();
        for (const emitter of this.emitters) {
            emitter.dispose();
        }
    }
}

// Particle Emitter
class ParticleEmitter {
    constructor(config) {
        this.position = config.position || new THREE.Vector3(0, 0, 0);
        this.velocity = config.velocity || new THREE.Vector3(0, 0, 0);
        this.acceleration = config.acceleration || new THREE.Vector3(0, 0, 0);
        this.particleLifetime = config.particleLifetime || 1;
        this.emissionRate = config.emissionRate || 10;
        this.particleSize = config.particleSize || 1;
        this.particleColor = new THREE.Color(config.particleColor || 0xffffff);
        this.count = config.count || 100;
        this.spread = config.spread || 0;
        
        this.particles = [];
        this.particleCount = 0;
        this.alive = true;
        this.life = config.life || Infinity;
        this.age = 0;

        this.initializeParticles();
    }

    initializeParticles() {
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                position: this.position.clone(),
                velocity: this.velocity.clone().add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * this.spread,
                        (Math.random() - 0.5) * this.spread,
                        (Math.random() - 0.5) * this.spread
                    )
                ),
                acceleration: this.acceleration.clone(),
                age: Math.random() * this.particleLifetime,
                lifetime: this.particleLifetime,
                size: this.particleSize,
                color: this.particleColor.clone(),
            });
        }
        this.particleCount = this.count;
    }

    update(deltaTime) {
        this.age += deltaTime;

        if (this.age > this.life) {
            this.alive = false;
            return;
        }

        for (const particle of this.particles) {
            particle.age -= deltaTime;
            
            if (particle.age <= 0) {
                particle.age = this.particleLifetime;
            }

            // Update velocity with acceleration
            particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));

            // Update position
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

            // Fade out
            particle.color.multiplyScalar(Math.max(0, particle.age / particle.lifetime));
        }
    }

    dispose() {
        this.particles = [];
    }
}

// Particle Pool for memory management
class ParticlePool {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.available = [];
        this.inUse = [];

        for (let i = 0; i < maxSize; i++) {
            this.available.push({
                position: new THREE.Vector3(0, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                age: 0,
                lifetime: 1,
                color: new THREE.Color(0xffffff),
                active: false,
            });
        }
    }

    acquire() {
        if (this.available.length > 0) {
            const particle = this.available.pop();
            this.inUse.push(particle);
            return particle;
        }
        return null;
    }

    release(particle) {
        const index = this.inUse.indexOf(particle);
        if (index !== -1) {
            this.inUse.splice(index, 1);
            this.available.push(particle);
        }
    }

    releaseAll() {
        this.available.push(...this.inUse);
        this.inUse = [];
    }
}
