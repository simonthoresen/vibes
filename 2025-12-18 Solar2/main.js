import * as THREE from 'three';
import { Player } from './Player.js';
import { CameraController } from './CameraController.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 0, 100);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x4a7c2e,
    side: THREE.DoubleSide 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Add a grid helper
const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x666666);
scene.add(gridHelper);

// Add some obstacles for reference
function createObstacle(x, z, width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

createObstacle(5, 5, 2, 3, 2, 0xff0000);
createObstacle(-5, -5, 1.5, 4, 1.5, 0x0000ff);
createObstacle(8, -8, 3, 2, 3, 0xffff00);
createObstacle(-8, 8, 2, 5, 2, 0xff00ff);

// Create player
const player = new Player(scene);

// Create camera controller
const cameraController = new CameraController(camera, player, renderer.domElement);

// Input handling
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
};

document.addEventListener('keydown', (event) => {
    // Tab key to switch camera mode
    if (event.code === 'Tab') {
        event.preventDefault();
        cameraController.switchMode();
        return;
    }
    
    // Update key states
    switch(event.code) {
        case 'KeyW':
            keys.forward = true;
            break;
        case 'KeyS':
            keys.backward = true;
            break;
        case 'KeyA':
            keys.left = true;
            break;
        case 'KeyD':
            keys.right = true;
            break;
        case 'Space':
            event.preventDefault();
            keys.jump = true;
            break;
    }
    
    // Pass to player (only if not in free roam mode)
    if (cameraController.getMode() !== 'freeRoam') {
        player.handleKeyDown(event);
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW':
            keys.forward = false;
            break;
        case 'KeyS':
            keys.backward = false;
            break;
        case 'KeyA':
            keys.left = false;
            break;
        case 'KeyD':
            keys.right = false;
            break;
        case 'Space':
            keys.jump = false;
            break;
    }
    
    // Pass to player
    player.handleKeyUp(event);
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update player (only if not in free roam mode)
    if (cameraController.getMode() !== 'freeRoam') {
        player.update(deltaTime);
    }
    
    // Update camera
    cameraController.update(deltaTime, keys);
    
    // Render
    renderer.render(scene, camera);
}

animate();
