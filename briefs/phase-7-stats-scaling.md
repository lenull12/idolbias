# Phase 7 — Scaling stats individuelles par rareté

> Corrige les bugs #1 et #2 de l'audit Claude Code (juillet 2026)
> Fusionne System B + OVR réel

## Problème

Actuellement, `generateStatsForRarity()` dans `statGenerator.ts` scale **seulement l'OVR** avec `FRAC[rarity]`. Les stats individuelles (tec/phy/men/gk/setPiece) sont copiées **brutes** depuis CHARACTER_STATS. Conséquence :

- common Soledad : OVR=72 mais **dribble=97** (stat de légendaire)
- secret Soledad : OVR=99 et **dribble=97** (identique)
- Le match engine lit les stats individuelles, pas l'OVR → **les raretés n'ont aucun impact gameplay**

De plus, `OVR_BAND` et `clampOVRToRarityBand()` existent dans `footballSchema.ts` mais ne sont appelés nulle part.

## Solution

### Principe

Chaque stat individuelle est scalée par le même FRAC que l'OVR, avec un jitter individuel (seedé). L'OVR reste `base × FRAC + jitter` — pas de somme pondérée, la base est une méta-évaluation fiable et le FRAC préserve les écarts relatifs.

### Modifications

#### 1. `src/lib/statGenerator.ts` — refonte de `generateStatsForRarity()`

Ajouter une fonction de scaling individuel :

```ts
const JITTER = 3;

function scaleStatValue(value: number, frac: number, seed: string): number {
  // Jitter gaussien individuel pour chaque stat
  const jitter = Math.max(-JITTER, Math.min(JITTER,
    Math.round(seededGaussianNoise(seed + '-a', seed + '-b') * JITTER)
  ));
  return Math.max(1, Math.min(99, Math.round(value * frac + jitter)));
}
```

Dans `generateStatsForRarity()`, remplacer les copies brutes par un scaling :

```ts
// Avant (brut) :
const phy = extractPhy(cs);

// Après (scalé) :
function scalePhy(cs: typeof CHARACTER_STATS[string], frac: number, baseSeed: string): PhyStats {
  const result: any = {};
  for (const k of PHY_KEYS) {
    result[k] = scaleStatValue(cs.stats[k] ?? 0, frac, baseSeed + '-' + k);
  }
  return result as PhyStats;
}
```

Faire de même pour chaque catégorie :
- `scaleMen(cs, frac, seed)` — MEN_KEYS (anticipation→flair)
- `scaleTec(cs, frac, seed)` — TEC outfield (passe→technique)
- `scaleSetPiece(cs, frac, seed)` — SET PIECE (cf→longThrows)
- `scaleGk(cs, frac, seed)` — GK_TEC (reflexes→rushingOut)

**Cas GK** : ne scaler QUE PHY + MEN + GK_TEC. TECH outfield et SET PIECE restent `null` (déjà le cas).

```ts
if (cs.isGK) {
  return {
    tec: null,
    gk: scaleGk(cs, frac, seed),
    phy: scalePhy(cs, frac, seed),
    men: scaleMen(cs, frac, seed),
    setPiece: null,
    ovr,
    tailleCm: cs.tailleCm,
    poidsKg: cs.poidsKg,
    piedPrefere: cs.piedPrefere,
  };
}

return {
  tec: scaleTec(cs, frac, seed),
  gk: null,
  phy: scalePhy(cs, frac, seed),
  men: scaleMen(cs, frac, seed),
  setPiece: scaleSetPiece(cs, frac, seed),
  ovr,
  tailleCm: cs.tailleCm,
  poidsKg: cs.poidsKg,
  piedPrefere: cs.piedPrefere,
};
```

**Important** : la fonction `extractPhy()` et `extractMen()` existantes peuvent être supprimées ou remplacées — elles ne servent plus qu'à du mapping de clés, les nouvelles `scalePhy/scaleMen` les remplacent.

#### 2. `src/lib/statGenerator.ts` — seed de jitter cohérent

Chaque stat reçoit un seed unique basé sur `seed + '-' + statKey`. Ça garantit :
- Le même seed + même characterId + même rareté → mêmes stats (déterministe)
- Chaque jitter est indépendant (pas de corrélation entre stats)
- Les faiblesses structurelles du perso sont préservées (ex: Soledad tacle=35 reste faible même en secret)

#### 3. `src/db/footballSchema.ts` — supprimer OVR_BAND

Supprimer la constante `OVR_BAND` et la fonction `clampOVRToRarityBand()` :

```ts
// ─── À SUPPRIMER ────────────────────────────────────────
export const OVR_BAND: Record<Rarity, [number, number]> = { ... };
export function clampOVRToRarityBand(...) { ... }
// ─────────────────────────────────────────────────────────
```

Vérifier qu'aucun import de ces symboles n'existe ailleurs dans le codebase (grep). Si c'est le cas, les supprimer aussi.

#### 4. Aucun changement ailleurs

- `gachaEngine.ts` n'a pas besoin d'être modifié — il appelle `generateStatsForRarity()` et reçoit déjà les stats via `{ tec, gk, phy, men, setPiece, ovr }`.
- `matchEngine.ts` inchangé — il lit les stats individuelles qui sont maintenant scalées.
- DB schema inchangé.

### Vérification

```bash
# Typecheck
npx tsc --noEmit
```

**Test manuel (console Next.js)** :

```ts
import { generateStatsForRarity } from '@/lib/statGenerator';

// Même perso, deux raretés
const common = generateStatsForRarity('soledad-diaz', 'common', 'test-seed-1');
const secret = generateStatsForRarity('soledad-diaz', 'secret', 'test-seed-2');

console.log('common OVR:', common.ovr, 'dribble:', common.tec?.dribble);
console.log('secret OVR:', secret.ovr, 'dribble:', secret.tec?.dribble);
// Attendu : common dribble ~76, secret dribble ~99
```

### Impact

| Rareté | Avant (dribble) | Après (dribble) | OVR |
|--------|----------------|----------------|-----|
| common | 97 | **~76** | ~72 |
| secret | 97 | **~99** | ~99 |

Une common Soledad joue maintenant comme une commune (OVR~72), une secret comme une star (OVR~99). Le gacha a du sens, les stats affichées correspondent au gameplay.

### Risques

- **Pas de régression OVR** : la formule `base × FRAC + jitter` est inchangée, seul le scope d'application change (maintenant aussi les stats individuelles).
- **Pas de changement DB** : les stats sont calculées au pull et stockées en JSON — aucune migration.
- **Gaussian noise inchangé** : on réutilise `seededGaussianNoise()` déjà existante, pas de nouveau prng.
