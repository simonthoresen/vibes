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
