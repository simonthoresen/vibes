// Weather System - Dynamic weather state machine
class WeatherSystem {
    constructor() {
        this.currentWeather = 'sunny';
        this.time = 0;
        this.stateDuration = 30; // Duration of each weather state in seconds
        this.rainIntensity = 0;
        this.cloudDensity = 0;
        this.windIntensity = 0;

        this.stateTransitions = {
            sunny: { next: 'cloudy', chance: 0.3 },
            cloudy: { next: ['rainy', 'sunny'], chance: [0.5, 0.5] },
            rainy: { next: ['stormy', 'cloudy'], chance: [0.3, 0.7] },
            stormy: { next: 'rainy', chance: 1.0 },
        };
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Update weather state
        if (this.time > this.stateDuration) {
            this.time = 0;
            this.changeWeather();
        }

        // Update weather parameters based on state
        this.updateWeatherEffects();
    }

    changeWeather() {
        const transitions = this.stateTransitions[this.currentWeather];
        
        if (Array.isArray(transitions.next)) {
            // Multiple possible next states
            const rand = Math.random();
            let cumulative = 0;
            for (let i = 0; i < transitions.next.length; i++) {
                cumulative += transitions.chance[i];
                if (rand < cumulative) {
                    this.currentWeather = transitions.next[i];
                    break;
                }
            }
        } else {
            // Single next state
            this.currentWeather = transitions.next;
        }

        console.log(`Weather changed to: ${this.currentWeather}`);
    }

    updateWeatherEffects() {
        switch (this.currentWeather) {
            case 'sunny':
                this.rainIntensity = Math.max(0, this.rainIntensity - 0.02);
                this.cloudDensity = Math.max(0, this.cloudDensity - 0.03);
                this.windIntensity = Math.max(0.2, this.windIntensity - 0.02);
                break;
            case 'cloudy':
                this.rainIntensity = Math.max(0, this.rainIntensity - 0.01);
                this.cloudDensity = Math.min(0.6, this.cloudDensity + 0.02);
                this.windIntensity = Math.min(0.5, this.windIntensity + 0.01);
                break;
            case 'rainy':
                this.rainIntensity = Math.min(0.7, this.rainIntensity + 0.05);
                this.cloudDensity = Math.min(1.0, this.cloudDensity + 0.03);
                this.windIntensity = Math.min(0.8, this.windIntensity + 0.02);
                break;
            case 'stormy':
                this.rainIntensity = Math.min(1.0, this.rainIntensity + 0.03);
                this.cloudDensity = 1.0;
                this.windIntensity = Math.min(1.0, this.windIntensity + 0.05);
                break;
        }
    }

    getWeather() {
        return this.currentWeather;
    }

    getRainIntensity() {
        return this.rainIntensity;
    }

    getCloudDensity() {
        return this.cloudDensity;
    }

    getWindIntensity() {
        return this.windIntensity;
    }

    dispose() {
        // Cleanup
    }
}
