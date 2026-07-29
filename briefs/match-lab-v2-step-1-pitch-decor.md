# Match Lab v2 — Étape 1 : décor du terrain (Phaser, statique, sans données)

> Nouvelle base, indépendante de l'ancien `MatchLabView.tsx` / `MatchPitch2D.tsx` /
> `matchEngine.ts`, qu'on laisse de côté pour l'instant (pas supprimés, juste non
> réutilisés dans cette V2 sauf décision contraire plus tard).
>
> Objectif de cette étape, et rien d'autre : un terrain qui a l'air pro, à l'arrêt,
> sans aucune joueuse ni ballon. Validation purement visuelle avant de brancher quoi
> que ce soit dessus.

## Pourquoi Phaser et pas canvas 2D fait main

Décidé précédemment dans la conversation : Phaser s'intègre comme une lib JS normale
dans un composant React (montée en `useEffect`, détruite au unmount), gère nativement
les sprites teintés par équipe et les tweens — pas besoin de tout réécrire à la main
comme le faisait l'ancien `MatchPitch2D.tsx`.

## Installation

```bash
npm install phaser
```

## Le piège à éviter absolument : SSR

Phaser touche `window`/`document` dès son import. Dans Next.js, **jamais d'import
direct en haut de fichier** d'un composant qui peut être rendu côté serveur — toujours
un `dynamic import` avec `ssr: false` :

```tsx
// components/PitchCanvas.tsx
"use client";
import dynamic from "next/dynamic";

const PitchCanvasInner = dynamic(() => import("./PitchCanvasInner"), { ssr: false });

export default function PitchCanvas(props: PitchCanvasProps) {
  return <PitchCanvasInner {...props} />;
}
```

`PitchCanvasInner.tsx` est le seul fichier qui `import Phaser from "phaser"` en haut de
fichier — jamais `PitchCanvas.tsx` lui-même.

## Système de coordonnées (à respecter dès maintenant, pour éviter le bug de mapping précédent)

Tout le contenu du terrain (lignes, cages, etc.) est positionné en **pourcentage du
terrain réel** (0–100 en x, 0–100 en y), puis converti en pixels canvas via une fonction
unique — c'était l'absence de cette conversion partagée qui causait le bug "les
joueuses sortent du terrain" dans l'ancienne version. On la pose dès le décor, pas
après coup :

```ts
export const PITCH_MARGIN_X = 0.04; // 4% de marge de chaque côté, pour les panneaux pub
export const PITCH_MARGIN_Y = 0.05;

export function pitchToScreen(x01: number, y01: number, w: number, h: number) {
  const px = w * PITCH_MARGIN_X + (x01 / 100) * (w * (1 - 2 * PITCH_MARGIN_X));
  const py = h * PITCH_MARGIN_Y + (y01 / 100) * (h * (1 - 2 * PITCH_MARGIN_Y));
  return { x: px, y: py };
}
```

Toute donnée de joueuse/ballon qui sera branchée plus tard (étape 3+) devra passer par
cette même fonction — un seul point de conversion pour tout le monde.

## Orientation

Deux usages prévus : l'écran tactique (terrain vertical, comme FM) et l'écran de match
(terrain horizontal plein écran). Le décor doit accepter un paramètre d'orientation
plutôt que d'être dupliqué :

```ts
export interface PitchDecorConfig {
  orientation: "vertical" | "horizontal";
  width: number;
  height: number;
}
```

Si `orientation === "vertical"`, le terrain 105×68 est simplement tourné à 90° dans le
calcul de mapping (x et y inversés) — pas deux systèmes de dessin séparés, un seul jeu
de fonctions de tracé, appelé avec les dimensions inversées selon le cas.

## `scenes/PitchScene.ts` — contenu du décor

