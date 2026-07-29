# Phase 8a — Position Fit & Squad Editor

> Pré-brief : système de poste/malus + éditeur de formation libre
> Indépendant du Match Lab, réutilisable pour la feature « Mon équipe » plus tard.

## Contexte

Le match engine utilise les 12 postes (`Position12`) pour sélectionner les actrices via `ZONE_MATCH_ATTACK/DEFENSE`, mais **n'applique aucun malus** quand une joueuse joue hors de son poste. Actuellement dans le code :

- `characterStats.ts` stocke `position`, `posSec1`, `posSec2` (ex: Soledad : ST / CAM / LW)
- Les formations sont définies dans `lineupSchema.ts` avec des slots (GB/DEF/MIL/ATT)
- Le match engine reçoit des `MatchPlayer` avec `position12` et `stats` déjà figées

**Aucun lien entre les deux** : une joueuse peut être placée n'importe où, ses stats ne changent pas.

## 1. Lib : `src/lib/positionMatch.ts`

Fonctions pures, zéro dépendance externe. Testable unitairement.

### 1.1 `getPositionFit()` — niveau d'adéquation

```ts
export type FitLevel = "perfect" | "close" | "secondary" | "off";

/**
 * Calcule si une joueuse est à l'aise dans un poste.
 *
 * perfect   = poste exact (ST→ST ✓)
 * close     = même groupe (ST→RW, même groupe ATT)
 * secondary = poste secondaire listé (ST→CAM si posSec1="CAM")
 * off       = groupe différent (ST→CB, groupe ATT→DEF)
 */
export function getPositionFit(
  character: { position: string; posSec1?: string; posSec2?: string },
  slotPosition12: string,
): FitLevel { ... }
```

**Logique** :
1. `slotPosition12 === character.position` → `perfect`
2. `slotPosition12 === character.posSec1 || character.posSec2` → `secondary`
3. `toGroup(slotPosition12) === toGroup(character.position)` → `close`
4. Sinon → `off`

**Fonction `toGroup()`** : conversion Position12 → Groupe DB (GB/DEF/MIL/ATT). Existe déjà dans `_export_excel_to_ts.py` (le `compute_group()`), mais pas côté TS. À implémenter là :

```ts
export function toGroup(pos12: string): "GB" | "DEF" | "MIL" | "ATT" {
  if (pos12 === "GK") return "GB";
  if (["RB", "LB", "CB"].includes(pos12)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos12)) return "MIL";
  return "ATT"; // LW, RW, ST
}
```

### 1.2 `getPositionWeights()` — stats clés d'un poste

Chaque poste a des stats qui comptent plus que d'autres — ce sont celles qui seront impactées par le malus.

```ts
/**
 * Poids des stats par poste (0.0 = pas important, 1.0 = critique).
 * Utilisé pour déterminer quelles stats sont réduites par le malus.
 */
export function getPositionWeights(post12: string): Partial<Record<StatKey, number>> {
  switch (post12) {
    case "GK":
      return { reflexes: 1.0, handling: 1.0, aerialReach: 0.8, commandArea: 0.8, rushingOut: 0.7, kicking: 0.5,
               anticipation: 0.6, positionnement: 0.6, decision: 0.5 };
    case "CB":
      return { tacle: 1.0, anticipation: 1.0, positionnement: 1.0, force: 0.8, puissance: 0.7, detente: 0.7,
               vitesse: 0.5, agressivite: 0.6, decision: 0.7, passe: 0.4 };
    case "ST":
      return { tir: 1.0, sangFroid: 1.0, dribble: 0.9, vitesse: 0.8, acceleration: 0.7, detente: 0.8,
               decision: 0.7, controle: 0.6, passe: 0.3 };
    // … tous les 12 postes
  }
}
```

Les poids sont inspirés des `ZONE_ATTACK_WEIGHTS`/`ZONE_DEFENSE_WEIGHTS` du match engine : les stats qui apparaissent le plus souvent dans les zones clés du poste reçoivent un poids plus élevé.

### 1.3 `applyPositionPenalty()` — application du malus

