import Phaser from "phaser";
import { pitchToScreen, getPitchDimensions, MARGIN_ACROSS, GOAL_APRON_FRACTION, type PitchOrientation } from "@/lib/pitchCoords";

const GRASS1 = 0x4a9c3f;
const GRASS2 = 0x579e46;
const LINE_COLOR = 0xffffff;
const LINE_ALPHA = 0.7;
const GOAL_COLOR = 0xffffff;
const NET_COLOR = 0xcccccc;
const NET_ALPHA = 0.4;
const CORNER_FLAG_COLOR = 0xef4444;
const APRON_COLOR = 0x141428;

const PENALTY_DEPTH = 16.5 / 105;
const PENALTY_WIDTH = 40.32 / 68;
const GOAL_AREA_DEPTH = 5.5 / 105;
const GOAL_AREA_WIDTH = 18.32 / 68;
const PENALTY_SPOT_DEPTH = 11 / 105;
const PENALTY_ARC_RADIUS = 9.15 / 105;
const PENALTY_ARC_HALF_ANGLE = Math.acos(5.5 / 9.15);
const GOAL_WIDTH = 0.16;

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function normalizeAngle(a: number): number {
  let x = a % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  return x;
}

export default class PitchScene extends Phaser.Scene {
  private w = 0;
  private h = 0;
  private orientation: PitchOrientation = "vertical";

  constructor() {
    super({ key: "PitchScene" });
  }

  init(data: { width: number; height: number; orientation?: PitchOrientation }) {
    this.w = data.width;
    this.h = data.height;
    this.orientation = data.orientation ?? "vertical";
  }

  create() {
    this.drawCrowd();
    this.drawTechnicalApron();
    this.drawBillboards();
    this.drawBench();
    this.drawGrassStripes();
    this.drawPitchLines();
    this.drawGoals();
    this.drawCornerFlags();
  }

  private p(x01: number, y01: number) {
    return pitchToScreen(x01, y01, this.w, this.h, this.orientation);
  }

  private dims() {
    return getPitchDimensions(this.w, this.h, this.orientation);
  }

  private acrossMarginPx() {
    return (this.orientation === "vertical" ? this.w : this.h) * MARGIN_ACROSS;
  }

  private alongMarginTotalPx() {
    const d = this.dims();
    const totalAlongScreen = this.orientation === "vertical" ? this.h : this.w;
    return (totalAlongScreen - d.alongPx) / 2;
  }

  private screenRect(offAcross: number, offAlong: number, sizeAcross: number, sizeAlong: number) {
    const d = this.dims();
    if (this.orientation === "vertical") {
      return { x: d.offsetAcrossPx + offAcross, y: d.offsetAlongPx + offAlong, w: sizeAcross, h: sizeAlong };
    }
    return { x: d.offsetAlongPx + offAlong, y: d.offsetAcrossPx + offAcross, w: sizeAlong, h: sizeAcross };
  }

  private fieldwardAngle(across01: number, along01: number, alongDelta: number): number {
    const base = this.p(across01, along01);
    const target = this.p(across01, along01 + alongDelta);
    return Math.atan2(target.y - base.y, target.x - base.x);
  }

  private drawCrowd() {
    const g = this.add.graphics();
    const alongScreenSize = this.orientation === "vertical" ? this.h : this.w;
    const marginTotal = this.alongMarginTotalPx();
    const apronDepth = marginTotal * GOAL_APRON_FRACTION;
    const crowdDepth = Math.round(marginTotal - apronDepth);

    const SEAT_BASE = 0x1e1e38;
    const crowdColors = [0xd7263d, 0xf46036, 0x1b998b, 0xffe066, 0xe0e0e0];
    const cell = 3;
    const roofDepth = Math.round(crowdDepth * 0.15);

    for (const atStart of [true, false]) {
      const bandStart = atStart ? 0 : alongScreenSize - crowdDepth;

      const rect = this.orientation === "vertical"
        ? { x: 0, y: bandStart, w: this.w, h: crowdDepth }
        : { x: bandStart, y: 0, w: crowdDepth, h: this.h };
      g.fillStyle(SEAT_BASE, 1);
      g.fillRect(rect.x, rect.y, rect.w, rect.h);

      const rng = seededRand(atStart ? 1 : 2);
      for (let along = 0; along < alongScreenSize; along += cell) {
        for (let across = 0; across < crowdDepth; across += cell) {
          if (rng() > 0.55) continue;
          const color = crowdColors[Math.floor(rng() * crowdColors.length)];
          const along2 = along + Math.round(rng());
          const point = this.orientation === "vertical"
            ? { x: along2, y: bandStart + across }
            : { x: bandStart + across, y: along2 };
          g.fillStyle(color, 0.85);
          g.fillRect(point.x, point.y, 2, 2);
        }
      }

      g.fillStyle(0x000000, 0.6);
      if (this.orientation === "vertical") {
        g.fillRect(0, atStart ? bandStart : bandStart + crowdDepth - roofDepth, this.w, roofDepth);
      } else {
        g.fillRect(atStart ? bandStart : bandStart + crowdDepth - roofDepth, 0, roofDepth, this.h);
      }
    }
  }

