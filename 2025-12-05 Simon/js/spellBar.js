// Spell Bar UI
class SpellBar {
    constructor(spellSystem) {
        this.spellSystem = spellSystem;
        this.container = document.getElementById('spellBar');
        this.spellSlots = [];
        this.render();
    }

    render() {
        this.container.innerHTML = '';

        for (let i = 0; i < this.spellSystem.spells.length; i++) {
            const spell = this.spellSystem.spells[i];
            const slot = document.createElement('div');
            slot.className = 'spell-slot';
            slot.id = `spell-${i}`;
            slot.innerHTML = `
                <div class="keybind">${i === 9 ? '0' : i + 1}</div>
                <div>${spell.icon}</div>
                <div class="cooldown-text" id="cooldown-${i}"></div>
            `;

            slot.addEventListener('click', () => {
                this.spellSystem.selectSpell(i);
                this.updateHighlight();
            });

            this.container.appendChild(slot);
            this.spellSlots.push(slot);
        }

        this.updateHighlight();
    }

    updateHighlight() {
        this.spellSlots.forEach((slot, i) => {
            if (i === this.spellSystem.selectedSpell) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }

    update() {
        for (let i = 0; i < this.spellSystem.spells.length; i++) {
            const cooldown = this.spellSystem.cooldowns.get(i);
            const cooldownText = document.getElementById(`cooldown-${i}`);
            
            if (cooldown > 0) {
                this.spellSlots[i].classList.add('cooldown');
                cooldownText.textContent = cooldown.toFixed(1) + 's';
            } else {
                this.spellSlots[i].classList.remove('cooldown');
                cooldownText.textContent = '';
            }
        }
    }
}
