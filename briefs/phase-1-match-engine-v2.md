# Brief — Phase 1 : Moteur de match v2 (continuum spatial + agrégation complète)

## Objectif

Remplacer l'actuel `matchEngine.ts` (4 phases fixes, moyenne de 2-3 stats, résolution par groupe) par un moteur spatial où :
- Le ballon se déplace sur un continuum 100×100
- Chaque micro-action engage **toutes les stats** pondérées par la zone
- Les joueuses bougent comme des pions FM (continu, fluide)
- Les styles RPS, roles FM, chimie, skills, combos s'intègrent comme des modificateurs de poids

## Fichier cible

**`src/lib/matchEngine.ts`** — réécriture complète. Conserver l'interface `simulateMatch()` pour compatibilité descendante.

---

## 1. Nouvelles interfaces

```typescript
export interface MatchPlayer {
  instanceId: string;
  characterId: string;
  name: string;
  slotId: string;
  group: Position;          // GB/DEF/MIL/ATT
  position12: Position12;   // ST/CB/GK/…
  role: string | null;      // "poacher" | "box_to_box" | null
  style: Style;
  rarity: Rarity;
  stats: Partial<Record<StatKey, number>>;  // 22 outfield ou 18 GK
  baseX: number;  // position de base (formation)
  baseY: number;
  equippedSkills: EquippedSkill[];
  isGK: boolean;
}

export interface BallState {
  x: number;   // 0-100
  y: number;   // 0-100 (0 = camp attaquant, 100 = camp défenseur)
}

export interface PlayerPosition {
  instanceId: string;
  x: number;   // position réelle à cet instant
  y: number;
}

export interface MicroAction {
  ball: BallState;
  positions: PlayerPosition[];  // snapshot des 22 joueuses
  actress: string;              // instanceId de l'actrice
  defender: string;             // instanceId de la défenseure
  attackScore: number;
  defenseScore: number;
  success: boolean;
  phaseKey: string;             // "relance" | "construction" | "milieu" | "progression" | "finition"
}

export interface MatchResult {
  score: Record<string, number>;
  events: MatchEvent[];
  keyframes: Keyframe[];        // chaque micro-action = un keyframe
  microActions: MicroAction[];  // la trace complète
  possession: Record<string, number>;  // possession en %
}
```

## 2. Zones et phaseKey

5 zones définies par le y du ballon :

| y | phaseKey |
|---|----------|
| 0-20 | `"relance"` |
| 20-40 | `"construction"` |
| 40-60 | `"milieu"` |
| 60-80 | `"progression"` |
| 80-100 | `"finition"` |

## 3. Sélection de l'actrice

### 3.1 Score d'intervention (attaque)

Pour chaque joueuse de l'équipe en possession, calculer :

```typescript
function interventionScore(
  player: MatchPlayer,
  ball: BallState,
  allPositions: Map<string, { x: number; y: number }>,
): number {
  const pos = allPositions.get(player.instanceId)!;
  const dist = Math.sqrt((pos.x - ball.x) ** 2 + (pos.y - ball.y) ** 2);
  const proximity = Math.max(0, 1 - dist / 100);
  const zoneMatch = ZONE_MATCH_ATTACK[player.position12]?.[zoneFromY(ball.y)] ?? 0.2;
  const roam = ROLE_ROAM[player.role ?? ""] ?? 0.2;
  return proximity * zoneMatch * (1 + roam);
}
```

### 3.2 Score d'intervention (défense)

```typescript
function defenseInterventionScore(
  player: MatchPlayer,
  ball: BallState,
  allPositions: Map<string, { x: number; y: number }>,
): number {
  const pos = allPositions.get(player.instanceId)!;
  const dist = Math.sqrt((pos.x - ball.x) ** 2 + (pos.y - ball.y) ** 2);
  const proximity = Math.max(0, 1 - dist / 100);
  const zoneMatch = ZONE_MATCH_DEFENSE[player.position12]?.[zoneFromY(ball.y)] ?? 0.2;
  const roam = ROLE_ROAM[player.role ?? ""] ?? 0.2;
  // Bonus mental : anticipation + positionnement aident à "être au bon endroit"
  const anticipationBonus = (player.stats.anticipation ?? 50) / 100;
  const positioningBonus = (player.stats.positionnement ?? 50) / 100;
  const mentalFactor = 0.5 + 0.5 * ((anticipationBonus + positioningBonus) / 2);
  return proximity * zoneMatch * (1 + roam) * mentalFactor;
}
```

