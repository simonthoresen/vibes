class CharacterSelect {
    constructor() {
        this.characters = CharacterData.characters;
        this.currentIndex = 0;
        this.elements = {
            name: document.querySelector('.character-display.current .character-name'),
            image: document.querySelector('.character-display.current .character-image'),
            description: document.querySelector('.character-display.current .character-description'),
            triggerWarning: document.querySelector('.character-display.current .trigger-warning'),
            loadButton: document.getElementById('load-game'),
            newGameButton: document.getElementById('new-game')
        };
        this.updateDisplay();
    }

    updateDisplay() {
        const currentChar = this.getCurrentCharacter();
        if (!currentChar) return;

        // Update current character
        this.elements.name.textContent = currentChar.name;
        this.elements.image.style.backgroundImage = `url(${currentChar.imageUrl})`;
        this.elements.description.textContent = currentChar.description;
        
        if (currentChar.triggerWarning) {
            this.elements.triggerWarning.textContent = `Trigger Warning: ${currentChar.triggerWarning}`;
            this.elements.triggerWarning.style.display = 'block';
        } else {
            this.elements.triggerWarning.style.display = 'none';
        }

        // Update button states
        this.elements.loadButton.disabled = !SaveSystem.hasSave(currentChar.id);
        
        // Check if character has a configured world
        const hasWorld = currentChar.worldConfig && 
                        Object.keys(currentChar.worldConfig).length > 0 && 
                        !currentChar.worldConfig.hasOwnProperty('// Specific world configuration');
        this.elements.newGameButton.disabled = !hasWorld;
        
        if (!hasWorld) {
            this.elements.newGameButton.title = "This character's world is not yet available";
        } else {
            this.elements.newGameButton.title = "Start a new game with this character";
        }

        // Update preview characters
        const prevIndex = (this.currentIndex - 1 + this.characters.length) % this.characters.length;
        const nextIndex = (this.currentIndex + 1) % this.characters.length;
        
        const prevChar = this.characters[prevIndex];
        const nextChar = this.characters[nextIndex];

        const prevPreview = document.querySelector('.character-preview.prev .character-image');
        const nextPreview = document.querySelector('.character-preview.next .character-image');

        prevPreview.style.backgroundImage = `url(${prevChar.imageUrl})`;
        nextPreview.style.backgroundImage = `url(${nextChar.imageUrl})`;
    }

    nextCharacter() {
        this.currentIndex = (this.currentIndex + 1) % this.characters.length;
        this.updateDisplay();
    }

    previousCharacter() {
        this.currentIndex = (this.currentIndex - 1 + this.characters.length) % this.characters.length;
        this.updateDisplay();
    }

    getCurrentCharacter() {
        return this.characters[this.currentIndex];
    }
}
