import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.init();
    }

    init() {
        this.createGround();
        this.createEnvironment();
    }

    createGround() {
        // Create large ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a8c3a,
            roughness: 0.8,
            metalness: 0.2
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add some variation to the ground
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = Math.random() * 0.3;
            positions.setY(i, y);
        }
        positions.needsUpdate = true;
        groundGeometry.computeVertexNormals();

        // Add grid helper for spatial reference
        const gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x444444);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    createEnvironment() {
        // Add some random obstacles/objects
        const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
        const obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });

        // Create scattered obstacles
        for (let i = 0; i < 20; i++) {
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(
                (Math.random() - 0.5) * 180,
                1,
                (Math.random() - 0.5) * 180
            );
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
        }

        // Add some trees (simple cylinders with spheres)
        for (let i = 0; i < 15; i++) {
            this.createTree(
                (Math.random() - 0.5) * 180,
                (Math.random() - 0.5) * 180
            );
        }
    }

    createTree(x, z) {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.scene.add(trunk);

        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 5, z);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        this.scene.add(foliage);
    }
}
