// Map system with multi-layer, parallax, and shared tilesheet

class MapLayer {
    constructor(width, height, parallax = 1) {
        this.width = width;
        this.height = height;
        this.parallax = parallax; // Lower = slower movement
        // 2D array of tile indices (null for empty/transparent)
        this.tiles = Array.from({ length: height }, () => Array(width).fill(null));
    }
}

class Map {
    constructor(width, height, tilesheetSrc) {
        this.width = width;
        this.height = height;
        this.layers = [];
        this.tilesheet = new Image();
        this.tilesheet.src = tilesheetSrc;
        // Tilesheet properties (set these as needed)
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.tilesPerRow = 8;
    }

    addLayer(parallax = 1) {
        const layer = new MapLayer(this.width, this.height, parallax);
        this.layers.push(layer);
        return layer;
    }

    render(ctx, camera) {
        ctx.imageSmoothingEnabled = false;
        const mapPixelWidth = this.width * this.tileWidth;
        const mapPixelHeight = this.height * this.tileHeight;
        const centerX = mapPixelWidth / 2 - ctx.canvas.width / 2;
        const centerY = mapPixelHeight / 2 - ctx.canvas.height / 2;
        const camOffsetX = Math.floor(camera.x - centerX);
        const camOffsetY = Math.floor(camera.y - centerY);
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            // Parallax offset relative to map center
            const offsetX = camOffsetX * layer.parallax;
            const offsetY = camOffsetY * layer.parallax;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileIndex = layer.tiles[y][x];
                    if (tileIndex === null) continue; // Transparent
                    // Calculate tile position in tilesheet
                    const sx = (tileIndex % this.tilesPerRow) * this.tileWidth;
                    const sy = Math.floor(tileIndex / this.tilesPerRow) * this.tileHeight;
                    // Calculate screen position (integer math)
                    const dx = x * this.tileWidth - offsetX;
                    const dy = y * this.tileHeight - offsetY;
                    ctx.drawImage(
                        this.tilesheet,
                        sx, sy, this.tileWidth, this.tileHeight,
                        dx, dy, this.tileWidth, this.tileHeight
                    );
                }
            }
        }
    }
}

window.Map = Map;
window.MapLayer = MapLayer;

