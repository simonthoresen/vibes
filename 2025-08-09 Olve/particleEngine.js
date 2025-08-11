export class ParticleEngine {
    constructor() {
        this.particles = [];
    }

    update(deltaTime) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Apply deceleration for pop effect
            if (particle.deceleration) {
                particle.vx *= particle.deceleration;
                particle.vy *= particle.deceleration;
            }
            
            // Update position
            particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
            particle.y += particle.vy * (deltaTime / 16);
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * (deltaTime / 16);
            
            // Update lifetime
            particle.life -= deltaTime;
            
            // Calculate alpha based on remaining life with sharper fade
            const lifeRatio = particle.life / particle.maxLife;
            particle.alpha = Math.max(0, lifeRatio * lifeRatio); // Quadratic fade for sharper pop
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        this.particles.forEach(particle => {
            ctx.save();
            
            // Move to particle position
            ctx.translate(particle.x, particle.y);
            
            // Rotate the particle
            ctx.rotate(particle.rotation);
            
            // Set alpha for fading effect
            ctx.globalAlpha = particle.alpha;
            
            // Set color
            ctx.fillStyle = particle.color;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1;
            
            // Draw circle
            this.drawCircle(ctx, particle.size);
            
            ctx.restore();
        });
        
        ctx.restore();
    }

    drawCircle(ctx, size) {
        const radius = size / 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    createExplosion(x, y, options = {}) {
        const {
            particleCount = 15,
            colors = ['#ff4444', '#ff8844', '#ffaa44', '#ffcc44'],
            minSize = 2,
            maxSize = 6,
            minSpeed = 3,
            maxSpeed = 8,
            minLife = 200,
            maxLife = 400,
            minRotationSpeed = 0.02,
            maxRotationSpeed = 0.08
        } = options;

        for (let i = 0; i < particleCount; i++) {
            // Random angle for explosion direction
            const angle = Math.random() * Math.PI * 2;
            
            // Random speed
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            
            // Calculate velocity components with quick deceleration
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Random particle properties
            const particle = {
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                size: minSize + Math.random() * (maxSize - minSize),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: minRotationSpeed + Math.random() * (maxRotationSpeed - minRotationSpeed),
                life: minLife + Math.random() * (maxLife - minLife),
                maxLife: 0, // Will be set below
                alpha: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                deceleration: 0.92 // Add deceleration for pop effect
            };
            
            particle.maxLife = particle.life;
            this.particles.push(particle);
        }
    }

    createPlayerDamageEffect(x, y) {
        this.createExplosion(x, y, {
            particleCount: 8,
            colors: ['#ff0000', '#ff3333', '#ff6666', '#ff9999'],
            minSize: 3,
            maxSize: 8,
            minSpeed: 4,
            maxSpeed: 10,
            minLife: 150,
            maxLife: 300
        });
    }

    createEnemyDeathEffect(x, y, enemyColor = '#00ff00') {
        // Create variations of the enemy color for the particle effect
        const baseColor = enemyColor;
        const lighterColor = this.lightenColor(baseColor, 40);
        const darkerColor = this.darkenColor(baseColor, 20);
        
        this.createExplosion(x, y, {
            particleCount: 12,
            colors: [baseColor, lighterColor, darkerColor, '#ffffff'],
            minSize: 2,
            maxSize: 5,
            minSpeed: 5,
            maxSpeed: 12,
            minLife: 200,
            maxLife: 350
        });
    }

    createEnemyHitEffect(x, y, enemyColor = '#ffff00') {
        // Create variations of the enemy color for the hit effect
        const baseColor = enemyColor;
        const lighterColor = this.lightenColor(baseColor, 30);
        
        this.createExplosion(x, y, {
            particleCount: 4,
            colors: [baseColor, lighterColor],
            minSize: 1,
            maxSize: 3,
            minSpeed: 3,
            maxSpeed: 7,
            minLife: 100,
            maxLife: 200
        });
    }

    createBossHitEffect(x, y, enemyColor = '#ff0000') {
        // Create a more dramatic effect for boss hits
        const baseColor = enemyColor;
        const lighterColor = this.lightenColor(baseColor, 40);
        const darkerColor = this.darkenColor(baseColor, 30);
        
        this.createExplosion(x, y, {
            particleCount: 8,
            colors: [baseColor, lighterColor, darkerColor, '#ffffff'],
            minSize: 2,
            maxSize: 5,
            minSpeed: 5,
            maxSpeed: 12,
            minLife: 150,
            maxLife: 300
        });
    }

    clear() {
        this.particles = [];
    }

    getParticleCount() {
        return this.particles.length;
    }

    // Helper methods for color manipulation
    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const newR = Math.max(0, Math.floor(r * (100 - percent) / 100));
        const newG = Math.max(0, Math.floor(g * (100 - percent) / 100));
        const newB = Math.max(0, Math.floor(b * (100 - percent) / 100));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}
