        // Game constants
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;
        const TILE_SIZE = 32;

        // Weapon types
        const WEAPONS = {
            SWORD: {
                name: 'Sword',
                damage: 25,
                range: TILE_SIZE * 1.5,
                cooldown: 500,
                color: '#c0c0c0',
                type: 'melee',
                arcSize: Math.PI/3
            },
            SCYTHE: {
                name: 'Scythe',
                damage: 50,
                range: TILE_SIZE * 0.5,
                cooldown: 200,
                color: '#800080',
                type: 'spinning',
                orbitRadius: TILE_SIZE * 2.5
            },
            DRAGON_SWORD: {
                name: 'Dragon Sword',
                damage: 40,
                range: TILE_SIZE * 2,
                cooldown: 400,
                color: '#f55',
                type: 'melee',
                arcSize: Math.PI/3
            },
            BOW: {
                name: 'Piercing Bow',
                damage: 20,
                range: TILE_SIZE * 8,
                cooldown: 800,
                projectileSpeed: 16,
                color: '#8b4513',
                type: 'ranged',
                piercing: true
            },
            DRAGON_BOW: {
                name: 'Dragon Bow',
                damage: 30,
                range: TILE_SIZE * 8,
                cooldown: 400,
                projectileSpeed: 20,
                color: '#f77',
                type: 'ranged',
                piercing: true
            }
        };

        // Enemy types
        const ENEMY_TYPES = {
            SKELETON: {
                health: 30,
                damage: 5,
                speed: 159,
                color: '#8B8B8B',
                width: TILE_SIZE,
                height: TILE_SIZE,
                points: 100
            },
            SLIME: {
                health: 60,
                damage: 15,
                speed: 140,
                color: '#00AA00',
                width: TILE_SIZE,
                height: TILE_SIZE * 0.75,
                points: 150
            },
            DRAGON: {
                health: 1200,  // 20x slime health
                damage: 50,    // Can kill in 2 hits (player has 100 hp)
                speed: 0.15,
                color: '#FF0000',
                width: TILE_SIZE * 3,
                height: TILE_SIZE * 3,
                points: 1000,
                isBoss: true
            }
        };

        // Keybind configuration
        const defaultKeybinds = {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            shoot: ' ',
            interact: 'e',
            pause: 'p'
        };

        // Available player skins
        const PLAYER_SKINS = [
            { name: 'Purple', color: '#800080' },
            { name: 'Red', color: '#ff0000' },
            { name: 'Blue', color: '#0000ff' },
            { name: 'Green', color: '#00ff00' },
            { name: 'Gold', color: '#ffd700' },
            { name: 'Cyan', color: '#00ffff' }
        ];

        // Konami code detector
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;

        // Game state
        // Load saved game state from localStorage
        const savedSkinsUnlocked = localStorage.getItem('skinsUnlocked') === 'true';
        // Load saved game state from localStorage

        const gameState = {
            gameMode: 'normal',
            player: {
                x: CANVAS_WIDTH / 2,
                y: CANVAS_HEIGHT / 2,
                width: TILE_SIZE,
                height: TILE_SIZE,
                speed: 160,
                health: 100,
                maxHealth: 100,
                weapons: [],
                lastAttacks: {},
                invulnerable: false,

                permanentInvulnerability: false,
                invulnerabilityDuration: 1000,
                lastHit: 0,
                rotation: 0,
                skin: PLAYER_SKINS[0], // Default skin
                highestFloor: 0, // Track highest floor reached
                skinsUnlocked: savedSkinsUnlocked, // Load from localStorage
                cheatsEnabled: false, // Track if cheats are enabled

            },
            enemies: [],
            projectiles: [],
            openWorld: {
                time: 0, // Current time in the day/night cycle
                isNight: false,
                buildings: [], // Array of buildings (sheds, toilets)
                spawnedWeapons: [], // Weapons currently in the world
                DAY_DURATION: 90000, // 1.5 minutes in milliseconds
                NIGHT_DURATION: 120000 // 2 minutes in milliseconds
            },
            currentFloor: 0,  // Start at 0 so first floor will be 1
            floorCleared: true,  // Start cleared so first floor will spawn
            isPaused: false,
            settings: {
                keybinds: { ...defaultKeybinds }  // Clone default keybinds
            },

            enemyHPMultiplier: 1,  // Will be doubled after each boss
            gameStarted: false,  // Track if game has started
            showMainMenu: true,  // Show main menu by default
            showSkinMenu: false,  // Skin selection menu state
            gameCompleted: false,  // Track if player has beaten floor 100
            timeScale: 1  // Ensure movement speed works correctly
        };

        // Input handling
        const keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        let mouseX = 0;
        let mouseY = 0;
        let gameLoopRunning = false;

        // Get canvas and context
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Setup main menu
        function setupMainMenu() {
            const mainMenu = document.createElement('div');
            mainMenu.id = 'mainMenu';
            mainMenu.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: url('images/dungeon-door.png') center/cover no-repeat;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                padding: 40px;
                text-align: center;
                min-width: 300px;
            `;

            const title = document.createElement('h1');
            title.textContent = 'Dungeon Crawler';
            title.style.cssText = `
                color: white;
                font-size: 48px;
                margin: 0 0 30px 0;
                text-shadow: 0 0 10px #fff;
            `;

            const buttonStyle = `
                background-color: #333;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 18px;
                margin: 10px 0;
                width: 100%;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // Helper function for button hover effects
            const addButtonHoverEffects = (button, isStart = false, isDisabled = false) => {
                if (isDisabled) {
                    button.style.cursor = 'not-allowed';
                    return;
                }
                
                button.addEventListener('mouseenter', () => {
                    button.style.transform = 'scale(1.05)';
                    if (isStart) {
                        button.style.backgroundColor = '#2a5';
                    } else {
                        button.style.backgroundColor = '#444';
                    }
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'scale(1)';
                    button.style.backgroundColor = '#333';
                });
            };

            const startButton = document.createElement('button');
            startButton.textContent = 'Start Game';
            startButton.style.cssText = buttonStyle;
            startButton.onclick = startGame;
            addButtonHoverEffects(startButton, true);

            const settingsButton = document.createElement('button');
            settingsButton.textContent = 'Settings';
            settingsButton.style.cssText = buttonStyle;
            settingsButton.onclick = () => {
                document.getElementById('mainMenu').style.display = 'none';
                document.getElementById('settingsMenu').style.display = 'flex';
            };
            addButtonHoverEffects(settingsButton);

            const skinsButton = document.createElement('button');
            skinsButton.textContent = gameState.player.skinsUnlocked ? 'Change Skin' : 'Skins (Unlock at Floor 100)';
            skinsButton.style.cssText = buttonStyle + (gameState.player.skinsUnlocked ? '' : 'opacity: 0.5;');

            // Custom hover effects for skins button
            skinsButton.addEventListener('mouseenter', () => {
                if (gameState.player.skinsUnlocked) {
                    skinsButton.style.transform = 'scale(1.05)';
                    skinsButton.style.backgroundColor = '#444';
                }
            });

            skinsButton.addEventListener('mouseleave', () => {
                if (gameState.player.skinsUnlocked) {
                    skinsButton.style.transform = 'scale(1)';
                    skinsButton.style.backgroundColor = '#333';
                }
            });

            skinsButton.onclick = () => {
                if (gameState.player.skinsUnlocked) {
                    showSkinMenu();
                }
            };



            content.appendChild(title);
            content.appendChild(startButton);
            content.appendChild(settingsButton);
            content.appendChild(skinsButton);

            
            mainMenu.appendChild(content);
            document.body.appendChild(mainMenu);
        }

        // Setup skin menu
        function setupSkinMenu() {
            const skinMenu = document.createElement('div');
            skinMenu.id = 'skinMenu';
            skinMenu.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                cursor: default !important;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background-color: rgba(20, 20, 20, 0.95);
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                min-width: 400px;
            `;

            const title = document.createElement('h1');
            title.textContent = 'Select Skin';
            title.style.cssText = `
                color: white;
                font-size: 36px;
                margin: 0 0 30px 0;
            `;

            const skinsGrid = document.createElement('div');
            skinsGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            `;

            PLAYER_SKINS.forEach(skin => {
                const skinOption = document.createElement('div');
                skinOption.style.cssText = `
                    background-color: ${skin.color};
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    margin: 10px auto;
                    transition: transform 0.3s ease;
                    border: 3px solid ${skin === gameState.player.skin ? '#fff' : 'transparent'};
                    cursor: default !important;
                `;
                skinOption.onmouseover = () => skinOption.style.transform = 'scale(1.1)';
                skinOption.onmouseout = () => skinOption.style.transform = 'scale(1)';
                skinOption.onclick = () => {
                    // First stop any existing game loop
                    const wasRunning = gameLoopRunning;
                    gameLoopRunning = false;
                    
                    // Update skin
                    gameState.player.skin = skin;
                    document.querySelectorAll('#skinMenu .skin-option').forEach(opt => {
                        opt.style.border = '3px solid transparent';
                    });
                    skinOption.style.border = '3px solid #fff';
                    
                    // Restart game loop if it was running
                    if (wasRunning) {
                        gameLoopRunning = true;
                        gameLoop();
                    }
                };
                skinOption.className = 'skin-option';
                
                const skinName = document.createElement('div');
                skinName.textContent = skin.name;
                skinName.style.cssText = `
                    color: white;
                    margin-top: 5px;
                    font-size: 14px;
                `;

                const skinContainer = document.createElement('div');
                skinContainer.appendChild(skinOption);
                skinContainer.appendChild(skinName);
                skinsGrid.appendChild(skinContainer);
            });

            const backButton = document.createElement('button');
            backButton.textContent = 'Back';
            backButton.className = 'pause-button';
            backButton.onclick = () => {
                // Ensure game loop is stopped when returning to main menu
                gameLoopRunning = false;
                skinMenu.style.display = 'none';
                document.getElementById('mainMenu').style.display = 'flex';
            };

            content.appendChild(title);
            content.appendChild(skinsGrid);
            content.appendChild(backButton);
            skinMenu.appendChild(content);
            document.body.appendChild(skinMenu);
        }

        function showSkinMenu() {
            // Make sure game is fully stopped
            gameLoopRunning = false;
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('skinMenu').style.display = 'flex';
        }

        function startGame() {
            const mainMenu = document.getElementById('mainMenu');
            const doorTransition = document.querySelector('.door-transition');
            
            // Show and start the transition immediately
            doorTransition.style.display = 'block';
            doorTransition.style.backgroundColor = 'transparent';
            
            // Force a reflow to ensure the transition starts
            doorTransition.offsetHeight;
            
            // Start transition
            doorTransition.classList.add('active');
            
            // Add black background near the end of the zoom
            setTimeout(() => {
                doorTransition.style.backgroundColor = 'black';
            }, 1700);
            
            // After transition completes
            setTimeout(() => {
                mainMenu.style.display = 'none';
                doorTransition.classList.remove('active');
                doorTransition.style.display = 'none';
                gameState.gameStarted = true;
                setupWeaponSelection(false);
            }, 2200);
        }

        // Setup weapon selection
        function setupWeaponSelection(isBossReward = false) {
            const weaponOptions = document.getElementById('weaponOptions');
            const container = document.getElementById('weaponSelect');
            const gameContainer = document.getElementById('gameContainer');
            
            weaponOptions.innerHTML = '';
            const title = document.querySelector('.weapon-container h2');
            
            if (isBossReward) {
                title.textContent = 'Choose an Additional Weapon';
                // Double enemy HP after boss fight
                gameState.enemyHPMultiplier *= 2;
            } else {
                title.textContent = 'Choose Your Starting Weapon';
                gameContainer.style.display = 'none';
            }

            container.style.display = 'flex';
            
            // Get available weapons
            let weaponsList = Object.entries(WEAPONS);
            
            // If this is the starting weapon selection, make dragon weapons very rare (5% chance)
            if (!isBossReward && Math.random() > 0.05) {
                weaponsList = weaponsList.filter(([id]) => !id.includes('DRAGON'));
            }
            
            // Shuffle the available weapons
            for (let i = weaponsList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [weaponsList[i], weaponsList[j]] = [weaponsList[j], weaponsList[i]];
            }

            // Take first 3 weapons
            weaponsList.slice(0, 3).forEach(([id, weapon]) => {
                const option = document.createElement('div');
                option.className = 'weapon-choice';
                option.style.border = `2px solid ${weapon.color}`;
                
                let description;
                if (weapon.type === 'melee') {
                    description = `A ${weapon.name.toLowerCase()} that deals ${weapon.damage} damage in a ${Math.round(weapon.arcSize * 180 / Math.PI)}° arc`;
                } else if (weapon.type === 'spinning') {
                    description = `A mystical ${weapon.name.toLowerCase()} that orbits around you, dealing ${weapon.damage} damage to anything it touches`;
                } else if (weapon.type === 'ranged') {
                    description = `A powerful ${weapon.name.toLowerCase()} that shoots ${weapon.piercing ? 'piercing' : ''} projectiles dealing ${weapon.damage} damage`;
                }
                
                option.innerHTML = `
                    <h3 style="color: ${weapon.color}; margin: 0 0 10px 0;">${weapon.name}</h3>
                    <div style="color: #aaa; margin: 10px 0; font-size: 14px;">
                        ${description}
                    </div>
                    <div style="margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Damage:</span>
                            <span style="color: ${weapon.color}">${weapon.damage}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Speed:</span>
                            <span style="color: ${weapon.color}">${(1000/weapon.cooldown).toFixed(1)} /s</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Range:</span>
                            <span style="color: ${weapon.color}">${(weapon.range/TILE_SIZE).toFixed(1)}x</span>
                        </div>
                    </div>
                    <div style="padding: 10px; background-color: ${weapon.color}; color: black; border-radius: 5px; margin-top: 10px; font-weight: bold;">
                        ${weapon.type.toUpperCase()}
                    </div>
                `;
                
                option.onclick = () => {
                    const newWeapon = { ...weapon, id };
                    
                    if (isBossReward) {
                        gameState.player.weapons.push(newWeapon);
                        container.style.display = 'none';
                        gameState.floorCleared = true;  // Move to next floor
                        gameLoopRunning = true;  // Ensure the game loop is running
                        gameLoop();  // Restart the game loop
                    } else {
                        // First stop any existing game loop
                        gameLoopRunning = false;
                        gameState.player.weapons = [newWeapon];
                        container.style.display = 'none';
                        gameContainer.style.display = 'block';

                        // Initialize open world specific state if in open world mode
                        if (gameState.gameMode === 'openWorld') {
                            // Generate initial buildings
                            const buildingTypes = ['shed', 'toilet'];
                            gameState.openWorld.buildings = [];
                            gameState.openWorld.spawnedWeapons = [];
                            for (let i = 0; i < 5; i++) {
                                const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                                const x = Math.random() * (CANVAS_WIDTH - 120);
                                const y = Math.random() * (CANVAS_HEIGHT - 100);
                                gameState.openWorld.buildings.push(generateBuilding(type, x, y));
                            }
                        }

                        gameState.gameStarted = true;
                        gameLoopRunning = true;
                        gameLoop();
                    }
                };
                
                weaponOptions.appendChild(option);
            });
        }

        function detectCollision(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }

        // Game functions

        // Event listeners
        // Pause control functions
        function pauseGame() {
            if (!gameLoopRunning || document.getElementById('gameOver').style.display === 'flex') return;
            
            // Move enemies slightly away from player if they're touching to prevent damage during pause
            const playerCenterX = gameState.player.x + gameState.player.width/2;
            const playerCenterY = gameState.player.y + gameState.player.height/2;
            
            gameState.enemies.forEach(enemy => {
                if (detectCollision(gameState.player, enemy)) {
                    const dx = enemy.x + enemy.width/2 - playerCenterX;
                    const dy = enemy.y + enemy.height/2 - playerCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist === 0) return; // Avoid division by zero
                    
                    const pushDistance = enemy.width + gameState.player.width;
                    enemy.x = playerCenterX + (dx / dist) * pushDistance - enemy.width/2;
                    enemy.y = playerCenterY + (dy / dist) * pushDistance - enemy.height/2;
                }
            });
            
            // Make player temporarily invulnerable when pausing
            gameState.player.invulnerable = true;
            gameState.player.lastHit = Date.now();
            
            gameState.isPaused = true;
            document.getElementById('pauseMenu').style.display = 'flex';
        }

        function resumeGame() {
            // Give the player a brief invulnerability period after unpausing
            gameState.player.invulnerable = true;
            gameState.player.lastHit = Date.now();
            
            gameState.isPaused = false;
            document.getElementById('pauseMenu').style.display = 'none';
        }

        let listeningForKey = null;

        function toggleSettings() {
            document.getElementById('pauseMenu').style.display = 'none';
            document.getElementById('settingsMenu').style.display = 'flex';
            updateKeybindDisplay();
        }

        function closeSettings() {
            document.getElementById('settingsMenu').style.display = 'none';
            // Only show pause menu if we're in game, otherwise show main menu
            if (gameState.gameStarted) {
                document.getElementById('pauseMenu').style.display = 'flex';
            } else {
                document.getElementById('mainMenu').style.display = 'flex';
            }
        }

        function updateKeybindDisplay() {
            document.querySelectorAll('.keybind-button').forEach(button => {
                const action = button.dataset.action;
                button.textContent = gameState.settings.keybinds[action].toUpperCase();
            });
        }

        function startListeningForKey(button) {
            // Remove listening state from any other buttons
            document.querySelectorAll('.keybind-button').forEach(btn => {
                btn.classList.remove('listening');
            });
            
            button.classList.add('listening');
            button.textContent = 'Press Key...';
            listeningForKey = button.dataset.action;
        }

        function setKeybind(action, key) {
            const oldKey = gameState.settings.keybinds[action];
            const normalizedKey = key.toLowerCase();
            
            // Remove the old key binding
            if (oldKey in keys) {
                delete keys[oldKey];
            }
            
            // Add the new key binding
            gameState.settings.keybinds[action] = normalizedKey;
            keys[normalizedKey] = false;
            
            // Update display
            updateKeybindDisplay();
        }

        // Set up keybind button listeners
        document.querySelectorAll('.keybind-button').forEach(button => {
            button.addEventListener('click', () => startListeningForKey(button));
        });

        // Function to show cheat menu
        function showCheatMenu() {
            const cheatMenu = document.createElement('div');
            cheatMenu.id = 'cheatMenu';
            cheatMenu.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background-color: rgba(20, 20, 20, 0.95);
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                min-width: 300px;
            `;

            const title = document.createElement('h1');
            title.textContent = 'Cheat Menu';
            title.style.cssText = `
                color: #ff0000;
                font-size: 36px;
                margin: 0 0 30px 0;
                text-shadow: 0 0 10px #ff0000;
            `;

            const buttonStyle = `
                background-color: #333;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 18px;
                margin: 10px 0;
                width: 100%;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // Weapon selection section
            const weaponSection = document.createElement('div');
            weaponSection.style.cssText = 'margin: 20px 0; text-align: left;';
            
            const weaponTitle = document.createElement('h3');
            weaponTitle.textContent = 'Weapon Selection';
            weaponTitle.style.cssText = 'color: white; margin-bottom: 10px;';
            weaponSection.appendChild(weaponTitle);

            const weapons = ['Piercing bow', 'Sword', 'Scythe', 'Dragon bow', 'Dragon sword'];
            
            // Add amount selector
            const amountControl = document.createElement('div');
            amountControl.style.cssText = 'margin-bottom: 20px; display: flex; align-items: center;';
            
            const amountLabel = document.createElement('label');
            amountLabel.textContent = 'Stack amount: ';
            amountLabel.style.color = 'white';
            amountLabel.style.marginRight = '10px';
            
            const amountInput = document.createElement('input');
            amountInput.type = 'number';
            amountInput.min = '1';
            amountInput.max = '5';
            amountInput.value = '1';
            amountInput.style.cssText = 'width: 60px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
            
            amountControl.appendChild(amountLabel);
            amountControl.appendChild(amountInput);
            weaponSection.appendChild(amountControl);

            // Create confirm button
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirm Weapons';
            confirmButton.style.cssText = buttonStyle + 'margin-top: 20px;';
            
            // Add hover effect for confirm button
            confirmButton.addEventListener('mouseenter', () => {
                confirmButton.style.transform = 'scale(1.05)';
                confirmButton.style.backgroundColor = '#2a5';
            });
            
            confirmButton.addEventListener('mouseleave', () => {
                confirmButton.style.transform = 'scale(1)';
                // Only return to grey if not in "updated" state
                if (confirmButton.textContent !== 'Weapons Updated!') {
                    confirmButton.style.backgroundColor = '#333';
                }
            });
            
            weapons.forEach(weapon => {
                const weaponControl = document.createElement('div');
                weaponControl.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center;';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = weapon.replace(/\s+/g, '') + 'Check';
                checkbox.checked = gameState.player.weapons.some(w => w.id === weapon);
                checkbox.style.marginRight = '10px';
                
                const label = document.createElement('label');
                label.htmlFor = weapon.replace(/\s+/g, '') + 'Check';
                label.textContent = weapon;
                label.style.color = 'white';
                
                weaponControl.appendChild(checkbox);
                weaponControl.appendChild(label);
                weaponSection.appendChild(weaponControl);
            });

            // Floor selection section
            const floorSection = document.createElement('div');
            floorSection.style.cssText = 'margin: 20px 0; text-align: left;';
            
            const floorTitle = document.createElement('h3');
            floorTitle.textContent = 'Floor Selection';
            floorTitle.style.cssText = 'color: white; margin-bottom: 10px;';
            floorSection.appendChild(floorTitle);

            const floorControl = document.createElement('div');
            floorControl.style.cssText = 'display: flex; align-items: center; gap: 10px;';

            const floorInput = document.createElement('input');
            floorInput.type = 'number';
            floorInput.min = '1';
            floorInput.value = gameState.currentFloor || 1;
            floorInput.style.cssText = 'width: 80px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
            
            const setFloorBtn = document.createElement('button');
            setFloorBtn.textContent = 'Set Floor';
            setFloorBtn.style.cssText = buttonStyle + 'width: auto; margin: 0;';
            
            // Add hover effect for set floor button
            setFloorBtn.addEventListener('mouseenter', () => {
                setFloorBtn.style.transform = 'scale(1.05)';
                setFloorBtn.style.backgroundColor = '#2a5';
            });
            
            setFloorBtn.addEventListener('mouseleave', () => {
                setFloorBtn.style.transform = 'scale(1)';
                if (setFloorBtn.textContent !== 'Floor Set!') {
                    setFloorBtn.style.backgroundColor = '#333';
                }
            });
            
            setFloorBtn.onclick = () => {
                gameState.player.cheatsEnabled = true;
                const newFloor = parseInt(floorInput.value);
                gameState.currentFloor = newFloor;
                gameState.score = (newFloor - 1) * 100;
                gameState.floorCleared = true; // Force new floor to generate
                if (newFloor >= 100) {
                    gameState.player.skinsUnlocked = true;
                }
                
                // Visual feedback
                setFloorBtn.style.backgroundColor = '#2a5';
                setFloorBtn.textContent = 'Floor Set!';
                setTimeout(() => {
                    if (!setFloorBtn.matches(':hover')) {
                        setFloorBtn.style.backgroundColor = '#333';
                    }
                    setFloorBtn.textContent = 'Set Floor';
                }, 1000);
                if (gameState.currentFloor >= 100) {
                    gameState.player.skinsUnlocked = true;
                }
            };
            
            floorControl.appendChild(floorInput);
            floorControl.appendChild(setFloorBtn);
            floorSection.appendChild(floorControl);

            const invincibilityButton = document.createElement('button');
            invincibilityButton.textContent = 'Toggle Permanent Invincibility';
            invincibilityButton.style.cssText = buttonStyle;
            
            // Add hover effect for invincibility button
            invincibilityButton.addEventListener('mouseenter', () => {
                invincibilityButton.style.transform = 'scale(1.05)';
                invincibilityButton.style.backgroundColor = '#2a5';
            });
            
            invincibilityButton.addEventListener('mouseleave', () => {
                invincibilityButton.style.transform = 'scale(1)';
                invincibilityButton.style.backgroundColor = gameState.player.permanentInvulnerability ? '#2a5' : '#333';
            });
            
            invincibilityButton.onclick = () => {
                gameState.player.cheatsEnabled = true;
                gameState.player.permanentInvulnerability = !gameState.player.permanentInvulnerability;
                gameState.player.invulnerable = gameState.player.permanentInvulnerability;
                invincibilityButton.style.backgroundColor = gameState.player.permanentInvulnerability ? '#2a5' : '#333';
                invincibilityButton.textContent = gameState.player.permanentInvulnerability ? 'Permanent Invincibility: ON' : 'Toggle Permanent Invincibility';
            };

            const unlockSkinsButton = document.createElement('button');
            unlockSkinsButton.textContent = 'Unlock All Skins';
            unlockSkinsButton.style.cssText = buttonStyle;
            
            // Add hover effect for unlock skins button
            unlockSkinsButton.addEventListener('mouseenter', () => {
                unlockSkinsButton.style.transform = 'scale(1.05)';
                unlockSkinsButton.style.backgroundColor = '#2a5';
            });
            
            unlockSkinsButton.addEventListener('mouseleave', () => {
                unlockSkinsButton.style.transform = 'scale(1)';
                unlockSkinsButton.style.backgroundColor = gameState.player.skinsUnlocked ? '#2a5' : '#333';
            });
            
            unlockSkinsButton.onclick = () => {
                // Stop any running game loop
                gameLoopRunning = false;
                
                gameState.player.cheatsEnabled = true;
                gameState.player.skinsUnlocked = true;
                localStorage.setItem('skinsUnlocked', 'true');  // Save to localStorage
                unlockSkinsButton.style.backgroundColor = '#2a5';
                unlockSkinsButton.textContent = 'All Skins Unlocked!';
                
                // Update skins button in main menu
                const skinsButton = document.querySelector('#mainMenu button:nth-child(4)');
                if (skinsButton) {
                    skinsButton.textContent = 'Change Skin';
                    skinsButton.style.opacity = '1';
                    
                    // Add hover effects to the skins button
                    skinsButton.addEventListener('mouseenter', () => {
                        skinsButton.style.transform = 'scale(1.05)';
                        skinsButton.style.backgroundColor = '#444';
                    });
                    
                    skinsButton.addEventListener('mouseleave', () => {
                        skinsButton.style.transform = 'scale(1)';
                        skinsButton.style.backgroundColor = '#333';
                    });
                }
                
                // Clean up any existing skin menu
                const existingSkinMenu = document.getElementById('skinMenu');
                if (existingSkinMenu) {
                    document.body.removeChild(existingSkinMenu);
                }
                // Recreate skin menu to ensure proper styles
                setupSkinMenu();
            };

            const oneHitKillButton = document.createElement('button');
            oneHitKillButton.textContent = 'Toggle One-Hit Kill';
            oneHitKillButton.style.cssText = buttonStyle;
            
            // Add hover effect for one-hit kill button
            oneHitKillButton.addEventListener('mouseenter', () => {
                oneHitKillButton.style.transform = 'scale(1.05)';
                oneHitKillButton.style.backgroundColor = '#2a5';
            });
            
            oneHitKillButton.addEventListener('mouseleave', () => {
                oneHitKillButton.style.transform = 'scale(1)';
                oneHitKillButton.style.backgroundColor = gameState.player.oneHitKill ? '#2a5' : '#333';
            });
            
            oneHitKillButton.onclick = () => {
                gameState.player.cheatsEnabled = true;
                gameState.player.oneHitKill = !gameState.player.oneHitKill;
                oneHitKillButton.style.backgroundColor = gameState.player.oneHitKill ? '#2a5' : '#333';
                oneHitKillButton.textContent = gameState.player.oneHitKill ? 'One-Hit Kill: ON' : 'Toggle One-Hit Kill';
            };

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.cssText = buttonStyle;
            
            // Add simple hover effect for close button
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.transform = 'scale(1.05)';
                closeButton.style.backgroundColor = '#444';
            });
            
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.transform = 'scale(1)';
                closeButton.style.backgroundColor = '#333';
            });
            
            closeButton.onclick = () => {
                document.body.removeChild(cheatMenu);
                document.getElementById('pauseMenu').style.display = 'flex';
            };

            // Add confirm button functionality
            confirmButton.onclick = () => {
                gameState.player.cheatsEnabled = true;
                // Clear existing weapons
                gameState.player.weapons = [];
                
                // Add selected weapons with their stack amounts
                weapons.forEach(weapon => {
                    const checkbox = document.getElementById(weapon.replace(/\s+/g, '') + 'Check');
                    if (checkbox.checked) {
                        const amount = parseInt(amountInput.value);
                        for (let i = 0; i < amount; i++) {
                            const weaponKey = weapon.replace(/\s+/g, '_').toUpperCase();
                            const weaponData = {...WEAPONS[weaponKey]};
                            weaponData.id = weaponKey;
                            gameState.player.weapons.push(weaponData);
                        }
                    }
                });
                
                // Visual feedback
                confirmButton.style.backgroundColor = '#2a5';
                confirmButton.textContent = 'Weapons Updated!';
                setTimeout(() => {
                    if (!confirmButton.matches(':hover')) {
                        confirmButton.style.backgroundColor = '#333';
                    }
                    confirmButton.textContent = 'Confirm Weapons';
                }, 1000);
            };

            // Add weapon confirm button to the weapon section
            weaponSection.appendChild(confirmButton);



            content.appendChild(title);
            content.appendChild(weaponSection);
            content.appendChild(floorSection);
            content.appendChild(invincibilityButton);
            content.appendChild(unlockSkinsButton);
            content.appendChild(oneHitKillButton);
            content.appendChild(closeButton);
            cheatMenu.appendChild(content);
            document.body.appendChild(cheatMenu);
        }

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Check for Konami code when game is paused
            if (gameState.isPaused && document.getElementById('pauseMenu').style.display === 'flex') {
                const currentKey = konamiCode[konamiIndex].toLowerCase();
                if (key === currentKey) {
                    konamiIndex++;
                    if (konamiIndex === konamiCode.length) {
                        konamiIndex = 0;
                        document.getElementById('pauseMenu').style.display = 'none';
                        showCheatMenu();
                    }
                } else {
                    konamiIndex = 0;
                }
            }
            
            // Handle keybinding
            if (listeningForKey) {
                // Don't allow binding Escape key as it's used for pause
                if (key !== 'escape') {
                    setKeybind(listeningForKey, key);
                }
                document.querySelector('.keybind-button.listening').classList.remove('listening');
                listeningForKey = null;
                return;
            }

            // Handle pause
            if (key === 'escape') {
                if (gameState.isPaused) {
                    if (document.getElementById('settingsMenu').style.display === 'flex') {
                        closeSettings();
                    } else {
                        resumeGame();
                    }
                } else {
                    pauseGame();
                }
                return;
            }

            // Handle movement
            Object.entries(gameState.settings.keybinds).forEach(([action, boundKey]) => {
                if (key === boundKey) {
                    keys[boundKey] = true;
                }
            });
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            Object.values(gameState.settings.keybinds).forEach(boundKey => {
                if (key === boundKey) {
                    keys[boundKey] = false;
                }
            });
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        function attack() {
            if (gameState.isPaused || gameState.player.health <= 0 || gameState.deathSequence) return;
            
            const now = Date.now();
            const playerCenterX = gameState.player.x + gameState.player.width/2;
            const playerCenterY = gameState.player.y + gameState.player.height/2;
            
            // Find closest enemy for targeting
            let closestEnemy = null;
            let closestDistance = Infinity;

            gameState.enemies.forEach(enemy => {
                const enemyCenterX = enemy.x + enemy.width/2;
                const enemyCenterY = enemy.y + enemy.height/2;
                const dx = enemyCenterX - playerCenterX;
                const dy = enemyCenterY - playerCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });

            if (!closestEnemy) return;

            // Group weapons by their ID to handle stacking
            const weaponGroups = {};
            gameState.player.weapons.forEach(weapon => {
                if (!weaponGroups[weapon.id]) {
                    weaponGroups[weapon.id] = [];
                }
                weaponGroups[weapon.id].push(weapon);
            });

            // Process each weapon group
            Object.values(weaponGroups).forEach(weapons => {
                const weapon = weapons[0]; // Base weapon
                const count = weapons.length; // Number of stacked weapons
                
                // Check weapon cooldown (faster with more weapons)
                const scaledCooldown = weapon.cooldown / count;
                if (now - (gameState.player.lastAttacks[weapon.id] || 0) < scaledCooldown) return;
                
                // Update last attack time for this weapon
                gameState.player.lastAttacks[weapon.id] = now;
                
                // Update player rotation to face the closest enemy
                gameState.player.rotation = Math.atan2(
                    closestEnemy.y + closestEnemy.height/2 - playerCenterY,
                    closestEnemy.x + closestEnemy.width/2 - playerCenterX
                );

                if (weapon.type === 'ranged') {
                    // Add some lead to the shot based on enemy movement
                    const leadTime = closestDistance / weapon.projectileSpeed;
                    const predictedX = closestEnemy.x + (closestEnemy.dx || 0) * leadTime;
                    const predictedY = closestEnemy.y + (closestEnemy.dy || 0) * leadTime;
                    
                    // Create multiple projectiles based on weapon count
                    for (let i = 0; i < count; i++) {
                        const spreadAngle = (i - (count-1)/2) * 0.1; // Slight spread for multiple projectiles
                        const leadAngle = Math.atan2(
                            predictedY + closestEnemy.height/2 - playerCenterY,
                            predictedX + closestEnemy.width/2 - playerCenterX
                        ) + spreadAngle;

                        gameState.projectiles.push({
                            x: playerCenterX,
                            y: playerCenterY,
                            dx: Math.cos(leadAngle) * weapon.projectileSpeed,
                            dy: Math.sin(leadAngle) * weapon.projectileSpeed,
                            width: 8,
                            height: 8,
                            damage: gameState.player.oneHitKill ? 9999 : weapon.damage,
                            color: weapon.color,
                            piercing: weapon.piercing,
                            hitEnemies: new Set()
                        });
                    }
                } else if (weapon.type === 'spinning') {
                    // Multiple scythes at different angles
                    for (let i = 0; i < count; i++) {
                        const phaseOffset = (i * 2 * Math.PI) / count;
                        const angle = now * Math.PI * 2 / 1000 + phaseOffset;
                        const scytheX = playerCenterX + Math.cos(angle) * weapon.orbitRadius;
                        const scytheY = playerCenterY + Math.sin(angle) * weapon.orbitRadius;

                        gameState.enemies.forEach(enemy => {
                            const enemyCenterX = enemy.x + enemy.width/2;
                            const enemyCenterY = enemy.y + enemy.height/2;
                            const dx = enemyCenterX - scytheX;
                            const dy = enemyCenterY - scytheY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance <= enemy.width/2 + weapon.range) {
                                enemy.health -= gameState.player.oneHitKill ? enemy.maxHealth || 9999 : weapon.damage;
                                enemy.hitTime = now;
                            }
                        });
                    }
                } else if (weapon.type === 'melee') {
                    // Check corners and center of enemy hitbox
                    const checkPoints = [
                        { x: closestEnemy.x, y: closestEnemy.y }, // Top-left
                        { x: closestEnemy.x + closestEnemy.width, y: closestEnemy.y }, // Top-right
                        { x: closestEnemy.x, y: closestEnemy.y + closestEnemy.height }, // Bottom-left
                        { x: closestEnemy.x + closestEnemy.width, y: closestEnemy.y + closestEnemy.height }, // Bottom-right
                        { x: closestEnemy.x + closestEnemy.width/2, y: closestEnemy.y + closestEnemy.height/2 } // Center
                    ];

                    // Check if any point is within the arc
                    let isInArc = false;
                    for (const point of checkPoints) {
                        const dx = point.x - playerCenterX;
                        const dy = point.y - playerCenterY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const angleToPoint = Math.atan2(dy, dx);
                        
                        let angleDiff = angleToPoint - gameState.player.rotation;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        
                        // Increased arc size and damage with more swords
                        const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
                        const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
                        
                        if (Math.abs(angleDiff) <= scaledArcSize/2 && distance <= scaledRange) {
                            isInArc = true;
                            break;
                        }
                    }
                    
                    const scaledDamage = weapon.damage * count;
                    
                    if (isInArc) {
                        // Apply one-hit kill if enabled
                        closestEnemy.health -= gameState.player.oneHitKill ? closestEnemy.maxHealth : scaledDamage;
                        closestEnemy.hitTime = now;
                    }
                }
            });
        }

        function update() {
            if (gameState.isPaused) {
                // When paused, only handle the pause menu and do nothing else
                return;
            }
            
            // Update player movement using keybinds with time scaling
            const timeScale = gameState.timeScale || 1;
            const keybinds = gameState.settings.keybinds;
            if (keys[keybinds.up]) gameState.player.y -= gameState.player.speed * timeScale;
            if (keys[keybinds.down]) gameState.player.y += gameState.player.speed * timeScale;
            if (keys[keybinds.left]) gameState.player.x -= gameState.player.speed * timeScale;
            if (keys[keybinds.right]) gameState.player.x += gameState.player.speed * timeScale;
            
            // Automatic attacking
            attack();

            // Wrap player position
            if (gameState.player.x < 0) gameState.player.x = CANVAS_WIDTH;
            if (gameState.player.x > CANVAS_WIDTH) gameState.player.x = 0;
            if (gameState.player.y < 0) gameState.player.y = CANVAS_HEIGHT;
            if (gameState.player.y > CANVAS_HEIGHT) gameState.player.y = 0;

            // Update invulnerability
            if (gameState.player.invulnerable && 
                !gameState.player.permanentInvulnerability && 
                Date.now() - gameState.player.lastHit >= gameState.player.invulnerabilityDuration) {
                gameState.player.invulnerable = false;
            }

            // Initialize new floor when current floor is cleared
            if (gameState.floorCleared) {
                gameState.currentFloor++;
                gameState.floorCleared = false;
                gameState.enemies = [];

                // Update highest floor and check for skins unlock
                if (gameState.currentFloor > gameState.player.highestFloor) {
                    gameState.player.highestFloor = gameState.currentFloor;
                    if (gameState.currentFloor >= 100 && !gameState.player.skinsUnlocked) {
                        gameState.player.skinsUnlocked = true;
                        localStorage.setItem('skinsUnlocked', 'true');  // Save to localStorage
                    }

                    if (gameState.currentFloor >= 150 && !gameState.player.survivorUnlocked) {
                        gameState.player.survivorUnlocked = true;
                        localStorage.setItem('survivorUnlocked', 'true');  // Save to localStorage
                        const survivorButton = document.querySelector('#mainMenu button:nth-child(3)');
                        if (survivorButton) {
                            survivorButton.textContent = 'Survivor Mode';
                            survivorButton.style.opacity = '1';
                            survivorButton.style.backgroundColor = '#333';
                        }
                        const unlockMessage = document.createElement('div');
                        unlockMessage.style.cssText = `
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 32px;
                            color: gold;
                            text-shadow: 0 0 10px gold;
                            z-index: 1000;
                        `;
                        unlockMessage.textContent = 'Skins Unlocked!';
                        document.body.appendChild(unlockMessage);
                        setTimeout(() => document.body.removeChild(unlockMessage), 3000);
                    }
                }

                // Check for game completion at floor 100
                if (gameState.currentFloor === 100 && !gameState.gameCompleted) {
                    gameState.gameCompleted = true;
                    gameLoopRunning = false;
                    showGameCompletionScreen();
                    return;
                }
                
                // Show floor transition text
                const floorText = document.createElement('div');
                floorText.style.position = 'fixed';
                floorText.style.top = '50%';
                floorText.style.left = '50%';
                floorText.style.transform = 'translate(-50%, -50%)';
                floorText.style.fontSize = '48px';
                floorText.style.color = 'white';
                floorText.style.textShadow = '0 0 10px #fff';
                floorText.style.zIndex = '1000';
                floorText.textContent = `Floor ${gameState.currentFloor}`;
                document.body.appendChild(floorText);
                
                // Remove the text after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(floorText);
                }, 2000);

                // Determine number of enemies for this floor
                const baseEnemies = 3 + Math.floor(gameState.currentFloor / 2); // Increases with floor number
                const isBossFloor = gameState.currentFloor % 5 === 0;

                // Spawn all enemies at once
                if (isBossFloor) {
                    gameState.enemies.push({
                        ...ENEMY_TYPES.DRAGON,
                        x: CANVAS_WIDTH / 2,
                        y: -ENEMY_TYPES.DRAGON.height,
                        maxHealth: ENEMY_TYPES.DRAGON.health,
                        isBoss: true
                    });
                } else {
                    for (let i = 0; i < baseEnemies; i++) {
                        // More skeletons early game, more slimes later game
                        const skeletonChance = Math.max(0.3, 0.8 - (gameState.currentFloor * 0.05));
                        const enemyType = Math.random() < skeletonChance ? ENEMY_TYPES.SKELETON : ENEMY_TYPES.SLIME;
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

                        // Apply HP multiplier to enemy health
                        const scaledHealth = enemyType.health * gameState.enemyHPMultiplier;
                        
                        gameState.enemies.push({
                            ...enemyType,
                            x: x,
                            y: y,
                            health: scaledHealth,
                            maxHealth: scaledHealth
                        });
                    }
                }
            }

            // Update enemies
            gameState.enemies.forEach(enemy => {
                const prevX = enemy.x;
                const prevY = enemy.y;

                // Calculate distances both directly and through screen wrapping
                let dx = gameState.player.x - enemy.x;
                let dy = gameState.player.y - enemy.y;
                
                // Check if wrapping around horizontally would be shorter
                if (Math.abs(dx) > CANVAS_WIDTH / 2) {
                    if (dx > 0) {
                        // If player is on right, check if going left through screen edge is shorter
                        dx = -(CANVAS_WIDTH - Math.abs(dx));
                    } else {
                        // If player is on left, check if going right through screen edge is shorter
                        dx = CANVAS_WIDTH - Math.abs(dx);
                    }
                }
                
                // Check if wrapping around vertically would be shorter
                if (Math.abs(dy) > CANVAS_HEIGHT / 2) {
                    if (dy > 0) {
                        // If player is below, check if going up through screen edge is shorter
                        dy = -(CANVAS_HEIGHT - Math.abs(dy));
                    } else {
                        // If player is above, check if going down through screen edge is shorter
                        dy = CANVAS_HEIGHT - Math.abs(dy);
                    }
                }
                
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    // Move enemy and handle screen wrapping
                    const timeScale = gameState.timeScale || 1;
                    enemy.x += (dx / dist) * enemy.speed * timeScale;
                    enemy.y += (dy / dist) * enemy.speed * timeScale;
                    
                    // Wrap around screen edges
                    if (enemy.x < 0) enemy.x = CANVAS_WIDTH;
                    if (enemy.x > CANVAS_WIDTH) enemy.x = 0;
                    if (enemy.y < 0) enemy.y = CANVAS_HEIGHT;
                    if (enemy.y > CANVAS_HEIGHT) enemy.y = 0;
                }

                enemy.dx = enemy.x - prevX;
                enemy.dy = enemy.y - prevY;

                // Check if enemy died
                if (enemy.health <= 0) {
                    const wasLastEnemy = gameState.enemies.length === 1;
                    if (enemy.isBoss && wasLastEnemy) {
                        gameLoopRunning = false;
                        document.getElementById('weaponSelect').style.display = 'flex';
                        setupWeaponSelection(true);
                    } else if (wasLastEnemy) {
                        gameState.floorCleared = true;
                    }
                }
            });

            // Remove dead enemies and check for floor completion
            gameState.enemies = gameState.enemies.filter(enemy => enemy.health > 0);
            if (gameState.enemies.length === 0) {
                gameState.floorCleared = true;
            }

            // Update projectiles and check collisions
            gameState.projectiles = gameState.projectiles.filter(proj => {
                proj.x += proj.dx;
                proj.y += proj.dy;

                gameState.enemies.forEach(enemy => {
                    if (!proj.hitEnemies.has(enemy)) {
                        const dx = enemy.x + enemy.width/2 - proj.x;
                        const dy = enemy.y + enemy.height/2 - proj.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= enemy.width/2 + proj.width/2) {
                            enemy.health -= proj.damage;
                            enemy.hitTime = Date.now();
                            proj.hitEnemies.add(enemy);
                            
                            if (!proj.piercing) return false;
                        }
                    }
                });

                return proj.x >= 0 && proj.x <= CANVAS_WIDTH && 
                       proj.y >= 0 && proj.y <= CANVAS_HEIGHT;
            });

            // Check enemy-player collisions
            if (!gameState.player.invulnerable && !gameState.isPaused) {
                gameState.enemies.forEach(enemy => {
                    if (detectCollision(gameState.player, enemy)) {
                        gameState.player.health = Math.max(0, gameState.player.health - enemy.damage);
                        gameState.player.invulnerable = true;
                        gameState.player.lastHit = Date.now();
                        
                        document.getElementById('health').textContent = 
                            `HP: ${Math.round(gameState.player.health)}/${gameState.player.maxHealth}`;
                            
                        // Check for game over
                        if (gameState.player.health <= 0 && !gameState.deathSequence) {
                            // Start death sequence
                            gameState.deathSequence = true;
                            gameState.deathTime = Date.now();
                            gameState.timeScale = 1;
                            
                            // Add red overlay
                            const overlay = document.getElementById('deathOverlay');
                            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
                            setTimeout(() => {
                                overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
                                
                                // After brief red flash, show game over screen
                                setTimeout(() => {
                                    overlay.style.backgroundColor = 'transparent';
                                    document.getElementById('floorsCleared').textContent = gameState.currentFloor;
                                    const gameOver = document.getElementById('gameOver');
                                    gameOver.style.display = 'flex';
                                    
                                    // Set up try again button
                                    const tryAgainBtn = document.getElementById('tryAgain');
                                    const quitToMenuBtn = document.getElementById('quitToMenu');
                                    const doorTransition = document.querySelector('.gameover-transition');
                                    const deathOverlay = document.getElementById('deathOverlay');

                                    if (!tryAgainBtn || !quitToMenuBtn || !doorTransition || !gameOver || !deathOverlay) {
                                        console.error('Required elements not found');
                                        return;
                                    }

                                    tryAgainBtn.onclick = () => {
                                        // Start door transition immediately using the game over door
                                        requestAnimationFrame(() => {
                                            doorTransition.style.display = 'block';
                                            doorTransition.style.backgroundColor = 'transparent';
                                            doorTransition.offsetHeight; // Force reflow
                                            doorTransition.classList.add('active');
                                            
                                            // Fade out game over screen while door transition is playing
                                            gameOver.classList.remove('visible');
                                            setTimeout(() => {
                                                gameOver.style.display = 'none';
                                            }, 500);
                                            
                                            // Add black background near the end of the transition
                                            setTimeout(() => {
                                                doorTransition.style.backgroundColor = 'black';
                                                
                                                    // Reset game state
                                                    setTimeout(() => {
                                                    // Reset the game state completely
                                                    gameState.player.health = gameState.player.maxHealth;
                                                    gameState.player.weapons = [];
                                                    gameState.enemies = [];
                                                    gameState.projectiles = [];
                                                    gameState.deathSequence = false;
                                                    gameState.currentFloor = 0;  // Start at 0 because it will be incremented to 1
                                                    gameState.enemyHPMultiplier = 1;
                                                    gameState.floorCleared = true;  // This will trigger floor 1 to be initialized
                                                    gameLoopRunning = false;                                                    // Reset UI elements
                                                    deathOverlay.style.backgroundColor = 'transparent';
                                                    doorTransition.style.display = 'none';
                                                    doorTransition.classList.remove('active');
                                                    doorTransition.style.backgroundColor = 'transparent';
                                                    
                                                    // Show weapon selection screen
                                                    document.getElementById('weaponSelect').style.display = 'flex';
                                                    setupWeaponSelection(false);
                                                    
                                                    // Hide game container
                                                    document.getElementById('gameContainer').style.display = 'none';
                                                }, 500);
                                            }, 1700);
                                        });
                                    };
                                    
                                    // Set up quit to menu button
                                    quitToMenuBtn.onclick = () => {
                                        console.log("QUIT TO MENU CLICKED - Custom transition");
                                        // Create a custom transition element for quit to menu
                                        const customTransition = document.createElement('div');
                                        customTransition.style.position = 'fixed';
                                        customTransition.style.top = '0';
                                        customTransition.style.left = '0';
                                        customTransition.style.width = '100%';
                                        customTransition.style.height = '100%';
                                        customTransition.style.background = 'url("images/game-over-background.png") center/cover no-repeat';
                                        customTransition.style.zIndex = '2002';
                                        customTransition.style.transform = 'scale(1)';
                                        customTransition.style.opacity = '1';
                                        customTransition.style.transition = 'transform 1.5s ease, opacity 1.5s ease';
                                        document.body.appendChild(customTransition);
                                        console.log("Custom transition element created and added");
                                        
                                        // Force reflow and start zoom out
                                        customTransition.offsetHeight;
                                        requestAnimationFrame(() => {
                                            console.log("Starting zoom out animation");
                                            customTransition.style.transform = 'scale(0.1)';
                                            customTransition.style.opacity = '0';
                                        });
                                        
                                        // Fade out game over screen
                                        gameOver.classList.remove('visible');
                                        setTimeout(() => {
                                            gameOver.style.display = 'none';
                                        }, 500);
                                        
                                        // Complete transition in 1.5s, then reset game state
                                        setTimeout(() => {
                                            console.log("Transition complete, resetting game");
                                            // Remove custom transition element
                                            document.body.removeChild(customTransition);
                                            
                                            // Reset the game state completely
                                            gameState.player.health = gameState.player.maxHealth;
                                            gameState.player.weapons = [];
                                            gameState.enemies = [];
                                            gameState.projectiles = [];
                                            gameState.deathSequence = false;
                                            gameState.currentFloor = 0;  // Start at 0 because it will be incremented to 1
                                            gameState.enemyHPMultiplier = 1;
                                            gameState.floorCleared = true;  // This will trigger floor 1 to be initialized
                                            gameLoopRunning = false;
                                            gameState.isPaused = false;
                                            gameState.gameStarted = false;
                                            gameState.gameCompleted = false;
                                            
                                            // Reset UI elements
                                            deathOverlay.style.backgroundColor = 'transparent';
                                            
                                            // Hide game container and show main menu
                                            document.getElementById('gameContainer').style.display = 'none';
                                            document.getElementById('mainMenu').style.display = 'flex';
                                        }, 1500);
                                    };

                                    setTimeout(() => {
                                        gameOver.classList.add('visible');
                                    }, 100);
                                    gameLoopRunning = false;
                                }, 400);
                            }, 100);
                        }
                        
                        // Slow down time during death sequence
                        if (gameState.deathSequence && gameLoopRunning) {
                            const timeSinceDeath = Date.now() - gameState.deathTime;
                            if (timeSinceDeath < 2000) {  // First 2 seconds
                                gameState.timeScale = Math.max(0.1, 1 - (timeSinceDeath / 2000));
                            }
                        }
                    }
                });
            }
        }

        function render() {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            const playerCenterX = gameState.player.x + gameState.player.width/2;
            const playerCenterY = gameState.player.y + gameState.player.height/2;

            // Group weapons by their ID for stacking effects
            const weaponGroups = {};
            gameState.player.weapons.forEach(weapon => {
                if (!weaponGroups[weapon.id]) {
                    weaponGroups[weapon.id] = [];
                }
                weaponGroups[weapon.id].push(weapon);
            });

            // Draw all weapon groups
            Object.values(weaponGroups).forEach(weapons => {
                const weapon = weapons[0];
                const count = weapons.length;

                if (weapon.type === 'melee') {
                    // Draw melee range indicator with increased size for stacked weapons
                    const scaledRange = weapon.range * (1 + (count - 1) * 0.5);
                    const scaledArcSize = weapon.arcSize * (1 + (count - 1) * 0.5);
                    
                    ctx.beginPath();
                    ctx.arc(
                        playerCenterX,
                        playerCenterY,
                        scaledRange,
                        gameState.player.rotation - scaledArcSize/2,
                        gameState.player.rotation + scaledArcSize/2
                    );
                    ctx.lineTo(playerCenterX, playerCenterY);
                    ctx.closePath();

                    ctx.fillStyle = `${weapon.color}33`;
                    ctx.fill();
                    ctx.strokeStyle = weapon.color;
                    ctx.stroke();

                    if (Date.now() - gameState.player.lastAttacks[weapon.id] < 100) {
                        ctx.fillStyle = `${weapon.color}66`;
                        ctx.fill();
                    }
                } else if (weapon.type === 'spinning') {
                    // Draw multiple orbiting scythes
                    for (let i = 0; i < count; i++) {
                        const phaseOffset = (i * 2 * Math.PI) / count;
                        const angle = Date.now() * Math.PI * 2 / 1000 + phaseOffset;
                        const scytheX = playerCenterX + Math.cos(angle) * weapon.orbitRadius;
                        const scytheY = playerCenterY + Math.sin(angle) * weapon.orbitRadius;

                        ctx.beginPath();
                        ctx.arc(scytheX, scytheY, weapon.range, 0, Math.PI * 2);
                        ctx.fillStyle = weapon.color;
                        ctx.fill();
                        
                        // Add glow effect
                        ctx.shadowColor = weapon.color;
                        ctx.shadowBlur = 10;
                        ctx.strokeStyle = weapon.color;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }
            });
            
            // Draw enemies
            gameState.enemies.forEach(enemy => {
                ctx.fillStyle = enemy.hitTime && Date.now() - enemy.hitTime < 100 ? 
                    '#ff0000' : enemy.color;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Health bar
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                
                ctx.fillStyle = '#00ff00';
                const healthPercent = enemy.health / enemy.maxHealth;
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 5);
            });
            
            // Draw projectiles
            gameState.projectiles.forEach(proj => {
                ctx.fillStyle = proj.color;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw player with current skin color
            ctx.fillStyle = gameState.player.invulnerable ?
                (Math.floor(Date.now() / 100) % 2 === 0 ? '#ffffff' : gameState.player.skin.color) :
                gameState.player.skin.color;
            
            ctx.beginPath();
            ctx.arc(
                playerCenterX,
                playerCenterY,
                gameState.player.width/2,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw player health bar
            const barWidth = gameState.player.width * 1.5;
            const barHeight = 6;
            const barX = gameState.player.x - (barWidth - gameState.player.width) / 2;
            const barY = gameState.player.y - 15;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#00ff00';
            const healthPercent = gameState.player.health / gameState.player.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }

        function gameLoop() {
            if (!gameLoopRunning) {
                return;  // Don't continue animation frame if game is not running
            }
            
            if (gameState.isPaused) {
                requestAnimationFrame(gameLoop);  // Keep animation going when paused
                return;
            }

            {
                update();
                render();
            }

            requestAnimationFrame(gameLoop);  // Request next frame
        }

        // Function to return to main menu
        function returnToMainMenu() {
            gameLoopRunning = false;
            document.getElementById('pauseMenu').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('mainMenu').style.display = 'flex';
            
            // Reset game state
            gameState.player.health = gameState.player.maxHealth;
            gameState.player.weapons = [];
            gameState.enemies = [];
            gameState.projectiles = [];
            gameState.currentFloor = 0;
            gameState.floorCleared = true;
            gameState.enemyHPMultiplier = 1;
            gameState.isPaused = false;
            gameState.gameStarted = false;
            gameState.gameCompleted = false;
        }

        function generateBuilding(type, x, y) {
            return {
                type, // 'shed' or 'toilet'
                x,
                y,
                width: type === 'shed' ? 120 : 80,
                height: type === 'shed' ? 100 : 60,
                door: {
                    x: type === 'shed' ? x + 45 : x + 30,
                    y: type === 'shed' ? y + 70 : y + 40,
                    width: 30,
                    height: 30
                },
                interior: {
                    weapon: null // Will be populated when player enters
                }
            };
        }

        function updateOpenWorld() {
            // Update time
            gameState.openWorld.time += 16; // Assuming 60fps
            const totalCycleTime = gameState.openWorld.DAY_DURATION + gameState.openWorld.NIGHT_DURATION;
            const wasNight = gameState.openWorld.isNight;

            if (gameState.openWorld.time >= totalCycleTime) {
                gameState.openWorld.time = 0;
                gameState.player.openWorldDay++;
                localStorage.setItem('openWorldDay', gameState.player.openWorldDay.toString());
            }

            // Check if it's night time
            const isDayTime = gameState.openWorld.time < gameState.openWorld.DAY_DURATION;
            gameState.openWorld.isNight = !isDayTime;

            // If night just started, spawn enemies
            if (!wasNight && gameState.openWorld.isNight) {
                const enemyCount = Math.min(5 + Math.floor(gameState.player.openWorldDay / 2), 20);
                for (let i = 0; i < enemyCount; i++) {
                    const enemy = {
                        x: Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50,
                        y: Math.random() * CANVAS_HEIGHT,
                        width: 40,
                        height: 40,
                        health: 100 * (1 + gameState.player.openWorldDay * 0.1),
                        maxHealth: 100 * (1 + gameState.player.openWorldDay * 0.1),
                        speed: 1 + Math.min(gameState.player.openWorldDay * 0.1, 2)
                    };
                    gameState.enemies.push(enemy);
                }
            }

            // Handle building interactions
            gameState.openWorld.buildings.forEach(building => {
                const playerNearDoor = Math.abs(gameState.player.x - building.door.x) < 20 &&
                                     Math.abs(gameState.player.y - building.door.y) < 20;
                
                if (playerNearDoor && keys[gameState.settings.keybinds.interact] && !building.interior.weapon) {
                    // Generate a random weapon when player enters
                    const weaponTypes = Object.keys(WEAPONS);
                    const randomWeapon = WEAPONS[weaponTypes[Math.floor(Math.random() * weaponTypes.length)]];
                    building.interior.weapon = { ...randomWeapon };
                }

                if (building.interior.weapon && playerNearDoor && keys[gameState.settings.keybinds.interact]) {
                    gameState.player.weapons.push(building.interior.weapon);
                    building.interior.weapon = null;
                    gameState.player.openWorldWeapons = gameState.player.weapons;
                    localStorage.setItem('openWorldWeapons', JSON.stringify(gameState.player.openWorldWeapons));
                }
            });

            // Update player and game elements
            updatePlayer();
            updateEnemies();
            updateProjectiles();
        }

        function updatePlayer() {
            // Get keybinds from settings
            const keybinds = gameState.settings.keybinds;
            
            // Update player position based on input
            if (keys[keybinds.up]) gameState.player.y -= gameState.player.speed;
            if (keys[keybinds.down]) gameState.player.y += gameState.player.speed;
            if (keys[keybinds.left]) gameState.player.x -= gameState.player.speed;
            if (keys[keybinds.right]) gameState.player.x += gameState.player.speed;

            // Keep player in bounds
            gameState.player.x = Math.max(0, Math.min(CANVAS_WIDTH - gameState.player.width, gameState.player.x));
            gameState.player.y = Math.max(0, Math.min(CANVAS_HEIGHT - gameState.player.height, gameState.player.y));

            // Update weapons
            gameState.player.weapons.forEach(weapon => {
                if (weapon.cooldown > 0) {
                    weapon.cooldown--;
                }
            });
        }

        function renderOpenWorld() {
            // Clear canvas
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Draw grass background
            ctx.fillStyle = '#458B00';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Draw buildings
            gameState.openWorld.buildings.forEach(building => {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(building.x, building.y, building.width, building.height);
                
                // Draw door
                ctx.fillStyle = '#4A2800';
                ctx.fillRect(building.door.x, building.door.y, building.door.width, building.door.height);

                // Show weapon indicator if present
                if (building.interior.weapon) {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(building.door.x + 15, building.door.y - 10, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw time of day overlay
            if (gameState.openWorld.isNight) {
                ctx.fillStyle = 'rgba(0, 0, 40, 0.3)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            // Draw time and day counter
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            const timeOfDay = gameState.openWorld.isNight ? 'Night' : 'Day';
            ctx.fillText(`Day ${gameState.player.openWorldDay} - ${timeOfDay}`, 10, 50);

            // Draw health bar in top left
            const healthBarWidth = 100;
            const healthBarHeight = 10;
            const healthPercentage = gameState.player.health / gameState.player.maxHealth;
            
            // Background
            ctx.fillStyle = '#F00';
            ctx.fillRect(10, 10, healthBarWidth, healthBarHeight);
            
            // Health amount
            ctx.fillStyle = '#0F0';
            ctx.fillRect(10, 10, healthBarWidth * healthPercentage, healthBarHeight);
            
            // Border
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(10, 10, healthBarWidth, healthBarHeight);

            // Draw player and game elements
            renderPlayer();
            renderEnemies();
            renderProjectiles();
        }

        // Function to show game completion screen
        function showGameCompletionScreen() {
            const completionScreen = document.createElement('div');
            completionScreen.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background-color: rgba(20, 20, 20, 0.95);
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                min-width: 300px;
            `;

            const title = document.createElement('h1');
            title.textContent = 'Congratulations!';
            title.style.cssText = `
                color: gold;
                font-size: 48px;
                margin: 0 0 20px 0;
                text-shadow: 0 0 10px gold;
            `;

            const message = document.createElement('p');
            message.textContent = 'You have completed all 100 floors!';
            message.style.cssText = `
                color: white;
                font-size: 24px;
                margin: 0 0 30px 0;
            `;

            const returnButton = document.createElement('button');
            returnButton.textContent = 'Return to Main Menu';
            returnButton.className = 'pause-button';
            returnButton.onclick = () => {
                document.body.removeChild(completionScreen);
                returnToMainMenu();
            };

            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(returnButton);
            completionScreen.appendChild(content);
            document.body.appendChild(completionScreen);
        }

        // Initialize menus and start game
        setupMainMenu();
        setupSkinMenu();        // Core game rendering functions
        function renderPlayer() {
            // Draw player body
            ctx.fillStyle = gameState.player.color || '#00F';
            ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);

            // Draw weapon on player
            if (gameState.player.weapons.length > 0) {
                const currentWeapon = gameState.player.weapons[0]; // Show first weapon
                ctx.fillStyle = currentWeapon.color || '#FF0';
                ctx.fillRect(
                    gameState.player.x + gameState.player.width - 10,
                    gameState.player.y + 10,
                    10,
                    10
                );
            }

            // Draw health bar
            const healthBarWidth = 50;
            const healthBarHeight = 5;
            const healthPercentage = gameState.player.health / gameState.player.maxHealth;
            
            ctx.fillStyle = '#F00';
            ctx.fillRect(
                gameState.player.x + (gameState.player.width - healthBarWidth) / 2,
                gameState.player.y - 10,
                healthBarWidth,
                healthBarHeight
            );
            
            ctx.fillStyle = '#0F0';
            ctx.fillRect(
                gameState.player.x + (gameState.player.width - healthBarWidth) / 2,
                gameState.player.y - 10,
                healthBarWidth * healthPercentage,
                healthBarHeight
            );
        }

        function renderEnemies() {
            gameState.enemies.forEach(enemy => {
                // Draw enemy body
                ctx.fillStyle = '#F00';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

                // Draw enemy health bar
                const healthBarWidth = 40;
                const healthBarHeight = 4;
                const healthPercentage = enemy.health / enemy.maxHealth;
                
                ctx.fillStyle = '#F00';
                ctx.fillRect(
                    enemy.x + (enemy.width - healthBarWidth) / 2,
                    enemy.y - 8,
                    healthBarWidth,
                    healthBarHeight
                );
                
                ctx.fillStyle = '#0F0';
                ctx.fillRect(
                    enemy.x + (enemy.width - healthBarWidth) / 2,
                    enemy.y - 8,
                    healthBarWidth * healthPercentage,
                    healthBarHeight
                );
            });
        }

        function renderProjectiles() {
            gameState.projectiles.forEach(projectile => {
                ctx.fillStyle = projectile.color || '#FF0';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.radius || 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function updateEnemies() {
            // Move enemies towards player
            gameState.enemies.forEach(enemy => {
                const dx = gameState.player.x - enemy.x;
                const dy = gameState.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed;
                    enemy.y += (dy / distance) * enemy.speed;
                }

                // Check for collision with player
                if (detectCollision(enemy, gameState.player) && !gameState.player.permanentInvulnerability) {
                    gameState.player.health = Math.max(0, gameState.player.health - (enemy.damage || 10));
                }
            });

            // Remove dead enemies
            gameState.enemies = gameState.enemies.filter(enemy => enemy.health > 0);
        }

        function updateProjectiles() {
            for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
                const projectile = gameState.projectiles[i];
                
                // Move projectile
                projectile.x += projectile.dx;
                projectile.y += projectile.dy;

                // Check if projectile is out of bounds
                if (projectile.x < 0 || projectile.x > CANVAS_WIDTH ||
                    projectile.y < 0 || projectile.y > CANVAS_HEIGHT) {
                    gameState.projectiles.splice(i, 1);
                    continue;
                }

                // Check for collision with enemies
                for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                    const enemy = gameState.enemies[j];
                    if (detectCollision(projectile, enemy)) {
                        enemy.health -= projectile.damage;
                        gameState.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
