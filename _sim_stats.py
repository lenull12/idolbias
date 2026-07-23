import random, math
random.seed(7)

# ═══════════════════════════════════════════════════════════════════════════
# IDOLBIAS — SIM v2 : schéma stats split + tirage 2 étapes + moteur ébauche
# Échelle 0–100 (stats + OVR)
# ═══════════════════════════════════════════════════════════════════════════

# ─── SCHÉMA STATS ───────────────────────────────────────────────────────────
# PHYSIQUE (6) + MENTAL (6) = universels
PHY = ["vitesse","acceleration","endurance","puissance","agilite","detente"]
MEN = ["anticipation","sangFroid","leadership","positionnement","agressivite","decision"]
# TECHNIQUE : SPLIT exclusif selon poste (6 chacun)
TECH_OUTFIELD = ["passe","tir","dribble","centre","tacle","controle"]
TECH_GK       = ["reflexes","handling","aerialReach","commandArea","kicking","rushingOut"]
# SET-PIECE : dédiés outfield (branchés direct moteur, pas dérivés)
SETPIECE = ["cf","corners","penalty","longThrows"]   # GK : aucun (lit TECH_GK pour penos)

def tech_keys(pos): return TECH_GK if pos == "GB" else TECH_OUTFIELD
def all_keys(pos):
    ks = PHY + MEN + tech_keys(pos)
    if pos != "GB": ks += SETPIECE
    return ks

# ─── ARCHETYPES (tags libres, cumulables) ───────────────────────────────────
# Chaque tag = multiplicateur de stats. Cumulables à l'infini.
# L'utilisateur compose le profil librement : poste RB + "vitesse" = bombe de vitesse,
# poste RB + "rugueux" = latéral dur. Orthogonal au style (RPS).
ARCHE = {
 "vitesse":     {"vitesse":1.5,"acceleration":1.5,"agilite":1.2,"detente":1.1},
 "rugueux":     {"tacle":1.5,"agressivite":1.4,"puissance":1.2,"positionnement":1.1},
 "finition":    {"tir":1.6,"detente":1.3,"controle":1.1,"sangFroid":1.1},
 "tete":        {"detente":1.5,"puissance":1.4,"centre":1.2,"agressivite":1.1},
 "vision":      {"passe":1.6,"decision":1.4,"controle":1.3,"anticipation":1.1},
 "creatif":     {"dribble":1.5,"controle":1.4,"centre":1.2,"passe":1.1},
 "pressing":    {"endurance":1.4,"positionnement":1.3,"tacle":1.2,"agressivite":1.1},
 "aerien":      {"detente":1.5,"aerialReach":1.5,"puissance":1.2},   # GK-friendly
 "mur":         {"tacle":1.6,"positionnement":1.5,"puissance":1.3,"anticipation":1.2},
 "box2box":     {"endurance":1.4,"positionnement":1.2,"passe":1.1,"tacle":1.1,"deplacement":1.0},
 "regista":     {"passe":1.5,"decision":1.4,"controle":1.3,"anticipation":1.1},
 "trequarti":   {"dribble":1.4,"passe":1.3,"tir":1.2,"creativite":1.1},
 "fullback":    {"centre":1.4,"endurance":1.3,"vitesse":1.2,"tacle":1.1},
 "sniper":      {"tir":1.7,"puissance":1.3,"sangFroid":1.2,"controle":1.1},
 "phénomène":   {"agilite":1.5,"dribble":1.4,"acceleration":1.4,"vitesse":1.2},
 "patron":      {"leadership":1.6,"positionnement":1.3,"puissance":1.2,"sangFroid":1.1},
 "gardien":     {"reflexes":1.6,"handling":1.3,"aerialReach":1.3,"commandArea":1.2},
 "sweeper":     {"rushingOut":1.5,"reflexes":1.3,"agilite":1.3,"anticipation":1.2},
}
def norm_arche(archetags, pos):
    """Combine tous les tags en un profil de stats normalisé (moyenne=1)."""
    ks = all_keys(pos)
    raw = {k: 1.0 for k in ks}
    for t in archetags:
        for k, v in ARCHE.get(t, {}).items():
            # GK-tech seulement si GK ; sinon seulement stats universelles/outfield
            if k in ks:
                raw[k] *= v
    m = sum(raw.values())/len(raw)
    return {k: v/m for k,v in raw.items()}

