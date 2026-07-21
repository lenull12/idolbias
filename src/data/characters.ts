export type Personality = {
  charm: number;       // -100 = Charm, +100 = Charisma
  gentleness: number;  // -100 = Gentleness, +100 = Intensity
  energy: number;      // -100 = Calm, +100 = Energy
  confidence: number;  // -100 = Timidity, +100 = Confidence
};

export type CharacterInfo = {
  id: string;
  name: string;
  label?: string;       // Faction
  tagline: string;
  bio: string;
  color: string;
  revealed: boolean;
  archetype: string;    // RPG class
  element: string;      // Elemental affinity
  age: number;
  height: string;
  origin: string;
  specialty: string;
  birthday: string;
  personality: Personality;
};

export const CHARACTERS: CharacterInfo[] = [
  {
    id: "ria",
    name: "RIA",
    label: "VICIOUS",
    tagline: "The first bite",
    bio: "Premier personnage dévoilé d'IdolBias.",
    color: "#FF1493",
    revealed: true,
    archetype: "Sovereign",
    element: "Flame",
    age: 22,
    height: "174 cm",
    origin: "Neo-Seoul",
    specialty: "Crowd command",
    birthday: "March 15",
    personality: { charm: 85, gentleness: 70, energy: 65, confidence: 55 },
  },
  {
    id: "seori",
    name: "SEORI",
    label: "VICIOUS",
    tagline: "Silent blade",
    bio: "Danseuse émérite.",
    color: "#A87FFF",
    revealed: true,
    archetype: "Blade Dancer",
    element: "Void",
    age: 20,
    height: "167 cm",
    origin: "Night District",
    specialty: "Shadow step",
    birthday: "September 3",
    personality: { charm: -40, gentleness: 20, energy: -35, confidence: -40 },
  },
  {
    id: "mina",
    name: "MINA",
    label: "VICIOUS",
    tagline: "Sharp tongue",
    bio: "Rappeuse au flow incisif.",
    color: "#4FA8FF",
    revealed: true,
    archetype: "Tempest",
    element: "Thunder",
    age: 19,
    height: "163 cm",
    origin: "Stormfront",
    specialty: "Crowd breaker",
    birthday: "July 22",
    personality: { charm: 55, gentleness: 80, energy: 90, confidence: 60 },
  },
  {
    id: "haeun",
    name: "HAEUN",
    label: "VICIOUS",
    tagline: "Golden voice",
    bio: "Vocaliste principale.",
    color: "#FFB020",
    revealed: true,
    archetype: "Seraph",
    element: "Bloom",
    age: 21,
    height: "170 cm",
    origin: "Garden Spire",
    specialty: "Sound cascade",
    birthday: "April 8",
    personality: { charm: 10, gentleness: -45, energy: -55, confidence: -50 },
  },
  {
    id: "ash",
    name: "ASH",
    label: "RAZE",
    tagline: "Burn it down",
    bio: "Leader de RAZE.",
    color: "#FF6FB8",
    revealed: true,
    archetype: "Pyromancer",
    element: "Flame",
    age: 23,
    height: "180 cm",
    origin: "Ashfort",
    specialty: "Blaze surge",
    birthday: "December 1",
    personality: { charm: 70, gentleness: 95, energy: 85, confidence: 75 },
  },
  {
    id: "grav",
    name: "GRAV",
    label: "RAZE",
    tagline: "Heavy hitter",
    bio: "Bassiste et producteur.",
    color: "#B06BFF",
    revealed: true,
    archetype: "Artificer",
    element: "Earth",
    age: 25,
    height: "185 cm",
    origin: "Deepforge",
    specialty: "Tectonic strike",
    birthday: "February 11",
    personality: { charm: -60, gentleness: -15, energy: -40, confidence: -30 },
  },
  {
    id: "fall",
    name: "FALL",
    label: "RAZE",
    tagline: "Free fall",
    bio: "Danseur principal.",
    color: "#4FA8FF",
    revealed: true,
    archetype: "Windwalker",
    element: "Wind",
    age: 18,
    height: "178 cm",
    origin: "Skyreach",
    specialty: "Aerial grace",
    birthday: "June 30",
    personality: { charm: 5, gentleness: 35, energy: 60, confidence: 20 },
  },
  {
    id: "blaze",
    name: "BLAZE",
    label: "RAZE",
    tagline: "Final spark",
    bio: "Maknae du groupe.",
    color: "#FFB020",
    revealed: true,
    archetype: "Ember",
    element: "Radiance",
    age: 17,
    height: "165 cm",
    origin: "Sunspire",
    specialty: "Beacon light",
    birthday: "November 14",
    personality: { charm: -75, gentleness: -65, energy: 95, confidence: -80 },
  },
];

export function getCharacter(id: string): CharacterInfo | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

const ELEMENT_COLORS: Record<string, string> = {
  Flame: "#E53935",
  Void: "#A87FFF",
  Thunder: "#4FA8FF",
  Bloom: "#66BB6A",
  Earth: "#8D6E63",
  Wind: "#81D4FA",
  Radiance: "#FDD835",
};

export function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] ?? "var(--text-disabled)";
}
