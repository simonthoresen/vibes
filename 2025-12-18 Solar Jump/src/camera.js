import * as THREE from 'three';

export class Camera {
    constructor(aspectRatio) {
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
        this.mode = 'follow'; // 'follow' or 'sun'
        
        // Follow mode settings - camera directly behind player
        this.followDistance = 3;
        this.followHeight = 1;
        
        // Set initial camera position
        this.camera.position.set(0, 5, 10);
        
        // Sun mode settings
        this.sunDistance = 50;
        this.sunYaw = 0;
        this.sunPitch = Math.PI / 6;
        this.minSunDistance = 20;
        this.maxSunDistance = 200;
    }

    update(player, input, deltaTime) {
        if (this.mode === 'follow') {
            this.updateFollowMode(player, input);
        } else {
            this.updateSunMode(input, deltaTime);
        }
    }

    updateFollowMode(player, input) {
        if (!player) return;

        const playerPosition = player.getPosition();
        
        // Camera is directly behind player, using player's orientation
        const playerUp = new THREE.Vector3(0, 1, 0).applyQuaternion(player.mesh.quaternion);
        const playerBack = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);
        
        // Position camera behind and above player
        const targetPosition = new THREE.Vector3().copy(playerPosition)
            .add(playerBack.multiplyScalar(this.followDistance))
            .add(playerUp.multiplyScalar(this.followHeight));

        // Smooth camera movement
        this.camera.position.lerp(targetPosition, 0.15);

        // Set up direction first, then look at player
        this.camera.up.copy(playerUp);
        const lookTarget = new THREE.Vector3().copy(playerPosition);
        this.camera.lookAt(lookTarget);
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

    toggleMode() {
        this.mode = this.mode === 'follow' ? 'sun' : 'follow';
        return this.mode;
    }

    getMode() {
        return this.mode;
    }

    getCamera() {
        return this.camera;
    }

    getForwardDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
        return direction;
    }

    resize(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
}