# ─── PONDÉRATION OVR PAR POSTE (16 précis) ───────────────────────────────────
_POS_W_ATT = {"tir":3,"dribble":2,"vitesse":2,"sangFroid":2,"acceleration":2,"detente":1.5,"controle":1.5,"decision":1,"puissance":1,"passe":1,"centre":1,"positionnement":0.8,"anticipation":0.8,"tacle":0.6,"endurance":0.8,"leadership":0.6,"agressivite":0.8,"agilite":0.8}
_POS_W_MIL = {"passe":3,"decision":2,"controle":2,"endurance":2,"dribble":2,"positionnement":1.5,"anticipation":1.5,"tacle":1.5,"centre":1.5,"vitesse":1,"acceleration":1,"puissance":1,"sangFroid":1,"tir":1,"leadership":1,"agressivite":1,"detente":0.8,"agilite":0.8}
_POS_W_DEF = {"tacle":3,"positionnement":3,"puissance":2,"anticipation":2,"leadership":1.5,"vitesse":1,"acceleration":1,"agressivite":1,"sangFroid":1,"decision":1,"passe":0.8,"controle":0.8,"dribble":0.6,"tir":0.5,"centre":0.6,"endurance":1.2,"detente":0.8,"agilite":0.8}
_POS_W_GK  = {"reflexes":3,"handling":2,"aerialReach":1.5,"commandArea":1.5,"rushingOut":1.5,"kicking":1,"anticipation":1.5,"agilite":2,"vitesse":1,"acceleration":1,"decision":1.2,"positionnement":1.5,"sangFroid":1.5,"puissance":1,"leadership":1,"endurance":1.2,"agressivite":0.8,"detente":0.8}
POS_W = {
 "ATT":dict(_POS_W_ATT), "ST":dict(_POS_W_ATT), "SS":{**_POS_W_ATT,"passe":1.5,"vision":1.5,"dribble":2.2},
 "MIL":dict(_POS_W_MIL), "CM":dict(_POS_W_MIL), "CAM":{**_POS_W_MIL,"tir":1.5,"dribble":2.2,"passe":3.2},
 "CDM":{**_POS_W_MIL,"tacle":2.5,"positionnement":2.5,"endurance":2.5,"passe":2.5},
 "DEF":dict(_POS_W_DEF), "CB":dict(_POS_W_DEF),
 "RB":{**_POS_W_DEF,"vitesse":1.8,"centre":1.8,"endurance":1.8,"acceleration":1.6,"dribble":1.2,"tacle":2.6,"positionnement":2.6},
 "LB":{**_POS_W_DEF,"vitesse":1.8,"centre":1.8,"endurance":1.8,"acceleration":1.6,"dribble":1.2,"tacle":2.6,"positionnement":2.6},
 "LM":{**_POS_W_MIL,"vitesse":2,"dribble":2.2,"centre":2,"acceleration":2,"endurance":1.8},
 "RM":{**_POS_W_MIL,"vitesse":2,"dribble":2.2,"centre":2,"acceleration":2,"endurance":1.8},
 "LW":{**_POS_W_ATT,"vitesse":2.2,"acceleration":2.2,"dribble":2.6,"centre":1.8},
 "RW":{**_POS_W_ATT,"vitesse":2.2,"acceleration":2.2,"dribble":2.6,"centre":1.8},
 "GB":dict(_POS_W_GK),
}
def compute_ovr(stats, pos):
    w = POS_W[pos]
    ks = all_keys(pos)
    num = sum(stats.get(k,0)*w.get(k,0.5) for k in ks)
    den = sum(w.get(k,0.5) for k in ks)
    return round(num/den)

# ─── JOUEUSES (plafond OVR + archetypes LIBRES + style LIBRE) ───────────────
STARS = [
 ("FR","Olivier Atton",94,"ATT",["finition","sniper"],"Sang-froid"),
 ("FR","Benji Visse",88,"MIL",["vision","regista"],"Vista"),
 ("DE","K. Pflaum",92,"DEF",["mur","rugueux"],"Pressing"),
 ("DE","H. Dobrung",86,"MIL",["box2box","pressing"],"Pressing"),
 ("BR","D. Sousa",93,"ATT",["vitesse","phénomène","creatif"],"Percussion"),
 ("BR","T. Marlos",89,"ATT",["finition","tete"],"Élévation"),
 ("AR","D. Martez",91,"MIL",["vision","regista"],"Vista"),
 ("AR","R. Iguaran",87,"ATT",["finition","sniper"],"Sang-froid"),
 ("IT","P. Nero",90,"DEF",["mur","rugueux"],"Pressing"),
 ("IT","G. Brio",85,"GB",["gardien","sweeper"],"Pressing"),
 ("ES","X. Cruze",89,"MIL",["box2box","pressing"],"Pressing"),
 ("ES","I. Ferro",84,"MIL",["vision","trequarti"],"Vista"),
 ("GB","Mark Landers",88,"ATT",["tete","finition","patron"],"Élévation"),
 ("JP","T. Ozora",87,"ATT",["vitesse","phénomène","creatif"],"Percussion"),
]
NATIONS = ["FR","DE","GB","IT","ES","BR","JP","AR"]
PER_NATION = 11
stars_by_nat = {}
for s in STARS: stars_by_nat.setdefault(s[0], []).append(s)

