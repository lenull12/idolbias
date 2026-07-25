#!/usr/bin/env python3
"""
_generate_all_stats.py — Régénère TOUTES les stats (ARG + JPN + ALL)
en créant des vrais profils variés basés sur :
  - base OVR
  - position (12 postes FM)
  - archétypes
  - taille / poids
  - rôle FM
"""
import openpyxl, re, math, random

EXCEL = r'C:\Users\Admin\Documents\IdolBias_Roster_Master.xlsx'

random.seed(42)  # reproductible

OUT_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente','Force',
             'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
             'Work Rate','Flair',
             'Passe','Tir','Dribble','Centre','Tacle','Contrôle','Jeu de tête','Technique',
             'CF','Corners','Penalty','LongThrows']

OUT_KEYS = ['vitesse','acceleration','endurance','puissance','agilite','detente','force',
            'anticipation','sangFroid','leadership','positionnement','agressivite','decision',
            'workRate','flair',
            'passe','tir','dribble','centre','tacle','controle','jeu_de_tete','technique',
            'cf','corners','penalty','longThrows']

GK_NAMES = ['Vitesse','Accélération','Endurance','Puissance','Agilité','Détente','Force',
            'Anticipation','SangFroid','Leadership','Positionnement','Agressivité','Décision',
            'Work Rate','Flair',
            'Réflexes','Handling','AerialReach','CommandArea','Kicking','RushingOut',
            'CF','Corners','Penalty','LongThrows']

GK_KEYS = ['vitesse','acceleration','endurance','puissance','agilite','detente','force',
           'anticipation','sangFroid','leadership','positionnement','agressivite','decision',
           'workRate','flair',
           'reflexes','handling','aerialReach','commandArea','kicking','rushingOut',
           'cf','corners','penalty','longThrows']

# ─── ARCHETYPES → stat bumps (cumulables) ───────────────────────────────
ARCH_BOOST = {
    'vitesse':   {'vitesse':8,'acceleration':8,'agilite':6,'detente':4},
    'rugueux':   {'tacle':8,'agressivite':8,'puissance':6,'positionnement':4},
    'finition':  {'tir':10,'detente':6,'technique':5,'sangFroid':5},
    'tete':      {'detente':8,'puissance':6,'centre':5,'agressivite':4,'jeu_de_tete':10},
    'vision':    {'passe':8,'decision':6,'technique':5,'anticipation':5},
    'creatif':   {'dribble':8,'technique':6,'centre':4,'passe':4},
    'pressing':  {'endurance':8,'positionnement':6,'tacle':5,'agressivite':5},
    'aerien':    {'detente':6,'aerialReach':8,'puissance':4},
    'mur':       {'tacle':8,'positionnement':8,'puissance':5,'anticipation':5},
    'box2box':   {'endurance':8,'positionnement':5,'passe':5,'tacle':4},
    'regista':   {'passe':10,'decision':7,'technique':6,'anticipation':5},
    'trequarti': {'dribble':8,'passe':5,'tir':5},
    'fullback':  {'centre':8,'endurance':6,'vitesse':5,'tacle':5},
    'sniper':    {'tir':8,'puissance':6,'sangFroid':5,'technique':4},
    'phenomene': {'agilite':8,'dribble':8,'acceleration':6,'vitesse':6},
    'patron':    {'leadership':8,'positionnement':6,'puissance':5,'sangFroid':5},
    'gardien':   {'reflexes':10,'handling':8,'aerialReach':6,'commandArea':6},
    'sweeper':   {'rushingOut':10,'reflexes':6,'agilite':5,'anticipation':5},
}
CREATIVE_TAGS = {'creatif','vision','phenomene','trequarti','regista'}

ROLE_WORKRATE = {
    'poacher': 52, 'target_man': 55, 'stopper': 50,
    'anchor': 58, 'ball_playing_defender': 65,
    'inverted_wingback': 72, 'inside_forward': 60,
    'deep_lying_playmaker': 68, 'fullback': 75,
    'regista': 62, 'libero': 62, 'winger': 65, 'second_striker': 65,
    'sweeper_keeper': 60, 'trequartista': 45,
    'box_to_box': 88, 'false_nine': 60,
    'ball_winning': 85, 'advanced_forward': 58, 'playmaker': 55,
    'wide_playmaker': 65,
}
DEF_WORKRATE = 60

