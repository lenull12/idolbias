// ─── Types ─────────────────────────────────────────────────────────────────

export type SocialHandle = {
  /** Handle on future photo network (Insta-like), ex: "@ria" */
  photoHandle?: string;
  /** Handle on future text/feed network (X-like), ex: "@ria" */
  feedHandle?: string;
};

export type MemberInfo = {
  id: string;
  /** Stage name — must match `idol` in data/cards.ts for cross-referencing */
  stageName: string;
  realName?: string;
  birthName?: string;
  position: string;
  birthday?: string;
  zodiac?: string;
  height?: string;
  weight?: string;
  bloodType?: string;
  mbti?: string;
  nationality?: string;
  bio: string;
  funFacts?: string[];
  specialties?: string[];
  /** Member accent color, used for avatar/borders */
  color: string;
  /** Profile image path (webp), e.g. /profiles/vicious/RIA.webp */
  profileImage?: string;
  social: SocialHandle;
  /** Member not yet revealed (narrative placeholder, not missing data) */
  revealed: boolean;
};

export type TrackType = "song" | "mv";

export type TrackInfo = {
  id: string;
  title: string;
  type: TrackType;
  releaseDate?: string;
  duration?: string;
};

export type GroupInfo = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  color: string;
  gender?: "male" | "female";
  agency?: string;
  genre?: string;
  fandomName?: string;
  officialColors?: string[];
  debutDate?: string;
  members: MemberInfo[];
  discography: TrackInfo[];
  social: SocialHandle;
  /** Path to the group logo image displayed on card backs */
  logoPath?: string;
};

// ─── Data ──────────────────────────────────────────────────────────────────
// Placeholder — to be replaced/enriched as real profiles are built out.