# archetypes par défaut selon poste (libre de les écraser)
ARCHE_FOR_POS = {
 "ATT":["finition","finition"], "MIL":["box2box","vision"], "DEF":["mur","rugueux"],
 "GB":["gardien"], "RB":["fullback","vitesse"], "LB":["fullback","vitesse"],
 "CB":["mur","rugueux"], "CDM":["regista","pressing"], "CM":["box2box","vision"],
 "CAM":["trequarti","vision"], "LM":["creatif","vitesse"], "RM":["creatif","vitesse"],
 "LW":["vitesse","phénomène"], "RW":["vitesse","phénomène"], "ST":["finition","tete"], "SS":["trequarti","finition"],
}
STYLE_FOR_POS = {"ATT":"Sang-froid","MIL":"Vista","DEF":"Pressing","GB":"Pressing",
 "RB":"Percussion","LB":"Percussion","CB":"Pressing","CDM":"Pressing","CM":"Vista","CAM":"Vista",
 "LM":"Vista","RM":"Vista","LW":"Percussion","RW":"Percussion","ST":"Sang-froid","SS":"Vista"}
POS_ORDER = ["ATT","MIL","DEF","GB","RB","LB","CB","CDM","CM","CAM","LM","RM","LW","RW","ST","SS"]
POS_ORDER_SHORT = ["ATT","MIL","DEF","GB"]

players = []
for nat in NATIONS:
    slist = stars_by_nat.get(nat, [])
    for s in slist:
        players.append({"nat":s[0],"name":s[1],"ceil":s[2],"pos":s[3],
                        "arche":s[4],"style":s[5],"tier":"star"})
    n_fill = PER_NATION - len(slist)
    for i in range(n_fill):
        # choisir un poste varié parmi les 16
        pos = POS_ORDER[(i + NATIONS.index(nat)) % len(POS_ORDER)]
        arche = ARCHE_FOR_POS.get(pos, ["box2box"])
        ceil = 56 + ((i*3 + NATIONS.index(nat)) % 23)
        players.append({"nat":nat,"name":f"{nat}-{i+1:02d}","ceil":ceil,"pos":pos,
                        "arche":arche,"style":STYLE_FOR_POS.get(pos,"Vista"),"tier":"filler"})

def tier_of(ceil):
    if ceil >= 90: return "legend"
    if ceil >= 82: return "star"
    if ceil >= 70: return "regular"
    return "rookie"
RANGE = {"legend":7,"star":11,"regular":14,"rookie":18}
FRAC  = {"common":0.10,"rare":0.30,"epic":0.50,"legendary":0.72,"secret":0.92}

def gen_card(p, rarity):
    """Génère UNE carte (stats + OVR) pour perso p et rareté rarity."""
    t = tier_of(p["ceil"]); floor = p["ceil"] - RANGE[t]
    target = floor + FRAC[rarity]*(p["ceil"]-floor) + random.uniform(-1.5,1.5)
    target = max(floor-2, min(p["ceil"]+2, target))
    rw = norm_arche(p["arche"], p["pos"]); sigma = 3 + target/100*4
    stats = {}
    # PHY + MEN universels
    for k in PHY+MEN:
        stats[k] = round(max(1, min(100, target*rw.get(k,1.0) + random.gauss(0,sigma))))
    # TECH split
    for k in tech_keys(p["pos"]):
        stats[k] = round(max(1, min(100, target*rw[k] + random.gauss(0,sigma))))
    # SET-PIECE (outfield only)
    if p["pos"] != "GB":
        for k in SETPIECE:
            v = target * (1.05 if k in ("cf","penalty") else 0.95) + random.gauss(0,sigma)
            stats[k] = round(max(1, min(100, v)))
    return stats, compute_ovr(stats, p["pos"])

