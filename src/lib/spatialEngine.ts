import type { MatchPlayer, TeamMatchInput, MatchResult, Keyframe, TacticSlider } from "@/lib/matchEngine";

export interface Vector2 {
  x: number;
  y: number;
}

export interface SpatialPlayerState {
  instanceId: string;
  pos: Vector2;
  vel: Vector2;
  targetPos: Vector2;
}

export interface SpatialBallState {
  pos: Vector2;
  vel: Vector2;
  height: number;
  ownerInstanceId: string | null;
}

export interface SpatialTick {
  t: number;
  minute: number;
  players: SpatialPlayerState[];
  ball: SpatialBallState;
}

const PITCH_LENGTH_M = 105;
const PITCH_WIDTH_M = 68;

const MAX_PLAYER_SPEED = 7.5;

export const TICK_DT = 0.5;

const ROLE_ROAM: Record<string, number> = {
  goalkeeper: 0.05,
  sweeper_keeper: 0.25,
  defender: 0.10,
  fullback: 0.45,
  inverted_wingback: 0.50,
  ball_playing_defender: 0.20,
  libero: 0.35,
  ball_winning: 0.35,
  box_to_box: 0.60,
  deep_lying_playmaker: 0.30,
  regista: 0.40,
  playmaker: 0.35,
  winger: 0.55,
  advanced_forward: 0.35,
  poacher: 0.15,
  target_man: 0.05,
  false_nine: 0.50,
  second_striker: 0.30,
};

const DEFAULT_ROAM = 0.20;

function roam(role: string | null): number {
  return ROLE_ROAM[role ?? ""] ?? DEFAULT_ROAM;
}

function makeSeededRng(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) | 0;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function toPercent(pos: Vector2): { x: number; y: number } {
  return { x: (pos.x / PITCH_LENGTH_M) * 100, y: (pos.y / PITCH_WIDTH_M) * 100 };
}

function fromPercent(x01: number, y01: number): Vector2 {
  return { x: (x01 / 100) * PITCH_LENGTH_M, y: (y01 / 100) * PITCH_WIDTH_M };
}

function clampToPitch(pos: Vector2): Vector2 {
  return {
    x: Math.max(0.5, Math.min(PITCH_LENGTH_M - 0.5, pos.x)),
    y: Math.max(0.5, Math.min(PITCH_WIDTH_M - 0.5, pos.y)),
  };
}

function snapshot(state: {
  players: SpatialPlayerState[];
  ball: SpatialBallState;
  t: number;
}): SpatialTick {
  return {
    t: state.t,
    minute: state.t / 60,
    players: state.players.map((p) => ({ ...p })),
    ball: { ...state.ball },
  };
}

function initState(home: TeamMatchInput, away: TeamMatchInput): {
  players: SpatialPlayerState[];
  ball: SpatialBallState;
  t: number;
} {
  const players: SpatialPlayerState[] = [];

  for (const team of [home, away]) {
    for (const mp of team.players) {
      const basePos = fromPercent(mp.baseX, mp.baseY);
      players.push({
        instanceId: mp.instanceId,
        pos: { ...basePos },
        vel: { x: 0, y: 0 },
        targetPos: { ...basePos },
      });
    }
  }

  return {
    players,
    ball: {
      pos: { x: PITCH_LENGTH_M / 2, y: PITCH_WIDTH_M / 2 },
      vel: { x: 0, y: 0 },
      height: 0,
      ownerInstanceId: null,
    },
    t: 0,
  };
}

function getTactics(
  instanceId: string,
  home: TeamMatchInput,
  away: TeamMatchInput,
): { defensiveLine: TacticSlider; mentality: TacticSlider } {
  const isHome = home.players.some((p) => p.instanceId === instanceId);
  const team = isHome ? home : away;
  return {
    defensiveLine: team.defensiveLine ?? 0,
    mentality: team.mentality ?? 0,
  };
}

