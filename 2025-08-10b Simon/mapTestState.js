// Map Test State for platformer map system
// Use window.GameMap, window.MapLayer, window.renderSpritesAndParticlesByMapLayers for browser compatibility

const mapTestState = (function() {
    let canvas, ctx;
    let testMap, spriteManager, particleSystem, camera;
    let backButton = {
        x: 40, y: 40, w: 120, h: 50,
        draw(ctx) {
            ctx.save();
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Back', this.x + this.w/2, this.y + this.h/2);
            ctx.restore();
        },
        contains(mx, my) {
            return mx >= this.x && mx <= this.x + this.w && my >= this.y && my <= this.y + this.h;
        }
    };

    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (mx >= backButton.x && mx <= backButton.x + backButton.w && my >= backButton.y && my <= backButton.y + backButton.h) {
            window.stateManager.setState('menu');
        }
    }
    function enter() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
    canvas.addEventListener('mousedown', onMouseDown);
        // Create a test map with 3 layers
    testMap = new window.GameMap({
            width: 40,
            height: 20,
            layers: [
                new window.MapLayer({ z: 0, parallax: 0.3, name: 'Background', data: { render: (ctx, ox, oy) => {
                    ctx.save();
                    ctx.fillStyle = '#223';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                }} }),
                new window.MapLayer({ z: 1, parallax: 0.6, name: 'Midground', data: { render: (ctx, ox, oy) => {
                    ctx.save();
                    ctx.fillStyle = '#2a5';
                    ctx.fillRect(100 - ox, 100 - oy, 300, 200);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(100 - ox, 100 - oy, 300, 200);
                    ctx.restore();
                }} }),
                new window.MapLayer({ z: 2, parallax: 1, name: 'Foreground', data: { render: (ctx, ox, oy) => {
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.globalAlpha = 0.1;
                    ctx.fillRect(200 - ox, 200 - oy, 200, 100);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = '#f00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(200 - ox, 200 - oy, 200, 100);
                    ctx.restore();
                }} })
            ]
        });
        // Dummy sprite/particle managers
        spriteManager = window.SpriteManager ? new window.SpriteManager() : { sprites: [] };
        particleSystem = window.ParticleSystem ? new window.ParticleSystem() : { particles: [] };
        // Add a test sprite and particle
        if (spriteManager.sprites) spriteManager.sprites.push(new window.Sprite({ x: 300, y: 200, width: 64, height: 64, z: 2 }));
        if (particleSystem.particles) particleSystem.particles.push({ x: 400, y: 300, shape: 'circle', color: '#f00', size: 24, alpha: 1, rotation: 0, zLayer: 1, draw: function(ctx) { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); ctx.restore(); } });
        camera = { x: 0, y: 0 };
    }
    function exit() {}
    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
    }
    function update(dt) {
        // Move camera for parallax demo
        camera.x += 40 * dt;
        camera.y += 20 * dt;
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.renderSpritesAndParticlesByMapLayers(ctx, camera, testMap, spriteManager, particleSystem);
    backButton.draw(ctx);
    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (backButton.contains(mx, my)) {
            window.stateManager.setState('menu');
        }
    }
    }
    return { enter, exit, update, draw };
})();

window.mapTestState = mapTestState;
