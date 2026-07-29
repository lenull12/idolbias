# Phase 8 — Match Lab : page de test du match engine (Japon / Allemagne / Argentine)

> Objectif : valider en conditions réelles le fix phase-7 (scaling stats par rareté)
> en faisant s'affronter des équipes complètes générées via notre propre système
> (`generateStatsForRarity`), sans dépendre des cartes réellement possédées.

## Contexte

`simulateMatch()` (`lib/matchEngine.ts`) et `<MatchPitch2D />` (`components/MatchPitch2D.tsx`)
existent déjà mais ne sont appelés **nulle part** dans l'app. On construit une nouvelle vue
qui les connecte, en réutilisant au maximum les briques déjà existantes du système
(`generateStatsForRarity`, `FORMATIONS`, `computeAllLinks`, `FutCard`, `StyledSelect`, etc.)
plutôt que d'inventer de nouveaux composants.

Cette page ne dépend d'aucune carte possédée en DB — elle génère les 22 joueuses
à la volée à partir de `CHARACTER_STATS`, exactement comme le ferait un pull, mais
avec une rareté choisie/randomisée par l'utilisateur plutôt que tirée au hasard par pity.

## Scope nations

Limiter le sélecteur de nation à ces 3 pour l'instant (facilement extensible ensuite) :

```ts
const LAB_NATIONS = ["japon", "allemagne", "argentine"] as const;
```

## Nouvelle vue : `views/MatchLabView.tsx`

Intégrée à l'`AppShell` / `SideNav` comme une vue de plus (nouvel item de nav, éventuellement
marqué "Lab" ou "Debug" pour signaler que c'est un outil de test et pas une feature joueur).

### 1. Configuration par équipe (×2, home / away)

Pour chaque équipe :
- **Nation** : `StyledSelect` parmi `LAB_NATIONS`.
- **Mode de notation** :
  - `fixed` : une seule rareté (`StyledSelect` common→secret) appliquée aux 11 joueuses.
  - `random` : chaque joueuse reçoit une rareté tirée aléatoirement (uniforme sur les 5 tiers,
    ou pondérée façon pack — uniforme suffit pour un outil de test).
- **Bouton 🎲 Randomiser** : re-tire les 11 raretés en mode `random` (nouveau sub-seed).
- **Liste des 11 joueuses** (une fois la nation choisie) : nom, poste, et un petit
  `StyledSelect` individuel de rareté à côté de chacune — permet de **surcharger
  manuellement** n'importe quelle joueuse après un randomize ou un mode fixed
  (le "sélectionnable" en plus du "randomisable").
- **4 sliders tactiques** (`-2` à `2`, défaut `0`) : mentality, defensiveLine, tempo,
  passingDirectness — `<input type="range" min={-2} max={2} step={1} />` suffit, pas besoin
  d'un composant dédié.

### 2. Seed de simulation

- Champ texte + bouton dé, comme discuté précédemment. Le même seed doit permettre de
  rejouer un match identique. Les stats des joueuses sont dérivées de `seed + characterId`
  (voir §3), donc changer uniquement la rareté d'une équipe sur seed fixe isole bien
  l'effet testé.

### 3. Construction des `TeamMatchInput`

