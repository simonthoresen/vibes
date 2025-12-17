import * as THREE from 'three';

export class Player {
    constructor(scene, isLocal = false, color = 0xff0000) {
        this.scene = scene;
        this.isLocal = isLocal;
        this.color = color;

        // Player state
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.velocity = new THREE.Vector3();

        // Movement properties
        this.speed = 5.0;
        this.jumpSpeed = 7.0;
        this.gravity = -20.0;
        this.isOnGround = false;

        // Create player mesh
        this.createMesh();
    }

    createMesh() {
        // Body (capsule-like shape using cylinder + spheres)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.5,
            metalness: 0.3
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.castShadow = true;
        this.body.receiveShadow = true;

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.4,
            metalness: 0.2
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 0.85;
        this.head.castShadow = true;

        // Group for the entire player
        this.mesh = new THREE.Group();
        this.mesh.add(this.body);
        this.mesh.add(this.head);

        // Add a simple direction indicator
        const indicatorGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.indicator.position.set(0, 0.6, -0.5);
        this.indicator.rotation.x = Math.PI / 2;
        this.mesh.add(this.indicator);

        this.scene.add(this.mesh);
        this.updateMeshPosition();
    }

    updateMeshPosition() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
    }

    update(deltaTime, moveDirection = null) {
        if (!this.isLocal) return;

        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;

        // Ground collision (simple)
        if (this.position.y <= 1.6) {
            this.position.y = 1.6;
            this.velocity.y = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // Apply movement
        if (moveDirection) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyEuler(this.rotation);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3(1, 0, 0);
            right.applyEuler(this.rotation);
            right.y = 0;
            right.normalize();

            const movement = new THREE.Vector3();
            movement.addScaledVector(forward, moveDirection.z);
            movement.addScaledVector(right, moveDirection.x);
            movement.normalize();
            movement.multiplyScalar(this.speed * deltaTime);

            this.position.x += movement.x;
            this.position.z += movement.z;
        }

        // Apply vertical velocity
        this.position.y += this.velocity.y * deltaTime;

        this.updateMeshPosition();
    }

    jump() {
        if (this.isOnGround) {
            this.velocity.y = this.jumpSpeed;
        }
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.updateMeshPosition();
    }

    setRotation(x, y, z) {
        this.rotation.set(x, y, z, 'YXZ');
        this.updateMeshPosition();
    }

    getState() {
        return {
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
            }
        };
    }

    setState(state) {
        if (state.position) {
            this.position.set(
                state.position.x,
                state.position.y,
                state.position.z
            );
        }
        if (state.rotation) {
            this.rotation.set(
                state.rotation.x,
                state.rotation.y,
                state.rotation.z,
                'YXZ'
            );
        }
        this.updateMeshPosition();
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}