function getBasePos(
  instanceId: string,
  home: TeamMatchInput,
  away: TeamMatchInput,
): Vector2 {
  for (const team of [home, away]) {
    const mp = team.players.find((p) => p.instanceId === instanceId);
    if (mp) return fromPercent(mp.baseX, mp.baseY);
  }
  return { x: PITCH_LENGTH_M / 2, y: PITCH_WIDTH_M / 2 };
}

function computeDesiredPosition(
  player: SpatialPlayerState,
  basePos: Vector2,
  ballPos: Vector2,
  tactics: { defensiveLine: TacticSlider; mentality: TacticSlider },
  role: string | null,
): Vector2 {
  const roamFactor = roam(role);
  const lineShift = tactics.defensiveLine * 3;
  const shifted: Vector2 = { x: basePos.x + lineShift, y: basePos.y };
  const pull = 0.15 * roamFactor;
  return {
    x: shifted.x + (ballPos.x - shifted.x) * pull,
    y: shifted.y + (ballPos.y - shifted.y) * pull,
  };
}

function movePlayerTick(current: SpatialPlayerState, dt: number): SpatialPlayerState {
  const dx = current.targetPos.x - current.pos.x;
  const dy = current.targetPos.y - current.pos.y;
  const dist = Math.hypot(dx, dy);
  const maxStep = MAX_PLAYER_SPEED * dt;

  const moveX = dist > 0 ? (dx / dist) * Math.min(dist, maxStep) : 0;
  const moveY = dist > 0 ? (dy / dist) * Math.min(dist, maxStep) : 0;

  const nextPos = clampToPitch({ x: current.pos.x + moveX, y: current.pos.y + moveY });
  return { ...current, pos: nextPos, vel: { x: moveX / dt, y: moveY / dt } };
}

function stepOnce(
  state: { players: SpatialPlayerState[]; ball: SpatialBallState; t: number },
  home: TeamMatchInput,
  away: TeamMatchInput,
): { players: SpatialPlayerState[]; ball: SpatialBallState; t: number } {
  const nextPlayers: SpatialPlayerState[] = state.players.map((player) => {
    const tactics = getTactics(player.instanceId, home, away);
    const basePos = getBasePos(player.instanceId, home, away);
    const team = home.players.some((p) => p.instanceId === player.instanceId) ? home : away;
    const mp = team.players.find((p) => p.instanceId === player.instanceId);

    const targetPos = computeDesiredPosition(
      player,
      basePos,
      state.ball.pos,
      tactics,
      mp?.role ?? null,
    );

    return movePlayerTick({ ...player, targetPos }, TICK_DT);
  });

  return {
    players: nextPlayers,
    ball: state.ball,
    t: state.t + TICK_DT,
  };
}

export function runSpatialSimulation(
  home: TeamMatchInput,
  away: TeamMatchInput,
  seed: string,
  durationMinutes = 90,
): SpatialTick[] {
  const rng = makeSeededRng(seed);
  const totalTicks = Math.round((durationMinutes * 60) / TICK_DT);

  let state = initState(home, away);
  const ticks: SpatialTick[] = [snapshot({ ...state, t: 0 })];

  for (let i = 1; i <= totalTicks; i++) {
    state = stepOnce(state, home, away);
    ticks.push(snapshot(state));
  }

  return ticks;
}

export function spatialTicksToKeyframes(ticks: SpatialTick[]): Keyframe[] {
  return ticks.map((tick, i) => ({
    step: i,
    minute: Math.floor(tick.minute),
    ball: toPercent(tick.ball.pos),
    positions: tick.players.map((p) => ({
      instanceId: p.instanceId,
      ...toPercent(p.pos),
    })),
    actress: "",
    defender: "",
    attackScore: 0,
    defenseScore: 0,
    outcome: "success" as const,
  }));
}

export function spatialToMatchResult(
  ticks: SpatialTick[],
  homeTeamId: string,
  awayTeamId: string,
): MatchResult {
  return {
    score: { [homeTeamId]: 0, [awayTeamId]: 0 },
    events: [],
    keyframes: spatialTicksToKeyframes(ticks),
    microActions: [],
    possession: { [homeTeamId]: 50, [awayTeamId]: 50 },
  };
}
