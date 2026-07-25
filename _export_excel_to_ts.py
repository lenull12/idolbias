"""
Export IdolBias_Roster_Master.xlsx -> src/data/characterStats.ts
Lecture seule du master. Génère le fichier TS de stats (source pour le gacha).
Aucune donnée user écrasée.

Stats & OVR layout (after phase-6 refonte):
  Outfield: cols 6-32 (27 cols)
    PHY(6): 6-11 (Vitesse→Détente), Force@12
    MEN(6): 13-18 (Anticipation→Décision), WorkRate/Flair@19-20
    TEC(6): 21-26 (Passe→Contrôle), JeuTete/Technique@27-28
    SET(4): 29-32 (CF→LongThrows)
  GK: cols 36-60 (25 cols)
    PHY(6): 36-41, Force@42
    MEN(6): 43-48, WorkRate/Flair@49-50 (colonnes gardées dans l'Excel pour ne pas
      décaler les colonnes suivantes, mais IGNORÉES à l'export — voir CORRECTIF ci-dessous)
    GK_TEC(6): 51-56
    SET(4): 57-60
Characters sheet: col 11=pied, 12=tailleCm, 13=poidsKg, 6=posteSec1, 7=posteSec2

── CORRECTIFS appliqués à cette version ──────────────────────────────────────
1. WorkRate/Flair retirées des gardiennes (osef pour une GK qui bouge à peine et
   ne tente jamais d'action de génie) — cf. discussion "workRate/flair inutiles GK".
   Les colonnes 49-50 restent présentes dans l'Excel (pas de décalage de colonnes)
   mais ne sont plus lues du tout pour is_gk=True.
2. LongThrows n'est plus jeté pour les gardiennes — seuls cf/corners/penalty le sont
   désormais (une gardienne moderne a une vraie compétence de relance longue à la main,
   contrairement au corner/CF/penalty qu'elle ne tire jamais). Donnée déjà présente
   dans l'Excel, simplement rétablie dans l'export.
3. Bug de classification 'group' corrigé : LM/RM tombaient dans 'ATT' au lieu de 'MIL'
   (seuls LW/RW/ST restent 'ATT' — cohérent avec Position12 et les formations 4-4-2/4-3-3
   où mil-l/mil-r sont bien des slots MIL, pas ATT).
"""
import openpyxl, re

EXCEL = r'C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx'
OUT_TS = r'//wsl.localhost/Ubuntu/home/raphi/idolbias/src/data/characterStats.ts'

OUT_NAMES = [
    'Vitesse','Accélération','Endurance','Puissance','Agilité','Détente',
    'Force',
    'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
    'Work Rate','Flair',
    'Passe','Tir','Dribble','Centre','Tacle','Contrôle',
    'Jeu de tête','Technique',
    'CF','Corners','Penalty','LongThrows',
]

# GK_NAMES : la disposition des colonnes 36-60 dans l'Excel ne change pas (Work Rate/Flair
# restent des colonnes physiques à 49-50, sinon tout ce qui suit — GK_TEC, SET — se décale).
# C'est à la lecture (plus bas, stats.pop) qu'on choisit de ne pas les exporter.
GK_NAMES = [
    'Vitesse','Accélération','Endurance','Puissance','Agilité','Détente',
    'Force',
    'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
    'Work Rate','Flair',
    'Réflexes','Handling','AerialReach','CommandArea','Kicking','RushingOut',
    'CF','Corners','Penalty','LongThrows',
]

# clé TS (snake) <- nom Excel
KEY = {
    'Vitesse':'vitesse','Accélération':'acceleration','Endurance':'endurance','Puissance':'puissance',
    'Agilité':'agilite','Détente':'detente',
    'Force':'force',
    'Anticipation':'anticipation','SangFroid':'sangFroid',
    'Leadership':'leadership','Positionnement':'positionnement','Agressivite':'agressivite','Agressivité':'agressivite','Décision':'decision',
    'Work Rate':'workRate','Flair':'flair',
    'Passe':'passe','Tir':'tir','Dribble':'dribble','Centre':'centre','Tacle':'tacle',
    'Contrôle':'controle',
    'Jeu de tête':'jeu_de_tete',
    'Technique':'technique',
    'CF':'cf','Corners':'corners','Penalty':'penalty','LongThrows':'longThrows',
    'Réflexes':'reflexes','Handling':'handling','AerialReach':'aerialReach','CommandArea':'commandArea',
    'Kicking':'kicking','RushingOut':'rushingOut',
}