def flair_from_archetypes(tags):
    return min(99, 40 + sum(6 for t in tags if t in CREATIVE_TAGS))

# ─── POSTE → planchers et plafonds par stat ─────────────────────────────
# Chaque poste définit des profils de stats : certaines sont hautes,
# d'autres basses. Valeurs = (min_pct, max_pct, default_pct) du budget.
POSITION_PROFILES = {
    'ST': {
        # ST : explosif, finition haute, défense basse
        'vitesse':(75,99,'H'),'acceleration':(75,99,'H'),'endurance':(55,85,'M'),
        'puissance':(60,90,'M'),'agilite':(65,95,'H'),'detente':(65,95,'H'),
        'force':(55,85,'M'),
        'anticipation':(50,75,'M'),'sangFroid':(70,95,'H'),'leadership':(50,75,'M'),
        'positionnement':(55,80,'M'),'agressivite':(50,80,'M'),'decision':(55,85,'M'),
        'passe':(50,85,'M'),'tir':(80,99,'H'),'dribble':(70,99,'H'),
        'centre':(45,80,'M'),'tacle':(20,55,'B'),'controle':(65,95,'H'),
        'jeu_de_tete':(50,90,'M'),'technique':(60,90,'M'),
        'cf':(40,80,'M'),'corners':(40,80,'M'),'penalty':(60,95,'H'),'longThrows':(25,50,'B'),
        'workRate':(55,75,'M'),'flair':(50,80,'M'),
    },
    'CAM': {
        'vitesse':(60,85,'M'),'acceleration':(60,85,'M'),'endurance':(60,85,'M'),
        'puissance':(45,75,'B'),'agilite':(70,95,'H'),'detente':(50,75,'M'),
        'force':(35,60,'B'),
        'anticipation':(70,95,'H'),'sangFroid':(65,90,'H'),'leadership':(50,75,'M'),
        'positionnement':(55,80,'M'),'agressivite':(40,70,'B'),'decision':(65,90,'H'),
        'passe':(80,99,'H'),'tir':(65,90,'H'),'dribble':(80,99,'H'),
        'centre':(60,85,'M'),'tacle':(25,55,'B'),'controle':(70,95,'H'),
        'jeu_de_tete':(30,55,'B'),'technique':(75,99,'H'),
        'cf':(55,90,'M'),'corners':(55,90,'M'),'penalty':(60,90,'M'),'longThrows':(20,40,'B'),
        'workRate':(55,75,'M'),'flair':(65,95,'H'),
    },
    'CDM': {
        'vitesse':(45,75,'M'),'acceleration':(45,70,'M'),'endurance':(75,99,'H'),
        'puissance':(60,90,'H'),'agilite':(50,75,'M'),'detente':(50,80,'M'),
        'force':(55,85,'M'),
        'anticipation':(65,90,'H'),'sangFroid':(55,80,'M'),'leadership':(55,85,'M'),
        'positionnement':(70,95,'H'),'agressivite':(65,95,'H'),'decision':(65,90,'H'),
        'passe':(60,90,'M'),'tir':(40,70,'B'),'dribble':(40,70,'B'),
        'centre':(40,70,'B'),'tacle':(70,95,'H'),'controle':(60,85,'M'),
        'jeu_de_tete':(45,75,'M'),'technique':(50,80,'M'),
        'cf':(40,70,'B'),'corners':(40,70,'B'),'penalty':(40,70,'B'),'longThrows':(50,80,'M'),
        'workRate':(75,95,'H'),'flair':(30,55,'B'),
    },
    'CM': {
        'vitesse':(55,80,'M'),'acceleration':(55,80,'M'),'endurance':(75,95,'H'),
        'puissance':(55,85,'M'),'agilite':(55,80,'M'),'detente':(50,75,'M'),
        'force':(50,75,'M'),
        'anticipation':(65,90,'H'),'sangFroid':(55,80,'M'),'leadership':(55,85,'M'),
        'positionnement':(60,85,'M'),'agressivite':(55,85,'M'),'decision':(65,90,'H'),
        'passe':(70,95,'H'),'tir':(55,80,'M'),'dribble':(60,85,'M'),
        'centre':(50,75,'M'),'tacle':(55,85,'M'),'controle':(65,90,'H'),
        'jeu_de_tete':(45,70,'M'),'technique':(60,85,'M'),
        'cf':(40,70,'B'),'corners':(40,70,'B'),'penalty':(50,80,'M'),'longThrows':(40,70,'B'),
        'workRate':(75,95,'H'),'flair':(45,70,'M'),
    },
    'CB': {
        'vitesse':(50,80,'M'),'acceleration':(50,75,'M'),'endurance':(60,85,'M'),
        'puissance':(70,99,'H'),'agilite':(50,70,'M'),'detente':(65,95,'H'),
        'force':(65,95,'H'),
        'anticipation':(70,95,'H'),'sangFroid':(55,85,'M'),'leadership':(60,90,'H'),
        'positionnement':(75,99,'H'),'agressivite':(60,90,'H'),'decision':(55,85,'M'),
        'passe':(50,80,'M'),'tir':(35,60,'B'),'dribble':(20,55,'B'),
        'centre':(40,70,'B'),'tacle':(70,95,'H'),'controle':(50,75,'M'),
        'jeu_de_tete':(65,95,'H'),'technique':(45,70,'B'),
        'cf':(45,75,'M'),'corners':(40,70,'B'),'penalty':(45,75,'M'),'longThrows':(40,70,'B'),
        'workRate':(55,75,'M'),'flair':(30,55,'B'),
    },
    'RB': {
        'vitesse':(70,95,'H'),'acceleration':(70,95,'H'),'endurance':(70,95,'H'),
        'puissance':(50,80,'M'),'agilite':(60,85,'M'),'detente':(55,80,'M'),
        'force':(45,70,'M'),
        'anticipation':(55,80,'M'),'sangFroid':(50,75,'M'),'leadership':(45,70,'M'),
        'positionnement':(60,85,'M'),'agressivite':(55,85,'M'),'decision':(55,80,'M'),
        'passe':(55,80,'M'),'tir':(35,60,'B'),'dribble':(50,75,'M'),
        'centre':(65,95,'H'),'tacle':(60,90,'H'),'controle':(55,80,'M'),
        'jeu_de_tete':(35,60,'B'),'technique':(50,75,'M'),
        'cf':(40,65,'B'),'corners':(40,65,'B'),'penalty':(45,70,'M'),'longThrows':(45,75,'M'),
        'workRate':(70,90,'H'),'flair':(40,65,'B'),
    },
    'LB': {
        'vitesse':(70,95,'H'),'acceleration':(70,95,'H'),'endurance':(70,95,'H'),
        'puissance':(50,80,'M'),'agilite':(60,85,'M'),'detente':(55,80,'M'),
        'force':(45,70,'M'),
        'anticipation':(55,80,'M'),'sangFroid':(50,75,'M'),'leadership':(45,70,'M'),
        'positionnement':(60,85,'M'),'agressivite':(55,85,'M'),'decision':(55,80,'M'),
        'passe':(55,80,'M'),'tir':(35,60,'B'),'dribble':(50,75,'M'),
        'centre':(65,95,'H'),'tacle':(60,90,'H'),'controle':(55,80,'M'),
        'jeu_de_tete':(35,60,'B'),'technique':(50,75,'M'),
        'cf':(40,65,'B'),'corners':(40,65,'B'),'penalty':(45,70,'M'),'longThrows':(45,75,'M'),
        'workRate':(70,90,'H'),'flair':(40,65,'B'),
    },
    'LW': {
        'vitesse':(80,99,'H'),'acceleration':(80,99,'H'),'endurance':(65,85,'M'),
        'puissance':(40,70,'B'),'agilite':(75,99,'H'),'detente':(50,75,'M'),
        'force':(30,55,'B'),
        'anticipation':(55,80,'M'),'sangFroid':(55,80,'M'),'leadership':(40,65,'B'),
        'positionnement':(50,75,'M'),'agressivite':(40,65,'B'),'decision':(55,80,'M'),
        'passe':(60,85,'M'),'tir':(55,85,'M'),'dribble':(80,99,'H'),
        'centre':(70,95,'H'),'tacle':(25,55,'B'),'controle':(70,95,'H'),
        'jeu_de_tete':(25,50,'B'),'technique':(65,90,'H'),
        'cf':(40,70,'B'),'corners':(50,80,'M'),'penalty':(50,80,'M'),'longThrows':(20,40,'B'),
        'workRate':(55,75,'M'),'flair':(65,95,'H'),
    },
    'RW': {
        'vitesse':(80,99,'H'),'acceleration':(80,99,'H'),'endurance':(65,85,'M'),
        'puissance':(40,70,'B'),'agilite':(75,99,'H'),'detente':(50,75,'M'),
        'force':(30,55,'B'),
        'anticipation':(55,80,'M'),'sangFroid':(55,80,'M'),'leadership':(40,65,'B'),
        'positionnement':(50,75,'M'),'agressivite':(40,65,'B'),'decision':(55,80,'M'),
        'passe':(60,85,'M'),'tir':(55,85,'M'),'dribble':(80,99,'H'),
        'centre':(70,95,'H'),'tacle':(25,55,'B'),'controle':(70,95,'H'),
        'jeu_de_tete':(25,50,'B'),'technique':(65,90,'H'),
        'cf':(40,70,'B'),'corners':(50,80,'M'),'penalty':(50,80,'M'),'longThrows':(20,40,'B'),
        'workRate':(55,75,'M'),'flair':(65,95,'H'),
    },
    'LM': {
        'vitesse':(70,90,'H'),'acceleration':(70,90,'H'),'endurance':(70,90,'H'),
        'puissance':(50,80,'M'),'agilite':(65,85,'M'),'detente':(50,75,'M'),
        'force':(45,70,'M'),
        'anticipation':(55,80,'M'),'sangFroid':(55,80,'M'),'leadership':(50,75,'M'),
        'positionnement':(55,80,'M'),'agressivite':(50,80,'M'),'decision':(60,85,'M'),
        'passe':(70,90,'H'),'tir':(50,75,'M'),'dribble':(60,85,'M'),
        'centre':(70,90,'H'),'tacle':(45,75,'M'),'controle':(60,85,'M'),
        'jeu_de_tete':(35,60,'B'),'technique':(60,85,'M'),
        'cf':(45,70,'M'),'corners':(50,80,'M'),'penalty':(50,75,'M'),'longThrows':(35,60,'B'),
        'workRate':(65,85,'M'),'flair':(55,80,'M'),
    },
    'RM': {
        'vitesse':(70,90,'H'),'acceleration':(70,90,'H'),'endurance':(70,90,'H'),
        'puissance':(50,80,'M'),'agilite':(65,85,'M'),'detente':(50,75,'M'),
        'force':(45,70,'M'),
        'anticipation':(55,80,'M'),'sangFroid':(55,80,'M'),'leadership':(50,75,'M'),
        'positionnement':(55,80,'M'),'agressivite':(50,80,'M'),'decision':(60,85,'M'),
        'passe':(70,90,'H'),'tir':(50,75,'M'),'dribble':(60,85,'M'),
        'centre':(70,90,'H'),'tacle':(45,75,'M'),'controle':(60,85,'M'),
        'jeu_de_tete':(35,60,'B'),'technique':(60,85,'M'),
        'cf':(45,70,'M'),'corners':(50,80,'M'),'penalty':(50,75,'M'),'longThrows':(35,60,'B'),
        'workRate':(65,85,'M'),'flair':(55,80,'M'),
    },
}

