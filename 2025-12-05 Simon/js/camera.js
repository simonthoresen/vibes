// Camera System - Orbits around player
class CameraController {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        
        this.distance = CONFIG.CAMERA.DEFAULT_DISTANCE;
        this.angle = { x: -0.5, y: 0 };
        this.targetAngle = { x: -0.5, y: 0 };
        
        this.isRotating = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupMouseControls();
    }

    setupMouseControls() {
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right click
                this.isRotating = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isRotating) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.targetAngle.y += deltaX * CONFIG.CAMERA.ROTATION_SPEED;
                this.targetAngle.x += deltaY * CONFIG.CAMERA.ROTATION_SPEED;
                
                // Clamp vertical rotation
                this.targetAngle.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetAngle.x));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        document.addEventListener('mouseup', () => {
            this.isRotating = false;
        });

        // Zoom with scroll wheel
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomAmount = e.deltaY > 0 ? CONFIG.CAMERA.ZOOM_SPEED : -CONFIG.CAMERA.ZOOM_SPEED;
            this.distance += zoomAmount;
            this.distance = Math.max(
                CONFIG.CAMERA.MIN_DISTANCE,
                Math.min(CONFIG.CAMERA.MAX_DISTANCE, this.distance)
            );
        }, { passive: false });

        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    update() {
        // Smooth angle transitions
        this.angle.x += (this.targetAngle.x - this.angle.x) * 0.1;
        this.angle.y += (this.targetAngle.y - this.angle.y) * 0.1;

        // Calculate camera position
        const playerPos = this.player.getPosition();
        
        const x = playerPos.x + Math.sin(this.angle.y) * this.distance * Math.cos(this.angle.x);
        const y = playerPos.y + CONFIG.CAMERA.HEIGHT_OFFSET + Math.sin(this.angle.x) * this.distance;
        const z = playerPos.z + Math.cos(this.angle.y) * this.distance * Math.cos(this.angle.x);

        this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
        this.camera.lookAt(playerPos.x, playerPos.y + CONFIG.CAMERA.HEIGHT_OFFSET, playerPos.z);
    }
}
