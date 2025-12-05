// Simplex Noise based terrain generation
class TerrainGenerator {
    constructor(seed = null) {
        this.seed = seed || Math.floor(Math.random() * 10000);
        this.noise = new SimplexNoise(this.seededRandom.bind(this));
    }

    seededRandom(index) {
        const x = Math.sin(this.seed + index) * 10000;
        return x - Math.floor(x);
    }

    generateHeightmap(size) {
        const heightmap = new Float32Array(size * size);
        
        const centerX = size / 2;
        const centerY = size / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let height = 0;

                // Primary layer - large features
                height += this.noise.noise(x * 0.005, y * 0.005) * 150;

                // Secondary layer - hills
                height += this.noise.noise(x * 0.02, y * 0.02) * 80;

                // Tertiary layer - detail
                height += this.noise.noise(x * 0.05, y * 0.05) * 30;

                // Apply radial falloff to create island effect
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const falloff = Math.max(0, 1 - (distance / maxDistance) * 1.2);
                
                height *= falloff;

                // Clamp to valid range
                height = Math.max(
                    CONFIG.HEIGHTMAP.MIN_ELEVATION,
                    Math.min(CONFIG.HEIGHTMAP.MAX_ELEVATION, height)
                );

                heightmap[y * size + x] = height;
            }
        }

        return heightmap;
    }

    // Get height at any X, Y coordinate (with interpolation)
    getHeight(heightmap, size, x, y) {
        if (x < 0 || x >= size || y < 0 || y >= size) {
            return CONFIG.HEIGHTMAP.OUT_OF_BOUNDS_ELEVATION;
        }

        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        // Bilinear interpolation
        const h00 = heightmap[yi * size + xi];
        const h10 = xi + 1 < size ? heightmap[yi * size + (xi + 1)] : h00;
        const h01 = yi + 1 < size ? heightmap[(yi + 1) * size + xi] : h00;
        const h11 = xi + 1 < size && yi + 1 < size ? heightmap[(yi + 1) * size + (xi + 1)] : h00;

        const h0 = h00 + (h10 - h00) * xf;
        const h1 = h01 + (h11 - h01) * xf;

        return h0 + (h1 - h0) * yf;
    }

    // Calculate slope/steepness at a point
    getSlope(heightmap, size, x, y) {
        const dx = 1;
        const h0 = this.getHeight(heightmap, size, x - dx, y);
        const h1 = this.getHeight(heightmap, size, x + dx, y);
        const h2 = this.getHeight(heightmap, size, x, y - dx);
        const h3 = this.getHeight(heightmap, size, x, y + dx);

        const slopeX = Math.abs(h1 - h0) / (2 * dx);
        const slopeY = Math.abs(h3 - h2) / (2 * dx);

        return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
    }

    // Get normal at point for lighting
    getNormal(heightmap, size, x, y) {
        const step = 1;
        const h0 = this.getHeight(heightmap, size, x - step, y);
        const h1 = this.getHeight(heightmap, size, x + step, y);
        const h2 = this.getHeight(heightmap, size, x, y - step);
        const h3 = this.getHeight(heightmap, size, x, y + step);

        const v1 = new THREE.Vector3(2 * step, 0, h1 - h0);
        const v2 = new THREE.Vector3(0, 2 * step, h3 - h2);

        const normal = v1.cross(v2).normalize();
        return normal;
    }
}

// Simplex Noise implementation
class SimplexNoise {
    constructor(randomFn) {
        this.randomFn = randomFn;
        this.p = this.buildPermutationTable();
    }

    buildPermutationTable() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = Math.floor(this.randomFn(i) * 256);
        }
        // Duplicate for wrapping
        return p.concat(p);
    }

    noise(x, y) {
        // Simple 2D Perlin-like noise
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        // Fade curves
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const n00 = this.grad(this.p[xi] + this.p[yi], xf, yf);
        const n10 = this.grad(this.p[xi + 1] + this.p[yi], xf - 1, yf);
        const n01 = this.grad(this.p[xi] + this.p[yi + 1], xf, yf - 1);
        const n11 = this.grad(this.p[xi + 1] + this.p[yi + 1], xf - 1, yf - 1);

        const nx0 = n00 + u * (n10 - n00);
        const nx1 = n01 + u * (n11 - n01);

        return nx0 + v * (nx1 - nx0);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 8 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}
