import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

export class Planet {
    constructor(radius = 100, resolution = 64) {
        this.radius = radius;
        this.resolution = resolution;
        this.mesh = null;
        this.noise3D = createNoise3D();

        this.init();
    }

    init() {
        // 1. Create base geometry (Indexed)
        let geometry = new THREE.IcosahedronGeometry(this.radius, this.resolution);

        // 2. Apply displacement (Heightmap) while indexed
        // This ensures shared vertices move together, keeping the mesh connected
        this.displaceVertices(geometry);

        // 3. Convert to non-indexed geometry (only if needed)
        // This splits vertices so each triangle has its own unique 3 vertices
        // Essential for flat coloring where we want hard edges between colors
        if (geometry.index !== null) {
            geometry = geometry.toNonIndexed();
        }

        // 4. Optimization: Compute normals now so lighting is correct for flat faces
        geometry.computeVertexNormals();

        // 5. Apply Colors per Face
        this.applyFaceColors(geometry);

        // Material
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            wireframe: false,
            flatShading: true // Enhances the low-poly look
        });

        this.mesh = new THREE.Mesh(geometry, material);
    }

    displaceVertices(geometry) {
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);

            const normal = vertex.clone().normalize();

            // Calculate noise
            const noiseScale = 2.0;
            const noiseValue = this.noise3D(normal.x * noiseScale, normal.y * noiseScale, normal.z * noiseScale);

            // Elevation logic
            // noiseValue is -1 to 1
            // (noiseValue + 1) * 0.5 is 0 to 1
            const elevation = 20 * (noiseValue + 1) * 0.5;

            const newRadius = this.radius + elevation;
            vertex.copy(normal).multiplyScalar(newRadius);

            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        positionAttribute.needsUpdate = true;
    }

    applyFaceColors(geometry) {
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const colors = [];
        const color = new THREE.Color();

        // Iterate over faces (groups of 3 vertices)
        for (let i = 0; i < positionAttribute.count; i += 3) {
            // Calculate average height of the face
            let avgRadius = 0;
            for (let j = 0; j < 3; j++) {
                vertex.fromBufferAttribute(positionAttribute, i + j);
                avgRadius += vertex.length();
            }
            avgRadius /= 3;

            // Re-normalize height to 0-1 range for coloring logic
            // We know: radius = baseRadius + elevation
            // elevation = radius - baseRadius
            // normalizedHeight = elevation / 20
            const elevation = avgRadius - this.radius;
            const normalizedHeight = Math.max(0, Math.min(1, elevation / 20));

            // Discrete Coloring Logic
            if (normalizedHeight < 0.2) {
                color.setHex(0xFFFF00); // Yellow
            } else if (normalizedHeight < 0.5) {
                color.setHex(0x00FF00); // Green
            } else if (normalizedHeight < 0.8) {
                color.setHex(0x8B4513); // Brown
            } else {
                color.setHex(0xFFFFFF); // White
            }

            // Push same color for all 3 vertices of the face
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    getMesh() {
        return this.mesh;
    }

    update(deltaTime) {
        // Rotate slowly around Z axis
        if (this.mesh) {
            this.mesh.rotation.z += deltaTime * 0.05; // Adjust 0.05 to control rotation speed
            this.mesh.rotation.x += deltaTime * 0.025; // Half the speed of z-axis rotation
        }
    }
}
