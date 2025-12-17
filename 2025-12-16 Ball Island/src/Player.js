import * as THREE from 'three';

export class Player {
    constructor(scene, planet, waterY = 50) {
        this.scene = scene;
        this.planet = planet;
        this.waterY = waterY;
        
        this.mesh = null;
        this.position = new THREE.Vector3(0, 150, 0); // Start above planet
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = -200; // Downward gravity
        this.isGrounded = false;
        this.jumpForce = 80;
        
        // Particle system for explosion
        this.particles = [];
        
        this.init();
    }

    init() {
        // Create player cube
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.5,
            roughness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    checkCollisionWithPlanet() {
        // Get planet mesh and check distance to surface
        const planetMesh = this.planet.getMesh();
        
        // Update world matrix to ensure transforms are current
        planetMesh.updateMatrixWorld(true);
        
        const geometry = planetMesh.geometry;
        const positionAttribute = geometry.attributes.position;
        
        // Simple sphere collision - check distance from center
        const distanceFromCenter = this.position.length();
        
        // Find closest vertex on planet surface for more accurate collision
        let minDistance = Infinity;
        let closestPoint = new THREE.Vector3();
        
        const vertex = new THREE.Vector3();
        const worldVertex = new THREE.Vector3();
        
        // Check all vertices (optimized by checking every few vertices)
        const step = Math.max(1, Math.floor(positionAttribute.count / 500));
        
        for (let i = 0; i < positionAttribute.count; i += step) {
            vertex.fromBufferAttribute(positionAttribute, i);
            // Transform to world space
            worldVertex.copy(vertex);
            worldVertex.applyMatrix4(planetMesh.matrixWorld);
            
            const dist = this.position.distanceTo(worldVertex);
            if (dist < minDistance) {
                minDistance = dist;
                closestPoint.copy(worldVertex);
            }
        }
        
        // Collision threshold - half cube size plus small margin
        const cubeHalfSize = 2.5;
        const collisionDistance = cubeHalfSize + 0.5;
        
        if (minDistance < collisionDistance * 2) {
            // Player is colliding with or near planet surface
            // Calculate direction from closest point to player
            const direction = new THREE.Vector3().subVectors(this.position, closestPoint).normalize();
            
            // Position player exactly at collision distance from surface
            this.position.copy(closestPoint).add(direction.multiplyScalar(collisionDistance));
            
            // Stop downward velocity
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
            
            this.isGrounded = true;
            return true;
        }
        
        this.isGrounded = false;
        return false;
    }

    checkCollisionWithWater() {
        // Check if player touches water plane
        return this.position.y <= this.waterY;
    }

    explode() {
        // Create particle explosion
        const particleCount = 50;
        const particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.position);
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
            
            particle.userData.velocity = velocity;
            particle.userData.lifetime = 1.0; // 1 second
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
        
        // Respawn player
        this.respawn();
    }

    respawn() {
        this.position.set(0, 150, 0); // Above planet center
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
        this.mesh.position.copy(this.position);
    }

    update(deltaTime) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.userData.lifetime -= deltaTime;
            
            if (particle.userData.lifetime <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            } else {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
                particle.userData.velocity.y += this.gravity * deltaTime * 0.5; // Gravity on particles
                
                // Fade out
                particle.material.opacity = particle.userData.lifetime;
                particle.material.transparent = true;
            }
        }
        
        // If grounded, rotate with planet FIRST, then check collision
        if (this.isGrounded) {
            const rotationSpeed = 0.05 * deltaTime; // Match planet rotation speed from Planet.js
            
            // Rotate player position around Z axis
            const angle = rotationSpeed;
            const x = this.position.x * Math.cos(angle) - this.position.y * Math.sin(angle);
            const y = this.position.x * Math.sin(angle) + this.position.y * Math.cos(angle);
            this.position.x = x;
            this.position.y = y;
            
            // Also rotate around X axis
            const angleX = rotationSpeed * 0.5; // Half speed
            const y2 = this.position.y * Math.cos(angleX) - this.position.z * Math.sin(angleX);
            const z2 = this.position.y * Math.sin(angleX) + this.position.z * Math.cos(angleX);
            this.position.y = y2;
            this.position.z = z2;
        } else {
            // Only apply gravity when not grounded
            this.velocity.y += this.gravity * deltaTime;
            
            // Update position
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        }
        
        // Check collisions - this will correct the position if needed
        const hitPlanet = this.checkCollisionWithPlanet();
        
        // Check water collision
        if (this.checkCollisionWithWater()) {
            this.explode();
        }
        
        // Update mesh position
        this.mesh.position.copy(this.position);
    }

    getPosition() {
        return this.position;
    }

    getMesh() {
        return this.mesh;
    }
}
