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
- **Groupes au lancement :** 4 prévus (2M + 2F), 1 actif (VICIOUS)
- **Membres par groupe :** 4 à 7
- **Chaque groupe a :** concept visuel distinct, lore, label fictif, biographie
- **Membres :** nom, âge, rôle (leader, vocal, dance...), personnalité, couleur associée
- **Consistance des visages :** LoRA par personnage (IP-Adapter / face swap en backup)
- **Cartes :** bordures de rareté, effet holo, éditions limitées

## Économie & Monétisation

- **Monnaie in-app :** Gems (achat en €) + Tickets (gratuits via missions) + Dust (craft)
- **1 pull = 1 ticket ou gemme selon le pack**
- **Raretés :** Common (50%) → Rare (30%) → Epic (14%) → Legendary (5%) → Secret (1%)
- **Pool pré-généré :** pas de génération en temps réel

### Gem Shop (6 packs)

| Prix | Gems | Bonus | 💎/€ |
|------|------|-------|------|
| 1,99€ | 200 | 0% | 100 |
| 4,99€ | 550 | +10% | 110 |
| 9,99€ | 1 200 | +20% | 120 ★ POPULAR |
| 19,99€ | 2 500 | +25% | 125 |
| 49,99€ | 6 500 | +30% | 130 |
| 99,99€ | 14 000 | +40% | 140 ★ BEST VALUE |

### Packs de cartes

- Chaque set contient 40 cartes (10 par membre × 4 membres)
- Packs achetables en tickets ou gems
- 5 cartes par pull, raretés poolées selon les drop rates du pack
- Packs standards, limited, discount selon les events

## Trading & Marketplace

- **Échange direct P2P** dans WorkshopView (créer/annuler/accepter des offres)
- **Fusion :** 5 Common → 1 pull Rare (craft), désenchantement en dust
- **Pas de cash-out :** impossible de revendre contre de l'argent réel
- **Marketplace (V2) :** plus tard avec commission 5-10%

## Réseau Social Intégré

- **Feed Instagram-like** : posts d'idols, likes, commentaires
- **Cosmo Room** : journal intime par membre, threads privés + mur public
- **Follow** : abonnement aux membres pour feed personnalisé
- **Profils utilisateurs publics** : collection, badges, achievements, statistiques
- **Messagerie (V2)** : plus tard

## Système de Missions

- **Daily :** 4 missions pickées aléatoirement depuis un pool de 12, reset chaque jour (minuit UTC)
- **Weekly :** 4 missions pickées depuis un pool de 8, reset chaque lundi
- **Lifetime / Achievements :** paliers progressifs (collection, fan level, login)
- **Events :** missions limitées avec récompenses spéciales
- **Timer de reset** visible dans MissionsView

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 |
| Auth | Better Auth (Google OAuth + email/mot de passe) |
| Base de données | Cloudflare D1 (SQLite serverless) |
| ORM | Drizzle ORM |
| Paiement | Stripe (Checkout Sessions + Webhooks) |
| Emails | Resend (reset password) |
| Stockage | Cloudflare R2 |
| Génération images | ComfyUI + Illustrious SDXL (pool pré-généré local) |
| Génération musique | ACE-Step (local) |
| PWA | Intégré Next.js (manifest.json) |
| Déploiement | Cloudflare Workers via wrangler + OpenNext |

## Déploiement

```bash
cd ~/idolbias && bash scripts/deploy.sh
```

Pas de Cloudflare Pages — utilisation de `wrangler deploy` avec OpenNext pour le build worker.

## Fonctionnalités Implémentées

### Core
- [x] Stripe Gem Shop (6 packs, waiver modal, webhook)
- [x] Pull de packs avec animation hold-to-open + swipe-to-reveal
- [x] Collection visible sur profil (Binder, My Cards, Catalogue)
- [x] Design system Y2K : hard borders 2px, box-shadow, holo gradients

### Auth & Comptes
- [x] Google OAuth (Better Auth)
- [x] Email + mot de passe (inscription, connexion)
- [x] Reset password via Resend (template email pro)
- [x] Guest players (cookie `idolbias_player_id`)
- [x] Link OAuth ↔ guest player
- [x] Delete account (supprime toutes les données)

