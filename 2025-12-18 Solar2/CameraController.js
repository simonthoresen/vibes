import * as THREE from 'three';

export class CameraController {
    constructor(camera, player, canvas) {
        this.camera = camera;
        this.player = player;
        this.canvas = canvas;
        
        // Camera modes: 'firstPerson', 'thirdPerson', 'follow', 'freeRoam'
        this.mode = 'firstPerson';
        this.modes = ['firstPerson', 'thirdPerson', 'follow', 'freeRoam'];
        this.currentModeIndex = 0;
        
        // Mouse control
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        
        // Camera angles
        this.yaw = 0; // Horizontal rotation
        this.pitch = 0; // Vertical rotation
        this.maxPitch = Math.PI / 2 - 0.1;
        
        // Third person / follow mode settings
        this.thirdPersonDistance = 5;
        this.thirdPersonHeight = 2;
        this.followDistance = 10;
        this.followHeight = 5;
        this.followAngle = 0;
        this.zoomSpeed = 0.5;
        
        // Free roam settings
        this.freeRoamSpeed = 10;
        this.freeRoamPosition = new THREE.Vector3(0, 5, 10);
        this.freeRoamYaw = 0;
        this.freeRoamPitch = 0;
        
        this.setupPointerLock();
        this.setupMouseListeners();
    }
    
    setupPointerLock() {
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });
    }
    
    setupMouseListeners() {
        document.addEventListener('mousemove', (event) => {
            if (!this.isPointerLocked) return;
            
            this.mouseX = event.movementX * this.mouseSensitivity;
            this.mouseY = event.movementY * this.mouseSensitivity;
        });
        
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            if (this.mode === 'follow') {
                // Zoom in/out in follow mode
                this.followDistance += event.deltaY * 0.01;
                this.followDistance = Math.max(3, Math.min(30, this.followDistance));
            }
        }, { passive: false });
    }
    
    switchMode() {
        this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
        this.mode = this.modes[this.currentModeIndex];
        
        // Store free roam position when leaving free roam
        if (this.mode !== 'freeRoam') {
            // Reset some values when switching modes
            if (this.mode === 'firstPerson' || this.mode === 'thirdPerson') {
                this.yaw = this.player.getRotation();
                this.pitch = 0;
            }
        } else {
            // Entering free roam mode
            this.freeRoamPosition.copy(this.camera.position);
            this.freeRoamYaw = this.yaw;
            this.freeRoamPitch = this.pitch;
        }
        
        // Update UI
        const modeNames = {
            'firstPerson': '1st Person',
            'thirdPerson': '3rd Person',
            'follow': 'Follow Player',
            'freeRoam': 'Free Roam'
        };
        
        document.getElementById('camera-mode').textContent = `Camera: ${modeNames[this.mode]}`;
        
        // Show/hide crosshair
        const crosshair = document.getElementById('crosshair');
        crosshair.style.display = (this.mode === 'firstPerson') ? 'block' : 'none';
    }
    
    update(deltaTime, keys) {
        switch(this.mode) {
            case 'firstPerson':
                this.updateFirstPerson(deltaTime);
                break;
            case 'thirdPerson':
                this.updateThirdPerson(deltaTime);
                break;
            case 'follow':
                this.updateFollow(deltaTime);
                break;
            case 'freeRoam':
                this.updateFreeRoam(deltaTime, keys);
                break;
        }
    }
    
    updateFirstPerson(deltaTime) {
        // Mouse controls - turn player and look up/down
        this.yaw -= this.mouseX;
        this.pitch -= this.mouseY;
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
        
        // Update player rotation (only horizontal)
        this.player.setRotation(this.yaw);
        
        // Position camera at player position
        const playerPos = this.player.getPosition();
        this.camera.position.set(playerPos.x, playerPos.y + 0.6, playerPos.z);
        
        // Look direction
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        this.mouseX = 0;
        this.mouseY = 0;
    }
    
    updateThirdPerson(deltaTime) {
        // Mouse controls - turn player and look up/down (inverted Y-axis)
        this.yaw -= this.mouseX;
        this.pitch += this.mouseY;
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
        
        // Update player rotation (only horizontal)
        this.player.setRotation(this.yaw);
        
        // Position camera behind player
        const playerPos = this.player.getPosition();
        const offset = new THREE.Vector3(
            Math.sin(this.yaw) * this.thirdPersonDistance,
            this.thirdPersonHeight,
            Math.cos(this.yaw) * this.thirdPersonDistance
        );
        
        this.camera.position.set(
            playerPos.x + offset.x,
            playerPos.y + offset.y,
            playerPos.z + offset.z
        );
        
        // Look at player with pitch offset
        const lookAtPoint = new THREE.Vector3(
            playerPos.x,
            playerPos.y + 1 - Math.tan(this.pitch) * this.thirdPersonDistance,
            playerPos.z
        );
        this.camera.lookAt(lookAtPoint);
        
        this.mouseX = 0;
        this.mouseY = 0;
    }
    
    updateFollow(deltaTime) {
        // Mouse controls - rotate camera around player
        this.followAngle -= this.mouseX * 2;
        
        // Position camera around player
        const playerPos = this.player.getPosition();
        const offset = new THREE.Vector3(
            Math.sin(this.followAngle) * this.followDistance,
            this.followHeight,
            Math.cos(this.followAngle) * this.followDistance
        );
        
        this.camera.position.set(
            playerPos.x + offset.x,
            playerPos.y + offset.y,
            playerPos.z + offset.z
        );
        
        // Always look at player
        this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
        
        this.mouseX = 0;
        this.mouseY = 0;
    }
    
    updateFreeRoam(deltaTime, keys) {
        // Mouse controls - free camera rotation
        this.freeRoamYaw -= this.mouseX;
        this.freeRoamPitch -= this.mouseY;
        this.freeRoamPitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.freeRoamPitch));
        
        // Calculate movement direction
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        if (keys.forward) moveDirection.z -= 1;
        if (keys.backward) moveDirection.z += 1;
        if (keys.left) moveDirection.x -= 1;
        if (keys.right) moveDirection.x += 1;
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Rotate movement based on camera yaw
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.freeRoamYaw);
            
            // Apply movement
            this.freeRoamPosition.x += moveDirection.x * this.freeRoamSpeed * deltaTime;
            this.freeRoamPosition.z += moveDirection.z * this.freeRoamSpeed * deltaTime;
        }
        
        // Handle vertical movement (Space/Shift for up/down in free roam)
        if (keys.jump) {
            this.freeRoamPosition.y += this.freeRoamSpeed * deltaTime;
        }
        
        // Update camera position
        this.camera.position.copy(this.freeRoamPosition);
        
        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.freeRoamYaw;
        this.camera.rotation.x = this.freeRoamPitch;
        
        this.mouseX = 0;
        this.mouseY = 0;
    }
    
    getMode() {
        return this.mode;
    }
}
