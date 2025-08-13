const CharacterData = {
    characters: [
        {
            id: 'abaddon',
            name: 'Abaddon',
            description: 'An angel sent to kill every faulty angel, also called fallen demons.',
            imageUrl: 'images/abaddonC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Abaddon
            }
        },
        {
            id: 'shade',
            name: 'Shade',
            description: 'The only wolf in a school full of mostly house pets.',
            imageUrl: 'images/shadeC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Shade
            }
        },
        {
            id: 'dragonwolf',
            name: 'DragonWolf',
            description: 'A mutated half eyed wolf, they were chased out of the half eyed wolves territory and found their family among other outcasts.',
            imageUrl: 'images/dragonwolfC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for DragonWolf
            }
        },
        {
            id: 'safnil',
            name: 'Safnil',
            description: 'A troll who keeps to himself and lashes out to trolls that are under him on the hemospecrum due to the fact that he is not suposed to exist, his is a mutant blood after all.',
            imageUrl: 'images/safnilC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Safnil
            }
        },
        {
            id: 'kolen',
            name: 'Kolen',
            description: 'A Tabaxi that wears a mask that talks to him. He is untrusting of everyone except the mask.',
            imageUrl: 'images/kolenC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Kolen
            }
        },
        {
            id: 'rolan',
            name: 'Rolan',
            description: 'A half-elf that lives in a village of "misfits" - everyone there has either been deemed misfits by someone in their life or was born there.',
            imageUrl: 'images/rolanC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Rolan
            }
        },
        {
            id: 'teeto',
            name: 'Teeto',
            description: 'A stupid little leopard gecko that accidentally sold his soul to a devil.',
            imageUrl: 'images/teetoC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Teeto
            }
        },
        {
            id: 'anangel',
            name: 'An Angel',
            description: 'An angel that now lives on earth, their scars a reminder of the past. Although what happened in the past might have been traumatic, they are able to live a comfortable and even happy life now.',
            imageUrl: 'images/anangelC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Angel
            }
        },
        {
            id: 'crane',
            name: 'Crane',
            description: 'A crane who works at the big hospital, she loves helping others and is loved by everyone who knows her. A god of memories, at least they used to be.',
            imageUrl: 'images/CraneC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Crane
            }
        }
    ],

    getCharacterById(id) {
        return this.characters.find(char => char.id === id);
    }
};