# ═══════════════════════════════════════════════════════════════════════════
# TIRAGE 2 ÉTAPES  (fix crainte : stars accessibles)
# ═══════════════════════════════════════════════════════════════════════════
RARITY_POOL = ["common","rare","epic","legendary","secret"]
RARITY_W    = [0.55, 0.30, 0.119, 0.029, 0.002]   # ~1/50 secret
STAR_PERSO_BASE = 0.15        # 15% de chance que le perso tiré soit une star (n'importe laquelle)
BANNER_FEATURED_SHARE = 0.60   # sur un banner, 60% des star-drops = la star featured
PITY_PERSO = 30               # tout 30 pulls sans star -> star garantie

stars_list = [p for p in players if p["tier"]=="star"]
fillers_list = [p for p in players if p["tier"]=="filler"]

def draw_one(banner_star=None, pity_counter=0):
    """Étape 1: perso (star vs filler, avec banner + pity perso).
       Étape 2: rareté du print."""
    # --- Étape 1 : perso ---
    if pity_counter >= PITY_PERSO:
        p = random.choice(stars_list)
    elif random.random() < STAR_PERSO_BASE:
        # star drop : sur banner, 60% c'est la featured
        if banner_star and random.random() < BANNER_FEATURED_SHARE:
            p = banner_star
        else:
            p = random.choice(stars_list)
    else:
        p = random.choice(fillers_list)
    # --- Étape 2 : rareté ---
    r = random.choices(RARITY_POOL, weights=RARITY_W)[0]
    stats, ovr = gen_card(p, r)
    return {"name":p["name"],"nat":p["nat"],"pos":p["pos"],"rarity":r,"ovr":r and ovr,
            "is_star":p["tier"]=="star","is_featured":(p is banner_star) if banner_star else False,
            "ceil":p["ceil"],"banner":bool(banner_star)}

# ═══════════════════════════════════════════════════════════════════════════
# MOTEUR ÉBAUCHE (Palier 2–3) — 4 phases + save GK + set-piece
# ═══════════════════════════════════════════════════════════════════════════
def phase_score(side, phase):
    """score d'une équipe pour une phase (somme des stats pertinentes)."""
    W = {
      "construction": {"passe":2,"controle":2,"decision":1,"positionnement":1},
      "progression":  {"dribble":2,"vitesse":2,"acceleration":1,"endurance":1},
      "creation":     {"centre":2,"tir":1,"tacle":1,"anticipation":1},
      "finition":     {"tir":3,"detente":1,"puissance":1,"sangFroid":2},
    }[phase]
    return sum(side.get(k,0)*w for k,w in W.items())

def gk_save_score(gk):
    return gk.get("reflexes",0)*3 + gk.get("handling",0)*2 + gk.get("positionnement",0)*1.5 + gk.get("anticipation",0)*1.5

def resolve(possession_att, possession_def, gk_def, k=0.35):
    """Résout une possession complète. Retourne but(0/1)."""
    ph = ["construction","progression","creation","finition"]
    for i,p in enumerate(ph):
        a = phase_score(possession_att, p)
        d = phase_score(possession_def, p)
        # finition -> save sub-phase GK
        if p == "finition":
            d = gk_save_score(gk_def)
            a *= 0.85  # pénalité de conversion
        p_win = 1/(1+math.exp(-k*(a-d)))
        if random.random() > p_win:
            return 0  # possession perdue
    return 1  # but

def setpiece_chance(taker, kind):
    """kind: cf / corners / penalty. Retourne proba réussite."""
    if kind == "penalty":
        return min(0.98, taker.get("penalty",0)/100*0.95 + 0.3)  # base 30% + skill
    if kind == "cf":
        return min(0.9, taker.get("cf",0)/100*0.8 + 0.2)
    if kind == "corners":
        return min(0.85, taker.get("corners",0)/100*0.7 + 0.15)
    return 0.5

# ═══════════════════════════════════════════════════════════════════════════
# SORTIES
# ═══════════════════════════════════════════════════════════════════════════
from collections import Counter
print("="*78)
print("SCHÉMA STATS — 0/100")
print(f"  PHY(6)+MEN(6) universels | TECH split: OUTFIELD(6)={TECH_OUTFIELD} | GK(6)={TECH_GK}")
print(f"  SET-PIECE outfield(4)={SETPIECE} | GK: aucun (lit TECH_GK)")
print(f"  Compte carte: Outfield={len(PHY+MEN)+len(TECH_OUTFIELD)+len(SETPIECE)} | GK={len(PHY+MEN)+len(TECH_GK)}")
print("="*78)

