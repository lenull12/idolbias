// Re-export Durable Object classes
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

import openNextWorker from "./.open-next/worker.js";

function currentHour() {
  return Math.floor(Date.now() / 3600_000);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function boxMuller(rng) {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function computeTick(volatility, rng, previousMultiplier) {
  const noise = boxMuller(rng) * volatility * 0.1;
  const reversion = (1 - previousMultiplier) * 0.03;
  const cluster = ((rng() - 0.5) * 2) * 0.6 * 0.05;
  let multiplier = previousMultiplier * (1 + noise + reversion + cluster);
  multiplier = Math.max(0.1, Math.min(3, multiplier));
  if (rng() < 0.001) multiplier *= 0.5;
  return multiplier;
}

const SALT = "idolbias-price-tick";

async function handlePriceTick(env) {
  const db = env.DB;
  if (!db) {
    console.log("[price-tick] No D1 binding.");
    return;
  }

  const nowHour = currentHour();

  let all;
  try {
    const result = await db.prepare("SELECT * FROM price_checkpoints").all();
    all = result.results;
  } catch (e) {
    console.error("[price-tick] Failed to read checkpoints:", e.message);
    return;
  }

  if (!all || all.length === 0) {
    console.log("[price-tick] No checkpoints to update.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const cp of all) {
    if (cp.last_hour >= nowHour) {
      skipped++;
      continue;
    }

    const cardGradeKey = cp.card_id + ":" + cp.grade;
    const rng = seededRandom(fnv1a(cardGradeKey + SALT));

    const hoursGap = Math.min(nowHour - cp.last_hour, 8760);
    let mult = cp.vol_multiplier;
    const volatility = 0.35;

    for (let h = 0; h < hoursGap; h++) {
      mult = computeTick(volatility, rng, mult);
    }

    let historyArr;
    try {
      historyArr = JSON.parse(cp.history || "[]");
    } catch {
      historyArr = [];
    }
    historyArr.push({ hour: nowHour, mult: Math.round(mult * 1000) / 1000 });
    while (historyArr.length > 8760) historyArr.shift();

    try {
      await db.prepare(
        "UPDATE price_checkpoints SET last_hour = ?, vol_multiplier = ?, history = ? WHERE id = ?"
      ).bind(nowHour, mult, JSON.stringify(historyArr), cp.id).run();
      updated++;
    } catch (e) {
      console.error("[price-tick] Update failed for " + cardGradeKey + ":", e.message);
    }
  }

  console.log("[price-tick] hour=" + nowHour + " updated=" + updated + " skipped=" + skipped);
}

export default {
  fetch: openNextWorker.fetch,
  async scheduled(event, env, ctx) {
    if (event.cron === "0 * * * *") {
      ctx.waitUntil(handlePriceTick(env));
    }
  },
};
