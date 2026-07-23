import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment

wb = openpyxl.Workbook()

HDR_FILL = PatternFill("solid", fgColor="1F3864")
HDR_FONT = Font(name="Arial", bold=True, color="FFFFFF", size=11)
INPUT_FILL = PatternFill("solid", fgColor="FFF2CC")
TITLE_FONT = Font(name="Arial", bold=True, size=14, color="1F3864")
thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")

ws = wb.active
ws.title = "Roster"

# (colonne, largeur)  -- Rôle signé REMPLACÉ par Archetypes LIBRES
COLS = [
    ("Nom", 22),
    ("Nation", 12),
    ("Poste naturel", 16),
    ("Archetypes (libre, séparés par virgule)", 40),
    ("Style (libre)", 16),
    ("Plafond OVR (ceiling)", 18),
    ("Bio / Lore", 40),
]
ws.append([c[0] for c in COLS])
for i, (_, w) in enumerate(COLS, start=1):
    cell = ws.cell(row=1, column=i)
    cell.fill = HDR_FILL; cell.font = HDR_FONT; cell.border = BORDER
    cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

for r in range(2, 16):
    for c in range(1, len(COLS)+1):
        cell = ws.cell(row=r, column=c)
        cell.fill = INPUT_FILL; cell.border = BORDER; cell.alignment = WRAP

ws["A1"].comment = Comment(
    "FEUILLE ROSTER — une ligne par joueuse.\n"
    "Les stats (22 outfield / 18 GK) et l'OVR sont GÉNÉRÉES depuis ces champs, tu ne saisis PAS les stats.\n"
    "Colonne jaune = à remplir. Le poste dit LE WHERE ; les ARCHETYPES disent LE PROFIL (libre, cumulable) ;\n"
    "le STYLE est la roue RPS de matchup (libre, orthogonal). Voir onglet 'Références'.",
    "Hermes")

NATIONS = '"FR,DE,GB,IT,ES,BR,JP,AR"'
POSTES  = '"GK,RB,LB,CB,CDM,CM,CAM,LM,RM,LW,RW,ST,SS"'
STYLES  = '"Percussion,Vista,Pressing,Élévation,Sang-froid"'

dv_nat  = DataValidation(type="list", formula1=NATIONS, allow_blank=True)
dv_pos  = DataValidation(type="list", formula1=POSTES, allow_blank=True)
dv_sty  = DataValidation(type="list", formula1=STYLES, allow_blank=True)
dv_ceil = DataValidation(type="whole", operator="between", formula1="1", formula2="100", allow_blank=True)
for dv in (dv_nat, dv_pos, dv_sty, dv_ceil):
    dv.error = "Valeur hors liste / hors plage"; dv.errorTitle = "Entrée invalide"
    ws.add_data_validation(dv)
dv_nat.add("B2:B15"); dv_pos.add("C2:C15"); dv_sty.add("E2:E15"); dv_ceil.add("F2:F15")
# Colonne D (Archetypes) = texte libre, pas de liste (libre + cumulable)

ws.freeze_panes = "A2"

# ═══════════════════════════════════════════════════════════════════════════
ref = wb.create_sheet("Références")
ref.column_dimensions["A"].width = 24
ref.column_dimensions["B"].width = 74
ref["A1"] = "RÉFÉRENCES — valeurs acceptées et explications"
ref["A1"].font = TITLE_FONT
ref.merge_cells("A1:B1")

def block(title, rows):
    r = ref.max_row + 2
    ref.cell(row=r, column=1, value=title).font = Font(bold=True, size=12, color="1F3864")
    for k, v in rows:
        rr = ref.max_row + 1
        ref.cell(row=rr, column=1, value=k).font = Font(bold=True, name="Arial")
        ref.cell(row=rr, column=1).alignment = WRAP
        ref.cell(row=rr, column=2, value=v).alignment = WRAP

block("NATIONS (8)", [
    ("FR/DE/GB/IT/ES/BR/JP/AR", "Chimie nationale si 4+ de la même nation alignées. Style dominant par nation documenté dans le GDD."),
])

block("POSTE NATUREL (13) — LE WHERE (malus si jouée ailleurs)", [
    ("GK", "Gardienne — bloc TECH propre (Réflexes/Handling/AerialReach/CommandArea/Kicking/RushingOut)"),
    ("RB / LB", "Latéral D/G — défense + courses côté"),
    ("CB", "Défense centrale — tacle, positionnement, puissance"),
    ("CDM", "Milieu défensif — protection, interception, relance"),
    ("CM", "Milieu central — box-to-box, endurance"),
    ("CAM", "Milieu offensif — création, dernière passe"),
    ("LM / RM", "Milieu large G/D — centre, dribble côté"),
    ("LW / RW", "Ailier G/D — vitesse, dribble, centre"),
    ("ST", "Pointe — finition, tirs"),
    ("SS", "Second striker — lien milieux↔ST, créatif + finition"),
])