print("\nTABLEAU 88 JOUEUSES (OVR common vs secret)")
hdr = f"{'NAT':3} {'NOM':14} {'POS':3} {'ROLE':13} {'PLAF':>4} {'SEC':>4} {'COM':>4}"
print(hdr); print("-"*len(hdr))
for p in players:
    _, ovr_s = gen_card(p,"secret"); _, ovr_c = gen_card(p,"common")
    print(f"{p['nat']:3} {p['name']:14} {p['pos']:3} {','.join(p['arche']):13} {p['ceil']:>4} {ovr_s:>4} {ovr_c:>4}")

print("\nDETAIL 3 STARS (stats completes, common vs secret)")
for name in ["Olivier Atton","Mark Landers","G. Brio"]:
    p = next(x for x in players if x["name"]==name)
    sc, ovr_s = gen_card(p,"secret"); cc, ovr_c = gen_card(p,"common")
    print(f"\n>> {name} ({p['nat']} {p['pos']} {'+'.join(p['arche'])} / {p['style']}) plafond {p['ceil']}  OVR sec={ovr_s} com={ovr_c}")
    ks = all_keys(p["pos"])
    print("   SEC : " + "  ".join(f"{k[:4]}={sc[k]}" for k in ks))
    print("   COM : " + "  ".join(f"{k[:4]}={cc[k]}" for k in ks))

print("\nCONTROLE WOW (secret star vs secret rookie)")
legend = next(p for p in players if p["name"]=="Olivier Atton")
rookie = min((p for p in players if p["tier"]=="filler"), key=lambda x:x["ceil"])
_, lo = gen_card(rookie,"secret"); _, ls = gen_card(legend,"secret")
print(f"  Secret ROOKIE ({rookie['name']} plafond {rookie['ceil']}) -> OVR {lo}")
print(f"  Secret LEGEND ({legend['name']} plafond {legend['ceil']}) -> OVR {ls}")

print("\n" + "="*78)
print("ATTEIGNABILITÉ STARS — simulation 2000 pulls")
for label, cfg in [("BASE (15% perso-star, sans banner)",{"banner":None}),
                   ("BANNER + PITY (featured 60% des star-drops, pity 30)",{"banner":next(p for p in players if p['name']=='Olivier Atton')})]:
    pulls = []; pity = 0; star_hits = 0
    for _ in range(2000):
        pity += 1
        c = draw_one(banner_star=cfg["banner"], pity_counter=pity)
        pulls.append(c)
        if c["is_star"]:
            star_hits += 1; pity = 0
    star_rar = Counter(c["rarity"] for c in pulls if c["is_star"])
    print(f"\n  [{label}]")
    print(f"    Stars obtenues sur 2000 pulls : {star_hits}  (~1 star / {2000//max(star_hits,1)} pulls)")
    print(f"    Repartition rareté des stars  : {dict(star_rar)}")
    if cfg["banner"]:
        b = sum(1 for c in pulls if c.get("is_featured"))
        print(f"    Dont la star FEATURED du banner : {b}  (~1 / {2000//max(b,1)} pulls)")
print("="*78)

print("\nMOTEUR ÉBAUCHE — 1 match résolu (Attaque stars vs Défense filler + GK)")
att = {k:90 for k in all_keys("ATT")}; att.update({"tir":95,"dribble":92,"passe":88,"centre":85})
defn= {k:60 for k in all_keys("DEF")}; defn.update({"tacle":65,"positionnement":62})
# GK = dict COMPLET (PHY+MEN+TECH_GK) pour que gk_save_score lise positionnement/anticipation
gk = {k:70 for k in PHY+MEN+TECH_GK}; gk.update({"reflexes":78,"handling":72})
buts = sum(resolve(att, defn, gk, k=0.12) for _ in range(20))
print(f"  Sur 20 possessions : {buts} buts (Att 90 vs Def 60 + GK 70)  [k=0.12, ébauche]")
print(f"  Set-piece CF réussite (taker 95): {setpiece_chance(att,'cf'):.0%}")
print(f"  Penalty réussite (taker 90): {setpiece_chance(att,'penalty' if False else 'penalty'):.0%}")
print("  -> Moteur v0.1 : chiffres indicatifs, calibration (k, poids, fatigue) à venir.")
print("\n(Fin sim — moteur v0.1, itératif)")
