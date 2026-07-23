"""
Export IdolBias_Roster_Master.xlsx -> src/data/characterStats.ts
Lecture seule du master. Génère le fichier TS de stats (source pour le gacha).
Aucune donnée user écrasée.
"""
import openpyxl, re

EXCEL = r'C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx'
OUT_TS = r'//wsl.localhost/Ubuntu/home/raphi/idolbias/src/data/characterStats.ts'

OUT_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente',
 'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
 'Passe','Tir','Dribble','Centre','Tacle','Technique','CF','Corners','Penalty','LongThrows']
GK_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente',
 'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
 'Réflexes','Handling','AerialReach','CommandArea','Kicking','RushingOut','CF','Corners','Penalty','LongThrows']

# clé TS (snake) <- nom Excel
KEY = {
 'Vitesse':'vitesse','Accélération':'acceleration','Endurance':'endurance','Puissance':'puissance',
 'Agilité':'agilite','Détente':'detente','Anticipation':'anticipation','SangFroid':'sangFroid',
 'Leadership':'leadership','Positionnement':'positionnement','Agressivité':'agressivite','Décision':'decision',
 'Passe':'passe','Tir':'tir','Dribble':'dribble','Centre':'centre','Tacle':'tacle','Technique':'controle',
 'CF':'cf','Corners':'corners','Penalty':'penalty','LongThrows':'longThrows',
 'Réflexes':'reflexes','Handling':'handling','AerialReach':'aerialReach','CommandArea':'commandArea',
 'Kicking':'kicking','RushingOut':'rushingOut',
}
POS_MAP = {'GK':'GB','RB':'DEF','LB':'DEF','CB':'DEF','CDM':'MIL','CM':'MIL','CAM':'MIL',
           'LM':'ATT','RM':'ATT','LW':'ATT','RW':'ATT','ST':'ATT'}

def slug(name):
    s = name.lower()
    rep = {'í':'i','é':'e','è':'e','á':'a','ñ':'n','ú':'u','ó':'o','ç':'c','à':'a','ä':'a','ö':'o','ü':'u'}
    for k,v in rep.items(): s = s.replace(k,v)
    s = re.sub(r'[^a-z0-9]+','-',s).strip('-')
    return s

def main():
    wb = openpyxl.load_workbook(EXCEL, data_only=True)
    ws = wb['Characters']; st = wb['Stats & OVR']
    players = []
    for r in range(2, 90):
        name = ws.cell(row=r, column=1).value
        if not name: continue
        poste = (ws.cell(row=r, column=4).value or '').strip().upper()
        base = int(ws.cell(row=r, column=10).value)
        style = (ws.cell(row=r, column=9).value or '').strip()
        nation = (ws.cell(row=r, column=3).value or '').strip().lower()
        arch = (ws.cell(row=r, column=8).value or '')
        nickname = (ws.cell(row=r, column=2).value or '').strip()
        sid = slug(name)
        is_gk = (poste == 'GK')
        names = GK_NAMES if is_gk else OUT_NAMES
        col0 = 31 if is_gk else 6
        raw = [st.cell(row=r, column=col0+i).value for i in range(22)]
        stats = {}
        for i, n in enumerate(names):
            v = raw[i]
            stats[KEY[n]] = int(v) if isinstance(v,(int,float)) else 0
        players.append({
            'id': sid, 'name': name, 'nation': nation, 'poste': poste,
            'group': POS_MAP.get(poste,'ATT'), 'style': style, 'base': base,
            'arch': arch, 'isGK': is_gk, 'stats': stats, 'nickname': nickname,
        })
    # emit TS
    lines = []
    lines.append("// AUTO-GEN from IdolBias_Roster_Master.xlsx via _export_excel_to_ts.py")
    lines.append("// Ne pas éditer à la main. Source de vérité = le master Excel.")
    lines.append("")
    lines.append("export type StatKey =")
    lines.append("  | \"vitesse\" | \"acceleration\" | \"endurance\" | \"puissance\" | \"agilite\" | \"detente\"")
    lines.append("  | \"anticipation\" | \"sangFroid\" | \"leadership\" | \"positionnement\" | \"agressivite\" | \"decision\"")
    lines.append("  | \"passe\" | \"tir\" | \"dribble\" | \"centre\" | \"tacle\" | \"controle\"")
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
    lines.append("  stats: Partial<Record<StatKey, number>>;")
    lines.append("}")
    lines.append("")
    lines.append("export const CHARACTER_STATS: Record<string, CharacterStats> = {")
    for p in players:
        lines.append(f"  \"{p['id']}\": {{")
        lines.append(f"    base: {p['base']},")
        lines.append(f"    position: \"{p['poste']}\",")
        lines.append(f"    group: \"{p['group']}\",")
        lines.append(f"    style: \"{p['style']}\",")
        lines.append(f"    isGK: {str(p['isGK']).lower()},")
        lines.append(f"    nickname: \"{p['nickname']}\",")
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
        print(f"  {p['id']:22} base {p['base']:3} {gk:3} {p['group']}")

if __name__ == '__main__':
    main()
