# IdolBias — Football Gacha Game

> **Domaine :** idolbias.com
> **Tagline :** *Where idols come to life. Your next bias, one pull away.*
> **Statut :** MVP (pré-lancement) — Pivot football effectué juillet 2026

---

## Concept

Jeu de cartes gacha football féminin (inspiration Olive & Tom). 33 joueuses réparties en 3 nations (Argentine, Japon, Allemagne). Collection de cartes avec raretés, stats individuelles, système de gacha, et moteur de match spatial.

## Système de Jeu

### Architecture Stats
- **22 stats OUTFIELD** : 6 PHY + 6 MEN + 6 TECH + 4 SET-PIECE
- **18 stats GK** : 6 PHY + 6 MEN + 6 TECH GK
- TECH split exclusif OUTFIELD vs GK
- Scale : 1-99

### 12 Postes
GK, RB, LB, CB, CDM, CM, CAM, LM, RM, LW, RW, ST
SS = rôle FM (second_striker), pas un poste

### 5 Styles RPS
Percussion / Vista / Pressing / Élévation / Sang-froid

### Génération Stats (System B)
- **Base** : saisie manuelle dans Excel, capée 93
- **OVR par rareté** : `OVR = min(99, round(base × FRAC + jitter))`, jitter ±3
  - FRAC : common 0.78 / rare 0.85 / epic 0.91 / legendary 1.00 / secret 1.12
- Pipeline : Excel → `_export_excel_to_ts.py` → `src/data/characterStats.ts`

### Tirage 2 Étapes
- Perso d'abord (STAR_PERSO_BASE=0.15, BANNER_FEATURED_SHARE=0.60, PITY_PERSO=30)
- Rareté ensuite (HARD_PITY=50 → legendary+)
- Pack = 5 cartes. Bundle 5 packs −20%.

### Raretés & Sérialisation
- common (50%) → rare (30%) → epic (14%) → legendary (5%) → secret (1%)
- Serial cosmétique sur toutes les raretés
- Mint caps : legendary=1000, secret=100, autres illimitées
- Cap full → serial=null (pas de blocage)

## Match Engine (v0.2)

### Architecture
- **Modèle spatial 100×100** : ballon en (x,y), 4 phases (relance→construction→milieu→progression→finition)
- **~60 micro-actions/match**, 18-24 séquences de possession
- **Résolution** : sigmoïde `1/(1+exp(-k*(attack-defense)))` avec ZONE_K=0.20
- **Sélection** par proximité × zoneMatch(position, zone) × implication × roam

### Fonctionnalités Implémentées
- Forme du jour PES-style (5 niveaux, −6% à +6%)
- Momentum post-but (+5% stats 5 min)
- Fatigue catégorielle (PHY 1.4 / MEN 0.8 / TEC 0.6 / SP 0.4)
- Chaîne centre→tête
- Actions de génie (flair, succès 85-95%)
- RPS (5 styles, bonus 1.1× en avantage)
- Hors-jeu (probabiliste, rare)
- Cartons (jaune, 2e jaune, rouge direct + remplacement GK)
- Événements rares (frappe lointaine 5%, erreur 2%)
- Penalty / Coup franc / Corner
- Contre-attaque (space behind > 10)
- Touche (long throw 3% si >70)
- xG-like (distance × angle)
- 4 sliders tactiques : mentality, tempo, directness, ligne défensive
- Rôles FM (poacher, false_nine, box_to_box, regista, etc.)

### Limitations Actuelles
- Trop stat-dépendant (comparateur de stats, pas simulateur de foot)
- Tests uniquement manuels (0 fichier .test.ts)
- Hors-jeu inopérant avec modèle spatial actuel
- Aucun système d'événements narratifs

## Match Engine (v0.2) — Détails Techniques

### Phases de Possession
```
relance (y≤20) → construction (y≤40) → milieu (y≤60) → progression (y≤80) → finition (y≤100)
```

### Poids par Zone (Attaque)
| Zone | Stats Clés |
|------|-----------|
| relance | passe 2.0, controle 1.5, decision 1.5 |
| construction | passe 2.0, controle 1.5, decision 1.5, dribble 1.0 |
| milieu | passe 1.5, dribble 1.5, controle 1.2, decision 1.2 |
| progression | dribble 2.0, vitesse 1.5, acceleration 1.5, centre 1.0 |
| finition | tir 2.0, sangFroid 1.5, detente 1.0, decision 1.0 |

### Poids par Zone (Défense)
| Zone | Stats Clés |
|------|-----------|
| relance | positionnement 1.5, tacle 1.0, anticipation 1.0 |
| construction | positionnement 1.5, tacle 1.5, anticipation 1.2 |
| milieu | tacle 1.5, anticipation 1.5, positionnement 1.2 |
| progression | tacle 1.5, positionnement 1.5, vitesse 1.0 |
| finition | anticipation 1.5, positionnement 1.5, agilite 1.2 |

### GK Weights
- **GK_ATTACK** : kicking/decision/sangFroid en relance/construction
- **GK_DEFENSE** : reflexes/handling/commandArea/aerialReach en finition (1.0-2.0). Vides en relance/construction (corrigé)

## Économie & Monétisation

### Gem Shop (6 Packs)
| Prix | Gems | Bonus | 💎/€ |
|------|------|-------|------|
| 1,99€ | 200 | 0% | 100 |
| 4,99€ | 550 | +10% | 110 |
| 9,99€ | 1 200 | +20% | 120 ★ POPULAR |
| 19,99€ | 2 500 | +25% | 125 |
| 49,99€ | 6 500 | +30% | 130 |
| 99,99€ | 14 000 | +40% | 140 ★ BEST VALUE |

