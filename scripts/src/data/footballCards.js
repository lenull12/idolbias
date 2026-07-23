"use strict";
/**
 * SOURCE OF TRUTH — Football Card Game
 *
 * This file defines every character, card print, pack, and drop rate
 * for the football card collection. Seeded directly into the DB.
 *
 * ── Never import from @/components/CardEffects or @/db/footballSchema here ──
 * All types are local so this file stays portable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACK_MAP = exports.DEFAULT_DROP_RATES = exports.CARD_PRINTS = exports.CHARACTERS = void 0;
exports.getPackInfo = getPackInfo;
exports.getPackDropRates = getPackDropRates;
exports.getAllPacks = getAllPacks;
exports.getPackCodes = getPackCodes;
exports.getCharacters = getCharacters;
exports.getCharacterById = getCharacterById;
exports.getPrintsByCharacter = getPrintsByCharacter;
exports.getPrintsByPack = getPrintsByPack;
exports.rarityFromReference = rarityFromReference;
exports.parseReference = parseReference;
// ─── Nation → ISO prefix for refCodes ───────────────────────────────────────
var NATION_PREFIX = {
    france: "FR",
    allemagne: "DE",
    angleterre: "GB",
    italie: "IT",
    espagne: "ES",
    bresil: "BR",
    japon: "JP",
    argentine: "AR",
};
var RARITY_SUFFIX = {
    common: "C",
    rare: "R",
    epic: "E",
    legendary: "L",
    secret: "S",
};
var RARITY_FROM_SUFFIX = {
    C: "common",
    R: "rare",
    E: "epic",
    L: "legendary",
    S: "secret",
};
// ─── Characters ──────────────────────────────────────────────────────────────
exports.CHARACTERS = [
    {
        id: "greta-hoffman",
        name: "Greta Hoffman",
        nation: "allemagne",
        defaultStyle: "vista",
        defaultPosition: "MIL",
        isCaptain: true,
        photoVariants: {
            standard: "/cards/football/greta-hoffman/standard.png",
            field: "/cards/football/greta-hoffman/field.png",
            signature: "/cards/football/greta-hoffman/signature.png",
        },
    },
    {
        id: "lea-dubois",
        name: "L\u00e9a Dubois",
        nation: "france",
        defaultStyle: "elevation",
        defaultPosition: "ATT",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/lea-dubois/standard.png",
            field: "/cards/football/lea-dubois/field.png",
        },
    },
    {
        id: "aiko-tanaka",
        name: "Aiko Tanaka",
        nation: "japon",
        defaultStyle: "sangFroid",
        defaultPosition: "MIL",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/aiko-tanaka/standard.png",
            field: "/cards/football/aiko-tanaka/field.png",
            signature: "/cards/football/aiko-tanaka/signature.png",
        },
    },
    {
        id: "sofia-alves",
        name: "Sofia Alves",
        nation: "bresil",
        defaultStyle: "percussion",
        defaultPosition: "ATT",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/sofia-alves/standard.png",
            field: "/cards/football/sofia-alves/field.png",
        },
    },
    {
        id: "clara-muller",
        name: "Clara M\u00fcller",
        nation: "allemagne",
        defaultStyle: "pressing",
        defaultPosition: "DEF",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/clara-muller/standard.png",
            field: "/cards/football/clara-muller/field.png",
            signature: "/cards/football/clara-muller/signature.png",
        },
    },
    {
        id: "emma-williams",
        name: "Emma Williams",
        nation: "angleterre",
        defaultStyle: "vista",
        defaultPosition: "MIL",
        isCaptain: true,
        photoVariants: {
            standard: "/cards/football/emma-williams/standard.png",
            field: "/cards/football/emma-williams/field.png",
        },
    },
    {
        id: "isabella-rossi",
        name: "Isabella Rossi",
        nation: "italie",
        defaultStyle: "sangFroid",
        defaultPosition: "DEF",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/isabella-rossi/standard.png",
            field: "/cards/football/isabella-rossi/field.png",
            signature: "/cards/football/isabella-rossi/signature.png",
        },
    },
    {
        id: "lucia-fernandez",
        name: "Lucia Fern\u00e1ndez",
        nation: "espagne",
        defaultStyle: "percussion",
        defaultPosition: "ATT",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/lucia-fernandez/standard.png",
            field: "/cards/football/lucia-fernandez/field.png",
        },
    },
    {
        id: "martina-bianchi",
        name: "Martina Bianchi",
        nation: "italie",
        defaultStyle: "elevation",
        defaultPosition: "MIL",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/martina-bianchi/standard.png",
            field: "/cards/football/martina-bianchi/field.png",
        },
    },
    {
        id: "olivia-smith",
        name: "Olivia Smith",
        nickname: "The Wall",
        nation: "angleterre",
        defaultStyle: "sangFroid",
        defaultPosition: "GB",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/olivia-smith/standard.png",
            mythic: "/cards/football/olivia-smith/mythic.png",
        },
    },
    {
        id: "valentina-costa",
        name: "Valentina Costa",
        nation: "argentine",
        defaultStyle: "vista",
        defaultPosition: "ATT",
        isCaptain: true,
        photoVariants: {
            standard: "/cards/football/valentina-costa/standard.png",
            field: "/cards/football/valentina-costa/field.png",
            signature: "/cards/football/valentina-costa/signature.png",
        },
    },
    {
        id: "yuki-nakamura",
        name: "Yuki Nakamura",
        nation: "japon",
        defaultStyle: "pressing",
        defaultPosition: "DEF",
        isCaptain: false,
        photoVariants: {
            standard: "/cards/football/yuki-nakamura/standard.png",
            field: "/cards/football/yuki-nakamura/field.png",
        },
    },
];
// ─── Card Prints ─────────────────────────────────────────────────────────────
var RARITIES = ["common", "rare", "epic", "legendary", "secret"];
var MINT_CAPS = {
    common: undefined,
    rare: undefined,
    epic: undefined,
    legendary: 1000,
    secret: 100,
};
function buildCharacterNumbers() {
    var map = {};
    var counters = {};
    for (var _i = 0, CHARACTERS_1 = exports.CHARACTERS; _i < CHARACTERS_1.length; _i++) {
        var c = CHARACTERS_1[_i];
        var prefix = NATION_PREFIX[c.nation];
        if (!counters[prefix])
            counters[prefix] = 0;
        counters[prefix]++;
        map[c.id] = counters[prefix];
    }
    return map;
}
var CHAR_NUMBERS = buildCharacterNumbers();
function buildCardPrints() {
    var prints = [];
    for (var _i = 0, CHARACTERS_2 = exports.CHARACTERS; _i < CHARACTERS_2.length; _i++) {
        var char = CHARACTERS_2[_i];
        var prefix = NATION_PREFIX[char.nation];
        var num = String(CHAR_NUMBERS[char.id]).padStart(3, "0");
        for (var _a = 0, RARITIES_1 = RARITIES; _a < RARITIES_1.length; _a++) {
            var rarity = RARITIES_1[_a];
            var suffix = RARITY_SUFFIX[rarity];
            var refCode = "".concat(prefix, "-").concat(num, "-").concat(suffix);
            prints.push({
                id: "".concat(char.id, "-s1-").concat(rarity),
                characterId: char.id,
                editionCode: "S1",
                rarity: rarity,
                refCode: refCode,
                mintCap: MINT_CAPS[rarity],
                minted: 0,
            });
        }
    }
    return prints;
}
exports.CARD_PRINTS = buildCardPrints();
// ─── Drop Rates & Packs ──────────────────────────────────────────────────────
exports.DEFAULT_DROP_RATES = {
    common: 50,
    rare: 30,
    epic: 14,
    legendary: 5,
    secret: 1,
};
exports.PACK_MAP = {
    STANDARD: {
        name: "Standard Pack",
        edition: "S1",
        dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
        costTickets: 1,
        costGems: 350,
        tags: ["x5 cards", "Standard odds"],
        description: "5 cards with standard drop rates. 1 ticket or 350 gems.",
    },
    PREMIUM: {
        name: "Premium Pack",
        edition: "S1",
        dropRates: { common: 33, rare: 32, epic: 20, legendary: 12, secret: 3 },
        costGems: 650,
        tags: ["x5 cards", "Boosted odds"],
        description: "5 cards with boosted rare+ odds. Gems only.",
    },
};
// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPackInfo(packCode) {
    var _a;
    return ((_a = exports.PACK_MAP[packCode]) !== null && _a !== void 0 ? _a : {
        name: packCode,
        edition: "Unknown",
        dropRates: exports.DEFAULT_DROP_RATES,
    });
}
function getPackDropRates(packCode) {
    return getPackInfo(packCode).dropRates;
}
function getAllPacks() {
    return Object.entries(exports.PACK_MAP);
}
function getPackCodes() {
    return Object.keys(exports.PACK_MAP);
}
function getCharacters() {
    return exports.CHARACTERS;
}
function getCharacterById(id) {
    return exports.CHARACTERS.find(function (c) { return c.id === id; });
}
function getPrintsByCharacter(characterId) {
    return exports.CARD_PRINTS.filter(function (p) { return p.characterId === characterId; });
}
function getPrintsByPack(editionCode) {
    return exports.CARD_PRINTS.filter(function (p) { return p.editionCode === editionCode; });
}
function rarityFromReference(ref) {
    var _a;
    var suffix = ref.slice(-1).toUpperCase();
    return (_a = RARITY_FROM_SUFFIX[suffix]) !== null && _a !== void 0 ? _a : "common";
}
function parseReference(ref) {
    var m = ref.match(/^([A-Z]{2})-(\d{3})-([C|R|E|L|S])$/i);
    if (!m)
        throw new Error("Invalid reference: ".concat(ref));
    return {
        nation: m[1].toUpperCase(),
        number: m[2],
        rarity: m[3].toUpperCase(),
    };
}
exports.default = exports.CARD_PRINTS;
