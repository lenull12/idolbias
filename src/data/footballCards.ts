/**
 * SOURCE OF TRUTH — Football Card Game
 *
 * This file defines every character, card print, pack, and drop rate
 * for the football card collection. Seeded directly into the DB.
 *
 * ── Never import from @/components/CardEffects or @/db/footballSchema here ──
 * All types are local so this file stays portable.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Nation =
  | "france"
  | "allemagne"
  | "angleterre"
  | "italie"
  | "espagne"
  | "bresil"
  | "japon"
  | "argentine";

export type Style =
  | "percussion"
  | "vista"
  | "pressing"
  | "elevation"
  | "sangFroid";

export type Position = "GB" | "DEF" | "MIL" | "ATT";

export type CharacterDef = {
  id: string;
  name: string;
  nation: Nation;
  defaultStyle: Style;
  defaultPosition: Position;
  photoVariants: {
    standard: string;
    field?: string;
    signature?: string;
    mythic?: string;
  };
};

export type CardPrintDef = {
  id: string;
  characterId: string;
  editionCode: string;
  rarity: string;
  refCode: string;
  mintCap?: number;
  minted?: number;
};

export type PackTag = "featured" | "limited" | "discount" | "new";

export type PackDropRates = Record<string, number>;

export type PackInfo = {
  name: string;
  edition: string;
  dropRates: PackDropRates;
  bannerImage?: string;
  coverImage?: string;
  costTickets?: number;
  costGems?: number;
  originalCostGems?: number;
  tag?: PackTag;
  tags?: string[];
  description?: string;
  locked?: boolean;
};

// ─── Nation → ISO prefix for refCodes ───────────────────────────────────────

const NATION_PREFIX: Record<Nation, string> = {
  france: "FR",
  allemagne: "DE",
  angleterre: "GB",
  italie: "IT",
  espagne: "ES",
  bresil: "BR",
  japon: "JP",
  argentine: "AR",
};

const RARITY_SUFFIX: Record<string, string> = {
  common: "C",
  rare: "R",
  epic: "E",
  legendary: "L",
  secret: "S",
};

const RARITY_FROM_SUFFIX: Record<string, string> = {
  C: "common",
  R: "rare",
  E: "epic",
  L: "legendary",
  S: "secret",
};

// ─── Characters ──────────────────────────────────────────────────────────────

export const CHARACTERS: CharacterDef[] = [
  {
    id: "soledad-diaz",
    name: "Soledad D\u00edaz",
    nation: "argentine",
    defaultStyle: "vista",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/argentine/soledad-diaz/standard.png",
    },
  },
  {
    id: "valentina-gimenez",
    name: "Valentina Gim\u00e9nez",
    nation: "argentine",
    defaultStyle: "sangFroid",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/argentine/valentina-gimenez/standard.png",
    },
  },
  {
    id: "renata-navarro",
    name: "Renata Navarro",
    nation: "argentine",
    defaultStyle: "percussion",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/argentine/renata-navarro/standard.png",
    },
  },
  {
    id: "catalina-navarro",
    name: "Catalina Navarro",
    nation: "argentine",
    defaultStyle: "percussion",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/argentine/catalina-navarro/standard.png",
    },
  },
  {
    id: "martina-romero",
    name: "Martina Romero",
    nation: "argentine",
    defaultStyle: "pressing",
    defaultPosition: "MIL",
    photoVariants: {
      standard: "/cards/football/argentine/martina-romero/standard.png",
    },
  },
  {
    id: "roxy-cabrera",
    name: "Roxy Cabrera",
    nation: "argentine",
    defaultStyle: "elevation",
    defaultPosition: "MIL",
    photoVariants: {
      standard: "/cards/football/argentine/roxy-cabrera/standard.png",
    },
  },
  {
    id: "celeste-benitez",
    name: "Celeste Ben\u00edtez",
    nation: "argentine",
    defaultStyle: "vista",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/argentine/celeste-benitez/standard.png",
    },
  },
  {
    id: "melina-soria",
    name: "Melina Soria",
    nation: "argentine",
    defaultStyle: "pressing",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/argentine/melina-soria/standard.png",
    },
  },
  {
    id: "pilar-roldan",
    name: "Pilar Rold\u00e1n",
    nation: "argentine",
    defaultStyle: "sangFroid",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/argentine/pilar-roldan/standard.png",
    },
  },
  {
    id: "mercedes-perez",
    name: "Mercedes P\u00e9rez",
    nation: "argentine",
    defaultStyle: "elevation",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/argentine/mercedes-perez/standard.png",
    },
  },
  {
    id: "esperanza-galvan",
    name: "Esperanza Galv\u00e1n",
    nation: "argentine",
    defaultStyle: "sangFroid",
    defaultPosition: "GB",
    photoVariants: {
      standard: "/cards/football/argentine/esperanza-galvan/standard.png",
    },
  },
  {
    id: "karen-himekami",
    name: "Karen Himekami",
    nation: "japon",
    defaultStyle: "percussion",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/japon/karen-himekami/standard.png",
    },
  },
  {
    id: "shiori-saonji",
    name: "Shiori Saonji",
    nation: "japon",
    defaultStyle: "vista",
    defaultPosition: "MIL",
    photoVariants: {
      standard: "/cards/football/japon/shiori-saonji/standard.png",
    },
  },
  {
    id: "reika-shinomiya",
    name: "Reika Shinomiya",
    nation: "japon",
    defaultStyle: "percussion",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/japon/reika-shinomiya/standard.png",
    },
  },
  {
    id: "miyabi-kirishima",
    name: "Miyabi Kirishima",
    nation: "japon",
    defaultStyle: "vista",
    defaultPosition: "ATT",
    photoVariants: {
      standard: "/cards/football/japon/miyabi-kirishima/standard.png",
    },
  },
  {
    id: "hina-tsukiyomi",
    name: "Hina Tsukiyomi",
    nation: "japon",
    defaultStyle: "vista",
    defaultPosition: "MIL",
    photoVariants: {
      standard: "/cards/football/japon/hina-tsukiyomi/standard.png",
    },
  },
  {
    id: "hana-kamishiro",
    name: "Hana Kamishiro",
    nation: "japon",
    defaultStyle: "pressing",
    defaultPosition: "MIL",
    photoVariants: {
      standard: "/cards/football/japon/hana-kamishiro/standard.png",
    },
  },
  {
    id: "momo-hasegawa",
    name: "Momo Hasegawa",
    nation: "japon",
    defaultStyle: "vista",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/japon/momo-hasegawa/standard.png",
    },
  },
  {
    id: "rin-morishita",
    name: "Rin Morishita",
    nation: "japon",
    defaultStyle: "pressing",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/japon/rin-morishita/standard.png",
    },
  },
  {
    id: "yuriko-otake",
    name: "Yuriko \u014ctake",
    nation: "japon",
    defaultStyle: "elevation",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/japon/yuriko-otake/standard.png",
    },
  },
  {
    id: "aya-mishima",
    name: "Aya Mishima",
    nation: "japon",
    defaultStyle: "elevation",
    defaultPosition: "DEF",
    photoVariants: {
      standard: "/cards/football/japon/aya-mishima/standard.png",
    },
  },
  {
    id: "hinata-shigaki",
    name: "Hinata Shigaki",
    nation: "japon",
    defaultStyle: "sangFroid",
    defaultPosition: "GB",
    photoVariants: {
      standard: "/cards/football/japon/hinata-shigaki/standard.png",
    },
  },
];

// ─── Card Prints ─────────────────────────────────────────────────────────────

const RARITIES: string[] = ["common", "rare", "epic", "legendary", "secret"];

const MINT_CAPS: Record<string, number | undefined> = {
  common: undefined,
  rare: undefined,
  epic: undefined,
  legendary: 1000,
  secret: 100,
};

type CharacterNumberMap = Record<string, number>;

function buildCharacterNumbers(): CharacterNumberMap {
  const map: CharacterNumberMap = {};
  const counters: Record<string, number> = {};
  for (const c of CHARACTERS) {
    const prefix = NATION_PREFIX[c.nation];
    if (!counters[prefix]) counters[prefix] = 0;
    counters[prefix]++;
    map[c.id] = counters[prefix];
  }
  return map;
}

const CHAR_NUMBERS = buildCharacterNumbers();

function buildCardPrints(): CardPrintDef[] {
  const prints: CardPrintDef[] = [];
  for (const char of CHARACTERS) {
    const prefix = NATION_PREFIX[char.nation];
    const num = String(CHAR_NUMBERS[char.id]).padStart(3, "0");
    for (const rarity of RARITIES) {
      const suffix = RARITY_SUFFIX[rarity];
      const refCode = `${prefix}-${num}-${suffix}`;
      prints.push({
        id: `${char.id}-s1-${rarity}`,
        characterId: char.id,
        editionCode: "S1",
        rarity,
        refCode,
        mintCap: MINT_CAPS[rarity],
        minted: 0,
      });
    }
  }
  return prints;
}

export const CARD_PRINTS: CardPrintDef[] = buildCardPrints();

// ─── Drop Rates & Packs ──────────────────────────────────────────────────────

export const DEFAULT_DROP_RATES: PackDropRates = {
  common: 50,
  rare: 30,
  epic: 14,
  legendary: 5,
  secret: 1,
};

export const PACK_MAP: Record<string, PackInfo> = {
  STANDARD: {
    name: "Standard Pack",
    edition: "S1",
    dropRates: { common: 50, rare: 30, epic: 14, legendary: 5, secret: 1 },
    costTickets: 1,
    costGems: 350,
    bannerImage: "/card-backgrounds/standard-cover.png",
    tags: ["x5 cards", "Standard odds"],
    description: "5 cards with standard drop rates. 1 ticket or 350 gems.",
  },
  PREMIUM: {
    name: "Premium Pack",
    edition: "S1",
    dropRates: { common: 33, rare: 32, epic: 20, legendary: 12, secret: 3 },
    costGems: 650,
    bannerImage: "/card-backgrounds/premium-cover.png",
    tags: ["x5 cards", "Boosted odds"],
    description: "5 cards with boosted rare+ odds. Gems only.",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPackInfo(packCode: string): PackInfo {
  return (
    PACK_MAP[packCode] ?? {
      name: packCode,
      edition: "Unknown",
      dropRates: DEFAULT_DROP_RATES,
    }
  );
}

export function getPackDropRates(packCode: string): PackDropRates {
  return getPackInfo(packCode).dropRates;
}

export function getAllPacks(): Array<[string, PackInfo]> {
  return Object.entries(PACK_MAP);
}

export function getPackCodes(): string[] {
  return Object.keys(PACK_MAP);
}

export function getCharacters(): CharacterDef[] {
  return CHARACTERS;
}

export function getCharacterById(id: string): CharacterDef | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getPrintsByCharacter(characterId: string): CardPrintDef[] {
  return CARD_PRINTS.filter((p) => p.characterId === characterId);
}

export function getPrintsByPack(editionCode: string): CardPrintDef[] {
  return CARD_PRINTS.filter((p) => p.editionCode === editionCode);
}

export function rarityFromReference(ref: string): string {
  const suffix = ref.slice(-1).toUpperCase();
  return RARITY_FROM_SUFFIX[suffix] ?? "common";
}

export function parseReference(
  ref: string,
): { nation: string; number: string; rarity: string } {
  const m = ref.match(/^([A-Z]{2})-(\d{3})-([C|R|E|L|S])$/i);
  if (!m) throw new Error(`Invalid reference: ${ref}`);
  return {
    nation: m[1].toUpperCase(),
    number: m[2],
    rarity: m[3].toUpperCase(),
  };
}

export default CARD_PRINTS;
