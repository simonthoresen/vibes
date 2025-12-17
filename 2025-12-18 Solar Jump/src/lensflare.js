import * as THREE from 'three';

export class Lensflare {
    constructor(scene, sunPosition) {
        this.scene = scene;
        this.sunPosition = sunPosition;
        this.lensflareSprite = null;
        this.createLensflare();
        this.raycaster = new THREE.Raycaster();
        this.isVisible = false;
    }

    createLensflare() {
        // Create a simple lensflare sprite effect
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Draw lens flare pattern
        // Main glow circle
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
        this.lensflareSprite = new THREE.Sprite(material);
        this.lensflareSprite.scale.set(30, 30, 1);
        this.lensflareSprite.position.copy(this.sunPosition);
        this.scene.add(this.lensflareSprite);

        // Create additional lens flare artifacts
        this.createFlareArtifacts();
    }

    createFlareArtifacts() {
        this.artifacts = [];
        
        // Create smaller flares along a line from sun to screen center
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            // Create hexagon artifact
            const radius = (i + 1) * 15;
            ctx.fillStyle = `rgba(255, 200, 100, ${0.3 - i * 0.07})`;
            this.drawHexagon(ctx, 128, 128, radius);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
            const artifact = new THREE.Sprite(material);
            artifact.scale.set(radius * 0.4, radius * 0.4, 1);
            this.scene.add(artifact);
            
            this.artifacts.push({
                sprite: artifact,
                offset: 0.15 + i * 0.2,
                scale: radius
            });
        }
    }

    drawHexagon(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    update(camera, sunPosition) {
        this.sunPosition.copy(sunPosition);
        this.lensflareSprite.position.copy(sunPosition);

        // Get the THREE.Camera from the wrapper
        const threeCamera = camera.getCamera();

        // Check if sun is visible from camera
        this.isVisible = this.isSunVisible(threeCamera, sunPosition);

        if (this.isVisible && camera.mode === 'follow') {
            // Update main flare
            this.lensflareSprite.visible = true;

            // Update artifact positions between sun and screen center
            const screenCenter = new THREE.Vector3(0, 0, 0);
            const sunScreenPos = this.getScreenPosition(threeCamera, sunPosition);

            this.artifacts.forEach(artifact => {
                const flarePos = new THREE.Vector3().lerpVectors(
                    sunPosition,
                    screenCenter,
                    artifact.offset
                );
                
                // Account for camera view
                const offset = new THREE.Vector3().subVectors(flarePos, threeCamera.position);
                const dot = offset.dot(threeCamera.getWorldDirection(new THREE.Vector3()));
                
                if (dot > 0) {
                    artifact.sprite.position.copy(flarePos);
                    artifact.sprite.visible = true;
                    
                    // Fade based on sun brightness in view
                    const brightness = Math.max(0, 1 - Math.abs(artifact.offset - 0.5) * 2);
                    artifact.sprite.material.opacity = brightness * 0.6;
                } else {
                    artifact.sprite.visible = false;
                }
            });
        } else {
            this.lensflareSprite.visible = false;
            this.artifacts.forEach(a => a.sprite.visible = false);
        }
    }

    isSunVisible(threeCamera, sunPosition) {
        // Raycast from camera to sun to check if blocked
        const direction = new THREE.Vector3().subVectors(sunPosition, threeCamera.position);
        const distance = direction.length();
        
        if (distance < 0.1) return false; // Camera inside sun
        
        direction.normalize();
        const worldDir = threeCamera.getWorldDirection(new THREE.Vector3());
        const dot = direction.dot(worldDir);
        if (dot < 0.1) return false; // Sun too far to the side

        // For now, simple visibility - in a full implementation would raycast against planets
        return true;
    }

    getScreenPosition(threeCamera, position) {
        const vector = new THREE.Vector3().copy(position);
        vector.project(threeCamera);
        return vector;
    }

    destroy() {
        if (this.lensflareSprite) {
            this.scene.remove(this.lensflareSprite);
        }
        this.artifacts.forEach(a => this.scene.remove(a.sprite));
    }
}
