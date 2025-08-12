// Sprite Test State
// Sprite Test State
(function() {
    let canvas, ctx;
    let spriteManager;
    let particleSystem;
    window.spriteTestParticleSystem = null;
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
    let turretRotation = 0;
    let enemyRotation = 0;
    let playerRotation = 0;

    let cellW, cellH;
    function enter(stateManager) {
        turretRotation = 0;
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        spriteManager = new window.SpriteManager();
        spriteManager.clear();
        particleSystem = new window.ParticleSystem();
        window.spriteTestParticleSystem = particleSystem;
        // 2x2 grid cell positions
        cellW = canvas.width / 2;
        cellH = canvas.height / 2;
        // Upper left: turret
        spriteManager.addSprite(new window.TurretSprite({
            type: 'turret',
            x: cellW / 2,
            y: cellH / 2,
            width: 128,
            height: 128,
            rotation: turretRotation,
            scale: 1,
            particleSystem: particleSystem
        }));
        // Upper right: enemy fighter
        spriteManager.addSprite(new window.EnemyFighterSprite({
            type: 'enemyFighter',
            x: cellW * 1.5,
            y: cellH / 2,
            width: 128,
            height: 128,
            rotation: enemyRotation,
            scale: 1,
            particleSystem: particleSystem
        }));
        // Bottom left: player fighter jet
        spriteManager.addSprite(new window.PlayerFighterSprite({
            type: 'playerFighter',
            x: cellW / 2,
            y: cellH * 1.5,
            width: 128,
            height: 128,
            rotation: playerRotation,
            scale: 1,
            particleSystem: particleSystem
        }));
            // Bottom right: player car
            spriteManager.addSprite(new window.PlayerCarSprite({
                type: 'playerCar',
                x: cellW * 1.5,
                y: cellH * 1.5,
                width: 128,
                height: 128,
                rotation: 0,
                scale: 1
            }));
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
    }

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
    // Turret is in cellW/2, cellH/2
    const cxTurret = cellW / 2;
    const cyTurret = cellH / 2;
    // FRONT is negative Y, so subtract 90 degrees (Math.PI/2) and add Math.PI to rotate FRONT toward mouse
    turretRotation = Math.atan2(my - cyTurret, mx - cxTurret) - Math.PI / 2 + Math.PI;

    // Enemy fighter is in cellW*1.5, cellH/2
    const cxEnemy = cellW * 1.5;
    const cyEnemy = cellH / 2;
    // FRONT is negative Y, so subtract 90 degrees (Math.PI/2) and add Math.PI to rotate FRONT toward mouse
    enemyRotation = Math.atan2(my - cyEnemy, mx - cxEnemy) - Math.PI / 2 + Math.PI;

    // Player fighter is in cellW/2, cellH*1.5
    const cxPlayer = cellW / 2;
    const cyPlayer = cellH * 1.5;
    // FRONT is negative Y, so subtract 90 degrees (Math.PI/2) and add Math.PI to rotate FRONT toward mouse
    playerRotation = Math.atan2(my - cyPlayer, mx - cxPlayer) - Math.PI / 2 + Math.PI;

        // Player car is in cellW*1.5, cellH*1.5
        const cxCar = cellW * 1.5;
        const cyCar = cellH * 1.5;
        // Car points forward (negative Y), rotate toward mouse
        if (spriteManager && spriteManager.sprites.length > 3) {
            spriteManager.sprites[3].rotation = Math.atan2(my - cyCar, mx - cxCar) - Math.PI / 2 + Math.PI;
        }
    }

    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.spriteTestParticleSystem = null;
    }

    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (backButton.contains(mx, my)) {
            window.stateManager.setState('menu');
        }
    }

    function update(dt) {
        if (particleSystem) {
            particleSystem.update(dt);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Update turret, enemy fighter, and player fighter rotation before drawing
        if (spriteManager.sprites.length > 0) {
            spriteManager.sprites[0].rotation = turretRotation;
        }
        if (spriteManager.sprites.length > 1) {
            spriteManager.sprites[1].rotation = enemyRotation;
        }
        if (spriteManager.sprites.length > 2) {
            spriteManager.sprites[2].rotation = playerRotation;
        }
            // Update player car rotation
            if (spriteManager.sprites.length > 3) {
                // Already set in onMouseMove, but ensure it's not undefined
                // spriteManager.sprites[3].rotation = carRotation;
            }
        // Draw grid
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cellW, 0);
        ctx.lineTo(cellW, canvas.height);
        ctx.moveTo(0, cellH);
        ctx.lineTo(canvas.width, cellH);
        ctx.stroke();
        ctx.restore();
        // Draw particles first so zLayer -1 particles render below sprites
        if (particleSystem) {
            particleSystem.draw(ctx);
        }
        spriteManager.draw(ctx);
        backButton.draw(ctx);
    }

    window.spriteTestState = { enter, exit, update, draw };
})();
