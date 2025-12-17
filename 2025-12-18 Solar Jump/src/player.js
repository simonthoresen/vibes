import * as THREE from 'three';
import { ParticleEmitter } from './particles.js';

export class Player {
    constructor(scene, physics, id, name, isLocal = false) {
        this.scene = scene;
        this.physics = physics;
        this.id = id;
        this.name = name;
        this.isLocal = isLocal;
        
        this.position = new THREE.Vector3(30, 1.6, 0); // Start near Earth
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        
        this.moveSpeed = 5;
        this.boostPower = 35; // Booster force (powerful enough to escape planets)
        this.boostRecharge = 2; // Seconds to recharge boost
        this.boostEnergy = this.boostRecharge; // Current boost energy
        this.isGrounded = false;
        this.currentPlanet = null;
        this.planetAttachPoint = new THREE.Vector3(); // Point relative to planet center
        
        // Particle emitter for booster effects
        this.particleEmitter = new ParticleEmitter(scene);
        
        this.createMesh();
    }

    createMesh() {
        // Player cube with toon shading
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.material = new THREE.MeshToonMaterial({
            color: this.isLocal ? 0x00ff00 : 0xff0000
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Add ambient light to player for visibility
        const playerLight = new THREE.PointLight(this.isLocal ? 0x00ff00 : 0xff0000, 1.5, 15);
        playerLight.position.copy(this.position);
        this.mesh.add(playerLight);
        this.playerLight = playerLight;

        // Add name label
        this.createNameLabel();
    }

    createNameLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.nameLabel = new THREE.Sprite(material);
        this.nameLabel.scale.set(2, 0.5, 1);
        this.nameLabel.position.y = 1;
        this.mesh.add(this.nameLabel);
    }

    update(deltaTime, input, mouseDelta) {
        if (!input) return;

        // Rotate player with mouse input (always works, grounded or not)
        if (mouseDelta && (mouseDelta.x !== 0 || mouseDelta.y !== 0)) {
            const yawRotation = new THREE.Quaternion();
            yawRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -mouseDelta.x * 0.005);
            this.mesh.quaternion.multiply(yawRotation);
            
            const pitchRotation = new THREE.Quaternion();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);
            pitchRotation.setFromAxisAngle(right, -mouseDelta.y * 0.005);
            this.mesh.quaternion.multiply(pitchRotation);
        }

        // Recharge boost energy when not in use
        if (!input.boost) {
            this.boostEnergy = Math.min(this.boostEnergy + deltaTime / this.boostRecharge, 1);
        }

        // Apply gravity
        const gravity = this.physics.calculateGravity(this.position, this.velocity);
        this.velocity.add(gravity.multiplyScalar(deltaTime));

        // Check if on planet
        this.currentPlanet = this.physics.findStandingPlanet(this.position);
        this.isGrounded = this.currentPlanet !== null;
        
        // Change color based on grounded state
        if (this.isLocal) {
            this.material.color.setHex(this.isGrounded ? 0x00ffff : 0x00ff00); // Cyan when grounded, green when airborne
        }

        let moveDirection = new THREE.Vector3();

        if (this.isGrounded && this.currentPlanet) {
            // Movement in player's local space (not stuck to planet)
            if (input.forward || input.backward || input.left || input.right) {
                moveDirection = new THREE.Vector3();
                
                if (input.forward) moveDirection.z -= 1;
                if (input.backward) moveDirection.z += 1;
                if (input.right) moveDirection.x += 1;
                if (input.left) moveDirection.x -= 1;
                
                moveDirection.normalize();
                moveDirection.applyQuaternion(this.mesh.quaternion);
                this.position.add(moveDirection.clone().multiplyScalar(this.moveSpeed * deltaTime));
                
                // Emit particles opposite to movement direction
                this.particleEmitter.emit(this.position, moveDirection, 5, 3, 0.4);
            }

            // Booster - boost in player's up direction (only when grounded)
            if (input.boost) {
                const playerUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
                // Apply continuous upward force while holding spacebar
                this.velocity.add(playerUp.clone().multiplyScalar(this.boostPower * deltaTime));
                
                // Emit particles downward when boosting
                this.particleEmitter.emit(this.position, playerUp, 8, 4, 0.5);
                
                this.isGrounded = false;
            }

            // Dampen velocity when on ground
            this.velocity.multiplyScalar(0.8);
            
            // Stick to planet surface - maintain exact distance
            const groundNormal = this.physics.getGroundNormal(this.position, this.currentPlanet);
            const distance = this.position.distanceTo(this.currentPlanet.mesh.position);
            const targetDistance = this.currentPlanet.radius + 0.25;
            
            const diff = targetDistance - distance;
            if (Math.abs(diff) > 0.01) {
                const correction = groundNormal.clone().multiplyScalar(diff);
                this.position.add(correction);
            }
        } else {
            // In the air - free movement
            if (input.forward || input.backward || input.left || input.right) {
                moveDirection = new THREE.Vector3();
                
                // Use player-relative movement in the air
                if (input.forward) moveDirection.z -= 1;
                if (input.backward) moveDirection.z += 1;
                if (input.right) moveDirection.x += 1;
                if (input.left) moveDirection.x -= 1;
                
                moveDirection.normalize();
                moveDirection.applyQuaternion(this.mesh.quaternion);
                this.position.add(moveDirection.clone().multiplyScalar(this.moveSpeed * 0.5 * deltaTime));
                
                // Emit particles from air movement
                this.particleEmitter.emit(this.position, moveDirection, 3, 2, 0.3);
            }

            // Booster - works in the air, uses player's up direction
            if (input.boost && this.boostEnergy > 0) {
                const playerUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
                const boostAmount = this.boostPower * deltaTime;
                this.velocity.add(playerUp.clone().multiplyScalar(boostAmount));
                
                // Emit particles downward for booster
                this.particleEmitter.emit(this.position, playerUp, 6, 4, 0.4);
                
                this.boostEnergy -= deltaTime / this.boostRecharge;
                this.boostEnergy = Math.max(0, this.boostEnergy);
            }
        }

        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Check collisions
        const collision = this.physics.checkPlanetCollision(
            this.mesh.position,
            this.position,
            0.25
        );
        
        if (collision.collided) {
            this.position.copy(collision.position);
            // Bounce off
            const normal = this.physics.getGroundNormal(this.position, collision.body);
            const velocityAlongNormal = this.velocity.dot(normal);
            if (velocityAlongNormal < 0) {
                this.velocity.sub(normal.multiplyScalar(velocityAlongNormal * 1.5));
            }
        }

        // Update mesh
        this.mesh.position.copy(this.position);
        
        // Update player light position
        if (this.playerLight) {
            this.playerLight.position.copy(this.position);
        }
        
        // Orient player to stand on planet
        if (this.currentPlanet) {
            const normal = this.physics.getGroundNormal(this.position, this.currentPlanet);
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
            this.mesh.quaternion.copy(quaternion);
        }

        // Update particles
        this.particleEmitter.update(deltaTime);
    }

    updateFromNetwork(data) {
        this.position.copy(data.position);
        this.rotation.copy(data.rotation);
        this.mesh.position.copy(this.position);
    }

    getNetworkData() {
        return {
            id: this.id,
            name: this.name,
            position: this.position.clone(),
            rotation: this.rotation.clone(),
            velocity: this.velocity.clone()
        };
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    getVelocity() {
        return this.velocity;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.particleEmitter.clear();
    }
}