### 3.3 Tables de zoneMatch

**ZONE_MATCH_ATTACK[position12][zone]** — à quel point un poste est naturellement actif dans chaque zone :

Voir le tableau dans le brief design :
- GK : 1.0 en relance → 0.0 partout ailleurs
- CB : 1.0 relance → 0.1 progression
- CM : 0.2 relance → 1.0 milieu → 0.9 progression
- ST : 0.0 relance → 0.2 milieu → 1.0 finition
- Winger (LW/RW) : 0.0 relance → 0.5 milieu → 1.0 progression → 0.9 finition

**ZONE_MATCH_DEFENSE[position12][zone]** :
- CB : 0.8 relance → 1.2 construction → 1.0 milieu → 0.4 progression
- FB : 0.5 relance → 0.8 construction/milieu → 1.0 progression (aile)
- CDM : 0.3 relance → 1.0 construction/milieu → 0.7 progression

Ajouter des bonus de **proximité latérale** : si ball.x < 25 ou > 75, les FB et Wingers ont un bonus de zoneMatch de +0.3.

### 3.4 ROLE_ROAM

| Rôle | roam |
|------|:----:|
| (aucun / non défini) | 0.20 |
| gardien | 0.00 |
| sweeper (GK) | 0.30 |
| stopper (CB) | 0.05 |
| ball_playing_defender | 0.15 |
| fullback | 0.25 |
| inverted_wingback | 0.15 |
| anchor | 0.10 |
| deep_lying_playmaker | 0.25 |
| box_to_box | 0.40 |
| regista | 0.30 |
| trequartista | 0.30 |
| winger | 0.30 |
| inside_forward | 0.20 |
| poacher | 0.05 |
| target_man | 0.05 |
| false_nine | 0.50 |
| second_striker | 0.30 |

## 4. Poids des stats par zone

Deux tables complètes : `ZONE_ATTACK_WEIGHTS[zone][stat]` et `ZONE_DEFENSE_WEIGHTS[zone][stat]`.

Valeurs détaillées dans le design (section ci-dessus). À implémenter comme des constantes.

**Règles :**
- Une stat avec poids 0.0 n'est jamais utilisée dans cette zone (Tir en relance)
- Les poids vont de 0.0 à 2.0
- Pour calculer le score zone : `somme(stats[i] × poids[i]) / somme(poids)`
- Le résultat est sur une échelle 0-99 (les stats sont en 1-99)

