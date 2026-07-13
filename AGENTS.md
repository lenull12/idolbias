# IdolBias — Gacha de Photocards d'Idols Virtuelles

> **Domaine :** idolbias.com  
> **Tagline :** *Where idols come to life. Your next bias, one pull away.*  
> **Statut :** MVP (pré-lancement)

---

## Concept

Plateforme de collection de photocards digitales d'idols K-pop **fictives** (personnages originaux, pas de vraies idols).  
Système de gacha avec crédits in-app, trading P2P, réseau social intégré, et musique générée par IA.

---

## Univers Artistique

- **Style visuel :** Illustrious SDXL semi-realistic
- **Groupes au lancement :** 4 groupes (2 masculins, 2 féminins)
- **Membres par groupe :** 4 à 7 (standard ~5, jusqu'à 9 possible)
- **Chaque groupe a :**
  - Un concept visuel distinct (dark / cute / elegant / sporty…)
  - Un lore, un label fictif, une biographie
  - Chaque membre a : nom, âge, rôle (leader, vocal, dance…), personnalité
- **Consistance des visages :** LoRA par personnage (IP-Adapter / face swap en backup)
- **Cartes :** bordures de rareté, effet holo, éditions limitées, cartes fusion

## Économie & Monétisation

- **Monnaie in-app :** Crédits (pas d'achat direct de tirages en €)
- **Taux :** 100 crédits = 1 pull | 1 € = 100 crédits
- **Packs de crédits :**
  | Pack | Prix | Crédits | Tirages ≈ | Bonus |
  |------|------|---------|-----------|-------|
  | Daily | 1 € | 100 | 1 | — |
  | Standard | 5 € | 600 | 6 | 1 Rare garantie |
  | Premium | 15 € | 2 000 | 20 | 1 Epic garantie |
  | Ultra | 30 € | 5 000 | 50 | 1 Epic + bordure exclusive |
- **Tirages gratuits :** 1 pull/jour + 1 bonus avec daily login streak
- **Raretés :** Common (60%) → Rare (25%) → Epic (12%) → Legendary (3%)
- **Pity system :** 1 Legendary garantie tous les 50 pulls
- **Fusion :** 5 Common → 1 Rare → 3 Rare → 1 Epic → 2 Epic → 1 Legendary
- **Éditions limitées :** 1 événement par mois (7 jours), cartes exclusives
- **Pool pré-généré :** coût fixe (~500 cartes ≈ 45 min sur GPU local), coût marginal 0€ par tirage

### Packs thématiques (pas de gacha aveugle)

L'utilisateur **choisit son pack** — le hasard porte sur la carte exacte, pas sur l'univers :

| Type de Pack | Contenu | Prix indicatif | Cartes |
|-------------|---------|----------------|--------|
| Standard (par groupe) | Cartes du groupe uniquement | 500 crédits | 5 |
| Édition limitée (par groupe) | Cartes event + 1 Limited exclusive | 1 500 crédits | 5 |
| Label | Cartes des groupes d'un même label | 800 crédits | 5 |
| Global | N'importe quelle carte de tout l'univers | 300 crédits | 3 |

Avantages : pas de frustration (le fan achète ce qu'il veut), prix différenciés par rareté, collectionneurs ciblés.

## Trading & Marketplace

- **Échange direct P2P :** 0% de commission
- **Marketplace (V2) :** avec monnaie in-app, commission 5-10%
- **Pas de cash-out :** impossible de revendre une carte contre de l'argent réel
- **Fusion / burn :** détruire des cartes pour des ressources (à définir)

## Réseau Social Intégré

- **Comptes réels :** 1 compte maître du site sur Twitter/X, TikTok, YouTube (drive le trafic)
- **Comptes in-app :** chaque groupe a son propre "compte" dans l'app
  - Posts d'idols (contenu textuel + images, scripté par le fondateur)
  - Posts de labels (annonces, teasers, ads)
  - Likes, follows, reposts
- **Profils utilisateurs publics :** collection visible, badges, achievements, statistiques
- **Fonctionnalités V2 :** messagerie entre utilisateurs, groupes de discussion

## Musique

- **Génération :** ACE-Step (local, 8 GB VRAM, support coréen et K-pop)
- **Contenu :** chansons complètes par groupe fictif
- **Paroles :** en coréen et anglais (IA)
- **Accès :** toutes les musiques accessibles à tous les utilisateurs
- **YouTube :** chaîne dédiée au site pour héberger et diffuser les morceaux (découvrabilité SEO)

## Cible & Acquisition

- **Cible :** fans de K-pop, fans de waifu, joueurs de gacha, fans d'IA
- **Marché :** international (anglais prioritaire)
- **Acquisition :** Twitter/X → Reddit → TikTok → Discord
- **Stratégie pré-lancement :** extrait viral (son + édit anime/game) + teasing des groupes sur les réseaux
- **Objectif :** 100 utilisateurs actifs à 3 mois

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14+ (App Router) |
| Auth | Better Auth (Google, Discord) — adapter D1 |
| Base de données | Cloudflare D1 (SQLite serverless) |
| ORM | Drizzle ORM |
| Paiement | Stripe (SDK natif Cloudflare Workers) |
| Stockage | Cloudflare R2 |
| Génération images | ComfyUI + Illustrious SDXL (pool pré-généré local) |
| Génération musique | ACE-Step (local) |
| PWA | Intégré Next.js |
| i18n | /en/ → /ko/ → /fr/ → /es/ → /ja/ → /id/ → /pt/ |
| Déploiement | Cloudflare Pages (frontend + API routes edge) |

## Roadmap MVP (Sprint 1 — 3 semaines)

### Semaine 1-3 : MVP
- [x] Domaine acheté (idolbias.com)
- [ ] Inscription OAuth + email
- [ ] Achat de crédits via Stripe
- [ ] Pull de packs avec animation reveal
- [ ] Collection visible sur profil
- [ ] 1 groupe (5 membres, 250+ cartes)
- [ ] 1 son complet sur YouTube
- [ ] PWA

### Mois 2 : V1.1
- [ ] 2e groupe
- [ ] Trading direct P2P
- [ ] Fusion de cartes
- [ ] Éditions limitées / events

### Mois 3 : V1.2
- [ ] Marketplace
- [ ] Feed social avec posts d'idols
- [ ] Messagerie entre utilisateurs

## Légal

- **Idols fictives uniquement :** aucun droit à l'image violé
- **Pas de cash-out :** safe vis-à-vis de la régulation des jeux d'argent
- **Pity system :** protection utilisateur + défense régulatoire
- **Âge minimum :** à définir (18 ou 13-15 avec consentement)
- **CGU / CGV :** à rédiger
- **RGPD :** droit à l'effacement, portabilité des données à prévoir

## Budget

- **Frais récurrents MVP :** 12 €/an (nom de domaine) — tout le reste est gratuit (Cloudflare Workers Free, D1 Free 5GB, R2 Free)
- **Coût génération pool :** électricité locale ou ~2 $ par pool sur RunPod
- **Scaling :** D1 passe en plan payant (~5 $/mois + $0.001/ML lignes lues) uniquement si trafic significatif

## Décisions Prises

| Date | Décision |
|------|----------|
| 2026-06-25 | Choix du domaine : **idolbias.com** |
| 2026-06-25 | Tagline validée : *Where idols come to life. Your next bias, one pull away.* |
| 2026-06-25 | Modèle en crédits in-app (pas d'achat direct de pulls) |
| 2026-06-25 | Pool pré-généré (pas de génération en temps réel) |
| 2026-06-25 | 4 groupes au lancement (2M + 2F) |
| 2026-06-25 | Style Illustrious SDXL semi-realistic |
| 2026-06-25 | Compte maître réel unique sur les réseaux (pas de comptes par groupe) |
| 2026-06-25 | Site + PWA d'abord, app native plus tard |
| 2026-06-25 | Musiques sur YouTube pour SEO et découvrabilité |
| 2026-07-07 | Switch DB : **Supabase → Cloudflare D1** (SQLite serverless, free tier 5GB, pas de pause) |
| 2026-07-07 | Auth : **Better Auth** avec adapter D1 (Google/Discord) au lieu de Supabase Auth |
| 2026-07-07 | Déploiement : **Cloudflare Pages** (edge runtime) au lieu de Vercel |
| 2026-07-07 | ORM : **Drizzle** avec driver d1-http |
