export class InputManager {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            shoot: false,
            toggleCamera: false,
            toggleDebug: false
        };

        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            deltaZ: 0, // Mouse wheel
            leftButton: false
        };

        this.isPointerLocked = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'Space': 
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'Tab':
                this.keys.toggleCamera = true;
                event.preventDefault();
                break;
            case 'KeyB':
                this.keys.toggleDebug = true;
                event.preventDefault();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'Tab': this.keys.toggleCamera = false; break;
            case 'KeyB': this.keys.toggleDebug = false; break;
        }
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
        }
    }

    onMouseDown(event) {
        if (event.button === 0) {
            this.mouse.leftButton = true;
            this.keys.shoot = true;
            
            // Request pointer lock with error handling
            if (!this.isPointerLocked) {
                document.body.requestPointerLock().catch(err => {
                    console.warn('Pointer lock request failed:', err);
                });
            }
        }
    }

    onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.leftButton = false;
        }
    }

    onMouseWheel(event) {
        this.mouse.deltaZ = event.deltaY > 0 ? -1 : 1; // Negative for zoom out, positive for zoom in
        event.preventDefault();
    }

    getInput() {
        const input = {
            forward: this.keys.forward,
            backward: this.keys.backward,
            left: this.keys.left,
            right: this.keys.right,
            boost: this.keys.jump, // Space is now boost
            shoot: this.keys.shoot,
            toggleCamera: this.keys.toggleCamera,
            toggleDebug: this.keys.toggleDebug,
            mouseDelta: {
                x: this.mouse.deltaX,
                y: this.mouse.deltaY,
                z: this.mouse.deltaZ
            }
        };

        // Reset single-frame inputs
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.deltaZ = 0;
        this.keys.shoot = false;
        this.keys.toggleCamera = false;
        this.keys.toggleDebug = false;

        return input;
    }

    resetToggle() {
        this.keys.toggleCamera = false;
    }
}