```ts
const PENALTY: Record<FitLevel, number> = {
  perfect:   0.00,  // 0% de malus
  close:     0.05,  // -5% sur les stats clés
  secondary: 0.10,  // -10%
  off:       0.25,  // -25%
};

/**
 * Applique le malus de position aux stats.
 * Seules les stats importantes pour le POSTE D'ACCUEIL sont réduites.
 *
 * Exemple : Soledad (ST) placée en CB
 *   → getPositionWeights("CB") = tacle:1.0, anticipation:1.0, positionnement:1.0...
 *   → fit = "off" → malus ×0.75
 *   → tacle = 35×0.75=26, anticipation=67×0.75=50, positionnement=65×0.75=49
 *   → tir/dribble (poids=0.3 ou 0.0) : quasiment pas touchés
 */
export function applyPositionPenalty(
  stats: Partial<Record<StatKey, number>>,
  slotPosition12: string,
  character: { position: string; posSec1?: string; posSec2?: string },
): Partial<Record<StatKey, number>> {
  const fit = getPositionFit(character, slotPosition12);
  if (fit === "perfect") return stats; // pas de copie inutile

  const penalty = PENALTY[fit];
  const weights = getPositionWeights(slotPosition12);

  const result = { ...stats };
  for (const [statKey, weight] of Object.entries(weights)) {
    if (weight > 0 && result[statKey] !== undefined) {
      // Malus proportionnel au poids : une stat à 1.0 prend -25%,
      // une stat à 0.3 prend seulement -7.5%
      const reduction = penalty * weight;
      result[statKey] = Math.round(result[statKey] * (1 - reduction));
    }
  }
  return result;
}
```

Clé du design : **le malus est proportionnel au poids de la stat dans le poste d'accueil**. Un ST placé en CB :
- Son tacle (poids 1.0 pour CB) prend -25% → de 35 à 26
- Son dribble (poids ~0.1 pour CB) prend à peine -2.5% → de 97 à 94

Le joueur garde ses qualités naturelles même mal placé — il est juste moins bon dans les tâches qui comptent pour son poste actuel.

### 1.4 Calcul du fit affiché

Pour l'affichage dans l'éditeur :

```ts
export function getFitColor(fit: FitLevel): string {
  return fit === "perfect" ? "#22c55e"    // vert
       : fit === "close" ? "#84cc16"      // vert clair
       : fit === "secondary" ? "#eab308"  // jaune
       : "#ef4444";                        // rouge
}

export function getFitLabel(fit: FitLevel): string {
  return fit === "perfect" ? "Poste natif"
       : fit === "close" ? "Même groupe"
       : fit === "secondary" ? "Poste secondaire"
       : "Hors poste";
}
```

## 2. Composant : `components/SquadEditor.tsx`

### 2.1 Props

```ts
interface SquadEditorProps {
  /** Caractères disponibles pour l'équipe (filtrés par nation) */
  characters: SquadCharacter[];
  /** Configuration actuelle (positions des joueuses) */
  squad: SquadSlot[];
  /** Callback quand une assignation change */
  onChange: (squad: SquadSlot[]) => void;
  /** Label (home/away) */
  label?: string;
}

interface SquadCharacter {
  id: string;
  name: string;
  position: string;
  posSec1?: string;
  posSec2?: string;
  ovr: number;
  rarity: Rarity;
  assigned: boolean; // déjà placée
}

interface SquadSlot {
  slotId: string;
  position12: Position12; // poste attendu
  characterId: string | null; // null = vide
  fit: FitLevel; // calculé via getPositionFit
}
```

### 2.2 Layout

