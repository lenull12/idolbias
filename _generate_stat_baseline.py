"""
_generate_stat_baseline.py — Suggestion de stats cohérente pour IdolBias_Roster_Master.xlsx

Principe (repris de l'onglet Références, "ARCHETYPES → STATS") :
  base OVR fixe (col Characters!J, "base") → plancher commun à toutes les stats,
  puis chaque archétype du personnage (Characters!H, "arch", liste séparée par virgules)
  BOOSTE ses 3-4 stats de profil et rend le budget en baissant proportionnellement
  les autres stats du même bloc (outfield ou GK) — "spécialise, n'augmente pas l'OVR".

  Work Rate et Flair ne suivent PAS ce système de budget : ils sont dérivés directement
  du rôle FM (Work Rate ↔ ROLE_ROAM du moteur) et des tags créatifs (Flair), pour
  garantir par construction qu'un poacher ne puisse jamais se retrouver avec un Work
  Rate supérieur à un second_striker — le bug trouvé sur Valentina Giménez/Soledad Díaz.
  Flair et Work Rate sont IGNORÉS pour les gardiennes (cf. _export_excel_to_ts.py).

Deux modes :
  --mode suggest (défaut) : écrit les valeurs suggérées dans un bloc miroir à partir
    de la colonne 63 de 'Stats & OVR', SANS toucher aux colonnes réelles (6-32, 36-60).
    Sûr à lancer sur le roster existant pour comparer et calibrer les paramètres.
  --mode apply : écrit directement dans les colonnes réelles, mais UNIQUEMENT pour les
    lignes dont le bloc concerné est actuellement vide (nouveau personnage). Une ligne
    déjà remplie est ignorée avec un message, sauf --force (déconseillé sans revue).

Usage :
  python3 _generate_stat_baseline.py                      # mode suggest, tout le roster
  python3 _generate_stat_baseline.py --mode apply          # remplit les lignes vides seulement
  python3 _generate_stat_baseline.py --only esperanza-galvan  # une seule ligne (debug)
"""
import argparse
import openpyxl
import re

EXCEL = r'C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx'

# ─── Vocabulaire canonique (StatKey), même ordre que _export_excel_to_ts.py ──────
ALL_STAT_KEYS = [
    "vitesse", "acceleration", "endurance", "puissance", "agilite", "detente", "force",
    "anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision",
    "workRate", "flair",
    "passe", "tir", "dribble", "centre", "tacle", "controle",
    "jeu_de_tete", "technique",
    "cf", "corners", "penalty", "longThrows",
    "reflexes", "handling", "aerialReach", "commandArea", "kicking", "rushingOut",
]

OUTFIELD_POOL = [
    "vitesse", "acceleration", "endurance", "puissance", "agilite", "detente", "force",
    "anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision",
    "passe", "tir", "dribble", "centre", "tacle", "controle", "jeu_de_tete", "technique",
    "cf", "corners", "penalty", "longThrows",
]  # workRate/flair volontairement absents : formule séparée, pas dans le budget

GK_POOL = [
    "vitesse", "acceleration", "endurance", "puissance", "agilite", "detente", "force",
    "anticipation", "sangFroid", "leadership", "positionnement", "agressivite", "decision",
    "reflexes", "handling", "aerialReach", "commandArea", "kicking", "rushingOut", "longThrows",
]  # workRate/flair/cf/corners/penalty exclus pour les GK (cf. _export_excel_to_ts.py)

# ─── Couche 1 : plancher de base ────────────────────────────────────────────────
BASE_FLOOR_FRAC = 0.89

# ─── Couche 2 : archétypes (transcription numérique de l'onglet Références) ─────
# Chaque profil boost SES stats de +BOOST ; le total est redistribué en négatif,
# proportionnellement, sur les stats du pool qui ne sont touchées par AUCUN des
# archétypes du personnage (conserve le budget, cf. principe "spécialise, n'augmente pas").
BOOST = 10

ARCHETYPE_PROFILE = {
    "vitesse":   ["vitesse", "acceleration", "agilite", "detente"],
    "rugueux":   ["tacle", "agressivite", "puissance", "positionnement"],
    "finition":  ["tir", "detente", "technique", "sangFroid"],
    "tete":      ["detente", "puissance", "centre", "agressivite"],
    "vision":    ["passe", "decision", "technique", "anticipation"],
    "creatif":   ["dribble", "technique", "centre", "passe"],
    "pressing":  ["endurance", "positionnement", "tacle", "agressivite"],
    "aerien":    ["detente", "aerialReach", "puissance"],       # GK-only (Références l'indique)
    "mur":       ["tacle", "positionnement", "puissance", "anticipation"],
    "box2box":   ["endurance", "positionnement", "passe", "tacle"],
    "regista":   ["passe", "decision", "technique", "anticipation"],
    "trequarti": ["dribble", "passe", "tir"],
    "fullback":  ["centre", "endurance", "vitesse", "tacle"],
    "sniper":    ["tir", "puissance", "sangFroid", "technique"],
    "phenomene": ["agilite", "dribble", "acceleration", "vitesse"],
    "patron":    ["leadership", "positionnement", "puissance", "sangFroid"],
    "gardien":   ["reflexes", "handling", "aerialReach", "commandArea"],  # GK-only
    "sweeper":   ["rushingOut", "reflexes", "agilite", "anticipation"],   # GK-only
}
GK_ONLY_ARCHETYPES = {"aerien", "gardien", "sweeper"}

