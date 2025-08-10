import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class ProjectileSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    update() {
        this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
            // Move projectile
            proj.x += proj.dx;
            proj.y += proj.dy;

            // Check enemy collisions
            this.checkEnemyCollisions(proj);

            // Remove if out of bounds
            return this.isInBounds(proj);
        });
    }

    checkEnemyCollisions(projectile) {
        this.gameState.enemies.forEach(enemy => {
            if (!projectile.hitEnemies.has(enemy)) {
                const dx = enemy.x + enemy.width / 2 - projectile.x;
                const dy = enemy.y + enemy.height / 2 - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= enemy.width / 2 + projectile.width / 2) {
                    this.hitEnemy(enemy, projectile);
                    
                    if (!projectile.piercing) {
                        // Mark projectile for removal
                        projectile.shouldRemove = true;
                    }
                }
            }
        });
    }

    hitEnemy(enemy, projectile) {
        enemy.health -= projectile.damage;
        enemy.hitTime = Date.now();
        projectile.hitEnemies.add(enemy);
    }

    isInBounds(projectile) {
        if (projectile.shouldRemove) return false;
        
        return projectile.x >= 0 && projectile.x <= CANVAS_WIDTH && 
               projectile.y >= 0 && projectile.y <= CANVAS_HEIGHT;
    }

    createProjectile(config) {
        const projectile = {
            x: config.x,
            y: config.y,
            dx: config.dx,
            dy: config.dy,
            width: config.width || 8,
            height: config.height || 8,
            damage: config.damage,
            color: config.color,
            piercing: config.piercing || false,
            hitEnemies: new Set()
        };

        this.gameState.projectiles.push(projectile);
        return projectile;
    }

    clear() {
        this.gameState.projectiles = [];
    }
}
