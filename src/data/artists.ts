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
  agency?: string;
  genre?: string;
  fandomName?: string;
  officialColors?: string[];
  debutDate?: string;
  members: MemberInfo[];
  discography: TrackInfo[];
  social: SocialHandle;
};

// ─── Data ──────────────────────────────────────────────────────────────────
// Placeholder — to be replaced/enriched as real profiles are built out.

export const GROUPS: GroupInfo[] = [
  {
    id: "vicious",
    name: "VICIOUS",
    tagline: "있는 그대로 — RAW",
    bio: "VICIOUS is the first virtual group of IdolBias. A Y2K concept tinged with dark fantasy — launched with the RAW era. Each member carries a different facet of the group: glamour, danger, mystery, bite.",
    color: "#FF1493",
    agency: "IdolBias Entertainment",
    genre: "Dark pop, Y2K, EDM",
    fandomName: "FANGS",
    officialColors: ["#FF1493", "#C9B1FF", "#9EE6FF", "#FFE9A8", "#1A0A1E"],
    debutDate: "2026-07-01",
    social: { photoHandle: "@vicious.official", feedHandle: "@vicious" },
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
];

export function getGroup(id: string): GroupInfo | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getMember(groupId: string, memberId: string): MemberInfo | undefined {
  return getGroup(groupId)?.members.find((m) => m.id === memberId);
}
