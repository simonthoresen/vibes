import * as THREE from 'three';
import { createToonMaterial } from './renderer/ToonMaterial.js';

class Game {
    constructor() {
        this.init();
        this.animate();
    }

    init() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Player (Placeholder)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = createToonMaterial(0xff4444);
        this.player = new THREE.Mesh(geometry, material);
        this.player.position.y = 0.5;
        this.player.castShadow = true;
        this.scene.add(this.player);

        // Input State
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        window.addEventListener('keyup', (e) => this.onKeyUp(e), false);

        // Window Resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = true;
        }
    }

    onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = false;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.player) {
            // Simple Movement
            const speed = 0.1;
            if (this.keys.ArrowUp) this.player.position.z -= speed;
            if (this.keys.ArrowDown) this.player.position.z += speed;
            if (this.keys.ArrowLeft) this.player.position.x -= speed;
            if (this.keys.ArrowRight) this.player.position.x += speed;

            // Rotate slightly while moving for effect
            if (this.keys.ArrowLeft) this.player.rotation.y += 0.05;
            if (this.keys.ArrowRight) this.player.rotation.y -= 0.05;

            // Camera Follow
            this.camera.position.x = this.player.position.x;
            this.camera.position.z = this.player.position.z + 10;
            this.camera.lookAt(this.player.position);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
