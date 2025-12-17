import * as THREE from 'three';

export class RemotePlayer {
    constructor(scene, peerId, color = null) {
        this.scene = scene;
        this.peerId = peerId;
        this.color = color || this.generateRandomColor();

        // Player state
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

        // Interpolation for smooth movement
        this.targetPosition = new THREE.Vector3(0, 1.6, 0);
        this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.interpolationSpeed = 10;

        this.createMesh();
    }

    generateRandomColor() {
        const colors = [
            0xff0000, // Red
            0x00ff00, // Green
            0x0000ff, // Blue
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xff8800, // Orange
            0x8800ff  // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createMesh() {
        // Body
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

        // Direction indicator
        const indicatorGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.indicator.position.set(0, 0.6, -0.5);
        this.indicator.rotation.x = Math.PI / 2;

        // Group
        this.mesh = new THREE.Group();
        this.mesh.add(this.body);
        this.mesh.add(this.head);
        this.mesh.add(this.indicator);

        this.scene.add(this.mesh);
        this.updateMeshPosition();
    }

    updateMeshPosition() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
    }

    update(deltaTime) {
        // Smooth interpolation to target position and rotation
        this.position.lerp(this.targetPosition, deltaTime * this.interpolationSpeed);

        // Interpolate rotation (simple linear for now)
        this.rotation.y += (this.targetRotation.y - this.rotation.y) * deltaTime * this.interpolationSpeed;

        this.updateMeshPosition();
    }

    setState(state) {
        if (state.position) {
            this.targetPosition.set(
                state.position.x,
                state.position.y,
                state.position.z
            );
        }
        if (state.rotation) {
            this.targetRotation.set(
                state.rotation.x,
                state.rotation.y,
                state.rotation.z,
                'YXZ'
            );
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}
