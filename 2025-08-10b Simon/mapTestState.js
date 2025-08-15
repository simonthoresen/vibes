
// Minimal Map Test State with only a back button
const mapTestState = (function() {
    let canvas, ctx;
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
        if (backButton.contains(mx, my)) {
            window.stateManager.setState('menu');
        }
    }

    function enter() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        canvas.addEventListener('mousedown', onMouseDown);
    }

    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
    }

    function update(dt) {
        // Nothing to update
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        backButton.draw(ctx);
    }

    return { enter, exit, update, draw };
})();

window.mapTestState = mapTestState;
