import * as THREE from 'three';

export class Camera {
    constructor(aspectRatio) {
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
        this.distance = 5; // Distance behind player
        this.minDistance = 2;
        this.maxDistance = 20;
        this.heightOffset = 0.5; // Height along player's Y-axis
        this.minHeight = -2;
        this.maxHeight = 5;
        this.camera.position.set(0, 5, 10);
    }

    update(player, input, deltaTime) {
        if (!player) return;

        // Mouse wheel changes distance
        if (input.mouseDelta && input.mouseDelta.z !== 0) {
            this.distance += input.mouseDelta.z * 0.5;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        }

        // Mouse Y changes height offset along player's Y-axis
        if (input.mouseDelta && input.mouseDelta.y !== 0) {
            this.heightOffset += input.mouseDelta.y * 0.01;
            this.heightOffset = Math.max(this.minHeight, Math.min(this.maxHeight, this.heightOffset));
        }

        const playerPosition = player.getPosition();
        
        // Camera has exact same rotation as player
        this.camera.quaternion.copy(player.mesh.quaternion);
        
        // Calculate camera position: behind player (positive Z in local space) + height offset (Y in local space)
        const localCameraOffset = new THREE.Vector3(0, this.heightOffset, this.distance);
        const worldCameraOffset = localCameraOffset.applyQuaternion(this.camera.quaternion);
        
        const targetPosition = playerPosition.clone().add(worldCameraOffset);
        this.camera.position.copy(targetPosition);
    }

    updateSunMode(input, deltaTime) {
        // Mouse rotation around sun
        if (input.mouseDelta) {
            this.sunYaw -= input.mouseDelta.x * 0.005;
            this.sunPitch -= input.mouseDelta.y * 0.005;
            
            // Clamp pitch to prevent flipping
            this.sunPitch = Math.max(0.1, Math.min(Math.PI - 0.1, this.sunPitch));
        }

        // Mouse wheel zoom
        if (input.mouseDelta && input.mouseDelta.z !== 0) {
            this.sunDistance -= input.mouseDelta.z * 5;
            this.sunDistance = Math.max(this.minSunDistance, Math.min(this.maxSunDistance, this.sunDistance));
        }

        // Calculate camera position in spherical coordinates
        const x = Math.sin(this.sunPitch) * Math.cos(this.sunYaw) * this.sunDistance;
        const y = Math.cos(this.sunPitch) * this.sunDistance;
        const z = Math.sin(this.sunPitch) * Math.sin(this.sunYaw) * this.sunDistance;

        this.camera.position.set(x, y, z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(0, 0, 0);
    }

    getCamera() {
        return this.camera;
    }

    getForwardDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        return direction.applyQuaternion(this.camera.quaternion);
    }

    resize(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
}
