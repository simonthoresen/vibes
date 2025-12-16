import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Planet } from './Planet.js';
import { Sun } from './Sun.js';
import { Water } from './Water.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 0, 250); // Start further out to see the planet (radius 100)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Sun (Directional Light + Mesh)
const sun = new Sun(scene, 6000, 0.5); // Moved much further away (beyond water polygon)

// Planet
const planet = new Planet(100, 50); // Radius 100, resolution detail 50
scene.add(planet.getMesh());

// Water
const water = new Water();
scene.add(water.getMesh());

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update sun position
    const currentTime = Date.now() * 0.001; // Convert to seconds
    sun.update(currentTime);
    water.update(currentTime);
    planet.update(0.016); // ~60fps delta time

    // Update background color based on sun position (day/night cycle)
    const sunHeight = sun.getSunHeight(); // -1 to 1

    // Define colors for different times of day
    const nightColor = new THREE.Color(0x0a0a1a); // Dark blue/black
    const sunriseColor = new THREE.Color(0xff6b35); // Orange/pink
    const dayColor = new THREE.Color(0x87ceeb); // Sky blue

    // Calculate color based on sun height
    if (sunHeight > 0.5) {
        // High noon - full day
        scene.background.copy(dayColor);
    } else if (sunHeight > 0) {
        // Morning - transition from sunrise to day
        scene.background.lerpColors(sunriseColor, dayColor, sunHeight / 0.5);
    } else if (sunHeight > -0.2) {
        // Sunset/sunrise - transition from day to sunrise colors
        scene.background.lerpColors(nightColor, sunriseColor, (sunHeight + 0.2) / 0.2);
    } else {
        // Night
        scene.background.copy(nightColor);
    }

    controls.update();

    // Prevent camera from going below water level
    if (camera.position.y < 51) {
        camera.position.y = 51;
    }

    renderer.render(scene, camera);
}

animate();

// Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
