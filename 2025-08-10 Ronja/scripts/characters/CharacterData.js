const CharacterData = {
    characters: [
        {
            id: 'abaddon',
            name: 'Abaddon',
            description: 'An angel sent to kill every faulty angel, also called fallen demons.',
            imageUrl: 'images/Chibi/AbaddonC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Abaddon
            }
        },
        {
            id: 'shade',
            name: 'Shade',
            description: 'The only wolf in a school full of mostly house pets.',
            imageUrl: 'images/Chibi/ShadeC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Shade
            }
        },
        {
            id: 'dragonwolf',
            name: 'DragonWolf',
            description: 'A mutated half eyed wolf, they were chased out of the half eyed wolves territory and found their family among other outcasts.',
            imageUrl: 'images/Chibi/DragonWolfC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for DragonWolf
            }
        },
        {
            id: 'safnil',
            name: 'Safnil',
            description: 'A troll who keeps to himself and lashes out to trolls that are under him on the hemospecrum due to the fact that he is not suposed to exist, his is a mutant blood after all.',
            imageUrl: 'images/Chibi/SafnilC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Safnil
            }
        },
        {
            id: 'kolen',
            name: 'Kolen',
            description: 'A Tabaxi that wears a mask that talks to him. He is untrusting of everyone except the mask.',
            imageUrl: 'images/Chibi/KolenC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Kolen
            }
        },
        {
            id: 'rolan',
            name: 'Rolan',
            description: 'A half-elf that lives in a village of "misfits" - everyone there has either been deemed misfits by someone in their life or was born there.',
            imageUrl: 'images/Chibi/RolanC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Rolan
            }
        },
        {
            id: 'teeto',
            name: 'Teeto',
            description: 'A stupid little leopard gecko that accidentally sold his soul to a devil.',
            imageUrl: 'images/Chibi/TeetoC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Teeto
            }
        },
        {
            id: 'anangel',
            name: 'An Angel',
            description: 'An angel that now lives on earth, their scars a reminder of the past. Although what happened in the past might have been traumatic, they are able to live a comfortable and even happy life now.',
            imageUrl: 'images/Chibi/AnAngelC.png',
            triggerWarning: null,
            worldConfig: {
                // Specific world configuration for Angel
            }
        },
        {
            id: 'crane',
            name: 'Crane',
            description: 'A crane who works at the big hospital, she loves helping others and is loved by everyone who knows her. A god of memories, at least they used to be.',
            imageUrl: 'images/Chibi/CraneC.png',
            triggerWarning: null,
            worldConfig: {
                backgrounds: {
                    hospital: 'images/Crane/Crane background 1.jpg'
                },
                transitions: {
                    fadeIn: {
                        type: 'fade',
                        duration: 1000,
                        from: '#000000',
                        to: 'transparent'
                    },
                    fadeOut: {
                        type: 'fade',
                        duration: 1000,
                        from: 'transparent',
                        to: '#000000'
                    }
                },
                initialScene: 'intro',
                scenes: {
                    intro: {
                        background: 'hospital',
                        onEnter: ['fadeIn'],
                        onExit: ['fadeOut'],
                        actions: [
                            {
                                type: 'wait',
                                duration: 1000
                            }
                        ]
                    }
                }
            }
        }
    ],

    getCharacterById(id) {
        return this.characters.find(char => char.id === id);
    }
};
