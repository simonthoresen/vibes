export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.listeningForKey = null;
        this.konamiIndex = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;
        
        // Emit custom event for key press
        this.dispatchInputEvent('keydown', { key, originalEvent: e });
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        
        this.dispatchInputEvent('keyup', { key, originalEvent: e });
    }

    handleMouseMove(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        this.dispatchInputEvent('mousemove', { x: this.mouseX, y: this.mouseY });
    }

    dispatchInputEvent(type, detail) {
        const event = new CustomEvent(`input-${type}`, { detail });
        document.dispatchEvent(event);
    }

    isKeyPressed(key) {
        return !!this.keys[key];
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    setListeningForKey(action) {
        this.listeningForKey = action;
    }

    stopListeningForKey() {
        this.listeningForKey = null;
    }

    checkKonamiCode(key, konamiCode) {
        const currentKey = konamiCode[this.konamiIndex].toLowerCase();
        if (key === currentKey) {
            this.konamiIndex++;
            if (this.konamiIndex === konamiCode.length) {
                this.konamiIndex = 0;
                return true;
            }
        } else {
            this.konamiIndex = 0;
        }
        return false;
    }
}
