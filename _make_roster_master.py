import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment

wb = openpyxl.Workbook()

def style_header(ws, row, ncols, fill="1F2433"):
    for c in range(1, ncols+1):
        cell = ws.cell(row=row, column=c)
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = PatternFill("solid", fgColor=fill)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(*[Side(style="thin", color="3A3F52")]*4)

def dv(list_str):
    return DataValidation(type="list", formula1=f'"{list_str}"', allow_blank=True, showDropDown=False)

NATIONS = "france,allemagne,angleterre,italie,espagne,bresil,japon,argentine"
POSTES  = "GK,RB,LB,CB,CDM,CM,CAM,LM,RM,LW,RW,ST"
ROLES   = "poacher,target_man,false_nine,second_striker,advanced_forward,playmaker," \
           "deep_lying_playmaker,box_to_box,ball_winning,regista,libero," \
           "sweeper_keeper,winger,wide_playmaker,inverted_wingback,fullback,ball_playing_defender"
STYLES  = "percussion,vista,pressing,elevation,sangFroid"
PIEDS   = "right,left,both"
YESNO   = "oui,non"
RARITIES = ["common","rare","epic","legendary","secret"]
SQUOTE = chr(39)

ACC = [("á","a"),("à","a"),("â","a"),("ä","a"),("ã","a"),("é","e"),("è","e"),("ê","e"),("ë","e"),
       ("í","i"),("ì","i"),("î","i"),("ï","i"),("ó","o"),("ò","o"),("ô","o"),("ö","o"),("õ","o"),
       ("ú","u"),("ù","u"),("û","u"),("ü","u"),("ñ","n"),("ç","c")]

def slug_formula(cell):
    f = "LOWER(TRIM(" + cell + "))"
    for a,b in ACC:
        f = 'SUBSTITUTE(' + f + ',"' + a + '","' + b + '")'
    f = 'SUBSTITUTE(' + f + '," ","-")'
    f = 'SUBSTITUTE(' + f + ',"' + SQUOTE + '","")'
    f = 'SUBSTITUTE(' + f + ',".","")'
    return f

# ════════════════════════════════════════════════════════════════
# ONGLET 1 — CHARACTERS (15 colonnes saisie + 3 auto)
# ════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = "Characters"
headers = ["name","nickname","nation","posteNaturel (12)","role (FM)","posteSecondaire1","posteSecondaire2",
           "archetypes (libre, virgules)","style","base OVR (1-93)","pied","taille (cm)","poids (kg)",
           "signature (oui/non)","lora (ref ComfyUI)","bio / lore",
           "id (AUTO)","photo (AUTO)","refPrefix (AUTO)"]
ws.append(headers)
style_header(ws, 1, len(headers))

ws.add_data_validation(dv(NATIONS)); dv(NATIONS).add("C2:C90")
dv_pN = dv(POSTES); ws.add_data_validation(dv_pN); dv_pN.add("D2:D90")
dv_rl = dv(ROLES);  ws.add_data_validation(dv_rl); dv_rl.add("E2:E90")
dv_s1 = dv(POSTES); ws.add_data_validation(dv_s1); dv_s1.add("F2:F90")
dv_s2 = dv(POSTES); ws.add_data_validation(dv_s2); dv_s2.add("G2:G90")
dv_st = dv(STYLES); ws.add_data_validation(dv_st); dv_st.add("I2:I90")
dv_pd = dv(PIEDS);  ws.add_data_validation(dv_pd); dv_pd.add("K2:K90")
dv_sg = dv(YESNO);  ws.add_data_validation(dv_sg); dv_sg.add("N2:N90")

example = ["Soledad Diaz","Sol","argentine","ST","second_striker","CAM","LW",
           "phenomene,creatif,vision","vista",93,"both",174,68,
           "oui","soledad_diaz_v1","Capitaine de l Albiceleste. Pivot de reference."]
ws.append(example)
for _ in range(87):
    ws.append([""]*len(headers))

for r in range(2, 90):
    ws.cell(row=r, column=17).value = "=" + slug_formula("A"+str(r))
    Q = chr(34)
    ws.cell(row=r, column=18).value = '=IF(A'+str(r)+'<>'+Q+Q+',"cards/football/"&C'+str(r)+'/"&Q'+str(r)+'/standard.png",'+Q+Q+')'
    ws.cell(row=r, column=19).value = '=IF(C'+str(r)+'<>'+Q+Q+',VLOOKUP(C'+str(r)+',Références!$A$2:$B$9,2,FALSE),'+Q+Q+')'

