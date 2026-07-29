"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Keyframe, MatchResult } from "@/lib/matchEngine";

interface MatchPitch2DProps {
  result: MatchResult;
  homeTeamId: string;
  awayTeamId: string;
  homeLabel?: string;
  awayLabel?: string;
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function ballBezier(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  const te = ease(t);
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - 6;
  const x = (1 - te) * (1 - te) * from.x + 2 * (1 - te) * te * cx + te * te * to.x;
  const y = (1 - te) * (1 - te) * from.y + 2 * (1 - te) * te * cy + te * te * to.y;
  return { x, y };
}

export function eventLabel(e: any, homeLabel: string, awayLabel: string, homeTeamId: string): string {
  const teamLabel = e.team === homeTeamId ? homeLabel : awayLabel;
  switch (e.type) {
    case "goal":
      return `But ! ${e.player} (${teamLabel}) — ${e.zone}`;
    case "turnover":
      return `Perte de balle — ${teamLabel} récupère.`;
    case "save":
      return `Arrêt de ${e.player} (${teamLabel}).`;
    default:
      return `${e.player} (${teamLabel}) — ${e.zone}`;
  }
}

export function MatchPitch2D({ result, homeTeamId, awayTeamId, homeLabel = "Domicile", awayLabel = "Extérieur" }: MatchPitch2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [seqIndex, setSeqIndex] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [eventLog, setEventLog] = useState("");
  const [minuteLabel, setMinuteLabel] = useState("0'");
  const [phaseLabel, setPhaseLabel] = useState("");

  const keyframes = result.keyframes;

  const drawPitch = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#97C459";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w * 0.03, h * 0.06, w * 0.94, h * 0.88);
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.06);
    ctx.lineTo(w / 2, h * 0.94);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.14, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const drawDot = useCallback((ctx: CanvasRenderingContext2D, x01: number, y01: number, w: number, h: number, color: string, r: number) => {
    ctx.beginPath();
    ctx.arc((x01 / 100) * w, (y01 / 100) * h, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const renderKeyframe = useCallback(
    (kf: Keyframe, nextKf: Keyframe | null, localT: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawPitch(ctx, w, h);

      const ballFrom = kf.ball;
      const ballTo = nextKf ? nextKf.ball : kf.ball;
      const ball = ballBezier(ballFrom, ballTo, localT);

      for (const p of kf.positions) {
        const target = nextKf?.positions.find((q) => q.instanceId === p.instanceId);
        const x = target ? lerp(p.x, target.x, ease(localT)) : p.x;
        const y = target ? lerp(p.y, target.y, ease(localT)) : p.y;
        drawDot(ctx, x, y, w, h, "#378ADD", 7);
      }
      drawDot(ctx, ball.x, ball.y, w, h, "#ffffff", 4);

      setPhaseLabel(kf.outcome);
      setMinuteLabel(`${kf.minute}'`);
    },
    [drawPitch, drawDot],
  );

  const stop = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const step = useCallback(() => {
    setT((prevT) => {
      const nextT = prevT + 0.03;
      if (nextT >= 1) {
        setSeqIndex((prevIdx) => {
          const newIdx = prevIdx + 1;
          if (newIdx >= keyframes.length - 1) {
            stop();
            return prevIdx;
          }
          const kf = keyframes[newIdx];
          if (kf.outcome && kf.outcome !== "success") {
            const matchingEvent = result.events.find((e) => e.minute === kf.minute);
            if (matchingEvent) setEventLog(eventLabel(matchingEvent, homeLabel, awayLabel, homeTeamId));
          }
          return newIdx;
        });
        return 0;
      }
      return nextT;
    });
  }, [keyframes, result.events, stop, homeLabel, awayLabel, homeTeamId]);

  useEffect(() => {
    if (!playing) return;
    const kf = keyframes[seqIndex];
    const nextKf = keyframes[seqIndex + 1] ?? null;
    if (kf) renderKeyframe(kf, nextKf, t);
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, seqIndex, t, keyframes, renderKeyframe, step]);

  useEffect(() => {
    if (keyframes.length > 0) renderKeyframe(keyframes[0], keyframes[1] ?? null, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlay() {
    setSeqIndex(0);
    setT(0);
    setEventLog("");
    setPlaying(true);
  }

  function handleSkipToResult() {
    stop();
    const last = keyframes[keyframes.length - 1];
    if (last) renderKeyframe(last, null, 0);
    setEventLog(
      `Score final : ${homeLabel} ${result.score[homeTeamId] ?? 0} - ${result.score[awayTeamId] ?? 0} ${awayLabel}`,
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{phaseLabel}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{minuteLabel}</span>
      </div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", background: "#97C459", borderRadius: 8, overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={handlePlay} style={{ flex: 1 }}>
          Rejouer le match
        </button>
        <button type="button" onClick={handleSkipToResult} style={{ flex: 1 }}>
          Passer au résultat
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "10px 0 0", minHeight: 20 }}>{eventLog}</p>
    </div>
  );
}

export default MatchPitch2D;
