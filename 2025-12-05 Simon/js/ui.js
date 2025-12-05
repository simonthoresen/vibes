// UI System
class UISystem {
    constructor(game) {
        this.game = game;
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
    }

    update(deltaTime) {
        // Update FPS counter
        this.frameCount++;
        this.lastFpsUpdate += deltaTime;

        if (this.lastFpsUpdate >= 1) {
            document.getElementById('fps').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
        }

        // Update player count
        document.getElementById('playerCount').textContent = 
            1 + (this.game.networking.players.size || 0);

        // Update latency (mock for now)
        document.getElementById('latency').textContent = 
            Math.round(Math.random() * 50);
    }

    showLoadingScreen(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingScreen').classList.remove('hidden');
    }

    updateLoadingProgress(percent) {
        document.getElementById('loadingProgress').style.width = (percent * 100) + '%';
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    showMessage(text, type = 'info') {
        const chatMessages = document.getElementById('chatMessages');
        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => msg.remove(), 5000);
    }
}
