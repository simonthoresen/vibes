import { PLAYER_SKINS } from './constants.js';

export class MenuManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.selectedNodeIndex = 0; // For weapon tree navigation
        this.weaponNodes = []; // Array to store weapon nodes for navigation
        this.isWeaponTreeVisible = false;
        
        // Initialize mobile detection
        this.isMobileDevice = this.detectMobileDevice();
        
        // Initialize weapon tree navigation if on mobile
        if (this.isMobileDevice) {
            this.initWeaponTreeNavigation();
        }
        
        this.setupMainMenu();
        this.setupSkinMenu();
        this.setupPauseMenu();
        this.setupSettingsMenu();
    }

    // Mobile detection utility
    detectMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
        console.log('Mobile detection:', isMobile, 'User agent:', navigator.userAgent);
        return isMobile;
    }

    // Initialize weapon tree keyboard navigation for mobile devices
    initWeaponTreeNavigation() {
        console.log('Initializing weapon tree navigation for mobile');
        
        const handleKeydown = (e) => {
            if (!this.isWeaponTreeVisible) return;
            
            console.log('Key pressed:', e.key, 'Weapon tree visible:', this.isWeaponTreeVisible);
            
            let handled = false;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.navigateWeaponTree('up');
                    handled = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.navigateWeaponTree('down');
                    handled = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.navigateWeaponTree('left');
                    handled = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.navigateWeaponTree('right');
                    handled = true;
                    break;
                case 'Enter':
                case ' ':
                    this.activateSelectedWeaponNode();
                    handled = true;
                    break;
            }
            
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Add keyboard event listener (for external keyboards on iPad)
        document.addEventListener('keydown', handleKeydown);
        
        // Enhanced touch swipe support for mobile devices
        this.initTouchNavigation();
    }

    // Initialize touch navigation specifically for mobile devices
    initTouchNavigation() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        const weaponTreeContainer = () => document.getElementById('weaponTreeMenu');
        
        const handleTouchStart = (e) => {
            if (!this.isWeaponTreeVisible || !weaponTreeContainer()) return;
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            
            console.log('Touch start:', touchStartX, touchStartY);
        };
        
        const handleTouchEnd = (e) => {
            if (!this.isWeaponTreeVisible || !weaponTreeContainer()) return;
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            console.log('Touch end - deltaX:', deltaX, 'deltaY:', deltaY, 'time:', deltaTime);
            
            // Only register swipes that are fast enough and long enough
            const minSwipeDistance = 30; // Reduced for easier swiping
            const maxSwipeTime = 500; // Max time for a swipe
            
            if (deltaTime > maxSwipeTime) {
                console.log('Swipe too slow');
                return;
            }
            
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            
            if (absX > minSwipeDistance || absY > minSwipeDistance) {
                // Determine primary direction
                if (absX > absY) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        console.log('Swiped right');
                        this.navigateWeaponTree('right');
                    } else {
                        console.log('Swiped left');
                        this.navigateWeaponTree('left');
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0) {
                        console.log('Swiped down');
                        this.navigateWeaponTree('down');
                    } else {
                        console.log('Swiped up');
                        this.navigateWeaponTree('up');
                    }
                }
                
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Add touch event listeners to document
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        console.log('Touch navigation initialized');
    }

    // Navigate through weapon tree nodes
    navigateWeaponTree(direction) {
        console.log('Navigating weapon tree:', direction, 'Current index:', this.selectedNodeIndex);
        
        if (this.weaponNodes.length === 0) {
            this.updateWeaponNodesArray();
        }
        
        if (this.weaponNodes.length === 0) {
            console.log('No weapon nodes found');
            return;
        }
        
        // Remove current selection
        this.clearWeaponNodeSelection();
        
        let newIndex = this.selectedNodeIndex;
        
        // Simple navigation - convert linear array to 2D grid
        const nodesPerRow = 3; // Assume 3 weapons per row
        const currentRow = Math.floor(this.selectedNodeIndex / nodesPerRow);
        const currentCol = this.selectedNodeIndex % nodesPerRow;
        
        console.log('Current position:', currentRow, currentCol);
        
        switch(direction) {
            case 'up':
                if (currentRow > 0) {
                    newIndex = (currentRow - 1) * nodesPerRow + currentCol;
                    if (newIndex >= this.weaponNodes.length) {
                        newIndex = this.weaponNodes.length - 1;
                    }
                }
                break;
            case 'down':
                const maxRow = Math.ceil(this.weaponNodes.length / nodesPerRow) - 1;
                if (currentRow < maxRow) {
                    newIndex = (currentRow + 1) * nodesPerRow + currentCol;
                    if (newIndex >= this.weaponNodes.length) {
                        newIndex = this.weaponNodes.length - 1;
                    }
                }
                break;
            case 'left':
                if (currentCol > 0) {
                    newIndex = currentRow * nodesPerRow + (currentCol - 1);
                } else if (currentRow > 0) {
                    // Wrap to end of previous row
                    newIndex = (currentRow - 1) * nodesPerRow + (nodesPerRow - 1);
                    if (newIndex >= this.weaponNodes.length) {
                        newIndex = this.weaponNodes.length - 1;
                    }
                }
                break;
            case 'right':
                if (currentCol < nodesPerRow - 1 && newIndex + 1 < this.weaponNodes.length) {
                    newIndex = currentRow * nodesPerRow + (currentCol + 1);
                } else {
                    // Wrap to start of next row
                    const nextRowStart = (currentRow + 1) * nodesPerRow;
                    if (nextRowStart < this.weaponNodes.length) {
                        newIndex = nextRowStart;
                    }
                }
                break;
        }
        
        // Ensure index is within bounds
        newIndex = Math.max(0, Math.min(newIndex, this.weaponNodes.length - 1));
        
        console.log('New index:', newIndex);
        this.selectedNodeIndex = newIndex;
        
        // Apply selection to new node
        this.applyWeaponNodeSelection();
    }

    // Find node by grid position
    findNodeByPosition(targetRow, targetCol, direction) {
        for (let i = 0; i < this.weaponNodes.length; i++) {
            const node = this.weaponNodes[i];
            const nodeRow = parseInt(node.dataset.row) || 0;
            const nodeCol = parseInt(node.dataset.col) || 0;
            
            if (nodeRow === targetRow && nodeCol === targetCol) {
                return i;
            }
        }
        
        // If no exact match, find closest node in that direction
        return this.findClosestNode(targetRow, targetCol, direction);
    }

    // Find closest node when exact position doesn't exist
    findClosestNode(targetRow, targetCol, direction) {
        let closest = -1;
        let minDistance = Infinity;
        
        for (let i = 0; i < this.weaponNodes.length; i++) {
            const node = this.weaponNodes[i];
            const nodeRow = parseInt(node.dataset.row) || 0;
            const nodeCol = parseInt(node.dataset.col) || 0;
            
            let isValidDirection = false;
            switch(direction) {
                case 'up':
                    isValidDirection = nodeRow < targetRow;
                    break;
                case 'down':
                    isValidDirection = nodeRow > targetRow;
                    break;
                case 'left':
                    isValidDirection = nodeCol < targetCol;
                    break;
                case 'right':
                    isValidDirection = nodeCol > targetCol;
                    break;
            }
            
            if (isValidDirection) {
                const distance = Math.abs(nodeRow - targetRow) + Math.abs(nodeCol - targetCol);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = i;
                }
            }
        }
        
        return closest;
    }

    // Update the array of weapon nodes for navigation
    updateWeaponNodesArray() {
        this.weaponNodes = Array.from(document.querySelectorAll('.weapon-node')).filter(node => {
            return node.style.display !== 'none' && node.offsetParent !== null;
        });
        
        console.log('Updated weapon nodes array:', this.weaponNodes.length, 'nodes found');
        
        // Sort nodes by their position in the DOM (left to right, top to bottom)
        this.weaponNodes.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            
            // First sort by top position (row), then by left position (column)
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });
    }

    // Clear current selection styling
    clearWeaponNodeSelection() {
        const currentNode = this.weaponNodes[this.selectedNodeIndex];
        if (currentNode && this.isMobileDevice) {
            // Remove mobile selection border (no yellow border on mobile)
            currentNode.style.boxShadow = currentNode.dataset.originalBoxShadow || 'none';
            currentNode.style.transform = 'scale(1)';
        }
    }

    // Apply selection styling to current node
    applyWeaponNodeSelection() {
        const currentNode = this.weaponNodes[this.selectedNodeIndex];
        console.log('Applying selection to node:', this.selectedNodeIndex, currentNode);
        
        if (currentNode && this.isMobileDevice) {
            // Store original styling
            currentNode.dataset.originalBoxShadow = currentNode.style.boxShadow || 'none';
            
            // Apply mobile-specific selection (white glow instead of yellow)
            currentNode.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6)';
            currentNode.style.transform = 'scale(1.1)';
            currentNode.style.zIndex = '1000';
            
            console.log('Applied mobile selection styling');
        }
    }

    // Activate the currently selected weapon node
    activateSelectedWeaponNode() {
        const currentNode = this.weaponNodes[this.selectedNodeIndex];
        if (currentNode && currentNode.style.cursor === 'pointer') {
            currentNode.click();
        }
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
        // Remove any existing skin menu first
        const existingSkinMenu = document.getElementById('skinMenu');
        if (existingSkinMenu) {
            existingSkinMenu.remove();
        }
        
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
        const openCanvasButton = this.createButton('🎨 Open Canvas', () => this.openCustomSkinDrawing());
        
        // Style the canvas button to make it stand out
        openCanvasButton.style.backgroundColor = '#4CAF50';
        openCanvasButton.style.marginBottom = '20px';
        
        console.log('Canvas button created:', openCanvasButton);
        
        const backButton = this.createButton('Back', () => this.hideSkinMenu());

        content.appendChild(title);
        content.appendChild(skinsGrid);
        content.appendChild(openCanvasButton);
        content.appendChild(backButton);
        
        console.log('Menu content structure:', content);
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
                const handleReset = (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to reset your weapon tree progress? This will unlock only Sword, Scythe, and Bow, and set your points to 0. This action cannot be undone!')) {
                        if (this.gameState.resetWeaponTree()) {
                            alert('Weapon tree progress has been reset successfully!');
                            this.updatePointsDisplay();
                            // Refresh weapon tree if it's open
                            if (document.getElementById('weaponTreeMenu') && document.getElementById('weaponTreeMenu').style.display !== 'none') {
                                this.refreshWeaponTree();
                            }
                        }
                    }
                };
                
                resetBtn.addEventListener('click', handleReset);
                resetBtn.addEventListener('touchend', handleReset);
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
        
        // Add both click and touch support for iPad
        button.onclick = onClick;
        button.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent double-firing with click
            onClick();
        });
        
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
        pointsText.textContent = `Points: ${this.gameState.player.displayedWeaponTreePoints}`;

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
                const handleSkinsClick = (e) => {
                    e.preventDefault();
                    this.showSkinMenu();
                };
                skinsButton.onclick = handleSkinsClick;
                skinsButton.addEventListener('touchend', handleSkinsClick);
            } else {
                skinsButton.style.opacity = '0.5';
                skinsButton.style.cursor = 'not-allowed';
                const handleDisabledClick = (e) => {
                    e.preventDefault();
                };
                skinsButton.onclick = handleDisabledClick;
                skinsButton.addEventListener('touchend', handleDisabledClick);
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

        // Create skin options synchronously
        PLAYER_SKINS.forEach(skin => {
            const skinContainer = this.createSkinOption(skin);
            skinsGrid.appendChild(skinContainer);
        });
        
        // Custom skin option removed - only using Open Canvas button now

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
        const handleSkinClick = (e) => {
            e.preventDefault();
            this.selectSkin(skin, skinOption);
        };
        skinOption.addEventListener('touchend', handleSkinClick);
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
        const handleHover = () => {
            button.style.transform = 'scale(1.05)';
            button.style.backgroundColor = isStart ? '#4CAF50' : '#444';
        };
        
        const handleUnhover = () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = '#333';
        };

        // Mouse events
        button.addEventListener('mouseenter', handleHover);
        button.addEventListener('mouseleave', handleUnhover);
        
        // Touch events for iPad
        button.addEventListener('touchstart', handleHover);
        button.addEventListener('touchcancel', handleUnhover);
    }

    addSkinHoverEffects(skinOption) {
        const handleHover = () => {
            skinOption.style.transform = 'scale(1.1)';
        };
        
        const handleUnhover = () => {
            skinOption.style.transform = 'scale(1)';
        };

        // Mouse events
        skinOption.addEventListener('mouseenter', handleHover);
        skinOption.addEventListener('mouseleave', handleUnhover);
        
        // Touch events for iPad
        skinOption.addEventListener('touchstart', handleHover);
        skinOption.addEventListener('touchcancel', handleUnhover);
    }

    createCustomSkinOption() {
        const customOption = document.createElement('div');
        customOption.className = 'skin-option';
        customOption.style.cssText = `
            width: 80px;
            height: 80px;
            margin: 5px;
            border: 2px solid ${this.gameState.player.skin === 'custom' ? '#fff' : '#555'};
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(45deg, #444, #666);
            color: white;
            font-size: 12px;
            text-align: center;
        `;

        // Check if custom skin exists and show preview
        const customSkinData = localStorage.getItem('customSkin');
        if (customSkinData) {
            customOption.innerHTML = `
                <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; margin-bottom: 5px; background: white;">
                    <img src="${customSkinData}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div>Custom</div>
            `;
        } else {
            customOption.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">🎨</div>
                <div>Custom</div>
            `;
        }

        customOption.addEventListener('click', () => {
            this.openCustomSkinDrawing();
        });

        this.addSkinHoverEffects(customOption);
        
        // Create container to match other skins
        const container = document.createElement('div');
        container.appendChild(customOption);
        
        return container;
    }

    openCustomSkinDrawing() {
        // Create drawing interface overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        // Create drawing container
        const container = document.createElement('div');
        container.style.cssText = `
            background: #333;
            border-radius: 10px;
            padding: 20px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        `;

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Draw Face & Accessories';
        title.style.cssText = `
            color: white;
            text-align: center;
            margin: 0 0 20px 0;
        `;

        // Canvas for drawing
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        canvas.style.cssText = `
            border: 2px solid #666;
            background: white;
            display: block;
            margin: 0 auto 20px auto;
            cursor: crosshair;
        `;

        // Color palette
        const colorPalette = document.createElement('div');
        colorPalette.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 5px;
            margin-bottom: 20px;
        `;

        const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080'];
        let currentColor = '#000000';

        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.style.cssText = `
                width: 30px;
                height: 30px;
                background: ${color};
                border: 2px solid ${color === currentColor ? '#fff' : '#555'};
                border-radius: 50%;
                cursor: pointer;
            `;
            colorBtn.addEventListener('click', () => {
                currentColor = color;
                // Update all color button borders
                colorPalette.querySelectorAll('button').forEach(btn => {
                    btn.style.border = `2px solid ${btn.style.background === color ? '#fff' : '#555'}`;
                });
            });
            colorPalette.appendChild(colorBtn);
        });

        // Brush size control
        const brushContainer = document.createElement('div');
        brushContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            color: white;
        `;

        const brushLabel = document.createElement('span');
        brushLabel.textContent = 'Brush Size:';

        const brushSize = document.createElement('input');
        brushSize.type = 'range';
        brushSize.min = '1';
        brushSize.max = '20';
        brushSize.value = '5';
        brushSize.style.cssText = `
            width: 100px;
        `;

        const brushValue = document.createElement('span');
        brushValue.textContent = '5px';

        brushSize.addEventListener('input', () => {
            brushValue.textContent = brushSize.value + 'px';
        });

        brushContainer.appendChild(brushLabel);
        brushContainer.appendChild(brushSize);
        brushContainer.appendChild(brushValue);

        // Action buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        `;

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = `
            padding: 10px 20px;
            background: #666;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save & Use';
        saveBtn.style.cssText = `
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;

        // Canvas drawing functionality
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        // Load existing custom accessories if any
        const savedAccessories = localStorage.getItem('customAccessories');
        if (savedAccessories) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = savedAccessories;
        }

        const startDrawing = (e) => {
            isDrawing = true;
            draw(e);
        };

        const draw = (e) => {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;

            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = parseInt(brushSize.value);
            ctx.lineCap = 'round';

            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        const stopDrawing = () => {
            if (isDrawing) {
                isDrawing = false;
                ctx.beginPath();
            }
        };

        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events for iPad
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e);
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopDrawing();
        });

        // Button events
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        saveBtn.addEventListener('click', () => {
            const dataURL = canvas.toDataURL();
            localStorage.setItem('customAccessories', dataURL);
            
            // Refresh accessories in renderer
            if (this.gameState.renderer) {
                this.gameState.renderer.refreshCustomAccessories();
            }
            
            document.body.removeChild(overlay);
            
            // No need to refresh skins grid since we're not changing the skin selection
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Assemble the interface
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);

        container.appendChild(title);
        container.appendChild(canvas);
        container.appendChild(colorPalette);
        container.appendChild(brushContainer);
        container.appendChild(buttonContainer);

        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    selectSkin(skin, skinOption) {
        this.gameState.player.skin = skin;
        
        // Save skin to localStorage
        if (typeof skin === 'string') {
            localStorage.setItem('playerSkin', skin);
        } else {
            localStorage.setItem('playerSkin', skin.name);
        }
        
        // Update visual selection
        document.querySelectorAll('#skinMenu .skin-option').forEach(opt => {
            opt.style.border = '3px solid transparent';
        });
        if (skinOption) {
            skinOption.style.border = '3px solid #fff';
        }
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
        this.isWeaponTreeVisible = true;
        
        // Always refresh the weapon tree display when showing it
        this.updatePointsDisplay();
        
        // Use setTimeout to ensure DOM is fully rendered before updating styles
        setTimeout(() => {
            this.updateWeaponNodeStates();
            
            // Initialize navigation for mobile
            if (this.isMobileDevice) {
                this.updateWeaponNodesArray();
                this.selectedNodeIndex = 0;
                this.applyWeaponNodeSelection();
            }
        }, 50);
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
        content.style.overflow = 'hidden';
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
        // Style back button to span full width of content
        backButton.style.cssText += `
            width: 100%;
            margin-top: 20px;
        `;

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
            max-height: 80vh;
            width: 95vw;
            max-width: 1600px;
            overflow-y: auto;
            overflow-x: hidden;
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
        
        // Debug: Compare the two data sources
        const purchasedList = this.gameState.getUnlockedWeapons();
        console.log('loadWeaponTreeUpgrades():', purchased);
        console.log('getUnlockedWeapons():', purchasedList);

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
        const canAfford = this.gameState.player.displayedWeaponTreePoints >= weapon.cost;
        
        // Check if requirements are met
        let canPurchase = canAfford && !isPurchased && weapon.cost > 0;
        if (weapon.requires && !isPurchased) {
            canPurchase = canPurchase && weapon.requires.every(req => purchasedWeapons[req]);
        }

        // Temporary debug for specific weapons
        if (weapon.name === 'Dragon Bow' || weapon.name === 'Fire Staff') {
            console.log(`${weapon.name}: isPurchased=${isPurchased}, canPurchase=${canPurchase}, weaponKey=${weaponKey}`);
            console.log(`purchasedWeapons[${weaponKey}] = ${purchasedWeapons[weaponKey]}`);
            
            // Temporary: Force these weapons to show as purchased for testing
            // isPurchased = true;
            // canPurchase = false;
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
        
        // Additional debug for Dragon weapons
        if (weapon.name.includes('Dragon')) {
            console.log(`Creating Dragon node: ${weapon.name}, isPurchased: ${isPurchased}, canPurchase: ${canPurchase}`);
            console.log('Current styling will be:');
            console.log(`- Border: ${isPurchased ? '#0f0' : canPurchase ? '#FFD700' : '#666'}`);
            console.log(`- Background: ${isPurchased ? 'rgba(0, 255, 0, 0.6)' : canPurchase ? 'rgba(255, 215, 0, 0.15)' : 'rgba(60, 60, 60, 0.5)'}`);
        }
        
        // Mobile-specific styling (no yellow borders)
        let borderColor, backgroundColor, boxShadow;
        
        console.log('Creating weapon node - isMobile:', this.isMobileDevice, 'canPurchase:', canPurchase, 'isPurchased:', isPurchased);
        
        if (isPurchased) {
            borderColor = '#0f0';
            backgroundColor = 'rgba(0, 150, 0, 0.4)';
            boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
        } else if (canPurchase) {
            if (this.isMobileDevice) {
                // Mobile: no yellow border, use neutral styling
                borderColor = '#999999';
                backgroundColor = 'rgba(160, 160, 160, 0.15)';
                boxShadow = 'none';
                console.log('Applied mobile styling for purchasable weapon');
            } else {
                // Desktop: keep yellow border
                borderColor = '#FFD700';
                backgroundColor = 'rgba(255, 215, 0, 0.15)';
                boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
                console.log('Applied desktop styling for purchasable weapon');
            }
        } else {
            borderColor = '#666666';
            backgroundColor = 'rgba(60, 60, 60, 0.5)';
            boxShadow = 'none';
        }
        
        nodeDiv.style.cssText = `
            width: 100px;
            height: 100px;
            border: 3px solid ${borderColor};
            border-radius: 15px;
            background: ${backgroundColor};
            cursor: ${canPurchase ? 'pointer' : 'default'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.3s;
            position: relative;
            box-shadow: ${boxShadow};
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
            const handlePurchase = () => {
                if (this.gameState.purchaseWeapon(branchKey, weaponKey)) {
                    this.refreshWeaponTree();
                }
            };

            // Add both click and touch support for iPad
            nodeDiv.addEventListener('click', handlePurchase);
            nodeDiv.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent double-firing with click
                handlePurchase();
            });

            const handleHover = () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.25)';
                nodeDiv.style.transform = 'scale(1.1)';
                
                if (this.isMobileDevice) {
                    // Mobile: white glow instead of yellow
                    nodeDiv.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.6)';
                } else {
                    // Desktop: yellow glow
                    nodeDiv.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
                }
            };

            const handleUnhover = () => {
                // Reset to original styling based on device type
                if (this.isMobileDevice) {
                    nodeDiv.style.background = 'rgba(160, 160, 160, 0.15)';
                    nodeDiv.style.boxShadow = 'none';
                } else {
                    nodeDiv.style.background = 'rgba(255, 215, 0, 0.15)';
                    nodeDiv.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
                }
                nodeDiv.style.transform = 'scale(1)';
            };

            // Mouse events
            nodeDiv.addEventListener('mouseenter', handleHover);
            nodeDiv.addEventListener('mouseleave', handleUnhover);

            // Touch events for iPad
            nodeDiv.addEventListener('touchstart', handleHover);
            nodeDiv.addEventListener('touchcancel', handleUnhover);
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

                        // Determine line color based on both source and target weapon status
                        const targetIsPurchased = !!purchasedWeapons[weaponKey];
                        const sourceIsPurchased = !!purchasedWeapons[reqKey];
                        const canAfford = Number(this.gameState.player.weaponTreePoints) >= Number(weapon.cost);
                        
                        // Check if all requirements for target weapon are met
                        let requirementsMet = true;
                        if (weapon.requires && !targetIsPurchased) {
                            requirementsMet = weapon.requires.every(req => !!purchasedWeapons[req]);
                        }

                        let lineColor;
                        let lineOpacity;
                        
                        if (sourceIsPurchased && targetIsPurchased) {
                            // Green: Both source and target are unlocked
                            lineColor = '#00ff00';
                            lineOpacity = '0.8';
                        } else if (sourceIsPurchased && !targetIsPurchased && requirementsMet && canAfford && weapon.cost > 0) {
                            // Yellow: Source is unlocked, all requirements met, AND player can afford target
                            lineColor = '#FFD700';
                            lineOpacity = '0.7';
                        } else if (sourceIsPurchased && !targetIsPurchased && requirementsMet && !canAfford) {
                            // Orange: Source is unlocked, requirements met, but can't afford target
                            lineColor = '#CC6600';
                            lineOpacity = '0.6';
                        } else if (sourceIsPurchased && !targetIsPurchased && !requirementsMet) {
                            // Light Red: Source is unlocked but other requirements not met
                            lineColor = '#FF6666';
                            lineOpacity = '0.5';
                        } else {
                            // Red: Source is not unlocked (requirement not met)
                            lineColor = '#FF4444';
                            lineOpacity = '0.3';
                        }

                        // Debug logging for Fire Staff connections specifically
                        if (weapon.name === 'Fire Staff') {
                            // Force numeric comparison for Fire Staff
                            const actualCanAfford = Number(this.gameState.player.weaponTreePoints) >= Number(weapon.cost);
                            console.log(`🔥 Fire Staff line from ${reqKey}: ${lineColor === '#FFD700' ? 'YELLOW' : lineColor === '#CC6600' ? 'ORANGE' : 'OTHER'}`);
                            console.log(`- canAfford: ${canAfford} (${this.gameState.player.displayedWeaponTreePoints} >= ${weapon.cost})`);
                            console.log(`- actualCanAfford: ${actualCanAfford}`);
                            console.log(`- Player points type: ${typeof this.gameState.player.displayedWeaponTreePoints}, value: ${this.gameState.player.displayedWeaponTreePoints}`);
                            console.log(`- Weapon cost type: ${typeof weapon.cost}, value: ${weapon.cost}`);
                            console.log(`- Comparison result: ${this.gameState.player.weaponTreePoints >= weapon.cost}`);
                            console.log(`- Manual comparison: ${Number(this.gameState.player.weaponTreePoints) >= Number(weapon.cost)}`);
                            console.log(`- All conditions: sourceIsPurchased=${sourceIsPurchased}, !targetIsPurchased=${!targetIsPurchased}, requirementsMet=${requirementsMet}, canAfford=${canAfford}, cost>0=${weapon.cost > 0}`);
                        }

                        // Create line with dynamic color
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', lineColor);
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('opacity', lineOpacity);

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
            border: 3px solid ${isPurchased ? '#0f0' : canPurchase ? '#FFD700' : '#666'};
            border-radius: 8px;
            background: ${isPurchased ? 'rgba(0, 255, 0, 0.6)' : canPurchase ? `rgba(255, 215, 0, 0.15)` : 'rgba(60, 60, 60, 0.5)'};
            cursor: ${canPurchase ? 'pointer' : 'default'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.2s;
            position: relative;
            box-shadow: ${isPurchased ? '0 0 15px rgba(0, 255, 0, 0.8)' : canPurchase ? '0 0 8px rgba(255, 215, 0, 0.3)' : 'none'};
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
            const handlePurchase = () => {
                if (this.gameState.purchaseWeapon(branchKey, weaponKey)) {
                    this.refreshWeaponTree();
                }
            };

            // Add both click and touch support for iPad
            nodeDiv.addEventListener('click', handlePurchase);
            nodeDiv.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent double-firing with click
                handlePurchase();
            });

            const handleHover = () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.3)';
                nodeDiv.style.transform = 'scale(1.05)';
            };

            const handleUnhover = () => {
                nodeDiv.style.background = 'rgba(255, 255, 255, 0.1)';
                nodeDiv.style.transform = 'scale(1)';
            };

            // Mouse events
            nodeDiv.addEventListener('mouseenter', handleHover);
            nodeDiv.addEventListener('mouseleave', handleUnhover);

            // Touch events for iPad
            nodeDiv.addEventListener('touchstart', handleHover);
            nodeDiv.addEventListener('touchcancel', handleUnhover);
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
        this.isWeaponTreeVisible = false;
        
        // Clear selection when hiding
        if (this.isMobileDevice) {
            this.clearWeaponNodeSelection();
        }
        
        this.showMainMenu();
    }

    updatePointsDisplay() {
        // Check if there are pending points to animate
        if (this.gameState.hasPendingPointsAnimation()) {
            this.animatePointsUpdate();
        } else {
            // Direct update if no animation needed
            this.updatePointsDisplayText(this.gameState.player.weaponTreePoints);
        }
    }

    updatePointsDisplayText(points) {
        const pointsDisplays = document.querySelectorAll('#pointsDisplay');
        pointsDisplays.forEach(display => {
            const pointsText = display.querySelector('div');
            if (pointsText) {
                pointsText.textContent = `Points: ${points}`;
            }
        });
    }

    animatePointsUpdate() {
        // Start the smooth animation
        this.gameState.startPointsAnimation(
            // onUpdate callback - called during animation
            (currentPoints) => {
                this.updatePointsDisplayText(currentPoints);
            },
            // onComplete callback - called when animation finishes
            () => {
                // Update weapon tree display since affordability may have changed
                this.updateWeaponNodeStates();
                console.log('Points animation completed');
            }
        );
    }

    updateWeaponNodeStates() {
        const weaponNodes = document.querySelectorAll('.weapon-node');
        const purchasedData = this.gameState.loadWeaponTreeUpgrades();
        const purchasedWeapons = purchasedData.unified || {};
        const weaponTree = this.gameState.getWeaponTree();
        
        console.log(`updateWeaponNodeStates: Found ${weaponNodes.length} weapon nodes`);
        console.log('Purchased weapons data:', purchasedWeapons);
        
        weaponNodes.forEach(node => {
            const weaponId = node.dataset.weaponId;
            if (!weaponId || !weaponTree.unified.weapons[weaponId]) return;
            
            const weapon = weaponTree.unified.weapons[weaponId];
            const isPurchased = !!purchasedWeapons[weaponId];
            const canAfford = this.gameState.player.displayedWeaponTreePoints >= weapon.cost;
            
            // Debug logging for all weapons to see the comparison
            console.log(`${weapon.name} (${weaponId}): isPurchased = ${isPurchased}, purchasedWeapons[${weaponId}] = ${purchasedWeapons[weaponId]}`);
            
            // Debug logging for Dragon weapons specifically
            if (weaponId === 'dragonSword') {
                console.log(`Dragon Sword update - isPurchased: ${isPurchased}, canAfford: ${canAfford}, cost: ${weapon.cost}, points: ${this.gameState.player.weaponTreePoints}`);
            }
            if (weaponId === 'dragonBow') {
                console.log(`Dragon Bow update - isPurchased: ${isPurchased}, canAfford: ${canAfford}, cost: ${weapon.cost}, points: ${this.gameState.player.weaponTreePoints}`);
                console.log(`Dragon Bow node style before update:`, node.style.backgroundColor, node.style.border);
            }
            
            // Check if requirements are met
            let requirementsMet = true;
            if (weapon.requires && !isPurchased) {
                requirementsMet = weapon.requires.every(req => !!purchasedWeapons[req]);
            }
            
            const canPurchase = canAfford && !isPurchased && requirementsMet && weapon.cost > 0;
            
            // Update node appearance based on current state
            if (isPurchased) {
                node.style.backgroundColor = 'rgba(0, 150, 0, 0.4)'; // Green for purchased
                node.style.border = '3px solid #0f0';
                node.style.cursor = 'default';
                node.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
                
                // Debug logging for Dragon Bow after style application
                if (weaponId === 'dragonBow') {
                    console.log(`Dragon Bow styled as purchased - backgroundColor: ${node.style.backgroundColor}, border: ${node.style.border}`);
                }
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
        
        const purchasedData = this.gameState.loadWeaponTreeUpgrades();
        const purchasedWeapons = purchasedData.unified || {};
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

                        // Determine line color based on both source and target weapon status
                        const targetIsPurchased = !!purchasedWeapons[weaponKey];
                        const sourceIsPurchased = !!purchasedWeapons[reqKey];
                        const canAfford = Number(this.gameState.player.weaponTreePoints) >= Number(weapon.cost);
                        
                        // Check if all requirements for target weapon are met
                        let requirementsMet = true;
                        if (weapon.requires && !targetIsPurchased) {
                            requirementsMet = weapon.requires.every(req => !!purchasedWeapons[req]);
                        }

                        let lineColor;
                        let lineOpacity;
                        
                        if (sourceIsPurchased && targetIsPurchased) {
                            // Green: Both source and target are unlocked
                            lineColor = '#00ff00';
                            lineOpacity = '0.8';
                        } else if (sourceIsPurchased && !targetIsPurchased && requirementsMet && canAfford && weapon.cost > 0) {
                            // Yellow: Source is unlocked, all requirements met, AND player can afford target
                            lineColor = '#FFD700';
                            lineOpacity = '0.7';
                        } else if (sourceIsPurchased && !targetIsPurchased && requirementsMet && !canAfford) {
                            // Orange: Source is unlocked, requirements met, but can't afford target
                            lineColor = '#CC6600';
                            lineOpacity = '0.6';
                        } else if (sourceIsPurchased && !targetIsPurchased && !requirementsMet) {
                            // Light Red: Source is unlocked but other requirements not met
                            lineColor = '#FF6666';
                            lineOpacity = '0.5';
                        } else {
                            // Red: Source is not unlocked (requirement not met)
                            lineColor = '#FF4444';
                            lineOpacity = '0.3';
                        }

                        // Debug logging for Fire Staff connections in update function
                        if (weapon.name === 'Fire Staff') {
                            console.log(`🔥 UPDATE Fire Staff line from ${reqKey}: ${lineColor === '#FFD700' ? 'YELLOW' : lineColor === '#CC6600' ? 'ORANGE' : 'OTHER'}`);
                            console.log(`- UPDATE canAfford: ${canAfford} (${this.gameState.player.weaponTreePoints} >= ${weapon.cost})`);
                        }

                        // Create line with dynamic color and opacity
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', fromX);
                        line.setAttribute('y1', fromY);
                        line.setAttribute('x2', toX);
                        line.setAttribute('y2', toY);
                        line.setAttribute('stroke', lineColor);
                        line.setAttribute('stroke-width', '2');
                        line.setAttribute('opacity', lineOpacity);
                        
                        svg.appendChild(line);
                    }
                });
            }
        });
    }
}
