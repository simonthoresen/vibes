import { PLAYER_SKINS } from './constants.js';

export class MenuManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.selectedNodeIndex = 0; // For weapon tree navigation
        this.weaponNodes = []; // Array to store weapon nodes for navigation
        this.isWeaponTreeVisible = false;
        
        // Initialize mobile detection
        this.isMobileDevice = this.detectMobileDevice();
        
        // Initialize weapon tree navigation for all devices (mobile gets touch, all get keyboard)
        this.initWeaponTreeNavigation();
        
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
        
        // Enhanced touch swipe support - works for all devices
        this.initTouchNavigation();
    }

    // Initialize touch navigation for all touch-capable devices
    initTouchNavigation() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isNavigating = false;
        
        console.log('Setting up touch navigation...');
        
        const handleTouchStart = (e) => {
            const weaponTreeMenu = document.getElementById('weaponTreeMenu');
            if (!weaponTreeMenu || weaponTreeMenu.style.display === 'none' || !this.isWeaponTreeVisible) {
                console.log('Touch ignored - weapon tree not visible');
                return;
            }
            
            // Check if touch is actually within the weapon tree area
            const rect = weaponTreeMenu.getBoundingClientRect();
            const touch = e.touches[0];
            
            if (touch.clientX < rect.left || touch.clientX > rect.right ||
                touch.clientY < rect.top || touch.clientY > rect.bottom) {
                console.log('Touch outside weapon tree area');
                return;
            }
            
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isNavigating = false;
            
            console.log('Touch start detected in weapon tree:', {
                x: touchStartX, 
                y: touchStartY, 
                weaponTreeVisible: this.isWeaponTreeVisible,
                rect: rect
            });
        };
        
        const handleTouchMove = (e) => {
            const weaponTreeMenu = document.getElementById('weaponTreeMenu');
            if (!weaponTreeMenu || weaponTreeMenu.style.display === 'none' || !this.isWeaponTreeVisible || isNavigating) {
                return;
            }
            
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            
            const deltaX = currentX - touchStartX;
            const deltaY = currentY - touchStartY;
            
            // Very low threshold for immediate detection
            const minDistance = 5; // Extremely low for maximum sensitivity
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            
            console.log('Touch move:', {
                deltaX: deltaX,
                deltaY: deltaY,
                absX: absX,
                absY: absY,
                minDistance: minDistance,
                weaponTreeVisible: this.isWeaponTreeVisible
            });
            
            if (absX > minDistance || absY > minDistance) {
                isNavigating = true;
                
                console.log('Navigation triggered during move');
                
                // Clear direction preference - handle both horizontal and vertical equally
                if (absX >= absY) {
                    // Horizontal movement (prioritize left/right)
                    if (deltaX > 0) {
                        console.log('SWIPED RIGHT (move) - deltaX:', deltaX);
                        this.navigateWeaponTree('right');
                    } else {
                        console.log('SWIPED LEFT (move) - deltaX:', deltaX);
                        this.navigateWeaponTree('left');
                    }
                } else {
                    // Vertical movement
                    if (deltaY > 0) {
                        console.log('SWIPED DOWN (move) - deltaY:', deltaY);
                        this.navigateWeaponTree('down');
                    } else {
                        console.log('SWIPED UP (move) - deltaY:', deltaY);
                        this.navigateWeaponTree('up');
                    }
                }
                
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        const handleTouchEnd = (e) => {
            const weaponTreeMenu = document.getElementById('weaponTreeMenu');
            if (!weaponTreeMenu || weaponTreeMenu.style.display === 'none' || !this.isWeaponTreeVisible) {
                return;
            }
            
            // If we already handled navigation during touchmove, don't do it again
            if (isNavigating) {
                console.log('Navigation already handled during touchmove - skipping touchend');
                return;
            }
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            console.log('Touch end detected:', {
                deltaX: deltaX,
                deltaY: deltaY,
                deltaTime: deltaTime,
                wasNavigating: isNavigating
            });
            
            // Fallback detection for quick swipes that didn't trigger during move
            const minSwipeDistance = 3; // Extremely low threshold for maximum sensitivity
            const maxSwipeTime = 2000; // Very generous time allowance
            
            if (deltaTime > maxSwipeTime) {
                console.log('Touch too slow:', deltaTime);
                return;
            }
            
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            
            if (absX > minSwipeDistance || absY > minSwipeDistance) {
                console.log('Fallback navigation triggered in touchend');
                
                // Determine primary direction
                if (absX >= absY) {
                    // Horizontal swipe - prioritize left/right
                    if (deltaX > 0) {
                        console.log('SWIPED RIGHT (end) - deltaX:', deltaX);
                        this.navigateWeaponTree('right');
                    } else {
                        console.log('SWIPED LEFT (end) - deltaX:', deltaX);
                        this.navigateWeaponTree('left');
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0) {
                        console.log('SWIPED DOWN (end) - deltaY:', deltaY);
                        this.navigateWeaponTree('down');
                    } else {
                        console.log('SWIPED UP (end) - deltaY:', deltaY);
                        this.navigateWeaponTree('up');
                    }
                }
                
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Remove any existing listeners first
        document.removeEventListener('touchstart', this.handleTouchStartBound);
        document.removeEventListener('touchmove', this.handleTouchMoveBound);
        document.removeEventListener('touchend', this.handleTouchEndBound);
        
        // Bind functions to this instance so we can remove them later
        this.handleTouchStartBound = handleTouchStart.bind(this);
        this.handleTouchMoveBound = handleTouchMove.bind(this);
        this.handleTouchEndBound = handleTouchEnd.bind(this);
        
        // Add touch event listeners with passive: false to allow preventDefault
        document.addEventListener('touchstart', this.handleTouchStartBound, { 
            passive: false, 
            capture: true 
        });
        document.addEventListener('touchmove', this.handleTouchMoveBound, { 
            passive: false, 
            capture: true 
        });
        document.addEventListener('touchend', this.handleTouchEndBound, { 
            passive: false, 
            capture: true 
        });
        
        // Also add to the weapon tree menu specifically for extra coverage
        const weaponTreeMenu = document.getElementById('weaponTreeMenu');
        if (weaponTreeMenu) {
            weaponTreeMenu.addEventListener('touchstart', this.handleTouchStartBound, { 
                passive: false 
            });
            weaponTreeMenu.addEventListener('touchmove', this.handleTouchMoveBound, { 
                passive: false 
            });
            weaponTreeMenu.addEventListener('touchend', this.handleTouchEndBound, { 
                passive: false 
            });
            console.log('Touch events also bound directly to weaponTreeMenu');
        }
        
        console.log('Enhanced touch navigation initialized with ultra-sensitive detection');
    }

    // Navigate through weapon tree nodes
    navigateWeaponTree(direction) {
        console.log('🔥 NAVIGATE WEAPON TREE CALLED:', direction, 'Current index:', this.selectedNodeIndex);
        console.log('🔥 Weapon tree visible:', this.isWeaponTreeVisible);
        console.log('🔥 Current weapon nodes count:', this.weaponNodes.length);
        
        if (this.weaponNodes.length === 0) {
            console.log('🔥 Updating weapon nodes array...');
            this.updateWeaponNodesArray();
        }
        
        if (this.weaponNodes.length === 0) {
            console.log('🔥 No weapon nodes found after update');
            return;
        }
        
        // Remove current selection
        this.clearWeaponNodeSelection();
        
        let newIndex = this.selectedNodeIndex;
        
        // Simple navigation - convert linear array to 2D grid
        const nodesPerRow = 3; // Assume 3 weapons per row
        const currentRow = Math.floor(this.selectedNodeIndex / nodesPerRow);
        const currentCol = this.selectedNodeIndex % nodesPerRow;
        
        console.log('🔥 Current position:', currentRow, currentCol, 'Direction:', direction);
        
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
                console.log('🔥 PROCESSING LEFT NAVIGATION');
                if (currentCol > 0) {
                    newIndex = currentRow * nodesPerRow + (currentCol - 1);
                    console.log('🔥 Moving left in same row to index:', newIndex);
                } else if (currentRow > 0) {
                    // Wrap to end of previous row
                    newIndex = (currentRow - 1) * nodesPerRow + (nodesPerRow - 1);
                    if (newIndex >= this.weaponNodes.length) {
                        newIndex = this.weaponNodes.length - 1;
                    }
                    console.log('🔥 Wrapping to previous row, index:', newIndex);
                }
                break;
            case 'right':
                console.log('🔥 PROCESSING RIGHT NAVIGATION');
                if (currentCol < nodesPerRow - 1 && newIndex + 1 < this.weaponNodes.length) {
                    newIndex = currentRow * nodesPerRow + (currentCol + 1);
                    console.log('🔥 Moving right in same row to index:', newIndex);
                } else {
                    // Wrap to start of next row
                    const nextRowStart = (currentRow + 1) * nodesPerRow;
                    if (nextRowStart < this.weaponNodes.length) {
                        newIndex = nextRowStart;
                        console.log('🔥 Wrapping to next row, index:', newIndex);
                    }
                }
                break;
        }
        
        // Ensure index is within bounds
        newIndex = Math.max(0, Math.min(newIndex, this.weaponNodes.length - 1));
        
        console.log('🔥 Final new index:', newIndex, 'Previous index:', this.selectedNodeIndex);
        this.selectedNodeIndex = newIndex;
        
        // Apply selection to new node
        this.applyWeaponNodeSelection();
        
        console.log('🔥 Navigation completed successfully');
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
        if (currentNode) {
            // Remove selection border for all devices
            currentNode.style.boxShadow = currentNode.dataset.originalBoxShadow || 'none';
            currentNode.style.transform = 'scale(1)';
        }
    }

    // Apply selection styling to current node
    applyWeaponNodeSelection() {
        const currentNode = this.weaponNodes[this.selectedNodeIndex];
        console.log('Applying selection to node:', this.selectedNodeIndex, currentNode);
        
        if (currentNode) {
            // Store original styling
            currentNode.dataset.originalBoxShadow = currentNode.style.boxShadow || 'none';
            
            // Apply selection styling for all devices (white glow)
            currentNode.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6)';
            currentNode.style.transform = 'scale(1.1)';
            currentNode.style.zIndex = '1000';
            
            console.log('Applied selection styling');
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
        console.log('🔧 MenuManager.setupMainMenu() called');
        console.trace('setupMainMenu call stack:');
        
        // Remove any existing main menu first
        const existingMainMenu = document.getElementById('mainMenu');
        if (existingMainMenu) {
            console.log('🗑️ Removing existing main menu element');
            existingMainMenu.remove();
        }
        
        const mainMenu = document.createElement('div');
        mainMenu.id = 'mainMenu';
        console.log('🆕 Creating new main menu element');
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
        const shopButton = this.createButton('Shop', () => this.showShop());
        const skinsButton = this.createSkinsButton();

        console.log('🔘 Created buttons:');
        console.log('  - Start Game:', startButton.textContent);
        console.log('  - Settings:', settingsButton.textContent);
        console.log('  - Weapon Tree:', weaponTreeButton.textContent);
        console.log('  - Shop:', shopButton.textContent);
        console.log('  - Skins:', skinsButton.textContent);

        mainMenu.appendChild(pointsDisplay);
        content.appendChild(title);
        content.appendChild(startButton);
        content.appendChild(settingsButton);
        content.appendChild(weaponTreeButton);
        content.appendChild(shopButton);
        content.appendChild(skinsButton);
        
        console.log('✅ Main menu setup complete with all buttons appended');
        
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
            // Setup reset all data button
            const resetBtn = document.getElementById('resetWeaponTreeBtn');
            if (resetBtn) {
                // Update button text to reflect new functionality
                resetBtn.textContent = 'Reset All Data';
                
                const handleReset = (e) => {
                    e.preventDefault();
                    if (confirm('⚠️ RESET ALL DATA ⚠️\n\nThis will permanently delete ALL your progress including:\n• Weapon tree progress and points\n• Shop exclusive items (Voltage Loop, Thermal Converter, etc.)\n• Unlocked skins and customizations\n• Shop purchase history\n\nYou will start completely fresh with only Sword, Scythe, and Bow unlocked.\n\nThis action cannot be undone!\n\nAre you sure you want to continue?')) {
                        if (this.gameState.resetAllGameData()) {
                            alert('🗑️ All game data has been reset successfully!\n\nYou now have a completely fresh start with only basic weapons unlocked.');
                            // Immediately sync points so UI updates reflect the reset
                            this.gameState.syncDisplayedPoints();
                            this.updatePointsDisplay();
                            // Refresh weapon tree if it's open
                            if (document.getElementById('weaponTreeMenu') && document.getElementById('weaponTreeMenu').style.display !== 'none') {
                                this.refreshWeaponTree();
                            }
                            // Force refresh main menu to ensure buttons are correct
                            this.setupMainMenu();
                            // Reload the page to ensure all UI is properly reset
                            setTimeout(() => {
                                if (confirm('Would you like to reload the page to ensure all UI is properly reset?')) {
                                    window.location.reload();
                                }
                            }, 1000);
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
        // Find the skins button in the main menu (it's the 5th button now with Shop added)
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) return;
        
        const buttons = mainMenu.querySelectorAll('button');
        const skinsButton = buttons[4]; // 5th button (0-indexed): Start, Settings, Weapon Tree, Shop, Skins
        
        console.log('🎨 updateSkinsButton() called - Current button order:');
        buttons.forEach((btn, index) => {
            console.log(`  ${index}: "${btn.textContent}"`);
        });
        console.log(`🎯 Targeting button index 4 (skinsButton):`, skinsButton ? skinsButton.textContent : 'not found');
        
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
        console.log('👁️ MenuManager.showMainMenu() called');
        console.trace('showMainMenu call stack:');
        
        // Always recreate main menu to ensure proper button order
        // This prevents conflicts with legacy systems or corrupted state
        this.setupMainMenu();
        
        this.showElement('mainMenu');
        this.updateSkinsButton();
        this.updatePointsDisplay();
        
        // Debug: Log current button state after showing
        setTimeout(() => {
            const mainMenu = document.getElementById('mainMenu');
            if (mainMenu) {
                const buttons = mainMenu.querySelectorAll('button');
                console.log('🔍 Current main menu buttons after show:');
                buttons.forEach((btn, index) => {
                    console.log(`  ${index + 1}. "${btn.textContent}"`);
                });
            } else {
                console.error('❌ Main menu element not found after showMainMenu!');
            }
        }, 10);
    }

    hideMainMenu() {
        console.log('👋 MenuManager.hideMainMenu() called');
        console.trace('hideMainMenu call stack:');
        
        // Debug: Log current button state before hiding
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            const buttonsBefore = mainMenu.querySelectorAll('button');
            console.log('🗑️ Main menu buttons before hide:');
            buttonsBefore.forEach((btn, index) => {
                console.log(`  ${index + 1}. "${btn.textContent}"`);
            });
        }
        
        this.hideElement('mainMenu');
        // Clean up - remove the main menu element completely when hiding
        // This prevents conflicts when recreating it later
        if (mainMenu) {
            mainMenu.remove();
            console.log('✅ Main menu element removed completely');
        } else {
            console.warn('⚠️ Main menu element not found during hide!');
        }
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
            
            // Initialize navigation for all devices
            this.updateWeaponNodesArray();
            this.selectedNodeIndex = 0;
            this.applyWeaponNodeSelection();
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
        
        // Remove yellow borders entirely - use neutral styling for all devices
        let borderColor, backgroundColor, boxShadow;
        
        console.log('Creating weapon node - canPurchase:', canPurchase, 'isPurchased:', isPurchased);
        
        if (isPurchased) {
            borderColor = '#0f0';
            backgroundColor = 'rgba(0, 150, 0, 0.4)';
            boxShadow = '0 0 15px rgba(0, 255, 0, 0.5)';
        } else if (canPurchase) {
            // No yellow borders for anyone - use neutral white/gray styling
            borderColor = '#CCCCCC';
            backgroundColor = 'rgba(200, 200, 200, 0.15)';
            boxShadow = '0 0 10px rgba(200, 200, 200, 0.3)';
            console.log('Applied neutral styling for purchasable weapon');
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
                console.log(`🛒 Attempting to purchase weapon: ${weaponKey} (${weapon.name})`);
                console.log(`🛒 Current points before purchase: ${this.gameState.player.weaponTreePoints}`);
                
                if (this.gameState.purchaseWeapon(branchKey, weaponKey)) {
                    console.log(`🛒 ✅ Purchase successful for ${weapon.name}`);
                    console.log(`🛒 Points after purchase: ${this.gameState.player.weaponTreePoints}`);
                    
                    // Immediately sync points so UI updates reflect the purchase
                    this.gameState.syncDisplayedPoints();
                    
                    // Check what weapons are now unlocked
                    const purchasedData = this.gameState.loadWeaponTreeUpgrades();
                    console.log(`🛒 All purchased weapons after ${weapon.name}:`, purchasedData.unified);
                    
                    // Refresh weapon tree with new state
                    this.refreshWeaponTree();
                } else {
                    console.log(`🛒 ❌ Purchase failed for ${weapon.name}`);
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
                // White glow for all devices instead of yellow
                nodeDiv.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.6)';
            };

            const handleUnhover = () => {
                // Reset to neutral styling for all devices
                nodeDiv.style.background = 'rgba(200, 200, 200, 0.15)';
                nodeDiv.style.boxShadow = '0 0 10px rgba(200, 200, 200, 0.3)';
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
                    // Immediately sync points so UI updates reflect the purchase
                    this.gameState.syncDisplayedPoints();
                    // Refresh weapon tree with new state
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
        
        // If weapon tree is visible, update states immediately without recreating the whole tree
        const weaponTreeMenu = document.getElementById('weaponTreeMenu');
        if (weaponTreeMenu && weaponTreeMenu.style.display !== 'none') {
            // Sync displayed points with actual points for immediate update
            this.gameState.syncDisplayedPoints();
            
            // Update weapon node states and connection lines immediately
            this.updateWeaponNodeStates();
            this.updateConnectionLineColors();
        }
    }
    
    // Full refresh that rebuilds the weapon tree (use sparingly)
    fullRefreshWeaponTree() {
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
        
        // Clear selection when hiding for all devices
        this.clearWeaponNodeSelection();
        
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
            const canAfford = this.gameState.player.weaponTreePoints >= weapon.cost;
            
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
                requirementsMet = weapon.requires.every(req => {
                    const reqMet = !!purchasedWeapons[req];
                    console.log(`🔍 ${weapon.name} requires ${req}: ${reqMet ? '✅' : '❌'} (purchasedWeapons[${req}] = ${purchasedWeapons[req]})`);
                    return reqMet;
                });
                console.log(`🔍 ${weapon.name} overall requirements met: ${requirementsMet}`);
            }
            
            const canPurchase = canAfford && !isPurchased && requirementsMet && weapon.cost > 0;
            console.log(`🔍 ${weapon.name}: canPurchase=${canPurchase} (canAfford=${canAfford}, isPurchased=${isPurchased}, requirementsMet=${requirementsMet}, cost=${weapon.cost})`);
            
            // Clear any existing event listeners
            node.replaceWith(node.cloneNode(true));
            node = document.querySelector(`[data-weapon-id="${weaponId}"]`);
            
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
                
                // Add click handler for newly purchasable weapons
                const handlePurchase = () => {
                    console.log(`🛒 Attempting to purchase weapon: ${weaponId} (${weapon.name})`);
                    console.log(`🛒 Current points before purchase: ${this.gameState.player.weaponTreePoints}`);
                    
                    if (this.gameState.purchaseWeapon('unified', weaponId)) {
                        console.log(`🛒 ✅ Purchase successful for ${weapon.name}`);
                        console.log(`🛒 Points after purchase: ${this.gameState.player.weaponTreePoints}`);
                        
                        // Immediately sync points so UI updates reflect the purchase
                        this.gameState.syncDisplayedPoints();
                        
                        // Check what weapons are now unlocked
                        const purchasedData = this.gameState.loadWeaponTreeUpgrades();
                        console.log(`🛒 All purchased weapons after ${weapon.name}:`, purchasedData.unified);
                        
                        // Refresh weapon tree with new state
                        this.refreshWeaponTree();
                    } else {
                        console.log(`🛒 ❌ Purchase failed for ${weapon.name}`);
                    }
                };
                
                node.addEventListener('click', handlePurchase);
                node.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    handlePurchase();
                });
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

    // Shop System Methods
    showShop() {
        this.hideMainMenu();
        
        // Create shop menu if it doesn't exist
        let shopMenu = document.getElementById('shopMenu');
        if (!shopMenu) {
            shopMenu = this.createShopMenu();
            document.body.appendChild(shopMenu);
        } else {
            // Refresh shop content to show current items
            this.refreshShopContent();
        }
        
        this.showElement('shopMenu');
    }

    createShopMenu() {
        const shopMenu = document.createElement('div');
        shopMenu.id = 'shopMenu';
        shopMenu.style.cssText = `
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
        content.style.position = 'relative';
        
        const title = this.createTitle('Shop');
        
        // Add points display in top left corner
        const pointsDisplay = this.createPointsDisplay();
        
        // Create shop content
        const shopContent = this.createShopContent();
        
        const backButton = this.createButton('Back', () => this.hideShop());
        // Style back button to span full width of content
        backButton.style.cssText += `
            width: 100%;
            margin-top: 20px;
        `;

        shopMenu.appendChild(pointsDisplay);
        content.appendChild(title);
        content.appendChild(shopContent);
        content.appendChild(backButton);
        shopMenu.appendChild(content);

        return shopMenu;
    }

    createRefreshTimer() {
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'shopRefreshTimer';
        timerDisplay.style.cssText = `
            position: absolute;
            bottom: -40px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #FFD700;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #FFD700;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            min-width: 180px;
            z-index: 10;
        `;
        
        // Initialize timer display
        this.updateRefreshTimer(timerDisplay);
        
        // Start interval to update every second
        timerDisplay.timerInterval = setInterval(() => {
            this.updateRefreshTimer(timerDisplay);
        }, 1000);
        
        return timerDisplay;
    }

    updateRefreshTimer(timerElement) {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0, 0, 0); // Set to start of next hour
        
        const timeUntilRefresh = nextHour.getTime() - now.getTime();
        
        const hours = Math.floor(timeUntilRefresh / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilRefresh % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilRefresh % (1000 * 60)) / 1000);
        
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timerElement.innerHTML = `
            <div style="margin-bottom: 5px;">Shop Refresh</div>
            <div style="font-size: 16px; color: #00FF00;">${formattedTime}</div>
        `;
    }

    createShopContent() {
        const container = document.createElement('div');
        container.id = 'shopContainer';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: auto;
            max-height: 70vh;
            width: 95vw;
            max-width: 1200px;
            overflow-y: auto;
            overflow-x: hidden;
            background: rgba(0, 0, 0, 0.8);
            padding: 30px 30px 70px 30px;
            border-radius: 20px;
            border: 2px solid #444;
            justify-content: flex-start;
            align-items: center;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            position: relative;
        `;


        // Add refresh timer in the extra bottom space
        const refreshTimer = this.createRefreshTimer();
        container.appendChild(refreshTimer);

        // Add current shop items
        this.addShopItems(container);
        
        // Add mystery case section (scrollable)
        const mysteryCaseSection = this.createMysteryCaseSection();
        container.appendChild(mysteryCaseSection);

        return container;
    }

    addShopItems(container) {
        const shopItems = this.gameState.getShopItemsByCurrentRotation();
        
        shopItems.forEach(item => {
            const itemDiv = this.createShopItem(item);
            container.appendChild(itemDiv);
        });
    }

    createShopItem(item) {
        const itemDiv = document.createElement('div');
        const canAfford = this.gameState.player.weaponTreePoints >= item.cost;
        const canPurchase = canAfford && !item.isPurchased;
        
        itemDiv.style.cssText = `
            background: ${item.isPurchased ? 'rgba(0, 150, 0, 0.3)' : 'rgba(50, 50, 50, 0.8)'};
            border: 3px solid ${item.isPurchased ? '#0f0' : (canPurchase ? '#FFD700' : '#666')};
            border-radius: 15px;
            padding: 20px;
            width: 100%;
            max-width: 800px;
            box-shadow: ${item.isPurchased ? '0 0 15px rgba(0, 255, 0, 0.3)' : (canPurchase ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none')};
            cursor: ${canPurchase ? 'pointer' : 'default'};
            transition: all 0.3s ease;
            position: relative;
            margin-bottom: 15px;
        `;

        // Item header with name and type
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        `;

        const nameType = document.createElement('div');
        nameType.innerHTML = `
            <div style="font-size: 20px; font-weight: bold; color: white; margin-bottom: 5px;">
                ${item.name}
            </div>
            <div style="font-size: 14px; color: #ccc; font-style: italic;">
                ${item.type}
            </div>
        `;

        // Price section with discount
        const priceSection = document.createElement('div');
        priceSection.style.cssText = `
            text-align: right;
        `;
        priceSection.innerHTML = `
            <div style="font-size: 16px; color: #ff6666; text-decoration: line-through;">
                ${item.originalCost} pts
            </div>
            <div style="font-size: 20px; color: #FFD700; font-weight: bold;">
                ${item.cost} pts (-${item.discount}%)
            </div>
        `;

        header.appendChild(nameType);
        header.appendChild(priceSection);

        // Description
        const description = document.createElement('div');
        description.style.cssText = `
            color: #ddd;
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 15px;
        `;
        description.textContent = item.description;

        // Status indicator
        const status = document.createElement('div');
        status.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            border-radius: 8px;
            margin-top: 10px;
        `;

        if (item.isPurchased) {
            status.textContent = '✓ OWNED';
            status.style.background = 'rgba(0, 255, 0, 0.2)';
            status.style.color = '#0f0';
        } else if (canPurchase) {
            status.textContent = '💰 CLICK TO PURCHASE';
            status.style.background = 'rgba(255, 215, 0, 0.2)';
            status.style.color = '#FFD700';
        } else {
            status.textContent = '❌ INSUFFICIENT POINTS';
            status.style.background = 'rgba(255, 0, 0, 0.2)';
            status.style.color = '#f44';
        }

        itemDiv.appendChild(header);
        itemDiv.appendChild(description);
        itemDiv.appendChild(status);

        // Add click handler for purchasable items
        if (canPurchase) {
            const handlePurchase = () => {
                const result = this.gameState.purchaseShopItem(item.key);
                if (result.success) {
                    alert(result.message);
                    // Update points display immediately
                    this.updatePointsDisplay();
                    // Refresh shop display
                    this.refreshShopContent();
                } else {
                    alert(result.message);
                }
            };

            itemDiv.addEventListener('click', handlePurchase);
            itemDiv.addEventListener('touchend', (e) => {
                e.preventDefault();
                handlePurchase();
            });

            // Hover effects
            itemDiv.addEventListener('mouseenter', () => {
                itemDiv.style.transform = 'scale(1.02)';
                itemDiv.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
            });

            itemDiv.addEventListener('mouseleave', () => {
                itemDiv.style.transform = 'scale(1)';
                itemDiv.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            });
        }

        return itemDiv;
    }

    createMysteryCaseSection() {
        const section = document.createElement('div');
        section.style.cssText = `
            width: 100%;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #444;
        `;

        // Section title
        const title = document.createElement('h2');
        title.textContent = '🎲 Mystery Case';
        title.style.cssText = `
            color: #FFD700;
            text-align: center;
            font-size: 24px;
            margin: 0 0 20px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;

        // Mystery case item
        const caseItem = this.createMysteryCase();

        section.appendChild(title);
        section.appendChild(caseItem);

        return section;
    }

    createMysteryCase() {
        const caseCost = 25; // Set case cost
        const canAfford = this.gameState.player.weaponTreePoints >= caseCost;

        const caseDiv = document.createElement('div');
        caseDiv.style.cssText = `
            background: linear-gradient(135deg, rgba(75, 0, 130, 0.8), rgba(138, 43, 226, 0.6));
            border: 3px solid ${canAfford ? '#FFD700' : '#666'};
            border-radius: 15px;
            padding: 25px;
            width: 100%;
            box-sizing: border-box;
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Add animated background effect
        const bgEffect = document.createElement('div');
        bgEffect.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
            animation: shine 3s infinite;
            pointer-events: none;
        `;

        // Add CSS animation for shine effect
        if (!document.getElementById('mysterycase-styles')) {
            const style = document.createElement('style');
            style.id = 'mysterycase-styles';
            style.textContent = `
                @keyframes shine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        `;

        const name = document.createElement('span');
        name.textContent = '🎁 Mystery Case';
        name.style.cssText = `
            font-size: 22px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;

        const cost = document.createElement('span');
        cost.textContent = `${caseCost} Points`;
        cost.style.cssText = `
            font-size: 18px;
            color: ${canAfford ? '#0f0' : '#f44'};
            font-weight: bold;
        `;

        const status = document.createElement('div');
        status.style.cssText = `
            font-weight: bold;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 16px;
        `;

        if (canAfford) {
            status.textContent = '🎲 CLICK TO OPEN CASE';
            status.style.background = 'rgba(255, 215, 0, 0.2)';
            status.style.color = '#FFD700';
        } else {
            status.textContent = '❌ INSUFFICIENT POINTS';
            status.style.background = 'rgba(255, 0, 0, 0.2)';
            status.style.color = '#f44';
        }

        header.appendChild(name);
        header.appendChild(cost);
        caseDiv.appendChild(bgEffect);
        caseDiv.appendChild(header);
        caseDiv.appendChild(status);

        // Add click handler for affordable cases
        if (canAfford) {
            const handleCaseOpen = () => {
                this.openMysteryCase(caseCost);
            };

            caseDiv.addEventListener('click', handleCaseOpen);
            caseDiv.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleCaseOpen();
            });

            // Hover effects
            caseDiv.addEventListener('mouseenter', () => {
                caseDiv.style.transform = 'scale(1.02)';
                caseDiv.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.6)';
            });

            caseDiv.addEventListener('mouseleave', () => {
                caseDiv.style.transform = 'scale(1)';
                caseDiv.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.4)';
            });
        }

        return caseDiv;
    }

    openMysteryCase(cost) {
        // Prevent multiple cases being opened simultaneously
        if (this.mysteryProcessing) {
            console.log('🚫 BLOCKED: Mystery case already processing!');
            return;
        }
        this.mysteryProcessing = true;
        console.log('🎲 OPENING MYSTERY CASE - Processing flag set to TRUE');
        
        // Deduct points first
        this.gameState.player.weaponTreePoints -= cost;
        this.gameState.saveWeaponTreePoints(this.gameState.player.weaponTreePoints);
        this.updatePointsDisplay();

        // Pre-determine the visual landing position for the animation
        const predeterminedLandingPosition = 22 + Math.floor(Math.random() * 8); // Random position between 22-30 for good spin effect
        
        // Show spinning reel animation and let it determine the actual reward based on what lands under the arrow
        this.showSpinningReelAnimation(cost, predeterminedLandingPosition);
        this.updatePointsDisplay();
        this.refreshShopContent();
    }

    processActualReward(rewardType, cost) {
        console.log('💰 PROCESSING REWARD - Type:', rewardType, 'Cost:', cost);
        console.log('💰 REWARD DEBUG: Processing reward type "' + rewardType + '"');
        let rewardData = {};

        if (rewardType === 'refund') {
            console.log('💰 EXECUTING REFUND BRANCH');
            // 50% refund
            const refund = Math.floor(cost * 0.5);
            const pointsBefore = this.gameState.player.weaponTreePoints;
            this.gameState.player.weaponTreePoints += refund;
            this.gameState.saveWeaponTreePoints(this.gameState.player.weaponTreePoints);
            const pointsAfter = this.gameState.player.weaponTreePoints;
            console.log('💰 REFUND: Cost=', cost, 'Refund=', refund, 'Before=', pointsBefore, 'After=', pointsAfter);
            rewardData = {
                type: 'refund',
                icon: '💰',
                title: 'Lucky Refund!',
                description: `You got a 50% refund: +${refund} points!`,
                color: '#32CD32'
            };
        } else if (rewardType === 'bonus') {
            // 50 bonus points
            const pointsBefore = this.gameState.player.weaponTreePoints;
            this.gameState.player.weaponTreePoints += 50;
            this.gameState.saveWeaponTreePoints(this.gameState.player.weaponTreePoints);
            const pointsAfter = this.gameState.player.weaponTreePoints;
            console.log('🎉 BONUS POINTS: Before=', pointsBefore, 'After=', pointsAfter, 'Difference=', pointsAfter - pointsBefore);
            rewardData = {
                type: 'bonus',
                icon: '🎉',
                title: 'Jackpot!',
                description: 'You got 50 bonus points!',
                color: '#FFD700'
            };
        } else if (rewardType === 'weapon') {
            console.log('🌟 EXECUTING WEAPON BRANCH');
            // Get ALL weapons that player doesn't have yet (ignore requirements)
            const allWeapons = Object.keys(this.gameState.constants?.WEAPONS || {});
            const playerWeaponIds = this.gameState.player.weapons.map(w => w.id);
            const unownedWeapons = allWeapons.filter(weaponId => !playerWeaponIds.includes(weaponId));
            
            console.log('🎲 Total weapons:', allWeapons.length);
            console.log('🎲 Player has:', playerWeaponIds.length);
            console.log('🎲 Unowned weapons:', unownedWeapons.length, unownedWeapons);
            
            if (unownedWeapons.length > 0) {
                // Give a random weapon the player doesn't have (ignoring requirements)
                const randomWeaponId = unownedWeapons[Math.floor(Math.random() * unownedWeapons.length)];
                const weaponData = this.getWeaponById(randomWeaponId);
                this.gameState.player.weapons.push({ ...weaponData, id: randomWeaponId });
                console.log('🌟 ANY WEAPON GRANTED:', weaponData?.name, 'ID:', randomWeaponId);
                rewardData = {
                    type: 'legendary',
                    icon: '🌟',
                    title: 'ULTRA RARE!',
                    description: `You got ${weaponData?.name || 'a Legendary Weapon'}!`,
                    color: '#FF6B35'
                };
            } else {
                // Fallback to bonus points if player has ALL weapons
                console.log('🎉 Player has ALL weapons! Giving bonus points instead');
                const pointsBefore = this.gameState.player.weaponTreePoints;
                this.gameState.player.weaponTreePoints += 50;
                this.gameState.saveWeaponTreePoints(this.gameState.player.weaponTreePoints);
                const pointsAfter = this.gameState.player.weaponTreePoints;
                console.log('🎉 FALLBACK BONUS: Before=', pointsBefore, 'After=', pointsAfter);
                rewardData = {
                    type: 'bonus',
                    icon: '🎉',
                    title: 'Jackpot!',
                    description: 'You got 50 bonus points! (You have all weapons!)',
                    color: '#FFD700'
                };
            }
        }

        console.log('🏆 ACTUAL REWARD PROCESSED:', rewardData.title, '- Type:', rewardData.type);
        return rewardData;
    }

    getWeaponById(weaponId) {
        // Try to get weapon from constants
        if (this.gameState.constants?.WEAPONS?.[weaponId]) {
            return this.gameState.constants.WEAPONS[weaponId];
        }
        
        // Fallback to imported WEAPONS constant
        const { WEAPONS } = this.gameState.constants || {};
        return WEAPONS?.[weaponId] || { name: 'Mystery Weapon', damage: 25, color: '#FFD700' };
    }

    getUnlockableWeapons() {
        const unlockableWeapons = [];
        const WEAPONS = this.gameState.constants?.WEAPONS || {};
        
        // Get current player weapons for prerequisite checking
        const playerWeaponIds = this.gameState.player.weapons.map(w => w.id);
        
        Object.keys(WEAPONS).forEach(weaponId => {
            const weapon = WEAPONS[weaponId];
            
            // Skip if player already has this weapon
            if (playerWeaponIds.includes(weaponId)) {
                return;
            }
            
            // Check if weapon has requirements
            if (weapon.requires && weapon.requires.length > 0) {
                // Check if all required weapons are owned
                const hasAllRequirements = weapon.requires.every(reqId => 
                    playerWeaponIds.includes(reqId)
                );
                
                // If has requirements but not owned, it's unlockable
                if (hasAllRequirements) {
                    unlockableWeapons.push(weaponId);
                }
            } else {
                // No requirements = always unlockable if not owned
                unlockableWeapons.push(weaponId);
            }
        });
        
        console.log(`🎲 Found ${unlockableWeapons.length} unlockable weapons:`, unlockableWeapons);
        return unlockableWeapons;
    }

    getRewardRarity(rewardType) {
        switch(rewardType) {
            case 'refund':
            case 'fallback':
                return 'common';    // 80% - gray
            case 'weapon':
                return 'rare';      // 10% - blue
            case 'bonus':
                return 'epic';      // 5% - purple (50 points specifically)
            case 'legendary':
                return 'legendary'; // 5% - gold (any weapon specifically)
            default:
                return 'common';
        }
    }

    getRewardGlowColor(rewardType) {
        switch(rewardType) {
            case 'refund':
            case 'fallback':
                return '#666666';   // Gray glow
            case 'weapon':
                return '#1E90FF';   // Blue glow
            case 'bonus':
                return '#9932CC';   // Purple glow (50 points specifically)
            case 'legendary':
                return '#FFA500';   // Gold glow (any weapon specifically)
            default:
                return '#666666';
        }
    }

    showSpinningReelAnimation(cost, predeterminedPosition) {
        // Create spinning reel overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 5000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        `;

        // Create case opening container
        const caseContainer = document.createElement('div');
        caseContainer.style.cssText = `
            width: 800px;
            height: 400px;
            background: linear-gradient(135deg, #2c1810, #4a2c1a);
            border-radius: 20px;
            border: 3px solid #FFD700;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
        `;

        // Title
        const title = document.createElement('div');
        title.textContent = 'Unlock Container';
        title.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;

        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.textContent = 'Mystery Case';
        subtitle.style.cssText = `
            position: absolute;
            top: 55px;
            left: 50%;
            transform: translateX(-50%);
            color: #FFD700;
            font-size: 18px;
            font-weight: bold;
        `;

        // Create reel container
        const reelContainer = document.createElement('div');
        reelContainer.style.cssText = `
            position: absolute;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            width: 700px;
            height: 150px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #444;
            overflow: hidden;
            border-radius: 10px;
            z-index: 2;
        `;

        // Create spinning strip
        const spinningStrip = document.createElement('div');
        spinningStrip.style.cssText = `
            display: flex;
            height: 100%;
            align-items: center;
            animation: spinReel 4s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        `;

        // Create only generic reel items - no actual rewards shown on reel
        const reelItems = [
            { icon: '💰', color: '#888888', title: 'Refund', rarity: 'common', glowColor: '#666666' },
            { icon: '🎉', color: '#8A2BE2', title: '50 Points', rarity: 'epic', glowColor: '#9932CC' },
            { icon: '🌟', color: '#FFD700', title: 'Any Weapon', rarity: 'legendary', glowColor: '#FFA500' }
        ];

        // Create reel with proper distribution but no actual reward insertion



        // First determine what should land under the arrow based on probabilities
        const rand = Math.random();
        let targetReelItem;
        let actualRewardType;
        
        if (rand < 0.80) {
            // 80% chance: Refund
            targetReelItem = reelItems[0];
            actualRewardType = 'refund';
        } else if (rand < 0.95) {
            // 15% chance: 50 Points
            targetReelItem = reelItems[1];
            actualRewardType = 'bonus';
        } else {
            // 5% chance: Any Weapon
            targetReelItem = reelItems[2];
            actualRewardType = 'weapon';
        }
        
        console.log('🎯 PREDETERMINED REWARD TYPE:', actualRewardType, '- Item will be:', targetReelItem.title);
        console.log('🎲 Random number was:', rand, '- Thresholds: <0.80=refund, <0.95=bonus, >=0.95=weapon');
        
        // Create a reel that will show this predetermined item under the arrow
        const itemPool = [];
        
        // Add items according to visual distribution (80% refund, 15% 50 points, 5% any weapon)
        // Add many refunds (most common visually - 80%)
        for (let i = 0; i < 40; i++) {
            itemPool.push(reelItems[0]); // Refund
        }
        // Add some 50 points (15%)
        for (let i = 0; i < 8; i++) {
            itemPool.push(reelItems[1]); // 50 Points
        }
        // Add fewer any weapons (5%)
        for (let i = 0; i < 3; i++) {
            itemPool.push(reelItems[2]); // Any Weapon
        }
        
        // Shuffle the pool to randomize order
        for (let i = itemPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemPool[i], itemPool[j]] = [itemPool[j], itemPool[i]];
        }
        
        // Create the final reel by duplicating for more length
        const allRewards = [];
        for (let i = 0; i < 3; i++) {
            allRewards.push(...itemPool);
        }

        // Simple approach: Use a fixed target position and calculate where to place our item
        const itemWidth = 160; // 140px + 20px margins
        
        // For good spinning effect, let's target around position 25-30
        const targetItemIndex = 25 + Math.floor(Math.random() * 6);
        
        // Ensure we have enough items
        while (allRewards.length <= targetItemIndex + 5) {
            allRewards.push(...itemPool);
        }
        
        // FORCE the predetermined reward item at the target position
        console.log('🔧 FORCING item at position', targetItemIndex, 'to be:', targetReelItem.title);
        console.log('🔧 Before swap - item at', targetItemIndex + ':', allRewards[targetItemIndex]?.title || 'undefined');
        
        // Unconditionally place the correct item where the arrow will point
        allRewards[targetItemIndex] = { ...targetReelItem };
        
        console.log('🔧 After swap - item at', targetItemIndex + ':', allRewards[targetItemIndex]?.title);
        
        // PERFECT CENTER ALIGNMENT CALCULATION
        // Arrow is at exactly 350px from the left edge of the reel container (700px * 0.5)
        // Each item is 160px wide (140px content + 20px margins)
        // We want the TARGET ITEM to be perfectly centered under the arrow
        
        const arrowPositionX = 350.0; // Fixed arrow position - use floating point for precision
        
        // Calculate where our target item currently is
        const targetItemStartX = targetItemIndex * itemWidth;
        const targetItemCenterX = targetItemStartX + (itemWidth / 2);
        
        // Calculate EXACT translation to put target item center at arrow position
        const perfectTranslateX = targetItemCenterX - arrowPositionX;
        
        console.log('🎯 PERFECT CENTERING CALCULATION:');
        console.log('🎯 Arrow position:', arrowPositionX + 'px');
        console.log('🎯 Target item index:', targetItemIndex);
        console.log('🎯 Target item starts at:', targetItemStartX + 'px');
        console.log('🎯 Target item center at:', targetItemCenterX + 'px');
        console.log('🎯 Perfect translation needed:', perfectTranslateX + 'px');
        
        // VERIFICATION: After this translation, where will the item center be?
        const resultingCenter = targetItemCenterX - perfectTranslateX;
        console.log('🎯 After translation, item center will be at:', resultingCenter + 'px');
        console.log('🎯 Arrow-center alignment:', Math.abs(resultingCenter - arrowPositionX) < 0.001 ? '✅ MATHEMATICALLY PERFECT' : '❌ CALCULATION ERROR');
        
        const finalTranslateX = perfectTranslateX;
        
        // MATHEMATICAL PROOF: After animation, the item center should be exactly at 350px
        const finalItemCenter = targetItemCenterX - finalTranslateX;
        const isExact = Math.abs(finalItemCenter - 350) < 0.1; // Should be exact
        
        console.log('🔍 VERIFICATION:');
        console.log('🔍 Target item will land at:', finalItemCenter + 'px');
        console.log('🔍 Expected position: 350px');
        console.log('🔍 Alignment:', isExact ? '✅ MATHEMATICALLY PERFECT' : '❌ ERROR IN CALCULATION');
        
        // PRECISION FAILSAFE: Verify arrow will point to exact center of target item
        const arrowPosition = 350; // Arrow is always at 350px from left
        
        // Calculate where each item will be after translation
        console.log('🔍 PRECISION VERIFICATION:');
        
        // Check our target item specifically
        const targetItemStartAfterTranslation = (targetItemIndex * itemWidth) - finalTranslateX;
        const targetItemCenterAfterTranslation = targetItemStartAfterTranslation + (itemWidth / 2);
        const targetItemDistance = Math.abs(targetItemCenterAfterTranslation - arrowPosition);
        
        console.log('🔍 Target item after translation:');
        console.log('🔍   Starts at:', targetItemStartAfterTranslation + 'px');
        console.log('🔍   Center at:', targetItemCenterAfterTranslation + 'px');
        console.log('🔍   Distance from arrow:', targetItemDistance.toFixed(3) + 'px');
        
        // Find the item that will actually be closest to arrow
        let actualClosestIndex = -1;
        let smallestDistance = Infinity;
        
        for (let i = 0; i < allRewards.length; i++) {
            const itemStartAfterTranslation = (i * itemWidth) - finalTranslateX;
            const itemCenterAfterTranslation = itemStartAfterTranslation + (itemWidth / 2);
            const distanceFromArrow = Math.abs(itemCenterAfterTranslation - arrowPosition);
            
            if (distanceFromArrow < smallestDistance) {
                smallestDistance = distanceFromArrow;
                actualClosestIndex = i;
            }
        }
        
        const bestArrowIndex = actualClosestIndex;
        
        console.log('🔍 PRECISION RESULTS:');
        console.log('🔍 Arrow at position:', arrowPosition + 'px');
        console.log('🔍 Target item distance from arrow:', targetItemDistance.toFixed(3) + 'px');
        console.log('🔍 Closest item to arrow: Index', bestArrowIndex);
        console.log('🔍 Closest item distance:', smallestDistance.toFixed(3) + 'px');
        console.log('🔍 Item at arrow position:', allRewards[bestArrowIndex]?.title);
        console.log('🔍 Expected reward item:', targetReelItem.title);
        
        // FORCE PERFECT CENTERING: If target item isn't the closest, adjust translation
        let actualTranslateX = finalTranslateX; // Track the actual translation used
        
        if (bestArrowIndex !== targetItemIndex || targetItemDistance > 0.1) {
            console.log('🔧 PRECISION ADJUSTMENT NEEDED!');
            
            // Recalculate translation to ensure target item is perfectly centered
            const targetItemOriginalCenter = (targetItemIndex * itemWidth) + (itemWidth / 2);
            const correctedTranslateX = targetItemOriginalCenter - arrowPosition;
            actualTranslateX = correctedTranslateX; // Update the actual translation used
            
            console.log('🔧 Original translation:', finalTranslateX);
            console.log('🔧 Corrected translation:', correctedTranslateX);
            console.log('🔧 Adjustment:', (correctedTranslateX - finalTranslateX).toFixed(3) + 'px');
            
            // Update the CSS animation with corrected translation
            const existingStyle = document.getElementById('spinning-reel-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            const newStyle = document.createElement('style');
            newStyle.id = 'spinning-reel-styles';
            newStyle.textContent = `
                @keyframes spinReel {
                    0% { transform: translateX(0px); }
                    100% { transform: translateX(-${correctedTranslateX.toFixed(3)}px); }
                }
                @keyframes rewardReveal {
                    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(newStyle);
            
            console.log('🔧 ✅ PRECISION ADJUSTMENT COMPLETE - Target item will be PERFECTLY centered');
        }
        
        // ABSOLUTE GUARANTEE: Replace target item and ensure it's the closest
        console.log('🔧 ABSOLUTE GUARANTEE: Ensuring target item is perfectly positioned');
        
        // Always replace the target item
        allRewards[targetItemIndex] = { ...targetReelItem };
        console.log('🔧 Target item replaced at index:', targetItemIndex);
        
        // Also replace the closest item if it's different
        if (bestArrowIndex >= 0 && bestArrowIndex !== targetItemIndex) {
            console.log('🔧 Also replacing closest item at index:', bestArrowIndex);
            allRewards[bestArrowIndex] = { ...targetReelItem };
        }
        
        // SMART CORRECTION: Check if arrow will miss target, then adjust with slow correction
        console.log('🔧 SMART ALIGNMENT: Checking if arrow will hit correct reward...');
        
        // Find what item the arrow will actually point to after the main animation (using actual translation)
        let actualArrowIndex = -1;
        let actualArrowItem = null;
        
        for (let i = 0; i < allRewards.length; i++) {
            const itemStartAfterTranslation = (i * itemWidth) - actualTranslateX;
            const itemEndAfterTranslation = itemStartAfterTranslation + itemWidth;
            
            if (arrowPosition >= itemStartAfterTranslation && arrowPosition <= itemEndAfterTranslation) {
                actualArrowIndex = i;
                actualArrowItem = allRewards[i];
                break;
            }
        }
        
        console.log('� Arrow will point to index', actualArrowIndex, ':', actualArrowItem?.title);
        console.log('� Target reward should be:', targetReelItem.title);
        
        // Check if we need correction
        const needsCorrection = actualArrowItem?.title !== targetReelItem.title;
        console.log('� Needs correction:', needsCorrection ? 'YES' : 'NO');
        
        // Store correction info for later use (using actual translation that was applied)
        window.mysteryCorrection = {
            needsCorrection,
            targetReelItem,
            actualArrowIndex,
            targetItemIndex,
            finalTranslateX: actualTranslateX, // Use the actual translation that was applied
            itemWidth,
            arrowPosition,
            spinningStrip: null // Will be set after creating the strip
        };
        
        // FINAL VERIFICATION: Check the item that will be displayed under the arrow
        console.log('🔍 FINAL CHECK - Item guaranteed to be under arrow:', allRewards[targetItemIndex]?.title);
        console.log('🔍 Predetermined reward type:', actualRewardType);
        console.log('🔍 Target reel item:', targetReelItem.title);
        console.log('🔍 Visual-reward match:', allRewards[targetItemIndex]?.title === targetReelItem.title ? '✅ GUARANTEED MATCH' : '❌ MISMATCH ERROR');
        
        // Show items around target position for debugging
        console.log('🔍 Items around target position ' + targetItemIndex + ':');
        for (let i = Math.max(0, targetItemIndex - 2); i <= Math.min(allRewards.length - 1, targetItemIndex + 2); i++) {
            const marker = i === targetItemIndex ? '🎯 ARROW→' : '      ';
            console.log(`${marker} Position ${i}: ${allRewards[i]?.title || 'undefined'}`);
        }
        
        // GUARANTEE: The item at targetItemIndex will be exactly under the arrow after animation
        console.log('🎯 GUARANTEE: Item "' + allRewards[targetItemIndex]?.title + '" will be under arrow after ' + (finalTranslateX) + 'px translation');
        
        // Create reward items
        allRewards.forEach((reward, index) => {
            // Log what we're creating at ALL positions near the target for debugging
            if (index >= targetItemIndex - 2 && index <= targetItemIndex + 2) {
                console.log(`🎨 VISUAL RENDER Position ${index}: Creating "${reward?.title}" with icon "${reward?.icon}"`);
            }
            
            const rewardItem = document.createElement('div');
            rewardItem.style.cssText = `
                min-width: 140px;
                height: 120px;
                margin: 15px 10px;
                background: linear-gradient(to bottom, 
                    rgba(255,255,255,0.05) 0%, 
                    rgba(255,255,255,0.02) 70%, 
                    ${reward.glowColor}40 100%
                );
                border: 2px solid #555;
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-shadow: 0 0 15px ${reward.glowColor}60, 
                           inset 0 -20px 30px ${reward.glowColor}20;
                position: relative;
                overflow: hidden;
            `;

            // Add subtle glow animation based on rarity
            const glowIntensity = {
                'common': '20',
                'rare': '40', 
                'epic': '60',
                'legendary': '80'
            };
            
            rewardItem.style.animation = `rewardGlow${reward.rarity} 2s infinite alternate`;
            
            // Add bottom glow effect
            const bottomGlow = document.createElement('div');
            bottomGlow.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 30px;
                background: linear-gradient(to top, ${reward.glowColor}${glowIntensity[reward.rarity] || '20'}, transparent);
                border-radius: 0 0 13px 13px;
            `;

            const icon = document.createElement('div');
            icon.textContent = reward.icon;
            icon.style.cssText = `
                font-size: 40px;
                margin-bottom: 5px;
                position: relative;
                z-index: 2;
            `;

            // Add debug info to the DOM element for verification
            rewardItem.dataset.debugTitle = reward.title;
            rewardItem.dataset.debugIcon = reward.icon;
            rewardItem.dataset.debugIndex = index;
            
            // Extra logging for positions around target
            if (index >= targetItemIndex - 2 && index <= targetItemIndex + 2) {
                console.log(`🎨 DOM ELEMENT Position ${index}: Set textContent to "${reward.icon}" for "${reward.title}"`);
            }

            rewardItem.appendChild(bottomGlow);
            rewardItem.appendChild(icon);
            spinningStrip.appendChild(rewardItem);
        });

        // Store spinning strip reference for potential correction
        window.mysteryCorrection.spinningStrip = spinningStrip;

        // FINAL VERIFICATION: Check what's actually rendered in the DOM
        console.log('🔍 FINAL DOM VERIFICATION - What was actually created:');
        const renderedItems = spinningStrip.children;
        for (let i = Math.max(0, targetItemIndex - 2); i <= Math.min(renderedItems.length - 1, targetItemIndex + 2); i++) {
            const element = renderedItems[i];
            const iconElement = element.querySelector('div:last-child'); // The icon div
            const actualIcon = iconElement ? iconElement.textContent : 'NO ICON';
            const debugTitle = element.dataset.debugTitle || 'NO TITLE';
            const marker = i === targetItemIndex ? '🎯 TARGET→' : '        ';
            console.log(`${marker} DOM Position ${i}: Shows "${actualIcon}" (should be "${debugTitle}")`);
        }

        // Create selection indicator (golden arrow pointing down)
        const indicator = document.createElement('div');
        indicator.id = 'reelIndicator';
        indicator.style.cssText = `
            position: absolute;
            top: 125px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 20px solid #FFD700;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));
            z-index: 10;
        `;

        // Create thin yellow line going down from arrow tip
        const arrowLine = document.createElement('div');
        arrowLine.id = 'arrowLine';
        arrowLine.style.cssText = `
            position: absolute;
            top: 145px;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 150px;
            background: linear-gradient(to bottom, #FFD700, rgba(255, 215, 0, 0.6));
            z-index: 9;
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
        `;

        // Add CSS animation with tension-building slowdown
        if (!document.getElementById('spinning-reel-styles')) {
            const style = document.createElement('style');
            style.id = 'spinning-reel-styles';
            style.textContent = `
                @keyframes spinReel {
                    0% { transform: translateX(0px); }
                    100% { transform: translateX(-${finalTranslateX.toFixed(3)}px); }
                }
                @keyframes rewardReveal {
                    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes rewardGlowcommon {
                    0% { box-shadow: 0 0 15px #66666640, inset 0 -20px 30px #66666620; }
                    100% { box-shadow: 0 0 20px #66666660, inset 0 -20px 35px #66666630; }
                }
                @keyframes rewardGlowrare {
                    0% { box-shadow: 0 0 15px #1E90FF60, inset 0 -20px 30px #1E90FF40; }
                    100% { box-shadow: 0 0 25px #1E90FF80, inset 0 -20px 40px #1E90FF60; }
                }
                @keyframes rewardGlowepic {
                    0% { box-shadow: 0 0 20px #9932CC60, inset 0 -20px 35px #9932CC60; }
                    100% { box-shadow: 0 0 30px #9932CC90, inset 0 -20px 45px #9932CC80; }
                }
                @keyframes rewardGlowlegendary {
                    0% { box-shadow: 0 0 25px #FFA50080, inset 0 -20px 40px #FFA50080; }
                    100% { box-shadow: 0 0 40px #FFA500FF, inset 0 -20px 50px #FFA500A0; }
                }
                @keyframes confettiPop {
                    0% {
                        transform: translateY(0px) translateX(0px) rotate(0deg) scale(0.5);
                        opacity: 0;
                        z-index: 0;
                    }
                    10% {
                        transform: translateY(-30px) translateX(calc(var(--horizontal-drift) * 0.05)) rotate(90deg) scale(0.8);
                        opacity: 0;
                        z-index: 0;
                    }
                    15% {
                        transform: translateY(-50px) translateX(calc(var(--horizontal-drift) * 0.1)) rotate(180deg) scale(1);
                        opacity: 1;
                        z-index: 3;
                    }
                    30% {
                        transform: translateY(calc(-150px * var(--initial-velocity))) translateX(calc(var(--horizontal-drift) * 0.4)) rotate(360deg) scale(1);
                        opacity: 1;
                        z-index: 3;
                    }
                    40% {
                        transform: translateY(calc(-180px * var(--initial-velocity))) translateX(calc(var(--horizontal-drift) * 0.6)) rotate(450deg) scale(1);
                        opacity: 1;
                        z-index: 3;
                    }
                    55% {
                        transform: translateY(calc(-150px * var(--initial-velocity))) translateX(calc(var(--horizontal-drift) * 0.8)) rotate(630deg) scale(1);
                        opacity: 0.9;
                        z-index: 3;
                    }
                    75% {
                        transform: translateY(calc(-50px * var(--initial-velocity))) translateX(calc(var(--horizontal-drift) * 0.9)) rotate(900deg) scale(0.9);
                        opacity: 0.6;
                        z-index: 3;
                    }
                    90% {
                        transform: translateY(50px) translateX(var(--horizontal-drift)) rotate(1080deg) scale(0.7);
                        opacity: 0.3;
                        z-index: 3;
                    }
                    100% {
                        transform: translateY(200px) translateX(var(--horizontal-drift)) rotate(1260deg) scale(0.4);
                        opacity: 0;
                        z-index: 3;
                    }
                }
                @keyframes arrowDrag {
                    0% {
                        transform: translateX(-50%);
                    }
                    20% {
                        transform: translateX(-45%);
                    }
                    40% {
                        transform: translateX(-40%);
                    }
                    60% {
                        transform: translateX(-35%);
                    }
                    80% {
                        transform: translateX(-52%);
                    }
                    90% {
                        transform: translateX(-48%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Create confetti container behind the reel
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: absolute;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            width: 700px;
            height: 150px;
            overflow: visible;
            z-index: 0;
            pointer-events: none;
        `;

        // Assemble the container
        caseContainer.appendChild(confettiContainer);
        caseContainer.appendChild(title);
        caseContainer.appendChild(subtitle);
        caseContainer.appendChild(indicator);
        caseContainer.appendChild(arrowLine);
        caseContainer.appendChild(reelContainer);
        reelContainer.appendChild(spinningStrip);
        overlay.appendChild(caseContainer);

        // Add to page
        document.body.appendChild(overlay);

        // Start confetti after reel has completely stopped
        setTimeout(() => {
            this.startConfetti(confettiContainer, actualRewardType);
        }, 4000); // Wait for full 4 second spin duration

        // Check if correction is needed after main animation
        setTimeout(() => {
            if (window.mysteryCorrection?.needsCorrection) {
                console.log('🔧 SMART CORRECTION: Arrow missed target, applying slow correction...');
                this.applyCorrectionAnimation();
            }
        }, 4100); // Check 100ms after main animation

        // After animation completes (and correction if needed), process and show the actual reward
        setTimeout(() => {
            // Instead of using predetermined reward type, read what's actually under the arrow
            const actualVisualRewardType = this.getRewardTypeUnderArrow(window.mysteryCorrection);
            console.log('🎁 REWARD PROCESSING: Predetermined type was:', actualRewardType);
            console.log('🎁 REWARD PROCESSING: Visual type under arrow is:', actualVisualRewardType);
            console.log('🎁 REWARD PROCESSING: Using visual type for reward processing');
            
            const actualReward = this.processActualReward(actualVisualRewardType, cost);
            this.showFinalReward(overlay, actualReward);
        }, window.mysteryCorrection?.needsCorrection ? 5500 : 4500); // Extra time if correction needed
    }

    getRewardTypeUnderArrow(correction) {
        if (!correction || !correction.spinningStrip) {
            console.error('🎁 No correction data available to read arrow position');
            return 'refund'; // Default fallback
        }

        const arrowPosition = correction.arrowPosition; // 350px
        const itemWidth = correction.itemWidth; // 160px
        const spinningStrip = correction.spinningStrip;
        
        // Get the current transform value
        const computedStyle = window.getComputedStyle(spinningStrip);
        const transform = computedStyle.transform;
        
        let currentTranslateX = 0;
        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            currentTranslateX = -matrix.m41; // Get the X translation (negative because we use -translateX)
        }
        
        console.log('🎁 ARROW ANALYSIS: Current strip translation:', currentTranslateX + 'px');
        console.log('🎁 ARROW ANALYSIS: Arrow position:', arrowPosition + 'px');
        
        // Find which item is currently under the arrow
        const items = Array.from(spinningStrip.children);
        let itemUnderArrow = null;
        let itemIndexUnderArrow = -1;
        
        for (let i = 0; i < items.length; i++) {
            const itemStartX = (i * itemWidth) - currentTranslateX;
            const itemEndX = itemStartX + itemWidth;
            
            if (arrowPosition >= itemStartX && arrowPosition <= itemEndX) {
                itemUnderArrow = items[i];
                itemIndexUnderArrow = i;
                break;
            }
        }
        
        if (!itemUnderArrow) {
            console.error('🎁 Could not find item under arrow!');
            return 'refund'; // Default fallback
        }
        
        // Read the reward type from the DOM element
        const debugTitle = itemUnderArrow.dataset.debugTitle;
        console.log('🎁 ARROW ANALYSIS: Item under arrow at index', itemIndexUnderArrow, 'is:', debugTitle);
        
        // Convert title back to reward type
        if (debugTitle === 'Refund') return 'refund';
        if (debugTitle === '50 Points') return 'points';
        if (debugTitle === 'Any Weapon') return 'weapon';
        
        console.warn('🎁 Unknown reward title:', debugTitle, 'defaulting to refund');
        return 'refund';
    }

    applyCorrectionAnimation() {
        const correction = window.mysteryCorrection;
        if (!correction || !correction.spinningStrip) return;

        console.log('🔧 Calculating correction needed...');
        console.log('🔧 Target item index:', correction.targetItemIndex);
        console.log('🔧 Target item title:', correction.targetReelItem.title);
        
        // Use the exact target item index that was set during item generation
        // This index is guaranteed to have the correct reward item
        const correctItemIndex = correction.targetItemIndex;
        
        if (correctItemIndex < 0 || correctItemIndex >= correction.spinningStrip.children.length) {
            console.log('🔧 Invalid target item index:', correctItemIndex);
            return;
        }

        // Calculate how much more we need to translate to align correctly
        const correctItemCenter = (correctItemIndex * correction.itemWidth) + (correction.itemWidth / 2);
        const neededTranslation = correctItemCenter - correction.arrowPosition;
        const currentTranslation = correction.finalTranslateX;
        const additionalTranslation = neededTranslation - currentTranslation;

        console.log('🔧 PRECISION CORRECTION CALCULATION:');
        console.log('🔧 Target item', correctItemIndex, 'center should be at:', correctItemCenter + 'px');
        console.log('🔧 Arrow is at:', correction.arrowPosition + 'px');
        console.log('🔧 Needed translation for perfect alignment:', neededTranslation.toFixed(3) + 'px');
        console.log('🔧 Current translation:', currentTranslation.toFixed(3) + 'px');
        console.log('🔧 Additional correction needed:', additionalTranslation.toFixed(3) + 'px');

        // Apply slow correction animation with exact precision
        const finalTranslation = currentTranslation + additionalTranslation;
        correction.spinningStrip.style.transition = 'transform 1s ease-out';
        correction.spinningStrip.style.transform = `translateX(-${finalTranslation.toFixed(3)}px)`;
        
        // Verify the final alignment
        const finalItemCenter = (correctItemIndex * correction.itemWidth) + (correction.itemWidth / 2) - finalTranslation;
        const alignmentError = Math.abs(finalItemCenter - correction.arrowPosition);
        
        console.log('🔧 CORRECTION VERIFICATION:');
        console.log('🔧 After correction, item center will be at:', finalItemCenter.toFixed(3) + 'px');
        console.log('🔧 Arrow position:', correction.arrowPosition + 'px');
        console.log('🔧 Alignment error:', alignmentError.toFixed(3) + 'px');
        console.log('🔧 Alignment quality:', alignmentError < 0.5 ? '✅ PIXEL PERFECT' : '⚠️ SLIGHT OFFSET');
        
        console.log('🔧 ✅ CORRECTION APPLIED - Arrow alignment precision: ' + alignmentError.toFixed(3) + 'px error');
    }

    startConfetti(container, rewardType) {
        // Determine confetti intensity and colors based on rarity
        const confettiConfig = this.getConfettiConfig(rewardType);
        
        // Create multiple confetti bursts
        for (let i = 0; i < confettiConfig.burstCount; i++) {
            setTimeout(() => {
                this.createConfettiBurst(container, confettiConfig);
            }, i * 200); // Stagger bursts
        }
    }

    getConfettiConfig(rewardType) {
        // Universal colorful confetti palette
        const colorfulPalette = [
            '#FF6B35', '#F7931E', '#FFD700', '#32CD32', '#1E90FF', 
            '#8A2BE2', '#FF1493', '#00CED1', '#FF4500', '#32C832',
            '#9932CC', '#FF69B4', '#00BFFF', '#FFB347', '#90EE90'
        ];

        switch(rewardType) {
            case 'refund':
            case 'fallback':
                return {
                    burstCount: 1,
                    particleCount: 8,
                    colors: colorfulPalette,
                    size: 'small'
                };
            case 'weapon':
                return {
                    burstCount: 2,
                    particleCount: 12,
                    colors: colorfulPalette,
                    size: 'medium'
                };
            case 'bonus':
                return {
                    burstCount: 3,
                    particleCount: 18,
                    colors: colorfulPalette,
                    size: 'medium'
                };
            case 'legendary':
                return {
                    burstCount: 4,
                    particleCount: 25,
                    colors: colorfulPalette,
                    size: 'large'
                };
            default:
                return {
                    burstCount: 1,
                    particleCount: 8,
                    colors: colorfulPalette,
                    size: 'small'
                };
        }
    }

    createConfettiBurst(container, config) {
        const { particleCount, colors, size } = config;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createConfettiParticle(container, colors, size);
            }, Math.random() * 300); // Randomize particle timing within burst
        }
    }

    createConfettiParticle(container, colors, size) {
        const particle = document.createElement('div');
        
        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const startX = 40 + Math.random() * 20; // Start from center area of reel container
        const startY = 50 + Math.random() * 20; // Start from middle of reel height
        const sizeValue = size === 'small' ? 4 + Math.random() * 6 : 
                         size === 'medium' ? 6 + Math.random() * 8 : 
                         8 + Math.random() * 12;
        const rotation = Math.random() * 360;
        const animationDuration = 5 + Math.random() * 2; // 5-7 seconds for full arc
        const horizontalDrift = (Math.random() - 0.5) * 200; // More spread
        const initialVelocity = 0.8 + Math.random() * 0.4; // Vary launch speed
        
        particle.style.cssText = `
            position: absolute;
            width: ${sizeValue}px;
            height: ${sizeValue}px;
            background: ${color};
            left: ${startX}%;
            top: ${startY}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: rotate(${rotation}deg) scale(0.8);
            animation: confettiPop ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            z-index: 0;
            pointer-events: none;
            opacity: 0;
            --horizontal-drift: ${horizontalDrift}px;
            --initial-velocity: ${initialVelocity};
        `;

        container.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, animationDuration * 1000 + 100);
    }

    showFinalReward(overlay, rewardData) {
        // Create reward reveal popup
        const rewardPopup = document.createElement('div');
        rewardPopup.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.3);
            background: linear-gradient(135deg, ${rewardData.color}20, ${rewardData.color}40);
            border: 3px solid ${rewardData.color};
            border-radius: 20px;
            padding: 40px;
            color: white;
            font-weight: bold;
            text-align: center;
            z-index: 6000;
            box-shadow: 0 0 50px ${rewardData.color}80;
            animation: rewardReveal 1s ease forwards;
            max-width: 400px;
            line-height: 1.6;
        `;

        rewardPopup.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">${rewardData.icon}</div>
            <div style="font-size: 28px; margin-bottom: 15px; color: ${rewardData.color};">${rewardData.title}</div>
            <div style="font-size: 18px; margin-bottom: 25px;">${rewardData.description}</div>
            <div style="font-size: 14px; opacity: 0.8; cursor: pointer; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">Click anywhere to continue</div>
        `;

        overlay.appendChild(rewardPopup);

        // Remove overlay on click
        const closeHandler = () => {
            overlay.remove();
            this.mysteryProcessing = false; // Reset processing flag
            console.log('🔓 MYSTERY CASE CLOSED - Processing flag reset to FALSE');
        };

        overlay.addEventListener('click', closeHandler);
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
                this.mysteryProcessing = false; // Reset processing flag
                console.log('🔓 MYSTERY CASE AUTO-CLOSED - Processing flag reset to FALSE');
            }
        }, 8000);
    }

    showCaseReward(message) {
        // Create animated popup
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.5);
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.95), rgba(75, 0, 130, 0.95));
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 30px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 3000;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            animation: caseReward 3s ease forwards;
            max-width: 400px;
            line-height: 1.4;
        `;

        // Add animation CSS
        if (!document.getElementById('casereward-styles')) {
            const style = document.createElement('style');
            style.id = 'casereward-styles';
            style.textContent = `
                @keyframes caseReward {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        popup.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">🎁 Case Opened!</div>
            <div>${message}</div>
            <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">Click anywhere to continue</div>
        `;

        // Remove popup on click
        popup.addEventListener('click', () => {
            popup.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 5000);

        document.body.appendChild(popup);
    }

    refreshShopContent() {
        const shopContainer = document.getElementById('shopContainer');
        if (shopContainer) {
            // Clear all existing items except the timer
            const children = Array.from(shopContainer.children);
            children.forEach(child => {
                // Keep the refresh timer, remove everything else
                if (child.id !== 'shopRefreshTimer') {
                    child.remove();
                }
            });
            
            // Add fresh items
            this.addShopItems(shopContainer);
            
            // Add mystery case section back (scrollable)
            const mysteryCaseSection = this.createMysteryCaseSection();
            shopContainer.appendChild(mysteryCaseSection);
        }
    }

    hideShop() {
        // Clean up the refresh timer interval
        const timerElement = document.getElementById('shopRefreshTimer');
        if (timerElement && timerElement.timerInterval) {
            clearInterval(timerElement.timerInterval);
        }
        
        this.hideElement('shopMenu');
        this.showMainMenu();
    }
}
