// Map system for platformer games with multi-layer, parallax, and z-order support

class MapLayer {
    constructor({ z = 0, parallax = 1, data = null, name = "" } = {}) {
        this.z = z; // z-value for rendering order
        this.parallax = parallax; // parallax factor (lower = slower)
        this.data = data; // tile/sprite data for this layer
        this.name = name;
    }
}

class GameMap {
    constructor({ width, height, layers = [] } = {}) {
        this.width = width;
        this.height = height;
        this.layers = layers; // Array of MapLayer objects
    }

    addLayer(layer) {
        this.layers.push(layer);
        // Sort layers by z-value (ascending)
        this.layers.sort((a, b) => a.z - b.z);
    }

    render(ctx, camera) {
        // Render layers in order, applying parallax
        for (const layer of this.layers) {
            this.renderLayer(ctx, layer, camera);
        }
    }

    renderLayer(ctx, layer, camera) {
        // Example: render layer data with parallax
        // You should replace this with your actual tile/sprite rendering logic
        const offsetX = camera.x * layer.parallax;
        const offsetY = camera.y * layer.parallax;
        if (layer.data && typeof layer.data.render === "function") {
            layer.data.render(ctx, offsetX, offsetY);
        }
    }
}

// Example usage:
// const map = new GameMap({ width: 100, height: 50 });
// map.addLayer(new MapLayer({ z: 0, parallax: 0.5, data: backgroundTiles }));
// map.addLayer(new MapLayer({ z: 1, parallax: 1, data: foregroundTiles }));
// map.render(ctx, camera);

// Utility: Render sprites and particles by z-layer, respecting map layers
function renderSpritesAndParticlesByMapLayers(ctx, camera, map, spriteManager, particleSystem) {
    // For each layer, render sprites and particles with matching z-value
    for (const layer of map.layers) {
        // Parallax offset for this layer
        const offsetX = camera.x * layer.parallax;
        const offsetY = camera.y * layer.parallax;

        // Draw layer background/tile data if present
        if (layer.data && typeof layer.data.render === "function") {
            layer.data.render(ctx, offsetX, offsetY);
        }

        // Draw sprites in this z-layer
        if (spriteManager && spriteManager.sprites) {
            for (const sprite of spriteManager.sprites) {
                if (typeof sprite.z === "number" ? sprite.z === layer.z : layer.z === 0) {
                    ctx.save();
                    ctx.translate(-offsetX, -offsetY); // Parallax compensation
                    sprite.draw(ctx);
                    ctx.restore();
                }
            }
        }

        // Draw particles in this z-layer
        if (particleSystem && particleSystem.particles) {
            for (const particle of particleSystem.particles) {
                if (typeof particle.zLayer === "number" ? particle.zLayer === layer.z : layer.z === 0) {
                    ctx.save();
                    ctx.translate(-offsetX, -offsetY); // Parallax compensation
                    particle.draw(ctx);
                    ctx.restore();
                }
            }
        }
    }
}

window.GameMap = GameMap;
window.MapLayer = MapLayer;
window.renderSpritesAndParticlesByMapLayers = renderSpritesAndParticlesByMapLayers;
