import * as THREE from 'three';

export class Player {
    constructor(scene, physics, id, name, isLocal = false) {
        this.scene = scene;
        this.physics = physics;
        this.id = id;
        this.name = name;
        this.isLocal = isLocal;
        
        this.position = new THREE.Vector3(30, 5, 0);
        this.velocity = new THREE.Vector3();
        this.yaw = 0; // Rotation around Y axis
        
        this.moveSpeed = 5;
        this.boostPower = 35;
        
        this.isGrounded = false;
        this.currentPlanet = null;
        this.planetRelativePos = new THREE.Vector3(); // Position relative to planet center
        this.planetRelativeYaw = 0; // Yaw relative to planet rotation
        
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.material = new THREE.MeshToonMaterial({
            color: this.isLocal ? 0x00ff00 : 0xff0000
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
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

        // Mouse left/right rotates player around their Y-axis
        if (mouseDelta && mouseDelta.x !== 0) {
            if (this.isGrounded && this.currentPlanet) {
                // When grounded, update relative yaw (yaw relative to planet)
                this.planetRelativeYaw -= mouseDelta.x * 0.005;
            } else {
                // When flying, update absolute yaw
                this.yaw -= mouseDelta.x * 0.005;
            }
        }

        // Apply gravity
        const gravity = this.physics.calculateGravity(this.position, this.velocity);
        this.velocity.add(gravity.multiplyScalar(deltaTime));

        // Check if grounded (touching a planet)
        this.currentPlanet = this.physics.findStandingPlanet(this.position);
        this.isGrounded = this.currentPlanet !== null;
        
        // Update player orientation based on state
        if (this.isGrounded && this.currentPlanet) {
            // Y-axis points from planet center to player (standing on planet)
            const toPlanetCenter = this.currentPlanet.mesh.position.clone().sub(this.position);
            const up = toPlanetCenter.negate().normalize();
            
            // First apply yaw rotation around default Y-axis
            const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            
            // Then align to surface normal
            const defaultUp = new THREE.Vector3(0, 1, 0);
            const alignQuat = new THREE.Quaternion().setFromUnitVectors(defaultUp, up);
            
            // Combine: first yaw, then align to surface
            this.mesh.quaternion.copy(yawQuat).premultiply(alignQuat);
            
            // Color when grounded
            if (this.isLocal) {
                this.material.color.setHex(0x00ffff); // Cyan
            }
        } else {
            // Flying: Y-axis = global Y-axis, just apply yaw
            this.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            
            // Color when flying
            if (this.isLocal) {
                this.material.color.setHex(0x00ff00); // Green
            }
        }

        // Movement
        if (input.forward || input.backward || input.left || input.right) {
            let moveDirection = new THREE.Vector3();
            
            if (input.forward) moveDirection.z -= 1;
            if (input.backward) moveDirection.z += 1;
            if (input.right) moveDirection.x += 1;
            if (input.left) moveDirection.x -= 1;
            
            moveDirection.normalize();
            moveDirection.applyQuaternion(this.mesh.quaternion);
            
            if (this.isGrounded && this.currentPlanet) {
                // When grounded, move the relative position on the planet
                const up = this.getUpVector();
                // Project movement onto surface (remove component along up vector)
                moveDirection.sub(up.multiplyScalar(moveDirection.dot(up))).normalize();
                
                // Update relative position instead of world position
                this.planetRelativePos.add(moveDirection.multiplyScalar(this.moveSpeed * deltaTime));
            } else {
                // When flying, update world position directly
                this.position.add(moveDirection.multiplyScalar(this.moveSpeed * deltaTime));
            }
        }

        // Booster - works always, pushes in player's up direction
        if (input.boost) {
            const playerUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
            this.velocity.add(playerUp.multiplyScalar(this.boostPower * deltaTime));
        }

        // When grounded, anchor to planet (stick to surface)
        if (this.isGrounded && this.currentPlanet) {
            // First time grounding - store relative position and yaw
            const wasJustGrounded = this.planetRelativePos.lengthSq() === 0;
            if (wasJustGrounded) {
                this.planetRelativePos.copy(this.position).sub(this.currentPlanet.mesh.position);
                this.planetRelativeYaw = this.yaw - (this.currentPlanet.mesh.rotation ? this.currentPlanet.mesh.rotation.y : 0);
            }
            
            // Maintain exact distance from planet center
            const targetDistance = this.currentPlanet.radius + 0.25;
            this.planetRelativePos.setLength(targetDistance);
            
            // World position = planet center + relative position (no planet rotation applied here, planets don't actually rotate)
            this.position.copy(this.currentPlanet.mesh.position).add(this.planetRelativePos);
            
            // Calculate actual yaw from relative yaw + planet rotation
            this.yaw = this.planetRelativeYaw + (this.currentPlanet.mesh.rotation ? this.currentPlanet.mesh.rotation.y : 0);
            
            // Dampen velocity when on ground
            this.velocity.multiplyScalar(0.8);
        } else {
            // Reset relative position when not grounded
            this.planetRelativePos.set(0, 0, 0);
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
    }

    getPosition() {
        return this.position;
    }

    getUpVector() {
        return new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
    }

    getForwardVector() {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
    }

    getVelocity() {
        return this.velocity;
    }

    updateFromNetwork(data) {
        this.position.copy(data.position);
        this.yaw = data.yaw;
        this.mesh.position.copy(this.position);
    }

    getNetworkData() {
        return {
            id: this.id,
            name: this.name,
            position: this.position.clone(),
            yaw: this.yaw,
            velocity: this.velocity.clone()
        };
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}
