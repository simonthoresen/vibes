// Sprite Test State
(function() {
    let canvas, ctx;
    let spriteManager;
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

    function enter(stateManager) {
        turretRotation = 0;
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        spriteManager = new window.SpriteManager();
        spriteManager.clear();
        class TurretSprite extends window.Sprite {
            constructor(opts) {
                super(opts);
            }
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.scale(this.scale, this.scale);
                // Draw brown circle
                ctx.fillStyle = '#8B5A2B';
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                // Draw dark brown triangle, centered
                ctx.fillStyle = '#4B2E09';
                ctx.beginPath();
                ctx.moveTo(0, 40); // bottom point (flipped)
                ctx.lineTo(32, -32); // top right (flipped)
                ctx.lineTo(-32, -32); // top left (flipped)
                ctx.closePath();
                ctx.fill();
                // Draw debug graphics
                if (window.SpriteDebugMode) {
                    // Call base debug rendering
                    ctx.save();
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = '#FFFF00';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('+', 0, 0);
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('FWD', 0, this.height/2 + 20);
                    ctx.fillText('BCK', 0, -this.height/2 - 20);
                    ctx.fillText('RGT', this.width/2 + 30, 0);
                    ctx.fillText('LFT', -this.width/2 - 30, 0);
                    ctx.restore();
                }
                ctx.restore();
            }
        }
        spriteManager.addSprite(new TurretSprite({
            type: 'turret',
            x: canvas.width/2,
            y: canvas.height/2,
            width: 128,
            height: 128,
            rotation: turretRotation,
            scale: 1
        }));
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
    }

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        turretRotation = Math.atan2(my - cy, mx - cx) - Math.PI/2;
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
        }
    }

    function update(dt) {}

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Update turret rotation before drawing
        if (spriteManager.sprites.length > 0) {
            spriteManager.sprites[0].rotation = turretRotation;
        }
        spriteManager.draw(ctx);
        backButton.draw(ctx);
    }

    window.spriteTestState = { enter, exit, update, draw };
})();
