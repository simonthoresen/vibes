import * as THREE from 'three';

export class Sun {
    constructor(scene, distance = 400, speed = 0.5) {
        this.scene = scene;
        this.distance = distance;
        this.speed = speed;

        this.mesh = null;
        this.light = null;

        this.init();
    }

    init() {
        // Visual Mesh
        const geometry = new THREE.SphereGeometry(100, 32, 32); // Larger to be visible at greater distance
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            depthTest: true,
            depthWrite: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = -1; // Render behind other objects
        this.scene.add(this.mesh);

        // Light
        this.light = new THREE.DirectionalLight(0xffffff, 2.0); // Stronger intensity
        // Align light position exactly with mesh
        this.light.position.copy(this.mesh.position);

        // Improve shadow quality if we were using shadows (optional but good practice)
        this.light.castShadow = true;

        this.scene.add(this.light);
    }

    update(time) {
        // Rotate around Z axis (or Y axis depending on desire, user said Z axis)
        // User request: "rotate around the sphere's z axis"
        // Typically this means orbiting in the X-Y plane if Z is "up" relative to the orbit, 
        // OR orbiting in X-Y plane if the planet's Z axis is the pole.
        // Let's assume standard upright orbit for now: orbiting in X-Z plane around Y axis is standard "day/night".
        // BUT user specifically said "rotate around the sphere's z axis". 
        // In Three.js, Y is usually up. If planet Z is the axis, it means orbiting in X-Y plane.
        // Let's stick to user request: Orbit around Z. x = cos, y = sin.

        const x = Math.cos(time * this.speed) * this.distance;
        const y = Math.sin(time * this.speed) * this.distance;
        const z = 0;

        this.mesh.position.set(x, y, z);
        this.light.position.copy(this.mesh.position);
    }

    // Get normalized sun height (-1 to 1, where 1 is top, -1 is bottom)
    getSunHeight() {
        return this.mesh.position.y / this.distance;
    }
}
