// Game Configuration
const CONFIG = {
    // Terrain
    HEIGHTMAP: {
        MIN_ELEVATION: -100,
        MAX_ELEVATION: 500,
        SEA_LEVEL: 0,
        OUT_OF_BOUNDS_ELEVATION: -50,
        TILE_SIZE: 1,
    },

    // Island Sizes
    ISLAND_SIZES: [64, 128, 256, 512],
    DEFAULT_ISLAND_SIZE: 128,
    DEFAULT_SEED: null,

    // Player
    PLAYER: {
        MOVE_SPEED: 10,
        ACCELERATION: 0.3,
        JUMP_HEIGHT: 6,
        JUMP_POWER: Math.sqrt(2 * 9.81 * 6),
        RADIUS: 0.5,
        FRICTION: 0.8,
        GRAVITY: 9.81,
        SPRITE_HEIGHT: 2,
        SPRITE_WIDTH: 1,
    },

    // Camera
    CAMERA: {
        MIN_DISTANCE: 5,
        MAX_DISTANCE: 100,
        DEFAULT_DISTANCE: 20,
        ZOOM_SPEED: 2,
        ROTATION_SPEED: 0.01,
        HEIGHT_OFFSET: 2,
    },

    // Spells
    SPELLS: [
        {
            id: 0,
            name: 'Raise Terrain',
            icon: '⬆️',
            cooldown: 0.5,
            radius: 15,
            intensity: 3,
            category: 'terrain',
        },
        {
            id: 1,
            name: 'Lower Terrain',
            icon: '⬇️',
            cooldown: 0.5,
            radius: 15,
            intensity: 3,
            category: 'terrain',
        },
        {
            id: 2,
            name: 'Level Terrain',
            icon: '▭',
            cooldown: 1,
            radius: 20,
            intensity: 1,
            category: 'terrain',
        },
        {
            id: 3,
            name: 'Smooth Terrain',
            icon: '≈',
            cooldown: 1,
            radius: 20,
            intensity: 1,
            category: 'terrain',
        },
        {
            id: 4,
            name: 'Water Source',
            icon: '💧',
            cooldown: 2,
            radius: 10,
            intensity: 1,
            category: 'terrain',
        },
        {
            id: 5,
            name: 'Fireball',
            icon: '🔥',
            cooldown: 2,
            radius: 20,
            intensity: 5,
            category: 'offensive',
        },
        {
            id: 6,
            name: 'Tornado',
            icon: '🌪️',
            cooldown: 4,
            radius: 25,
            intensity: 3,
            category: 'offensive',
        },
        {
            id: 7,
            name: 'Lightning',
            icon: '⚡',
            cooldown: 5,
            radius: 30,
            intensity: 4,
            category: 'offensive',
        },
        {
            id: 8,
            name: 'Meteor',
            icon: '☄️',
            cooldown: 6,
            radius: 40,
            intensity: 5,
            category: 'offensive',
        },
        {
            id: 9,
            name: 'Time Warp',
            icon: '⏱️',
            cooldown: 3,
            radius: 25,
            intensity: 1,
            category: 'utility',
        },
    ],

    // Water
    WATER: {
        SIMULATION_SPEED: 0.5,
        FLOW_RATE: 0.8,
        EVAPORATION_RATE: 0.01,
        VISCOSITY: 0.95,
        UPDATE_FREQUENCY: 4,
    },

    // Particles
    PARTICLES: {
        MAX_PARTICLES: 10000,
        EMITTER_LIMIT: 50,
        CULLING_DISTANCE: 200,
        QUALITY_LEVELS: {
            low: { maxParticles: 2000, emitterLimit: 20 },
            medium: { maxParticles: 5000, emitterLimit: 35 },
            high: { maxParticles: 10000, emitterLimit: 50 },
        },
    },

    // Weather
    WEATHER: {
        CYCLE_DURATION: 30000, // 30 seconds for demo
        TRANSITION_TIME: 5000,
        CLOUD_SPEED_MULTIPLIER: 2,
    },

    // Day/Night
    TIME: {
        CYCLE_DURATION: 20 * 60 * 1000, // 20 minutes
        START_TIME: 6 * 60 * 60 * 1000, // 6 AM
    },

    // Networking
    NETWORKING: {
        UPDATE_RATE: 30, // Hz
        TERRAIN_UPDATE_RATE: 10, // Hz
        LIQUID_UPDATE_RATE: 5, // Hz
        HEARTBEAT_INTERVAL: 5000,
        HEARTBEAT_TIMEOUT: 15000,
        RECONNECT_DELAY: 1000,
        MAX_RECONNECT_ATTEMPTS: 10,
    },

    // Physics
    PHYSICS: {
        GRAVITY: 9.81,
        DAMPING: 0.99,
        ANGULAR_DAMPING: 0.9,
    },

    // Trees
    TREES: {
        MASS: 15,
        FRICTION: 0.8,
        BURN_DURATION: 20,
        COLLISION_GROUP: 1,
    },

    // Rocks
    ROCKS: {
        MASS: 100,
        FRICTION: 0.6,
        COLLISION_GROUP: 1,
    },

    // Grass
    GRASS: {
        BLADE_HEIGHT: 0.6,
        SWAY_AMPLITUDE: 0.15,
        WIND_SENSITIVITY: 1.5,
        REGENERATION_TIME: 120000, // 2 minutes
    },

    // Wind
    WIND: {
        BASE_SPEED: 5,
        GUST_FREQUENCY: 15000,
        MAX_SPEED_MULTIPLIER: 3,
        DIRECTION_CHANGE_TIME: 20000,
    },

    // Rendering
    RENDERING: {
        FOV: 75,
        NEAR_CLIP: 0.1,
        FAR_CLIP: 1000,
        SHADOW_MAP_SIZE: 2048,
    },

    // Debug
    DEBUG: false,
};
