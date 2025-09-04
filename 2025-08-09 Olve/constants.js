// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 32;

// Weapon types
export const WEAPONS = {
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
        range: TILE_SIZE * 1,
        cooldown: 200,
        color: '#800080',
        type: 'spinning',
        orbitRadius: TILE_SIZE * 2.5
    },
    DRAGON_SCYTHE: {
        name: 'Dragon Scythe',
        damage: 100,
        range: TILE_SIZE * 1,
        cooldown: 150,
        color: '#ff4500',
        type: 'spinning',
        orbitRadius: TILE_SIZE * 4,
        spinSpeed: 2,
        oscillating: true
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
        projectileSpeed: 8,
        color: '#8b4513',
        type: 'ranged',
        piercing: true
    },
    DRAGON_BOW: {
        name: 'Dragon Bow',
        damage: 30,
        range: TILE_SIZE * 8,
        cooldown: 400,
        projectileSpeed: 12,
        color: '#f77',
        type: 'ranged',
        piercing: true
    },
    NATURE_SCYTHE: {
        name: 'Nature Scythe',
        damage: 50,
        range: TILE_SIZE * 1, // same as other scythes
        cooldown: 200, // same as Scythe
        color: '#3cb371', // mediumseagreen
        type: 'spinning',
        orbitRadius: TILE_SIZE * 4, // same as Dragon Scythe
        spinSpeed: 1, // half the speed of Dragon Scythe
        oscillating: true,
        sprite: 'Nature-scythe.png'
    },
    CRYSTAL_SCYTHE: {
        name: 'Crystal Scythe',
        damage: 100,
        range: TILE_SIZE * 1, // same as other scythes
        cooldown: 200, // same as Scythe
        color: '#00e6ff', // cyan/light blue
        type: 'spinning',
        orbitRadius: TILE_SIZE * 4, // same as Dragon Scythe
        // No spinSpeed or oscillating, so it spins like a regular scythe
        sprite: 'Crystal-scythe.png'
    },

    // Staff Weapons
    FIRE_STAFF: {
        name: 'Fire Staff',
        damage: 40,
        range: TILE_SIZE * 6,
        cooldown: 800,
        color: '#FF4500', // orange-red
        type: 'staff',
        speed: 4,
        sprite: 'Fire_staff.png',
        special: 'fire_explosion_dot',
        explosionRadius: TILE_SIZE * 2,
        explosionDamage: 20,
        fireDotDamage: 5, // Fire damage per tick
        fireDotDuration: 3000, // 3 seconds of fire
        fireDotInterval: 500 // Damage every 0.5 seconds
    },
    
    ICE_STAFF: {
        name: 'Ice Staff',
        damage: 25,
        range: TILE_SIZE * 5,
        cooldown: 600,
        color: '#87CEEB', // sky blue
        type: 'staff',
        speed: 3,
        sprite: 'Ice_staff.png',
        special: 'frost_zone_periodic',
        frostRadius: TILE_SIZE * 1.5,
        slowEffect: 0.5, // Reduces enemy speed to 50%
        attackSpeedReduction: 0.5, // Reduces Ice Staff attack speed to 50%
        slowDuration: 5000, // Frost zones last 5 seconds
        frostZoneInterval: 5, // Every 5th shot
        freezeTime: 3000, // 3 seconds to freeze
        stunDuration: 2000, // 2 seconds stunned
        permanentSlowEffect: 0.75 // 25% permanent speed loss (75% of original speed)
    },
    
    LIGHTNING_STAFF: {
        name: 'Lightning Staff',
        damage: 35,
        range: TILE_SIZE * 7,
        cooldown: 700,
        color: '#8A2BE2', // purple
        type: 'staff',
        speed: 8,
        sprite: 'lightning_staff.png',
        special: 'chain_lightning',
        chainCount: 3,
        chainRange: TILE_SIZE * 3
    },
    
    HEALING_STAFF: {
        name: 'Healing Staff',
        damage: 5, // Reduced damage
        range: TILE_SIZE * 4,
        cooldown: 3000, // Every 3 seconds
        color: '#32CD32', // lime green
        type: 'staff',
        speed: 2,
        sprite: 'Healing_staff.png',
        special: 'healing_over_time',
        healAmount: 10, // Heal 10 HP
        healInterval: 3000 // Every 3 seconds
    },

    // Throwing Weapons
    CHAKRAM: {
        name: 'Chakram',
        damage: 25,
        range: TILE_SIZE * 15, // Long duration bouncing
        cooldown: 2000,
        color: '#FFD700', // gold
        type: 'throwing',
        speed: 7,
        sprite: 'Chakram.png',
        returnSpeed: 0, // Never returns normally
        maxDistance: TILE_SIZE * 50, // Very long distance before disappearing
        spinSpeed: 0.5,
        bouncing: true, // Special bouncing behavior
        piercing: true, // Hits all enemies in path
        bounceDuration: 8000, // Bounces for 8 seconds
        bounceSpeedIncrease: 1.1 // Speed increases 10% per stack
    },
    BOOMERANG: {
        name: 'Boomerang',
        damage: 35,
        range: TILE_SIZE * 7,
        cooldown: 1500,
        color: '#8B4513', // brown
        type: 'throwing',
        speed: 5,
        sprite: 'Boomerang.png',
        returnSpeed: 6,
        maxDistance: TILE_SIZE * 7,
        spinSpeed: 0.25,
        piercing: true
    },
    SPIRIT_BLADE: {
        name: 'Spirit Blade',
        damage: 45,
        range: TILE_SIZE * 5,
        cooldown: 1000,
        color: '#9370DB', // medium purple
        type: 'throwing',
        speed: 8,
        sprite: 'Spirit_blade.png',
        returnSpeed: 8,
        maxDistance: TILE_SIZE * 5,
        spinSpeed: 0.4,
        spectral: true // Passes through enemies but damages them
    },
    THROWING_AXE: {
        name: 'Throwing Axe',
        damage: 65,
        range: TILE_SIZE * 4,
        cooldown: 1200,
        color: '#8B4513', // saddle brown
        type: 'throwing',
        speed: 5,
        sprite: 'axe.png', // You can change this to the actual axe sprite filename
        returnSpeed: 4,
        maxDistance: TILE_SIZE * 4,
        spinSpeed: 0.15,
        heavy: true // Slower but more powerful
    }
};

// Enemy types
export const ENEMY_TYPES = {
    SKELETON: {
        health: 30,
        damage: 5,
        speed: 2,
        color: '#8B8B8B',
        width: TILE_SIZE,
        height: TILE_SIZE,
        points: 100
    },
    SLIME: {
        health: 60,
        damage: 15,
        speed: 1,
        color: '#00AA00',
        width: TILE_SIZE,
        height: TILE_SIZE * 0.75,
        points: 150
    },
    DRAGON: {
        health: 1200,
        damage: 50,
        speed: 1,
        color: '#FF0000',
        width: TILE_SIZE * 3,
        height: TILE_SIZE * 3,
        points: 1000,
        isBoss: true
    }
};

// Keybind configuration
export const DEFAULT_KEYBINDS = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    shoot: ' ',
    interact: 'e',
    pause: 'p'
};

// Available player skins
export const PLAYER_SKINS = [
    { name: 'Purple', color: '#800080' },
    { name: 'Red', color: '#ff0000' },
    { name: 'Blue', color: '#0000ff' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Gold', color: '#ffd700' },
    { name: 'Cyan', color: '#00ffff' }
];

// Konami code
export const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
