// Terrain mesh and heightmap management
class Terrain {
    constructor(scene, size) {
        this.scene = scene;
        this.size = size;
        this.generator = new TerrainGenerator(CONFIG.DEFAULT_SEED);
        this.heightmap = null;
        this.mesh = null;
        this.geometry = null;
        this.material = null;
        this.waterVolume = null;
        this.physicsShape = null;
        this.meshChunks = [];
        this.chunkSize = 64;
        this.modificationHistory = [];
        this.maxHistoryLength = 20;
        this.textureSystem = null;

        this.generate();
    }

    generate() {
        // Generate heightmap
        this.heightmap = this.generator.generateHeightmap(this.size);
        this.waterVolume = new Float32Array(this.size * this.size);

        // Create terrain mesh
        this.createMesh();
        
        // Initialize texture system
        this.textureSystem = new TextureSystem(this.scene, this);
    }

    createMesh() {
        const geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const normals = [];
        const indices = [];
        const colors = [];

        // Build vertex data
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const height = this.heightmap[y * this.size + x];
                
                positions.push(x, height, y);

                // Calculate normal
                const normal = this.generator.getNormal(this.heightmap, this.size, x, y);
                normals.push(normal.x, normal.y, normal.z);

                // Color based on height (will be overridden by texture system)
                colors.push(0.5, 0.5, 0.5);
            }
        }

        // Build indices (triangles)
        for (let y = 0; y < this.size - 1; y++) {
            for (let x = 0; x < this.size - 1; x++) {
                const a = y * this.size + x;
                const b = y * this.size + x + 1;
                const c = (y + 1) * this.size + x;
                const d = (y + 1) * this.size + x + 1;

                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

        // Create material
        this.material = new THREE.MeshPhongMaterial({
            color: 0x8B7355,
            vertexColors: true,
            shininess: 30,
        });

        // Create mesh
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        this.geometry = geometry;
    }

    modifyTerrain(x, y, radius, intensity, operation = 'raise') {
        // Store history for undo
        if (this.modificationHistory.length >= this.maxHistoryLength) {
            this.modificationHistory.shift();
        }
        this.modificationHistory.push({
            x, y, radius, intensity, operation,
            timestamp: Date.now(),
            previousHeights: new Float32Array(this.heightmap),
        });

        const affectedIndices = [];

        for (let i = 0; i < this.size * this.size; i++) {
            const gx = i % this.size;
            const gy = Math.floor(i / this.size);
            const dist = Math.sqrt((gx - x) ** 2 + (gy - y) ** 2);

            if (dist <= radius) {
                // Smooth falloff
                const falloff = Math.max(0, 1 - dist / radius);
                const power = falloff * falloff;

                let newHeight = this.heightmap[i];

                switch (operation) {
                    case 'raise':
                        newHeight += intensity * power;
                        break;
                    case 'lower':
                        newHeight -= intensity * power;
                        break;
                    case 'level':
                        newHeight = (newHeight + intensity * power * 10) / 2;
                        break;
                    case 'smooth':
                        // Average with neighbors
                        let sum = newHeight;
                        let count = 1;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const ni = (gy + dy) * this.size + (gx + dx);
                                if (ni >= 0 && ni < this.size * this.size) {
                                    sum += this.heightmap[ni];
                                    count++;
                                }
                            }
                        }
                        newHeight = sum / count;
                        break;
                }

                // Clamp height
                newHeight = Math.max(
                    CONFIG.HEIGHTMAP.MIN_ELEVATION,
                    Math.min(CONFIG.HEIGHTMAP.MAX_ELEVATION, newHeight)
                );

                this.heightmap[i] = newHeight;
                affectedIndices.push(i);
            }
        }

        // Update mesh
        this.updateMesh(affectedIndices);
    }

    updateMesh(affectedIndices = null) {
        if (!this.geometry) return;

        const posAttribute = this.geometry.getAttribute('position');
        const normAttribute = this.geometry.getAttribute('normal');

        if (!affectedIndices) {
            // Update all
            affectedIndices = [];
            for (let i = 0; i < this.size * this.size; i++) {
                affectedIndices.push(i);
            }
        }

        // Update positions and normals for affected vertices
        for (const i of affectedIndices) {
            const x = i % this.size;
            const y = Math.floor(i / this.size);
            const height = this.heightmap[i];

            posAttribute.setXYZ(i, x, height, y);

            const normal = this.generator.getNormal(this.heightmap, this.size, x, y);
            normAttribute.setXYZ(i, normal.x, normal.y, normal.z);
        }

        posAttribute.needsUpdate = true;
        normAttribute.needsUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    addWaterSource(x, y, radius) {
        for (let i = 0; i < this.size * this.size; i++) {
            const gx = i % this.size;
            const gy = Math.floor(i / this.size);
            const dist = Math.sqrt((gx - x) ** 2 + (gy - y) ** 2);

            if (dist <= radius) {
                const falloff = Math.max(0, 1 - dist / radius);
                this.waterVolume[i] += falloff * 5;
            }
        }
    }

    getHeightAt(x, y) {
        return this.generator.getHeight(this.heightmap, this.size, x, y);
    }

    getSlopeAt(x, y) {
        return this.generator.getSlope(this.heightmap, this.size, x, y);
    }

    getNormalAt(x, y) {
        return this.generator.getNormal(this.heightmap, this.size, x, y);
    }

    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material) this.material.dispose();
        if (this.mesh) this.scene.remove(this.mesh);
    }
}