Pipeline pur côté client (pas d'appel réseau) :

```ts
import { generateStatsForRarity } from "@/lib/statGenerator";
import { CHARACTER_STATS } from "@/data/characterStats";
import { getCharacters } from "@/data/footballCards"; // pour nation/defaultPosition/photo
import { FORMATIONS, computeAllLinks } from "@/db/lineupSchema";
import type { MatchPlayer, TeamMatchInput } from "@/lib/matchEngine";

function buildTeamInput(
  nation: string,
  ratings: Record<string, Rarity>, // characterId -> rareté choisie/randomisée
  tactics: { mentality: TacticSlider; defensiveLine: TacticSlider; tempo: TacticSlider; passingDirectness: TacticSlider },
  seed: string,
): TeamMatchInput {
  const characters = getCharacters().filter(c => c.nation === nation);
  const formation = FORMATIONS["4-3-3"];

  // Assignation aux slots : d'abord par correspondance de poste (GB/DEF/MIL/ATT),
  // puis on comble les slots restants avec les persos non assignés si la composition
  // de la nation ne tombe pas pile sur 1 GB / 4 DEF / 3 MIL / 3 ATT.
  const assignments = assignCharactersToSlots(characters, formation); // Record<slotId, characterId>

  const players: MatchPlayer[] = formation.map(slot => {
    const characterId = assignments[slot.slotId];
    const cs = CHARACTER_STATS[characterId];
    const rarity = ratings[characterId];
    const gen = generateStatsForRarity(characterId, rarity, seed + "-" + characterId);
    const stats = { ...gen.tec, ...gen.gk, ...gen.phy, ...gen.men, ...gen.setPiece };

    return {
      instanceId: `${nation}-${characterId}-lab`,
      characterId,
      name: characters.find(c => c.id === characterId)!.name,
      slotId: slot.slotId,
      group: slot.position,
      position12: cs.position as Position12,
      role: cs.role ?? null,
      style: cs.style as Style,
      rarity,
      stats,
      tailleCm: gen.tailleCm,
      poidsKg: gen.poidsKg,
      piedPrefere: gen.piedPrefere,
      baseX: slot.x,
      baseY: slot.y,
      equippedSkills: [], // pas de skill cards dans ce lab (todo si besoin plus tard)
      isGK: cs.isGK,
    };
  });

  const instancesMap = new Map(players.map(p => [p.instanceId, { id: p.instanceId, nation: nation as Nation, position: p.group }]));
  const links = computeAllLinks(formation, assignments_by_instanceId, instancesMap, new Map())
    .map(l => ({ slotIdA: l.slotIdA, slotIdB: l.slotIdB, color: l.color }));

  return {
    teamId: nation,
    players,
    formation,
    links,
    activeSynergyAbilityIds: [],
    ...tactics,
  };
}
```

**Note d'implémentation** : `computeAllLinks` attend un `Record<slotId, instanceId>` pas
`Record<slotId, characterId>` — bien faire la conversion (`assignments_by_instanceId`)
avant l'appel. Le `pairsByKey` reste une `Map()` vide ici : pas d'historique de matchs
joués ensemble dans ce lab, donc le bonus chemistry "matches joués ensemble" ne s'active
jamais — c'est attendu, pas un bug.

**Fonction `assignCharactersToSlots`** (à écrire) : grouper les 11 persos de la nation par
`defaultPosition`, assigner en priorité les slots du même poste, puis distribuer le reste
par ordre si un poste est en sur/sous-effectif par rapport à la 4-3-3 (ex. une nation
avec seulement 3 DEF et 5 MIL). Logger un `console.warn` si un remplacement de poste a
eu lieu, pour que ce soit visible pendant les tests.

### 4. Lancement et affichage

```ts
const result = simulateMatch(homeInput, awayInput, seed);
```

- `<MatchPitch2D result={result} homeTeamId={homeInput.teamId} awayTeamId={awayInput.teamId} homeLabel={...} awayLabel={...} />`
  pour la relecture animée (le composant gère déjà tout : ballon, positions, événements).
- À côté : panneau texte (réutiliser le style `SystemWindow`) avec :
  - score final, possession %
  - liste des `events` (déjà formatée par la logique `eventLabel` présente dans `MatchPitch2D` —
    factoriser cette fonction en export partagé si on veut l'afficher aussi hors du canvas)
  - roster des 22 joueuses avec rareté + OVR retenu, pour vérifier d'un coup d'œil que le
    scaling phase-7 a produit ce qui était attendu.

### 5. Mode batch (validation statistique du fix phase-7)

Bouton **"Simuler N matchs"** (N = 50 par défaut, configurable) :

```ts
function runBatch(homeConfig, awayConfig, n: number) {
  let winsHome = 0, winsAway = 0, draws = 0, goalsHome = 0, goalsAway = 0;
  for (let i = 0; i < n; i++) {
    const seed = `batch-${i}-${Date.now()}`;
    const home = buildTeamInput(homeConfig.nation, homeConfig.ratings, homeConfig.tactics, seed);
    const away = buildTeamInput(awayConfig.nation, awayConfig.ratings, awayConfig.tactics, seed);
    const result = simulateMatch(home, away, seed);
    const sh = result.score[home.teamId], sa = result.score[away.teamId];
    goalsHome += sh; goalsAway += sa;
    if (sh > sa) winsHome++; else if (sa > sh) winsAway++; else draws++;
  }
  return { winsHome, winsAway, draws, avgGoalsHome: goalsHome / n, avgGoalsAway: goalsAway / n };
}
```

Pas d'animation ici, pas de `<MatchPitch2D />` — juste le calcul (rapide, tout est en mémoire)
et un tableau récap. C'est l'outil de validation le plus fiable : configurer par exemple
"Japon secret fixe" vs "Argentine common fixe" sur le même formation/tactiques, lancer
50-100 matchs, et vérifier que l'écart de victoires est net. Si l'écart reste faible malgré
un delta de rareté aussi extrême, ça indique que le scaling stats ne pèse pas assez sur
l'issue du match dans `matchEngine.ts` (à creuser séparément si observé).

## Fichiers à créer/modifier

- `views/MatchLabView.tsx` (nouveau) — la vue complète
- `lib/matchLabTeamBuilder.ts` (nouveau) — `buildTeamInput`, `assignCharactersToSlots`,
  `runBatch` (logique pure, testable indépendamment de la vue)
- `components/AppShell.tsx` / `components/SideNav.tsx` — ajouter l'entrée de nav vers le lab
- `components/MatchPitch2D.tsx` — extraire `eventLabel()` en export nommé si on veut
  réutiliser le même libellé d'événement dans le panneau texte du lab

## Hors scope (à ne pas faire dans ce brief)

- Pas de sauvegarde de lineup en DB (`lineups` table inchangée)
- Pas de skill cards / synergies actives dans ce lab
- Pas d'autres nations que Japon/Allemagne/Argentine pour l'instant (trivial à étendre ensuite,
  juste élargir `LAB_NATIONS`)
- Pas de lien avec les vraies cartes possédées — c'est volontairement un outil de test
  système, pas un prototype de la feature "mon équipe" (même si les briques réutilisées
  serviront aussi à cette feature plus tard)

## Vérification

```bash
npx tsc --noEmit
```

Test manuel : Japon (secret, fixe) vs Argentine (common, fixe), seed fixe, lancer un match
animé → vérifier que les stats affichées dans le roster reflètent bien le scaling phase-7
(dribble d'une secret proche de sa valeur de base, dribble d'une common nettement en dessous).
Puis lancer le mode batch 50 matchs sur la même config pour confirmer que l'écart de rareté
se traduit en écart de victoires.
