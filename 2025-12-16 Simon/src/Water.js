import * as THREE from 'three';

export class Water {
    constructor() {
        this.mesh = null;
        this.material = null;
        this.init();
    }

    init() {
        const geometry = new THREE.PlaneGeometry(10000, 10000);

        // Custom shader material for animated water
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(0x00aaff) },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 waterColor;
                uniform float opacity;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // Simple noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                // Fractal Brownian Motion for more natural noise
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    
                    for(int i = 0; i < 4; i++) {
                        value += amplitude * (noise(p * frequency) - 0.5);
                        frequency *= 2.0;
                        amplitude *= 0.5;
                    }
                    
                    return value;
                }
                
                void main() {
                    // Use world position for fixed texture coordinates
                    vec2 uv = vWorldPosition.xz * 0.005; // Use XZ plane for horizontal water
                    
                    // Multiple layers of noise moving at different speeds
                    float wave1 = fbm(uv + time * 0.05);
                    float wave2 = fbm(uv * 2.0 - time * 0.03);
                    float wave3 = fbm(uv * 3.0 + vec2(time * 0.04, -time * 0.02));
                    
                    // Combine waves with more pronounced effect
                    float pattern = (wave1 + wave2 * 0.7 + wave3 * 0.5) * 0.5;
                    
                    // Add much more brightness variation for visible texture
                    vec3 color = waterColor + vec3(pattern * 0.8);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: false, // Make it opaque for proper depth testing
            depthWrite: true,
            depthTest: true,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 50; // Raise water to cover more of the planet
        this.mesh.renderOrder = 1; // Render in front of sun

        // Add wireframe overlay
        const wireframeGeometry = new THREE.PlaneGeometry(10000, 10000);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.wireframe.rotation.x = -Math.PI / 2;
        this.wireframe.position.y = 50.1; // Slightly above water to avoid z-fighting
        this.wireframe.renderOrder = 2;
    }

    update(time) {
        if (this.material) {
            this.material.uniforms.time.value = time;
        }
    }

    getMesh() {
        const group = new THREE.Group();
        group.add(this.mesh);
        group.add(this.wireframe);
        return group;
    }
}