# Tags à connotation créative → alimentent Flair (voir couche 3)
CREATIVE_TAGS = {"creatif", "vision", "phenomene", "trequarti", "regista"}

# ─── Couche 3 : Work Rate lié à ROLE_ROAM du moteur ─────────────────────────────
# Copie corrigée de matchEngine.ts::ROLE_ROAM — le moteur a "sweeper" au lieu de
# "sweeper_keeper" (bug distinct signalé séparément) ; on utilise ici la clé
# RÉELLEMENT utilisée dans Characters!role pour ne pas reproduire l'erreur.
ROLE_ROAM = {
    "poacher": 0.05, "target_man": 0.05, "stopper": 0.05,
    "anchor": 0.10,
    "inverted_wingback": 0.15, "ball_playing_defender": 0.15,
    "inside_forward": 0.20,
    "deep_lying_playmaker": 0.25, "fullback": 0.25,
    "regista": 0.30, "libero": 0.30, "winger": 0.30, "second_striker": 0.30,
    "sweeper_keeper": 0.30, "trequartista": 0.30,
    "box_to_box": 0.40,
    "false_nine": 0.50,
    "ball_winning": 0.20, "advanced_forward": 0.30, "playmaker": 0.25,
    "wide_playmaker": 0.30,
}
DEFAULT_ROAM = 0.20


def workrate_baseline(role: str) -> int:
    roam = ROLE_ROAM.get(role, DEFAULT_ROAM)
    return clip(round(48 + roam * 84))


def flair_baseline(tags: list) -> int:
    boost = sum(8 for t in tags if t in CREATIVE_TAGS)
    return clip(42 + boost)


def clip(v: int) -> int:
    return max(1, min(99, v))


# ─── Normalisation des tags d'archétype (accents) ───────────────────────────────
ACCENT_MAP = {'í': 'i', 'é': 'e', 'è': 'e', 'á': 'a', 'ñ': 'n', 'ú': 'u', 'ó': 'o',
              'ç': 'c', 'à': 'a', 'ä': 'a', 'ö': 'o', 'ü': 'u'}


def normalize_tag(t: str) -> str:
    s = t.strip().lower()
    for k, v in ACCENT_MAP.items():
        s = s.replace(k, v)
    return s


def parse_archetypes(raw: str) -> list:
    return [normalize_tag(t) for t in (raw or '').split(',') if t.strip()]


# ─── Génération de la baseline pour un personnage ───────────────────────────────
def generate_baseline(base_ovr: int, role: str, archetypes: list, is_gk: bool) -> dict:
    pool = GK_POOL if is_gk else OUTFIELD_POOL
    stats = {k: round(base_ovr * BASE_FLOOR_FRAC) for k in pool}

    touched = set()
    total_boost = 0
    unknown_tags = []
    skipped_gk_mismatch = []

    for tag in archetypes:
        profile = ARCHETYPE_PROFILE.get(tag)
        if profile is None:
            unknown_tags.append(tag)
            continue
        if is_gk and tag not in GK_ONLY_ARCHETYPES and tag not in ("mur", "rugueux"):
            pass  # archétypes outfield appliqués tel quel à une GK : peu probable, laissé passer
        for stat in profile:
            if stat not in pool:
                # ex. 'aerien' appliqué à une joueuse de champ : aerialReach n'existe
                # pas dans le bloc outfield, on l'ignore proprement plutôt que planter
                if stat == "aerialReach" and not is_gk:
                    skipped_gk_mismatch.append((tag, stat))
                continue
            stats[stat] += BOOST
            total_boost += BOOST
            touched.add(stat)

    complement = [s for s in pool if s not in touched]
    if complement and total_boost > 0:
        malus = total_boost / len(complement)
        for s in complement:
            stats[s] -= malus

    stats = {k: clip(round(v)) for k, v in stats.items()}

    if not is_gk:
        stats["workRate"] = workrate_baseline(role)
        stats["flair"] = flair_baseline(archetypes)

    return stats, unknown_tags, skipped_gk_mismatch


# ─── Colonnes Excel ──────────────────────────────────────────────────────────────
OUT_COL0, OUT_COUNT = 6, 27
GK_COL0, GK_COUNT = 36, 25
SUGGEST_COL0 = 63  # bloc miroir, 33 colonnes (ALL_STAT_KEYS), jamais lu par l'export TS

