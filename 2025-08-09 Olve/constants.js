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
    TRIPLE_BOW: {
        name: 'Triple Bow',
        damage: 35,
        range: TILE_SIZE * 8,
        cooldown: 267, // 1.5x attack speed of Dragon Bow (400 / 1.5)
        projectileSpeed: 12,
        color: '#9d4edd', // purple
        type: 'ranged',
        piercing: true,
        multiShot: 3, // Shoots 3 arrows at once
        spreadAngle: 0.8, // Very bad accuracy - much wider spread between arrows
        sprite: 'fast_arrow.png'
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
    },

    // Legendary Summoning Weapons (Dragon-tier rarity)
    CURSED_ORB: {
        name: 'Cursed Orb',
        damage: 0, // Doesn't deal direct damage
        range: TILE_SIZE * 15, // Large summoning range
        cooldown: 60000, // 60 seconds between summons
        color: '#8B0000', // dark red
        type: 'summon',
        sprite: 'summon_orb.png',
        summonType: 'demon',
        maxMinions: 1, // Base amount, increases with stacking
        minionDuration: 30000, // 30 seconds
        baseMinionHealth: 200,
        baseMinionDamage: 100,
        minionSpeed: 2,
        projectileSpeed: 6,
        attackRate: 3, // 3 shots per second
        special: 'reflection_damage' // Reflects damage back to attackers
    },
    FLAMING_SKULL: {
        name: 'Flaming Skull',
        damage: 75, // Base damage for lightning attacks
        range: TILE_SIZE * 18, // 3x longer range for lightning
        cooldown: 1000, // 1 second attack cooldown  
        color: '#FF6347', // tomato red
        type: 'orbital', // Changed from 'summon' to 'orbital'
        sprite: 'Skull_minion.png',
        orbitRadius: TILE_SIZE * 3, // Distance from player
        attackRange: TILE_SIZE * 18, // 3x longer attack range for lightning
        special: 'blue_lightning', // Shoots blue lightning
        permanent: true // Never despawns
    },

    // Trap Weapons (Deployable/Strategic)
    SPIKE_TRAP: {
        name: 'Spike Trap',
        damage: 60,
        range: TILE_SIZE * 0.5, // Detection range for enemies
        cooldown: 3000, // 3 seconds between deployments
        color: '#808080', // Gray color
        type: 'trap',
        trigger: 'proximity', // Activates when enemies get close
        triggerRange: TILE_SIZE * 1.5, // Range to detect enemies
        duration: 15000, // Trap lasts 15 seconds
        armTime: 1000, // 1 second to arm after placement
        sprite: 'spike_trap.png'
    },
    WEB_LAUNCHER: {
        name: 'Web Launcher',
        damage: 1, // Deals 1 damage
        range: TILE_SIZE * 4, // Deployment range
        cooldown: 4000, // 4 seconds between deployments
        color: '#e0e0e0', // Light gray
        type: 'trap',
        trigger: 'area', // Creates persistent area effect
        area: TILE_SIZE * 2.5, // Size of sticky area
        slowEffect: 0.3, // Slows enemies to 30% speed
        duration: 10000, // Web lasts 10 seconds
        sprite: 'cobweb.png'
    },
    EXPLOSIVE_MINE: {
        name: 'Explosive Mine',
        damage: 120, // High explosion damage
        range: TILE_SIZE * 1, // Deployment range
        cooldown: 5000, // 5 seconds between deployments
        color: '#ffcc00', // Yellow/gold
        type: 'trap',
        trigger: 'proximity_timer', // Proximity OR timer trigger
        triggerRange: TILE_SIZE * 1.875, // Increased proximity radius (50% larger)
        explosionRadius: TILE_SIZE * 2.5, // Large explosion area
        duration: 12000, // Mine lasts 12 seconds before auto-detonating
        armTime: 2000, // 2 seconds to arm
        blinkDuration: 3000, // Start blinking 3 seconds before detonation
        proximityWarningTime: 1000, // 1 second of rapid blinking before exploding when enemy is close
        sprite: 'explosive_mine.png'
    },
    POISON_CLOUD: {
        name: 'Poison Cloud',
        damage: 0, // No initial damage
        range: TILE_SIZE * 3, // Deployment range
        cooldown: 6000, // 6 seconds between deployments
        color: '#98fb98', // Light green
        type: 'trap',
        trigger: 'area', // Creates persistent poison area
        area: TILE_SIZE * 3, // Large poison cloud area
        dotDamage: 8, // Damage over time per tick
        dotInterval: 1000, // Damage every 1 second
        duration: 12000, // Cloud lasts 12 seconds
        sprite: 'poison_cloud.png',
        // Poison aura around player when equipped
        aura: {
            radius: TILE_SIZE * 2, // Poison aura radius around player
            dotDamage: 5, // Damage per tick in aura
            dotInterval: 1000, // Damage every 1 second
            particleCount: 60 // Number of particles in aura
        }
    },

    // Passive Weapons (Special Effects)
    UMBRELLA: {
        name: 'The Umbrella',
        damage: 0, // No damage
        range: 0, // No range
        cooldown: 0, // No cooldown
        color: '#0080FF', // Bright blue
        type: 'umbrella',
        description: 'Seems to do nothing.',
        sprite: 'umbrella.png',
        dodgeChance: 0.05, // 5% base chance to avoid damage
        dodgeChancePerStack: 0.05 // Additional 5% per umbrella
    },

    // Cheat-only Weapons
    RALSEI: {
        name: 'Ralsei',
        damage: 0, // Uses instant kill instead
        range: TILE_SIZE * 12, // Longer range for beam
        cooldown: 10000, // 10 seconds between beam shots
        projectileSpeed: 20, // Fast beam speed
        color: '#FF69B4', // Hot pink like Ralsei's outfit
        type: 'ranged',
        sprite: 'Healing_staff.png', // Reuse healing staff sprite for projectiles
        special: 'ralsei_instant_kill_beam',
        healAmount: 5, // Heals 5 HP
        healInterval: 1000, // Every 1 second
        cheatOnly: true, // Mark as cheat-only weapon
        piercing: true, // Beam goes through all enemies
        beamWidth: TILE_SIZE * 2, // Wide beam
        beamLength: 5000 // Beam extends far beyond screen
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

// Companion types for summoning weapons
export const COMPANION_TYPES = {
    DEMON: {
        health: 200, // Base health, doubles with each stack
        damage: 100, // Base damage, doubles with each stack
        speed: 2,
        color: '#8B0000', // dark red
        width: TILE_SIZE * 2, // Twice player size
        height: TILE_SIZE * 2,
        attackRange: 9999, // Can attack enemies anywhere on the map
        attackCooldown: 333, // 3 shots per second (1000ms / 3)
        sprite: 'eyeball_minion.png',
        projectileSize: TILE_SIZE, // Player-sized projectiles
        projectileSprite: 'eyeball_minion_attack.png',
        reflectsDamage: true
    },
    SKULL_COMPANION: {
        health: 999999, // Effectively immortal
        damage: 25, // Base damage, doubles with each stack
        speed: 3,
        color: '#FF6347', // tomato red with blue lightning
        width: TILE_SIZE,
        height: TILE_SIZE,
        attackRange: TILE_SIZE * 6,
        attackCooldown: 1000, // 1 second, halves with each stack
        sprite: 'Skull_minion.png',
        permanent: true,
        lightningColor: '#00BFFF' // Deep sky blue
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
