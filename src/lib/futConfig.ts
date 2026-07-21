import type { Rarity } from "@/components/CardEffects";

export const FUT_RARITY_CONFIG: Record<Rarity, {
  border: string;
  ovrColor: string;
  ovrGlow: string;
  posColor: string;
  nameColor: string;
  nameGlow: string;
  statColor: string;
  statLabelColor: string;
  bandAccent: string;
  cardBg: string;
  pattern: "none" | "scanlines" | "circuit" | "sunburst" | "aurora";
  font: "system" | "rajdhani" | "orbitron";
}> = {
  common: {
    border: "#3a3a4a",
    ovrColor: "#8a8a9a",
    ovrGlow: "none",
    posColor: "#666",
    nameColor: "#888",
    nameGlow: "none",
    statColor: "#777",
    statLabelColor: "#555",
    bandAccent: "#3a3a4a",
    cardBg: "#161628",
    pattern: "none",
    font: "system",
  },
  rare: {
    border: "#5078d8",
    ovrColor: "#7aacff",
    ovrGlow: "0 0 12px rgba(91,141,239,0.3)",
    posColor: "#6a9ce0",
    nameColor: "#b0c8ff",
    nameGlow: "none",
    statColor: "#7aacff",
    statLabelColor: "#5078d8",
    bandAccent: "#5078d8",
    cardBg: "#15182e",
    pattern: "scanlines",
    font: "system",
  },
  epic: {
    border: "#7c3aed",
    ovrColor: "#b794ff",
    ovrGlow: "0 0 14px rgba(139,92,246,0.4)",
    posColor: "#9b7de0",
    nameColor: "#d0c0ff",
    nameGlow: "none",
    statColor: "#b794ff",
    statLabelColor: "#7c3aed",
    bandAccent: "#7c3aed",
    cardBg: "#191530",
    pattern: "circuit",
    font: "rajdhani",
  },
  legendary: {
    border: "#c8960e",
    ovrColor: "#f0d060",
    ovrGlow: "0 0 18px rgba(232,182,90,0.45)",
    posColor: "#d4b860",
    nameColor: "#f2dda0",
    nameGlow: "0 0 8px rgba(232,182,90,0.25)",
    statColor: "#f0d060",
    statLabelColor: "#c8960e",
    bandAccent: "linear-gradient(90deg, #c8960e, #f0d060, #c8960e)",
    cardBg: "#1f1a10",
    pattern: "sunburst",
    font: "orbitron",
  },
  secret: {
    border: "#ff69b4",
    ovrColor: "#ff9cc8",
    ovrGlow: "0 0 20px rgba(255,105,180,0.5)",
    posColor: "#e087b8",
    nameColor: "holo",
    nameGlow: "none",
    statColor: "#ff9cc8",
    statLabelColor: "#e0609a",
    bandAccent: "holo",
    cardBg: "#1a1022",
    pattern: "none",
    font: "orbitron",
  },
};

export const HOLO_GRADIENT = "linear-gradient(90deg, #ff69b4, #8b5cf6, #4de8ff, #8b5cf6, #ff69b4)";
export const HOLO_NICKNAME_GRADIENT = "linear-gradient(90deg, #ff69b4, #c8960e, #8b5cf6, #4de8ff, #c8960e, #ff69b4)";

