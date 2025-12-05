// Lighting System - Dynamic sun/moon lighting for day/night cycle
class LightingSystem {
    constructor(scene, timeSystem) {
        this.scene = scene;
        this.timeSystem = timeSystem;
        
        // Create sun light
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 50, 100);
        this.sunLight.shadow.mapSize.width = CONFIG.RENDERING.SHADOW_MAP_SIZE;
        this.sunLight.shadow.mapSize.height = CONFIG.RENDERING.SHADOW_MAP_SIZE;
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);

        // Create moon light
        this.moonLight = new THREE.DirectionalLight(0x4040ff, 0.3);
        this.moonLight.position.set(-100, 30, -100);
        this.moonLight.castShadow = true;
        this.scene.add(this.moonLight);

        // Ambient light for baseline
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);
    }

    update(deltaTime) {
        if (!this.timeSystem) return;

        const hours = this.timeSystem.hours;
        const timeOfDay = (hours % 24) / 24; // 0-1, normalized

        // Sun position follows time
        const sunAngle = (timeOfDay - 0.5) * Math.PI; // -PI/2 to PI/2
        const sunHeight = Math.sin(sunAngle) * 100;
        const sunDistance = Math.cos(sunAngle) * 150;

        this.sunLight.position.set(sunDistance, Math.max(10, sunHeight), 50);

        // Sun brightness varies with height
        const sunBrightness = Math.max(0, Math.sin(sunAngle)) * 1.5;
        this.sunLight.intensity = sunBrightness;

        // Moon is opposite to sun
        const moonAngle = sunAngle + Math.PI;
        const moonHeight = Math.sin(moonAngle) * 100;
        const moonDistance = Math.cos(moonAngle) * 150;

        this.moonLight.position.set(moonDistance, Math.max(10, moonHeight), 50);
        this.moonLight.intensity = Math.max(0, Math.sin(moonAngle)) * 0.5;

        // Ambient light increases at night for visibility
        const nightAmbient = Math.max(0, -Math.sin(sunAngle)) * 0.3;
        this.ambientLight.intensity = 0.3 + nightAmbient;

        // Adjust sun color for time of day
        if (timeOfDay < 0.25) {
            // Night to dawn - blue to orange
            const t = timeOfDay / 0.25;
            const color = new THREE.Color().setHSL(0.6, 0.5, 0.5).lerp(new THREE.Color(1, 0.5, 0), t);
            this.sunLight.color = color;
        } else if (timeOfDay < 0.5) {
            // Dawn to noon - orange to white
            const t = (timeOfDay - 0.25) / 0.25;
            const color = new THREE.Color(1, 0.5, 0).lerp(new THREE.Color(1, 1, 1), t);
            this.sunLight.color = color;
        } else if (timeOfDay < 0.75) {
            // Noon to dusk - white to orange
            const t = (timeOfDay - 0.5) / 0.25;
            const color = new THREE.Color(1, 1, 1).lerp(new THREE.Color(1, 0.5, 0), t);
            this.sunLight.color = color;
        } else {
            // Dusk to night - orange to blue
            const t = (timeOfDay - 0.75) / 0.25;
            const color = new THREE.Color(1, 0.5, 0).lerp(new THREE.Color(0.2, 0.2, 0.8), t);
            this.sunLight.color = color;
        }
    }

    dispose() {
        // Lights will be removed when scene is disposed
    }
}
