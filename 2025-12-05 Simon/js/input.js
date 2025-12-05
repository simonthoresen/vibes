// Input Handler
const inputHandler = {
    handleInput(game) {
        // Only handle input if game is running and fully initialized
        if (!game.isGameRunning || !game.renderer || !game.renderer.camera || !game.spellSystem) {
            return;
        }

        // Keyboard input for spell selection
        for (let i = 0; i < 10; i++) {
            const keyCode = `Digit${i === 9 ? 0 : i + 1}`;
            if (inputManager.isKeyPressed(keyCode)) {
                game.spellSystem.selectSpell(i);
            }
        }

        // Left click to cast spell
        if (game.isMouseDown && game.isGameRunning) {
            try {
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();
                
                mouse.x = (game.lastMouseX / window.innerWidth) * 2 - 1;
                mouse.y = -(game.lastMouseY / window.innerHeight) * 2 + 1;

                // Use the Three.js camera from renderer
                raycaster.setFromCamera(mouse, game.renderer.camera);

                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const target = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, target);

                game.spellSystem.castSpell(game.spellSystem.selectedSpell, target.x, target.z);
            } catch (error) {
                // Silently catch errors during spell casting
            }
        }
    }
};

// Mouse tracking
document.addEventListener('mousemove', (e) => {
    if (window.gameInstance) {
        window.gameInstance.lastMouseX = e.clientX;
        window.gameInstance.lastMouseY = e.clientY;
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && window.gameInstance) { // Left click
        window.gameInstance.isMouseDown = true;
    }
});

document.addEventListener('mouseup', () => {
    if (window.gameInstance) {
        window.gameInstance.isMouseDown = false;
    }
});

// Pause menu
inputManager.addEventListener((type, code) => {
    if (code === inputManager.keybinds.pauseMenu && window.gameInstance && window.gameInstance.isGameRunning) {
        const pauseMenu = document.getElementById('pauseMenu');
        const menuContainer = document.getElementById('menuContainer');
        
        if (pauseMenu.classList.contains('active')) {
            pauseMenu.classList.remove('active');
            menuContainer.classList.add('hidden');
            window.gameInstance.isGameRunning = true;
        } else {
            pauseMenu.classList.add('active');
            menuContainer.classList.remove('hidden');
            window.gameInstance.isGameRunning = false;
        }
    }
});
