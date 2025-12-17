import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;
        
        // Create player cube
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1, 0);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.position = this.mesh.position;
        this.rotation = 0; // Y-axis rotation in radians
        
        // Movement properties
        this.speed = 5;
        this.jumpForce = 8;
        this.gravity = -20;
        this.isOnGround = true;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
        }
    }
    
    update(deltaTime) {
        // Calculate movement direction based on player rotation
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.forward) moveDirection.z -= 1;
        if (this.keys.backward) moveDirection.z += 1;
        if (this.keys.left) moveDirection.x -= 1;
        if (this.keys.right) moveDirection.x += 1;
        
        // Normalize diagonal movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Rotate movement direction based on player rotation
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        
        // Apply movement
        this.velocity.x = moveDirection.x * this.speed;
        this.velocity.z = moveDirection.z * this.speed;
        
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Jump
        if (this.keys.jump && this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
        }
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Ground collision (simple)
        if (this.position.y <= 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
        
        // Update mesh rotation
        this.mesh.rotation.y = this.rotation;
    }
    
    setRotation(rotation) {
        this.rotation = rotation;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getRotation() {
        return this.rotation;
    }
}
