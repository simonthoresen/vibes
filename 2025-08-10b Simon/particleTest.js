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

    function enter(stateManager) {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        particleSystem = new window.ParticleSystem();
        cellWidth = canvas.width / grid.cols;
        cellHeight = canvas.height / grid.rows;
        startExplosion(0); // cell 1,1
        startExplosion(1); // cell 1,2
        startExplosion(2); // cell 1,3
        canvas.addEventListener('mousedown', onMouseDown);
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