widths = [20,12,11,14,16,15,15,30,11,13,8,10,10,14,18,38,22,42,13]
for i,w in enumerate(widths,1): ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "B2"
ws.cell(row=1, column=1).comment = Comment(
    "SOURCE DE VÉRITÉ. 1 ligne / joueuse. NE REMPLIR QUE cols A-P (name->bio). "
    "id/photo/refPrefix = AUTO (formules). base OVR capée 93. archetypes = PROFIL (répartit le budget de stats, "
    "ne boost PAS l'OVR). signature=oui réserve l'arme mythique (perso mis en avant). lora = ref ComfyUI (toi).", "Hermes")
ws.cell(row=1, column=17).comment = Comment("AUTO depuis name (slug, sans accents).", "Hermes")
ws.cell(row=1, column=18).comment = Comment("AUTO = cards/football/(nation)/(id)/standard.png", "Hermes")

# ════════════════════════════════════════════════════════════════
# ONGLET 2 — STATS & OVR
# ════════════════════════════════════════════════════════════════
st = wb.create_sheet("Stats & OVR")
OUT_NAMES = ["Vitesse","Accélération","Endurance","Puissance","Agilité","Détente",
    "Anticipation","SangFroid","Leadership","Positionnement","Agressivité","Décision",
    "Passe","Tir","Dribble","Centre","Tacle","Technique","CF","Corners","Penalty","LongThrows"]
GK_NAMES = ["Vitesse","Accélération","Endurance","Puissance","Agilité","Détente",
    "Anticipation","SangFroid","Leadership","Positionnement","Agressivité","Décision",
    "Réflexes","Handling","AerialReach","CommandArea","Kicking","RushingOut","CF","Corners","Penalty","LongThrows"]
shead = ["id (auto)","name (auto)","nation (auto)","poste (auto)","BASE (auto)",
         *OUT_NAMES, "OVR (calc pull)","Tier (auto)", "— GK BLOCK —", *GK_NAMES]
st.append(shead)
style_header(st, 1, len(shead))
group_color = {"PHY":"2C3E50","MEN":"34495E","TEC":"3D2C5E","SET":"4A2C3E","GK":"243B53"}
# color OUT (cols 6-27) and GK (cols 31-52)
for idx in range(22):
    st.cell(row=1, column=6+idx).fill = PatternFill("solid", fgColor=group_color["PHY" if idx<6 else "MEN" if idx<12 else "TEC" if idx<18 else "SET"])
for idx in range(22):
    st.cell(row=1, column=31+idx).fill = PatternFill("solid", fgColor=group_color["PHY" if idx<6 else "MEN" if idx<12 else "GK" if idx<18 else "SET"])
st.cell(row=1, column=30).fill = PatternFill("solid", fgColor="1F2433")

for r in range(2, 90):
    st.cell(row=r, column=1).value = "=Characters!Q"+str(r)
    st.cell(row=r, column=2).value = "=Characters!A"+str(r)
    st.cell(row=r, column=3).value = "=Characters!C"+str(r)
    st.cell(row=r, column=4).value = "=Characters!D"+str(r)
    st.cell(row=r, column=5).value = "=Characters!J"+str(r)
    st.cell(row=r, column=28).value = "OVR=BASE x frac+jitter au pull"
    st.cell(row=r, column=29).value = '=IF(E'+str(r)+'>=90,"legend",IF(E'+str(r)+'>=82,"star",IF(E'+str(r)+'>=70,"regular","rookie")))'

st.column_dimensions["A"].width = 22
st.column_dimensions["B"].width = 18
st.column_dimensions["C"].width = 11
st.column_dimensions["D"].width = 12
st.column_dimensions["E"].width = 12
for idx in range(22): st.column_dimensions[get_column_letter(6+idx)].width = 9
st.column_dimensions[get_column_letter(28)].width = 16
st.column_dimensions[get_column_letter(29)].width = 11
st.column_dimensions["AD"].width = 14
for idx in range(22): st.column_dimensions[get_column_letter(31+idx)].width = 9
st.freeze_panes = "F2"
st.cell(row=1, column=1).comment = Comment(
    "Grille par perso. OUT (F..AA) = 22 stats pour joueuses de champ. GK BLOCK (AE..AZ) = 22 stats pour gardiennes. "
    "Remplir UNE seule grille selon le poste. BASE (E) AUTO. OVR = BASE x frac + jitter au pull (pas dans l'Excel).", "Hermes")

