// Input Manager - Handles keybind configuration and remapping
class InputManager {
    constructor() {
        this.keybinds = this.loadKeybinds();
        this.keysPressed = {};
        this.keyListeners = [];
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    loadKeybinds() {
        const saved = localStorage.getItem('keybinds');
        if (saved) {
            return JSON.parse(saved);
        }

        // Default keybinds
        return {
            moveForward: 'KeyW',
            moveBack: 'KeyS',
            moveLeft: 'KeyA',
            moveRight: 'KeyD',
            jump: 'Space',
            sprint: 'ShiftLeft',
            pauseMenu: 'Escape',
            chat: 'Enter',
            playerList: 'Tab',
            spell0: 'Digit1',
            spell1: 'Digit2',
            spell2: 'Digit3',
            spell3: 'Digit4',
            spell4: 'Digit5',
            spell5: 'Digit6',
            spell6: 'Digit7',
            spell7: 'Digit8',
            spell8: 'Digit9',
            spell9: 'Digit0',
        };
    }

    saveKeybinds() {
        localStorage.setItem('keybinds', JSON.stringify(this.keybinds));
    }

    handleKeyDown(event) {
        this.keysPressed[event.code] = true;
        
        for (const listener of this.keyListeners) {
            listener('down', event.code);
        }
    }

    handleKeyUp(event) {
        this.keysPressed[event.code] = false;
        
        for (const listener of this.keyListeners) {
            listener('up', event.code);
        }
    }

    isKeyPressed(code) {
        return this.keysPressed[code] || false;
    }

    getActionKey(action) {
        return this.keybinds[action];
    }

    setKeybind(action, code) {
        // Check for duplicates
        for (const key in this.keybinds) {
            if (key !== action && this.keybinds[key] === code) {
                return false;
            }
        }
        this.keybinds[action] = code;
        this.saveKeybinds();
        return true;
    }

    resetKeybinds() {
        this.keybinds = this.loadKeybinds();
        localStorage.removeItem('keybinds');
        this.keybinds = this.loadKeybinds();
    }

    addEventListener(callback) {
        this.keyListeners.push(callback);
    }
}

const inputManager = new InputManager();
