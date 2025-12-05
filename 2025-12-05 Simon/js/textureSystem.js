// Texture System - Assigns textures based on elevation and slope
class TextureSystem {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.textureCanvas = document.createElement('canvas');
        this.textureCanvas.width = terrain.size;
        this.textureCanvas.height = terrain.size;
        this.textureContext = this.textureCanvas.getContext('2d');
        
        // Create texture colors
        this.textureColors = {
            sand: '#C2B280',
            grass: '#228B22',
            forest: '#1a4d1a',
            rock: '#808080',
            snow: '#FFFFFF',
            scorched: '#3d3d3d',
            overgrown: '#00AA00',
            cracked: '#808000',
            icy: '#E0FFFF',
        };

        this.generateSplatmap();
    }

    generateSplatmap() {
        // Draw terrain based on height and slope
        const imageData = this.textureContext.createImageData(this.terrain.size, this.terrain.size);
        const data = imageData.data;

        for (let y = 0; y < this.terrain.size; y++) {
            for (let x = 0; x < this.terrain.size; x++) {
                const idx = y * this.terrain.size + x;
                const height = this.terrain.heightmap[idx];
                const slope = this.terrain.generator.getSlope(this.terrain.heightmap, this.terrain.size, x, y);

                const color = this.getTextureColor(height, slope);
                const pixelIdx = (y * this.terrain.size + x) * 4;

                data[pixelIdx] = color.r;
                data[pixelIdx + 1] = color.g;
                data[pixelIdx + 2] = color.b;
                data[pixelIdx + 3] = 255;
            }
        }

        this.textureContext.putImageData(imageData, 0, 0);
        
        // Update terrain material with texture
        const texture = new THREE.CanvasTexture(this.textureCanvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        
        this.terrain.material.map = texture;
        this.terrain.material.needsUpdate = true;
    }

    getTextureColor(height, slope) {
        let color = this.textureColors.grass;

        // Determine texture based on elevation and slope
        if (slope > 0.45) {
            color = this.textureColors.rock;
        } else if (height < 10) {
            color = this.textureColors.sand;
        } else if (height > 350) {
            color = this.textureColors.snow;
        } else if (height > 100) {
            color = this.textureColors.forest;
        }

        return this.hexToRgb(color);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : { r: 128, g: 128, b: 128 };
    }

    update() {
        // Update textures after terrain modification
    }
}
