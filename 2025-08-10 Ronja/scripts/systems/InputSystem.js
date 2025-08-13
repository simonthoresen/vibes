class InputSystem {
    constructor() {
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Set();

        window.addEventListener('keydown', (e) => this.keys.add(e.key));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
        
        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => this.mouseButtons.add(e.button));
        window.addEventListener('mouseup', (e) => this.mouseButtons.delete(e.button));
    }

    isKeyDown(key) {
        return this.keys.has(key);
    }

    isMouseButtonDown(button) {
        return this.mouseButtons.has(button);
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }
}
