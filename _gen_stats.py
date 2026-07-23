"""
Générateur de stats IdolBias v2 — modèle FIFA (OVR pondérée, pas moyenne).
- OVR = somme pondérée des 22 stats (poids selon poste). Stats clés dominent.
- Génération: stat = base * emphasis(poste) * arch_boost * misc, emphasis centré ~0.8
  -> moyenne naturelle ~75-80, stats faibles restent faibles, stats clés montent.
- PAS de renormalisation de la moyenne (c'était ça qui créait la pile de 99).
- Légère mise à l'échelle pré-clip pour que OVR pondérée = base.
READ-ONLY sur master. Sortie CSV.
"""
import csv, re, os
import openpyxl

MASTER = r'C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx'
OUT    = r'C:\Users\Admin\Documents\IdolBias_Stats_Generated.csv'

PHY = ["Vitesse","Accélération","Endurance","Puissance","Agilité","Détente"]
MEN = ["Anticipation","SangFroid","Leadership","Positionnement","Agressivité","Décision"]
TEC_OUT = ["Passe","Tir","Dribble","Centre","Tacle","Contrôle"]
SET = ["CF","Corners","Penalty","LongThrows"]
TEC_GK = ["Réflexes","Handling","AerialReach","CommandArea","Kicking","RushingOut"]
ALL = PHY + MEN + TEC_OUT + SET
ALL_GK = PHY + MEN + TEC_GK + SET

def stat_keys(is_gk): return ALL_GK if is_gk else ALL

# Tiers d'emphasis (génération) et poids OVR (calcul) par poste.
# key=stats dominantes, imp=importantes, neu=neutres, weak=secondaires.
POS_DEF = {
 "ST": dict(key=["Tir","Contrôle","Détente"], imp=["Puissance","Agilité","Positionnement","SangFroid","Passe","Dribble","Accélération","Vitesse","Penalty"], weak=["Tacle","Anticipation","Leadership","Corners","LongThrows","CF"]),
 "SS": dict(key=["Tir","Contrôle","Dribble"], imp=["Passe","Détente","Agilité","Positionnement","SangFroid","Accélération","Vitesse","Penalty"], weak=["Tacle","Anticipation","Leadership","Corners","LongThrows","CF"]),
 "CAM": dict(key=["Passe","Contrôle","Dribble"], imp=["Tir","Décision","Positionnement","Vitesse","Accélération","Penalty"], weak=["Tacle","Agressivité","Leadership","Corners","LongThrows","CF"]),
 "CM": dict(key=["Passe","Contrôle","Positionnement"], imp=["Endurance","Décision","Anticipation","Tacle","Dribble","Vitesse"], weak=["Tir","Détente","Centre","Leadership","Corners","LongThrows","CF","Penalty"]),
 "CDM": dict(key=["Tacle","Positionnement","Anticipation"], imp=["Passe","Puissance","Décision","Endurance","Contrôle","Agressivité"], weak=["Tir","Dribble","Centre","Détente","Vitesse","Penalty","CF","Corners"]),
 "CB": dict(key=["Tacle","Positionnement","Puissance"], imp=["Détente","Anticipation","Agressivité","Contrôle","Leadership"], weak=["Tir","Dribble","Centre","Passe","Vitesse","Accélération","Agilité","CF","Penalty","Corners","LongThrows"]),
 "RB": dict(key=["Centre","Endurance","Vitesse"], imp=["Tacle","Contrôle","Accélération","Positionnement","Passe"], weak=["Tir","Dribble","Détente","Puissance","Leadership","CF","Penalty","Corners","LongThrows"]),
 "LB": dict(key=["Centre","Endurance","Vitesse"], imp=["Tacle","Contrôle","Accélération","Positionnement","Passe"], weak=["Tir","Dribble","Détente","Puissance","Leadership","CF","Penalty","Corners","LongThrows"]),
 "LM": dict(key=["Vitesse","Dribble","Centre"], imp=["Accélération","Endurance","Tir","Contrôle","Agilité"], weak=["Tacle","Positionnement","Anticipation","Puissance","Leadership","CF","LongThrows"]),
 "RM": dict(key=["Vitesse","Dribble","Centre"], imp=["Accélération","Endurance","Tir","Contrôle","Agilité"], weak=["Tacle","Positionnement","Anticipation","Puissance","Leadership","CF","LongThrows"]),
 "LW": dict(key=["Dribble","Vitesse","Tir"], imp=["Accélération","Agilité","Centre","Contrôle","Détente"], weak=["Tacle","Positionnement","Anticipation","Puissance","Leadership","CF","LongThrows"]),
 "RW": dict(key=["Dribble","Vitesse","Tir"], imp=["Accélération","Agilité","Centre","Contrôle","Détente"], weak=["Tacle","Positionnement","Anticipation","Puissance","Leadership","CF","LongThrows"]),
 "GK": dict(key=["Réflexes","Handling","Positionnement"], imp=["AerialReach","CommandArea","Décision","Anticipation","Kicking","Agilité"], weak=["Tacle","Passe","Centre","Dribble","Tir","Vitesse","Puissance","Endurance","Leadership","CF","Corners","Penalty","LongThrows","Accélération","Agressivité","SangFroid"]),
}

EMPH = {"key":1.12, "imp":1.00, "neu":0.85, "weak":0.62}
W_OVR = {"key":2.0, "imp":1.3, "neu":1.0, "weak":0.6}

