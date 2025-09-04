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
            
            // Apply gravity if present
            if (particle.gravity) {
                particle.vy += particle.gravity * (deltaTime / 16);
            }
            
            // Update position
            particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
            particle.y += particle.vy * (deltaTime / 16);
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * (deltaTime / 16);
            
            // Update healing orb pulsing effect
            if (particle.isHealingOrb) {
                particle.pulsePhase += particle.pulseSpeed * (deltaTime / 16);
                // Scale pulsing based on life remaining for smooth fade
                const lifeRatio = particle.life / particle.maxLife;
                particle.currentPulse = Math.sin(particle.pulsePhase) * 0.3 * lifeRatio;
            }
            
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
        
        // Update lightning bolts
        if (this.lightningBolts) {
            for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                const bolt = this.lightningBolts[i];
                const age = Date.now() - bolt.createdAt;
                
                if (age >= bolt.life) {
                    this.lightningBolts.splice(i, 1);
                } else {
                    // Fade out lightning bolt
                    bolt.alpha = Math.max(0, 1 - (age / bolt.life));
                }
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
            
            // Draw ice cube as square, healing orb with pulse, or regular circle
            if (particle.isIceCube) {
                this.drawIceCube(ctx, particle.size);
            } else if (particle.isHealingOrb) {
                this.drawHealingOrb(ctx, particle.size, particle.currentPulse || 0);
            } else {
                this.drawCircle(ctx, particle.size);
            }
            
            ctx.restore();
        });
        
        // Render lightning bolts
        if (this.lightningBolts) {
            this.lightningBolts.forEach(bolt => {
                ctx.save();
                ctx.globalAlpha = bolt.alpha;
                ctx.strokeStyle = bolt.color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Add glow effect
                ctx.shadowColor = bolt.color;
                ctx.shadowBlur = 8;
                
                // Draw the main lightning bolt
                ctx.beginPath();
                bolt.segments.forEach((segment, index) => {
                    if (index === 0) {
                        ctx.moveTo(segment.x, segment.y);
                    } else {
                        ctx.lineTo(segment.x, segment.y);
                    }
                });
                ctx.stroke();
                
                // Draw a thinner inner bolt for more realism
                ctx.shadowBlur = 4;
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
                
                ctx.restore();
            });
        }
        
        ctx.restore();
    }

    drawCircle(ctx, size) {
        const radius = size / 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawIceCube(ctx, size) {
        const halfSize = size / 2;
        
        // Draw filled square
        ctx.fillRect(-halfSize, -halfSize, size, size);
        
        // Draw outline
        ctx.strokeRect(-halfSize, -halfSize, size, size);
        
        // Add inner highlight for ice effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-halfSize + 1, -halfSize + 1, size - 2, size - 2);
        ctx.restore();
    }

    drawHealingOrb(ctx, size, pulseEffect) {
        const baseRadius = size / 2;
        const radius = baseRadius + (baseRadius * pulseEffect); // Add pulsing effect
        
        // Draw outer glow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#90EE90'; // Light green glow
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw main orb
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bright center
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw subtle outline
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
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
            maxRotationSpeed = 0.08,
            gravity = 0 // Add gravity support
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
                deceleration: 0.92, // Add deceleration for pop effect
                gravity: gravity // Add gravity support
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

    createExplosionEffect(x, y, color) {
        this.createExplosion(x, y, {
            particleCount: 12,
            colors: [color, '#FF6600', '#FFFF00', '#FF0000'],
            minSize: 3,
            maxSize: 6,
            minSpeed: 8,
            maxSpeed: 15,
            minLife: 200,
            maxLife: 400
        });
    }

    createFrostEffect(x, y, color) {
        this.createExplosion(x, y, {
            particleCount: 8,
            colors: [color, '#FFFFFF', '#87CEEB', '#B0E0E6'],
            minSize: 2,
            maxSize: 4,
            minSpeed: 3,
            maxSpeed: 8,
            minLife: 300,
            maxLife: 600
        });
    }

    createLightningEffect(startX, startY, endX, endY, color) {
        // Create a natural-looking lightning bolt with jagged segments
        const lightning = {
            startX, startY, endX, endY, color,
            segments: this.generateLightningPath(startX, startY, endX, endY),
            life: 300, // Lightning flash duration
            createdAt: Date.now(),
            alpha: 1.0
        };
        
        // Store lightning bolts for rendering
        if (!this.lightningBolts) {
            this.lightningBolts = [];
        }
        this.lightningBolts.push(lightning);
        
        // Also create some particle sparks at key points
        lightning.segments.forEach((segment, index) => {
            if (index % 3 === 0) { // Every 3rd segment
                this.createExplosion(segment.x, segment.y, {
                    particleCount: 2,
                    colors: [color, '#FFFFFF', '#E6E6FA'],
                    minSize: 1,
                    maxSize: 2,
                    minSpeed: 3,
                    maxSpeed: 8,
                    minLife: 150,
                    maxLife: 400
                });
            }
        });
    }

    generateLightningPath(startX, startY, endX, endY) {
        const segments = [];
        const totalDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const segmentCount = Math.max(4, Math.floor(totalDistance / 15));
        
        segments.push({ x: startX, y: startY });
        
        for (let i = 1; i < segmentCount; i++) {
            const t = i / segmentCount;
            
            // Base position along the line
            const baseX = startX + (endX - startX) * t;
            const baseY = startY + (endY - startY) * t;
            
            // Add random perpendicular offset for lightning jaggedness
            const perpX = -(endY - startY) / totalDistance;
            const perpY = (endX - startX) / totalDistance;
            
            const maxOffset = Math.min(30, totalDistance * 0.2);
            const offset = (Math.random() - 0.5) * maxOffset;
            
            const x = baseX + perpX * offset;
            const y = baseY + perpY * offset;
            
            segments.push({ x, y });
        }
        
        segments.push({ x: endX, y: endY });
        return segments;
    }

    createHealingEffect(x, y, color) {
        this.createExplosion(x, y, {
            particleCount: 10,
            colors: [color, '#90EE90', '#FFFFFF', '#00FF7F'],
            minSize: 2,
            maxSize: 5,
            minSpeed: 4,
            maxSpeed: 10,
            minLife: 400,
            maxLife: 800
        });
    }

    createFireDotEffect(x, y, colors) {
        this.createExplosion(x, y, {
            particleCount: 6,
            colors: colors,
            minSize: 1,
            maxSize: 3,
            minSpeed: 2,
            maxSpeed: 6,
            minLife: 300,
            maxLife: 600,
            gravity: -0.1 // Make particles float upward like fire
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

    createIceCubeEffect(x, y, color) {
        // Create ice cube particles with special cube shape
        const cubeCount = 1 + Math.floor(Math.random() * 2); // 1-2 cubes per effect
        
        for (let i = 0; i < cubeCount; i++) {
            // Random angle for ice cube direction
            const angle = Math.random() * Math.PI * 2;
            
            // Random speed (slower than other particles)
            const speed = 1 + Math.random() * 3;
            
            // Calculate velocity
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Ice cube particle with special properties
            const iceCube = {
                x: x + (Math.random() - 0.5) * 4, // Small random offset
                y: y + (Math.random() - 0.5) * 4,
                vx: vx,
                vy: vy,
                size: 3 + Math.random() * 4, // 3-7 pixel cubes
                color: color,
                alpha: 0.7, // Semi-transparent
                life: 400 + Math.random() * 300, // 400-700ms life
                maxLife: 400 + Math.random() * 300,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05, // Slow rotation
                deceleration: 0.98, // Slow down over time
                gravity: 0.01, // Very light gravity
                isIceCube: true // Special flag for rendering
            };
            
            this.particles.push(iceCube);
        }
    }

    createHealingOrbEffect(x, y, color) {
        // Create healing orb particles with gentle floating behavior
        const orbCount = 1 + Math.floor(Math.random() * 2); // 1-2 orbs per effect
        
        for (let i = 0; i < orbCount; i++) {
            // Random angle for healing orb direction
            const angle = Math.random() * Math.PI * 2;
            
            // Gentle floating speed
            const speed = 0.5 + Math.random() * 2;
            
            // Calculate velocity
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 0.5; // Slight upward bias
            
            // Healing orb particle with special properties
            const healingOrb = {
                x: x + (Math.random() - 0.5) * 6, // Small random offset
                y: y + (Math.random() - 0.5) * 6,
                vx: vx,
                vy: vy,
                size: 4 + Math.random() * 3, // 4-7 pixel orbs
                color: color,
                alpha: 0.8, // Semi-transparent but more visible than ice
                life: 500 + Math.random() * 400, // 500-900ms life (longer than ice)
                maxLife: 500 + Math.random() * 400,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.03, // Gentle rotation
                deceleration: 0.99, // Very gradual slowdown
                gravity: -0.005, // Slight upward float (negative gravity)
                isHealingOrb: true, // Special flag for rendering
                pulsePhase: Math.random() * Math.PI * 2, // For pulsing effect
                pulseSpeed: 0.05 + Math.random() * 0.03 // Random pulse speed
            };
            
            this.particles.push(healingOrb);
        }
    }
}