export const GROUPS: GroupInfo[] = [
  {
    id: "vicious",
    name: "VICIOUS",
    tagline: "있는 그대로 — RAW",
    gender: "female",
    bio: "VICIOUS is the first virtual group of IdolBias. A Y2K concept tinged with dark fantasy — launched with the RAW era. Each member carries a different facet of the group: glamour, danger, mystery, bite.",
    color: "#FF1493",
    agency: "IdolBias Entertainment",
    genre: "Dark pop, Y2K, EDM",
    fandomName: "FANGS",
    officialColors: ["#FF1493", "#C9B1FF", "#9EE6FF", "#FFE9A8", "#1A0A1E"],
    debutDate: "2026-07-01",
    social: { photoHandle: "@vicious.official", feedHandle: "@vicious" },
    logoPath: "/vicious_logo.png",
    members: [
      // ─── RIA — Leader, Main Rapper ───────────────────────────────────
      {
        id: "ria",
        stageName: "RIA",
        realName: "Kang Ria",
        birthName: "Kang Ria (강리아)",
        position: "Leader · Main Rapper",
        birthday: "March 14, 2004",
        zodiac: "Pisces",
        height: "169 cm",
        weight: "52 kg",
        bloodType: "A",
        mbti: "ENFJ",
        nationality: "South Korean",
        bio: "The leader of VICIOUS — cold in public, protective behind the scenes. Ria carries the group with a natural authority and a sharp tongue that cuts as clean as her flow. Five years of training shaped her into the main rapper and the unnie the members rely on.",
        funFacts: [
          "Writes her own rap verses and keeps a notebook full of lyrics she never shows anyone",
          "Known for her intense stage presence — she barely smiles during performances",
          "Collected over 20 pairs of platform boots across 3 years",
          "Always the first to arrive at practice and the last to leave",
        ],
        specialties: ["Rap writing", "Stage presence", "Leadership"],
        color: "#FF1493",
        profileImage: "/profiles/vicious/RIA.webp",
        social: { photoHandle: "@ria", feedHandle: "@ria" },
        revealed: true,
      },
      // ─── SEORI — Lead Vocalist ───────────────────────────────────────
      {
        id: "seori",
        stageName: "SEORI",
        realName: "Yoon Seori",
        birthName: "Yoon Seori (윤서리)",
        position: "Lead Vocalist",
        birthday: "August 22, 2005",
        zodiac: "Leo",
        height: "164 cm",
        weight: "49 kg",
        bloodType: "O",
        mbti: "ESTP",
        nationality: "South Korean",
        bio: "Ethereal and cold, delicate yet unbreakable — Seori moves like she belongs to another world. Trained in contemporary dance for 8 years before joining VICIOUS, she brings an almost hypnotic precision to every stage. Her voice cuts through the noise like frost.",
        funFacts: [
          "Can learn a full choreography in under 2 hours",
          "Speaks fluent Japanese after studying abroad in Osaka for 2 years",
          "Has a cat named Mochi that appears in her vlogs regularly",
          "Prefers silence over small talk — her bandmates say she can sit still for hours",
        ],
        specialties: ["Choreography", "Contemporary dance", "Japanese"],
        color: "#C9B1FF",
        profileImage: "/profiles/vicious/SEORI.webp",
        social: { photoHandle: "@seori", feedHandle: "@seori" },
        revealed: true,
      },
      // ─── MINA — Main Vocalist, Maknae ─────────────────────────────────
      {
        id: "mina",
        stageName: "MINA",
        realName: "Okamoto Mina",
        birthName: "Okamoto Mina (岡本 美奈)",
        position: "Main Vocalist · Maknae",
        birthday: "November 3, 2007",
        zodiac: "Scorpio",
        height: "165 cm",
        weight: "55 kg",
        bloodType: "B",
        mbti: "INTJ",
        nationality: "Japanese",
        bio: "The youngest of VICIOUS, but her voice carries a weight that belongs to someone twice her age. A pure vocalist with a warm, honeyed tone — she trained in Tokyo before moving to Seoul at 16 to chase a dream her parents didn't understand.",
        funFacts: [
          "Started singing in a church choir at 7 and never stopped",
          "Moved from Tokyo to Seoul alone at 16 with only a backpack and a notebook",
          "Writes short piano pieces in her free time, none of which she's shared yet",
          "Despite being the maknae, she's the one who mediates conflicts in the group",
        ],
        specialties: ["Vocal coaching", "Piano"],
        color: "#9EE6FF",
        profileImage: "/profiles/vicious/MINA.webp",
        social: { photoHandle: "@mina", feedHandle: "@mina" },
        revealed: true,
      },
      // ─── HAEUN — Lead Rapper, Main Dancer ────────────────────────────
      {
        id: "haeun",
        stageName: "HAEUN",
        realName: "Park Haeun",
        birthName: "Park Haeun (박하은)",
        position: "Lead Rapper · Main Dancer",
        birthday: "May 2, 2003",
        zodiac: "Taurus",
        height: "172 cm",
        weight: "56 kg",
        bloodType: "AB",
        mbti: "INTJ",
        nationality: "South Korean",
        bio: "The tallest and the oldest — Haeun commands every room she walks into. A rapper with a growl and a dancer whose movements are pure control. She brings the edge to VICIOUS with a presence that fills the stage and a charisma that doesn't need words.",
        funFacts: [
          "Trained in street dance before ever stepping into a K-pop company",
          "Writes her own rap verses, often finishing them in under 30 minutes",
          "Known backstage as the one who hypes everyone up before a show",
          "Despite her sharp image, she's the first to cry when a member succeeds",
        ],
        specialties: ["Rap writing", "Street dance", "Stage charisma"],
        color: "#FFE9A8",
        profileImage: "/profiles/vicious/HAEUN.webp",
        social: { photoHandle: "@haeun", feedHandle: "@haeun" },
        revealed: true,
      },
    ],
    discography: [
      { id: "vicious", title: "VICIOUS", type: "mv", releaseDate: "2026-07-01" },
    ],
  },
  {
    id: "raze",
    name: "R\u039bZE",
    tagline: "RAZE IT ALL",
    gender: "male",
    bio: "R\u039bZE arrives \u2014 raw, unfiltered, impossible to ignore. A four-member rage rap / dark trap group with an attitude that cuts through the static. Cortisol over melody, tension over release. Their debut single STATIC drops like a hammer \u2014 75 BPM of pure overload.",
    color: "#1A0A0A",
    agency: "IdolBias Entertainment",
    genre: "Rage rap, trap, dark pop",
    fandomName: "R\u039bZ\u039eRS",
    officialColors: ["#FFFFFF", "#FF0000", "#FF8C00", "#FFD700", "#1A0A0A"],
    debutDate: "2026",
    social: {},
    logoPath: "/raze_logo.png",
    members: [
      {
        id: "ash",
        stageName: "\u039bSH",
        realName: "Kang Jaeho",
        birthName: "Kang Jaeho (\uac15\uc7ac\ud638)",
        position: "Leader \u00b7 Main Vocal",
        birthday: "May 15, 2003",
        zodiac: "Taurus",
        height: "183 cm",
        weight: "70 kg",
        bloodType: "O",
        mbti: "ENTJ",
        nationality: "South Korean",
        color: "#1A1A1A",
        bio: "Calm on the surface, magnetic underneath. Ash carries R\u039bZE with a natural authority and a voice that cuts through the static. The core of the group, quiet but undeniable.",
        funFacts: [
          "Hides his eyes behind his hair because he says \"people panic when they stare too long\"",
          "Has a surprisingly loud laugh that shocks everyone given his usual calm",
          "Only cooks instant noodles but elevates them to an art form",
          "Always replies to fan messages with a single word \u2014 but spends hours choosing which one",
        ],
        specialties: [
          "Vocal \u2014 powerful range and impressive stability",
          "Impression \u2014 can mimic any member\u2019s voice",
          "Fast learner \u2014 memorizes choreography in one watch",
        ],
        social: {},
        revealed: true,
      },
      {
        id: "grav",
        stageName: "GR\u039bV",
        realName: "Choi Hyunseok",
        birthName: "Choi Hyunseok (\ucd5c\ud604\uc11d)",
        position: "Lead Rapper",
        birthday: "November 2, 2004",
        zodiac: "Scorpio",
        height: "180 cm",
        weight: "72 kg",
        bloodType: "A",
        mbti: "ISTP",
        nationality: "South Korean",
        color: "#FF8C00",
        bio: "Delinquent chic. The most intimidating at first glance \u2014 sharp jaw, long black hair, a voice that rumbles. But behind the menace is a steady presence the group leans on.",
        funFacts: [
          "Has scars on his arms he refuses to explain",
          "Raises succulents \u2014 he has 30 at home (total contrast with his tough image)",
          "Never smiles in photos but laughs all the time backstage",
          "His voice goes soft when he talks to his cat",
        ],
        specialties: [
          "Rap \u2014 deep voice, commanding presence, slow heavy flow",
          "Dance \u2014 raw power, martial control of movement",
          "Beatmaking \u2014 produces his own dark atmospheres",
        ],
        social: {},
        revealed: true,
      },
      {
        id: "fall",
        stageName: "F\u039bLL",
        realName: "Lee Hajun",
        birthName: "Lee Hajun (\uc774\ud558\uc900)",
        position: "Main Dancer",
        birthday: "June 22, 2004",
        zodiac: "Cancer",
        height: "178 cm",
        weight: "66 kg",
        bloodType: "AB",
        mbti: "INFJ",
        nationality: "South Korean",
        color: "#FFD700",
        bio: "Explosive on stage, reserved off it. Fall moves like fire \u2014 every step precise, every gesture controlled. The main dancer who lets his body do the talking.",
        funFacts: [
          "Can replicate any choreography after seeing it once",
          "Writes poems at night \u2014 no one has ever read them",
          "Hates surprises but throws the best surprise parties for others",
          "His favorite character in video games is always the \u201csilent protagonist\u201d",
        ],
        specialties: [
          "Dance \u2014 main dancer, explosive and fluid style",
          "Vocal \u2014 harmonies, vocal support, soft register",
          "Choreography \u2014 creates the group\u2019s signature moves",
        ],
        social: {},
        revealed: true,
      },
      {
        id: "blaze",
        stageName: "BL\u039bZE",
        realName: "Jung Chanho",
        birthName: "Jung Chanho (\uc815\ucc2c\ud638)",
        position: "Main Rapper \u00b7 Maknae",
        birthday: "August 8, 2005",
        zodiac: "Leo",
        height: "176 cm",
        weight: "62 kg",
        bloodType: "B",
        mbti: "ENFP",
        nationality: "South Korean",
        color: "#FF0000",
        bio: "Chaotic good. The maknae with a smirk and a flamethrower flow. Unpredictable, flamboyant, and the first to turn a silent room into a warzone.",
        funFacts: [
          "Writes lyrics everywhere \u2014 on his hands, his sheets, the studio walls (he has to paper over them)",
          "Can eat the same thing every day for weeks then suddenly hate it overnight",
          "Pretends to be lazy but no one works harder in the studio",
          "His favorite phrase: \u201cIt\u2019s not chaos, it\u2019s jazz\u201d",
        ],
        specialties: [
          "Rap \u2014 unique flow, writes all his lyrics",
          "Beatbox \u2014 can recreate any sound with his mouth",
          "Composition \u2014 produces instinctive trap melodies",
        ],
        social: {},
        revealed: true,
      },
    ],
    discography: [
      { id: "static", title: "STATIC", type: "song", releaseDate: "2026", duration: "3:12" },
      { id: "raze-mv", title: "STATIC", type: "mv", releaseDate: "2026" },
    ],
  },
];

export function getGroup(id: string): GroupInfo | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getMember(groupId: string, memberId: string): MemberInfo | undefined {
  return getGroup(groupId)?.members.find((m) => m.id === memberId);
}

export function findGroupByMember(stageName: string): GroupInfo | undefined {
  return GROUPS.find((g) => g.members.some((m) => m.stageName === stageName));
}
