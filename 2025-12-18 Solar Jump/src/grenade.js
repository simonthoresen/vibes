import * as THREE from 'three';

export class Grenade {
    constructor(scene, physics, position, direction, velocity) {
        this.scene = scene;
        this.physics = physics;
        this.position = position.clone();
        this.velocity = direction.clone().normalize().multiplyScalar(15).add(velocity.clone().multiplyScalar(0.5));
        this.lifetime = 5; // seconds
        this.age = 0;
        this.exploded = false;
        
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshToonMaterial({
            color: 0xff0000,
            emissive: 0x880000,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.exploded) return false;

        this.age += deltaTime;

        // Apply gravity
        const gravity = this.physics.calculateGravity(this.position, this.velocity);
        this.velocity.add(gravity.multiplyScalar(deltaTime));

        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);

        // Check collision with planets
        const collision = this.physics.checkPlanetCollision(
            this.mesh.position,
            this.position,
            0.2
        );

        if (collision.collided || this.age >= this.lifetime) {
            this.explode();
            return false;
        }

        // Pulse effect
        const scale = 1 + Math.sin(this.age * 10) * 0.2;
        this.mesh.scale.setScalar(scale);

        return true;
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;

        // Create explosion effect
        const particleCount = 20;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5)
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(this.position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            particle.userData = { velocity, lifetime: 0.5 };
            this.scene.add(particle);
            particles.push(particle);
        }

        // Animate particles
        let elapsed = 0;
        const animateExplosion = () => {
            elapsed += 0.016;
            
            particles.forEach(particle => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
                particle.userData.velocity.multiplyScalar(0.95);
                particle.scale.multiplyScalar(0.95);
            });

            if (elapsed < 0.5) {
                requestAnimationFrame(animateExplosion);
            } else {
                particles.forEach(particle => this.scene.remove(particle));
            }
        };
        animateExplosion();

        this.destroy();
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }

    getPosition() {
        return this.position;
    }

    checkPlayerHit(playerPosition, radius = 3) {
        if (!this.exploded) return false;
        const distance = this.position.distanceTo(playerPosition);
        return distance < radius;
    }
}

export class GrenadeManager {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.grenades = [];
    }

    throwGrenade(position, direction, playerVelocity) {
        const grenade = new Grenade(this.scene, this.physics, position, direction, playerVelocity);
        this.grenades.push(grenade);
        return grenade;
    }

    update(deltaTime) {
        this.grenades = this.grenades.filter(grenade => grenade.update(deltaTime));
    }

    clear() {
        this.grenades.forEach(grenade => grenade.destroy());
        this.grenades = [];
    }
}
