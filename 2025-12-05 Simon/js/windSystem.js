// Wind System - Dynamic wind with direction and strength variation
class WindSystem {
    constructor() {
        this.windDirection = new THREE.Vector3(1, 0, 0);
        this.windSpeed = CONFIG.WIND.BASE_SPEED;
        this.targetDirection = new THREE.Vector3(1, 0, 0);
        this.targetSpeed = CONFIG.WIND.BASE_SPEED;
        this.time = 0;
        this.changeInterval = 10; // Change wind every 10 seconds
        this.strength = this.windSpeed; // Alias for compatibility
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Change wind target periodically
        if (this.time > this.changeInterval) {
            this.time = 0;
            this.changeWind();
        }

        // Smoothly lerp to target direction and speed
        this.windDirection.lerp(this.targetDirection, deltaTime * 0.3);
        this.windSpeed += (this.targetSpeed - this.windSpeed) * deltaTime * 0.3;
        this.strength = this.windSpeed;
    }

    changeWind() {
        // Random new wind direction
        const angle = Math.random() * Math.PI * 2;
        this.targetDirection.set(Math.cos(angle), 0, Math.sin(angle));
        
        // Random wind speed (0.1 to 1.0)
        this.targetSpeed = 0.1 + Math.random() * 0.9;
    }

    getWind() {
        return this.windDirection.clone().multiplyScalar(this.windSpeed);
    }

    getDirection() {
        return this.windDirection.clone();
    }

    getStrength() {
        return this.windSpeed;
    }
}
