class Transitions {
    static async fadeToBlack(duration = 1000) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: black;
            opacity: 0;
            transition: opacity ${duration}ms ease;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Force reflow to ensure transition works
        overlay.offsetHeight;
        overlay.style.opacity = '1';

        return new Promise(resolve => {
            setTimeout(() => {
                resolve(overlay);
            }, duration);
        });
    }

    static async fadeFromBlack(overlay, duration = 1000) {
        overlay.style.opacity = '0';
        
        return new Promise(resolve => {
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                resolve();
            }, duration);
        });
    }
}
