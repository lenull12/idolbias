"use client";

import FutCard from "@/components/FutCard";
import type { FutCardProps } from "@/components/FutCard";

export default function CardSlot({ card, zoomed }: { card: FutCardProps; zoomed?: boolean }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <FutCard {...card} width={zoomed ? 215 : 155} zoomed={zoomed} />
    </div>
  );
}
