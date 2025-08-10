import { ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class EnemySystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    spawnFloorEnemies() {
        const isBossFloor = this.gameState.currentFloor % 5 === 0;
        
        if (isBossFloor) {
            this.spawnBoss();
        } else {
            this.spawnRegularEnemies();
        }
    }

    spawnBoss() {
        const boss = {
            ...ENEMY_TYPES.DRAGON,
            x: CANVAS_WIDTH / 2,
            y: -ENEMY_TYPES.DRAGON.height,
            maxHealth: ENEMY_TYPES.DRAGON.health * this.gameState.enemyHPMultiplier,
            health: ENEMY_TYPES.DRAGON.health * this.gameState.enemyHPMultiplier,
            isBoss: true
        };
        
        this.gameState.enemies.push(boss);
    }

    spawnRegularEnemies() {
        const baseEnemies = 3 + Math.floor(this.gameState.currentFloor / 2);
        
        for (let i = 0; i < baseEnemies; i++) {
            const enemy = this.createRegularEnemy();
            this.gameState.enemies.push(enemy);
        }
    }

    createRegularEnemy() {
        // More skeletons early game, more slimes later game
        const skeletonChance = Math.max(0.3, 0.8 - (this.gameState.currentFloor * 0.05));
        const enemyType = Math.random() < skeletonChance ? ENEMY_TYPES.SKELETON : ENEMY_TYPES.SLIME;
        
        const spawnPosition = this.getRandomSpawnPosition(enemyType);
        const scaledHealth = enemyType.health * this.gameState.enemyHPMultiplier;
        
        return {
            ...enemyType,
            x: spawnPosition.x,
            y: spawnPosition.y,
            health: scaledHealth,
            maxHealth: scaledHealth
        };
    }

    getRandomSpawnPosition(enemyType) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // top
                x = Math.random() * CANVAS_WIDTH;
                y = -enemyType.height;
                break;
            case 1: // right
                x = CANVAS_WIDTH + enemyType.width;
                y = Math.random() * CANVAS_HEIGHT;
                break;
            case 2: // bottom
                x = Math.random() * CANVAS_WIDTH;
                y = CANVAS_HEIGHT + enemyType.height;
                break;
            case 3: // left
                x = -enemyType.width;
                y = Math.random() * CANVAS_HEIGHT;
                break;
        }

        return { x, y };
    }

    update() {
        this.gameState.enemies.forEach(enemy => {
            this.updateEnemyMovement(enemy);
        });

        // Check for player collisions with enemies
        this.checkPlayerCollisions();

        // Remove dead enemies and check for floor completion
        const aliveEnemies = this.gameState.enemies.filter(enemy => enemy.health > 0);
        const hadEnemies = this.gameState.enemies.length > 0;
        
        this.gameState.enemies = aliveEnemies;
        
        if (hadEnemies && this.gameState.enemies.length === 0) {
            this.gameState.floorCleared = true;
        }

        // Check for boss defeat and weapon reward
        if (hadEnemies && this.gameState.enemies.length === 0) {
            const wasLastEnemyBoss = this.gameState.enemies.some(enemy => enemy.isBoss);
            if (wasLastEnemyBoss) {
                this.handleBossDefeat();
            }
        }
    }

    updateEnemyMovement(enemy) {
        const prevX = enemy.x;
        const prevY = enemy.y;

        // Calculate distances both directly and through screen wrapping
        let dx = this.gameState.player.x - enemy.x;
        let dy = this.gameState.player.y - enemy.y;
        
        // Check if wrapping around horizontally would be shorter
        if (Math.abs(dx) > CANVAS_WIDTH / 2) {
            dx = dx > 0 ? -(CANVAS_WIDTH - Math.abs(dx)) : CANVAS_WIDTH - Math.abs(dx);
        }
        
        // Check if wrapping around vertically would be shorter
        if (Math.abs(dy) > CANVAS_HEIGHT / 2) {
            dy = dy > 0 ? -(CANVAS_HEIGHT - Math.abs(dy)) : CANVAS_HEIGHT - Math.abs(dy);
        }
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Move enemy and handle screen wrapping
            const timeScale = this.gameState.timeScale || 1;
            enemy.x += (dx / dist) * enemy.speed * timeScale;
            enemy.y += (dy / dist) * enemy.speed * timeScale;
            
            // Wrap around screen edges
            this.wrapEnemyPosition(enemy);
        }

        // Store movement for prediction
        enemy.dx = enemy.x - prevX;
        enemy.dy = enemy.y - prevY;
    }

    wrapEnemyPosition(enemy) {
        if (enemy.x < 0) enemy.x = CANVAS_WIDTH;
        if (enemy.x > CANVAS_WIDTH) enemy.x = 0;
        if (enemy.y < 0) enemy.y = CANVAS_HEIGHT;
        if (enemy.y > CANVAS_HEIGHT) enemy.y = 0;
    }

    handleBossDefeat() {
        // Double enemy HP after boss fight
        this.gameState.enemyHPMultiplier *= 2;
        
        // Trigger weapon selection
        this.dispatchEvent('boss-defeated');
    }

    checkPlayerCollisions() {
        if (this.gameState.player.invulnerable || this.gameState.isPaused) {
            return;
        }

        this.gameState.enemies.forEach(enemy => {
            if (this.detectCollision(this.gameState.player, enemy)) {
                this.damagePlayer(enemy.damage);
            }
        });
    }

    detectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    damagePlayer(damage) {
        console.log(`Player taking ${damage} damage, current health: ${this.gameState.player.health}`);
        this.gameState.player.health = Math.max(0, this.gameState.player.health - damage);
        this.gameState.player.invulnerable = true;
        this.gameState.player.lastHit = Date.now();
        
        console.log(`Player health after damage: ${this.gameState.player.health}`);
        
        // Update health display
        const healthElement = document.getElementById('health');
        if (healthElement) {
            healthElement.textContent = 
                `HP: ${Math.round(this.gameState.player.health)}/${this.gameState.player.maxHealth}`;
        }
        
        // Check for game over
        if (this.gameState.player.health <= 0 && !this.gameState.deathSequence) {
            console.log('Player health is 0, triggering game over');
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        console.log('triggerGameOver called in EnemySystem');
        this.gameState.deathSequence = true;
        this.gameState.deathTime = Date.now();
        this.gameState.timeScale = 1;
        
        console.log('Dispatching game-over event');
        this.dispatchEvent('game-over');
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}
