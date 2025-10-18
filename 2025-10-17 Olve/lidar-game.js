// LiDAR Explorer Game - Main Script
// A first-person exploration game using point cloud visualization

class LiDARGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Player state
        this.player = {
            position: new THREE.Vector3(0, 2.0, 15), // Will be adjusted to tunnel center in init
            velocity: new THREE.Vector3(),
            rotation: { yaw: 0, pitch: 0 },
            moveSpeed: 8.0, // Faster movement for exploration
            lookSpeed: 0.002,
            height: 1.6,
            radius: 0.4 // Smaller collision radius for easier navigation
        };

        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        this.scanning = false;
        this.scanCooldown = 0;
        this.scanCooldownTime = 2.0; // 2 second cooldown
        this.hasLoggedPoints = false;
        
        // Collision tracking
        this.stuckCounter = 0;
        this.lastCollisionWarning = 0;
        this.spawnTime = 0; // Track when game started
        this.collisionGracePeriod = 2.0; // Disable collision for first 2 seconds

        // LiDAR points
        this.scanPoints = [];
        this.maxPoints = 50000; // Reduced from 100000 for better performance
        this.pointsGeometry = null;
        this.pointsMaterial = null;
        this.pointsCloud = null;

        // Environment
        this.environment = [];
        this.tables = []; // Interactive tables for dice games
        this.enemies = []; // Enemy entities shown as red dots
        this.wanderingEnemies = []; // Enemies that sneak up on player
        this.scanRange = 50; // Longer range to see down hallway
        this.scanResolution = 0.08; // Distance between points - much denser
        this.pointLifetime = 10.0; // How long points stay visible - 10 seconds
        this.fadeTime = 3.0; // Fade duration
        this.furthestGenerated = 200; // Track procedural generation - start with more generated
        this.earliestGenerated = -5; // Track backward generation

        // Flashlight and battery system
        this.battery = 10;
        this.maxBattery = 10;
        this.flashlightOn = false;
        this.flashlightRange = 15;
        this.flashlightCooldown = 0;
        this.flashlightCooldownTime = 1.0;
        this.isDead = false;

        // Dice game state
        this.currentTable = null;
        this.inDiceGame = false;
        this.playerDice = [];
        this.enemyDice = [];
        this.diceTypes = [4, 6, 8, 10, 12, 20]; // Available dice types
        this.nearbyTable = null;

        // Audio context
        this.audioCtx = null;
        this.sounds = {
            scan: null,
            ambient: null
        };
        
        // Enemy audio
        this.enemyWalkingSound = null;
        this.enemyRunningSound = null;
        this.aggressiveRunningSound = null; // Plays when battery hits 0
        this.enemyAudioElement = null;
        this.enemyAudioDetectionRange = 50; // Start hearing enemy from far away
        
        // Auto-scan for nearby enemies
        this.enemyAutoScanRange = 15;
        this.enemyAutoScanCooldown = 0;
        this.enemyAutoScanInterval = 0.5; // Scan every 0.5 seconds

        this.init();
    }

    init() {
        // Generate random seed for this playthrough
        this.randomSeed = Math.random() * 10000;
        this.seedState = this.randomSeed; // For seeded random generation
        console.log('Game seed:', this.randomSeed);
        
        this.setupThreeJS();
        this.createEnvironment();
        this.setupPointCloud();
        this.setupEventListeners();
        this.setupAudio();
        
        // Spawn initial wandering enemies
        this.spawnWanderingEnemy();
        
        // Player spawns at center of starting crossroad
        const spawnZ = 0;
        const spawnX = 0;
        const spawnY = 2;
        this.player.position.set(spawnX, spawnY, spawnZ);
        this.camera.position.copy(this.player.position);
        
        console.log('Game initialized. Environment objects:', this.environment.length);
        console.log('Player spawn: Z=' + spawnZ + ', X=' + spawnX.toFixed(2) + ', Y=' + spawnY.toFixed(2));
        console.log('✅ Free exploration mode - no collision');
        console.log('Battery:', this.battery + '/' + this.maxBattery);
        
        // Update UI
        this.updateBatteryUI();
        
        // Perform initial scan after a brief delay
        setTimeout(() => {
            console.log('Performing initial scan...');
            this.performScan();
        }, 1000);
        
        this.animate();
    }

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 20, 50);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.player.position);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        console.log('Three.js setup complete');

        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createEnvironment() {
        // Create invisible collision geometry that will be revealed by LiDAR
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide 
        });

        // Create a complex tunnel/room structure
        this.createTunnelSystem();
        this.createRooms();
        // Removed createObstacles() - tunnels are now clean
    }

    createTunnelSystem() {
        // Start with guaranteed crossroad at spawn (0, 2, 0)
        console.log('Creating starting crossroad at spawn point');
        this.addCrossroadRoom(0, 2, 0);
        
        // Add a table in the starting crossroad for testing
        this.addTable(3, 2, 2);
        
        // Generate initial tunnel sections in all directions from spawn
        // Forward (positive Z)
        this.generateTunnelSection(0, 50);
        
        // Backward (negative Z)
        this.generateTunnelSection(-50, 50);
        
        // Set generation boundaries
        this.furthestGenerated = 50;
        this.earliestGenerated = -50;
    }

    // Seeded random number generator for consistent random generation
    seededRandom() {
        this.seedState = (this.seedState * 9301 + 49297) % 233280;
        return this.seedState / 233280;
    }

    createRooms() {
        // Large cavern at the far end of the hallway
        const roomX = 0, roomZ = 120;
        this.addOrganicCavern(roomX, 5, roomZ, 20, 10);
        
        // Medium room halfway
        const room2X = 0, room2Z = 50;
        this.addOrganicCavern(room2X, 3, room2Z, 12, 7);
        
        // Small alcoves along the way
        const alcove1X = -8, alcove1Z = 10;
        this.addOrganicCavern(alcove1X, 2, alcove1Z, 6, 4);
        
        const alcove2X = 8, alcove2Z = 80;
        this.addOrganicCavern(alcove2X, 2, alcove2Z, 7, 5);
    }

    createObstacles() {
        // Start obstacles further ahead, past player start position
        this.addOrganicPillar(-3, 0, 35, 0.8, 4.5);
        this.addOrganicPillar(2, 0, 50, 1.0, 5.2);
        this.addOrganicPillar(-2.5, 0, 70, 0.9, 3.5);
        this.addOrganicPillar(2, 0, 95, 0.8, 3.2);
        
        // Fewer rock formations - only on sides
        this.addOrganicRock(-2.5, 0, 40, 1.0);
        this.addOrganicRock(3, 0, 60, 1.2);
        this.addOrganicRock(-2, 0, 80, 0.9);
        this.addOrganicRock(2.5, 0, 105, 1.1);
    }

    addWall(x1, y1, z1, x2, y2, z2) {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            x1, y1, z1,
            x2, y2, z2
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        this.environment.push({
            type: 'wall',
            start: new THREE.Vector3(x1, y1, z1),
            end: new THREE.Vector3(x2, y2, z2),
            geometry: geometry
        });
    }

    addFloor(x1, y1, z1, x2, y2, z2) {
        this.environment.push({
            type: 'floor',
            min: new THREE.Vector3(Math.min(x1, x2), y1, Math.min(z1, z2)),
            max: new THREE.Vector3(Math.max(x1, x2), y2, Math.max(z1, z2))
        });
    }

    addCeiling(x1, y1, z1, x2, y2, z2) {
        this.environment.push({
            type: 'ceiling',
            min: new THREE.Vector3(Math.min(x1, x2), y1, Math.min(z1, z2)),
            max: new THREE.Vector3(Math.max(x1, x2), y2, Math.max(z1, z2))
        });
    }

    addPillar(x, y, z, radius, height) {
        this.environment.push({
            type: 'pillar',
            position: new THREE.Vector3(x, y, z),
            radius: radius,
            height: height
        });
    }

    addBox(x, y, z, width, height, depth) {
        this.environment.push({
            type: 'box',
            position: new THREE.Vector3(x, y, z),
            size: new THREE.Vector3(width, height, depth)
        });
    }

    addTable(x, y, z) {
        // Add a table for dice games
        const tableObj = {
            type: 'table',
            position: new THREE.Vector3(x, y, z),
            size: new THREE.Vector3(1.5, 0.8, 1.0), // width, height, depth
            hasEnemy: true, // Every table has an enemy
            used: false
        };
        this.environment.push(tableObj);
        this.tables.push(tableObj);
        
        // Always create enemy entity at table
        this.enemies.push({
            position: new THREE.Vector3(x + 2, y + 0.8, z), // Enemy stands near table
            table: tableObj,
            defeated: false
        });
    }

    addCurvedTunnelSegment(x1, y1, z1, r1, x2, y2, z2, r2) {
        // Add a segment of organic tunnel as a cylindrical surface
        this.environment.push({
            type: 'tunnelSegment',
            start: new THREE.Vector3(x1, y1, z1),
            end: new THREE.Vector3(x2, y2, z2),
            startRadius: r1,
            endRadius: r2
        });
    }

    addOrganicBranch(x, y, z, length, angle) {
        // Add a branching tunnel
        const dirX = Math.sin(angle);
        const dirZ = Math.cos(angle);
        const segments = 20;
        
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const nextT = (i + 1) / segments;
            
            const posX = x + dirX * t * length + Math.sin(t * Math.PI * 2) * 1.5;
            const posZ = z + dirZ * t * length;
            const posY = y + Math.sin(t * Math.PI) * 2; // Arc up then down
            
            const nextPosX = x + dirX * nextT * length + Math.sin(nextT * Math.PI * 2) * 1.5;
            const nextPosZ = z + dirZ * nextT * length;
            const nextPosY = y + Math.sin(nextT * Math.PI) * 2;
            
            // Radius shrinks as branch extends
            const radius = 4 - t * 2 + Math.sin(t * Math.PI * 4) * 0.4;
            const nextRadius = 4 - nextT * 2 + Math.sin(nextT * Math.PI * 4) * 0.4;
            
            this.addCurvedTunnelSegment(posX, posY, posZ, radius, nextPosX, nextPosY, nextPosZ, nextRadius);
        }
    }

    addOrganicCavern(x, y, z, radius, height) {
        // Add a spherical/elliptical cavern
        this.environment.push({
            type: 'cavern',
            position: new THREE.Vector3(x, y, z),
            radius: radius,
            height: height
        });
    }

    addOrganicPillar(x, y, z, radius, height) {
        // Add an organic pillar with varying radius
        this.environment.push({
            type: 'organicPillar',
            position: new THREE.Vector3(x, y, z),
            radius: radius,
            height: height
        });
    }

    addOrganicRock(x, y, z, size) {
        // Add an irregular rock formation
        this.environment.push({
            type: 'organicRock',
            position: new THREE.Vector3(x, y, z),
            size: size
        });
    }

    setupPointCloud() {
        // Create buffer for maximum points
        const positions = new Float32Array(this.maxPoints * 3);
        const colors = new Float32Array(this.maxPoints * 3);
        
        // Initialize with default values
        for (let i = 0; i < this.maxPoints; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        }

        this.pointsGeometry = new THREE.BufferGeometry();
        this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.pointsGeometry.setDrawRange(0, 0); // Start with no points visible

        this.pointsMaterial = new THREE.PointsMaterial({
            size: 0.3, // Even larger for testing
            vertexColors: true,
            transparent: false,
            sizeAttenuation: false, // Fixed size for testing
            depthWrite: false,
            depthTest: true,
            fog: false
        });

        this.pointsCloud = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
        this.pointsCloud.frustumCulled = false; // Don't cull even if outside view
        this.scene.add(this.pointsCloud);
        
        console.log('Point cloud added to scene');
        console.log('Points material:', this.pointsMaterial);
        console.log('Points cloud object:', this.pointsCloud);
        console.log('Initial geometry:', this.pointsGeometry);
        
        // Add a test point that's always visible to verify rendering
        const testGeometry = new THREE.BufferGeometry();
        const testPositions = new Float32Array([0, 1.6, -5]); // Point 5 units in front at eye level
        const testColors = new Float32Array([0, 1, 0]); // Green
        testGeometry.setAttribute('position', new THREE.BufferAttribute(testPositions, 3));
        testGeometry.setAttribute('color', new THREE.BufferAttribute(testColors, 3));
        const testMaterial = new THREE.PointsMaterial({ 
            color: 0x00ff00, 
            size: 1.0,
            sizeAttenuation: false 
        });
        const testPoint = new THREE.Points(testGeometry, testMaterial);
        this.scene.add(testPoint);
        console.log('Test point added at:', testPositions);
        
        // Add test white points to verify they render
        const whiteTestGeom = new THREE.BufferGeometry();
        const whiteTestPos = new Float32Array([
            -2, 1.6, -5,
            -1, 1.6, -5,
            0, 1.6, -5,
            1, 1.6, -5,
            2, 1.6, -5
        ]);
        const whiteTestColors = new Float32Array([
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1
        ]);
        whiteTestGeom.setAttribute('position', new THREE.BufferAttribute(whiteTestPos, 3));
        whiteTestGeom.setAttribute('color', new THREE.BufferAttribute(whiteTestColors, 3));
        const whiteTestMaterial = new THREE.PointsMaterial({ 
            vertexColors: true,
            size: 0.5,
            sizeAttenuation: false 
        });
        const whiteTestPoints = new THREE.Points(whiteTestGeom, whiteTestMaterial);
        this.scene.add(whiteTestPoints);
        console.log('White test points added');
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // E key for interaction with tables
            if (e.code === 'KeyE' && !this.inDiceGame && !this.isDead) {
                this.tryInteractWithTable();
            }
            
            // F key for flashlight
            if (e.code === 'KeyF' && !this.isDead) {
                this.toggleFlashlight();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse
        this.canvas.addEventListener('click', () => {
            if (!this.mouse.locked) {
                this.canvas.requestPointerLock();
                document.getElementById('instructions').classList.add('hidden');
            } else {
                if (!this.isDead) {
                    this.performScan();
                }
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === this.canvas;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.player.rotation.yaw -= e.movementX * this.player.lookSpeed;
                this.player.rotation.pitch -= e.movementY * this.player.lookSpeed;
                this.player.rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.pitch));
            }
        });
    }

    setupAudio() {
        // Initialize Web Audio API
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup enemy audio elements
        this.enemyWalkingSound = new Audio('Sounds/walking.wav');
        this.enemyWalkingSound.loop = true;
        this.enemyWalkingSound.volume = 0;
        
        this.enemyRunningSound = new Audio('Sounds/running_away.wav');
        this.enemyRunningSound.loop = true;
        this.enemyRunningSound.volume = 0;
        
        this.aggressiveRunningSound = new Audio('Sounds/running.wav');
        this.aggressiveRunningSound.loop = true;
        this.aggressiveRunningSound.volume = 0;
        
        console.log('Audio system initialized with enemy sounds');
    }

    playScanSound() {
        if (!this.audioCtx) return;

        // Create a scan pulse sound
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.3);

        // Add echo effect
        setTimeout(() => {
            const echo = this.audioCtx.createOscillator();
            const echoGain = this.audioCtx.createGain();
            echo.connect(echoGain);
            echoGain.connect(this.audioCtx.destination);
            
            echo.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            echoGain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            echoGain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
            
            echo.start(this.audioCtx.currentTime);
            echo.stop(this.audioCtx.currentTime + 0.2);
        }, 150);
    }

    performScan() {
        if (this.scanCooldown > 0) return;

        this.scanCooldown = this.scanCooldownTime;
        this.playScanSound();
        document.getElementById('scanStatus').textContent = 'SCANNING...';

        console.log('Performing scan from position:', this.camera.position);
        console.log('Environment objects:', this.environment.length);

        // Emit scan rays in all directions
        this.emitScanRays();
    }

    emitScanRays() {
        const rayCount = 3000; // Reduced from 8000 for better performance
        const currentTime = this.clock.getElapsedTime();
        let hitCount = 0;

        // Batch process rays to prevent freezing
        const batchSize = 500;
        let currentBatch = 0;
        
        const processBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, rayCount);
            
            for (let i = start; i < end; i++) {
                // Random direction (sphere) with slight forward bias
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                const direction = new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta),
                    Math.sin(phi) * Math.sin(theta),
                    Math.cos(phi)
                );

                // Raycast from camera position
                const raycaster = new THREE.Raycaster(
                    this.camera.position.clone(),
                    direction,
                    0,
                    this.scanRange
                );

                // Check intersection with environment
                const hit = this.raycastEnvironment(raycaster);
                
                if (hit) {
                    hitCount++;
                    // Create points along the surface
                    this.createSurfacePoints(hit.point, hit.normal, currentTime, false);
                }
                
                // Also check for enemy hits
                const enemyHit = this.raycastEnemies(raycaster);
                if (enemyHit) {
                    // Create red points for enemies
                    this.createSurfacePoints(enemyHit.point, enemyHit.normal, currentTime, true);
                }
            }
            
            currentBatch++;
            
            if (currentBatch * batchSize < rayCount) {
                // Process next batch on next frame
                requestAnimationFrame(processBatch);
            } else {
                // All batches complete, update point cloud
                this.updatePointCloud();
            }
        };
        
        // Start batch processing
        processBatch();
    }

    raycastEnvironment(raycaster) {
        let closestHit = null;
        let closestDistance = Infinity;

        for (const obj of this.environment) {
            const hit = this.intersectObject(raycaster, obj);
            if (hit && hit.distance < closestDistance) {
                closestDistance = hit.distance;
                closestHit = hit;
            }
        }

        return closestHit;
    }

    raycastEnemies(raycaster) {
        let closestHit = null;
        let closestDistance = Infinity;

        // Check table enemies
        for (const enemy of this.enemies) {
            if (enemy.defeated) continue;
            
            const toEnemy = new THREE.Vector3().subVectors(enemy.position, raycaster.ray.origin);
            const distance = toEnemy.length();
            
            if (distance > this.scanRange) continue;
            
            const enemyRadius = 0.5;
            const projection = toEnemy.dot(raycaster.ray.direction);
            
            if (projection < 0) continue;
            
            const closestPoint = new THREE.Vector3()
                .copy(raycaster.ray.direction)
                .multiplyScalar(projection)
                .add(raycaster.ray.origin);
            
            const distToEnemy = closestPoint.distanceTo(enemy.position);
            
            if (distToEnemy <= enemyRadius && distance < closestDistance) {
                closestDistance = distance;
                closestHit = {
                    point: closestPoint,
                    normal: new THREE.Vector3().subVectors(closestPoint, enemy.position).normalize(),
                    distance: distance,
                    enemy: enemy
                };
            }
        }

        // Check wandering enemies (humanoid silhouette)
        for (const wEnemy of this.wanderingEnemies) {
            if (wEnemy.fleeing) continue;
            
            // Humanoid shape: head, torso, arms, legs
            const bodyParts = [
                { offset: new THREE.Vector3(0, 1.6, 0), radius: 0.2 }, // head
                { offset: new THREE.Vector3(0, 1.0, 0), radius: 0.3 }, // torso upper
                { offset: new THREE.Vector3(0, 0.5, 0), radius: 0.25 }, // torso lower
                { offset: new THREE.Vector3(-0.3, 1.0, 0), radius: 0.15 }, // left arm
                { offset: new THREE.Vector3(0.3, 1.0, 0), radius: 0.15 }, // right arm
                { offset: new THREE.Vector3(-0.15, 0, 0), radius: 0.15 }, // left leg
                { offset: new THREE.Vector3(0.15, 0, 0), radius: 0.15 }  // right leg
            ];

            for (const part of bodyParts) {
                const partPos = wEnemy.position.clone().add(part.offset);
                const toEnemy = new THREE.Vector3().subVectors(partPos, raycaster.ray.origin);
                const distance = toEnemy.length();
                
                if (distance > this.scanRange) continue;
                
                const projection = toEnemy.dot(raycaster.ray.direction);
                if (projection < 0) continue;
                
                const closestPoint = new THREE.Vector3()
                    .copy(raycaster.ray.direction)
                    .multiplyScalar(projection)
                    .add(raycaster.ray.origin);
                
                const distToPart = closestPoint.distanceTo(partPos);
                
                if (distToPart <= part.radius && distance < closestDistance) {
                    closestDistance = distance;
                    closestHit = {
                        point: closestPoint,
                        normal: new THREE.Vector3().subVectors(closestPoint, partPos).normalize(),
                        distance: distance,
                        wanderingEnemy: wEnemy
                    };
                }
            }
        }

        return closestHit;
    }

    intersectObject(raycaster, obj) {
        const origin = raycaster.ray.origin;
        const direction = raycaster.ray.direction;

        switch (obj.type) {
            case 'wall':
                return this.intersectWall(origin, direction, obj);
            case 'floor':
            case 'ceiling':
                return this.intersectPlane(origin, direction, obj);
            case 'pillar':
                return this.intersectCylinder(origin, direction, obj);
            case 'box':
            case 'table':
                return this.intersectBox(origin, direction, obj);
            case 'tunnelSegment':
                return this.intersectTunnelSegment(origin, direction, obj);
            case 'cavern':
                return this.intersectCavern(origin, direction, obj);
            case 'crossroad':
                return this.intersectCrossroad(origin, direction, obj);
            case 'organicPillar':
                return this.intersectOrganicPillar(origin, direction, obj);
            case 'organicRock':
                return this.intersectOrganicRock(origin, direction, obj);
        }

        return null;
    }

    intersectWall(origin, direction, wall) {
        // Simplified wall intersection (treating as infinite plane)
        const wallDir = new THREE.Vector3().subVectors(wall.end, wall.start).normalize();
        const wallNormal = new THREE.Vector3(-wallDir.z, 0, wallDir.x);
        
        const denom = wallNormal.dot(direction);
        if (Math.abs(denom) > 0.0001) {
            const t = new THREE.Vector3().subVectors(wall.start, origin).dot(wallNormal) / denom;
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                
                // Check if point is within wall bounds
                const toPoint = new THREE.Vector3().subVectors(point, wall.start);
                const projection = toPoint.dot(wallDir);
                const wallLength = wall.start.distanceTo(wall.end);
                
                if (projection >= 0 && projection <= wallLength &&
                    point.y >= Math.min(wall.start.y, wall.end.y) && 
                    point.y <= Math.max(wall.start.y, wall.end.y)) {
                    return { point, normal: wallNormal, distance: t };
                }
            }
        }
        return null;
    }

    intersectPlane(origin, direction, plane) {
        const normal = new THREE.Vector3(0, plane.type === 'floor' ? 1 : -1, 0);
        const denom = normal.dot(direction);
        
        if (Math.abs(denom) > 0.0001) {
            const t = (plane.min.y - origin.y) / direction.y;
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                
                if (point.x >= plane.min.x && point.x <= plane.max.x &&
                    point.z >= plane.min.z && point.z <= plane.max.z) {
                    return { point, normal, distance: t };
                }
            }
        }
        return null;
    }

    intersectCylinder(origin, direction, pillar) {
        // Simplified cylinder intersection (infinite height for now)
        const dx = origin.x - pillar.position.x;
        const dz = origin.z - pillar.position.z;
        
        const a = direction.x * direction.x + direction.z * direction.z;
        const b = 2 * (direction.x * dx + direction.z * dz);
        const c = dx * dx + dz * dz - pillar.radius * pillar.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant >= 0 && a !== 0) {
            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                
                if (point.y >= pillar.position.y && point.y <= pillar.position.y + pillar.height) {
                    const normal = new THREE.Vector3(
                        point.x - pillar.position.x,
                        0,
                        point.z - pillar.position.z
                    ).normalize();
                    return { point, normal, distance: t };
                }
            }
        }
        return null;
    }

    intersectBox(origin, direction, box) {
        const min = new THREE.Vector3().subVectors(box.position, box.size.clone().multiplyScalar(0.5));
        const max = new THREE.Vector3().addVectors(box.position, box.size.clone().multiplyScalar(0.5));
        
        let tmin = (min.x - origin.x) / direction.x;
        let tmax = (max.x - origin.x) / direction.x;
        
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
        
        let tymin = (min.y - origin.y) / direction.y;
        let tymax = (max.y - origin.y) / direction.y;
        
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
        
        if ((tmin > tymax) || (tymin > tmax)) return null;
        
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;
        
        let tzmin = (min.z - origin.z) / direction.z;
        let tzmax = (max.z - origin.z) / direction.z;
        
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
        
        if ((tmin > tzmax) || (tzmin > tmax)) return null;
        
        if (tzmin > tmin) tmin = tzmin;
        
        if (tmin >= 0 && tmin <= this.scanRange) {
            const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(tmin));
            const normal = new THREE.Vector3();
            
            // Calculate normal based on which face was hit
            const epsilon = 0.0001;
            if (Math.abs(point.x - min.x) < epsilon) normal.set(-1, 0, 0);
            else if (Math.abs(point.x - max.x) < epsilon) normal.set(1, 0, 0);
            else if (Math.abs(point.y - min.y) < epsilon) normal.set(0, -1, 0);
            else if (Math.abs(point.y - max.y) < epsilon) normal.set(0, 1, 0);
            else if (Math.abs(point.z - min.z) < epsilon) normal.set(0, 0, -1);
            else if (Math.abs(point.z - max.z) < epsilon) normal.set(0, 0, 1);
            
            return { point, normal, distance: tmin };
        }
        
        return null;
    }

    intersectTunnelSegment(origin, direction, segment) {
        // Intersect with a cylindrical tunnel segment
        const axis = new THREE.Vector3().subVectors(segment.end, segment.start);
        const segmentLength = axis.length();
        axis.normalize();
        
        const toOrigin = new THREE.Vector3().subVectors(origin, segment.start);
        const avgRadius = (segment.startRadius + segment.endRadius) / 2;
        
        const dDotAxis = toOrigin.dot(axis);
        const vDotAxis = direction.dot(axis);
        
        const d_perp = new THREE.Vector3().subVectors(toOrigin, axis.clone().multiplyScalar(dDotAxis));
        const v_perp = new THREE.Vector3().subVectors(direction, axis.clone().multiplyScalar(vDotAxis));
        
        const a = v_perp.lengthSq();
        const b = 2 * d_perp.dot(v_perp);
        const c = d_perp.lengthSq() - avgRadius * avgRadius;
        
        if (a < 0.0001) return null;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant >= 0) {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
            
            for (const t of [t1, t2]) {
                if (t >= 0 && t <= this.scanRange) {
                    const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                    const toPoint = new THREE.Vector3().subVectors(point, segment.start);
                    const proj = toPoint.dot(axis);
                    
                    if (proj >= 0 && proj <= segmentLength) {
                        const perpVector = new THREE.Vector3().subVectors(toPoint, axis.clone().multiplyScalar(proj));
                        const normal = perpVector.normalize();
                        return { point, normal, distance: t };
                    }
                }
            }
        }
        
        return null;
    }

    intersectCavern(origin, direction, cavern) {
        const a = cavern.radius;
        const b = cavern.height;
        const c = cavern.radius;
        
        const localOrigin = new THREE.Vector3().subVectors(origin, cavern.position);
        
        const dx = direction.x / a;
        const dy = direction.y / b;
        const dz = direction.z / c;
        const ox = localOrigin.x / a;
        const oy = localOrigin.y / b;
        const oz = localOrigin.z / c;
        
        const A = dx * dx + dy * dy + dz * dz;
        const B = 2 * (dx * ox + dy * oy + dz * oz);
        const C = ox * ox + oy * oy + oz * oz - 1;
        
        const discriminant = B * B - 4 * A * C;
        
        if (discriminant >= 0 && A !== 0) {
            const t = (-B - Math.sqrt(discriminant)) / (2 * A);
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                const localPoint = new THREE.Vector3().subVectors(point, cavern.position);
                const normal = new THREE.Vector3(
                    2 * localPoint.x / (a * a),
                    2 * localPoint.y / (b * b),
                    2 * localPoint.z / (c * c)
                ).normalize();
                return { point, normal, distance: t };
            }
        }
        
        return null;
    }

    intersectCrossroad(origin, direction, crossroad) {
        // Crossroad is a large sphere - similar to cavern but simpler
        const sphere = {
            center: crossroad.position,
            radius: crossroad.radius
        };
        
        const oc = new THREE.Vector3().subVectors(origin, sphere.center);
        const a = direction.dot(direction);
        const b = 2.0 * oc.dot(direction);
        const c = oc.dot(oc) - sphere.radius * sphere.radius;
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant >= 0 && a !== 0) {
            const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                const normal = new THREE.Vector3().subVectors(point, sphere.center).normalize();
                return { point, normal, distance: t };
            }
        }
        
        return null;
    }

    intersectOrganicPillar(origin, direction, pillar) {
        const dx = origin.x - pillar.position.x;
        const dz = origin.z - pillar.position.z;
        
        const a = direction.x * direction.x + direction.z * direction.z;
        const b = 2 * (direction.x * dx + direction.z * dz);
        const c = dx * dx + dz * dz - pillar.radius * pillar.radius;
        
        if (a < 0.0001) return null;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant >= 0) {
            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                
                if (point.y >= pillar.position.y && point.y <= pillar.position.y + pillar.height) {
                    const normal = new THREE.Vector3(
                        point.x - pillar.position.x,
                        0,
                        point.z - pillar.position.z
                    ).normalize();
                    return { point, normal, distance: t };
                }
            }
        }
        
        return null;
    }

    intersectOrganicRock(origin, direction, rock) {
        const toOrigin = new THREE.Vector3().subVectors(origin, rock.position);
        const a = direction.lengthSq();
        const b = 2 * direction.dot(toOrigin);
        const c = toOrigin.lengthSq() - rock.size * rock.size;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant >= 0 && a !== 0) {
            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            if (t >= 0 && t <= this.scanRange) {
                const point = new THREE.Vector3().addVectors(origin, direction.clone().multiplyScalar(t));
                const normal = new THREE.Vector3().subVectors(point, rock.position).normalize();
                return { point, normal, distance: t };
            }
        }
        
        return null;
    }

    createSurfacePoints(hitPoint, normal, currentTime, isEnemy = false) {
        // Create multiple points around the hit point for dense surface detail
        const pointsPerHit = 3; // Reduced from 5 for better performance
        const spread = this.scanResolution;

        for (let i = 0; i < pointsPerHit; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            );

            const point = hitPoint.clone().add(offset);
            const distance = this.camera.position.distanceTo(point);
            
            // Point intensity based on distance - brighter closer, dimmer far
            const intensity = Math.max(0.4, 1.0 - (distance / this.scanRange) * 0.7);
            
            const color = new THREE.Color();
            if (isEnemy) {
                // Red color for enemies
                color.setRGB(intensity, intensity * 0.2, intensity * 0.2);
            } else {
                // Slight yellow-white tint like in the reference
                color.setRGB(intensity, intensity * 0.98, intensity * 0.95);
            }
            
            const size = 0.08 + Math.random() * 0.04;

            this.scanPoints.push({
                position: point,
                color: color,
                size: size,
                birthTime: currentTime,
                lifetime: this.pointLifetime + Math.random() * 2.0
            });
        }

        // Limit total points - more aggressive cleanup for performance
        if (this.scanPoints.length > this.maxPoints) {
            this.scanPoints = this.scanPoints.slice(-this.maxPoints);
        }
    }

    updatePointCloud() {
        const currentTime = this.clock.getElapsedTime();
        const positions = this.pointsGeometry.attributes.position.array;
        const colors = this.pointsGeometry.attributes.color.array;

        // Remove dead points (only check every 30th frame for better performance)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        
        if (this.frameCount % 30 === 0) {
            const beforeCount = this.scanPoints.length;
            this.scanPoints = this.scanPoints.filter(point => {
                const age = currentTime - point.birthTime;
                return age < point.lifetime;
            });
            // Also limit total points if getting too many
            if (this.scanPoints.length > this.maxPoints * 0.9) {
                this.scanPoints = this.scanPoints.slice(-Math.floor(this.maxPoints * 0.8));
            }
        }

        const activePoints = Math.min(this.scanPoints.length, this.maxPoints);
        
        // Get camera frustum for culling - cache this
        if (!this._frustum) this._frustum = new THREE.Frustum();
        if (!this._projectionMatrix) this._projectionMatrix = new THREE.Matrix4();
        
        this._projectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this._frustum.setFromProjectionMatrix(this._projectionMatrix);

        let visiblePointIndex = 0;
        const playerPos = this.camera.position;

        // Update point cloud geometry - only render points in view and near player
        for (let i = 0; i < activePoints; i++) {
            const point = this.scanPoints[i];
            
            // Quick distance check first (cheaper than frustum check)
            const distSq = point.position.distanceToSquared(playerPos);
            if (distSq > this.scanRange * this.scanRange * 1.5) {
                continue; // Skip points too far away
            }
            
            // Check if point is in camera frustum
            if (!this._frustum.containsPoint(point.position)) {
                continue; // Skip points not in view
            }
            
            const age = currentTime - point.birthTime;
            
            // Different fade behavior for flashlight points
            let alpha = 1.0;
            
            if (point.isFlashlight) {
                // Flashlight points: start extremely bright, fade over full lifetime
                const fadeProgress = age / point.lifetime;
                alpha = 1.0 - fadeProgress; // Linear fade from 1.0 to 0
                alpha = Math.max(0.1, alpha); // Keep minimum visibility
                
                // Boost brightness at start
                if (age < 2.0) {
                    alpha *= 1.5; // Extra bright in first 2 seconds
                }
            } else {
                // Normal scan points: full brightness until near end of life, then fade out
                if (age > (point.lifetime - this.fadeTime)) {
                    alpha = (point.lifetime - age) / this.fadeTime;
                }
                alpha = Math.max(0.3, Math.min(1.0, alpha));
            }

            positions[visiblePointIndex * 3] = point.position.x;
            positions[visiblePointIndex * 3 + 1] = point.position.y;
            positions[visiblePointIndex * 3 + 2] = point.position.z;

            colors[visiblePointIndex * 3] = point.color.r * alpha;
            colors[visiblePointIndex * 3 + 1] = point.color.g * alpha;
            colors[visiblePointIndex * 3 + 2] = point.color.b * alpha;
            
            visiblePointIndex++;
        }

        this.pointsGeometry.attributes.position.needsUpdate = true;
        this.pointsGeometry.attributes.color.needsUpdate = true;
        
        // Update draw range to only render visible points
        this.pointsGeometry.setDrawRange(0, visiblePointIndex);

        // UI updates removed - cleaner interface
    }

    updatePlayer(deltaTime) {
        // Movement input
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.yaw);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.yaw);

        const movement = new THREE.Vector3();
        let isMoving = false;

        if (this.keys['KeyW']) { movement.add(forward); isMoving = true; }
        if (this.keys['KeyS']) { movement.sub(forward); isMoving = true; }
        if (this.keys['KeyD']) { movement.add(right); isMoving = true; }
        if (this.keys['KeyA']) { movement.sub(right); isMoving = true; }

        if (movement.length() > 0) {
            movement.normalize().multiplyScalar(this.player.moveSpeed * deltaTime);
            
            // Apply improved collision detection
            const newPosition = this.player.position.clone().add(movement);
            
            if (!this.checkCollision(newPosition)) {
                // No collision, move freely
                this.player.position.copy(newPosition);
            } else {
                // Collision detected - log warning
                console.warn('⚠️ COLLISION DETECTED at position:', newPosition.toArray().map(v => v.toFixed(2)));
                
                // Try sliding along surfaces
                const slideX = this.player.position.clone().add(new THREE.Vector3(movement.x, 0, 0));
                const slideZ = this.player.position.clone().add(new THREE.Vector3(0, 0, movement.z));
                
                // Try X-axis slide
                if (!this.checkCollision(slideX)) {
                    this.player.position.copy(slideX);
                    console.log('  → Sliding along X-axis');
                } 
                // Try Z-axis slide
                else if (!this.checkCollision(slideZ)) {
                    this.player.position.copy(slideZ);
                    console.log('  → Sliding along Z-axis');
                }
                // Try smaller steps for smoother sliding
                else {
                    const smallStep = movement.clone().multiplyScalar(0.3);
                    const microPosition = this.player.position.clone().add(smallStep);
                    if (!this.checkCollision(microPosition)) {
                        this.player.position.copy(microPosition);
                        console.log('  → Using micro-step movement');
                        this.stuckCounter = 0;
                    } else {
                        this.stuckCounter++;
                        console.error('❌ PLAYER COMPLETELY STUCK - Cannot move in any direction!');
                        
                        // If stuck for too long, teleport to tunnel center
                        if (this.stuckCounter > 10) {
                            console.warn('🚨 TELEPORTING PLAYER TO TUNNEL CENTER');
                            const z = this.player.position.z;
                            const x = Math.sin(z * 0.04) * 3;
                            const y = 2 + Math.cos(z * 0.06) * 1.5;
                            this.player.position.set(x, y, z);
                            this.stuckCounter = 0;
                        }
                    }
                }
            }
        } else {
            // Reset stuck counter when not trying to move
            this.stuckCounter = 0;
        }

        // Update camera
        this.camera.position.copy(this.player.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.rotation.yaw;
        this.camera.rotation.x = this.player.rotation.pitch;

        // Update cooldowns
        if (this.scanCooldown > 0) {
            this.scanCooldown -= deltaTime;
            document.getElementById('scanStatus').textContent = 'SCANNING...';
        } else {
            document.getElementById('scanStatus').textContent = 'READY';
        }
        
        // Procedurally extend tunnels as player explores
        this.updateProceduralGeneration();
    }

    checkCollision(position) {
        // Grace period - disable collision for first few seconds after spawn
        const currentTime = Date.now() / 1000;
        if (currentTime - this.spawnTime < this.collisionGracePeriod) {
            return false; // No collision during grace period
        }
        
        // Check collision with environment - optimized
        // Only check nearby objects
        const checkRadius = 10; // Only check objects within 10 units
        
        for (const obj of this.environment) {
            // Quick distance check first
            if (obj.position && obj.position.distanceTo(position) > checkRadius) {
                continue;
            }
            if (obj.start && obj.start.distanceTo(position) > checkRadius * 2) {
                continue;
            }
            
            if (this.collidesWith(position, obj)) {
                return true;
            }
        }
        return false;
    }

    collidesWith(position, obj) {
        const playerRadius = this.player.radius;
        
        switch (obj.type) {
            case 'tunnelSegment':
                return this.collidesWithTunnel(position, obj);
            case 'cavern':
                return false; // Caverns are safe spaces
            case 'crossroad':
                return false; // Crossroads are safe spaces
            case 'organicPillar':
            case 'pillar':
                return this.collidesWithPillar(position, obj);
            case 'organicRock':
                return this.collidesWithRock(position, obj);
        }
        
        return false;
    }

    collidesWithTunnel(position, tunnel) {
        // Tunnel collision disabled - causes too many stuck issues with organic paths
        // Players can explore freely and the visual LiDAR feedback guides them
        return false;
    }

    collidesWithPillar(position, pillar) {
        // Disabled collision for testing - pillars are decorative only
        return false;
        
        /* Original collision code - disabled
        const dx = position.x - pillar.position.x;
        const dz = position.z - pillar.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        const heightCheck = position.y < pillar.position.y - 0.5 || position.y > pillar.position.y + pillar.height + 0.5;
        if (heightCheck) {
            return false;
        }
        
        return dist < (pillar.radius * 0.5 + this.player.radius);
        */
    }

    collidesWithRock(position, rock) {
        // Disabled collision for testing - rocks are decorative only
        return false;
        
        /* Original collision code - disabled
        if (position.y > rock.position.y + rock.size * 2) {
            return false;
        }
        
        const dist = position.distanceTo(rock.position);
        return dist < (rock.size * 0.5 + this.player.radius);
        */
    }

    updateProceduralGeneration() {
        // Extend tunnels as player moves in any direction
        const playerZ = this.player.position.z;
        const playerX = this.player.position.x;
        
        // Generate ahead based on player position
        const generateAhead = 80; // How far ahead to keep generated
        const generateDistance = 50; // Size of each generation chunk
        
        // Check if we need to generate more tunnel ahead
        if (playerZ > this.furthestGenerated - generateAhead) {
            const sectionsToGenerate = Math.ceil((playerZ + generateAhead - this.furthestGenerated) / generateDistance);
            for (let i = 0; i < sectionsToGenerate; i++) {
                console.log('Generating new tunnel section at:', this.furthestGenerated);
                this.generateTunnelSection(this.furthestGenerated, generateDistance);
                this.furthestGenerated += generateDistance;
            }
        }
        
        // Also generate behind if player somehow goes backward
        if (playerZ < this.earliestGenerated + 20) {
            console.log('Generating tunnel section behind at:', this.earliestGenerated - generateDistance);
            this.generateTunnelSection(this.earliestGenerated - generateDistance, generateDistance);
            this.earliestGenerated -= generateDistance;
        }
        
        // Clean up far behind sections (keep last 150 units)
        if (playerZ > 150) {
            const beforeCount = this.environment.length;
            this.environment = this.environment.filter(obj => {
                if (obj.type === 'tunnelSegment') {
                    return obj.start.z > playerZ - 150 && obj.start.z < playerZ + 150;
                }
                if (obj.position) {
                    return obj.position.z > playerZ - 150 && obj.position.z < playerZ + 150;
                }
                return true;
            });
            const afterCount = this.environment.length;
            if (beforeCount !== afterCount) {
                console.log('Cleaned up', beforeCount - afterCount, 'objects. Remaining:', afterCount);
            }
        }
    }

    generateTunnelSection(startZ, length) {
        const segments = 20;
        const segmentLength = length / segments;
        
        // Use seeded random for consistent but varied generation
        const seedOffsetX = this.seededRandom() * 0.1;
        const seedOffsetY = this.seededRandom() * 0.1;
        const seedOffsetRadius = this.seededRandom() * 0.1;
        
        for (let i = 0; i < segments; i++) {
            const z = startZ + i * segmentLength;
            const nextZ = startZ + (i + 1) * segmentLength;
            
            // Organic pattern with seeded variation
            const radius = 5 + Math.sin(z * (0.08 + seedOffsetRadius)) * 1.2 + Math.cos(z * (0.12 + seedOffsetRadius)) * 0.6;
            const nextRadius = 5 + Math.sin(nextZ * (0.08 + seedOffsetRadius)) * 1.2 + Math.cos(nextZ * (0.12 + seedOffsetRadius)) * 0.6;
            
            const xOffset = Math.sin(z * (0.04 + seedOffsetX)) * 3;
            const nextXOffset = Math.sin(nextZ * (0.04 + seedOffsetX)) * 3;
            
            const yOffset = 2 + Math.cos(z * (0.06 + seedOffsetY)) * 1.5;
            const nextYOffset = 2 + Math.cos(nextZ * (0.06 + seedOffsetY)) * 1.5;
            
            this.addCurvedTunnelSegment(xOffset, yOffset, z, radius, nextXOffset, nextYOffset, nextZ, nextRadius);
            
            // Removed obstacle spawning - clean tunnels only
        }
        
        // Sometimes add a table (20% chance) using seeded random
        if (this.seededRandom() < 0.2) {
            const tableZ = startZ + length * (0.3 + this.seededRandom() * 0.4);
            const tableX = Math.sin(tableZ * 0.04) * 2;
            const tableY = 2 + Math.cos(tableZ * 0.06) * 1.5;
            this.addTable(tableX, tableY, tableZ);
        }
        
        // Frequently add crossroad rooms (60% chance) using seeded random
        if (this.seededRandom() < 0.6) {
            const crossroadZ = startZ + length * 0.5;
            const crossroadX = Math.sin(crossroadZ * 0.04) * 3;
            const crossroadY = 2 + Math.cos(crossroadZ * 0.06) * 1.5;
            this.addCrossroadRoom(crossroadX, crossroadY, crossroadZ);
        }
        // Sometimes add a branch (30% chance) using seeded random
        else if (this.seededRandom() < 0.3) {
            const branchZ = startZ + length * 0.5;
            const branchAngle = (this.seededRandom() < 0.5 ? 1 : -1) * (Math.PI / 6 + this.seededRandom() * Math.PI / 6);
            this.addOrganicBranch(Math.sin(branchZ * 0.04) * 3, 2, branchZ, 15 + this.seededRandom() * 10, branchAngle);
        }
    }

    addCrossroadRoom(x, y, z) {
        // Create a large spherical room with multiple exits
        const roomRadius = 12;
        const roomHeight = 10;
        
        // Add the main crossroad chamber
        this.environment.push({
            type: 'crossroad',
            position: new THREE.Vector3(x, y, z),
            radius: roomRadius,
            height: roomHeight
        });
        
        // Create 4 tunnel exits from the crossroad (N, S, E, W)
        const exitRadius = 4;
        const exitLength = 8;
        
        // North exit
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const exitZ = z - roomRadius - t * exitLength;
            const nextZ = z - roomRadius - (i + 1) / 4 * exitLength;
            this.addCurvedTunnelSegment(x, y, exitZ, exitRadius, x, y, nextZ, exitRadius);
        }
        
        // South exit
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const exitZ = z + roomRadius + t * exitLength;
            const nextZ = z + roomRadius + (i + 1) / 4 * exitLength;
            this.addCurvedTunnelSegment(x, y, exitZ, exitRadius, x, y, nextZ, exitRadius);
        }
        
        // East exit
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const exitX = x + roomRadius + t * exitLength;
            const nextX = x + roomRadius + (i + 1) / 4 * exitLength;
            this.addCurvedTunnelSegment(exitX, y, z, exitRadius, nextX, y, z, exitRadius);
        }
        
        // West exit
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const exitX = x - roomRadius - t * exitLength;
            const nextX = x - roomRadius - (i + 1) / 4 * exitLength;
            this.addCurvedTunnelSegment(exitX, y, z, exitRadius, nextX, y, z, exitRadius);
        }
        
        // Removed pillars - clean crossroads
        
        console.log('Added crossroad room at', x, y, z);
    }

    addCrossroadRoom(x, y, z) {
        // Placeholder if not already defined
    }

    tryInteractWithTable() {
        // Check if player is near a table
        const interactionRange = 3.0;
        
        for (const table of this.tables) {
            const distance = this.player.position.distanceTo(table.position);
            if (distance <= interactionRange && !table.used) {
                this.startDiceGame(table);
                return;
            }
        }
    }

    startDiceGame(table) {
        this.inDiceGame = true;
        this.currentTable = table;
        table.used = true;
        
        // Randomly select 2 dice types
        const dice1Type = this.diceTypes[Math.floor(Math.random() * this.diceTypes.length)];
        const dice2Type = this.diceTypes[Math.floor(Math.random() * this.diceTypes.length)];
        
        this.playerDice = [dice1Type, dice2Type];
        
        // Roll player's dice
        const playerRoll1 = Math.floor(Math.random() * dice1Type) + 1;
        const playerRoll2 = Math.floor(Math.random() * dice2Type) + 1;
        const playerTotal = playerRoll1 + playerRoll2;
        
        // Find enemy at this table (if any)
        const enemy = this.enemies.find(e => e.table === table && !e.defeated);
        
        if (enemy) {
            // Enemy rolls same dice types
            const enemyRoll1 = Math.floor(Math.random() * dice1Type) + 1;
            const enemyRoll2 = Math.floor(Math.random() * dice2Type) + 1;
            const enemyTotal = enemyRoll1 + enemyRoll2;
            
            // Show dice game UI
            this.showDiceGameResult(
                dice1Type, dice2Type,
                playerRoll1, playerRoll2, playerTotal,
                enemyRoll1, enemyRoll2, enemyTotal,
                enemy
            );
            
            // Determine winner and battery change
            if (playerTotal > enemyTotal) {
                enemy.defeated = true;
                this.battery = Math.min(this.maxBattery, this.battery + 2);
                setTimeout(() => {
                    console.log('Victory! Enemy defeated. +2 Battery. Current:', this.battery);
                    this.updateBatteryUI();
                }, 2000);
            } else {
                this.battery = Math.max(0, this.battery - 2);
                setTimeout(() => {
                    console.log('Defeat! Enemy wins. -2 Battery. Current:', this.battery);
                    this.updateBatteryUI();
                    if (this.battery <= 0) {
                        console.log('⚠️ BATTERY DEPLETED! Enemies are now aggressive!');
                        this.startAggressiveMode();
                    }
                }, 2000);
            }
        } else {
            // No enemy, just show player's roll
            this.showDiceGameResult(
                dice1Type, dice2Type,
                playerRoll1, playerRoll2, playerTotal,
                0, 0, 0,
                null
            );
        }
        
        // End dice game after 4 seconds
        setTimeout(() => {
            this.endDiceGame();
        }, 4000);
    }

    showDiceGameResult(dice1Type, dice2Type, p1, p2, pTotal, e1, e2, eTotal, enemy) {
        const diceUI = document.getElementById('diceGame');
        const resultDiv = document.getElementById('diceResult');
        
        let resultHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #0f0;">YOUR ROLL:</h3>
                <p>d${dice1Type}: ${p1}</p>
                <p>d${dice2Type}: ${p2}</p>
                <p style="font-size: 24px; margin-top: 10px;">Total: ${pTotal}</p>
            </div>
        `;
        
        if (enemy) {
            resultHTML += `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #f00;">ENEMY ROLL:</h3>
                    <p>d${dice1Type}: ${e1}</p>
                    <p>d${dice2Type}: ${e2}</p>
                    <p style="font-size: 24px; margin-top: 10px;">Total: ${eTotal}</p>
                </div>
                <div style="margin-top: 30px; font-size: 28px; font-weight: bold;">
                    ${pTotal > eTotal ? '<span style="color: #0f0;">VICTORY!</span>' : '<span style="color: #f00;">DEFEAT!</span>'}
                </div>
            `;
        }
        
        resultDiv.innerHTML = resultHTML;
        diceUI.style.display = 'block';
    }

    endDiceGame() {
        this.inDiceGame = false;
        this.currentTable = null;
        document.getElementById('diceGame').style.display = 'none';
    }

    toggleFlashlight() {
        if (this.flashlightCooldown > 0 || this.battery <= 0) return;
        
        // Use 1 battery
        this.battery = Math.max(0, this.battery - 1);
        this.updateBatteryUI();
        console.log('Flashlight activated! -1 Battery. Current:', this.battery);
        
        this.flashlightOn = true;
        this.flashlightCooldown = this.flashlightCooldownTime;
        
        // Check if battery depleted
        if (this.battery <= 0) {
            console.log('⚠️ Battery depleted! Enemies will become aggressive!');
        }
        
        // Emit flashlight beam (dense cone of rays)
        this.emitFlashlightBeam();
        
        // Check for enemies in flashlight cone
        const flashlightDir = new THREE.Vector3(0, 0, -1);
        flashlightDir.applyQuaternion(this.camera.quaternion);
        
        let enemiesFlashed = 0;
        
        for (const wEnemy of this.wanderingEnemies) {
            if (wEnemy.fleeing) continue;
            
            const toEnemy = new THREE.Vector3().subVectors(wEnemy.position, this.player.position);
            const distance = toEnemy.length();
            
            if (distance > this.flashlightRange) continue;
            
            const angle = flashlightDir.angleTo(toEnemy.normalize());
            
            // 45 degree cone
            if (angle < Math.PI / 4) {
                console.log('Enemy caught in flashlight! Enemy fleeing...');
                this.fleeEnemy(wEnemy);
                enemiesFlashed++;
            }
        }
        
        if (enemiesFlashed === 0) {
            console.log('No enemies in flashlight range');
        }
        
        setTimeout(() => {
            this.flashlightOn = false;
        }, 200);
    }

    emitFlashlightBeam() {
        const rayCount = 500; // Dense beam
        const currentTime = this.clock.getElapsedTime();
        const coneAngle = Math.PI / 4; // 45 degree cone
        
        // Get forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        
        for (let i = 0; i < rayCount; i++) {
            // Generate random direction within cone
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * coneAngle;
            
            // Create direction vector in cone
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            
            // Rotate to camera direction
            const direction = new THREE.Vector3(x, y, -z);
            direction.applyQuaternion(this.camera.quaternion);
            direction.normalize();
            
            // Cast ray
            const raycaster = new THREE.Raycaster(
                this.camera.position.clone(),
                direction,
                0,
                this.flashlightRange
            );
            
            // Check environment hit
            const hit = this.raycastEnvironment(raycaster);
            
            if (hit) {
                // Create bright white points with 60 second lifetime
                this.createFlashlightPoints(hit.point, hit.normal, currentTime);
            }
        }
        
        console.log('Flashlight beam emitted');
    }

    createFlashlightPoints(hitPoint, normal, currentTime) {
        // Create very bright white points
        const pointsPerHit = 2;
        const spread = 0.05;
        
        for (let i = 0; i < pointsPerHit; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            );
            
            const point = hitPoint.clone().add(offset);
            
            // Extremely bright white
            const color = new THREE.Color();
            color.setRGB(1.0, 1.0, 1.0);
            
            const size = 0.12 + Math.random() * 0.06;
            
            this.scanPoints.push({
                position: point,
                color: color,
                size: size,
                birthTime: currentTime,
                lifetime: 60.0, // 1 minute fade
                isFlashlight: true // Mark as flashlight point for special handling
            });
        }
    }

    fleeEnemy(enemy) {
        enemy.fleeing = true;
        enemy.fleeTime = 10.0; // Flee for 10 seconds
        console.log('Enemy will return in 10 seconds');
        
        // Stop walking sound, will be handled by updateEnemyAudio to play running sound
        if (this.enemyWalkingSound && !this.enemyWalkingSound.paused) {
            this.enemyWalkingSound.pause();
            this.enemyWalkingSound.currentTime = 0;
        }
    }

    spawnWanderingEnemy() {
        this.spawnWanderingEnemyAtDistance(30);
    }

    spawnWanderingEnemyAtDistance(distance) {
        // Spawn enemy at specified distance from player
        const angle = Math.random() * Math.PI * 2;
        
        const spawnPos = new THREE.Vector3(
            this.player.position.x + Math.sin(angle) * distance,
            2,
            this.player.position.z + Math.cos(angle) * distance
        );
        
        this.wanderingEnemies.push({
            position: spawnPos,
            velocity: new THREE.Vector3(),
            fleeing: false,
            fleeTime: 0,
            moveSpeed: 2.0,
            attackCooldown: 0
        });
        
        console.log('Wandering enemy spawned at distance:', distance);
    }

    updateWanderingEnemies(deltaTime) {
        if (this.isDead) return;
        
        let closestEnemyDistance = Infinity;
        let hasFleeingEnemy = false;
        
        for (let i = this.wanderingEnemies.length - 1; i >= 0; i--) {
            const enemy = this.wanderingEnemies[i];
            
            const toPlayer = new THREE.Vector3().subVectors(this.player.position, enemy.position);
            const distanceToPlayer = toPlayer.length();
            
            // Handle fleeing state
            if (enemy.fleeing) {
                hasFleeingEnemy = true;
                enemy.fleeTime -= deltaTime;
                
                if (enemy.fleeTime <= 0) {
                    // Respawn enemy far away
                    this.wanderingEnemies.splice(i, 1);
                    setTimeout(() => {
                        this.spawnWanderingEnemy();
                    }, 5000);
                    continue;
                }
                
                // Move away from player
                const awayDir = new THREE.Vector3()
                    .subVectors(enemy.position, this.player.position)
                    .normalize();
                enemy.position.add(awayDir.multiplyScalar(enemy.moveSpeed * 2 * deltaTime));
                continue;
            }
            
            // Track closest non-fleeing enemy
            if (distanceToPlayer < closestEnemyDistance) {
                closestEnemyDistance = distanceToPlayer;
            }
            
            // Check if can attack
            if (distanceToPlayer < 2.0 && enemy.attackCooldown <= 0) {
                this.onEnemyAttack();
                enemy.attackCooldown = 3.0;
            }
            
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaTime);
            
            // Movement AI based on battery
            if (this.battery <= 0) {
                // Aggressive direct path
                const moveDir = toPlayer.normalize();
                enemy.position.add(moveDir.multiplyScalar(enemy.moveSpeed * 2 * deltaTime));
            } else {
                // Sneaky approach from behind
                const playerForward = new THREE.Vector3(0, 0, -1);
                playerForward.applyQuaternion(this.camera.quaternion);
                
                const playerBack = playerForward.clone().multiplyScalar(-1);
                const targetPos = this.player.position.clone().add(playerBack.multiplyScalar(5));
                
                const toTarget = new THREE.Vector3().subVectors(targetPos, enemy.position);
                const moveDir = toTarget.normalize();
                
                enemy.position.add(moveDir.multiplyScalar(enemy.moveSpeed * deltaTime));
            }
        }
        
        // Update enemy audio based on closest enemy
        this.updateEnemyAudio(closestEnemyDistance, hasFleeingEnemy);
    }

    updateEnemyAudio(closestDistance, hasFleeingEnemy) {
        if (!this.enemyWalkingSound || !this.enemyRunningSound) return;
        
        // If battery is 0, aggressive mode is active - don't override that sound
        if (this.battery <= 0 && this.aggressiveRunningSound && !this.aggressiveRunningSound.paused) {
            // Stop other sounds to let aggressive sound play
            if (!this.enemyWalkingSound.paused) {
                this.enemyWalkingSound.pause();
                this.enemyWalkingSound.currentTime = 0;
            }
            if (!this.enemyRunningSound.paused) {
                this.enemyRunningSound.pause();
                this.enemyRunningSound.currentTime = 0;
            }
            return;
        }
        
        // If enemy is fleeing, play running away sound
        if (hasFleeingEnemy) {
            // Stop walking sound
            if (!this.enemyWalkingSound.paused) {
                this.enemyWalkingSound.pause();
                this.enemyWalkingSound.currentTime = 0;
            }
            
            // Play running sound
            if (this.enemyRunningSound.paused) {
                this.enemyRunningSound.play().catch(e => console.log('Running sound play error:', e));
            }
            this.enemyRunningSound.volume = 0.6;
            return;
        }
        
        // Stop running sound if no fleeing enemies
        if (!this.enemyRunningSound.paused) {
            this.enemyRunningSound.pause();
            this.enemyRunningSound.currentTime = 0;
        }
        
        // Play walking sound based on distance
        if (closestDistance < this.enemyAudioDetectionRange) {
            if (this.enemyWalkingSound.paused) {
                this.enemyWalkingSound.play().catch(e => console.log('Walking sound play error:', e));
            }
            
            // Volume based on distance (louder when closer)
            const volumeFactor = 1.0 - (closestDistance / this.enemyAudioDetectionRange);
            this.enemyWalkingSound.volume = Math.max(0.1, Math.min(0.8, volumeFactor * 0.8));
        } else {
            // Enemy too far, stop sound
            if (!this.enemyWalkingSound.paused) {
                this.enemyWalkingSound.pause();
                this.enemyWalkingSound.currentTime = 0;
            }
        }
    }

    onEnemyAttack() {
        console.log('Enemy attacked! -6 Battery');
        this.battery -= 6;
        this.updateBatteryUI();
        
        // Stop walking sound, play running sound
        if (this.enemyWalkingSound && !this.enemyWalkingSound.paused) {
            this.enemyWalkingSound.pause();
            this.enemyWalkingSound.currentTime = 0;
        }
        
        // Remove all wandering enemies
        this.wanderingEnemies = [];
        
        // Respawn enemy after 5 seconds at 125 units away
        setTimeout(() => {
            if (!this.isDead) {
                this.spawnWanderingEnemyAtDistance(125);
            }
        }, 5000);
        
        if (this.battery <= 0) {
            this.die('Killed by wandering enemy!');
        }
    }

    startAggressiveMode() {
        // Play aggressive running sound on loop
        if (this.aggressiveRunningSound) {
            this.aggressiveRunningSound.volume = 0.7;
            this.aggressiveRunningSound.play().catch(e => console.log('Aggressive running sound error:', e));
            console.log('Aggressive running sound started - enemies now hunting!');
        }
        
        // Stop other enemy sounds
        if (this.enemyWalkingSound && !this.enemyWalkingSound.paused) {
            this.enemyWalkingSound.pause();
            this.enemyWalkingSound.currentTime = 0;
        }
        if (this.enemyRunningSound && !this.enemyRunningSound.paused) {
            this.enemyRunningSound.pause();
            this.enemyRunningSound.currentTime = 0;
        }
    }

    updateBatteryUI() {
        const batteryEl = document.getElementById('battery');
        if (batteryEl) {
            batteryEl.textContent = `Battery: ${this.battery}/${this.maxBattery}`;
            
            // Color based on battery level
            if (this.battery <= 2) {
                batteryEl.style.color = '#f00';
            } else if (this.battery <= 4) {
                batteryEl.style.color = '#ff0';
            } else {
                batteryEl.style.color = '#0f0';
            }
        }
    }

    die(reason) {
        if (this.isDead) return;
        
        this.isDead = true;
        console.log('GAME OVER:', reason);
        
        // Stop all enemy sounds
        if (this.enemyWalkingSound && !this.enemyWalkingSound.paused) {
            this.enemyWalkingSound.pause();
            this.enemyWalkingSound.currentTime = 0;
        }
        if (this.enemyRunningSound && !this.enemyRunningSound.paused) {
            this.enemyRunningSound.pause();
            this.enemyRunningSound.currentTime = 0;
        }
        if (this.aggressiveRunningSound && !this.aggressiveRunningSound.paused) {
            this.aggressiveRunningSound.pause();
            this.aggressiveRunningSound.currentTime = 0;
        }
        
        // Show death screen
        const deathScreen = document.getElementById('deathScreen');
        const deathReason = document.getElementById('deathReason');
        
        if (deathScreen && deathReason) {
            deathReason.textContent = reason;
            deathScreen.style.display = 'flex';
        }
        
        // Release pointer lock
        document.exitPointerLock();
    }

    checkAndScanNearbyEnemies() {
        // Check if any wandering enemy is within auto-scan range
        for (const wEnemy of this.wanderingEnemies) {
            if (wEnemy.fleeing) continue;
            
            const distance = this.player.position.distanceTo(wEnemy.position);
            
            if (distance <= this.enemyAutoScanRange) {
                // Enemy is close, perform targeted scan
                this.autoScanEnemy(wEnemy);
                return; // Only scan one enemy at a time
            }
        }
    }

    autoScanEnemy(enemy) {
        // Perform a focused scan on the enemy
        const rayCount = 200; // Lighter scan than full scan
        const currentTime = this.clock.getElapsedTime();
        
        for (let i = 0; i < rayCount; i++) {
            // Random direction toward enemy with some spread
            const toEnemy = new THREE.Vector3().subVectors(enemy.position, this.camera.position);
            const distance = toEnemy.length();
            
            // Add randomness to create a cone toward enemy
            const spread = 0.3;
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            );
            
            const direction = toEnemy.normalize().add(randomOffset).normalize();
            
            const raycaster = new THREE.Raycaster(
                this.camera.position.clone(),
                direction,
                0,
                this.enemyAutoScanRange
            );
            
            // Check for enemy hit
            const enemyHit = this.raycastSingleEnemy(raycaster, enemy);
            if (enemyHit) {
                this.createSurfacePoints(enemyHit.point, enemyHit.normal, currentTime, true);
            }
        }
    }

    raycastSingleEnemy(raycaster, enemy) {
        // Raycast against a single enemy's humanoid shape
        const bodyParts = [
            { offset: new THREE.Vector3(0, 1.6, 0), radius: 0.2 }, // head
            { offset: new THREE.Vector3(0, 1.0, 0), radius: 0.3 }, // torso upper
            { offset: new THREE.Vector3(0, 0.5, 0), radius: 0.25 }, // torso lower
            { offset: new THREE.Vector3(-0.3, 1.0, 0), radius: 0.15 }, // left arm
            { offset: new THREE.Vector3(0.3, 1.0, 0), radius: 0.15 }, // right arm
            { offset: new THREE.Vector3(-0.15, 0, 0), radius: 0.15 }, // left leg
            { offset: new THREE.Vector3(0.15, 0, 0), radius: 0.15 }  // right leg
        ];

        let closestHit = null;
        let closestDistance = Infinity;

        for (const part of bodyParts) {
            const partPos = enemy.position.clone().add(part.offset);
            const toEnemy = new THREE.Vector3().subVectors(partPos, raycaster.ray.origin);
            const distance = toEnemy.length();
            
            if (distance > this.enemyAutoScanRange) continue;
            
            const projection = toEnemy.dot(raycaster.ray.direction);
            if (projection < 0) continue;
            
            const closestPoint = new THREE.Vector3()
                .copy(raycaster.ray.direction)
                .multiplyScalar(projection)
                .add(raycaster.ray.origin);
            
            const distToPart = closestPoint.distanceTo(partPos);
            
            if (distToPart <= part.radius && distance < closestDistance) {
                closestDistance = distance;
                closestHit = {
                    point: closestPoint,
                    normal: new THREE.Vector3().subVectors(closestPoint, partPos).normalize(),
                    distance: distance
                };
            }
        }

        return closestHit;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        if (!this.isDead) {
            this.updatePlayer(deltaTime);
            this.updateWanderingEnemies(deltaTime);
            this.checkNearbyTables();
            
            // Update cooldowns
            if (this.flashlightCooldown > 0) {
                this.flashlightCooldown -= deltaTime;
            }
            
            // Auto-scan for nearby enemies
            if (this.enemyAutoScanCooldown > 0) {
                this.enemyAutoScanCooldown -= deltaTime;
            } else {
                this.checkAndScanNearbyEnemies();
                this.enemyAutoScanCooldown = this.enemyAutoScanInterval;
            }
        }
        
        this.updatePointCloud();
        this.renderer.render(this.scene, this.camera);
    }

    checkNearbyTables() {
        if (this.inDiceGame || this.isDead) return;
        
        const interactionRange = 3.0;
        let foundNearbyTable = false;
        
        for (const table of this.tables) {
            const distance = this.player.position.distanceTo(table.position);
            if (distance <= interactionRange && !table.used) {
                foundNearbyTable = true;
                this.nearbyTable = table;
                break;
            }
        }
        
        // Update interaction prompt
        const prompt = document.getElementById('interactionPrompt');
        if (foundNearbyTable && prompt) {
            prompt.style.display = 'block';
        } else if (prompt) {
            prompt.style.display = 'none';
            this.nearbyTable = null;
        }
    }
}

// Start the game
window.addEventListener('load', () => {
    const game = new LiDARGame();
});
