export type OwnedCard = {
  id: string;
  characterId: string;
  name: string;
  nation: string;
  photo: { standard: string };
  ovr: number;
  rarity: string;
  serial: number | null;
  grade: string;
  group: string;
  position12: string;
  tecStats: Record<string, number> | null;
  gkStats: Record<string, number> | null;
  setPieceStats: Record<string, number> | null;
  phyStats: Record<string, number>;
  menStats: Record<string, number>;
};