### Collection
- [x] IndexCards (catalogue complet avec filtres)
- [x] BinderView + SetCard (progression par set)
- [x] BinderAlbumView (drill-down dans un set, cartes par membre, pagination)
- [x] MyCardsView (cartes possédées, favoris localStorage, filtres)
- [x] SetCompletion (modal avec confettis + rewards quand un set est complet)
- [x] PhotoCard (tilt 3D, swipe-to-flip, zoom overlay, effets par rareté)

### Missions
- [x] Daily pool (12 missions, 4 pickées par jour avec poids)
- [x] Weekly pool (8 missions, 4 pickées par semaine)
- [x] Achievements / lifetime tiers
- [x] Timer de reset (daily + weekly)
- [x] Difficulté (pastille verte/orange/rouge)
- [x] Bump calls pour toutes les actions

### Social
- [x] FeedView (posts, pagination, mode For You / Following)
- [x] Likes, commentaires
- [x] Follow / unfollow
- [x] Idol profiles
- [x] Cosmo Room (public wall + private thread)

### Events
- [x] Tables `events` + `event_participation`
- [x] `/api/events/active`
- [x] Rate-up dans le gacha (multiplicateur, raretés ciblées)
- [x] Collection events (target pack, claim reward)
- [x] EventCountdown component
- [x] Event missions dans le pool

### Workshop
- [x] Désenchantement (cartes → dust)
- [x] Craft (dust → carte aléatoire d'une rareté)
- [x] Trading P2P (offres, acceptation, annulation)

### UI/UX
- [x] PullOverlay responsive (desktop 5 cartes, mobile 1 par 1)
- [x] Pages légales (Terms, Privacy, Notices)
- [x] Animations (card reveal, confettis, confetti set completion)

## Pages & Routes API

### Pages
- `/` — AppShell (vue principale avec tabs)
- `/login` — Connexion (Google + email/mdp)
- `/reset-password/[token]` — Reset de mot de passe
- `/account` — Gestion compte (si déconnecté du shell)
- `/legal/terms`, `/legal/privacy`, `/legal/notices`

### Routes API principales
- `POST /api/pack/open` — Pull de 5 cartes (atomic debit)
- `POST /api/shop/checkout` — Création session Stripe
- `POST /api/webhooks/stripe` — Webhook Stripe
- `GET /api/missions/templates` — Templates daily/weekly/events
- `GET /api/events/active` — Events actifs
- `GET/POST /api/feed/*` — Feed social
- `GET/POST /api/cosmo/*` — Cosmo Room
- `GET /api/player` — Données joueur
- `POST /api/sets/claim-reward` — Claim set completion
- `GET /api/purchases` — Historique d'achat
- `GET /api/auth/*` — Better Auth (login, signup, reset password)

## Roadmap

### MVP — Fait
- [x] Domaine acheté (idolbias.com)
- [x] Inscription OAuth (Google) + email/mdp
- [x] Gem shop Stripe
- [x] Pull de packs avec animation reveal
- [x] Collection visible (Binder + Catalogue + My Cards)
- [x] 1 groupe (VICIOUS, 4 membres, 2 sets × 40 cartes)
- [x] Missions (daily/weekly/lifetime/events)
- [x] Feed social + Cosmo Room
- [x] Pages légales
- [x] PWA

### V1.1
- [ ] 2e groupe
- [ ] Marketplace (commission 5-10%)
- [ ] Éditions limitées / events visuels
- [ ] Messagerie entre utilisateurs

## Décisions Prises

| Date | Décision |
|------|----------|
| 2026-06-25 | Choix du domaine : **idolbias.com** |
| 2026-06-25 | Tagline validée |
| 2026-06-25 | Modèle en crédits in-app (gems) |
| 2026-06-25 | Pool pré-généré |
| 2026-06-25 | 4 groupes au lancement (2M + 2F) |
| 2026-06-25 | Style Illustrious SDXL semi-realistic |
| 2026-06-25 | Compte maître réel unique sur les réseaux |
| 2026-06-25 | Site + PWA d'abord, app native plus tard |
| 2026-06-25 | Musiques sur YouTube |
| 2026-07-07 | Switch DB : Supabase → Cloudflare D1 |
| 2026-07-07 | Auth : Better Auth (Google + email) |
| 2026-07-07 | Déploiement : wrangler, pas Cloudflare Pages |
| 2026-07-07 | ORM : Drizzle |
| 2026-07-13 | Discord retiré de l'auth (Google only) |
| 2026-07-13 | Pricing gems : 1,99€ → 99,99€, bonus progressifs |
| 2026-07-13 | Missions dynamiques avec pool |
