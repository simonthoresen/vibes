// Grass System - Wind-animated grass rendering
class GrassSystem {
    constructor(scene, terrain, windSystem) {
        this.scene = scene;
        this.terrain = terrain;
        this.windSystem = windSystem;
        this.grassMesh = null;
        this.bladeCount = 0;
        this.time = 0;
    }

    generate() {
        // Create grass blade geometry
        const bladeGeometry = new THREE.PlaneGeometry(0.15, 1);
        
        // Create instanced buffer geometry
        const instancedGeometry = new THREE.InstancedBufferGeometry();
        instancedGeometry.copy(bladeGeometry);

        // Calculate blade positions
        const density = 0.3; // Blades per unit
        const size = this.terrain.size;
        const bladeCount = Math.floor(size * size * density);
        this.bladeCount = bladeCount;

        const positions = new Float32Array(bladeCount * 3);
        const rotations = new Float32Array(bladeCount);
        const scales = new Float32Array(bladeCount);

        let idx = 0;
        for (let i = 0; i < bladeCount; i++) {
            // Random position on terrain
            const x = Math.random() * size;
            const z = Math.random() * size;
            const y = this.terrain.getHeightAt(x, z);
            
            positions[idx * 3] = x;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = z;
            
            rotations[i] = Math.random() * Math.PI * 2;
            scales[i] = 0.8 + Math.random() * 0.4;
            
            idx++;
        }

        instancedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        instancedGeometry.setAttribute('rotation', new THREE.InstancedBufferAttribute(rotations, 1));
        instancedGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1));

        // Create custom shader material for wind animation
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                windDirection: { value: new THREE.Vector2(1, 0) },
                windStrength: { value: 1 },
            },
            vertexShader: `
                attribute float rotation;
                attribute float scale;
                
                uniform float time;
                uniform vec2 windDirection;
                uniform float windStrength;
                
                varying vec3 vPos;
                
                void main() {
                    vec3 pos = position;
                    
                    // Apply scale
                    pos.y *= scale;
                    pos.x *= scale;
                    
                    // Apply wind animation
                    float windWave = sin(time + position.z * 0.1 + position.x * 0.1) * windStrength;
                    pos.x += windWave * 0.3;
                    pos.y += sin(time * 2.0 + position.z * 0.2) * 0.2 * windStrength;
                    
                    // Apply rotation
                    float c = cos(rotation);
                    float s = sin(rotation);
                    float x = pos.x * c - pos.z * s;
                    float z = pos.x * s + pos.z * c;
                    pos.x = x;
                    pos.z = z;
                    
                    // Add instance position
                    pos += instanceMatrix[3].xyz;
                    
                    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
                    vPos = pos;
                }
            `,
            fragmentShader: `
                varying vec3 vPos;
                
                void main() {
                    gl_FragColor = vec4(0.2, 0.6, 0.2, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });

        this.grassMesh = new THREE.Mesh(instancedGeometry, material);
        this.scene.add(this.grassMesh);
    }

    update(deltaTime) {
        if (!this.grassMesh) return;

        this.time += deltaTime;
        this.grassMesh.material.uniforms.time.value = this.time;
        
        if (this.windSystem) {
            const windDir = this.windSystem.getDirection();
            this.grassMesh.material.uniforms.windDirection.value.set(windDir.x, windDir.z);
            this.grassMesh.material.uniforms.windStrength.value = this.windSystem.strength;
        }
    }

    dispose() {
        if (this.grassMesh) {
            this.scene.remove(this.grassMesh);
            this.grassMesh.geometry.dispose();
            this.grassMesh.material.dispose();
        }
    }
}
