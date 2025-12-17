import * as THREE from 'three';

export class Controls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Mouse look
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.mouseSensitivity = 0.002;
        this.isLocked = false;

        // Keyboard state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        this.init();
    }

    init() {
        // Pointer lock
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.domElement;
            this.onLockChange(this.isLocked);
        });

        // Mouse movement
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onMouseMove(event) {
        if (!this.isLocked) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.rotation.y -= movementX * this.mouseSensitivity;
        this.rotation.x -= movementY * this.mouseSensitivity;

        // Clamp vertical rotation
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
        }
    }

    onLockChange(locked) {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.classList.toggle('hidden', locked);
        }
    }

    getMoveDirection() {
        const direction = new THREE.Vector3();

        if (this.keys.forward) direction.z += 1;
        if (this.keys.backward) direction.z -= 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
        }

        return direction;
    }

    getRotation() {
        return this.rotation;
    }

    isJumping() {
        return this.keys.jump;
    }

    update(camera) {
        // Update camera rotation based on mouse look
        camera.rotation.copy(this.rotation);
    }
}