# ════════════════════════════════════════════════════════════════
# ONGLET 3 — CARD PRINTS (auto)
# ════════════════════════════════════════════════════════════════
wp = wb.create_sheet("Card Prints")
ph = ["id (auto)","characterId (auto)","editionCode","rarity","refCode (auto)","mintCap (auto)","minted","skillslots (auto)"]
wp.append(ph)
style_header(wp, 1, len(ph))
r = 2
for cr in range(2, 90):
    for rar in RARITIES:
        wp.cell(row=r, column=1).value = "=LOWER(Characters!$Q"+str(cr)+")&\"-s1-"+rar+"\""
        wp.cell(row=r, column=2).value = "=Characters!$Q"+str(cr)
        wp.cell(row=r, column=3).value = "S1"
        wp.cell(row=r, column=4).value = rar
        wp.cell(row=r, column=5).value = "=Characters!$S"+str(cr)+"-\"&Characters!$Q"+str(cr)+"-\"&UPPER(LEFT(\""+rar+"\",1))"
        wp.cell(row=r, column=6).value = '=IF(D'+str(r)+'="legendary",1000,IF(D'+str(r)+'="secret",100,""))'
        wp.cell(row=r, column=7).value = 0
        wp.cell(row=r, column=8).value = '=IF(D'+str(r)+'="common",0,IF(D'+str(r)+'="rare",1,IF(D'+str(r)+'="epic",2,IF(D'+str(r)+'="legendary",3,4))))'
        r += 1
for rr in range(2, r):
    for cc in range(1, 9):
        wp.cell(row=rr, column=cc).border = Border(*[Side(style="thin", color="3A3F52")]*4)
dv_rar = dv(",".join(RARITIES)); wp.add_data_validation(dv_rar); dv_rar.add("D2:D"+str(r-1))
for i,w in enumerate([28,20,12,11,18,14,9,16],1): wp.column_dimensions[get_column_letter(i)].width = w
wp.freeze_panes = "A2"
wp.cell(row=1, column=1).comment = Comment("1 ligne / (perso × rareté). Auto depuis Characters. mintCap leg=1000/secret=100. skillslots 0/1/2/3/4.", "Hermes")

# ════════════════════════════════════════════════════════════════
# ONGLET 4 — PACKS
# ════════════════════════════════════════════════════════════════
wk = wb.create_sheet("Packs")
kh = ["packCode","name","edition","costTickets","costGems","common%","rare%","epic%","legendary%","secret%","tags"]
wk.append(kh)
style_header(wk, 1, len(kh))
wk.append(["STANDARD","Standard Pack","S1",1,350,50,30,14,5,1,"x5 cards,Standard odds"])
wk.append(["PREMIUM","Premium Pack","S1","",650,33,32,20,12,3,"x5 cards,Boosted odds"])
for i,w in enumerate([12,16,9,13,11,10,9,9,12,9,28],1): wk.column_dimensions[get_column_letter(i)].width = w
wk.freeze_panes = "A2"

# ════════════════════════════════════════════════════════════════
# ONGLET 5 — RÉFÉRENCES
# ════════════════════════════════════════════════════════════════
wr = wb.create_sheet("Références")
def block(title, rows, start):
    wr.cell(row=start, column=1, value=title).font = Font(bold=True, size=12, color="FF69B4")
    wr.cell(row=start, column=1).fill = PatternFill("solid", fgColor="1F2433")
    r = start+1
    for a,b in rows:
        wr.cell(row=r, column=1, value=a)
        wr.cell(row=r, column=2, value=b)
        r += 1
    return r+1