export const FUT_KEYFRAMES = `
@keyframes futAccentSweep { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes futAuraPulseL { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
@keyframes futAuraPulseS { 0%,100% { opacity:0.7; filter:hue-rotate(0deg); } 33%{opacity:1;filter:hue-rotate(15deg);} 66%{opacity:0.85;filter:hue-rotate(-10deg);} }
@keyframes futLegendBorder { 0%,100% { border-color: #c8960e; } 50% { border-color: #f0d060; } }
@keyframes futSecretBorder { 0% { border-color:#ff69b4; } 33% { border-color:#8b5cf6; } 66% { border-color:#4de8ff; } 100% { border-color:#ff69b4; } }
@keyframes futAuroraDrift { 0%,100% { background-position: 0% 0%, 0% 10%, 0% -5%; } 50% { background-position: 15% 5%, -10% -5%, 10% 8%; } }
@keyframes futHoloSweep { 0% { transform:translateX(-150%) skewX(-22deg); opacity:0; } 15%{opacity:0.55;} 85%{opacity:0.45;} 100%{transform:translateX(250%) skewX(-22deg); opacity:0;} }
@keyframes futPt1 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}15%{opacity:1;transform:scale(1.5)translate(10px,-20px);}45%{opacity:0.6;transform:scale(0.8)translate(30px,-50px);}75%{opacity:0.15;transform:scale(0.4)translate(20px,-40px);} }
@keyframes futPt2 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}20%{opacity:0.8;transform:scale(1.3)translate(-15px,-25px);}55%{opacity:0.4;transform:scale(0.7)translate(-35px,-60px);}85%{opacity:0.1;transform:scale(0.3)translate(-25px,-45px);} }
@keyframes futPt3 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}12%{opacity:0.7;transform:scale(1)translate(20px,15px);}40%{opacity:0.35;transform:scale(0.6)translate(40px,30px);}70%{opacity:0.1;transform:scale(0.3)translate(30px,20px);} }
@keyframes futPt4 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}25%{opacity:0.65;transform:scale(1.1)translate(-10px,10px);}50%{opacity:0.25;transform:scale(0.5)translate(-25px,25px);}80%{opacity:0.08;transform:scale(0.2)translate(-15px,15px);} }
@keyframes futPt5 { 0%,100%{opacity:0;transform:scale(0)translate(0,0);}10%{opacity:0.55;transform:scale(1.4)translate(5px,-30px);}35%{opacity:0.25;transform:scale(0.7)translate(15px,-70px);}65%{opacity:0.08;transform:scale(0.3)translate(10px,-50px);} }
`;

export const NATION_FLAGS: Record<string, string> = {
  DE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='0.67' fill='%23000'/%3E%3Crect y='0.67' width='3' height='0.67' fill='%23d00'/%3E%3Crect y='1.33' width='3' height='0.67' fill='%23fc0'/%3E%3C/svg%3E",
  FR: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='1' height='2' fill='%23002395'/%3E%3Crect x='1' width='1' height='2' fill='%23fff'/%3E%3Crect x='2' width='1' height='2' fill='%23ed2939'/%3E%3C/svg%3E",
  BR: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23009b3a'/%3E%3Cpath d='M1.5,0.3 L2.1,1 L3,1 L2.3,1.4 L2.5,2.1 L1.5,1.7 L0.5,2.1 L0.7,1.4 L0,1 L0.9,1 Z' fill='%23fedf00'/%3E%3Ccircle cx='1.5' cy='1' r='0.45' fill='%23002776'/%3E%3C/svg%3E",
  JP: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23fff'/%3E%3Ccircle cx='1.5' cy='1' r='0.4' fill='%23bc002d'/%3E%3C/svg%3E",
  AR: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='0.67' fill='%2374acdf'/%3E%3Crect y='0.67' width='3' height='0.67' fill='%23fff'/%3E%3Crect y='1.33' width='3' height='0.67' fill='%2374acdf'/%3E%3C/svg%3E",
  ES: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='0.5' fill='%23aa151b'/%3E%3Crect y='0.5' width='3' height='1' fill='%23f1bf00'/%3E%3Crect y='1.5' width='3' height='0.5' fill='%23aa151b'/%3E%3C/svg%3E",
  IT: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='1' height='2' fill='%23009246'/%3E%3Crect x='1' width='1' height='2' fill='%23fff'/%3E%3Crect x='2' width='1' height='2' fill='%23ce2b37'/%3E%3C/svg%3E",
  GB: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23012169'/%3E%3Cpath d='M0,0 L3,2 M3,0 L0,2' stroke='%23fff' stroke-width='0.4'/%3E%3Cpath d='M0,0 L1.5,1 L0,2 M3,0 L1.5,1 L3,2' stroke='%23c8102e' stroke-width='0.2'/%3E%3C/svg%3E",
};