def build_pos(poste):
    d = POS_DEF.get(poste, {"key":[], "imp":[], "neu":[], "weak":[]})
    emph, w = {}, {}
    for k in d.get("key",[]): emph[k]=EMPH["key"]; w[k]=W_OVR["key"]
    for k in d.get("imp",[]): emph[k]=EMPH["imp"]; w[k]=W_OVR["imp"]
    for k in d.get("weak",[]): emph[k]=EMPH["weak"]; w[k]=W_OVR["weak"]
    return emph, w

ARCH = {
 "vitesse":["Vitesse","Accélération","Agilité","Détente"],
 "rugueux":["Tacle","Agressivité","Puissance","Positionnement"],
 "finition":["Tir","Détente","Contrôle","SangFroid"],
 "tete":["Détente","Puissance","Centre","Agressivité"],
 "vision":["Passe","Décision","Contrôle","Anticipation"],
 "creatif":["Dribble","Contrôle","Centre","Passe"],
 "pressing":["Endurance","Positionnement","Tacle","Agressivité"],
 "aerien":["Détente","AerialReach","Puissance"],
 "mur":["Tacle","Positionnement","Puissance","Anticipation"],
 "box2box":["Endurance","Positionnement","Passe","Tacle"],
 "regista":["Passe","Décision","Contrôle","Anticipation"],
 "trequarti":["Dribble","Passe","Tir"],
 "fullback":["Centre","Endurance","Vitesse","Tacle"],
 "sniper":["Tir","Puissance","SangFroid","Contrôle"],
 "phenomene":["Agilité","Dribble","Accélération","Vitesse"],
 "patron":["Leadership","Positionnement","Puissance","SangFroid"],
 "gardien":["Réflexes","Handling","AerialReach","CommandArea"],
 "sweeper":["RushingOut","Réflexes","Agilité","Anticipation"],
}
ARCH_GAIN = 0.04

def norm(s): return re.sub(r"[^a-z]", "", s.lower())

def compute(row):
    name = row[0]; poste = (row[3] or "").strip().upper()
    base = row[9]
    if base is None: return None
    base = min(93, int(base))
    arche = [norm(a) for a in str(row[7] or "").split(",") if a.strip()]
    pied = (row[10] or "right").strip().lower()
    try: taille = float(row[11]) if row[11] else 178.0
    except: taille = 178.0
    try: poids = float(row[12]) if row[12] else 70.0
    except: poids = 70.0
    is_gk = (poste == "GK")
    keys = stat_keys(is_gk)
    emph, w = build_pos(poste)
    # génération (pas de scale vers base: l'OVR émerge)
    raw = {}
    for k in keys:
        e = emph.get(k, 0.85)
        a = 1.0
        for arch in arche:
            if k in ARCH.get(arch, []): a += ARCH_GAIN
        m = 1.0
        if pied == "both" and k in ("Tir","Centre","Contrôle"): m += 0.04
        if k in ("Détente","AerialReach"): m += max(0.0,(taille-175))*0.003
        if k == "Puissance": m += (poids-70)*0.002
        if k in ("Agilité","Vitesse"): m -= (poids-70)*0.002
        raw[k] = max(1, min(99, round(base * e * a * m)))
    # OVR = moyenne pondérée sur stats NON-SET (key-heavy). SET exclu du calcul.
    ovr_keys = [k for k in keys if k not in SET]
    sw = sum(w.get(k, W_OVR["neu"]) for k in ovr_keys)
    ovr = round(sum(w.get(k, W_OVR["neu"])*raw[k] for k in ovr_keys)/sw)
    return {"name":name,"poste":poste,"base":base,"stats":raw,"ovr":ovr,"keys":keys}

def main():
    wb = openpyxl.load_workbook(MASTER, data_only=False)
    ws = wb["Characters"]
    results = []
    for r in range(2, 90):
        name = ws.cell(row=r, column=1).value
        if not name: continue
        row = [ws.cell(row=r, column=c).value for c in range(1, 20)]
        res = compute(row)
        if res: results.append(res)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["name","poste","base","OVR"] + ALL)
        for res in results:
            ks = res["keys"]
            row = [res["name"], res["poste"], res["base"], res["ovr"]]
            for k in ALL:
                row.append(res["stats"].get(k, ""))
            w.writerow(row)
    print(f"GÉNÉRÉ {len(results)} joueuses -> {OUT}\n")
    for res in results:
        n99 = sum(1 for k in res["keys"] if res["stats"][k]>=99)
        line = "  ".join(f"{k[:4]}:{res['stats'][k]}" for k in res["keys"])
        print(f"=== {res['name']} | {res['poste']} | base {res['base']} -> OVR {res['ovr']} | {n99} stats a 99")
        print("  "+line+"\n")

    # --- Démonstration Messi vs Ronaldo (même base 93, profils différents) ---
    print("="*60)
    print("DÉMO Messi vs Ronaldo (base 93, OVR émerge):")
    messi = ["Lionel Messi",None,None,"RW",None,None,None,"vitesse,creatif,vision","percussion",93,"right",170,67,None,None,None,None,None,None]
    ronaldo = ["Cristiano Ronaldo",None,None,"ST",None,None,None,"tete,finisher,patron","elevation",93,"right",187,84,None,None,None,None,None,None]
    for ex in (messi, ronaldo):
        res = compute(ex)
        ks = res["keys"]
        line = "  ".join(f"{k[:4]}:{res['stats'][k]}" for k in ks)
        print(f"  {ex[0]}: base 93 -> OVR {res['ovr']}")
        print("    "+line+"\n")

if __name__ == "__main__":
    main()
