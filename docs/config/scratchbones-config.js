window.SCRATCHBONES_CONFIG = {
  // WebSocket relay URL for online multiplayer.
  // Set this to your ngrok (or other public) address when running remotely,
  // or remove / comment it out to fall back to ws://localhost:8080 for local dev.
  // Example: wsUrl: 'wss://mustang-walk-schematic.ngrok-free.dev',
  wsUrl: 'wss://mustang-walk-schematic.ngrok-free.dev',


  // Global clothing color tuning offsets.
  clothingHueOffset: 0,
  clothingSatOffset: 0,
  clothingLightOffset: 0,

  game: {
    "debug": {
      "enabled": true,
      "includeConsoleDebug": true,
      "eventLogLimit": 400,
      "trace": {
        "gameplayFlow": true,
        "layerPromotion": false,
        "audio": false,
        "candlelight": false,
        "actions": true
      }
    },
    "deck": {
      "rankCount": 10,
      "copiesPerRank": 4,
      "handSize": 10,
      "wildCount": 10,
      "playerCount": 4,
      "humanNames": [
        "You"
      ]
    },

    "trickBones": {
      "defaultUnlocked": ["smuggle", "trap", "punish"],
      "defaultLoadout": ["smuggle", "trap", "punish", "smuggle", "trap", "punish"],
      "loadoutSize": 6,
      "definitions": {
        "smuggle": {
          "id": "smuggle",
          "label": "Smuggle Bone",
          "description": "Move a selected card to another player when the table allows a smuggle reaction.",
          "wild": false
        },
        "trap": {
          "id": "trap",
          "label": "Trap Bone",
          "description": "A reactive wild trick bone that can spring during a challenge.",
          "wild": true
        },
        "punish": {
          "id": "punish",
          "label": "Punish Bone",
          "description": "Arm a punishment before a betting decision to pressure the next claim.",
          "wild": false
        }
      },
      "npcArchetypes": [
        { "id": "balanced", "weight": 3, "loadoutWeights": { "smuggle": 1, "trap": 1, "punish": 1 } },
        { "id": "trickster", "weight": 2, "loadoutWeights": { "smuggle": 2, "trap": 2, "punish": 1 } },
        { "id": "enforcer", "weight": 2, "loadoutWeights": { "smuggle": 1, "trap": 1, "punish": 2 } }
      ]
    },
    "nameGeneration": {
      "defaultCultureId": "mao_ao",
      "seedPrefix": "madiao-player",
      "aiCultureSelection": {
        "usePortraitSpeciesCulture": true,
        "fallbackCultureId": "mao_ao",
        "speciesToCultureId": {
          "mao_ao": "mao_ao",
          "mao-ao": "mao_ao",
          "kenkari": "kenkari",
          "tletingan": "slagothim"
        }
      },
      "cultures": {
        "mao_ao": {
          "id": "mao_ao",
          "displayName": "Mao-ao",
          "casing": "title",
          "birthRules": {
            "surnameFromParent": false,
            "maleFirstInitialMatchesSurnameFirstLetter": true
          },
          "marriageRules": {
            "wifeTakesHusbandSurname": true,
            "wifePrefixesHusbandFirstInitial": true
          },
          "positionedSyllables": {
            "pools": {
              "consonants": ["w", "r", "t", "y", "p", "s", "f", "g", "h", "b", "n", "m", "k"],
              "clusters": ["sh", "hy"],
              "vowels": ["a", "e", "i", "o", "u", "ai", "ao"],
              "diphthongs": ["ai", "ao"]
            },
            "firstName": {
              "syllables": { "min": 3, "max": 3 },
              "first": {
                "female": { "patterns": ["V", "Vn", "Vng"] },
                "male": { "patterns": ["CV", "CVn", "CVng", "CVr"] }
              },
              "middle": {
                "female": { "patterns": ["CV", "CVn"] },
                "male": { "patterns": ["CV", "CVn", "CVr"] }
              },
              "last": {
                "male": { "patterns": ["jei", "ji", "jo", "CV{e}", "CV{i}", "CV{o}", "CV{u}", "CV{ai}"] },
                "female": { "patterns": ["CV{a}", "CV{i}", "CV{ai}"] }
              },
              "conditionalLast": {}
            },
            "lastName": {
              "syllables": { "exact": 2 },
              "deriveFromFirstNameMaleRules": true
            }
          }
        },
        "kenkari": {
          "id": "kenkari",
          "displayName": "Kenkari",
          "casing": "title",
          "kenkariRules": {
            "phonology": {
              "consonants": ["b", "g", "h", "k", "m", "n", "p", "r", "t"],
              "consonantWeights": { "b": 1, "g": 7, "h": 7, "k": 11, "m": 10, "n": 10, "p": 8, "r": 8, "t": 8 },
              "finalConsonantWeights": { "b": 1, "g": 4, "h": 3, "k": 12, "m": 12, "n": 13, "p": 5, "r": 3, "t": 4 },
              "postGlottalFinalConsonantWeights": { "b": 1, "g": 3, "h": 2, "k": 12, "m": 12, "n": 14, "p": 3, "r": 1, "t": 2 },
              "vowels": ["a", "e", "i", "o", "u", "ai", "ey"],
              "vowelWeights": { "a": 11, "e": 4, "i": 11, "o": 8, "u": 10, "ai": 4, "ey": 4 },
              "finalVowelWeights": { "a": 12, "i": 13, "o": 4, "u": 11, "ai": 5, "ey": 0, "ao": 5 },
              "finalOnlyVowels": ["ao"],
              "minPhonemes": 2,
              "maxPhonemes": 4,
              "templateWeights": [
                { "pattern": ["V", "'V", "CV"], "weight": 18, "label": "V'CV" },
                { "pattern": ["CV", "'V"], "weight": 18, "label": "CV'V" },
                { "pattern": ["CV", "CV"], "weight": 18, "label": "CVCV" },
                { "pattern": ["CV", "'V", "CV"], "weight": 16, "label": "CV'VCV" },
                { "pattern": ["CV", "CV", "CV"], "weight": 12, "label": "CVCVCV" },
                { "pattern": ["V", "'V", "CV", "CV"], "weight": 8, "label": "V'VCVCV" }
              ]
            },
            "surnameRules": {
              "malePrefix": "ao",
              "femalePrefix": "u"
            }
          }
        },
        "slagothim": {
          "id": "slagothim",
          "displayName": "Slagothim",
          "casing": "title",
          "slagothimRules": {
            "locations": ["Ikinga", "Bahangi", "Hatonga", "Rahingi", "B'bonga", "Niringi", "Ununga", "Gorungi"],
            "firstConsonants": ["b", "g", "n", "p", "t", "d", "k", "m", "sl", "shr", "tr", "gr", "br", "gl"],
            "firstConsonantClusters": ["sl", "shr", "tr", "gr", "br", "gl"],
            "vowels": ["a", "e", "i", "o", "u"],
            "secondConsonants": ["b", "g", "p", "t", "d", "k", "r", "n", "ng"],
            "rareSecondConsonantCluster": "mn",
            "maleSlOnlyEndings": ["o", "u"],
            "femaleSlOnlyEndings": ["a", "i"],
            "maleSuffix": "mir",
            "femaleSuffix": "mira",
            "startWithSlChance": 0.58,
            "slNameUsesSuffixChance": 0.2,
            "optionalBridgeVowelChance": 0.55,
            "mnClusterChance": 0.08
          }
        }
      }
    },
    "dyes": {
      "swatchBase": "#7dc89a",
      "categories": [
        { "id": "reds", "label": "Reds" },
        { "id": "oranges", "label": "Oranges" },
        { "id": "yellows", "label": "Yellows" },
        { "id": "greens", "label": "Greens" },
        { "id": "blues", "label": "Blues" },
        { "id": "purples", "label": "Purples" }
      ],
      "catalog": [
          // Red cloth dye offsets are fitted against swatchBase using the runtime
          // hue-rotate(...) saturate(...) brightness(...) filter pipeline.
          // ── Cloth dyes — full range ─────────────────────────────────────────────
          { id: 'dye:CLOTH:red',       label: 'Jade',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  15, s:  1.67, v: -0.16 } }, // #00A86B
          { id: 'dye:CLOTH:orange',    label: 'Teal',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  37, s:  1.67, v: -0.36 } }, // #008080
          { id: 'dye:CLOTH:yellow',    label: 'Azure',    group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  67, s:  1.67, v:  0.27 } }, // #007FFF
          { id: 'dye:CLOTH:green',     label: 'Amethyst', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 127, s:  0.33, v:  0.02 } }, // #9966CC
          { id: 'dye:CLOTH:blue',      label: 'Crimson',  group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-152.370, s:  5.913, v: -0.638 } }, // #DC143C
          { id: 'dye:CLOTH:purple',    label: 'Amber',    group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h: -98, s:  1.67, v:  0.27 } }, // #FFBF00
          { id: 'dye:CLOTH:brown',     label: 'Moss',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -68, s:  0.09, v: -0.23 } }, // #8A9A5B
          { id: 'dye:CLOTH:black',     label: 'Onyx',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h:  52, s: -0.81, v: -0.71 } }, // #353839
          { id: 'dye:CLOTH:white',     label: 'Mist',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  87, s: -0.85, v:  0.04 } }, // #C4C6D0
          { id: 'dye:CLOTH:grey',      label: 'Sage',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -35, s: -0.36, v: -0.23 } }, // #7D9B76
          { id: 'dye:CLOTH:navy',      label: 'Navy',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  97, s:  1.67, v: -0.36 } }, // #000080
          { id: 'dye:CLOTH:scarlet',   label: 'Scarlet',  group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-129.831, s:  6.039, v: -0.558 } }, // #FF2400
          { id: 'dye:CLOTH:gold',      label: 'Gold',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -93, s:  1.67, v:  0.27 } }, // #FFD700
          { id: 'dye:CLOTH:violet',    label: 'Violet',   group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 127, s:  1.67, v:  0.27 } }, // #8000FF
          { id: 'dye:CLOTH:forest',    label: 'Forest',   group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -23, s:  1.01, v: -0.31 } }, // #228B22
          { id: 'dye:CLOTH:ivory',     label: 'Ivory',    group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -83, s: -0.84, v:  0.27 } }, // #FFFFF0
          { id: 'dye:CLOTH:wine',      label: 'Wine',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-146.926, s:  1.489, v: -0.658 } }, // #722F37
          { id: 'dye:CLOTH:cobalt',    label: 'Cobalt',   group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  72, s:  1.67, v: -0.15 } }, // #0047AB
          // Earth & brown additions
          { id: 'dye:CLOTH:saddlebrown', label: 'Brown',  group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-118, s:  1.30, v: -0.31 } }, // #8B4513
          { id: 'dye:CLOTH:rust',      label: 'Rust',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-125, s:  1.46, v: -0.08 } }, // #B7410E
          { id: 'dye:CLOTH:sand',      label: 'Sand',     group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h:-109, s: -0.11, v:  0.05 } }, // #D2B48C
          { id: 'dye:CLOTH:sienna',    label: 'Sienna',   group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-124, s:  0.92, v: -0.20 } }, // #A0522D

          // Reds additions
          { id: 'dye:CLOTH:carmine', label: 'Carmine', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-149.647, s:  9.151, v: -0.814 } }, // #960018
          { id: 'dye:CLOTH:vermilion', label: 'Vermilion', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-134.100, s:  3.015, v: -0.451 } }, // #E34234
          { id: 'dye:CLOTH:rose', label: 'Rose', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-172.739, s:  8.304, v: -0.649 } }, // #FF007F
          { id: 'dye:CLOTH:ruby', label: 'Ruby', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-164.588, s:  6.011, v: -0.631 } }, // #E0115F
          { id: 'dye:CLOTH:brick', label: 'Brick', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-148.145, s:  2.297, v: -0.470 } }, // #CB4154
          { id: 'dye:CLOTH:garnet', label: 'Garnet', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-138.265, s:  1.189, v: -0.630 } }, // #733635
          { id: 'dye:CLOTH:poppy', label: 'Poppy', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-139.268, s:  3.828, v: -0.456 } }, // #FF3838
          { id: 'dye:CLOTH:currant', label: 'Currant', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-163.591, s:  8.437, v: -0.818 } }, // #8A0032
          { id: 'dye:CLOTH:claret', label: 'Claret', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-157.812, s:  3.950, v: -0.739 } }, // #7F1734
          { id: 'dye:CLOTH:coral_red', label: 'Coral Red', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'reds', color: { h:-139.268, s:  3.355, v: -0.421 } }, // #FF4040
          // Oranges additions
          { id: 'dye:CLOTH:tangerine', label: 'Tangerine', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-110, s:  1.67, v:  0.21 } }, // #F28500
          { id: 'dye:CLOTH:persimmon', label: 'Persimmon', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-121, s:  1.67, v:  0.18 } }, // #EC5800
          { id: 'dye:CLOTH:apricot', label: 'Apricot', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-119, s: -0.21, v:  0.26 } }, // #FBCEB1
          { id: 'dye:CLOTH:burnt_orange', label: 'Burnt Orange', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-118, s:  1.67, v:  0.02 } }, // #CC5500
          { id: 'dye:CLOTH:pumpkin', label: 'Pumpkin', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-119, s:  1.42, v:  0.28 } }, // #FF7518
          { id: 'dye:CLOTH:ochre', label: 'Ochre', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-113, s:  1.22, v:  0.02 } }, // #CC7722
          { id: 'dye:CLOTH:copperleaf', label: 'Copperleaf', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-128, s:  0.49, v: -0.09 } }, // #B66A50
          { id: 'dye:CLOTH:marigold', label: 'Marigold', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-104, s:  1.29, v:  0.17 } }, // #EAA221
          { id: 'dye:CLOTH:flame', label: 'Flame', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-126, s:  1.27, v:  0.13 } }, // #E25822
          { id: 'dye:CLOTH:cantaloupe', label: 'Cantaloupe', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'oranges', color: { h:-108, s:  1.22, v:  0.28 } }, // #FFA62B
          // Yellows additions
          { id: 'dye:CLOTH:lemon', label: 'Lemon', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -87, s:  0.84, v:  0.28 } }, // #FFF44F
          { id: 'dye:CLOTH:saffron', label: 'Saffron', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -98, s:  1.14, v:  0.22 } }, // #F4C430
          { id: 'dye:CLOTH:citrine', label: 'Citrine', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -89, s:  1.55, v:  0.14 } }, // #E4D00A
          { id: 'dye:CLOTH:honey', label: 'Honey', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -98, s:  1.55, v:  0.28 } }, // #FFC30B
          { id: 'dye:CLOTH:maize', label: 'Maize', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -89, s:  0.68, v:  0.26 } }, // #FBEC5D
          { id: 'dye:CLOTH:mustard', label: 'Mustard', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -96, s:  0.75, v:  0.28 } }, // #FFDB58
          { id: 'dye:CLOTH:butter', label: 'Butter', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -94, s: -0.23, v:  0.28 } }, // #FFF1B5
          { id: 'dye:CLOTH:flax', label: 'Flax', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -93, s:  0.21, v:  0.19 } }, // #EEDC82
          { id: 'dye:CLOTH:canary', label: 'Canary', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -83, s:  0.07, v:  0.28 } }, // #FFFF99
          { id: 'dye:CLOTH:dandelion', label: 'Dandelion', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'yellows', color: { h: -88, s:  1.13, v:  0.20 } }, // #F0E130
          // Greens additions
          { id: 'dye:CLOTH:emerald', label: 'Emerald', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  -3, s:  0.60, v:  0.00 } }, // #50C878
          { id: 'dye:CLOTH:malachite', label: 'Malachite', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  -3, s:  1.53, v:  0.09 } }, // #0BDA51
          { id: 'dye:CLOTH:viridian', label: 'Viridian', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  18, s:  0.35, v: -0.35 } }, // #40826D
          { id: 'dye:CLOTH:fern', label: 'Fern', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -37, s:  0.21, v: -0.39 } }, // #4F7942
          { id: 'dye:CLOTH:olive', label: 'Olive', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -83, s:  1.67, v: -0.36 } }, // #808000
          { id: 'dye:CLOTH:mint', label: 'Mint', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -23, s:  0.08, v:  0.28 } }, // #98FF98
          { id: 'dye:CLOTH:pine', label: 'Pine', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  32, s:  1.64, v: -0.39 } }, // #01796F
          { id: 'dye:CLOTH:laurel', label: 'Laurel', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h: -48, s: -0.58, v: -0.07 } }, // #A9BA9D
          { id: 'dye:CLOTH:shamrock', label: 'Shamrock', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:  13, s:  1.67, v: -0.21 } }, // #009E60
          { id: 'dye:CLOTH:seafoam', label: 'Seafoam', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'greens', color: { h:   6, s: -0.21, v:  0.13 } }, // #9FE2BF
          // Blues additions
          { id: 'dye:CLOTH:sapphire', label: 'Sapphire', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  73, s:  1.45, v: -0.07 } }, // #0F52BA
          { id: 'dye:CLOTH:cerulean', label: 'Cerulean', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  53, s:  1.67, v: -0.16 } }, // #007BA7
          { id: 'dye:CLOTH:sky', label: 'Sky', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  54, s:  0.13, v:  0.18 } }, // #87CEEB
          { id: 'dye:CLOTH:indigo', label: 'Indigo', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h: 132, s:  1.67, v: -0.35 } }, // #4B0082
          { id: 'dye:CLOTH:lapis', label: 'Lapis', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  67, s:  1.02, v: -0.22 } }, // #26619C
          { id: 'dye:CLOTH:turquoise', label: 'Turquoise', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  31, s:  0.90, v:  0.12 } }, // #40E0D0
          { id: 'dye:CLOTH:prussian', label: 'Prussian', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  62, s:  1.67, v: -0.58 } }, // #003153
          { id: 'dye:CLOTH:cornflower', label: 'Cornflower', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  76, s:  0.54, v:  0.19 } }, // #6495ED
          { id: 'dye:CLOTH:steel', label: 'Steel', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  64, s:  0.63, v: -0.10 } }, // #4682B4
          { id: 'dye:CLOTH:aegean', label: 'Aegean', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'blues', color: { h:  68, s:  0.92, v: -0.45 } }, // #1F456E
          // Purples additions
          { id: 'dye:CLOTH:lavender', label: 'Lavender', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 132, s:  0.14, v:  0.10 } }, // #B57EDC
          { id: 'dye:CLOTH:plum', label: 'Plum', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 164, s:  0.37, v: -0.29 } }, // #8E4585
          { id: 'dye:CLOTH:mauve', label: 'Mauve', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 133, s: -0.17, v:  0.28 } }, // #E0B0FF
          { id: 'dye:CLOTH:orchid', label: 'Orchid', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 159, s:  0.30, v:  0.09 } }, // #DA70D6
          { id: 'dye:CLOTH:byzantium', label: 'Byzantium', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 168, s:  0.69, v: -0.44 } }, // #702963
          { id: 'dye:CLOTH:mulberry', label: 'Mulberry', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h:-175, s:  0.65, v: -0.01 } }, // #C54B8C
          { id: 'dye:CLOTH:lilac', label: 'Lilac', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 157, s: -0.49, v:  0.00 } }, // #C8A2C8
          { id: 'dye:CLOTH:grape', label: 'Grape', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h: 129, s:  0.95, v: -0.16 } }, // #6F2DA8
          { id: 'dye:CLOTH:periwinkle', label: 'Periwinkle', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h:  97, s: -0.47, v:  0.28 } }, // #CCCCFF
          { id: 'dye:CLOTH:eggplant', label: 'Eggplant', group: 'cloth', dyeSlot: 'CLOTH', dyeCategory: 'purples', color: { h:-174, s: -0.09, v: -0.51 } }, // #614051

          // ── Rigid fiber — natural plant-fiber tones (used by kasas) ─────────────
          { id: 'mat:rigid_fiber:straw',  label: 'Straw',        group: 'rigid_fiber', color: { h: -97, s: -0.03, v:  0.14 } }, // #E4D191
          { id: 'mat:rigid_fiber:reed',   label: 'Dried Reed',   group: 'rigid_fiber', color: { h:-106, s:  0.38, v: -0.04 } }, // #BF9A5C
          { id: 'mat:rigid_fiber:pale',   label: 'Pale Fiber',   group: 'rigid_fiber', color: { h:-100, s: -0.45, v:  0.06 } }, // #D4C8A8
          { id: 'mat:rigid_fiber:tawny',  label: 'Tawny Reed',   group: 'rigid_fiber', color: { h:-104, s:  0.64, v: -0.22 } }, // #9C7A3C
          { id: 'mat:rigid_fiber:shadow', label: 'Shadow Fiber', group: 'rigid_fiber', color: { h:-115, s: -0.21, v: -0.42 } }, // #736151
          { id: 'mat:rigid_fiber:marsh',  label: 'Marsh Reed',   group: 'rigid_fiber', color: { h: -60, s: -0.16, v: -0.21 } }, // #8B9E6C

          // ── Metal — pre-iron-age metals and alloys ───────────────────────────────
          { id: 'mat:metal:copper',    label: 'Copper',    group: 'metal', color: { h:-114, s:  0.93, v: -0.08 } }, // #B87333
          { id: 'mat:metal:bronze',    label: 'Bronze',    group: 'metal', color: { h:-113, s:  1.02, v:  0.03 } }, // #CD7F32
          { id: 'mat:metal:tin',       label: 'Tin',       group: 'metal', color: { h:   0, s: -1.00, v:  0.08 } }, // #D8D8D8
          { id: 'mat:metal:gold',      label: 'Gold',      group: 'metal', color: { h: -93, s:  1.67, v:  0.27 } }, // #FFD700
          { id: 'mat:metal:silver',    label: 'Silver',    group: 'metal', color: { h:   0, s: -1.00, v: -0.04 } }, // #C0C0C0
          { id: 'mat:metal:electrum',  label: 'Electrum',  group: 'metal', color: { h: -97, s:  0.97, v:  0.06 } }, // #D4AF37

          // ── Wood — natural and exotic timbers (bronzewood = ironwood) ────────────
          { id: 'mat:wood:oak',        label: 'Oak',         group: 'wood', color: { h:-102, s:  0.72, v:  0.06 } }, // #D4A84B
          { id: 'mat:wood:walnut',     label: 'Dark Walnut', group: 'wood', color: { h:-119, s:  1.00, v: -0.54 } }, // #5C3317
          { id: 'mat:wood:cedar',      label: 'Cedar',       group: 'wood', color: { h:-112, s:  1.20, v: -0.02 } }, // #C47722
          { id: 'mat:wood:ebony',      label: 'Ebony',       group: 'wood', color: { h:-116, s:  1.67, v: -0.69 } }, // #3E1C00
          { id: 'mat:wood:bronzewood', label: 'Bronzewood',  group: 'wood', color: { h:-111, s:  0.43, v: -0.20 } }, // #A0784A
          { id: 'mat:wood:birch',      label: 'Birch',       group: 'wood', color: { h:-103, s: -0.51, v:  0.23 } }, // #F5E6C8

          // ── Chitin — insect/crustacean carapace tones ────────────────────────────
          { id: 'mat:chitin:amber',    label: 'Amber',       group: 'chitin', color: { h:-108, s:  1.06, v:  0.06 } }, // #D49030
          { id: 'mat:chitin:horn',     label: 'Horn',        group: 'chitin', color: { h:-105, s:  0.16, v: -0.23 } }, // #9A8257
          { id: 'mat:chitin:dark',     label: 'Dark Chitin', group: 'chitin', color: { h:-119, s:  0.31, v: -0.70 } }, // #3D2B1F
          { id: 'mat:chitin:sandy',    label: 'Sandy',       group: 'chitin', color: { h:-106, s: -0.13, v:  0.03 } }, // #CDB38A
          { id: 'mat:chitin:night',    label: 'Night',       group: 'chitin', color: { h:  90, s: -0.53, v: -0.74 } }, // #2A2B33

          // ── Leather — tanned hide tones ──────────────────────────────────────────
          { id: 'mat:leather:tan',     label: 'Natural Tan',   group: 'leather', color: { h:-109, s: -0.11, v:  0.05 } }, // #D2B48C
          { id: 'mat:leather:saddle',  label: 'Saddle Brown',  group: 'leather', color: { h:-118, s:  1.30, v: -0.31 } }, // #8B4513
          { id: 'mat:leather:chestnut',label: 'Chestnut',      group: 'leather', color: { h:-133, s:  0.72, v: -0.25 } }, // #954535
          { id: 'mat:leather:dark',    label: 'Dark Leather',  group: 'leather', color: { h:-113, s:  0.49, v: -0.62 } }, // #4B3621
          { id: 'mat:leather:cognac',  label: 'Cognac',        group: 'leather', color: { h:-137, s:  0.61, v: -0.23 } }, // #9A463D
          { id: 'mat:leather:cream',   label: 'Cream Leather', group: 'leather', color: { h:-104, s: -0.28, v:  0.23 } }, // #F5DEB3
          { id: 'mat:leather:umber',   label: 'Umber',         group: 'leather', color: { h:-117, s:  0.72, v: -0.56 } }, // #6B4A2F
          { id: 'mat:leather:bark',    label: 'Bark Brown',    group: 'leather', color: { h:-121, s:  0.58, v: -0.64 } }, // #5A3D2B
          { id: 'mat:leather:peat',    label: 'Peat',          group: 'leather', color: { h:-126, s:  0.41, v: -0.72 } }, // #47362C
          { id: 'mat:leather:moss',    label: 'Mossed Hide',   group: 'leather', color: { h:-86,  s:  0.36, v: -0.60 } }, // #4E4A31

          // ── Fur — natural animal-pelt tones ─────────────────────────────────────
          { id: 'mat:fur:snow',     label: 'Snow White',   group: 'fur', color: { h:   0, s: -0.95, v:  0.27 } }, // #FFFAFA
          { id: 'mat:fur:cream',    label: 'Cream',        group: 'fur', color: { h: -95, s: -0.73, v:  0.23 } }, // #F5F0DC
          { id: 'mat:fur:tawny',    label: 'Tawny',        group: 'fur', color: { h:-118, s:  0.80, v:  0.00 } }, // #C87941
          { id: 'mat:fur:russet',   label: 'Russet',       group: 'fur', color: { h:-126, s:  1.06, v: -0.23 } }, // #9B4523
          { id: 'mat:fur:grey',     label: 'Wolf Grey',    group: 'fur', color: { h:   0, s: -1.00, v: -0.36 } }, // #808080
          { id: 'mat:fur:midnight', label: 'Midnight',     group: 'fur', color: { h:   0, s: -1.00, v: -0.86 } }, // #1C1C1C

          // ── Bamboo — cane tones ──────────────────────────────────────────────────
          { id: 'mat:bamboo:green',  label: 'Green Bamboo',  group: 'bamboo', color: { h: -23, s:  0.33, v: -0.39 } }, // #3D7A3D
          { id: 'mat:bamboo:aged',   label: 'Aged Bamboo',   group: 'bamboo', color: { h:-107, s:  0.02, v:  0.06 } }, // #D4B483
          { id: 'mat:bamboo:young',  label: 'Young Bamboo',  group: 'bamboo', color: { h: -55, s:  0.33, v: -0.08 } }, // #8DB85C
          { id: 'mat:bamboo:black',  label: 'Black Bamboo',  group: 'bamboo', color: { h: -68, s: -0.54, v: -0.77 } }, // #2C2E26
          { id: 'mat:bamboo:smoked', label: 'Smoked Bamboo', group: 'bamboo', color: { h:-110, s:  0.04, v: -0.31 } }, // #8B7355
      ],
    },
    "chips": {
      "starting": 30,
      "challengeBaseTransfer": 1,
      "concedeRoundChipLoss": 1,
      "walletDisplay": {
        "tiers": [
          { "id": "sun", "value": 1 },
          { "id": "tinmoon", "value": 5 },
          { "id": "eclipse", "value": 20 }
        ],
        "maxIconsPerSeat": 18
      },
      "poolDisplay": {
        "maxIcons": 28,
        "widthPx": 220,
        "heightPx": 96,
        "coinSizePx": 50,
        "spreadXPx": 84,
        "spreadYPx": 28,
        "offsetXPx": 100,
        "offsetYPx": 2
      },
      "challengeStake": {
        "tiers": [
          { "id": "sun", "value": 1 },
          { "id": "tinmoon", "value": 5 },
          { "id": "eclipse", "value": 20 }
        ],
        "animation": {
          "openMs": 280,
          "callMs": 280,
          "raiseOutMs": 190,
          "raiseInMs": 300
        }
      },
      "transferAnimation": {
        "clusterMoveMs": 140,
        "anteMs": 120,
        "clearPayoutMs": 170,
        "multiAnteSettleDelayMs": 24,
        "easing": "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "coinSizePx": 24,
        "maxIconsPerCluster": 10
      },
      "cards": {
        "transferAnimation": {
          "dealSpeedMultiplier": 2.0
        }
      },
      "clearReward": {
        "base": 1,
        "increment": 1
      },
      "ante": {
        "start": 2,
        "increment": 2
      }
    },
    "timers": {
      "challengeSeconds": 7,
      "challengeIntroMs": 2200,
      "aiThinkMs": 650,
      "aiDecisionDelays": {
        "turnMinMs": 420,
        "turnMaxMs": 1300,
        "challengeMinMs": 360,
        "challengeMaxMs": 2200,
        "bettingMinMs": 200,
        "bettingMaxMs": 650,
        "challengeStaggerMs": 220
      }
    },
    "portrait": {
      "xformPresets": {
        "A": { "ax": -0.2, "ay": 0, "scaleX": 2.55, "scaleY": 2.55, "rotDeg": 0 },
        "B": { "ax": -0.0983, "ay": -0.0809, "scaleX": 2.49, "scaleY": 2.49, "rotDeg": 0 },
        "C": { "ax": 0,       "ay": 0,       "scaleX": 1,    "scaleY": 1,    "rotDeg": 0 },
        "D": { "ax": 0,       "ay": 0,       "scaleX": 1,    "scaleY": 1,    "rotDeg": 0 }
      },
      "cosmetics": {
        "collaredTag": "collared",
        "shirtbeardIds": ["kenk_shirtbeard", "kenk_shirtbeard_f"],
        "collarLockedFacialHairIds": ["kenk_shirtbeard", "kenk_shirtbeard_f"]
      },
      "randomization": {
        "minimumNpcClothingArticles": 1,
        "clothingSlots": ["hat", "hood", "torsoCosmetic", "armCosmetic"],
        "clothingRepairSlotPreference": ["torsoCosmetic", "armCosmetic", "hat", "hood"],
        "clothingOptionPoolsBySlot": {
          "hat": "hatOptions",
          "hood": "hoodOptions",
          "torsoCosmetic": "torsoPortraitOptions",
          "armCosmetic": "armPortraitOptions"
        }
      },
      "blink": {
        "enabled": true,
        "minIntervalMs": 2500,
        "maxIntervalMs": 6000,
        "durationMs": 140,
        "flurryChance": 0.18,
        "flurryCountMin": 1,
        "flurryCountMax": 2,
        "flurryIntervalMs": 280
      }
    },
    "ai": {
      "challengeThreshold": 0.52,
      "challengeRandomNudgeMax": 0.16,
      "bettingConfidenceSuspicionWeight": 0.55
    },
    "layout": {
      "mode": "authored",
      "animation": {
        "baseDurationMs": 160,
        "fadeInSpeed": 3.4,
        "fadeOutSpeed": 3.0,
        "cardCloneLayering": {
          "belowLightingZIndex": 1,
          "aboveLightingZIndex": 9999,
          "sidebarBoundarySelector": "#aiSidebar"
        }
      },
      "viewport": {
        "widthPx": 1920,
        "heightPx": 1080
      },
      "diagnostics": {
        "renderedScreenSpaceParity": {
          "maxAbsDx": 0.5,
          "maxAbsDy": 0.5,
          "maxAbsDw": 0.5,
          "maxAbsDh": 0.5,
          "maxElementMagnitude": 3,
          "maxGroupAverageMagnitude": 2,
          "maxGroupMagnitude": 5,
          "requireTransformMatchFor": ["avatars", "claim avatars"],
          "requireTransformMatchForSelectors": ["avatar-*", "claim-avatar-*", "claim-text-*"],
          "transformMismatchPolicy": "warn"
        }
      },
      "authored": {
        "enabled": true,
        "designWidthPx": 1600,
        "designHeightPx": 900,
        "scaleMode": "contain",
        "boxes": {
          "topbar":         { "x": -2,   "y": 11,  "width": 1123, "height": 106 },
        "sidebar":        { "x": 1354, "y": 14,  "width": 251,  "height": 681 },
          "humanSeat":      { "x": 1260, "y": 701, "width": 373,  "height": 187 },
          "hand":           { "x": 109,  "y": 698, "width": 853,  "height": 144 },
          "log":            { "x": 20,   "y": 850, "width": 1240, "height": 40  },
          "turnSpotlight":  { "x": 1122, "y": 12,  "width": 230,  "height": 200 },
          "claimCluster":   { "x": 187,  "y": 290, "width": 1037, "height": 275 },
          "challengePrompt":{ "x": 960,  "y": 699, "width": 280,  "height": 140 }
        },
        "subOffsets": {
          "betting-left-contribution-anchor": { "dx": 260, "dy": 150 },
          "betting-tier-buttons": { "dx": 8, "dy": 4 },
          "betting-right-contribution-anchor": { "dx": -260, "dy": 150 },
          "betting-choice-anchor": { "dx": -385, "dy": -40 },
          "claim-pool-pile": { "dx": -200, "dy": -100 }
        },
        "subSizes": {
          "betting-right-contribution-anchor": { "width": 92, "height": 114 },
          "betting-left-contribution-anchor": { "width": 92, "height": 114 }
        }
      },
      "cards": {
        "baseScale": 0.75,
        "stationaryScreenSpacePx": {
          "width": 43,
          "height": 82,
          "referenceWidthPx": 86
        },
        "deckPlaceholderPx": {
          "stackWidth": 68,
          "stackHeight": 96,
          "labelGap": 10,
          "referenceCardWidthPx": 58,
          "cards": [
            { "left": 16, "top": 12, "width": 58, "height": 84, "opacity": 0.55, "brightness": 0.82 },
            { "left": 9, "top": 6, "width": 58, "height": 84, "opacity": 0.75, "brightness": 0.9 },
            { "left": 2, "top": 0, "width": 58, "height": 84, "opacity": 1, "brightness": 1 }
          ]
        }
      },
      "sizing": {
        "sidebarWidthFrac": 0.15,
        "sidebarWidthPx": 280,
        "appGapPx": 8,
        "appPaddingPx": 8,
        "seatAvatarPx": 108,
        "humanSeatAvatarPx": 204,
        "cinematicAvatarPx": 132,
        "handCardMinWidthPx": 86,
        "handCardMaxWidthPx": 86,
        "handCardMinHeightPx": 164,
        "handCardMaxHeightPx": 164,
        "handCardGapMinPx": 6,
        "handCardGapMaxPx": 6,
        "eventLogMaxHeightPx": 78,
        "controlsPaddingYpx": 12,
        "controlsPaddingXpx": 12,
        "controlsGapPx": 10,
        "handWrapPaddingYpx": 8,
        "handWrapPaddingXpx": 12,
        "handWrapGapPx": 6,
        "handCardContainerWidthOffsetPx": 4,
        "handCardLabelInsetLeftPx": 2,
        "handCardLabelInsetBottomPx": 2,
        "eventLogPaddingYpx": 8,
        "eventLogPaddingXpx": 12,
        "eventLogGapPx": 6,
        "logItemPaddingYpx": 9,
        "logItemPaddingXpx": 10,
        "seatInfoPaddingYpx": 6,
        "seatInfoPaddingXpx": 8,
        "challengePanePaddingYpx": 8,
        "challengePanePaddingXpx": 10
      },
      "hand": {
        "desiredHeightFrac": 0.2,
        "desiredWidthFrac": 0.5,
        "heightScale": 0.5,
        "minHeightPx": 160,
        "maxHeightPx": 360,
        "visible": true,
        "panel": {
          "background": "transparent",
          "border": "0",
          "outline": "none",
          "shadow": "none"
        },
        "forceAllVisible": true,
        "compact": {
          "enabled": true,
          "cardMinWidthPx": 64,
          "cardGapPx": 6,
          "cardMinHeightPx": 128
        }
      },
      "tableView": {
        "desiredHeightFrac": 0.58,
        "minDominanceFrac": 0.56,
        "minHeightPx": 260,
        "maxHeightPx": 680,
        "cardVisualMode": "faceDown",
        "turnSpotlight": {
          "embedded": true,
          "pinCorner": "top-right",
          "offsetXPx": 10,
          "offsetYPx": 10
        },
        "visualFit": {
          "tableCardContainerScale": 1.25,
          "tableCardContentScale": 1,
          "claimAvatarSizePx": 270,
          "claimAvatarZoomScale": 1.2,
          "claimAvatarBorderRadiusPx": 12,
          "claimAvatarBorderColor": "transparent",
          "claimAvatarBackground": "transparent",
          "claimAvatarFirstNameOffsetPx": 26,
          "claimAvatarFirstNameFontRem": 1.34,
          "avatarAdditiveZoomScale": 1.2,
          "claimAvatarOverlayZIndex": 9990
        },
        "cinematic": {
          "enabled": true,
          "showEffects": true,
          "showAvatars": false,
          "playerInfoOffsetPx": 12,
          "playerInfoFontRem": 1.05,
          "claimTitleOffsetYPx": -150,
          "betControlsOffsetYPx": 150,
          "claimTitleScale": 1.5,
          "betActionBurstFontRem": 2,
          "betActionBurstDurationSec": 2.1,
          "liarBurstFontRem": 3.2,
          "liarBurstDurationSec": 3.2,
          "liarBurstEndYPct": -180,
          "liarBurstOffsetXPx": -232,
          "betActionBurstClampInsetPx": 24,
          "revealDurationMs": 4200,
          "foldDurationMs": 2600
        }
      },
      "regions": {
        "actionFocus": {
          "enabled": false,
          "replaceWithFloatingClaimCluster": true
        },
        "turnSpotlight": {
          "enabled": true,
          "mustStayVisible": true,
          "avatarSizePx": 180,
          "nameBarBelowAvatar": true
        },
        "contextBox": {
          "enabled": true,
          "sharedDeclareAndChallengeSlot": true,
          "mustStayVisible": true
        },
        "log": {
          "enabled": false
        }
      },
      "claimCluster": {
        "enabled": true,
        "anchor": "tableView",
        "scaleAsOne": true,
        "preserveRelativePositions": true,
        "mustStayVisible": true,
        "transparentShells": true,
        "geometry": {
          "centerXPct": 0.5,
          "centerYPct": 0.5,
          "widthPctOfTableView": 1.0,
          "heightPctOfTableView": 1.0
        },
        "elements": {
          "claimRankBox": {
            "xPct": 0.489583,
            "yPct": 0.115385,
            "wPct": 0.0625,
            "hPct": 0.230769
          },
          "claimHandBar": {
            "xPct": 0.5,
            "yPct": 0.538462,
            "wPct": 0.5,
            "hPct": 0.461538
          },
          "actorAvatarFloat": {
            "xPct": 0.0625,
            "yPct": 0.538462,
            "wPct": 0.125,
            "hPct": 0.461538
          },
          "reactorAvatarFloat": {
            "xPct": 0.9375,
            "yPct": 0.538462,
            "wPct": 0.125,
            "hPct": 0.461538
          },
          "claimTimesBoxLeft": {
            "xPct": 0.1875,
            "yPct": 0.538462,
            "wPct": 0.041667,
            "hPct": 0.153846
          },
          "claimCountBoxLeft": {
            "xPct": 0.1875,
            "yPct": 0.846154,
            "wPct": 0.083333,
            "hPct": 0.307692
          },
          "claimTimesBoxRight": {
            "xPct": 0.8125,
            "yPct": 0.538462,
            "wPct": 0.041667,
            "hPct": 0.153846
          },
          "claimCountBoxRight": {
            "xPct": 0.8125,
            "yPct": 0.846154,
            "wPct": 0.083333,
            "hPct": 0.307692
          },
          "cinematicPane": {
            "xPct": 0.5,
            "yPct": 0.66,
            "wPct": 0.5,
            "hPct": 0.28
          }
        }
      },
      "shells": {
        "transparentFloatingBoxes": true,
        "disablePanelChromeForFloatingBoxes": true
      },
      "controlsToHandRelationship": "below",
      "actionColumn": {
        "heightScale": 0.25
      },
      "controls": {
        "heightScale": 0.5
      },
      "betting": {
        "titleOffsetY": "-80%",
        "choiceOffsetY": "115%",
        "leftSlotOffsetX": "260px",
        "leftSlotOffsetY": "150px",
        "rightSlotOffsetX": "-260px",
        "rightSlotOffsetY": "150px",
        "coinButtonSize": "clamp(58px, 8.6vw, 86px)",
        "contributionCoinSize": "clamp(48px, 6.7vw, 72px)",
        "tierGap": "clamp(10px, 2.2vw, 20px)"
      },
      "allowChallengeOverflow": true,
      "background": {
        "tabletopImageSrc": "./docs/assets/hud/tabletop.png"
      },
      "lighting": {
        "flame": {
          "enabled": false,
          "xPct": 0.5,
          "yPct": 0.14,
          "coreAlpha": 0.4,
          "midAlpha": 0.27,
          "farAlpha": 0.14,
          "flickerSeconds": 2.9
        },
        "cardShadow": {
          "offsetXPx": 1.5,
          "offsetYPx": 9,
          "blurPx": 12,
          "spreadPx": -2,
          "alpha": 0.34,
          "contactAlpha": 0.2
        },
        "candlelight": {
          "radiusRefPx": 1200,
          "sources": [
            {
              "xPct": 0.0317708333,
              "yPct": 0.3333333333,
              "intensity": 0.77,
              "radiusMultiplier": 1,
              "flickerSpeed": 4.17,
              "turbulence": 1
            },
            {
              "xPct": 1.18,
              "yPct": 0.3333333333,
              "intensity": 0.77,
              "radiusMultiplier": 1,
              "flickerSpeed": 4.17,
              "turbulence": 1
            }
          ],
          "backlitAlphaDefault": 0.14,
          "thevmenuOpacity": 0.35,
          "thevmenuLayerZIndex": 2147483646,
          "thevmenuOccluderSelectors": ["#aiSidebar", ".humanSeatZone", ".turnSpotlight", ".claimCluster"],
          "backlitBlurDefault": 0,
          "masking": {
            "gatherCadenceMs": 100,
            "debugImmuneMasks": false,
            "textMaskPaddingPx": 1
          },
          "selectorDefaults": {
            "#aiSidebar": { "backlit": false, "immune": false },
            ".humanSeatZone": { "backlit": false, "immune": false },
            ".turnSpotlight": { "backlit": false, "immune": false },
            ".seatAvatarBox": { "backlit": false, "immune": false },
            ".turnSpotlightAvatar": { "backlit": false, "immune": false },
            ".cin-avatar": { "backlit": false, "immune": false },
            ".seatName": { "backlit": false, "immune": false },
            ".seatMeta": { "backlit": false, "immune": false },
            ".seatStatus": { "backlit": false, "immune": false },
            ".turnSpotlightNameBar": { "backlit": false, "immune": false },
            ".cin-name": { "backlit": false, "immune": false },
            "[data-stake-left-contribution-anchor]": { "backlit": false, "immune": false },
            "[data-stake-right-contribution-anchor]": { "backlit": false, "immune": false },
            "[data-stake-betting-choice-anchor]": { "backlit": false, "immune": false },
            ".stakeTierBtnRow": { "backlit": true, "immune": false },
            ".handWrap": { "backlit": false, "immune": false }
          },
          "selectorGroups": {
            "backlit": {
              "container": ["#aiSidebar", ".humanSeatZone", ".turnSpotlight"],
              "avatar": [".seatAvatarBox", ".turnSpotlightAvatar", ".cin-avatar"],
              "text": [".seatName", ".seatMeta", ".seatStatus", ".turnSpotlightNameBar", ".cin-name"],
              "sub": ["[data-stake-left-contribution-anchor]", "[data-stake-right-contribution-anchor]", "[data-stake-betting-choice-anchor]", ".stakeTierBtnRow"]
            },
            "immuneCapable": {
              "container": ["#aiSidebar", ".humanSeatZone", ".turnSpotlight"],
              "avatar": [".seatAvatarBox", ".turnSpotlightAvatar", ".cin-avatar"],
              "text": [".seatName", ".seatMeta", ".seatStatus", ".turnSpotlightNameBar", ".cin-name"],
              "sub": ["[data-stake-left-contribution-anchor]", "[data-stake-right-contribution-anchor]", "[data-stake-betting-choice-anchor]", ".stakeTierBtnRow"]
            }
          },
          "projectionMappings": {
            "sidebar": {
              "container": ["#aiSidebar"],
              "avatar": ["#aiSidebar .seatAvatarBox"],
              "text": ["#aiSidebar .seatName", "#aiSidebar .seatMeta", "#aiSidebar .seatStatus"]
            },
            "human-seat-zone": {
              "container": [".humanSeatZone"],
              "avatar": [".humanSeatZone .seatAvatarBox"],
              "text": [".humanSeatZone .seatName", ".humanSeatZone .seatMeta", ".humanSeatZone .seatStatus"]
            },
            "turn-spotlight": {
              "container": [".turnSpotlight"],
              "avatar": [".turnSpotlightAvatar"],
              "text": [".turnSpotlightNameBar", ".cin-name"]
            },
            "betting-left-contribution-anchor": {
              "sub": ["[data-stake-left-contribution-anchor]"]
            },
            "betting-right-contribution-anchor": {
              "sub": ["[data-stake-right-contribution-anchor]"]
            },
            "betting-choice-anchor": {
              "sub": ["[data-stake-betting-choice-anchor]"]
            },
            "betting-tier-buttons": {
              "sub": [".stakeTierBtnRow"]
            },
            "avatar-*": {
              "sub": ["[data-proj-id=\"{projId}\"]"]
            }
          },
          "targets": {
            "backlit": {
              "container": ["#aiSidebar", ".humanSeatZone", ".turnSpotlight"],
              "avatar": [".seatAvatarBox", ".turnSpotlightAvatar", ".cin-avatar"],
              "text": [".seatName", ".seatMeta", ".seatStatus", ".turnSpotlightNameBar", ".cin-name"],
              "sub": ["[data-stake-left-contribution-anchor]", "[data-stake-right-contribution-anchor]", "[data-stake-betting-choice-anchor]", ".stakeTierBtnRow"]
            },
            "immuneCapable": {
              "container": ["#aiSidebar", ".humanSeatZone", ".turnSpotlight"],
              "avatar": [".seatAvatarBox", ".turnSpotlightAvatar", ".cin-avatar"],
              "text": [".seatName", ".seatMeta", ".seatStatus", ".turnSpotlightNameBar", ".cin-name"],
              "sub": ["[data-stake-left-contribution-anchor]", "[data-stake-right-contribution-anchor]", "[data-stake-betting-choice-anchor]", ".stakeTierBtnRow"]
            }
          },
          "projectionRoles": {
            "sidebar": {
              "container": ["#aiSidebar"],
              "avatar": ["#aiSidebar .seatAvatarBox"],
              "text": ["#aiSidebar .seatName", "#aiSidebar .seatMeta", "#aiSidebar .seatStatus"]
            },
            "human-seat-zone": {
              "container": [".humanSeatZone"],
              "avatar": [".humanSeatZone .seatAvatarBox"],
              "text": [".humanSeatZone .seatName", ".humanSeatZone .seatMeta", ".humanSeatZone .seatStatus"]
            },
            "turn-spotlight": {
              "container": [".turnSpotlight"],
              "avatar": [".turnSpotlightAvatar"],
              "text": [".turnSpotlightNameBar", ".cin-name"]
            },
            "betting-left-contribution-anchor": {
              "sub": ["[data-stake-left-contribution-anchor]"]
            },
            "betting-right-contribution-anchor": {
              "sub": ["[data-stake-right-contribution-anchor]"]
            },
            "betting-choice-anchor": {
              "sub": ["[data-stake-betting-choice-anchor]"]
            },
            "betting-tier-buttons": {
              "sub": [".stakeTierBtnRow"]
            },
            "avatar-*": {
              "sub": ["[data-proj-id=\"{projId}\"]"]
            }
          }
        }
      },
      "layerManager": {
        "enabled": true,
        "hostZIndex": 45,
        "defaultPreserveSpace": true,
        "normalizePromotedElementBox": true,
        "preservePromotionTransformSelectors": [
          ".seatAvatarBox",
          ".turnSpotlightAvatar",
          ".cin-avatar",
          ".claimClusterTextAnchor",
          ".claimAvatarNameTag",
          ".claimAvatarCinRole",
          ".claimAvatarCinName",
          ".claimAvatarCinTags"
        ],
        "disablePreservePromotionTransformSelectors": [],
        "normalizeBoxGuard": {
          "allowlistSelectors": [
            "*"
          ],
          "denylistSelectors": [
            ".challengePromptInfo",
            ".cin-name",
            ".cin-action-burst",
            ".claimAvatarNameTag",
            ".claimAvatarCinRole",
            ".claimAvatarCinName",
            ".claimAvatarCinTags",
            ".seatName",
            ".seatMeta",
            ".seatStatus",
            ".turnSpotlightNameBar",
            ".cin-result-copy",
            ".cinematic-vs-line",
            ".actorAvatarFloat",
            ".reactorAvatarFloat"
          ],
          "marginReset": {
            "allowlistSelectors": [
              "*"
            ],
            "denylistSelectors": [
              ".challengePromptInfo",
              ".cin-name",
              ".cin-action-burst",
              ".claimAvatarNameTag",
              ".claimAvatarCinRole",
              ".claimAvatarCinName",
              ".claimAvatarCinTags",
              ".seatName",
              ".seatMeta",
              ".seatStatus",
              ".turnSpotlightNameBar",
              ".cin-result-copy",
              ".cinematic-vs-line",
              ".actorAvatarFloat",
              ".reactorAvatarFloat"
            ]
          },
          "fillSize": {
            "allowlistSelectors": [
              "*"
            ],
            "denylistSelectors": [
              ".challengePromptInfo",
              ".cin-name",
              ".cin-action-burst",
              ".claimAvatarNameTag",
              ".claimAvatarCinRole",
              ".claimAvatarCinName",
              ".claimAvatarCinTags",
              ".seatName",
              ".seatMeta",
              ".seatStatus",
              ".turnSpotlightNameBar",
              ".cin-result-copy",
              ".cinematic-vs-line",
              ".actorAvatarFloat",
              ".reactorAvatarFloat"
            ]
          }
        },
        "placementMode": "screen-space",
        "screenSpaceUseFixed": true,
        "screenSpaceRoundToPixels": false,
        "promoteByRootSelectors": [
          "#aiSidebar",
          ".humanSeatZone",
          ".claimCluster",
          ".stakeVisualPanel",
          ".challengePromptPane"
        ],
        "excludeDescendantSelectors": [
          ".seatName",
          ".seatMeta",
          ".seatStatus",
          ".seatAvatarBox",
          ".claimAvatarNameTag",
          ".claimAvatarCinRole",
          ".claimAvatarCinName",
          ".claimAvatarCinTags"
        ],
        "layerOrder": [
          "above-lighting-shell",
          "above-lighting-content"
        ],
        "assignments": [
          {
            "id": "ui-text-over-lighting",
            "layer": "above-lighting-content",
            "selectors": [
              ".seatName",
              ".seatMeta",
              ".seatStatus",
              ".turnSpotlightNameBar",
              ".cin-name",
              ".cin-action-burst",
              ".tiny",
              ".sectionTitle",
              ".chip",
              ".logItem",
              ".challengePromptInfo",
              ".stakeVisualHeader",
              ".stakeSlotLabel",
              ".stakeSlotValue",
              ".bettingStatusTitle",
              ".bettingStatusLine",
              ".claimAvatarNameTag",
              ".claimAvatarCinRole",
              ".claimAvatarCinName",
              ".claimAvatarCinTags",
              ".cinematic-vs-line",
              ".cin-result-copy"
            ],
            "preserveSpace": true
          },
          {
            "id": "ui-avatars-over-lighting",
            "layer": "above-lighting-content",
            "selectors": [".seatAvatarBox", ".turnSpotlightAvatar", ".cin-avatar"],
            "preserveSpace": true,
            "keepOriginal": true,
            "promotedOpacity": 0.72
          },
          {
            "id": "ui-shell-over-lighting",
            "layer": "above-lighting-shell",
            "selectors": [],
            "preserveSpace": true
          }
        ]
      },
      "fitter": {
        "enabled": true,
        "reflowDebounceMs": 90,
        "overflowTolerancePx": 1,
        "minReadableFontScale": 0.72,
        "stages": [
          {
            "fontScale": 0.96,
            "imageScale": 0.95,
            "gapScale": 0.94
          },
          {
            "fontScale": 0.92,
            "imageScale": 0.9,
            "gapScale": 0.88
          },
          {
            "fontScale": 0.88,
            "imageScale": 0.86,
            "gapScale": 0.82
          },
          {
            "fontScale": 0.84,
            "imageScale": 0.82,
            "gapScale": 0.76
          },
          {
            "fontScale": 0.8,
            "imageScale": 0.78,
            "gapScale": 0.7
          },
          {
            "fontScale": 0.76,
            "imageScale": 0.74,
            "gapScale": 0.64
          }
        ],
        "targets": {
          "tableView": {
            "selector": ".tableView",
            "containmentSelector": ".tableViewCards",
            "maxStage": 4,
            "minReadableFontScale": 0.8
          },
          "actionFocus": {
            "selector": ".actionFocus",
            "containmentSelector": ".actionFocusMain",
            "maxStage": 6,
            "minReadableFontScale": 0.72
          },
          "actionColumn": {
            "selector": ".actionColumn",
            "maxStage": 4,
            "minReadableFontScale": 0.76
          },
          "contextBox": {
            "selector": ".contextBox",
            "maxStage": 5,
            "minReadableFontScale": 0.74
          },
          "turnSpotlight": {
            "selector": ".turnSpotlight",
            "maxStage": 5,
            "minReadableFontScale": 0.74
          },
          "claimCluster": {
            "selector": ".claimCluster",
            "maxStage": 4,
            "minReadableFontScale": 0.72
          },
          "sidebarSeats": {
            "selector": "#aiSidebar",
            "maxStage": 6,
            "minReadableFontScale": 0.72
          },
          "handCards": {
            "selector": ".handWrap",
            "containmentSelector": ".handScroll",
            "maxStage": 6,
            "minReadableFontScale": 0.76
          },
          "logs": {
            "selector": ".eventLog",
            "maxStage": 4,
            "minReadableFontScale": 0.78
          },
          "controls": {
            "selector": ".controls",
            "maxStage": 6,
            "minReadableFontScale": 0.78
          }
        },
        "overlap": {
          "enabled": true,
          "tolerancePx": 0,
          "criticalRegions": {
            "tableView": ".tableView",
            "controls": ".controls",
            "hand": ".handWrap",
            "actionColumn": ".actionColumn",
            "contextBox": ".contextBox",
            "log": ".eventLog",
            "sidebar": "#aiSidebar",
            "turnSpotlight": ".turnSpotlight",
            "claimCluster": ".claimCluster",
            "challenge": "#challengePromptPane"
          },
          "collapseOrder": [],
          "preserveRegions": [
            "tableView",
            "controls",
            "sidebar",
            "turnSpotlight",
            "claimCluster",
            "contextBox"
          ],
          "minContainerScale": 0.7,
          "containerScaleStep": 0.02
        }
      },
      "projectionMapping": {
        "editor": {
          "step": 0.01,
          "panelTitle": "Projection Vars",
          "transformsExportButtonLabel": "Toggle + Export Screen Space",
          "transformsExportButtonTitle": "Toggle preview mode, then copy literal screen-space rectangles and transforms for the active mode.",
          "sliderClamp": {
            "multiplierMin": 0,
            "multiplierMax": 5,
            "absoluteMin": -2000,
            "absoluteMax": 2000
          },
          "multiplierVarHints": [
            "scale",
            "frac",
            "ratio",
            "multiplier"
          ],
          "sizePositionVarHints": [
            "width",
            "height",
            "size",
            "scale",
            "gap",
            "padding",
            "min",
            "max",
            "offset",
            "top",
            "right",
            "bottom",
            "left",
            "x",
            "y",
            "row",
            "column",
            "frac",
            "avatar",
            "card"
          ]
        },
        "sharedVars": [
          "--layout-challenge-font-scale",
          "--layout-challenge-image-scale",
          "--layout-challenge-gap-scale",
          "--layout-fit-font-scale",
          "--layout-fit-image-scale",
          "--layout-fit-gap-scale"
        ],
        "varsByProjId": {
          "topbar": [
            "--layout-app-gap",
            "--layout-app-padding"
          ],
          "sidebar": [
            "--layout-sidebar-width",
            "--layout-sidebar-content-scale",
            "--layout-seat-avatar-size"
          ],
          "seat-*": [
            "--layout-seat-avatar-size",
            "--layout-sidebar-content-scale"
          ],
          "avatar-*": [
            "--layout-seat-avatar-size",
            "--layout-human-seat-avatar-size",
            "--layout-cinematic-avatar-size"
          ],
          "human-seat-zone": [
            "--layout-human-seat-avatar-size"
          ],
          "human-seat": [
            "--layout-human-seat-avatar-size",
            "--layout-sidebar-content-scale"
          ],
          "panel": [
            "--layout-table-dominance-frac",
            "--layout-table-view-height",
            "--layout-table-view-min-height",
            "--layout-table-view-max-height"
          ],
          "table-view": [
            "--layout-table-view-height",
            "--layout-table-view-min-height",
            "--layout-table-view-max-height",
            "--layout-card-base-scale",
            "--layout-card-scale",
            "--layout-card-table-base-width",
            "--layout-card-table-base-height",
            "--layout-card-mini-base-width",
            "--layout-card-mini-base-height",
            "--layout-table-card-auto-scale",
            "--layout-fit-additive-avatar-zoom"
          ],
          "claim-cluster": [
            "--layout-claim-cluster-center-x",
            "--layout-claim-cluster-center-y",
            "--layout-claim-cluster-width",
            "--layout-claim-cluster-height",
            "--layout-claim-avatar-size",
            "--layout-claim-avatar-zoom",
            "--layout-claim-avatar-border-radius",
            "--layout-claim-avatar-border-color",
            "--layout-claim-avatar-background"
          ],
          "claim-avatar-*": [
            "--layout-claim-avatar-size",
            "--layout-claim-avatar-zoom",
            "--layout-claim-avatar-border-radius",
            "--layout-claim-avatar-border-color",
            "--layout-claim-avatar-background"
          ],
          "claim-hand-bar": [
            "--layout-card-mini-base-width",
            "--layout-card-mini-base-height",
            "--layout-card-scale"
          ],
          "claim-rank-box": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "claim-count-left": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "claim-times-left": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "claim-count-right": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "claim-times-right": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "cinematic": [
            "--layout-cinematic-avatar-size"
          ],
          "action-column": [
            "--layout-action-column-height-scale",
            "--layout-action-column-max-height"
          ],
          "controls": [
            "--layout-controls-height-scale",
            "--layout-controls-max-height",
            "--layout-controls-padding-y",
            "--layout-controls-padding-x",
            "--layout-controls-gap"
          ],
          "challenge-prompt": [
            "--layout-challenge-font-scale",
            "--layout-challenge-image-scale",
            "--layout-challenge-gap-scale",
            "--layout-controls-height-scale",
            "--layout-controls-max-height",
            "--layout-controls-padding-y",
            "--layout-controls-padding-x",
            "--layout-controls-gap"
          ],
          "betting-status-anchor": [
            "--layout-betting-title-offset-y"
          ],
          "betting-status-title": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "betting-status-line": [
            "--layout-challenge-font-scale",
            "--layout-fit-font-scale"
          ],
          "betting-left-contribution-anchor": [
            "--layout-betting-left-slot-offset-x",
            "--layout-betting-left-slot-offset-y",
            "--layout-betting-contribution-coin-size"
          ],
          "betting-right-contribution-anchor": [
            "--layout-betting-right-slot-offset-x",
            "--layout-betting-right-slot-offset-y",
            "--layout-betting-contribution-coin-size"
          ],
          "betting-choice-anchor": [
            "--layout-betting-choice-offset-y"
          ],
          "betting-tier-buttons": [
            "--layout-betting-coin-button-size",
            "--layout-betting-tier-gap"
          ],
          "hand": [
            "--hand-height-frac",
            "--layout-hand-height-scale",
            "--layout-hand-min-height",
            "--layout-hand-max-height",
            "--layout-hand-max-row-height",
            "--layout-hand-card-min-width",
            "--layout-hand-card-max-width",
            "--layout-hand-card-min-height",
            "--layout-hand-card-max-height",
            "--layout-hand-card-gap-min",
            "--layout-hand-card-gap-max",
            "--layout-hand-wrap-padding-y",
            "--layout-hand-wrap-padding-x",
            "--layout-hand-wrap-gap",
            "--layout-hand-panel-background",
            "--layout-hand-panel-border",
            "--layout-hand-panel-outline",
            "--layout-hand-panel-shadow",
            "--layout-card-base-scale",
            "--layout-card-hand-scale",
            "--layout-card-scale",
            "--layout-card-hit-min-width",
            "--layout-card-hit-min-height",
            "--layout-card-label-font-base",
            "--layout-card-label-gap-base",
            "--layout-card-label-padding-y-base",
            "--layout-card-label-padding-x-base",
            "--layout-card-label-offset-base",
            "--layout-card-label-radius-base"
          ],
          "log": [
            "--layout-event-log-max-height",
            "--layout-event-log-padding-y",
            "--layout-event-log-padding-x",
            "--layout-event-log-gap",
            "--layout-log-item-padding-y",
            "--layout-log-item-padding-x",
            "--layout-log-max-row-height"
          ]
        },
        "selectorVarsByProjId": {
          "table-view": {
            ".tableViewCard, .tableViewCard img": [
              "--layout-card-base-scale",
              "--layout-card-scale",
              "--layout-card-table-base-width",
              "--layout-card-table-base-height"
            ],
            ".claimHandBar, .claimHandBar .tableViewCard, .claimHandBar .tableViewCard img": [
              "--layout-card-mini-base-width",
              "--layout-card-mini-base-height",
              "--layout-card-scale"
            ],
            ".actorAvatarFloat, .reactorAvatarFloat, .actorAvatarFloat canvas, .reactorAvatarFloat canvas, .seatPortrait": [
              "--layout-seat-avatar-size",
              "--layout-human-seat-avatar-size",
              "--layout-cinematic-avatar-size",
              "--layout-sidebar-content-scale"
            ],
            ".claimRankBox, .claimCountBoxLeft, .claimCountBoxRight, .turnSpotlightNameBar": [
              "--layout-challenge-font-scale",
              "--layout-fit-font-scale"
            ]
          },
          "sidebar": {
            ".seatAvatarBox, .seatPortrait": [
              "--layout-seat-avatar-size",
              "--layout-sidebar-content-scale"
            ],
            ".seatName, .seatMeta, .seatStatus, .seatSeed, .seatTags": [
              "--layout-sidebar-content-scale"
            ]
          },
          "seat-*": {
            ".seatAvatarBox, .seatPortrait": [
              "--layout-seat-avatar-size",
              "--layout-sidebar-content-scale"
            ],
            ".seatName, .seatMeta, .seatStatus, .seatSeed, .seatTags": [
              "--layout-sidebar-content-scale"
            ]
          },
          "human-seat": {
            ".seatAvatarBox, .seatPortrait": [
              "--layout-human-seat-avatar-size"
            ],
            ".seatName, .seatMeta, .seatStatus, .humanSeatChipBadge": [
              "--layout-sidebar-content-scale"
            ]
          },
          "hand": {
            ".card, .cardArt": [
              "--layout-card-base-scale",
              "--layout-card-hand-scale",
              "--layout-card-scale",
              "--layout-hand-card-min-width",
              "--layout-hand-card-max-width",
              "--layout-hand-card-min-height",
              "--layout-hand-card-max-height",
              "--layout-card-hit-min-width",
              "--layout-card-hit-min-height"
            ],
            ".cardLabel, .cardGlyph, .cardText": [
              "--layout-card-label-font-base",
              "--layout-card-label-gap-base",
              "--layout-card-label-padding-y-base",
              "--layout-card-label-padding-x-base",
              "--layout-card-label-offset-base",
              "--layout-card-label-radius-base",
              "--layout-card-scale"
            ],
            ".handScroll": [
              "--layout-hand-card-gap-min",
              "--layout-hand-card-gap-max"
            ]
          }
        },
        "fallbackVars": [
          "--layout-app-gap",
          "--layout-app-padding",
          "--layout-sidebar-width",
          "--layout-sidebar-content-scale",
          "--layout-table-view-height",
          "--layout-table-view-min-height",
          "--layout-table-view-max-height",
          "--layout-table-dominance-frac",
          "--layout-action-column-height-scale",
          "--layout-action-column-max-height",
          "--layout-controls-height-scale",
          "--layout-controls-max-height",
          "--layout-hand-height-scale",
          "--layout-card-base-scale",
          "--layout-card-hand-scale",
          "--layout-hand-min-height",
          "--layout-hand-max-height",
          "--layout-hand-card-min-width",
          "--layout-hand-card-max-width",
          "--layout-hand-card-min-height",
          "--layout-hand-card-max-height",
          "--layout-hand-wrap-padding-y",
          "--layout-hand-wrap-padding-x",
          "--layout-hand-wrap-gap",
          "--layout-event-log-max-height",
          "--layout-log-max-row-height"
        ]
      }
    },
    "cssRootVars": {
      "--bg": "#15110f",
      "--bg2": "#221917",
      "--panel": "rgba(46, 34, 30, 0.95)",
      "--panel-soft": "rgba(67, 49, 43, 0.9)",
      "--accent": "#c89952",
      "--accent-2": "#f2d08f",
      "--danger": "#c85a5a",
      "--ok": "#66b17c",
      "--text": "#f4e8d0",
      "--muted": "#cdbb9f",
      "--card": "#f8f1df",
      "--card-text": "#32231d",
      "--wild": "#f1d347",
      "--shadow": "0 10px 24px rgba(0,0,0,0.28)",
      "--radius": "18px",
      "--layout-viewport-width": "1920px",
      "--layout-viewport-height": "1080px",
      "--layout-hand-min-height": "160px",
      "--layout-hand-max-height": "360px",
      "--layout-sidebar-width": "280px",
      "--layout-app-gap": "8px",
      "--layout-app-padding": "8px",
      "--layout-seat-avatar-size": "132px",
      "--layout-human-seat-avatar-size": "204px",
      "--layout-cinematic-avatar-size": "132px",
      "--layout-hand-card-min-width": "86px",
      "--layout-hand-card-max-width": "86px",
      "--layout-hand-card-min-height": "164px",
      "--layout-hand-card-max-height": "164px",
      "--layout-hand-card-gap-min": "6px",
      "--layout-hand-card-gap-max": "6px",
      "--layout-event-log-max-height": "78px",
      "--layout-controls-padding-y": "12px",
      "--layout-controls-padding-x": "12px",
      "--layout-controls-gap": "10px",
      "--layout-hand-wrap-padding-y": "8px",
      "--layout-hand-wrap-padding-x": "12px",
      "--layout-hand-wrap-gap": "6px",
      "--layout-hand-card-shell-width-offset": "4px",
      "--layout-hand-card-label-inset-left": "2px",
      "--layout-hand-card-label-inset-bottom": "2px",
      "--layout-hand-panel-background": "transparent",
      "--layout-hand-panel-border": "0",
      "--layout-hand-panel-outline": "none",
      "--layout-hand-panel-shadow": "none",
      "--layout-event-log-padding-y": "8px",
      "--layout-event-log-padding-x": "12px",
      "--layout-event-log-gap": "6px",
      "--layout-log-item-padding-y": "9px",
      "--layout-log-item-padding-x": "10px",
      "--layout-seat-info-padding-y": "8px",
      "--layout-seat-info-padding-x": "10px",
      "--layout-challenge-pane-padding-y": "8px",
      "--layout-challenge-pane-padding-x": "10px",
      "--layout-table-view-min-height": "260px",
      "--layout-table-view-max-height": "680px",
      "--layout-table-dominance-frac": "0.56",
      "--layout-turn-spotlight-avatar-size": "180px",
      "--layout-claim-cluster-center-x": "0.5",
      "--layout-claim-cluster-center-y": "0.54",
      "--layout-claim-cluster-width": "78",
      "--layout-claim-cluster-height": "48",
      "--layout-table-card-container-scale": "1.25",
      "--layout-table-card-content-scale": "0.8",
      "--layout-claim-avatar-size": "270px",
      "--layout-claim-avatar-zoom": "1.2",
      "--layout-claim-avatar-border-radius": "12px",
      "--layout-claim-avatar-border-color": "rgba(242,208,143,0.28)",
      "--layout-claim-avatar-background": "rgba(22,16,14,0.72)",
      "--layout-claim-title-offset-y": "-150px",
      "--layout-claim-bet-controls-offset-y": "150px",
      "--layout-claim-title-scale": "1.5",
      "--layout-betting-title-offset-y": "-80%",
      "--layout-betting-choice-offset-y": "115%",
      "--layout-betting-left-slot-offset-x": "260px",
      "--layout-betting-left-slot-offset-y": "150px",
      "--layout-betting-right-slot-offset-x": "-260px",
      "--layout-betting-right-slot-offset-y": "150px",
      "--layout-betting-coin-button-size": "clamp(58px, 8.6vw, 86px)",
      "--layout-betting-contribution-coin-size": "clamp(48px, 6.7vw, 72px)",
      "--layout-betting-tier-gap": "clamp(10px, 2.2vw, 20px)",
      "--layout-turn-spotlight-offset-x": "10px",
      "--layout-turn-spotlight-offset-y": "10px",
      "--layout-cinematic-player-info-offset": "12px",
      "--layout-cinematic-player-info-font": "1.05rem",
      "--layout-cinematic-burst-font": "2rem",
      "--layout-cinematic-burst-duration": "2.1s",
      "--layout-liar-burst-font": "3.2rem",
      "--layout-liar-burst-duration": "3.2s",
      "--layout-liar-burst-end-y": "-180%",
      "--layout-flame-x": "50%",
      "--layout-flame-y": "14%",
      "--layout-flame-core-alpha": "0.4",
      "--layout-flame-mid-alpha": "0.27",
      "--layout-flame-far-alpha": "0.14",
      "--layout-flame-flicker-seconds": "2.9s",
      "--layout-flame-enabled": "1",
      "--layout-card-shadow-offset-x": "1.5px",
      "--layout-card-shadow-offset-y": "9px",
      "--layout-card-shadow-blur": "12px",
      "--layout-card-shadow-spread": "-2px",
      "--layout-card-shadow-alpha": "0.34",
      "--layout-card-contact-alpha": "0.2"
    },
    "uiText": {
      "initialBanner": "Open a round by selecting one or more cards, then declare a number.",
      "yourLeadBanner": "Your lead. Select cards and declare any number.",
      "pickCardWarning": "Pick at least one card before playing.",
      "challengeTimerLabel": "Auto: let it stand",
      "challengePromptTemplate": "{seat} declared {count} × {rank}. Challenge before the timer runs out, or let it stand.",
      "challengeBurstText": "LIAR!!!",
      "letStandButton": "Let it stand",
      "tableLocation": "Wandering Moon Underclub --- Kumapirra,  Yama Riverlands, Tanka"
    },
    "assets": {
      "cards": {
        "preload": {
          "enabled": true
        },
        "hudBasePath": "./docs/assets/hud/",
        "wild": {
          "src": "2DScratchBoneWild.png",
          "fallbackSrc": "2DScratchBoneWild.png"
        },
        "flipped": {
          "src": "2DScratchboneFlipped.png",
          "fallbackSrc": "2DScratchBoneFlipped.png"
        },
        "rankTemplate": {
          "src": "2DScratchbone{rank}.png",
          "fallbackSrc": "2DScratchbones{rank}.png"
        }
      },
      "symbols": {
        "claimRankGlyphTemplateSrc": "./docs/assets/symbols/boneglyph{rank}.png",
        "claimMultiplyGlyphSrc": "./docs/assets/symbols/multglyph.png"
      },
      "hud": {
        "cinematicTokenIconSrc": "./docs/assets/hud/coin_tinmoon.png",
        "coinFallbackTierId": "tinmoon",
        "claimClusterFontFamily": "\"KhymeryyanRomanLetters+Numbers\", serif",
        "claimClusterFontSrc": "./docs/assets/hud/KhymeryyanRomanLetters+Numbers.otf.ttf",
        "claimMultiplyGlyphScale": 0.5,
        "claimMultiplyGlyphInvert": true,
        "stakeTierCoinSrc": {
          "sun": "./docs/assets/hud/coin_sun.png",
          "tinmoon": "./docs/assets/hud/coin_tinmoon.png",
          "eclipse": "./docs/assets/hud/coin_eclipse.png"
        }
      },
      "audio": {
        "enabled": true,
        "sfxVolume": 0.92,
        "bgmVolume": 0.48,
        "musicFadeMs": 280,
        "movement": {
          "handToTable": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 1.0, "tempo": 1.0, "volume": 0.95 },
          "tableToClaim": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 1.08, "tempo": 1.0, "volume": 0.9 },
          "claimToHand": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 0.92, "tempo": 0.98, "volume": 0.94 },
          "opponentToTable": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 0.88, "tempo": 0.94, "volume": 0.9 },
          "fadeIn": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 1.0, "tempo": 1.02, "volume": 0.78 },
          "lerpComplete": {
            "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a",
            "pitch": 1.0,
            "tempo": 1.0,
            "volume": 0.9,
            "leadMs": 120,
            "extraCardDelayMs": 12
          }
        },
        "challenge": {
          "start": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 1.0, "tempo": 1.0, "volume": 1.0 },
          "liarBurst": { "url": "./docs/assets/audio/sfx/challenge/liarburst.mp3", "pitch": 1.0, "tempo": 1.0, "volume": 1.0 },
          "end": { "url": "./docs/assets/audio/sfx/tablesounds/boneclack1.m4a", "pitch": 1.0, "tempo": 1.0, "volume": 1.0 }
        },
        "payoutBurst": {
          "enabled": true,
          "jingles": [
            "./docs/assets/audio/sfx/tablesounds/coinjingle1.mp3",
            "./docs/assets/audio/sfx/tablesounds/coinjingle2.mp3",
            "./docs/assets/audio/sfx/tablesounds/coinjingle3.mp3"
          ],
          "spacingMinMs": 30,
          "spacingMaxMs": 70,
          "pitchCountMode": "preIncrement"
        },
        "bgm": {
          "playlist": [
            "./docs/assets/audio/bgm/tankan_nocturne.mp3"
          ],
          "challenge": "./docs/assets/audio/bgm/challengeloop_placeholder.m4a"
        }
      },
      "portrait": {
        "assetBase": "./docs/assets/",
        "configBase": "./docs/config/"
      }
    }
  }
};

// Future Scratchbones-authored UI modes live under SCRATCHBONES_CONFIG.game.layout.
window.SCRATCHBONES_CONFIG.game.layout.mode = window.SCRATCHBONES_CONFIG.game.layout.mode || 'responsive';
window.SCRATCHBONES_CONFIG.game.layout.authored = window.SCRATCHBONES_CONFIG.game.layout.authored || {};
window.SCRATCHBONES_CONFIG.game.layout.fitter = window.SCRATCHBONES_CONFIG.game.layout.fitter || {};

// Most recent config-boundary cleanup: this file is now the authoritative Scratchbones-only config source.