COL_NAME_TO_KEY = {
    'Vitesse': 'vitesse', 'Accélération': 'acceleration', 'Endurance': 'endurance',
    'Puissance': 'puissance', 'Agilité': 'agilite', 'Détente': 'detente', 'Force': 'force',
    'Anticipation': 'anticipation', 'SangFroid': 'sangFroid', 'Leadership': 'leadership',
    'Positionnement': 'positionnement', 'Agressivité': 'agressivite', 'Décision': 'decision',
    'Work Rate': 'workRate', 'Flair': 'flair',
    'Passe': 'passe', 'Tir': 'tir', 'Dribble': 'dribble', 'Centre': 'centre', 'Tacle': 'tacle',
    'Contrôle': 'controle', 'Jeu de tête': 'jeu_de_tete', 'Technique': 'technique',
    'CF': 'cf', 'Corners': 'corners', 'Penalty': 'penalty', 'LongThrows': 'longThrows',
    'Réflexes': 'reflexes', 'Handling': 'handling', 'AerialReach': 'aerialReach',
    'CommandArea': 'commandArea', 'Kicking': 'kicking', 'RushingOut': 'rushingOut',
}

OUT_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente','Force',
             'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
             'Work Rate','Flair','Passe','Tir','Dribble','Centre','Tacle','Contrôle',
             'Jeu de tête','Technique','CF','Corners','Penalty','LongThrows']
GK_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente','Force',
            'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
            'Work Rate','Flair','Réflexes','Handling','AerialReach','CommandArea','Kicking',
            'RushingOut','CF','Corners','Penalty','LongThrows']


def block_is_empty(ws, row, col0, count):
    return all(ws.cell(row=row, column=col0 + i).value in (None, 0) for i in range(count))


def write_suggestion_header(ws):
    if ws.cell(row=1, column=SUGGEST_COL0 - 1).value != "SUGGESTIONS (script)":
        ws.cell(row=1, column=SUGGEST_COL0 - 1, value="SUGGESTIONS (script)")
    for i, key in enumerate(ALL_STAT_KEYS):
        ws.cell(row=1, column=SUGGEST_COL0 + i, value=f"Sug_{key}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["suggest", "apply"], default="suggest")
    ap.add_argument("--force", action="store_true", help="avec --mode apply, écrase aussi les lignes déjà remplies")
    ap.add_argument("--only", default=None, help="slug d'un seul personnage, pour debug")
    ap.add_argument("--excel", default=EXCEL)
    args = ap.parse_args()

    wb = openpyxl.load_workbook(args.excel, data_only=False)
    wsc = wb['Characters']
    ws = wb['Stats & OVR']

    if args.mode == "suggest":
        write_suggestion_header(ws)

    report = []
    for r in range(2, 90):
        name = wsc.cell(row=r, column=1).value
        if not name:
            continue
        sid = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        if args.only and sid != args.only:
            continue

        poste = (wsc.cell(row=r, column=4).value or '').strip().upper()
        role = (wsc.cell(row=r, column=5).value or '').strip()
        arch_raw = wsc.cell(row=r, column=8).value or ''
        base_cell = wsc.cell(row=r, column=10).value
        if base_cell is None:
            report.append(f"{name} (ligne {r}) : 'base' vide, ignoré")
            continue
        base_ovr = int(base_cell)
        is_gk = (poste == 'GK')

        tags = parse_archetypes(arch_raw)
        baseline, unknown, mismatch = generate_baseline(base_ovr, role, tags, is_gk)

        if unknown:
            report.append(f"{name} : tag(s) d'archétype inconnu(s) {unknown} — ignorés, à vérifier")
        if mismatch:
            report.append(f"{name} : {mismatch} — stat absente du bloc {'GK' if is_gk else 'outfield'}, ignorée")

        if args.mode == "suggest":
            for i, key in enumerate(ALL_STAT_KEYS):
                ws.cell(row=r, column=SUGGEST_COL0 + i, value=baseline.get(key, ""))
        else:  # apply
            names = GK_NAMES if is_gk else OUT_NAMES
            col0 = GK_COL0 if is_gk else OUT_COL0
            count = GK_COUNT if is_gk else OUT_COUNT
            if not args.force and not block_is_empty(ws, r, col0, count):
                report.append(f"{name} : bloc déjà rempli, ignoré (--force pour écraser)")
                continue
            excluded = {'workRate', 'flair'} if is_gk else set()
            for i, col_name in enumerate(names):
                key = COL_NAME_TO_KEY[col_name]
                if key in excluded:
                    continue
                if key in baseline:
                    ws.cell(row=r, column=col0 + i, value=baseline[key])
            report.append(f"{name} : baseline appliquée ({'GK' if is_gk else 'outfield'})")

    wb.save(args.excel)
    print(f"OK — mode={args.mode} — {args.excel} mis à jour")
    print()
    for line in report:
        print(" -", line)


if __name__ == '__main__':
    main()
