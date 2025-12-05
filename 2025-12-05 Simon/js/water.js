// Water System - Liquid simulation with physics-based flow
class WaterSystem {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.waterMesh = null;
        this.waterGeometry = null;
        this.waterMaterial = null;
        this.waterVolume = terrain.waterVolume;
        this.flowRate = CONFIG.WATER.FLOW_RATE;
        this.evaporationRate = CONFIG.WATER.EVAPORATION_RATE;
        
        this.createWaterMesh();
    }

    createWaterMesh() {
        // Create water surface mesh
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        for (let y = 0; y < this.terrain.size; y++) {
            for (let x = 0; x < this.terrain.size; x++) {
                const height = this.terrain.heightmap[y * this.terrain.size + x] + 
                               this.waterVolume[y * this.terrain.size + x];
                positions.push(x, height, y);
            }
        }

        for (let y = 0; y < this.terrain.size - 1; y++) {
            for (let x = 0; x < this.terrain.size - 1; x++) {
                const a = y * this.terrain.size + x;
                const b = y * this.terrain.size + x + 1;
                const c = (y + 1) * this.terrain.size + x;
                const d = (y + 1) * this.terrain.size + x + 1;

                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

        this.waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.6,
            wireframe: false,
        });

        this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
        this.waterGeometry = geometry;
        this.scene.add(this.waterMesh);
    }

    update(deltaTime) {
        // Simulate water flow
        this.simulateFlow();
        this.updateMesh();
    }

    simulateFlow() {
        const newVolume = new Float32Array(this.waterVolume);

        for (let y = 1; y < this.terrain.size - 1; y++) {
            for (let x = 1; x < this.terrain.size - 1; x++) {
                const idx = y * this.terrain.size + x;
                const currentHeight = this.terrain.heightmap[idx] + this.waterVolume[idx];

                // Check neighbors
                const neighbors = [
                    { x: x - 1, y: y, dx: -1, dy: 0 },
                    { x: x + 1, y: y, dx: 1, dy: 0 },
                    { x: x, y: y - 1, dx: 0, dy: -1 },
                    { x: x, y: y + 1, dx: 0, dy: 1 },
                ];

                let flow = 0;
                for (const neighbor of neighbors) {
                    const nidx = neighbor.y * this.terrain.size + neighbor.x;
                    const neighborHeight = this.terrain.heightmap[nidx] + this.waterVolume[nidx];

                    if (neighborHeight < currentHeight) {
                        const diff = (currentHeight - neighborHeight) * this.flowRate;
                        flow += diff;
                    }
                }

                newVolume[idx] -= flow;
                newVolume[idx] = Math.max(0, newVolume[idx] * (1 - this.evaporationRate));
            }
        }

        this.waterVolume = newVolume;
        this.terrain.waterVolume = newVolume;
    }

    updateMesh() {
        const posAttribute = this.waterGeometry.getAttribute('position');
        const positions = posAttribute.array;

        for (let y = 0; y < this.terrain.size; y++) {
            for (let x = 0; x < this.terrain.size; x++) {
                const idx = y * this.terrain.size + x;
                const height = this.terrain.heightmap[idx] + this.waterVolume[idx];
                const posIdx = idx * 3;

                positions[posIdx + 1] = height;
            }
        }

        posAttribute.needsUpdate = true;
    }

    dispose() {
        if (this.waterGeometry) this.waterGeometry.dispose();
        if (this.waterMaterial) this.waterMaterial.dispose();
        if (this.waterMesh) this.scene.remove(this.waterMesh);
    }
}
