export type PitchOrientation = "vertical" | "horizontal";

export const MARGIN_ACROSS = 0.09;
export const MARGIN_ALONG = 0.17;
export const GOAL_APRON_FRACTION = 0.55;

export const PITCH_MARGIN_X = MARGIN_ACROSS;
export const PITCH_MARGIN_Y = MARGIN_ALONG;

export function pitchToScreen(
  x01: number,
  y01: number,
  w: number,
  h: number,
  orientation: PitchOrientation = "vertical",
): { x: number; y: number } {
  if (orientation === "vertical") {
    const px = w * MARGIN_ACROSS + (x01 / 100) * (w * (1 - 2 * MARGIN_ACROSS));
    const py = h * MARGIN_ALONG + (y01 / 100) * (h * (1 - 2 * MARGIN_ALONG));
    return { x: px, y: py };
  }
  const px = w * MARGIN_ALONG + (y01 / 100) * (w * (1 - 2 * MARGIN_ALONG));
  const py = h * MARGIN_ACROSS + (x01 / 100) * (h * (1 - 2 * MARGIN_ACROSS));
  return { x: px, y: py };
}

export function screenToPitch(
  sx: number,
  sy: number,
  w: number,
  h: number,
  orientation: PitchOrientation = "vertical",
): { x: number; y: number } {
  if (orientation === "vertical") {
    const x01 = ((sx - w * MARGIN_ACROSS) / (w * (1 - 2 * MARGIN_ACROSS))) * 100;
    const y01 = ((sy - h * MARGIN_ALONG) / (h * (1 - 2 * MARGIN_ALONG))) * 100;
    return { x: x01, y: y01 };
  }
  const y01 = ((sx - w * MARGIN_ALONG) / (w * (1 - 2 * MARGIN_ALONG))) * 100;
  const x01 = ((sy - h * MARGIN_ACROSS) / (h * (1 - 2 * MARGIN_ACROSS))) * 100;
  return { x: x01, y: y01 };
}

export interface PitchDims {
  alongPx: number;
  acrossPx: number;
  offsetAlongPx: number;
  offsetAcrossPx: number;
}

export const PIXELS_PER_METER = 4.5;

export function computeInternalCanvasSize(orientation: PitchOrientation): { width: number; height: number } {
  const alongPx = 105 * PIXELS_PER_METER;
  const acrossPx = 68 * PIXELS_PER_METER;
  if (orientation === "horizontal") {
    return {
      width: Math.round(alongPx / (1 - 2 * MARGIN_ALONG)),
      height: Math.round(acrossPx / (1 - 2 * MARGIN_ACROSS)),
    };
  }
  return {
    width: Math.round(acrossPx / (1 - 2 * MARGIN_ACROSS)),
    height: Math.round(alongPx / (1 - 2 * MARGIN_ALONG)),
  };
}

export function computeDisplaySize(
  orientation: PitchOrientation,
  maxHeightPx: number,
  maxWidthPx: number,
): { displayWidth: number; displayHeight: number } {
  const { width, height } = computeInternalCanvasSize(orientation);
  const ratio = width / height;

  let displayHeight = maxHeightPx;
  let displayWidth = displayHeight * ratio;

  if (displayWidth > maxWidthPx) {
    displayWidth = maxWidthPx;
    displayHeight = displayWidth / ratio;
  }

  return { displayWidth: Math.round(displayWidth), displayHeight: Math.round(displayHeight) };
}

export const PITCH_RATIO = 105 / 68;

export function computeCanvasSize(
  freeWidthPx: number,
  orientation: PitchOrientation,
): { width: number; height: number } {
  const cw = freeWidthPx;
  if (orientation === "horizontal") {
    const alongPx = cw * (1 - 2 * MARGIN_ALONG);
    const acrossPx = alongPx / PITCH_RATIO;
    const ch = acrossPx / (1 - 2 * MARGIN_ACROSS);
    return { width: cw, height: ch };
  }
  const acrossPx = cw * (1 - 2 * MARGIN_ACROSS);
  const alongPx = acrossPx * PITCH_RATIO;
  const ch = alongPx / (1 - 2 * MARGIN_ALONG);
  return { width: cw, height: ch };
}

export function getPitchDimensions(
  canvasW: number,
  canvasH: number,
  orientation: PitchOrientation = "vertical",
): PitchDims {
  if (orientation === "vertical") {
    return {
      alongPx: canvasH * (1 - 2 * MARGIN_ALONG),
      acrossPx: canvasW * (1 - 2 * MARGIN_ACROSS),
      offsetAlongPx: canvasH * MARGIN_ALONG,
      offsetAcrossPx: canvasW * MARGIN_ACROSS,
    };
  }
  return {
    alongPx: canvasW * (1 - 2 * MARGIN_ALONG),
    acrossPx: canvasH * (1 - 2 * MARGIN_ACROSS),
    offsetAlongPx: canvasW * MARGIN_ALONG,
    offsetAcrossPx: canvasH * MARGIN_ACROSS,
  };
}
