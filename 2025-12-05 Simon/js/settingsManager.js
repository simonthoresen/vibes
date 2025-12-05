// Settings Manager - Persists game settings
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            graphics: 'high',
            masterVolume: 1.0,
            effectsVolume: 0.8,
            musicVolume: 0.6,
            resolution: 'auto',
            fullscreen: true,
            mouseSensitivity: 1.0,
            islandSize: 128,
            maxPlayers: 8,
            difficulty: 'normal',
            dayNightSpeed: 1.0,
            weatherFrequency: 1.0,
        };
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    getSetting(key) {
        return this.settings[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    getGraphicsQuality() {
        return this.settings.graphics;
    }

    setGraphicsQuality(level) {
        this.settings.graphics = level;
        this.saveSettings();
        
        // Apply quality settings
        if (CONFIG.PARTICLES.QUALITY_LEVELS[level]) {
            Object.assign(CONFIG.PARTICLES, CONFIG.PARTICLES.QUALITY_LEVELS[level]);
        }
    }
}

const settingsManager = new SettingsManager();
