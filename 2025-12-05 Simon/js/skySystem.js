// Sky System - Dynamic sky colors with day/night cycle
class SkySystem {
    constructor(scene, timeSystem) {
        this.scene = scene;
        this.timeSystem = timeSystem;
        this.skyMesh = null;
        this.skyMaterial = null;

        this.createSkyDome();
    }

    createSkyDome() {
        // Create large sphere for sky
        const geometry = new THREE.SphereGeometry(400, 32, 32);
        
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                sunPosition: { value: new THREE.Vector3(0, 50, 100) },
                timeOfDay: { value: 0.5 }, // 0-1, where 0.5 is noon
            },
            vertexShader: `
                varying vec3 vViewDirection;
                
                void main() {
                    vViewDirection = normalize(position);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 sunPosition;
                uniform float timeOfDay;
                varying vec3 vViewDirection;
                
                void main() {
                    // Sky color based on time of day
                    vec3 dayColor = vec3(0.5, 0.7, 1.0);    // Blue sky
                    vec3 sunsetColor = vec3(1.0, 0.6, 0.2); // Orange/red
                    vec3 nightColor = vec3(0.05, 0.05, 0.15); // Dark blue
                    
                    vec3 skyColor;
                    
                    if (timeOfDay < 0.25) {
                        // Night to dawn
                        float t = timeOfDay / 0.25;
                        skyColor = mix(nightColor, sunsetColor, t);
                    } else if (timeOfDay < 0.5) {
                        // Dawn to noon
                        float t = (timeOfDay - 0.25) / 0.25;
                        skyColor = mix(sunsetColor, dayColor, t);
                    } else if (timeOfDay < 0.75) {
                        // Noon to dusk
                        float t = (timeOfDay - 0.5) / 0.25;
                        skyColor = mix(dayColor, sunsetColor, t);
                    } else {
                        // Dusk to night
                        float t = (timeOfDay - 0.75) / 0.25;
                        skyColor = mix(sunsetColor, nightColor, t);
                    }
                    
                    gl_FragColor = vec4(skyColor, 1.0);
                }
            `,
            side: THREE.BackSide,
        });

        this.skyMesh = new THREE.Mesh(geometry, this.skyMaterial);
        this.scene.add(this.skyMesh);
    }

    update(deltaTime) {
        if (!this.skyMesh || !this.timeSystem) return;

        // Get time of day (0-1, normalized)
        const hours = this.timeSystem.hours;
        const timeOfDay = (hours % 24) / 24;

        this.skyMaterial.uniforms.timeOfDay.value = timeOfDay;

        // Update sun position
        const sunAngle = (timeOfDay - 0.5) * Math.PI; // -PI/2 to PI/2 (night to night)
        const sunHeight = Math.sin(sunAngle) * 100;
        const sunDistance = Math.cos(sunAngle) * 150;

        this.skyMaterial.uniforms.sunPosition.value.set(sunDistance, sunHeight, 0);
    }

    dispose() {
        if (this.skyMesh) {
            this.scene.remove(this.skyMesh);
            this.skyMesh.geometry.dispose();
            this.skyMesh.material.dispose();
        }
    }
}
