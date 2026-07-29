# Phase 9 — Fondations du moteur spatial

> Première brique de la refonte globale du match engine (roadmap phases 9→15).
> Objectif de cette phase, et RIEN d'autre : prouver le pipeline position-réelle→rendu.
> Pas d'IA de décision, pas de physique de balle, pas de duels. Ça vient après.

## Principe directeur

Le moteur actuel (`matchEngine.ts`) décide tout par zones abstraites, et les positions
x/y sont calculées après coup pour l'affichage (`updatePositions`), sans influencer
aucune probabilité. Cette phase pose l'architecture inverse : des positions réelles,
mises à jour à chaque tick, qui **deviendront** (dès la phase 11) la cause des
événements — mais pour l'instant on se contente de faire vivre les 22 joueuses et le
ballon dans un espace cohérent, sans toucher à la logique de décision.

**Le moteur actuel n'est pas touché.** Nouveau fichier séparé, sélectionnable, pour
permettre la comparaison A/B via le lab (phase 15).

## 1. Système de coordonnées : mètres, pas pourcentage

Terrain réglementaire : **105 m × 68 m**. Toutes les positions/vitesses/durées internes
sont en mètres et secondes — condition nécessaire pour que la physique de balle (phase 10)
ait un sens réel (gravité en m/s², vitesse de tir en m/s).

La conversion en 0–100 (pour compat avec `Keyframe.ball`/`positions` existants et le
rendu) se fait **uniquement en sortie**, jamais en interne :

```ts
const PITCH_LENGTH_M = 105;
const PITCH_WIDTH_M = 68;

function toPercent(pos: Vector2): { x: number; y: number } {
  return { x: (pos.x / PITCH_LENGTH_M) * 100, y: (pos.y / PITCH_WIDTH_M) * 100 };
}
function fromPercent(x01: number, y01: number): Vector2 {
  return { x: (x01 / 100) * PITCH_LENGTH_M, y: (y01 / 100) * PITCH_WIDTH_M };
}
```

## 2. Nouveau fichier : `lib/spatialEngine.ts`

### Types de base

```ts
export interface Vector2 { x: number; y: number; }

export interface SpatialPlayerState {
  instanceId: string;
  pos: Vector2;
  vel: Vector2;        // m/s
  targetPos: Vector2;  // position désirée ce tick (cf §3)
}

export interface SpatialBallState {
  pos: Vector2;
  vel: Vector2;
  height: number;       // m, 0 = au sol — posé ici pour préparer la phase 10, inutilisé pour l'instant (toujours 0)
  ownerInstanceId: string | null;
}

export interface SpatialTick {
  t: number;            // secondes écoulées dans le match simulé
  minute: number;        // dérivé de t, pour compat avec l'affichage existant
  players: SpatialPlayerState[];
  ball: SpatialBallState;
}
```

### Boucle à ticks

```ts
export const TICK_DT = 0.5; // secondes simulées par tick — 90min = 180 ticks. Ajustable si besoin de plus de fluidité (0.25) au prix du volume de données.

export function runSpatialSimulation(
  home: TeamMatchInput,
  away: TeamMatchInput,
  seed: string,
  durationMinutes = 90,
): SpatialTick[] {
  const rng = makeSeededRng(seed); // réutiliser l'implémentation existante de matchEngine.ts (même algo, l'exporter si besoin)
  const totalTicks = Math.round((durationMinutes * 60) / TICK_DT);

  let state = initState(home, away); // positions de départ = formation de base, ballon au centre
  const ticks: SpatialTick[] = [snapshot(state, 0)];

  for (let i = 1; i <= totalTicks; i++) {
    const t = i * TICK_DT;
    state = stepOnce(state, home, away, t, rng);
    ticks.push(snapshot(state, t));
  }
  return ticks;
}
```

