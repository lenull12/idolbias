"use client";

import dynamic from "next/dynamic";
import type { PitchOrientation } from "@/lib/pitchCoords";

const PitchCanvasInner = dynamic(() => import("./PitchCanvasInner"), { ssr: false });

export interface PitchCanvasProps {
  orientation?: PitchOrientation;
  displayWidth: number;
  displayHeight: number;
}

export default function PitchCanvas({ orientation = "vertical", displayWidth, displayHeight }: PitchCanvasProps) {
  return <PitchCanvasInner orientation={orientation} displayWidth={displayWidth} displayHeight={displayHeight} />;
}