  private drawTechnicalApron() {
    const g = this.add.graphics();
    const marginTotal = this.alongMarginTotalPx();
    const apronDepth = marginTotal * GOAL_APRON_FRACTION;
    const d = this.dims();

    g.fillStyle(APRON_COLOR, 1);
    const r0 = this.screenRect(-this.acrossMarginPx(), -apronDepth, d.acrossPx + this.acrossMarginPx() * 2, apronDepth);
    g.fillRect(r0.x, r0.y, r0.w, r0.h);
    const r1 = this.screenRect(-this.acrossMarginPx(), d.alongPx, d.acrossPx + this.acrossMarginPx() * 2, apronDepth);
    g.fillRect(r1.x, r1.y, r1.w, r1.h);
  }

  private drawBillboards() {
    const g = this.add.graphics();
    const d = this.dims();
    const acrossMargin = this.acrossMarginPx();
    const bandThickness = Math.round(acrossMargin * 0.45);
    const bandOffset = Math.round(acrossMargin * 0.2);

    const sponsors = [
      { name: "COLA RUSH",  bg: 0xd7263d, fg: 0xffffff },
      { name: "VOLT BANK",  bg: 0x1b998b, fg: 0xffffff },
      { name: "APEX TYRES", bg: 0xf46036, fg: 0x1a1a2e },
      { name: "NOVA AIR",   bg: 0x2e294e, fg: 0xffe066 },
      { name: "GRID ENERGY",bg: 0x0f4c81, fg: 0xffffff },
    ];

    const n = sponsors.length;
    const blockAlong = d.alongPx / n;

    for (const acrossSide of [0, 1]) {
      const offAcross = acrossSide === 0 ? -bandOffset - bandThickness : d.acrossPx + bandOffset;
      for (let i = 0; i < n; i++) {
        const sponsor = sponsors[i];
        const r = this.screenRect(offAcross, Math.round(i * blockAlong), bandThickness, Math.round(blockAlong) - 1);

        g.fillStyle(sponsor.bg, 1);
        g.fillRect(r.x, r.y, r.w, r.h);
        g.lineStyle(1, 0x000000, 0.4);
        g.strokeRect(r.x, r.y, r.w, r.h);

        const horizontal = r.w > r.h;
        const label = this.add.text(r.x + r.w / 2, r.y + r.h / 2, sponsor.name, {
          fontFamily: "monospace",
          fontSize: Math.max(6, Math.round(Math.min(r.w, r.h) * 0.28)),
          color: `#${sponsor.fg.toString(16).padStart(6, "0")}`,
          fontStyle: "bold",
        });
        label.setOrigin(0.5, 0.5);
        if (!horizontal) label.setAngle(90);
        label.setResolution(1);
      }
    }
  }