# Outfield columns: 6..32 (27 cols)
OUT_COL0 = 6
OUT_COUNT = len(OUT_NAMES)  # 27

# GK columns: 36..60 (25 cols) — la disposition physique ne change pas (voir note plus haut)
GK_COL0 = 36
GK_COUNT = len(GK_NAMES)  # 25

# Stats à ignorer explicitement pour les gardiennes (osef, sans rapport avec le jeu de GK)
GK_EXCLUDED_STATS = ['cf', 'corners', 'penalty', 'workRate', 'flair']
# NOTE : 'longThrows' n'est PLUS dans cette liste (correctif #2 ci-dessus) —
# une gardienne garde sa vraie valeur de relance longue à la main.

# Characters sheet morphologie
CHAR_COL_PIED = 11
CHAR_COL_TAILLE = 12
CHAR_COL_POIDS = 13
CHAR_COL_SEC1 = 6
CHAR_COL_SEC2 = 7


def slug(name):
    s = name.lower()
    rep = {'í':'i','é':'e','è':'e','á':'a','ñ':'n','ú':'u','ó':'o','ō':'o','ç':'c','à':'a','ä':'a','ö':'o','ü':'u'}
    for k,v in rep.items(): s = s.replace(k,v)
    s = re.sub(r'[^a-z0-9]+','-',s).strip('-')
    return s


def compute_group(poste: str) -> str:
    """Correctif : LM/RM sont des MIL (postes larges de milieu, cf. formations
    4-4-2/4-3-3 où mil-l/mil-r sont bien des slots MIL), pas des ATT.
    Seuls LW/RW/ST restent ATT."""
    if poste == 'GK':
        return 'GB'
    if poste in ('RB', 'LB', 'CB'):
        return 'DEF'
    if poste in ('CDM', 'CM', 'CAM', 'LM', 'RM'):
        return 'MIL'
    return 'ATT'  # LW, RW, ST


