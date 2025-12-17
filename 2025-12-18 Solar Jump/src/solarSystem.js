import * as THREE from 'three';

export class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.celestialBodies = [];
        this.sun = null;
        
        this.createSun();
        this.createPlanets();
        this.createStarfield();
    }

    createToonMaterial(color, emissive = 0x000000, emissiveIntensity = 0) {
        return new THREE.MeshToonMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: emissiveIntensity,
            gradientMap: this.createGradientMap()
        });
    }

    createGradientMap() {
        const colors = new Uint8Array(3);
        colors[0] = 0;
        colors[1] = 128;
        colors[2] = 255;

        const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
        gradientMap.needsUpdate = true;
        return gradientMap;
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(8, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.position.set(0, 0, 0);
        this.scene.add(this.sun);

        // Add strong point light from sun
        const sunLight = new THREE.PointLight(0xffffcc, 3, 1000);
        sunLight.position.copy(this.sun.position);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        // Store reference to sun light for lensflare effects
        this.sunLight = sunLight;

        // Ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Directional light for toon shading (from sun direction)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(0, 50, 50);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    }

    createPlanets() {
        // Minimized distances for close encounters
        const planetData = [
            { name: 'Mercury', radius: 1, color: 0x8c7853, distance: 15, speed: 0.04, mass: 0.055, moon: null },
            { name: 'Venus', radius: 1.5, color: 0xffc649, distance: 22, speed: 0.035, mass: 0.815, moon: null },
            { name: 'Earth', radius: 1.6, color: 0x4169e1, distance: 30, speed: 0.03, mass: 1, moon: { radius: 0.4, distance: 3, color: 0xaaaaaa, speed: 0.1 } },
            { name: 'Mars', radius: 1.2, color: 0xcd5c5c, distance: 38, speed: 0.024, mass: 0.107, moon: { radius: 0.3, distance: 2.5, color: 0x888888, speed: 0.12 } },
            { name: 'Jupiter', radius: 4, color: 0xdaa520, distance: 52, speed: 0.013, mass: 317.8, moon: { radius: 0.6, distance: 7, color: 0xccaa88, speed: 0.08 } },
            { name: 'Saturn', radius: 3.5, color: 0xf4a460, distance: 70, speed: 0.009, mass: 95.2, moon: { radius: 0.7, distance: 6, color: 0xddbb99, speed: 0.09 } },
            { name: 'Uranus', radius: 2.5, color: 0x4fd0e0, distance: 85, speed: 0.006, mass: 14.5, moon: { radius: 0.5, distance: 4, color: 0x99ccdd, speed: 0.1 } },
            { name: 'Neptune', radius: 2.4, color: 0x4169e1, distance: 100, speed: 0.005, mass: 17.1, moon: { radius: 0.5, distance: 4, color: 0x8899cc, speed: 0.11 } }
        ];

        planetData.forEach(data => {
            const planet = this.createPlanet(data);
            this.celestialBodies.push(planet);

            if (data.moon) {
                const moon = this.createMoon(data.moon, planet);
                this.celestialBodies.push(moon);
            }
        });
    }

    createPlanet(data) {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = this.createToonMaterial(data.color);
        const mesh = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        mesh.position.x = Math.cos(angle) * data.distance;
        mesh.position.z = Math.sin(angle) * data.distance;
        
        this.scene.add(mesh);

        // Add Saturn's rings
        if (data.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xd2b48c,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        }

        return {
            name: data.name,
            mesh: mesh,
            radius: data.radius,
            orbitDistance: data.distance,
            orbitSpeed: data.speed,
            mass: data.mass,
            angle: angle,
            type: 'planet'
        };
    }

    createMoon(moonData, planet) {
        const geometry = new THREE.SphereGeometry(moonData.radius, 16, 16);
        const material = this.createToonMaterial(moonData.color);
        const mesh = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        mesh.position.x = planet.mesh.position.x + Math.cos(angle) * moonData.distance;
        mesh.position.z = planet.mesh.position.z + Math.sin(angle) * moonData.distance;
        
        this.scene.add(mesh);

        return {
            name: planet.name + ' Moon',
            mesh: mesh,
            radius: moonData.radius,
            orbitDistance: moonData.distance,
            orbitSpeed: moonData.speed,
            mass: planet.mass * 0.01,
            angle: angle,
            type: 'moon',
            parent: planet
        };
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < 3000; i++) {
            const x = (Math.random() - 0.5) * 1000;
            const y = (Math.random() - 0.5) * 1000;
            const z = (Math.random() - 0.5) * 1000;
            vertices.push(x, y, z);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    update(deltaTime) {
        // Update planet positions
        this.celestialBodies.forEach(body => {
            if (body.type === 'planet') {
                body.angle += body.orbitSpeed * deltaTime;
                body.mesh.position.x = Math.cos(body.angle) * body.orbitDistance;
                body.mesh.position.z = Math.sin(body.angle) * body.orbitDistance;
                body.mesh.rotation.y += 0.01;
            } else if (body.type === 'moon' && body.parent) {
                body.angle += body.orbitSpeed * deltaTime;
                body.mesh.position.x = body.parent.mesh.position.x + Math.cos(body.angle) * body.orbitDistance;
                body.mesh.position.z = body.parent.mesh.position.z + Math.sin(body.angle) * body.orbitDistance;
                body.mesh.rotation.y += 0.02;
            }
        });

        // Rotate sun
        if (this.sun) {
            this.sun.rotation.y += 0.001;
        }
    }

    getCelestialBodies() {
        return this.celestialBodies;
    }

    getNearestBody(position) {
        let nearest = null;
        let minDistance = Infinity;

        this.celestialBodies.forEach(body => {
            const distance = position.distanceTo(body.mesh.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = body;
            }
        });

        return nearest;
    }

    getSunPosition() {
        return this.sun.position;
    }
}
