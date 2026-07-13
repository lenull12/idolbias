"use client";

import type { Rarity } from "@/components/CardEffects";

// ─── Audio Context singleton ────────────────────────────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function osc(
  type: OscillatorType,
  freq: number,
  startTime: number,
  duration: number,
  gain = 0.3,
): { node: OscillatorNode; gain: GainNode } {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  o.connect(g).connect(c.destination);
  o.start(startTime);
  o.stop(startTime + duration);
  return { node: o, gain: g };
}

function noise(startTime: number, duration: number, gain = 0.15) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  src.connect(g).connect(c.destination);
  src.start(startTime);
  src.stop(startTime + duration);
}

// ─── Hold tension (rising pitch) ────────────────────────────────────────────

let holdOsc: OscillatorNode | null = null;
let holdGain: GainNode | null = null;
let holdRAF: number | null = null;

export function startHoldSound() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(200, c.currentTime);
  g.gain.setValueAtTime(0.08, c.currentTime);
  o.connect(g).connect(c.destination);
  o.start();
  holdOsc = o;
  holdGain = g;

  const start = performance.now();
  const tick = () => {
    const elapsed = (performance.now() - start) / 1000;
    const freq = 200 + elapsed * 200; // 200→800 Hz over ~3s
    holdOsc?.frequency.setValueAtTime(freq, c.currentTime);
    holdRAF = requestAnimationFrame(tick);
  };
  tick();
}

export function stopHoldSound() {
  if (holdRAF) cancelAnimationFrame(holdRAF);
  holdRAF = null;
  if (holdOsc && holdGain) {
    const c = getCtx();
    holdGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    holdOsc.stop(c.currentTime + 0.15);
  }
  holdOsc = null;
  holdGain = null;
}

// ─── Pack burst ─────────────────────────────────────────────────────────────

export function playBurst() {
  const c = getCtx();
  const t = c.currentTime;
  noise(t, 0.25, 0.2);
  osc("sine", 300, t, 0.15, 0.15);
  osc("sine", 150, t, 0.3, 0.1);
}

// ─── Card flip whoosh ───────────────────────────────────────────────────────

export function playFlip() {
  const c = getCtx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(400, t);
  o.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.2);
}

// ─── Rarity reveal sounds ───────────────────────────────────────────────────

export function playReveal(rarity: Rarity) {
  const c = getCtx();
  const t = c.currentTime;

  switch (rarity) {
    case "common": {
      osc("square", 300, t, 0.06, 0.08);
      break;
    }
    case "rare": {
      osc("sine", 440, t, 0.2, 0.12);
      osc("sine", 554, t + 0.04, 0.18, 0.10);
      break;
    }
    case "epic": {
      osc("sine", 440, t, 0.25, 0.12);
      osc("sine", 554, t + 0.06, 0.22, 0.10);
      osc("sine", 659, t + 0.12, 0.20, 0.10);
      noise(t + 0.08, 0.12, 0.04);
      break;
    }
    case "legendary": {
      // C-E-G-C chord (orchestral hit)
      const notes = [261, 329, 392, 523];
      notes.forEach((freq, i) => {
        osc("sine", freq, t + i * 0.03, 0.8, 0.10);
        osc("triangle", freq, t + i * 0.03, 0.6, 0.06);
      });
      noise(t, 0.15, 0.06);
      // Shimmer tail
      osc("sine", 1046, t + 0.15, 0.5, 0.04);
      osc("sine", 1318, t + 0.25, 0.4, 0.03);
      break;
    }
    case "secret": {
      // Full chord + sweep
      const chord = [261, 329, 392, 523, 659];
      chord.forEach((freq, i) => {
        osc("sine", freq, t + i * 0.02, 1.0, 0.09);
        osc("triangle", freq, t + i * 0.02, 0.8, 0.05);
      });
      noise(t, 0.2, 0.08);
      // Rainbow sweep
      const sweep = c.createOscillator();
      const sg = c.createGain();
      sweep.type = "sawtooth";
      sweep.frequency.setValueAtTime(200, t + 0.3);
      sweep.frequency.exponentialRampToValueAtTime(2000, t + 0.9);
      sg.gain.setValueAtTime(0.04, t + 0.3);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      sweep.connect(sg).connect(c.destination);
      sweep.start(t + 0.3);
      sweep.stop(t + 1.2);
      // Sparkle tail
      [1568, 2093, 2637].forEach((freq, i) => {
        osc("sine", freq, t + 0.5 + i * 0.08, 0.4, 0.03);
      });
      break;
    }
  }
}
