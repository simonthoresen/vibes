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


    let testMap, camera;

    function createTilesheet(tileWidth, tileHeight, numTiles) {
        const colors = [
            '#3b2f1c', // dark brown
            '#5c4321',
            '#7d5c2a',
            '#a07a4a', // light brown
            '#c9b07a',
            '#e6d3b3',
            '#1c3b2f', // dark green
            '#215c43',
            '#2a7d5c',
            '#4aa07a'  // light green
        ];
        const canvas = document.createElement('canvas');
        canvas.width = tileWidth * numTiles;
        canvas.height = tileHeight;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < numTiles; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(i * tileWidth, 0, tileWidth, tileHeight);
        }
        const img = new window.Image();
        img.src = canvas.toDataURL();
        return img;
    }

    function enter() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        canvas.addEventListener('mousedown', onMouseDown);

        // Create a tilesheet in memory with 10 solid color tiles
        const tileWidth = 32, tileHeight = 32, numTiles = 10;
        const tilesheet = createTilesheet(tileWidth, tileHeight, numTiles);

        // Create a 5-layered map of size 30x30 using the generated tilesheet
        const mapSize = 30;
        testMap = new window.Map(mapSize, mapSize, '');
        testMap.tilesheet = tilesheet;
        testMap.tileWidth = tileWidth;
        testMap.tileHeight = tileHeight;
        testMap.tilesPerRow = numTiles;

        // Add 5 layers with increasing parallax (background = 0.2, foreground = 1)
        for (let i = 0; i < 5; i++) {
            testMap.addLayer(0.2 + i * 0.2); // 0.2, 0.4, 0.6, 0.8, 1
        }

        // Fill each layer fully with one tile type
        for (let l = 0; l < testMap.layers.length; l++) {
            for (let y = 0; y < mapSize; y++) {
                for (let x = 0; x < mapSize; x++) {
                    testMap.layers[l].tiles[y][x] = l; // Fill with tile index = layer index
                }
            }
        }

        // Make 3-tile-wide strokes through each layer that clear the tiles at those positions
        for (let l = 0; l < testMap.layers.length; l++) {
            // Skip strokes for the bottom layer (background)
            if (l === 0) continue;
            // Diagonal stroke (3 wide)
            for (let t = 0; t < mapSize; t++) {
                for (let w = -1; w <= 1; w++) {
                    const x = t + w;
                    const y = t;
                    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize) {
                        testMap.layers[l].tiles[y][x] = null;
                    }
                }
            }
            // Anti-diagonal stroke (3 wide)
            for (let t = 0; t < mapSize; t++) {
                for (let w = -1; w <= 1; w++) {
                    const x = (mapSize - 1 - t) + w;
                    const y = t;
                    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize) {
                        testMap.layers[l].tiles[y][x] = null;
                    }
                }
            }
            // Horizontal stroke (3 wide)
            for (let x = 0; x < mapSize; x++) {
                for (let w = -1; w <= 1; w++) {
                    const y = Math.floor(mapSize / 2) + w;
                    if (y >= 0 && y < mapSize) {
                        testMap.layers[l].tiles[y][x] = null;
                    }
                }
            }
            // Vertical stroke (3 wide)
            for (let y = 0; y < mapSize; y++) {
                for (let w = -1; w <= 1; w++) {
                    const x = Math.floor(mapSize / 2) + w;
                    if (x >= 0 && x < mapSize) {
                        testMap.layers[l].tiles[y][x] = null;
                    }
                }
            }
        }

        // Camera starts centered on the map and canvas
        camera = {
            x: (testMap.width * testMap.tileWidth) / 2 - canvas.width / 2,
            y: (testMap.height * testMap.tileHeight) / 2 - canvas.height / 2
        };
    }

    function exit() {
        canvas.removeEventListener('mousedown', onMouseDown);
    }

    let cameraAngle = 0;
    function update(dt) {
        // Camera rotates slowly around the center of the map, keeping map centered in canvas
        if (camera && testMap) {
            cameraAngle += dt * 0.2; // Slow rotation
            const radius = 96;
            const mapCenterX = (testMap.width * testMap.tileWidth) / 2;
            const mapCenterY = (testMap.height * testMap.tileHeight) / 2;
            const offsetX = Math.cos(cameraAngle) * radius;
            const offsetY = Math.sin(cameraAngle) * radius;
            camera.x = mapCenterX - canvas.width / 2 + offsetX;
            camera.y = mapCenterY - canvas.height / 2 + offsetY;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (testMap && camera) {
            testMap.render(ctx, camera);
        }
        backButton.draw(ctx);
    }

    return { enter, exit, update, draw };
})();

window.mapTestState = mapTestState;