Une seule `Phaser.Scene`, créée dans `preload()`/`create()`, qui dessine dans l'ordre
(du fond vers l'avant-plan) :

### 1. Tribunes suggérées (fond, hors terrain)
Rectangles en dégradé gris-bleu foncé sur les 4 bords extérieurs, avec un motif de
points semi-aléatoires (couleurs variées, faible opacité) pour suggérer une foule sans
avoir à dessiner de vrais visages — un `Phaser.GameObjects.Graphics` avec quelques
centaines de petits cercles positionnés par bruit pseudo-aléatoire (seed fixe, pas
besoin d'aléatoire différent à chaque partie) suffit largement à l'effet.

### 2. Bancs de touche
Deux rectangles arrondis gris/bleu foncé, positionnés le long de la ligne médiane, à
l'extérieur du terrain (dans la marge), un par équipe — un de chaque côté de la ligne
médiane pour bien les distinguer.

### 3. Panneaux publicitaires
Une bande continue le long des deux touches (dans la marge `PITCH_MARGIN`), découpée en
blocs de couleur alternés. Reprendre la palette Y2K du reste de l'app (`HOLO_GRADIENT`
de `futConfig.ts`) sur 2-3 des blocs pour un clin d'œil cohérent avec l'identité
visuelle du jeu plutôt que des pubs génériques inventées.

### 4. Pelouse avec bandes de tonte
Alterner deux teintes de vert (`#4a9c3f` / `#579e46` par exemple) en bandes parallèles à
la largeur du terrain (perpendiculaires au sens du jeu), ~8-10 bandes — c'est ce détail,
plus que n'importe quel autre, qui change le plus la perception "jeu de 95" → "jeu pro".

### 5. Lignes réglementaires complètes (pas juste le rectangle + rond central actuel)
- Ligne de touche + ligne de but (rectangle extérieur)
- Ligne médiane + rond central + point central
- Surface de réparation (16.5m) + surface de but (5.5m) aux deux extrémités
- Point de penalty + arc de cercle de la surface de réparation
- Arcs de corner (petits quarts de cercle aux 4 coins)

Toutes ces lignes sont des rectangles/arcs simples en pourcentage du terrain (les
dimensions réglementaires 105×68m donnent des ratios fixes, calculables une fois et
codés en dur — ex. surface de réparation = 16.5m de profondeur = 16.5/105 ≈ 15.7% de la
longueur du terrain).

### 6. Cages avec poteaux + filet
Le point le plus "visuel" du brief. Dessiner :
- Deux poteaux verticaux + une barre transversale (rectangles blancs fins, légère
  épaisseur pour donner du volume plutôt qu'un simple trait de 1px)
- Un filet : grille de lignes fines (croisillons horizontaux/verticaux à intervalle
  régulier, opacité ~40%) à l'intérieur du rectangle de la cage, avec un léger effet de
  profondeur — décaler l'arrière du filet de quelques pixels vers l'intérieur du terrain
  et relier les coins par des lignes obliques, pour suggérer le volume sans faire de
  vraie 3D.

### 7. Poteaux de corner
Un petit piquet fin + un petit fanion de couleur à chacun des 4 coins.

## Fichier de preview isolé (pour juger le décor seul, avant tout branchement)

`views/PitchDecorPreviewView.tsx` — une vue minimale, accessible temporairement dans le
lab (ou même juste un lien direct pendant le dev), qui monte `<PitchCanvas orientation="horizontal">`
seule, plein cadre, sans aucune donnée. Sert uniquement à juger/itérer sur le rendu
visuel avant de passer à l'étape 2 (écran tactique).

## Hors scope pour cette étape

- Aucune joueuse, aucun ballon, aucune donnée de match
- Pas encore d'écran tactique ni d'écran de match complet (étapes 2 et 3)
- Pas de reconnexion au générateur d'équipes ni au moteur (étape 4+)

## Vérification

```bash
npx tsc --noEmit
npm run dev
```

Ouvrir `PitchDecorPreviewView`, juger à l'œil : les deux orientations (vertical/
horizontal), zoom in sur les cages et les bandes de pelouse en particulier — ce sont
les deux détails qui font la différence perçue de qualité.
