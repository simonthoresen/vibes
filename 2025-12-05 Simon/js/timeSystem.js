// Time System - Game time progression with day/night cycle
class TimeSystem {
    constructor() {
        this.gameTime = CONFIG.TIME.START_TIME; // In milliseconds
        this.hours = 12; // 0-24 hour format
        this.minutes = 0;
        this.seconds = 0;
        this.dayCount = 0;
        this.cycleStartTime = Date.now();
        this.timeScale = 1; // Multiplier for time progression (1 = real-time, 60 = 1 second = 1 game minute)
    }

    update(deltaTime) {
        // Advance game time (scaled)
        const scaledDelta = deltaTime * this.timeScale;
        this.seconds += scaledDelta;

        // Convert to hours/minutes
        if (this.seconds >= 60) {
            const minutesAdded = Math.floor(this.seconds / 60);
            this.minutes += minutesAdded;
            this.seconds %= 60;

            if (this.minutes >= 60) {
                const hoursAdded = Math.floor(this.minutes / 60);
                this.hours = (this.hours + hoursAdded) % 24;
                this.minutes %= 60;

                if (this.hours < hoursAdded) {
                    this.dayCount++;
                }
            }
        }

        this.gameTime = this.hours * 3600000 + this.minutes * 60000 + this.seconds * 1000;
    }

    getTimeOfDay() {
        return this.gameTime;
    }

    getHours() {
        return this.hours;
    }

    getMinutes() {
        return this.minutes;
    }

    getSeconds() {
        return Math.floor(this.seconds);
    }

    getFormattedTime() {
        const h = String(Math.floor(this.hours)).padStart(2, '0');
        const m = String(Math.floor(this.minutes)).padStart(2, '0');
        const s = String(Math.floor(this.seconds)).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    getTimeScale() {
        return this.timeScale;
    }
}