```
┌──────────────────────────────────────────────┐
│  Équipe : Argentine          Formation: ▾    │
│                                               │
│  ┌────────────────────────────────────┐       │
│  │                                    │       │
│  │       [LW]    [ST]    [RW]         │       │
│  │        ↑       ↑       ↑           │       │
│  │    (Soledad) (Valentina) (Reika)   │       │
│  │       CAM      CB       CDM        │       │
│  │      🟡 sec    🔴 off    🟡 sec    │       │
│  │                                    │       │
│  │    [CM]            [CM]            │       │
│  │    (Hina)          (Roxy)         │       │
│  │      CDM             CM            │       │
│  │      🟢 perf        🟢 perf       │       │
│  │                                    │       │
│  │  [LB]    [CB]    [CB]    [RB]      │       │
│  │  (Momo)  (Pilar) (Aya)  (Celeste) │       │
│  │    LB      CB       CB      RB     │       │
│  │   🟡sec   🟢perf  🟢perf  🟢perf │       │
│  │                                    │       │
│  │              [GK]                  │       │
│  │           (Esperanza)              │       │
│  │              GK                    │       │
│  │             🟢perf                 │       │
│  └────────────────────────────────────┘       │
│                                               │
│  ── Banc / disponibles ────────────────────── │
│  │ Hilda Schneider (ST)  │  │ +───────────── │
│  │ Lieselotte Svartz (CAM)│  │ nouveau slot  │
│  │ ...                   │  │              │ │
│  └────────────────────────────────────────────┘
```

### 2.3 Interaction

**Drag & drop depuis la liste des disponibles** vers un slot du terrain :
- Le slot affiche en permanence le fit (pastille couleur + label)
- Au survol : tooltip avec les stats modifiées par le malus (avant/après)
- Au drop : call `onChange` avec les nouveaux slots

**Click sur un slot occupé** : désassigne (retourne la joueuse dans la liste) ou propose un menu pour changer.

**Sélecteur de formation** : bascule entre 4-3-3, 4-4-2, 4-2-3-1. Quand la formation change, les joueuses restent assignées si leur nouveau slot existe, sinon reviennent dans la liste.

### 2.4 Preview du malus

Au survol d'un slot, une petite popup (absolute positioned) montre :

```
Soledad Díaz → CAM (poste secondaire)
-10% sur les stats clés du CAM :

             Avant   Après
    passe      62      55
    dribble    97      89
    contrôle   82      73
    décision   74      66
    anticipation 67     60
```

## 3. Intégration avec le Match Lab

Le SquadEditor remplace les simples selects du Phase 8. Le pipeline devient :

```
1. Sélectionner la nation → filtre les CHARACTERS
2. Placer les 11 joueuses sur le terrain (SquadEditor)
3. Pour chaque assignation : applyPositionPenalty(stats, slotPosition12, character)
4. buildTeamInput utilise les stats modifiées
5. simulateMatch reçoit les MatchPlayer avec malus déjà appliqués
```

Le `assignCharactersToSlots()` prévu dans le brief Phase 8 devient optionnel — on peut toujours proposer un bouton « Auto-fill » qui place les joueuses au meilleur poste disponible (fit le plus haut).

## 4. Réutilisation future

**Feature « Mon équipe »** : le même SquadEditor, avec :
- Sauvegarde en DB (`lineups` table existe déjà, champ `assignments`)
- Chargement des vraies cartes possédées (au lieu des CHARACTERS génériques)
- Les cartes ont leur rareté et stats individuelles, mais le malus s'applique pareil

Seule différence : la source des données change (`cardInstances` au lieu de `CHARACTER_STATS`). Le composant ne voit que la liste des joueuses, peu importe leur origine.

## 5. Vérification

```bash
npx tsc --noEmit
```

Test unitaire pour `positionMatch.ts` :

```ts
// Soledad (ST, posSec1=CAM, posSec2=LW)
getPositionFit({ position: "ST", posSec1: "CAM", posSec2: "LW" }, "ST")   // → "perfect"
getPositionFit({ position: "ST", posSec1: "CAM", posSec2: "LW" }, "CAM")  // → "secondary"
getPositionFit({ position: "ST", posSec1: "CAM", posSec2: "LW" }, "RW")   // → "close"  (même groupe ATT)
getPositionFit({ position: "ST", posSec1: "CAM", posSec2: "LW" }, "CB")   // → "off"

// Martina (CDM, posSec1=CM)
getPositionFit({ position: "CDM", posSec1: "CM" }, "CM")                   // → "secondary"
getPositionFit({ position: "CDM", posSec1: "CM" }, "CDM")                  // → "perfect"
getPositionFit({ position: "CDM", posSec1: "CM" }, "CB")                   // → "off"
```

Test visuel : SquadEditor avec 11 persos argentins, placer Soledad en CB → pastille rouge, tooltip montre le malus.