### Packs de Cartes
- Packs achetables en tickets ou gems
- 5 cartes par pull (CARDS_PER_PACK = 5)
- Bundle 5 packs = −20%
- Packs standards, limited, discount selon les events

### Trading
- Échange direct P2P dans WorkshopView
- Fusion : Dust → carte
- Marketplace (V2) : commission 5-10%

## Architecture Technique

### Stack
| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 |
| Auth | Better Auth (Google OAuth + email/mot de passe) |
| Base de données | Cloudflare D1 (SQLite serverless) |
| ORM | Drizzle ORM |
| Paiement | Stripe (Checkout Sessions + Webhooks) |
| Emails | Resend (reset password) |
| Stockage | Cloudflare R2 |
| Génération images | ComfyUI + Illustrious / SD.Next (Vlad Mandic) |
| Déploiement | Cloudflare Workers via wrangler + OpenNext |

### Structure Projet
```
src/
├── app/api/          # Routes API (pack, missions, shop, auth, market, player...)
├── data/
│   ├── characterStats.ts  # AUTO-GEN from Excel — stats des 33 persos
│   └── footballCards.ts   # SOURCE OF TRUTH — personnages, prints, packs, drop rates
├── db/
│   ├── footballSchema.ts  # Tables football (card_instances, card_prints, skill_cards...)
│   └── schema.ts          # Tables core (players, wallets, progression, owned_cards...)
├── lib/
│   ├── gachaEngine.ts     # Tirage 2 étapes (personnage → rareté)
│   ├── statGenerator.ts   # Application System B (FRAC × base + jitter)
│   ├── matchEngine.ts     # Moteur de match spatial (1500 lignes)
│   ├── pullConfig.ts      # CARDS_PER_PACK, BUNDLE_DISCOUNT, HARD_PITY
│   └── gameConfig.ts      # Missions, raretés, craft, strea
```

## Roster Actuel (33 Joueuses)

### Argentine (11)
Soledad Díaz (ST), Valentina Giménez (ST), Renata Navarro (LM), Catalina Navarro (RM), Martina Romero (CDM), Roxy Cabrera (CM), Celeste Benítez (RB), Melina Soria (LB), Pilar Roldán (CB), Mercedes Pérez (CB), Esperanza Galván (GK)

### Japon (11)
Karen Himekami (ST), Shiori Saonji (CAM), Reika Shinomiya (LW), Miyabi Kirishima (RW), Hina Tsukiyomi (CDM), Hana Kamishiro (CDM), Momo Hasegawa (LB), Rin Morishita (RB), Yuriko Ōtake (CB), Aya Mishima (CB), Hinata Shigaki (GK)

### Allemagne (11)
Valerie Weiss (ST), Hilda Schneider (ST), Lieselotte Schwarz (CAM), Klara Richter (CAM), Greta von Kaiser (CDM), Sigrid Lindner (CDM), Marlene Weber (RB), Astrid Vogel (LB), Ilse Wallner (CB), Greta Hoffmann (CB), Brunhilde Jaeger (GK)

## Déploiement

```bash
cd ~/idolbias && bash scripts/deploy.sh
```
Pas de Cloudflare Pages — utilisation de `wrangler deploy` avec OpenNext pour le build worker.

## Bugs Connus à Corriger (Audit juillet 2026)

### 🔴 Critique
- **statGenerator.ts** : les stats individuelles (tec/phy/men/gk/setPiece) ne sont PAS scalées par FRAC[rarity]. Common et Secret ont les mêmes stats de jeu. Seul l'OVR d'affichage change.
- **OVR_BAND jamais appliqué** : `clampOVRToRarityBand()` existe dans footballSchema.ts mais n'est appelé nulle part.
- **lifetime/claim** : `collect_legendary` compte les MIL (position) au lieu des legendary (rareté). `collect_secret` compte les ATT. Copier-coller raté.

### 🟠 Élevé
- **lifetime/claim** : pas de SQL guard contre le double-claim concurrent (JS check only).
- **player/claim-gift** : pas de `WHERE welcomePackClaimedAt IS NULL` sur l'update.
- **market-transfer/list** : TOCTOU (SELECT → INSERT sans contrainte UNIQUE DB) + buy ne vérifie pas que la carte appartient toujours au vendeur.

### 🟡 Moyen
- **gachaEngine.ts** : print fallback peut rétrograder silencieusement une pity garantie. `continue` peut rendre un pack x5 avec <5 cartes.
- `_progress` paramètre inutilisé dans generatePull.

### 🟢 Mineur
- FAQ page : toutes les réponses "TODO"
- futConfig.ts : chemins d'assets TODO

## Décisions Prisses Récentes

| Date | Décision |
|------|----------|
| 2026-07-23 | Pack = 5 cartes. Bundle 5 packs -20%. Abandon soft-pity. batchSeed anti-collision. |
| 2026-07-23 | 12 postes (pas 13). SS = rôle FM. Group DB : toGroup() conversion. |
| 2026-07-23 | Serial universel (toutes raretés). Mint cap = legendary 1000 / secret 100. Cap → serial=null |
| 2026-07-23 | System B : FRAC 0.78/0.85/0.91/1.00/1.12 + jitter ±3 |
| 2026-07-24 | Forme du jour PES-style (≠ grade). Grade = cosmétique (sera supprimé). |
| 2026-07-24 | Match engine : trop stat-dépendant. Priorité : forme, k variable, événements rares. |
| 2026-07-24 | Hors-jeu implémenté puis abandonné (incompatible modèle spatial). |
| 2026-07-24 | Blessures/cartons mis de côté. |
| 2026-07-25 | Allemagne ajoutée (33 joueuses). Plancher de chance rejeté. Ciblage de stars rejeté. |
| 2026-07-25 | Phase 6b : technique (meta-stat), workRate, flair, concentration, complementBonus. |