def main():
    wb = openpyxl.load_workbook(EXCEL, data_only=True)
    ws = wb['Characters']
    st = wb['Stats & OVR']
    players = []
    warnings = []

    for r in range(2, 90):
        name = ws.cell(row=r, column=1).value
        if not name:
            continue
        poste = (ws.cell(row=r, column=4).value or '').strip().upper()
        base_cell = ws.cell(row=r, column=10).value
        if base_cell is None:
            warnings.append(f"ligne {r} ({name}) : 'base' (col 10) est vide — ligne ignorée")
            continue
        base = int(base_cell)
        style = (ws.cell(row=r, column=9).value or '').strip()
        nation = (ws.cell(row=r, column=3).value or '').strip().lower()
        arch = (ws.cell(row=r, column=8).value or '')
        nickname = (ws.cell(row=r, column=2).value or '').strip()
        role = (ws.cell(row=r, column=5).value or '').strip()
        sid = slug(name)
        is_gk = (poste == 'GK')

        # --- Morphologie ---
        tailleCm = int(ws.cell(row=r, column=CHAR_COL_TAILLE).value) if ws.cell(row=r, column=CHAR_COL_TAILLE).value else 0
        poidsKg = int(ws.cell(row=r, column=CHAR_COL_POIDS).value) if ws.cell(row=r, column=CHAR_COL_POIDS).value else 0
        piedVal = (ws.cell(row=r, column=CHAR_COL_PIED).value or '').strip().lower()
        if piedVal in ('gauche', 'left'):
            piedPrefere = 'left'
        elif piedVal in ('droit', 'right'):
            piedPrefere = 'right'
        elif piedVal in ('les deux', 'both', 'ambidextre'):
            piedPrefere = 'both'
        else:
            piedPrefere = 'right'  # fallback par défaut

        # --- Postes secondaires ---
        posSec1 = (ws.cell(row=r, column=CHAR_COL_SEC1).value or '').strip().upper()
        posSec2 = (ws.cell(row=r, column=CHAR_COL_SEC2).value or '').strip().upper()

        # --- Stats ---
        names = GK_NAMES if is_gk else OUT_NAMES
        col0 = GK_COL0 if is_gk else OUT_COL0
        count = GK_COUNT if is_gk else OUT_COUNT

        raw = [st.cell(row=r, column=col0 + i).value for i in range(count)]
        stats = {}
        for i, n in enumerate(names):
            v = raw[i]
            if v is None and not is_gk:
                warnings.append(f"{name} : stat '{n}' vide (col {col0+i}) — mise à 0")
            stats[KEY[n]] = int(v) if isinstance(v, (int, float)) else 0

        if is_gk:
            for k in GK_EXCLUDED_STATS:
                stats.pop(k, None)

        players.append({
            'id': sid,
            'name': name,
            'nation': nation,
            'poste': poste,
            'style': style,
            'base': base,
            'arch': arch,
            'isGK': is_gk,
            'stats': stats,
            'nickname': nickname,
            'role': role,
            'tailleCm': tailleCm,
            'poidsKg': poidsKg,
            'piedPrefere': piedPrefere,
            'posSec1': posSec1,
            'posSec2': posSec2,
        })

    # --- Emit TS ---
    lines = []
    lines.append("// AUTO-GEN from IdolBias_Roster_Master.xlsx via _export_excel_to_ts.py")
    lines.append("// Ne pas éditer à la main. Source de vérité = le master Excel.")
    lines.append("")
    lines.append("export type StatKey =")
    lines.append("  | \"vitesse\" | \"acceleration\" | \"endurance\" | \"puissance\" | \"agilite\" | \"detente\"")
    lines.append("  | \"force\"")
    lines.append("  | \"anticipation\" | \"sangFroid\" | \"leadership\" | \"positionnement\" | \"agressivite\" | \"decision\"")
    lines.append("  | \"workRate\" | \"flair\"")
    lines.append("  | \"passe\" | \"tir\" | \"dribble\" | \"centre\" | \"tacle\" | \"controle\"")
    lines.append("  | \"jeu_de_tete\" | \"technique\"")
    lines.append("  | \"cf\" | \"corners\" | \"penalty\" | \"longThrows\"")
    lines.append("  | \"reflexes\" | \"handling\" | \"aerialReach\" | \"commandArea\" | \"kicking\" | \"rushingOut\";")
    lines.append("")
    lines.append("export interface CharacterStats {")
    lines.append("  base: number;")
    lines.append("  position: string; // FM 12-postes")
    lines.append("  group: \"GB\" | \"DEF\" | \"MIL\" | \"ATT\";")
    lines.append("  style: string;")
    lines.append("  isGK: boolean;")
    lines.append("  nickname: string;")
    lines.append("  role?: string;")
    lines.append("  tailleCm: number;")
    lines.append("  poidsKg: number;")
    lines.append("  piedPrefere: string;")
    lines.append("  posSec1?: string;")
    lines.append("  posSec2?: string;")
    lines.append("  stats: Partial<Record<StatKey, number>>;")
    lines.append("}")
    lines.append("")
    lines.append("export const CHARACTER_STATS: Record<string, CharacterStats> = {")
    for p in players:
        lines.append(f"  \"{p['id']}\": {{")
        lines.append(f"    base: {p['base']},")
        lines.append(f"    position: \"{p['poste']}\",")
        lines.append(f"    group: \"{compute_group(p['poste'])}\",")
        lines.append(f"    style: \"{p['style']}\",")
        lines.append(f"    isGK: {str(p['isGK']).lower()},")
        lines.append(f"    nickname: \"{p['nickname']}\",")
        lines.append(f"    role: \"{p['role']}\",")
        lines.append(f"    tailleCm: {p['tailleCm']},")
        lines.append(f"    poidsKg: {p['poidsKg']},")
        lines.append(f"    piedPrefere: \"{p['piedPrefere']}\",")
        if p['posSec1']:
            lines.append(f"    posSec1: \"{p['posSec1']}\",")
        if p['posSec2']:
            lines.append(f"    posSec2: \"{p['posSec2']}\",")
        lines.append("    stats: {")
        for k, v in p['stats'].items():
            lines.append(f"      {k}: {v},")
        lines.append("    },")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    lines.append(f"export const CHARACTER_STATS_COUNT = {len(players)};")
    lines.append("")

    with open(OUT_TS, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"WROTE {OUT_TS} ({len(players)} players)")
    for p in players:
        gk = "GK" if p['isGK'] else "OUT"
        print(f"  {p['id']:22} base {p['base']:3} {gk:3} {p['piedPrefere']:5} {p['tailleCm']:3}cm {p['poidsKg']:2}kg  group={compute_group(p['poste'])}")

    if warnings:
        print()
        print(f"⚠ {len(warnings)} avertissement(s) :")
        for w in warnings:
            print("  -", w)


if __name__ == '__main__':
    main()