  private drawBench() {
    const g = this.add.graphics();
    const d = this.dims();
    const acrossMargin = this.acrossMarginPx();
    const benchDepth = acrossMargin * 0.55;
    const benchLength = d.alongPx * 0.1;
    const gap = benchLength * 0.15;
    const offAcross = -acrossMargin * 0.9 - benchDepth;
    const teamColors = [0x2a4a7a, 0x7a2a3a];

    for (const i of [0, 1]) {
      const offAlong = d.alongPx * 0.5 + (i === 0 ? -benchLength - gap / 2 : gap / 2);
      const r = this.screenRect(offAcross, offAlong, benchDepth, benchLength);

      g.fillStyle(teamColors[i], 0.9);
      g.fillRoundedRect(r.x, r.y, r.w, r.h, 4);
      g.lineStyle(1.2, 0x8888bb, 0.7);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, 4);

      const slats = 4;
      const horizontal = r.w > r.h;
      for (let s = 1; s < slats; s++) {
        const t = s / slats;
        g.lineStyle(1, 0x000000, 0.25);
        g.beginPath();
        if (horizontal) { g.moveTo(r.x + t * r.w, r.y + 2); g.lineTo(r.x + t * r.w, r.y + r.h - 2); }
        else { g.moveTo(r.x + 2, r.y + t * r.h); g.lineTo(r.x + r.w - 2, r.y + t * r.h); }
        g.strokePath();
      }
    }
  }

  private drawGrassStripes() {
    const g = this.add.graphics();
    const d = this.dims();
    const nStripes = 9;
    const stripeAlong = d.alongPx / nStripes;
    for (let i = 0; i < nStripes; i++) {
      const r = this.screenRect(0, i * stripeAlong, d.acrossPx, stripeAlong + 1);
      g.fillStyle(i % 2 === 0 ? GRASS1 : GRASS2, 1);
      g.fillRect(r.x, r.y, r.w, r.h);
    }
  }

  private drawPitchLines() {
    const g = this.add.graphics();
    g.lineStyle(1.5, LINE_COLOR, LINE_ALPHA);
    const d = this.dims();

    const outer = this.p(0, 0);
    const outer2 = this.p(100, 100);
    g.strokeRect(outer.x, outer.y, outer2.x - outer.x, outer2.y - outer.y);

    const midA = this.p(0, 50);
    const midB = this.p(100, 50);
    g.beginPath(); g.moveTo(midA.x, midA.y); g.lineTo(midB.x, midB.y); g.strokePath();

    const center = this.p(50, 50);
    g.strokeCircle(center.x, center.y, d.alongPx * 0.14);
    g.fillStyle(LINE_COLOR, LINE_ALPHA);
    g.fillCircle(center.x, center.y, 3);

    for (const side of [0, 1]) {
      const alongSign = side === 0 ? 1 : -1;

      const paSize = { across: d.acrossPx * PENALTY_WIDTH, along: d.alongPx * PENALTY_DEPTH };
      const paOff = { across: (d.acrossPx - paSize.across) / 2, along: side === 0 ? 0 : d.alongPx - paSize.along };
      const paR = this.screenRect(paOff.across, paOff.along, paSize.across, paSize.along);
      g.strokeRect(paR.x, paR.y, paR.w, paR.h);

      const gaSize = { across: d.acrossPx * GOAL_AREA_WIDTH, along: d.alongPx * GOAL_AREA_DEPTH };
      const gaOff = { across: (d.acrossPx - gaSize.across) / 2, along: side === 0 ? 0 : d.alongPx - gaSize.along };
      const gaR = this.screenRect(gaOff.across, gaOff.along, gaSize.across, gaSize.along);
      g.strokeRect(gaR.x, gaR.y, gaR.w, gaR.h);

      const penAlong01 = side === 0 ? PENALTY_SPOT_DEPTH * 100 : 100 - PENALTY_SPOT_DEPTH * 100;
      const penPoint = this.p(50, penAlong01);
      g.fillCircle(penPoint.x, penPoint.y, 3);

      const fieldAngle = this.fieldwardAngle(50, penAlong01, alongSign);
      const arcR = d.alongPx * PENALTY_ARC_RADIUS;
      g.beginPath();
      g.arc(penPoint.x, penPoint.y, arcR, fieldAngle - PENALTY_ARC_HALF_ANGLE, fieldAngle + PENALTY_ARC_HALF_ANGLE, false);
      g.strokePath();

      for (const cornerAcross of [0, 1]) {
        const across01 = cornerAcross === 0 ? 0 : 100;
        const along01 = side === 0 ? 0 : 100;
        const acrossSign = cornerAcross === 0 ? 1 : -1;
        const cornerPos = this.p(across01, along01);

        const a1 = this.fieldwardAngle(across01, along01, alongSign);
        const acrossTarget = this.p(across01 + acrossSign, along01);
        const a2 = Math.atan2(acrossTarget.y - cornerPos.y, acrossTarget.x - cornerPos.x);

        const cornerR = d.alongPx * 0.03;
        const sweep = normalizeAngle(a2 - a1);
        const anticlockwise = sweep > Math.PI;
        g.beginPath();
        g.arc(cornerPos.x, cornerPos.y, cornerR, a1, a2, anticlockwise);
        g.strokePath();
      }
    }
  }

  private drawGoals() {
    const g = this.add.graphics();
    const d = this.dims();
    const goalAcross = d.acrossPx * GOAL_WIDTH;
    const goalAlong = goalAcross * 0.3;
    const postThick = 4;

    for (const side of [0, 1]) {
      const offAcross = (d.acrossPx - goalAcross) / 2;
      const offAlong = side === 0 ? -goalAlong : d.alongPx;
      const r = this.screenRect(offAcross, offAlong, goalAcross, goalAlong);

      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(r.x + r.w / 2, side === 0 ? r.y + r.h : r.y, r.w * 0.55, r.h * 0.5);

      g.lineStyle(postThick, GOAL_COLOR, 1);
      g.strokeRoundedRect(r.x, r.y, r.w, r.h, 2);

      g.lineStyle(0.8, NET_COLOR, NET_ALPHA);
      const nLines = 10;
      for (let i = 1; i < nLines; i++) {
        const t = i / nLines;
        g.beginPath(); g.moveTo(r.x + t * r.w, r.y); g.lineTo(r.x + t * r.w, r.y + r.h); g.strokePath();
        g.beginPath(); g.moveTo(r.x, r.y + t * r.h); g.lineTo(r.x + r.w, r.y + t * r.h); g.strokePath();
      }
    }
  }

  private drawCornerFlags() {
    const g = this.add.graphics();
    const shortDim = Math.min(this.w, this.h);
    const flagH = shortDim * 0.06;
    const poleH = shortDim * 0.09;

    for (const sx of [0, 1]) {
      for (const sy of [0, 1]) {
        const pos = this.p(sx * 100, sy * 100);
        g.lineStyle(1.5, 0xffffff, 0.8);
        g.beginPath(); g.moveTo(pos.x, pos.y); g.lineTo(pos.x, pos.y - poleH); g.strokePath();

        g.fillStyle(CORNER_FLAG_COLOR, 0.9);
        const fx = sx === 0 ? pos.x + 2 : pos.x - 2;
        g.fillTriangle(pos.x, pos.y - poleH, fx, pos.y - poleH + flagH, fx, pos.y - poleH + flagH * 0.3);
      }
    }
  }
}