r = 1
r = block("NATIONS → prefix (refCode)", [
    ("france","FR"),("allemagne","DE"),("angleterre","GB"),("italie","IT"),
    ("espagne","ES"),("bresil","BR"),("japon","JP"),("argentine","AR"),
], r)
r = block("POSTES NATURELS (12) — SS = RÔLE", [
    ("GK/RB/LB/CB/CDM/CM/CAM/LM/RM/LW/RW/ST","12 cases FM"),
    ("SS","RÔLE (second_striker), pas une position. Mettre dans col role."),
], r)
r = block("ARCHETYPES → STATS (PROFIL, pas boost OVR)", [
    ("Principe","base OVR fixe (capée 93). Les archetypes RÉPARTISSENT le budget : montent les stats du profil, baissent d'autres. Stacker 3 archetypes = carte PLUS SPÉCIALISÉE, pas plus forte."),
    ("vitesse","Vitesse/Accélération/Agilité/Détente ↑ | autres ↓"),
    ("rugueux","Tacle/Agressivité/Puissance/Positionnement ↑"),
    ("finition","Tir/Détente/Technique/Sang-Froid ↑"),
    ("tete","Détente/Puissance/Centre/Agressivité ↑"),
    ("vision","Passe/Décision/Technique/Anticipation ↑"),
    ("creatif","Dribble/Technique/Centre/Passe ↑"),
    ("pressing","Endurance/Positionnement/Tacle/Agressivité ↑"),
    ("aerien","Détente/AerialReach/Puissance ↑ (GK)"),
    ("mur","Tacle/Positionnement/Puissance/Anticipation ↑"),
    ("box2box","Endurance/Positionnement/Passe/Tacle ↑"),
    ("regista","Passe/Décision/Technique/Anticipation ↑"),
    ("trequarti","Dribble/Passe/Tir ↑"),
    ("fullback","Centre/Endurance/Vitesse/Tacle ↑"),
    ("sniper","Tir/Puissance/Sang-Froid/Technique ↑"),
    ("phenomene","Agilité/Dribble/Accélération/Vitesse ↑"),
    ("patron","Leadership/Positionnement/Puissance/Sang-Froid ↑"),
    ("gardien","Réflexes/Handling/AerialReach/CommandArea ↑ (GK)"),
    ("sweeper","RushingOut/Réflexes/Agilité/Anticipation ↑ (GK)"),
], r)
r = block("STYLES (5, LIBRE, roue RPS)", [
    ("percussion","BAT Sang-froid"),("vista","BAT Pressing"),("pressing","BAT Élévation"),
    ("elevation","BAT Sang-froid"),("sangFroid","BAT Percussion"),
], r)
r = block("RARETÉ → FRAC + SKILLS (Système B)", [
    ("common","frac 0.78 | 0 skill slot"),
    ("rare","frac 0.85 | 1 slot"),
    ("epic","frac 0.91 | 2 slots"),
    ("legendary","frac 1.00 (= base) | 3 slots"),
    ("secret","frac 1.12 | 4 slots DONT 1 SIGNATURE (arme mythique, perso signature=oui)"),
    ("OVR","min(99, round(base × frac + jitter ±3)). Base capée 93."),
], r)
r = block("MALUS HORS-POSTE (Option A, FM-style)", [
    ("Naturel (vert)","0%"),("Secondaire (orange)","~-8% sur stats différentielles"),
    ("Hors postes (rouge)","~-25% sur stats différentielles (type B)"),
], r)
r = block("GAMEPLAY EXTRA (Characters)", [
    ("pied (right/left/both)","Influence Tir/Centre côté faible + moteur"),
    ("taille (cm)","Détente / AerialReach (jeu de tête)"),
    ("poids (kg)","Puissance / Agilité"),
], r)
r = block("NOTE CODE (décalage vs ce master)", [
    ("footballCards.ts","defaultPosition = 4 blocs — À MIGRER vers 12 postes + role + 2 secondaires"),
    ("footballCards.ts","defaultStyle = 1 seul — À MIGRER vers style libre + archetypes"),
    ("pack/open/route.ts","serial cosmétique (au-delà cap -> null, carte drop quand même). Pas d'annulation/remboursement."),
    ("Générateur","base × frac + jitter + redistrib archetypes + pied/taille/poids + malus NON dans le repo — À porter depuis la sim."),
], r)
wr.column_dimensions["A"].width = 34
wr.column_dimensions["B"].width = 78

import os
out = os.path.join(os.path.dirname(__file__), "IdolBias_Roster_Master.xlsx")
wb.save(out)
print("SAVED:", out, os.path.getsize(out), "bytes")
