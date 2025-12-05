// Player Character System
class Player {
    constructor(scene, terrain, id = 'local', position = null) {
        this.scene = scene;
        this.terrain = terrain;
        this.id = id;
        this.name = 'Player';
        
        // Physics
        this.position = position || new THREE.Vector3(terrain.size / 2, 0, terrain.size / 2);
        this.position.y = terrain.getHeightAt(this.position.x, this.position.z) + CONFIG.PLAYER.SPRITE_HEIGHT;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, -1);
        this.isOnGround = false;
        this.canJump = true;
        
        // Movement
        this.moveVector = new THREE.Vector3(0, 0, 0);
        this.moveDirection = new THREE.Vector3(0, 0, 0);
        
        // Sprite
        this.createSprite();
        
        // Update position
        this.updatePosition();
    }

    createSprite() {
        // Create a simple flat sprite for the player
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw simple wizard silhouette
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.arc(32, 20, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.lineTo(32, 50);
        ctx.lineTo(25, 60);
        ctx.lineTo(32, 50);
        ctx.lineTo(39, 60);
        ctx.lineWidth = 4;
        ctx.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
        });
        
        const geometry = new THREE.PlaneGeometry(
            CONFIG.PLAYER.SPRITE_WIDTH,
            CONFIG.PLAYER.SPRITE_HEIGHT
        );
        
        this.sprite = new THREE.Mesh(geometry, material);
        this.sprite.castShadow = true;
        this.scene.add(this.sprite);
    }

    update(input, deltaTime) {
        if (this.id !== 'local') return; // Only update local player

        // Get movement input
        const moveX = (inputManager.isKeyPressed(inputManager.keybinds.moveRight) ? 1 : 0) -
                      (inputManager.isKeyPressed(inputManager.keybinds.moveLeft) ? 1 : 0);
        const moveZ = (inputManager.isKeyPressed(inputManager.keybinds.moveForward) ? 1 : 0) -
                      (inputManager.isKeyPressed(inputManager.keybinds.moveBack) ? 1 : 0);

        this.moveVector.set(moveX, 0, moveZ).normalize();

        // Handle jumping
        const shouldJump = inputManager.isKeyPressed(inputManager.keybinds.jump);
        if (shouldJump && this.isOnGround && this.canJump) {
            this.velocity.y = CONFIG.PLAYER.JUMP_POWER;
            this.isOnGround = false;
            this.canJump = false;
        }
        if (!shouldJump) {
            this.canJump = true;
        }

        // Apply gravity
        this.velocity.y -= CONFIG.PLAYER.GRAVITY * deltaTime;

        // Apply movement
        if (this.moveVector.length() > 0) {
            this.moveDirection.lerp(this.moveVector, CONFIG.PLAYER.ACCELERATION);
        } else {
            this.moveDirection.multiplyScalar(0.9);
        }

        this.position.x += this.moveDirection.x * CONFIG.PLAYER.MOVE_SPEED * deltaTime;
        this.position.z += this.moveDirection.z * CONFIG.PLAYER.MOVE_SPEED * deltaTime;

        // Ground collision
        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        const groundLevel = terrainHeight + CONFIG.PLAYER.SPRITE_HEIGHT;

        if (this.position.y < groundLevel) {
            this.position.y = groundLevel;
            this.velocity.y = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // Apply vertical velocity
        this.position.y += this.velocity.y * deltaTime;

        // Clamp horizontal position to world bounds
        this.position.x = Math.max(0, Math.min(this.terrain.size - 1, this.position.x));
        this.position.z = Math.max(0, Math.min(this.terrain.size - 1, this.position.z));

        this.updatePosition();
    }

    updatePosition() {
        this.sprite.position.copy(this.position);
        
        // Face camera (billboard)
        this.sprite.lookAt(
            this.sprite.position.x,
            this.sprite.position.y,
            this.sprite.position.z + 1
        );
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.updatePosition();
    }

    getPosition() {
        return this.position.clone();
    }

    dispose() {
        if (this.sprite) {
            this.scene.remove(this.sprite);
            this.sprite.geometry.dispose();
            this.sprite.material.dispose();
        }
    }
}