GK_PROFILE = {
    'reflexes':(85,99,'H'),'handling':(80,99,'H'),'aerialReach':(75,99,'H'),
    'commandArea':(70,99,'H'),'kicking':(55,85,'M'),'rushingOut':(60,90,'M'),
    'vitesse':(25,55,'B'),'acceleration':(25,55,'B'),'endurance':(50,80,'M'),
    'puissance':(45,75,'M'),'agilite':(35,65,'B'),'detente':(40,70,'B'),
    'force':(40,70,'B'),
    'anticipation':(50,80,'M'),'sangFroid':(50,80,'M'),'leadership':(40,70,'B'),
    'positionnement':(45,75,'M'),'agressivite':(40,70,'B'),'decision':(50,80,'M'),
    'longThrows':(30,60,'B'),
}

def generate_outfield(base, poste, taille_cm, poids_kg, arch_tags, role):
    profile = POSITION_PROFILES.get(poste, POSITION_PROFILES['CM'])
    keys = [k for k in profile.keys()]
    
    stats = {}
    for key, (pmin, pmax, tier) in profile.items():
        # Target: a percentage of base based on the tier
        # H (high): 85-105% of base
        # M (medium): 60-85% of base
        # B (low): 25-60% of base
        if tier == 'H':
            raw = base * (0.75 + random.random() * 0.20)
        elif tier == 'M':
            raw = base * (0.50 + random.random() * 0.25)
        else:  # B
            raw = base * (0.20 + random.random() * 0.30)
        
        # Apply archetype boosts
        for tag in arch_tags:
            if tag in ARCH_BOOST and key in ARCH_BOOST[tag]:
                raw += ARCH_BOOST[tag][key]
        
        # Height/weight adjustments
        # Tall + heavy → more power/detente, less agility
        bmi = poids_kg / ((taille_cm/100)**2) if taille_cm > 0 else 22
        if key in ('puissance','detente','force','tete','tacle'):
            raw += (taille_cm - 170) * 0.15 + (poids_kg - 65) * 0.15
        if key in ('agilite','vitesse','acceleration'):
            raw -= (taille_cm - 175) * 0.1 + max(0, poids_kg - 68) * 0.15
        
        # Jitter
        raw += random.gauss(0, 2)
        
        # Clamp to position bounds
        lo = base * pmin / 100
        hi = base * pmax / 100
        stats[key] = max(1, min(99, round(raw)))
    
    # WorkRate from role
    stats['workRate'] = ROLE_WORKRATE.get(role, DEF_WORKRATE) + random.randint(-2, 2)
    stats['flair'] = flair_from_archetypes(arch_tags) + random.randint(-2, 2)
    
    return stats