block("ARCHETYPES (LIBRES, cumulables) — LE PROFIL DE STATS", [
    ("vitesse", "Vitesse/Accélération/Agilite/Détente ↑ — bombe de course"),
    ("rugueux", "Tacle/Agressivité/Puissance/Positionnement ↑ — latéral/déf dur"),
    ("finition", "Tir/Détente/Contrôle/Sang-Froid ↑ — buteuse"),
    ("tete", "Détente/Puissance/Centre/Agressivité ↑ — pivot de tête"),
    ("vision", "Passe/Décision/Contrôle/Anticipation ↑ — créatrice"),
    ("creatif", "Dribble/Contrôle/Centre/Passe ↑ — percussion technique"),
    ("pressing", "Endurance/Positionnement/Tacle/Agressivité ↑ — harcèlement"),
    ("aerien", "Détente/AerialReach/Puissance ↑ — (GK-friendly)"),
    ("mur", "Tacle/Positionnement/Puissance/Anticipation ↑ — défenseur central pur"),
    ("box2box", "Endurance/Positionnement/Passe/Tacle ↑ — milieu partout"),
    ("regista", "Passe/Décision/Contrôle/Anticipation ↑ — chef d'orchestre"),
    ("trequarti", "Dribble/Passe/Tir ↑ — meneur de jeu offensif"),
    ("fullback", "Centre/Endurance/Vitesse/Tacle ↑ — latéral moderne"),
    ("sniper", "Tir/Puissance/Sang-Froid/Contrôle ↑ — finisseur de loin"),
    ("phénomène", "Agilité/Dribble/Accélération/Vitesse ↑ — technicienne explosif"),
    ("patron", "Leadership/Positionnement/Puissance/Sang-Froid ↑ — capitaine"),
    ("gardien", "Réflexes/Handling/AerialReach/CommandArea ↑ — GK"),
    ("sweeper", "RushingOut/Réflexes/Agilité/Anticipation ↑ — GK moderne"),
    ("RÈGLE", "Colonne D = texte libre. Sépare par VIRGULE. Ex: 'vitesse,phénomène,creatif'. "
              "Cumulable à l'infini. Même poste (RB) + archetypes différents = profils opposés."),
])

block("STYLE (5, LIBRE, orthogonal au poste/profil) — roue RPS de matchup", [
    ("Percussion", "BAT Sang-froid. Stats clés : Puissance, Agressivité, Accélération."),
    ("Vista", "BAT Pressing. Stats clés : Passe, Contrôle, Décision."),
    ("Pressing", "BAT Élévation. Stats clés : Tacle, Positionnement, Endurance."),
    ("Élévation", "BAT Sang-froid. Stats clés : Détente, Puissance, Centre."),
    ("Sang-froid", "BAT Percussion. Stats clés : Tir, Sang-Froid, Contrôle."),
    ("Note", "Le style est SAISI LIBREMENT (pas dérivé des stats). Un RB 'rugueux' peut être "
             "Pressing ou Percussion au choix — liberté totale de profil + matchup."),
])

block("PLAFOND OVR (ceiling) — 1 à 100", [
    ("≥ 90", "TIER legend — star élite (ex. Atton 94). Même en common ~85+."),
    ("82 – 89", "TIER star — star confirmée (ex. Landers 88)."),
    ("70 – 81", "TIER regular — solide."),
    ("< 70", "TIER rookie — jeune / remplaçante, grosse variance."),
])

block("MALUS HORS-POSTE (type B — ciblé, FM-style)", [
    ("Principe", "Si currentPos ≠ naturalPos, seules les STATS DIFFÉRENTIELLES du poste cible "
                 "sont pénalisées, pas toutes."),
    ("Exemple", "Une ST (Tir fort) forcée en CB perd sur Tacle/Positionnement mais garde son Tir. "
                "Un CB en ST garde sa Puissance mais rate ses tirs."),
    ("Effet", "Le roster building devient stratégique : on n'aligne pas ses 11 meilleurs OVR "
              "n'importe où — la position compte."),
])

block("SCHÉMA STATS GÉNÉRÉ (non saisi)", [
    ("PHYSIQUE (6)", "Vitesse, Accélération, Endurance, Puissance, Agilité, Détente — universel"),
    ("MENTAL (6)", "Anticipation, Sang-Froid, Leadership, Positionnement, Agressivité, Décision — universel"),
    ("TECH OUTFIELD (6)", "Passe, Tir, Dribble, Centre, Tacle, Contrôle — si poste ≠ GK"),
    ("TECH GK (6)", "Réflexes, Handling, AerialReach, CommandArea, Kicking, RushingOut — si GK"),
    ("SET-PIECE (4)", "CF, Corners, Penalty, LongThrows — outfield only, branchés direct moteur"),
    ("TOTAL", "Outfield = 22 stats | GK = 18 stats. OVR recalculé depuis ces stats pondérées par poste."),
])

block("SKILL CARDS — slots par RARETÉ de la carte de base", [
    ("Concept", "Addon skill cards (actions, + ou - épiques selon rareté) socketées dans des SLOTS de la carte. "
                "Effets in-game : stats améliorées OU capacité tactique déclenchable."),
    ("SLOTS par rareté", "common 0 | rare 1 | epic 2 | legendary 3 | secret 4  (vient de la RARETÉ, pas du grade)"),
    ("Faille calibrée", "Si slots viennent de la rareté MAIS skill cards ont leur propre rareté, un joueur pourrait "
                        "pervertir le plafond de stats (rareté = plafond). Règle : les skill cards ne peuvent PAS "
                        "dépasser le plafond de stats de la carte hôte. Une common socketée au max reste un outil de niche."),
    ("Effets réservés", "Capacités spéciales réservées aux skill cards de rareté haute (gold+). Le plafond se resserre "
                        "mais ne se referme jamais complètement."),
    ("Résolution in-game", "Au moment clé (tir, tacle décisif), le joueur CHOISIT quelle capacité déclencher parmi les "
                          "skill cards équipées (coût en Élan/cooldown) — décision stratégique, pas automatique."),
    ("Schéma de données", "skill_card_defs = catalogue FONGIBLE (pas d'instance) ; card_instance_skill_slots = lien "
                          "'quelle skill socketée où' ; statBoost (json) + abilityId sur la skill card."),
])

import os
out = os.path.join(os.path.dirname(__file__), "IdolBias_Roster_Template.xlsx")
wb.save(out)
print("SAVED:", out)
