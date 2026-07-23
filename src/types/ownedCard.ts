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
  position: string;
  tecStats: Record<string, number>;
  phyStats: Record<string, number>;
  menStats: Record<string, number>;
};
