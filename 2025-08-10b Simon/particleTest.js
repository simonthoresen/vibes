// Particle Test State
(function() {
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

    let particleSystem;
    let canvas, ctx;
    let grid = { rows: 3, cols: 3 };
    let cellWidth, cellHeight;
    let explosionActive = [false, false, false]; // For cells 1,1, 1,2, 1,3
    let hitEffectActive = false;
    let hitEffectTimer = 0;
    let hitEffectSquareTimer = 0;
    let hitEffectTriangleTimer = 0;
    let emitters = [];
    let mouseX = 0, mouseY = 0;

    function enter(stateManager) {
        hitEffectTriangleTimer = 0;
        hitEffectSquareTimer = 0;
        hitEffectTimer = 0;
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        particleSystem = new window.ParticleSystem();
        cellWidth = canvas.width / grid.cols;
        cellHeight = canvas.height / grid.rows;
        startExplosion(0); // cell 1,1
        startExplosion(1); // cell 1,2
        startExplosion(2); // cell 1,3

        // Cell 1,3 (upper right): hit effect with circles
        startHitEffect();

        // Cell 2,1: emitter of circles pointing at mouse
        const emitterX1 = cellWidth * 1.5;
        const emitterY1 = cellHeight / 2;
        // Cell 2,2: emitter of squares pointing at mouse
        const emitterX2 = cellWidth * 1.5;
        const emitterY2 = cellHeight * 1.5;
        // Cell 2,3: emitter of triangles pointing at mouse
        const emitterX3 = cellWidth * 1.5;
        const emitterY3 = cellHeight * 2.5;

        emitters = [
            particleSystem.addEmitter({
                x: emitterX1,
                y: emitterY1,
                emissionRate: 30,
                shape: 'circle',
                color: '#ff6600',
                size: 10,
                direction: 0, // will be updated
                speed: 120,
                lifetime: 1.2,
                radius: 0
            }),
            particleSystem.addEmitter({
                x: emitterX2,
                y: emitterY2,
                emissionRate: 30,
                shape: 'square',
                color: '#00ccff',
                size: 10,
                direction: 0, // will be updated
                speed: 120,
                lifetime: 1.2,
                radius: 0
            }),
            particleSystem.addEmitter({
                x: emitterX3,
                y: emitterY3,
                emissionRate: 30,
                shape: 'triangle',
                color: '#cc00ff',
                size: 10,
                direction: 0, // will be updated
                speed: 120,
                lifetime: 1.2,
                radius: 0
            })
        ];

        mouseX = emitterX1;
        mouseY = emitterY1;
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
    }

    function startHitEffect() {
        // Cell 1,3: upper right
        const x = cellWidth * 2.5;
        const y = cellHeight / 2;
        // Point towards mouse
        const dx = mouseX - x;
        const dy = mouseY - y;
        const direction = Math.atan2(dy, dx);
        particleSystem.emitHitEffect({
            x,
            y,
            count: 40,
            shape: 'circle',
            color: '#ff2222',
            size: 5,
            speed: 180,
            lifetime: 0.5,
            direction,
            spread: Math.PI / 6
        });
    }

    function startHitEffectSquare() {
        // Cell 2,3: below upper right (cell 1,3)
        const x = cellWidth * 2.5;
        const y = cellHeight * 1.5;
        // Point towards mouse
        const dx = mouseX - x;
        const dy = mouseY - y;
        const direction = Math.atan2(dy, dx);
        particleSystem.emitHitEffect({
            x,
            y,
            count: 40,
            shape: 'square',
            color: '#22ff22',
            size: 5,
            speed: 180,
            lifetime: 0.5,
            direction,
            spread: Math.PI / 6
        });
    }

    function startHitEffectTriangle() {
        // Cell 3,3: bottom right
        const x = cellWidth * 2.5;
        const y = cellHeight * 2.5;
        // Point towards mouse
        const dx = mouseX - x;
        const dy = mouseY - y;
        const direction = Math.atan2(dy, dx);
        particleSystem.emitHitEffect({
            x,
            y,
            count: 40,
            shape: 'triangle',
            color: '#2222ff',
            size: 5,
            speed: 180,
            lifetime: 0.5,
            direction,
            spread: Math.PI / 6
        });
        hitEffectActive = true;
    }

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function startExplosion(cellIdx) {
        // cellIdx: 0 = 1,1; 1 = 1,2; 2 = 1,3
        const x = cellWidth / 2;
        const y = cellHeight * (cellIdx + 0.5);
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['#ff0', '#0ff', '#f0f'];
        particleSystem.emitExplosion({
            x,
            y,
            count: 60,
            shape: shapes[cellIdx],
            color: colors[cellIdx],
            size: 10,
            speed: 180,
            lifetime: 1.2
        });
        explosionActive[cellIdx] = true;
    }

    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
    }

    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (backButton.contains(mx, my)) {
            window.stateManager.setState('menu');
        } else {
            // Emit explosion at mouse
            particleSystem.emitExplosion({
                x: mx,
                y: my,
                count: 50,
                shape: ['circle','square','triangle'][Math.floor(Math.random()*3)],
                color: '#'+Math.floor(Math.random()*16777215).toString(16),
                size: 8 + Math.random()*12,
                speed: 100 + Math.random()*200,
                lifetime: 1 + Math.random()*1.5
            });
        }
    }

    function update(dt) {
        // Cell 1,3: repeat hit effect every 2 seconds
        hitEffectTimer += dt;
    if (hitEffectTimer >= 1) {
            startHitEffect();
            hitEffectTimer = 0;
        }
        // Cell 2,3: repeat square hit effect every 1 second
        hitEffectSquareTimer += dt;
        if (hitEffectSquareTimer >= 1) {
            startHitEffectSquare();
            hitEffectSquareTimer = 0;
        }
        // Cell 3,3: repeat triangle hit effect every 1 second
        hitEffectTriangleTimer += dt;
        if (hitEffectTriangleTimer >= 1) {
            startHitEffectTriangle();
            hitEffectTriangleTimer = 0;
        }
        // Update emitter directions to point at mouse
        const emitterPositions = [
            [cellWidth * 1.5, cellHeight / 2],
            [cellWidth * 1.5, cellHeight * 1.5],
            [cellWidth * 1.5, cellHeight * 2.5]
        ];
        for (let i = 0; i < emitters.length; i++) {
            const [ex, ey] = emitterPositions[i];
            const dx = mouseX - ex;
            const dy = mouseY - ey;
            emitters[i].direction = Math.atan2(dy, dx);
        }
        particleSystem.update(dt);
        // For each cell in column 1 (cells 1,1; 1,2; 1,3)
        const shapes = ['circle', 'square', 'triangle'];
        for (let i = 0; i < 3; i++) {
            const x = cellWidth / 2;
            const y = cellHeight * (i + 0.5);
            const particlesInCell = particleSystem.particles.filter(p => {
                return p.shape === shapes[i] && Math.abs(p.x - x) < cellWidth/2 && Math.abs(p.y - y) < cellHeight/2;
            });
            if (explosionActive[i] && particlesInCell.length === 0) {
                startExplosion(i);
            }
        }
    // ...existing code...
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw grid
        ctx.save();
        ctx.strokeStyle = '#333';
        for (let i = 1; i < grid.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellWidth, 0);
            ctx.lineTo(i * cellWidth, canvas.height);
            ctx.stroke();
        }
        for (let j = 1; j < grid.rows; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * cellHeight);
            ctx.lineTo(canvas.width, j * cellHeight);
            ctx.stroke();
        }
        ctx.restore();
        particleSystem.draw(ctx);
        backButton.draw(ctx);
    }

    window.particleTestState = { enter, exit, update, draw };
})();
