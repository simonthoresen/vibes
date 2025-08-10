
window.stateManager = (function() {
    let currentState = null;
    let states = {};
    return {
        register(name, state) { states[name] = state; },
        setState(name) {
            if (currentState && states[currentState].exit) states[currentState].exit();
            currentState = name;
            if (states[currentState].enter) states[currentState].enter(window.stateManager);
        },
        update(dt) { if (currentState && states[currentState].update) states[currentState].update(dt); },
        draw() { if (currentState && states[currentState].draw) states[currentState].draw(); },
        getState() { return currentState; }
    };
})();

// Main Menu State
const menuState = (function() {
    let canvas, ctx;
    let buttons = [
        { text: 'Particle Test', x: 0, y: 0, w: 320, h: 80, onClick: () => window.stateManager.setState('particleTest') }
    ];
    function enter() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        positionButtons();
        canvas.addEventListener('mousedown', onMouseDown);
    }
    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
    }
    function positionButtons() {
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        buttons[0].x = cx - buttons[0].w/2;
        buttons[0].y = cy - buttons[0].h/2;
    }
    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        for (const btn of buttons) {
            if (mx >= btn.x && mx <= btn.x+btn.w && my >= btn.y && my <= btn.y+btn.h) {
                btn.onClick();
                return;
            }
        }
    }
    function update() {}
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 64px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('game on', canvas.width/2, canvas.height/2 - 100);
        for (const btn of buttons) {
            ctx.save();
            ctx.fillStyle = '#444';
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.text, btn.x + btn.w/2, btn.y + btn.h/2);
            ctx.restore();
        }
    }
    return { enter, exit, update, draw };
})();

window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Register states
    window.stateManager.register('menu', menuState);
    window.stateManager.register('particleTest', window.particleTestState);
    window.stateManager.setState('menu');

    let lastTime = performance.now();
    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        window.stateManager.update(dt);
        window.stateManager.draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop(lastTime);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Reposition menu buttons if in menu
        if (window.stateManager.getState() === 'menu') menuState.enter();
    });
};