def generate_gk(base, taille_cm, poids_kg, arch_tags):
    stats = {}
    for key, (pmin, pmax, tier) in GK_PROFILE.items():
        if tier == 'H':
            raw = base * (0.78 + random.random() * 0.18)
        elif tier == 'M':
            raw = base * (0.50 + random.random() * 0.28)
        else:
            raw = base * (0.20 + random.random() * 0.30)
        
        for tag in arch_tags:
            if tag in ARCH_BOOST and key in ARCH_BOOST.get(tag, {}):
                raw += ARCH_BOOST[tag][key]
        
        # Taller GK → better aerial/reach
        if key in ('aerialReach','commandArea','handling'):
            raw += (taille_cm - 175) * 0.3
        if key in ('agilite','vitesse','acceleration'):
            raw -= max(0, (taille_cm - 180) * 0.2)
        
        raw += random.gauss(0, 2)
        lo = base * pmin / 100
        hi = base * pmax / 100
        stats[key] = max(1, min(99, round(raw)))
    
    stats['workRate'] = 55 + random.randint(-3, 3)
    stats['flair'] = 35 + random.randint(-3, 3)
    return stats


def main():
    wb = openpyxl.load_workbook(EXCEL)
    ws = wb['Characters']
    st = wb['Stats & OVR']
    
    for r in range(2, 90):
        name = ws.cell(row=r, column=1).value
        if not name: continue
        poste = (ws.cell(row=r, column=4).value or '').strip().upper()
        base_cell = ws.cell(row=r, column=10).value
        if not base_cell: continue
        base = int(base_cell)
        is_gk = (poste == 'GK')
        
        taille = int(ws.cell(row=r, column=12).value or 175)
        poids = int(ws.cell(row=r, column=13).value or 65)
        arch_raw = ws.cell(row=r, column=8).value or ''
        role = (ws.cell(row=r, column=5).value or '').strip().lower()
        
        arch_tags = []
        for t in arch_raw.split(','):
            s = t.strip().lower().replace('é','e').replace('è','e').replace('à','a').replace('ä','a').replace('ö','o').replace('ü','u').replace('ñ','n').replace('ç','c')
            if s: arch_tags.append(s)
        
        if is_gk:
            stats = generate_gk(base, taille, poids, arch_tags)
            names = GK_NAMES
            keys = GK_KEYS
            col0 = 36
            # Write GK stats to cols 36-60
            for i, key in enumerate(keys):
                st.cell(row=r, column=col0+i).value = stats.get(key, 0)
        else:
            stats = generate_outfield(base, poste, taille, poids, arch_tags, role)
            names = OUT_NAMES
            keys = OUT_KEYS
            col0 = 6
            # Write OUT stats to cols 6-32
            for i, key in enumerate(keys):
                st.cell(row=r, column=col0+i).value = stats.get(key, 0)
        
        print(f'  {name:25s} {poste:4s} base={base:3d} gen')
    
    wb.save(EXCEL)
    print(f'\n✅ Toutes les stats regénérées dans {EXCEL}')


if __name__ == '__main__':
    main()
