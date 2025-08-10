export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPlayer(player) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        // Draw player with current skin color and invulnerability effect
        this.ctx.fillStyle = player.invulnerable ?
            (Math.floor(Date.now() / 100) % 2 === 0 ? '#ffffff' : player.skin.color) :
            player.skin.color;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, player.width / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw player health bar
        this.drawHealthBar(player.x, player.y - 15, player.width * 1.5, 6, player.health, player.maxHealth);
    }

    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            // Draw enemy with hit effect
            this.ctx.fillStyle = enemy.hitTime && Date.now() - enemy.hitTime < 100 ? 
                '#ff0000' : enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Draw enemy health bar
            this.drawHealthBar(enemy.x, enemy.y - 10, enemy.width, 5, enemy.health, enemy.maxHealth);
        });
    }

    drawProjectiles(projectiles) {
        projectiles.forEach(proj => {
            this.ctx.fillStyle = proj.color;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawWeapons(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        // Group weapons by their ID for stacking effects
        const weaponGroups = this.groupWeaponsByType(player.weapons);

        Object.values(weaponGroups).forEach(weapons => {
            this.drawWeaponGroup(weapons, playerCenterX, playerCenterY, player);
        });
    }

    groupWeaponsByType(weapons) {
        const weaponGroups = {};
        weapons.forEach(weapon => {
            if (!weaponGroups[weapon.id]) {
                weaponGroups[weapon.id] = [];
            }
            weaponGroups[weapon.id].push(weapon);
        });
        return weaponGroups;
    }

    drawWeaponGroup(weapons, playerCenterX, playerCenterY, player) {
        const weapon = weapons[0];
        const count = weapons.length;

        switch (weapon.type) {
            case 'melee':
                this.drawMeleeWeapon(weapon, count, playerCenterX, playerCenterY, player);
                break;
            case 'spinning':
                this.drawSpinningWeapon(weapon, count, playerCenterX, playerCenterY);
                break;
            case 'ranged':
                // Ranged weapons don't have a visual representation when not firing
                break;
        }
    }

    drawMeleeWeapon(weapon, count, playerCenterX, playerCenterY, player) {
        const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
        const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
        
        this.ctx.beginPath();
        this.ctx.arc(
            playerCenterX,
            playerCenterY,
            scaledRange,
            player.rotation - scaledArcSize / 2,
            player.rotation + scaledArcSize / 2
        );
        this.ctx.lineTo(playerCenterX, playerCenterY);
        this.ctx.closePath();

        this.ctx.fillStyle = `${weapon.color}33`;
        this.ctx.fill();
        this.ctx.strokeStyle = weapon.color;
        this.ctx.stroke();

        // Add attack effect
        if (Date.now() - (player.lastAttacks[weapon.id] || 0) < 100) {
            this.ctx.fillStyle = `${weapon.color}66`;
            this.ctx.fill();
        }
    }

    drawSpinningWeapon(weapon, count, playerCenterX, playerCenterY) {
        for (let i = 0; i < count; i++) {
            const phaseOffset = (i * 2 * Math.PI) / count;
            const angle = Date.now() * Math.PI * 2 / 1000 + phaseOffset;
            const scytheX = playerCenterX + Math.cos(angle) * weapon.orbitRadius;
            const scytheY = playerCenterY + Math.sin(angle) * weapon.orbitRadius;

            this.ctx.beginPath();
            this.ctx.arc(scytheX, scytheY, weapon.range, 0, Math.PI * 2);
            this.ctx.fillStyle = weapon.color;
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = weapon.color;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = weapon.color;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }

    drawHealthBar(x, y, width, height, currentHealth, maxHealth) {
        // Background (red)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(x, y, width, height);
        
        // Health (green)
        this.ctx.fillStyle = '#00ff00';
        const healthPercent = currentHealth / maxHealth;
        this.ctx.fillRect(x, y, width * healthPercent, height);
    }

    drawOpenWorldBackground() {
        // Draw grass background
        this.ctx.fillStyle = '#458B00';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBuildings(buildings) {
        buildings.forEach(building => {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Draw door
            this.ctx.fillStyle = '#4A2800';
            this.ctx.fillRect(building.door.x, building.door.y, building.door.width, building.door.height);

            // Show weapon indicator if present
            if (building.interior.weapon) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(building.door.x + 15, building.door.y - 10, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawNightOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 40, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawText(text, x, y, options = {}) {
        const {
            font = '20px Arial',
            color = 'white',
            align = 'left',
            baseline = 'top'
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    drawParticles(particleEngine) {
        if (particleEngine && particleEngine.render) {
            particleEngine.render(this.ctx);
        }
    }
}
