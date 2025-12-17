import * as THREE from 'three';

export class Particle {
    constructor(scene, position, velocity, lifetime = 0.5) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.lifetime = lifetime;
        this.age = 0;
        
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.7
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        this.age += deltaTime;
        
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.velocity.multiplyScalar(0.95); // Drag
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Fade out
        const progress = this.age / this.lifetime;
        this.mesh.material.opacity = 0.7 * (1 - progress);
        this.mesh.scale.multiplyScalar(0.98);
        
        return this.age < this.lifetime;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class ParticleEmitter {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emit(position, direction, speed, count = 5, lifetime = 0.5) {
        // Emit particles in opposite direction
        const emitDirection = direction.clone().multiplyScalar(-1).normalize();
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spread = Math.random() * 0.5;
            
            const velocity = emitDirection.clone()
                .multiplyScalar(speed * (0.5 + Math.random() * 0.5));
            
            // Add spreading
            velocity.x += Math.cos(angle) * spread;
            velocity.y += Math.sin(angle) * spread;
            velocity.z += (Math.random() - 0.5) * spread;
            
            const particle = new Particle(this.scene, position, velocity, lifetime);
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(p => {
            const alive = p.update(deltaTime);
            if (!alive) p.destroy();
            return alive;
        });
    }

    clear() {
        this.particles.forEach(p => p.destroy());
        this.particles = [];
    }
}
