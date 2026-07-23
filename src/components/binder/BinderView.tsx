"use client";

import { useState } from "react";
import SetCard from "./SetCard";
import BinderAlbumView from "./BinderAlbumView";
import SetCompletionModal from "./SetCompletionModal";
import { getAllPacks, getCharacters, getPrintsByCharacter } from "@/data/footballCards";

export default function BinderView({
  owned = {},
  onView,
  onGoToShop,
}: {
  owned?: Record<string, number>;
  onView?: () => void;
  onGoToShop?: (packCode: string) => void;
}) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const packs = getAllPacks();
  const allCharacters = getCharacters();

  if (selectedPack) {
    const pack = packs.find(([code]) => code === selectedPack)?.[1];
    if (!pack) return null;

    const chars = allCharacters;
    const completed = chars.every((ch) => {
      const prints = getPrintsByCharacter(ch.id);
      return prints.some((p) => owned[p.refCode] && owned[p.refCode] > 0);
    });

    return (
      <BinderAlbumView
        pack={pack}
        characters={chars}
        owned={owned}
        onBack={() => setSelectedPack(null)}
        onView={onView}
      />
    );
  }

  return (
    <div>
      {showCompletion && (
        <SetCompletionModal
          packName="S1"
          onClose={() => setShowCompletion(false)}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {packs.map(([code, pack]) => {
          const chars = allCharacters;
          const collected = chars.filter((ch) => {
            const prints = getPrintsByCharacter(ch.id);
            return prints.some((p) => owned[p.refCode] && owned[p.refCode] > 0);
          }).length;

          return (
            <div key={code} onClick={() => setSelectedPack(code)}>
              <SetCard pack={pack} characters={chars} collected={collected} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
