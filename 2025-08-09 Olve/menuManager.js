export class MenuManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.setupMainMenu();
        this.setupSkinMenu();
        this.setupPauseMenu();
        this.setupSettingsMenu();
    }

    setupMainMenu() {
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

        const content = this.createMenuContent();
        const title = this.createTitle('Dungeon Crawler');
        
        // Add points display in top left corner
        const pointsDisplay = this.createPointsDisplay();
        
        const startButton = this.createButton('Start Game', () => this.startGame(), true);
        const settingsButton = this.createButton('Settings', () => this.showSettings());
        const weaponTreeButton = this.createButton('Weapon Tree', () => this.showWeaponTree());
        const skinsButton = this.createSkinsButton();

        mainMenu.appendChild(pointsDisplay);
        content.appendChild(title);
        content.appendChild(startButton);
        content.appendChild(settingsButton);
        content.appendChild(weaponTreeButton);
        content.appendChild(skinsButton);
        
        mainMenu.appendChild(content);
        document.body.appendChild(mainMenu);
    }

    setupSkinMenu() {
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

        const content = this.createMenuContent();
        const title = this.createTitle('Select Skin');
        const skinsGrid = this.createSkinsGrid();
        const backButton = this.createButton('Back', () => this.hideSkinMenu());

        content.appendChild(title);
        content.appendChild(skinsGrid);
        content.appendChild(backButton);
        skinMenu.appendChild(content);
        document.body.appendChild(skinMenu);
    }

    setupPauseMenu() {
        // Pause menu is likely already in HTML, just need to handle its logic
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            // Setup pause menu event handlers if needed
        }
    }

    setupSettingsMenu() {
        // Settings menu is likely already in HTML, just need to handle its logic
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) {
            // Setup reset weapon tree button
            const resetBtn = document.getElementById('resetWeaponTreeBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to reset your weapon tree progress? This will unlock only Sword, Scythe, and Bow, and set your points to 0. This action cannot be undone!')) {
                        if (this.gameState.resetWeaponTree()) {
                            alert('Weapon tree progress has been reset successfully!');
                            this.updatePointsDisplay();
                            // Refresh weapon tree if it's open
                            if (document.getElementById('weaponTreeMenu') && document.getElementById('weaponTreeMenu').style.display !== 'none') {
                                this.refreshWeaponTree();
                            }
                        } else {
                            alert('Failed to reset weapon tree progress. Please try again.');
                        }
                    }
                });
            }
        }
    }

    createMenuContent() {
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 40px;
            text-align: center;
            min-width: 300px;
        `;
        return content;
    }

    createTitle(text) {
        const title = document.createElement('h1');
        title.textContent = text;
        title.style.cssText = `
            color: white;
            font-size: 48px;
            margin: 0 0 30px 0;
            text-shadow: 0 0 10px #fff;
        `;
        return title;
    }

    createButton(text, onClick, isStart = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
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
        
        button.onclick = onClick;
        this.addButtonHoverEffects(button, isStart);
        return button;
    }

    createPointsDisplay() {
        const pointsDisplay = document.createElement('div');
        pointsDisplay.id = 'pointsDisplay';
        pointsDisplay.style.cssText = `
            position: absolute;
            top: 40px;
            left: 10px;
            z-index: 2001;
            display: flex;
            align-items: center;
        `;

        // Create the point bar background image
        const pointBarImg = document.createElement('img');
        pointBarImg.src = 'images/point_bar.png';
        pointBarImg.style.cssText = `
            display: block;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        `;
        
        // Set size when image loads to maintain crisp 2x scaling
        pointBarImg.onload = function() {
            this.style.width = (this.naturalWidth * 2) + 'px';
            this.style.height = (this.naturalHeight * 2) + 'px';
        };

        // Create text overlay for the points number
        const pointsText = document.createElement('div');
        pointsText.style.cssText = `
            position: absolute;
            color: #CCCCCC;
            font-size: 28px;
            font-weight: 900;
            font-family: 'Press Start 2P', 'Courier New', monospace;
            left: 165px;
            top: 50%;
            transform: translateY(-50%);
            text-shadow: 2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000;
        `;
        pointsText.textContent = `Points: ${this.gameState.player.weaponTreePoints}`;

        pointsDisplay.appendChild(pointBarImg);
        pointsDisplay.appendChild(pointsText);
        return pointsDisplay;
    }

    createSkinsButton() {
        const skinsButton = this.createButton(
            this.gameState.player.skinsUnlocked ? 'Change Skin' : 'Skins (Reach Floor 100)',
            () => {
                if (this.gameState.player.skinsUnlocked) {
                    this.showSkinMenu();
                }
            }
        );

        if (!this.gameState.player.skinsUnlocked) {
            skinsButton.style.opacity = '0.5';
            skinsButton.style.cursor = 'not-allowed';
        }

        return skinsButton;
    }

    updateSkinsButton() {
        // Find the skins button in the main menu (it's the 4th button)
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;
        
        const buttons = mainMenu.querySelectorAll('button');
        const skinsButton = buttons[3]; // 4th button (0-indexed): Start, Settings, Weapon Tree, Skins
        
        if (skinsButton) {
            // Update text based on current unlock status
            skinsButton.textContent = this.gameState.player.skinsUnlocked ? 'Change Skin' : 'Skins (Reach Floor 100)';
            
            // Update styling and functionality
            if (this.gameState.player.skinsUnlocked) {
                skinsButton.style.opacity = '1';
                skinsButton.style.cursor = 'pointer';
                skinsButton.onclick = () => this.showSkinMenu();
            } else {
                skinsButton.style.opacity = '0.5';
                skinsButton.style.cursor = 'not-allowed';
                skinsButton.onclick = () => {}; // Do nothing when clicked
            }
        }
    }

    createSkinsGrid() {
        const skinsGrid = document.createElement('div');
        skinsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        `;

        // Import PLAYER_SKINS from constants
        import('./constants.js').then(({ PLAYER_SKINS }) => {
            PLAYER_SKINS.forEach(skin => {
                const skinContainer = this.createSkinOption(skin);
                skinsGrid.appendChild(skinContainer);
            });
        });

        return skinsGrid;
    }

    createSkinOption(skin) {
        const skinOption = document.createElement('div');
        skinOption.style.cssText = `
            background-color: ${skin.color};
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin: 10px auto;
            transition: transform 0.3s ease;
            border: 3px solid ${skin === this.gameState.player.skin ? '#fff' : 'transparent'};
            cursor: pointer;
        `;

        skinOption.onclick = () => this.selectSkin(skin, skinOption);
        this.addSkinHoverEffects(skinOption);

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
        return skinContainer;
    }

    addButtonHoverEffects(button, isStart = false) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = isStart ? '#4CAF50' : '#444';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = '#333';
        });
    }

    addSkinHoverEffects(skinOption) {
        skinOption.addEventListener('mouseenter', () => {
            skinOption.style.transform = 'scale(1.1)';
        });
        
        skinOption.addEventListener('mouseleave', () => {
            skinOption.style.transform = 'scale(1)';
        });
    }

    selectSkin(skin, skinOption) {
        this.gameState.player.skin = skin;
        // Save skin to localStorage
        localStorage.setItem('selectedSkin', skin.name);
        // Update visual selection
        document.querySelectorAll('#skinMenu .skin-option').forEach(opt => {
            opt.style.border = '3px solid transparent';
        });
        skinOption.style.border = '3px solid #fff';
    }

    startGame() {
        this.hideMainMenu();
        this.hideWeaponTree(); // Ensure weapon tree is hidden
        this.dispatchEvent('game-start');
    }

    showSettings() {
        this.hideMainMenu();
        this.showElement('settingsMenu');
    }

    showSkinMenu() {
        this.hideMainMenu();
        this.showElement('skinMenu');
    }

    hideSkinMenu() {
        this.hideElement('skinMenu');
        this.showMainMenu();
    }

    showMainMenu() {
        this.showElement('mainMenu');
        this.updateSkinsButton();
        this.updatePointsDisplay();
    }

    hideMainMenu() {
        this.hideElement('mainMenu');
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'flex';
        }
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    showWeaponTree() {
        this.hideMainMenu();
        
        // Create weapon tree menu if it doesn't exist
        let weaponTreeMenu = document.getElementById('weaponTreeMenu');
        if (!weaponTreeMenu) {
            weaponTreeMenu = this.createWeaponTreeMenu();
            document.body.appendChild(weaponTreeMenu);
        }
        
        this.showElement('weaponTreeMenu');
        
        // Always refresh the weapon tree display when showing it
        this.updatePointsDisplay();
        this.updateWeaponNodeStates();
    }

    createWeaponTreeMenu() {
        const weaponTreeMenu = document.createElement('div');
        weaponTreeMenu.id = 'weaponTreeMenu';
        weaponTreeMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('images/dungeon-door.png') center/cover no-repeat;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            overflow: hidden;
        `;

        const content = this.createMenuContent();
        content.style.height = '90vh';
        content.style.overflow = 'auto';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'flex-start';
        content.style.padding = '20px';
        const title = this.createTitle('Weapon Tree');
        
        // Add points display in top left corner
        const pointsDisplay = this.createPointsDisplay();
        
        // Create weapon tree content
        const treeContent = this.createWeaponTreeContent();
        
        const backButton = this.createButton('Back', () => this.hideWeaponTree());

        weaponTreeMenu.appendChild(pointsDisplay);
        content.appendChild(title);
        content.appendChild(treeContent);
        content.appendChild(backButton);
        weaponTreeMenu.appendChild(content);

        return weaponTreeMenu;
    }

    createWeaponTreeContent() {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: auto;
            min-height: 80vh;
            width: 95vw;
            max-width: 1600px;
            overflow-x: hidden;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            padding: 40px;
            border-radius: 20px;
            border: 2px solid #444;
            justify-content: flex-start;
            align-items: center;
            box-sizing: border-box;
        `;

        const tree = this.gameState.getWeaponTree();
        const purchased = this.gameState.loadWeaponTreeUpgrades();

        // Create the unified weapon tree
        const unifiedBranch = tree.unified;
        const branchDiv = this.createUnifiedWeaponBranch(unifiedBranch, purchased.unified || {});
        container.appendChild(branchDiv);

        return container;
    }

    createUnifiedWeaponBranch(branch, purchasedWeapons) {
        const branchDiv = document.createElement('div');
        branchDiv.style.cssText = `
            border: 3px solid ${branch.color};
            border-radius: 12px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
        `;

        const branchTitle = document.createElement('h3');
        branchTitle.textContent = branch.name;
        branchTitle.style.cssText = `
            color: ${branch.color};
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 20px;
            text-shadow: 2px 2px 0px #000;
        `;

        // Create very spacious grid for the unified tree (12 rows x 10 columns)
        const weaponsGrid = document.createElement('div');
        weaponsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(10, 110px);
            grid-template-rows: repeat(12, 110px);
            gap: 25px;
            position: relative;
            justify-content: center;
            padding: 20px;
        `;

        // Create connection lines container
        const connectionsContainer = document.createElement('div');
        connectionsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        // Add weapons to their positions
        Object.entries(branch.weapons).forEach(([weaponKey, weapon]) => {
            const weaponNode = this.createUnifiedWeaponNode('unified', weaponKey, weapon, purchasedWeapons, branch.color);
            
            // Position the weapon in the grid
            weaponNode.style.gridColumn = weapon.position.col + 1;
            weaponNode.style.gridRow = weapon.position.row + 1;
            weaponNode.style.zIndex = '2';
            
            weaponsGrid.appendChild(weaponNode);
        });

        // Add connection lines
        this.createUnifiedConnectionLines(branch.weapons, purchasedWeapons, connectionsContainer, branch.color);
        
        weaponsGrid.appendChild(connectionsContainer);
        branchDiv.appendChild(branchTitle);
        branchDiv.appendChild(weaponsGrid);
        return branchDiv;
    }

    createUnifiedWeaponNode(branchKey, weaponKey, weapon, purchasedWeapons, branchColor) {
        let isPurchased = !!purchasedWeapons[weaponKey];
        const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
        
        // Check if requirements are met
        let canPurchase = canAfford && !isPurchased && weapon.cost > 0;
        if (weapon.requires && !isPurchased) {
            canPurchase = canPurchase && weapon.requires.every(req => purchasedWeapons[req]);
        }

        // Auto-unlock free weapons ONLY (cost must be exactly 0)
        if (weapon.cost === 0 && !isPurchased && typeof weapon.cost === 'number') {
            console.log(`Auto-unlocking free weapon: ${weapon.name} (${weaponKey}) with cost: ${weapon.cost}`);
            // Additional safety check to prevent any possibility of auto-unlocking paid weapons
            if (weapon.cost !== 0 || weapon.cost > 0) {
                console.error(`ERROR: Prevented auto-unlock of non-free weapon ${weapon.name} with cost ${weapon.cost}`);
            } else {
                this.gameState.purchaseWeapon(branchKey, weaponKey);
                isPurchased = true;
                canPurchase = false;
            }
        }

        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'weapon-node'; // Add class for easier selection
        nodeDiv.dataset.weaponId = weaponKey; // Store weapon ID for updates
        nodeDiv.style.cssText = `
            width: 100px;
            height: 100px;
            border: 3px solid ${isPurchased ? '#0f0' : canPurchase ? branchColor : '#666'};
            border-radius: 15px;
            background: ${isPurchased ? 'rgba(0, 150, 0, 0.4)' : canPurchase ? `rgba(255, 255, 255, 0.15)` : 'rgba(60, 60, 60, 0.5)'};
            cursor: ${canPurchase ? 'pointer' : 'default'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.3s;
            position: relative;
            box-shadow: ${isPurchased ? '0 0 15px rgba(0, 255, 0, 0.5)' : canPurchase ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'};
        `;

        const title = document.createElement('div');
        title.textContent = weapon.name;
        title.style.cssText = `
            color: ${isPurchased ? '#0f0' : '#fff'};
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            margin-bottom: 4px;
            text-shadow: 2px 2px 0px #000;
            line-height: 1.1;
            max-width: 90px;
            word-wrap: break-word;
        `;

        const cost = document.createElement('div');
        cost.className = 'weapon-cost'; // Add class for easy targeting
        if (weapon.cost > 0) {
            cost.textContent = `${weapon.cost}pts`;
            cost.style.cssText = `
                color: ${canAfford || isPurchased ? '#ffd700' : '#f44'};
                font-size: 11px;
                text-align: center;
                text-shadow: 1px 1px 0px #000;
                font-weight: bold;
                margin-top: 3px;
            `;
        }

        nodeDiv.appendChild(title);
        if (weapon.cost > 0) {
            nodeDiv.appendChild(cost);
        }

        // Add requirement indicators
        if (weapon.requires && weapon.requires.length > 0) {
            const reqIndicator = document.createElement('div');
            reqIndicator.className = 'weapon-requirement'; // Add class for easy targeting
            reqIndicator.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                background: #ff6b35;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 0px #000;
            `;
            reqIndicator.textContent = weapon.requires.length;
            reqIndicator.title = `Requires: ${weapon.requires.join(', ')}`;
            nodeDiv.appendChild(reqIndicator);
        }

        if (canPurchase) {
            nodeDiv.addEventListener('click', () => {
                if (this.gameState.purchaseWeapon(branchKey, weaponKey)) {
                    this.refreshWeaponTree();
                }
            });

            nodeDiv.addEventListener('mouseenter', () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.25)';
                nodeDiv.style.transform = 'scale(1.1)';
                nodeDiv.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
            });

            nodeDiv.addEventListener('mouseleave', () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.15)';
                nodeDiv.style.transform = 'scale(1)';
                nodeDiv.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            });
        }

        return nodeDiv;
    }

    createUnifiedConnectionLines(weapons, purchasedWeapons, container, branchColor) {
        // Create SVG for drawing lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        `;

        Object.entries(weapons).forEach(([weaponKey, weapon]) => {
            if (weapon.requires) {
                weapon.requires.forEach(reqKey => {
                    const reqWeapon = weapons[reqKey];
                    if (reqWeapon) {
                        // Calculate line positions with new spacing (135px = 110px width + 25px gap)
                        const fromX = (reqWeapon.position.col * 135) + 55 + 20; // +20 for padding
                        const fromY = (reqWeapon.position.row * 135) + 55 + 20;
                        const toX = (weapon.position.col * 135) + 55 + 20;
                        const toY = (weapon.position.row * 135) + 55 + 20;

                        // Determine line color based on weapon status
                        const isPurchased = !!purchasedWeapons[weaponKey];
                        const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
                        const canPurchase = canAfford && !isPurchased && weapon.cost > 0;
                        let requirementsMet = true;
                        if (weapon.requires && !isPurchased) {
                            requirementsMet = weapon.requires.every(req => purchasedWeapons[req]);
                        }

                        let lineColor;
                        if (isPurchased) {
                            lineColor = '#00ff00'; // Green - player owns this weapon
                        } else if (canPurchase && requirementsMet) {
                            lineColor = '#ffff00'; // Yellow - player can afford and unlock
                        } else {
                            lineColor = '#ff4444'; // Red - cannot afford or missing requirements
                        }

                        // Create line with dynamic color
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', lineColor);
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('opacity', '0.7');

                        svg.appendChild(line);
                    }
                });
            }
        });

        container.appendChild(svg);
    }

    createWeaponNode(branchKey, weaponKey, weapon, purchasedWeapons, branchColor) {
        let isPurchased = !!purchasedWeapons[weaponKey];
        const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
        
        // Check if requirements are met
        let canPurchase = canAfford && !isPurchased && weapon.cost > 0; // Free weapons (cost 0) are auto-unlocked
        if (weapon.requires && !isPurchased) {
            canPurchase = canPurchase && weapon.requires.every(req => purchasedWeapons[req]);
        }

        // Auto-unlock free weapons
        if (weapon.cost === 0 && !isPurchased) {
            this.gameState.purchaseWeapon(branchKey, weaponKey);
            isPurchased = true;
            canPurchase = false;
        }

        const nodeDiv = document.createElement('div');
        nodeDiv.style.cssText = `
            width: 80px;
            height: 80px;
            border: 3px solid ${isPurchased ? '#0f0' : canPurchase ? branchColor : '#666'};
            border-radius: 8px;
            background: ${isPurchased ? 'rgba(0, 150, 0, 0.4)' : canPurchase ? `rgba(255, 255, 255, 0.1)` : 'rgba(60, 60, 60, 0.5)'};
            cursor: ${canPurchase ? 'pointer' : 'default'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.2s;
            position: relative;
        `;

        const title = document.createElement('div');
        title.textContent = weapon.name;
        title.style.cssText = `
            color: ${isPurchased ? '#0f0' : '#fff'};
            font-weight: bold;
            font-size: 10px;
            text-align: center;
            margin-bottom: 2px;
            text-shadow: 1px 1px 0px #000;
        `;

        const cost = document.createElement('div');
        if (weapon.cost > 0) {
            cost.textContent = `${weapon.cost}pts`;
            cost.style.cssText = `
                color: ${canAfford || isPurchased ? '#ccc' : '#f44'};
                font-size: 9px;
                text-align: center;
                text-shadow: 1px 1px 0px #000;
            `;
        }

        nodeDiv.appendChild(title);
        if (weapon.cost > 0) {
            nodeDiv.appendChild(cost);
        }

        if (canPurchase) {
            nodeDiv.addEventListener('click', () => {
                if (this.gameState.purchaseWeapon(branchKey, weaponKey)) {
                    this.refreshWeaponTree();
                }
            });

            nodeDiv.addEventListener('mouseenter', () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.3)';
                nodeDiv.style.transform = 'scale(1.05)';
            });

            nodeDiv.addEventListener('mouseleave', () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.1)';
                nodeDiv.style.transform = 'scale(1)';
            });
        }

        return nodeDiv;
    }

    createConnectionLines(weapons, purchasedWeapons, container, branchColor) {
        // Create SVG for drawing lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        `;

        Object.entries(weapons).forEach(([weaponKey, weapon]) => {
            if (weapon.requires) {
                weapon.requires.forEach(reqKey => {
                    const reqWeapon = weapons[reqKey];
                    if (reqWeapon) {
                        // Calculate line positions
                        const fromX = (reqWeapon.position.col * 95) + 40; // 80px width + 15px gap
                        const fromY = (reqWeapon.position.row * 95) + 40;
                        const toX = (weapon.position.col * 95) + 40;
                        const toY = (weapon.position.row * 95) + 40;

                        // Create line
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', purchasedWeapons[reqKey] ? branchColor : '#444');
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('opacity', purchasedWeapons[reqKey] ? '0.8' : '0.3');

                        svg.appendChild(line);
                    }
                });
            }
        });

        container.appendChild(svg);
    }

    refreshWeaponTree() {
        this.updatePointsDisplay();
        const weaponTreeMenu = document.getElementById('weaponTreeMenu');
        if (weaponTreeMenu) {
            weaponTreeMenu.remove();
            this.showWeaponTree();
        }
    }

    hideWeaponTree() {
        this.hideElement('weaponTreeMenu');
        this.showMainMenu();
    }

    updatePointsDisplay() {
        const pointsDisplays = document.querySelectorAll('#pointsDisplay');
        pointsDisplays.forEach(display => {
            const pointsText = display.querySelector('div');
            if (pointsText) {
                pointsText.textContent = `Points: ${this.gameState.player.weaponTreePoints}`;
            }
        });
    }

    updateWeaponNodeStates() {
        const weaponNodes = document.querySelectorAll('.weapon-node');
        const purchased = this.gameState.getUnlockedWeapons();
        const weaponTree = this.gameState.getWeaponTree();
        
        weaponNodes.forEach(node => {
            const weaponId = node.dataset.weaponId;
            if (!weaponId || !weaponTree.unified.weapons[weaponId]) return;
            
            const weapon = weaponTree.unified.weapons[weaponId];
            const isPurchased = purchased.includes(weaponId);
            const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
            
            // Debug logging for Dragon Sword specifically
            if (weaponId === 'dragonSword') {
                console.log(`Dragon Sword update - isPurchased: ${isPurchased}, canAfford: ${canAfford}, cost: ${weapon.cost}, points: ${this.gameState.player.weaponTreePoints}`);
            }
            
            // Check if requirements are met
            let requirementsMet = true;
            if (weapon.requires && !isPurchased) {
                requirementsMet = weapon.requires.every(req => purchased.includes(req));
            }
            
            const canPurchase = canAfford && !isPurchased && requirementsMet && weapon.cost > 0;
            
            // Update node appearance based on current state
            if (isPurchased) {
                node.style.backgroundColor = 'rgba(0, 150, 0, 0.4)'; // Green for purchased
                node.style.border = '3px solid #0f0';
                node.style.cursor = 'default';
                node.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
            } else if (canPurchase) {
                node.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; // Light for purchasable
                node.style.border = '3px solid #FFD700';
                node.style.cursor = 'pointer';
                node.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            } else if (!requirementsMet) {
                node.style.backgroundColor = 'rgba(60, 60, 60, 0.5)'; // Dark for locked
                node.style.border = '3px solid #666';
                node.style.cursor = 'default';
                node.style.boxShadow = 'none';
            } else if (!canAfford) {
                node.style.backgroundColor = 'rgba(60, 60, 60, 0.5)'; // Dark for unaffordable
                node.style.border = '3px solid #666';
                node.style.cursor = 'default';
                node.style.boxShadow = 'none';
            }
            
            // Update cost text color
            const costElement = node.querySelector('.weapon-cost');
            if (costElement && weapon.cost > 0) {
                costElement.style.color = (canAfford || isPurchased) ? '#ffd700' : '#f44';
                costElement.style.fontWeight = 'bold';
            }
            
            // Update requirement indicator color
            const reqElement = node.querySelector('.weapon-requirement');
            if (reqElement) {
                reqElement.style.color = isPurchased ? '#0f0' : 'white';
            }
        });
        
        // Update connection line colors
        this.updateConnectionLineColors();
    }

    updateConnectionLineColors() {
        const svg = document.querySelector('svg');
        if (!svg) return;
        
        const purchased = this.gameState.getUnlockedWeapons();
        const weaponTree = this.gameState.getWeaponTree();
        const weapons = weaponTree.unified.weapons;
        
        // Clear existing lines
        svg.innerHTML = '';
        
        // Recreate lines with updated colors
        Object.entries(weapons).forEach(([weaponKey, weapon]) => {
            if (weapon.requires) {
                weapon.requires.forEach(reqKey => {
                    const reqWeapon = weapons[reqKey];
                    if (reqWeapon) {
                        // Calculate line positions with new spacing (135px = 110px width + 25px gap)
                        const fromX = (reqWeapon.position.col * 135) + 55 + 20; // +20 for padding
                        const fromY = (reqWeapon.position.row * 135) + 55 + 20;
                        const toX = (weapon.position.col * 135) + 55 + 20;
                        const toY = (weapon.position.row * 135) + 55 + 20;

                        // Determine line color based on weapon status
                        const isPurchased = purchased.includes(weaponKey);
                        const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
                        const canPurchase = canAfford && !isPurchased && weapon.cost > 0;
                        let requirementsMet = true;
                        if (weapon.requires && !isPurchased) {
                            requirementsMet = weapon.requires.every(req => purchased.includes(req));
                        }

                        let lineColor;
                        if (isPurchased) {
                            lineColor = '#00ff00'; // Green - player owns this weapon
                        } else if (canPurchase && requirementsMet) {
                            lineColor = '#ffff00'; // Yellow - player can afford and unlock
                        } else {
                            lineColor = '#ff4444'; // Red - cannot afford or missing requirements
                        }

                        // Create line with dynamic color
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', lineColor);
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('opacity', '0.7');
                        
                        svg.appendChild(line);
                    }
                });
            }
        });
    }
}
