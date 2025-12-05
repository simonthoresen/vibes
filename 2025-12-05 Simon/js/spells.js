// Spell System
class SpellSystem {
    constructor(scene, terrain, particleSystem, networking) {
        this.scene = scene;
        this.terrain = terrain;
        this.particleSystem = particleSystem;
        this.networking = networking;
        this.spells = CONFIG.SPELLS;
        this.cooldowns = new Map();
        this.selectedSpell = 0;
        
        // Initialize cooldowns
        for (const spell of this.spells) {
            this.cooldowns.set(spell.id, 0);
        }
    }

    selectSpell(index) {
        if (index >= 0 && index < this.spells.length) {
            this.selectedSpell = index;
            return this.spells[index];
        }
        return null;
    }

    getSelectedSpell() {
        return this.spells[this.selectedSpell];
    }

    canCastSpell(spellId) {
        return this.cooldowns.get(spellId) <= 0;
    }

    castSpell(spellId, targetX, targetZ, targetY = null) {
        if (!this.canCastSpell(spellId)) return false;

        const spell = this.spells[spellId];
        if (!spell) return false;

        // If target Y not provided, use terrain height
        if (targetY === null) {
            targetY = this.terrain.getHeightAt(targetX, targetZ);
        }

        // Validate target is within bounds
        if (targetX < 0 || targetX >= this.terrain.size ||
            targetZ < 0 || targetZ >= this.terrain.size) {
            return false;
        }

        // Execute spell
        switch (spell.name) {
            case 'Raise Terrain':
                this.terrain.modifyTerrain(targetX, targetZ, spell.radius, spell.intensity, 'raise');
                this.createSpellEffect('raise', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Lower Terrain':
                this.terrain.modifyTerrain(targetX, targetZ, spell.radius, spell.intensity, 'lower');
                this.createSpellEffect('lower', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Level Terrain':
                this.terrain.modifyTerrain(targetX, targetZ, spell.radius, spell.intensity, 'level');
                this.createSpellEffect('level', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Smooth Terrain':
                this.terrain.modifyTerrain(targetX, targetZ, spell.radius, spell.intensity, 'smooth');
                this.createSpellEffect('smooth', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Water Source':
                this.terrain.addWaterSource(targetX, targetZ, spell.radius);
                this.createSpellEffect('water', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Fireball':
                this.createSpellEffect('fireball', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Lightning':
                this.createSpellEffect('lightning', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Tornado':
                this.createSpellEffect('tornado', targetX, targetY, targetZ, spell.radius);
                break;
            case 'Meteor':
                this.createSpellEffect('meteor', targetX, targetY, targetZ, spell.radius);
                break;
        }

        // Set cooldown
        this.cooldowns.set(spellId, spell.cooldown);

        // Send to server if networked
        if (this.networking) {
            this.networking.sendSpellCast(spellId, targetX, targetZ, targetY);
        }

        return true;
    }

    createSpellEffect(type, x, y, z, radius) {
        const color = this.getEffectColor(type);
        
        // Create particle emitter for spell
        const emitter = this.particleSystem.createEmitter({
            position: new THREE.Vector3(x, y + 2, z),
            velocity: new THREE.Vector3(0, 2, 0),
            acceleration: new THREE.Vector3(0, -5, 0),
            particleLifetime: 1,
            emissionRate: 50,
            particleSize: 0.5,
            particleColor: color,
            count: 100,
            spread: radius * 0.5,
        });

        if (emitter) {
            emitter.life = 1;
        }
    }

    getEffectColor(type) {
        switch (type) {
            case 'raise':
            case 'lower':
            case 'level':
            case 'smooth':
                return 0x00ff00;
            case 'water':
                return 0x0088ff;
            case 'fireball':
                return 0xff4400;
            case 'lightning':
                return 0xffff00;
            case 'tornado':
                return 0x888888;
            case 'meteor':
                return 0xff8800;
            default:
                return 0xffffff;
        }
    }

    update(deltaTime) {
        // Update cooldowns
        for (const [spellId, cooldown] of this.cooldowns.entries()) {
            if (cooldown > 0) {
                this.cooldowns.set(spellId, cooldown - deltaTime);
            }
        }
    }

    getCooldownPercent(spellId) {
        const spell = this.spells[spellId];
        if (!spell) return 0;
        
        const cooldown = this.cooldowns.get(spellId);
        return Math.max(0, Math.min(1, cooldown / spell.cooldown));
    }
}
