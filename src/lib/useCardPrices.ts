"use client";

import { useEffect, useState } from "react";

export function useCardPrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/market/screener?grade=all")
      .then((r) => r.json())
      .then((d) => setPrices(d.prices ?? {}));
  }, []);

  return prices;
}