`stepOnce` pour cette phase fait uniquement :
1. Calculer `targetPos` de chaque joueuse via `computeDesiredPosition` (§3)
2. Déplacer chaque joueuse vers son `targetPos` avec une vitesse plafonnée réaliste
   (voir §4 — pas de téléportation, pas de dépassement du bord du terrain)
3. **Le ballon reste statique au centre pour cette phase** (`vel = {0,0}`, pas de
   porteur assigné) — la physique de balle et la possession arrivent en phase 10.
   Le but ici est uniquement de valider que 22 joueuses se déplacent de façon cohérente
   sur 90 minutes sans bug de bord.

## 3. Position désirée — réimplémentation causale de `updatePositions`

Reprend l'intention de l'actuel `updatePositions` (forme d'équipe qui suit le ballon),
mais en **mètres réels**, avec un plafond de vitesse physique (§4), et surtout : cette
fonction est écrite pour être **le futur point d'entrée de l'IA de décision** (phase 11),
pas juste un habillage visuel.

```ts
function computeDesiredPosition(
  player: MatchPlayer,
  basePos: Vector2,          // formation.slot converti en mètres
  ballPos: Vector2,
  tactics: { defensiveLine: TacticSlider; mentality: TacticSlider },
): Vector2 {
  const roamFactor = roam(player); // fonction existante, réutilisable telle quelle
  // Défensive line : décale le bloc d'équipe vers l'avant/arrière selon le slider,
  // borné pour ne jamais sortir du terrain (voir clamp §4).
  const lineShift = tactics.defensiveLine * 3; // 3m par cran, ajustable après tests
  const shifted = { x: basePos.x + lineShift, y: basePos.y };
  const pull = 0.15 * roamFactor; // attraction vers le ballon, modeste — pas de sprint general vers la balle à ce stade
  return {
    x: shifted.x + (ballPos.x - shifted.x) * pull,
    y: shifted.y + (ballPos.y - shifted.y) * pull,
  };
}
```

## 4. Déplacement physique plausible (pas de téléportation)

Point central de cette phase — c'est ce qui corrige concrètement le bug "les joueuses
sortent du terrain" et le côté saccadé observé dans le rendu actuel :

```ts
const MAX_PLAYER_SPEED = 7.5; // m/s, sprint réaliste ~27km/h — vitesse/endurance module ce plafond individuellement (branché en phase 11, fixe pour l'instant)

function movePlayerTick(current: SpatialPlayerState, dt: number): SpatialPlayerState {
  const dx = current.targetPos.x - current.pos.x;
  const dy = current.targetPos.y - current.pos.y;
  const dist = Math.hypot(dx, dy);
  const maxStep = MAX_PLAYER_SPEED * dt;

  const moveX = dist > 0 ? (dx / dist) * Math.min(dist, maxStep) : 0;
  const moveY = dist > 0 ? (dy / dist) * Math.min(dist, maxStep) : 0;

  const nextPos = clampToPitch({ x: current.pos.x + moveX, y: current.pos.y + moveY });
  return { ...current, pos: nextPos, vel: { x: moveX / dt, y: moveY / dt } };
}

function clampToPitch(pos: Vector2): Vector2 {
  return {
    x: Math.max(0.5, Math.min(PITCH_LENGTH_M - 0.5, pos.x)),
    y: Math.max(0.5, Math.min(PITCH_WIDTH_M - 0.5, pos.y)),
  };
}
```

Le plafond de vitesse est **la** correction structurelle : plus aucune position ne peut
"sauter" d'un bout à l'autre du terrain en un tick, ce qui réglera de fait le rendu
saccadé une fois branché à la phase 14. `clampToPitch` avec une marge de 0.5m couvre le
bug de bord identifié précédemment (pas de dépendance au clamp bricolé de l'ancien moteur).

## 5. Compat de sortie — pont vers le rendu existant

Pour pouvoir tester cette phase **dans le lab dès maintenant**, sans attendre Phaser
(phase 14), ajouter une fonction de conversion `SpatialTick[] → Keyframe[]` :

```ts
export function spatialTicksToKeyframes(ticks: SpatialTick[]): Keyframe[] {
  return ticks.map((tick, i) => ({
    step: i,
    minute: Math.floor(tick.minute),
    ball: toPercent(tick.ball.pos),
    positions: tick.players.map(p => ({ instanceId: p.instanceId, ...toPercent(p.pos) })),
    actress: "", defender: "", attackScore: 0, defenseScore: 0,
    outcome: "success",
  }));
}
```

Ça permet de brancher le résultat direct dans le `<MatchPitch2D>` **actuel** (celui déjà
en place, avec ses défauts de mapping qu'on corrigera séparément) pour valider
visuellement, tout de suite, que 22 points bougent de façon fluide et réaliste sur
90 minutes — avant même de toucher au rendu Phaser.

**Important** : `<MatchPitch2D>` attend un `result: MatchResult` complet (il lit
`result.score[homeTeamId]` dans `handleSkipToResult`, `result.events` dans `step()`),
pas juste un tableau de `Keyframe`. `spatialTicksToKeyframes` seule ne suffit donc pas
pour brancher sur le composant existant — il faut l'envelopper :

```ts
export function spatialToMatchResult(
  ticks: SpatialTick[],
  homeTeamId: string,
  awayTeamId: string,
): MatchResult {
  return {
    score: { [homeTeamId]: 0, [awayTeamId]: 0 }, // pas de score en phase 9, volontairement 0-0
    events: [],                                    // pas d'événements avant la phase 11 (décision) / 13 (buts)
    keyframes: spatialTicksToKeyframes(ticks),
    microActions: [],
    possession: { [homeTeamId]: 50, [awayTeamId]: 50 },
  };
}
```

C'est cette fonction (pas `spatialTicksToKeyframes` seule) que le toggle du lab doit
appeler pour nourrir `<MatchPitch2D>` en mode "Spatial (beta)".

## 6. Intégration au lab (`MatchLabView.tsx` / `matchLabTeamBuilder.ts`)

- Ajouter un toggle **"Moteur : Zones (actuel) / Spatial (beta)"**.
- En mode spatial : appeler `runSpatialSimulation` + `spatialTicksToKeyframes`, ignorer
  `simulateMatch` classique. **Aucun score n'est produit à ce stade** (pas de logique
  de but) — afficher clairement "Phase 9 : test de mouvement uniquement, pas de score"
  dans l'UI pour ne pas confondre les deux modes pendant les tests.
- Le mode batch (N simulations) reste branché uniquement sur l'ancien moteur pour
  l'instant — inutile sur le spatial tant qu'il n'y a pas d'issue de match à agréger.

## Hors scope (phases suivantes, ne pas anticiper)

- Physique de ballon, possession, passes → phase 10
- IA de décision (dribble/passe/tir) → phase 11
- Duels de proximité, pressing → phase 12
- Tirs/arrêts/coups de pied arrêtés dans le contexte spatial → phase 13
- Rendu Phaser → phase 14

## Vérification

```bash
npx tsc --noEmit
```

Test manuel dans le lab, mode "Spatial (beta)" : lancer une simulation Japon vs
Allemagne, observer dans `<MatchPitch2D>` que :
1. Aucune joueuse ne sort visuellement du rectangle du terrain sur toute la durée
2. Le mouvement reste fluide (pas de saut brusque d'un tick à l'autre) même quand
   `defensiveLine` est poussé à `+2`/`-2` sur les deux équipes
3. Le GK reste bien dans sa moitié de terrain, les latérales ne dérivent pas vers
   le centre de façon absurde (bon signe que `computeDesiredPosition` respecte
   la forme d'équipe)

Si le mouvement est déjà convaincant à ce stade (avant même passes/tirs/duels), c'est
le signal qu'on peut enchaîner sereinement sur la phase 10.
