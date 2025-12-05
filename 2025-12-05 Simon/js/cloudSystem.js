// Cloud System - Dynamic procedural cloud rendering
class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.cloudMesh = null;
        this.cloudTexture = null;
        this.altitude = 80; // Height of clouds
    }

    generate() {
        // Create cloud geometry (billboards)
        const cloudCount = 15;
        const geometry = new THREE.BufferGeometry();

        const positions = [];
        const indices = [];
        const sizes = [];

        for (let i = 0; i < cloudCount; i++) {
            const x = Math.random() * 256 - 128;
            const z = Math.random() * 256 - 128;
            const scale = 10 + Math.random() * 20;

            // Billboard vertices
            const idx = i * 4;
            positions.push(x - scale, this.altitude, z - scale);
            positions.push(x + scale, this.altitude, z - scale);
            positions.push(x + scale, this.altitude, z + scale);
            positions.push(x - scale, this.altitude, z + scale);

            indices.push(idx, idx + 1, idx + 2);
            indices.push(idx, idx + 2, idx + 3);

            sizes.push(scale, scale, scale, scale);

            this.clouds.push({
                x: x,
                z: z,
                speed: 5 + Math.random() * 15,
                direction: Math.random() * Math.PI * 2,
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

        // Create cloud material
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
        });

        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cloudMesh);
    }

    update(deltaTime, wind, weather) {
        if (!this.cloudMesh) return;

        // Update cloud positions based on wind
        const windStrength = wind.getStrength ? wind.getStrength() : 0.5;
        const windDir = wind.getDirection ? wind.getDirection() : new THREE.Vector3(1, 0, 0);

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            cloud.x += windDir.x * windStrength * 5 * deltaTime;
            cloud.z += windDir.z * windStrength * 5 * deltaTime;

            // Wrap around world
            if (cloud.x > 150) cloud.x = -150;
            if (cloud.x < -150) cloud.x = 150;
            if (cloud.z > 150) cloud.z = -150;
            if (cloud.z < -150) cloud.z = 150;
        }

        // Update cloud opacity based on weather
        if (weather && this.cloudMesh.material.opacity !== weather.getCloudDensity()) {
            this.cloudMesh.material.opacity = weather.getCloudDensity() * 0.8;
        }
    }

    dispose() {
        if (this.cloudMesh) {
            this.scene.remove(this.cloudMesh);
            this.cloudMesh.geometry.dispose();
            this.cloudMesh.material.dispose();
        }
    }
}
