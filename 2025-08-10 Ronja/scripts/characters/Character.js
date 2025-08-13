class Character {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.imageUrl = data.imageUrl;
        this.triggerWarning = data.triggerWarning;
        this.worldConfig = data.worldConfig;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.sprite = new Image();
        this.sprite.src = this.imageUrl;
    }

    update(input) {
        // Update character position based on input
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a')) {
            this.velocity.x = -Config.PLAYER_SPEED;
        }
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('d')) {
            this.velocity.x = Config.PLAYER_SPEED;
        }
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('w')) {
            this.velocity.y = -Config.PLAYER_SPEED;
        }
        if (input.isKeyDown('ArrowDown') || input.isKeyDown('s')) {
            this.velocity.y = Config.PLAYER_SPEED;
        }

        // Apply velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    draw(ctx, camera) {
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;

        ctx.drawImage(
            this.sprite,
            screenX - this.sprite.width / 2,
            screenY - this.sprite.height / 2
        );
    }

    getWorldBounds() {
        return {
            left: -this.worldConfig.width / 2,
            right: this.worldConfig.width / 2,
            top: -this.worldConfig.height / 2,
            bottom: this.worldConfig.height / 2
        };
    }
}
