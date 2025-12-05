// Environment Objects System - Trees, rocks, and grass
class EnvironmentObjects {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.trees = [];
        this.rocks = [];
        this.grassPatches = [];
        this.spawnCount = 0;
    }

    spawn() {
        // Spawn trees
        this.spawnTrees();
        // Spawn rocks
        this.spawnRocks();
        // Spawn grass patches
        this.spawnGrass();
    }

    spawnTrees() {
        const treeCount = Math.floor(this.terrain.size * this.terrain.size / 800);
        
        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * (this.terrain.size - 10) + 5;
            const z = Math.random() * (this.terrain.size - 10) + 5;
            const height = this.terrain.getHeightAt(x, z);
            const slope = this.terrain.getSlopeAt(x, z);

            // Only spawn on gentle slopes with reasonable elevation
            if (slope < 0.25 && height > 20 && height < 300) {
                const tree = new Tree(this.scene, x, height, z);
                this.trees.push(tree);
            }
        }

        console.log(`Spawned ${this.trees.length} trees`);
    }

    spawnRocks() {
        const rockCount = Math.floor(this.terrain.size * this.terrain.size / 400);

        for (let i = 0; i < rockCount; i++) {
            const x = Math.random() * (this.terrain.size - 10) + 5;
            const z = Math.random() * (this.terrain.size - 10) + 5;
            const height = this.terrain.getHeightAt(x, z);

            // Rocks can spawn on more slopes
            if (height > -50 && height < 450) {
                const scale = 0.5 + Math.random() * 2;
                const rock = new Rock(this.scene, x, height, z, scale);
                this.rocks.push(rock);
            }
        }

        console.log(`Spawned ${this.rocks.length} rocks`);
    }

    spawnGrass() {
        const patchCount = Math.floor(this.terrain.size * this.terrain.size / 2000);

        for (let i = 0; i < patchCount; i++) {
            const x = Math.random() * (this.terrain.size - 10) + 5;
            const z = Math.random() * (this.terrain.size - 10) + 5;
            const height = this.terrain.getHeightAt(x, z);
            const slope = this.terrain.getSlopeAt(x, z);

            // Grass on gentle slopes with reasonable elevation
            if (slope < 0.25 && height > 10 && height < 150) {
                const grassPatch = new GrassPatch(this.scene, x, height, z);
                this.grassPatches.push(grassPatch);
            }
        }

        console.log(`Spawned ${this.grassPatches.length} grass patches`);
    }

    update(deltaTime) {
        // Update all objects
        for (const tree of this.trees) {
            tree.update(deltaTime);
        }
        for (const rock of this.rocks) {
            rock.update(deltaTime);
        }
        for (const grass of this.grassPatches) {
            grass.update(deltaTime);
        }
    }

    dispose() {
        for (const tree of this.trees) tree.dispose();
        for (const rock of this.rocks) rock.dispose();
        for (const grass of this.grassPatches) grass.dispose();
    }
}

// Tree Class
class Tree {
    constructor(scene, x, y, z) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y + 5, z);
        this.rooted = true;
        this.burning = false;
        this.burnTime = 0;

        this.createMesh();
    }

    createMesh() {
        // Create simple tree
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        this.trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        this.trunk.position.copy(this.position);
        this.trunk.castShadow = true;
        this.trunk.receiveShadow = true;
        this.scene.add(this.trunk);

        const foliageGeometry = new THREE.ConeGeometry(4, 10, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        this.foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        this.foliage.position.set(this.position.x, this.position.y + 8, this.position.z);
        this.foliage.castShadow = true;
        this.foliage.receiveShadow = true;
        this.scene.add(this.foliage);
    }

    update(deltaTime) {
        if (this.burning) {
            this.burnTime -= deltaTime;
            if (this.burnTime <= 0) {
                this.dispose();
            } else {
                // Change color to darker as it burns
                const burnPercent = 1 - (this.burnTime / 20);
                this.foliage.material.color.setHSL(0.1, 0.5, Math.max(0.1, 0.5 - burnPercent));
            }
        }
    }

    burn() {
        this.burning = true;
        this.burnTime = 20;
    }

    dispose() {
        this.scene.remove(this.trunk);
        this.scene.remove(this.foliage);
        this.trunk.geometry.dispose();
        this.trunk.material.dispose();
        this.foliage.geometry.dispose();
        this.foliage.material.dispose();
    }
}

// Rock Class
class Rock {
    constructor(scene, x, y, z, scale = 1) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y + scale, z);
        this.scale = scale;

        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.IcosahedronGeometry(this.scale, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Rocks don't move (for now)
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

// Grass Patch Class
class GrassPatch {
    constructor(scene, x, y, z) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y, z);
        this.time = 0;

        this.createMesh();
    }

    createMesh() {
        // Create grass blades using instanced geometry
        const blade = new THREE.PlaneGeometry(0.1, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00AA00,
            side: THREE.DoubleSide,
        });

        const instancedGeometry = new THREE.InstancedBufferGeometry();
        instancedGeometry.copy(blade);

        const count = 10;
        const rotations = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            rotations[i] = (i / count) * Math.PI * 2;
        }

        instancedGeometry.setAttribute('rotation', new THREE.InstancedBufferAttribute(rotations, 1));

        this.mesh = new THREE.Mesh(instancedGeometry, material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Sway in wind
        this.time += deltaTime;
        const sway = Math.sin(this.time * 2) * 0.1;
        this.mesh.rotation.z = sway;
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
