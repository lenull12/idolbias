"use client";

import { useCallback, useEffect, useState } from "react";
import { setPlayerId } from "./playerId";
import type { CardGrade } from "@/db/schema";

type PlayerData = {
  playerId: string;
  isNew: boolean;
  wallet: { tickets: number; gems: number; dust: number };
  progression: {
    streak: number;
    lastClaim: string | null;
    missionProgress: Record<string, number>;
    missionsClaimed: string[];
    fanXp: Record<string, number>;
    bias: string | null;
    biasChangedAt: string | null;
    totalLogins: number;
    weeklyMissionsDate: string | null;
    weeklyMissionProgress: Record<string, number>;
    weeklyMissionsClaimed: string[];
    lifetimeProgress: Record<string, number>;
    lifetimeClaimed: string[];
  };
  collection: Record<string, number>;
  collectionGrades: Record<string, Partial<Record<CardGrade, number>>>;
};

export function usePlayer() {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/player");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json() as PlayerData;
      setPlayerId(json.playerId);
      setData(json);
      return json;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { player: data, loading, error, refresh };
}