**Cas GK** : quand la défenseure sélectionnée est `isGK=true`, utiliser `GK_ZONE_WEIGHTS[zone]` au lieu des poids défense standard (uniquement pour la zone finition — les GK n'interviennent pas dans les autres zones sauf sweeper).

## 5. Résolution d'une micro-action

```typescript
function resolveMicroAction(
  actress: MatchPlayer,
  defender: MatchPlayer,
  zone: string,
  ball: BallState,
  rng: () => number,
): { success: boolean; distance: number; newBall: BallState } {
  const attackWeights = actress.isGK ? GK_ATTACK_WEIGHTS[zone] : ZONE_ATTACK_WEIGHTS[zone];
  const defenseWeights = defender.isGK ? GK_DEFENSE_WEIGHTS[zone] : ZONE_DEFENSE_WEIGHTS[zone];

  const attackScore = weightedScore(actress.stats, attackWeights);
  const defenseScore = weightedScore(defender.stats, defenseWeights);

  const ratio = attackScore - defenseScore;
  const k = ZONE_K[zone] ?? 0.35;
  const prob = 1 / (1 + Math.exp(-k * ratio));

  const success = rng() < prob;

  let distance = success ? 10 + rng() * 8 : 0;
  // Si ratio est très large, avance plus
  if (success && ratio > 5) distance *= 1.3;
  if (success && ratio > 10) distance *= 1.5;

  const newX = Math.max(0, Math.min(100, ball.x + (rng() - 0.5) * 30));
  const newY = success
    ? Math.min(100, ball.y + distance)
    : Math.max(0, ball.y - 3); // léger recul sur turnover

  return { success, distance, newBall: { x: newX, y: newY } };
}
```

**ZONE_K** — sensibilité de la sigmoïde par zone :

| Zone | k |
|------|:-:|
| relance | 0.25 |
| construction | 0.30 |
| milieu | 0.35 |
| progression | 0.35 |
| finition | 0.45 |

Plus `k` est haut, plus la différence de stats est décisive. La finition a le `k` le plus haut — logique, c'est là que la qualité individuelle fait la différence.

## 6. Mouvement 2D des joueuses

Après chaque micro-action, mettre à jour la position de **toutes les joueuses** :

```typescript
function updatePositions(
  players: MatchPlayer[],
  ball: BallState,
  currentPositions: Map<string, { x: number; y: number }>,
  attackingTeamId: string,
  event: "possession" | "turnover",
): Map<string, { x: number; y: number }> {
  const newPos = new Map(currentPositions);
  for (const p of players) {
    const roam = ROLE_ROAM[p.role ?? ""] ?? 0.2;
    const t = roam * 0.3;
    const base = { x: p.baseX, y: p.baseY };

    // Sur turnover : repli rapide (t négatif = retour vers base)
    const factor = event === "turnover" ? -0.6 : t;

    newPos.set(p.instanceId, {
      x: base.x + (ball.x - base.x) * factor,
      y: base.y + (ball.y - base.y) * factor,
    });
  }
  return newPos;
}
```

**Contraintes spatiales** (clamping optionnel selon le rôle) :
- GK : y ne descend jamais sous 70 (sauf sweeper)
- CB : y ne descend jamais sous 30 (sauf pressing haut)
- ST : y ne monte jamais au-dessus de 80 (sauf repli défensif)

## 7. Boucle principale de simulation

```typescript
export function simulateMatch(
  home: TeamMatchInput,
  away: TeamMatchInput,
  seed: string,
  maxMicroActions = 120,  // ~6 par séquence × 20 séquences
): MatchResult {
  const rng = makeSeededRng(seed);
  const ball: BallState = { x: 50, y: 20 }; // coup d'envoi

  // Initialiser les positions des 22 joueuses
  const positions = new Map<string, { x: number; y: number }>();
  for (const p of [...home.players, ...away.players]) {
    positions.set(p.instanceId, { x: p.baseX, y: p.baseY });
  }

  // Déterminer quelle équipe commence (pile ou face)
  let attackingTeam: TeamMatchInput = rng() < 0.5 ? home : away;
  let defendingTeam: TeamMatchInput = attackingTeam === home ? away : home;

  const allPositions = [...home.players, ...away.players];
  const microActions: MicroAction[] = [];
  // ...

  for (let step = 0; step < maxMicroActions; step++) {
    const zone = zoneFromY(ball.y);

    // 1. Sélectionner l'actrice
    const actress = selectActor(attackingTeam.players, ball, positions);
    if (!actress) break; // plus personne pour jouer (cas improbable)

    // 2. Sélectionner la défenseure
    const defender = selectDefender(defendingTeam.players, ball, positions);
    if (!defender) {
      // Pas de défenseur = but assuré si en finition
      if (zone === "finition") { but!; break; }
      continue;
    }

    // 3. Résoudre
    const result = resolveMicroAction(actress, defender, zone, ball, rng, timingProvider);

    // 4. Mettre à jour le ballon
    ball.x = result.newBall.x;
    ball.y = result.newBall.y;

    // 5. Mettre à jour les positions
    const event = result.success ? "possession" : "turnover";
    updatePositions(allPositions, ball, positions, attackingTeam.teamId, event);

    // 6. Si turnover : inverser attaque/défense
    if (!result.success) {
      [attackingTeam, defendingTeam] = [defendingTeam, attackingTeam];
    }

    // 7. Si en finition avec succès : BUT
    if (result.success && zone === "finition") {
      // Tir cadré ?
      if (rng() < 0.65) {
        // Arrêt gardienne ?
        const gk = findGK(defendingTeam.players, positions);
        const gkScore = gk ? weightedScore(gk.stats, GK_DEFENSE_WEIGHTS["finition"]) : 0;
        const goalProb = 1 / (1 + Math.exp(-0.5 * (attackScore - gkScore * 0.7)));
        if (rng() < goalProb) {
          score[attackingTeam.teamId]++;
          // BUT : remettre au centre
          ball.x = 50; ball.y = 20;
        }
      }
    }

    // 8. Fatigue : post-60e minute, réduire les stats
    const virtualMinute = (step / maxMicroActions) * 90;
    if (virtualMinute > 60) {
      applyFatigue(allPositions, virtualMinute);
    }
  }

  return { score, events, keyframes, microActions, possession };
}
```

## 8. Modifications RPS

Le style de l'actrice et de la défenseure modifie les poids :

```typescript
function applyStyleModifiers(
  weights: Record<string, number>,
  actress: MatchPlayer,
  defender: MatchPlayer,
  zone: string,
): Record<string, number> {
  const mod = { ...weights };
  const rpsAdvantage = RPS_ADVANTAGE[actress.style] === defender.style;

  // Le style dominant de l'actrice booste certaines stats
  switch (actress.style) {
    case "percussion":
      if (["milieu", "progression"].includes(zone)) {
        mod.puissance *= 1.2; mod.agressivite *= 1.2;
      }
      break;
    case "vista":
      if (["construction", "milieu"].includes(zone)) {
        mod.passe *= 1.2; mod.decision *= 1.2;
      }
      break;
    case "pressing":
      if (["construction", "milieu"].includes(zone)) {
        mod.agressivite *= 1.2; mod.tacle *= 1.2; mod.endurance *= 1.15;
      }
      break;
    case "elevation":
      if (["progression", "finition"].includes(zone)) {
        mod.detente *= 1.3; mod.centre *= 1.2;
      }
      break;
    case "sangFroid":
      if (["finition", "progression"].includes(zone)) {
        mod.tir *= 1.2; mod.sangFroid *= 1.2;
      }
      break;
  }

  // Bonus RPS : si le style de l'actrice bat celui de la défenseure,
  // les poids offensifs sont boostés de 10%
  if (rpsAdvantage) {
    for (const key of Object.keys(mod)) mod[key] *= 1.1;
  }

  return mod;
}
```

## 9. Intégration chimie et skills

**Chimie** : `computeEffectiveStats()` (existant) → l'appliquer AVANT le match pour dériver les stats boostées par la chimie d'équipe. Stocker dans `player.stats`.

**Skills pendant confrontation** : pas dans cette phase. Les skills seront intégrées dans Phase 2 avec le Deck Tactique. Pour l'instant, `equippedSkills` est ignoré par le moteur.

## 10. Interface de sortie (keyframes)

Chaque micro-action produit un keyframe avec :

```typescript
export interface Keyframe {
  step: number;       // numéro de micro-action
  minute: number;     // minute virtuelle (0-90)
  ball: { x: number; y: number };
  positions: { instanceId: string; x: number; y: number }[];  // snapshot 22 joueuses
  actress: string;    // instanceId
  defender: string;
  attackScore: number;
  defenseScore: number;
  outcome: "success" | "turnover" | "goal" | "save";
}
```

## 11. Tests de validation

Après implémentation, vérifier :

1. **Test 1** : match Argentine vs Argentine avec 11 mêmes joueuses → score serré, possession ~50%
2. **Test 2** : match avec gardienne seule (10 outfield supprimés) → défaite garantie, score large adverse
3. **Test 3** : Soledad (93) vs rookies (70) → Soledad domine nettement
4. **Test 4** : même match avec seed identique → résultat identique (déterministe)
5. **Test 5** : RPS — aligner 11 Pressing contre 11 Vista → l'équipe Pressing a plus de turnovers en construction
6. **Test 6** : 100 simulations pour vérifier que les scores ne sont pas aberrants (0-0 à 10-0)

## 12. Dépendances

- Phase 0 ✅ (footballSchema, statGenerator, types alignés)
- `lineupSchema.ts` inchangé (les formations fournissent baseX/baseY)
- `characterStats.ts` inchangé (les styles sont déjà là)
- `TeamMatchInput` et `MatchPlayer` à mettre à jour (ajouter role, baseX, baseY, style, isGK)

## Ordre d'implémentation

1. Nouvelles interfaces + constantes de poids
2. Fonctions `interventionScore()` et `defenseInterventionScore()`
3. Fonction `weightedScore()`
4. Fonction `resolveMicroAction()`
5. Fonction `updatePositions()`
6. Boucle `simulateMatch()` avec gestion du but
7. Intégration RPS (applyStyleModifiers)
8. Keyframes enrichis
9. Script de test (Japon vs Argentine)
10. Itération d'équilibrage des poids
