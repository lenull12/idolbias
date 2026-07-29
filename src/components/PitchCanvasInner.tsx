"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import PitchScene from "@/scenes/PitchScene";
import { computeInternalCanvasSize, type PitchOrientation } from "@/lib/pitchCoords";

export interface PitchCanvasInnerProps {
  orientation?: PitchOrientation;
  displayWidth: number;
  displayHeight: number;
}

export default function PitchCanvasInner({ orientation = "vertical", displayWidth, displayHeight }: PitchCanvasInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { width, height } = computeInternalCanvasSize(orientation);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      width, height,
      zoom: 1,
      pixelArt: true,
      parent: containerRef.current,
      backgroundColor: "#0d0d1a",
      scene: PitchScene,
      scale: { mode: Phaser.Scale.NONE },
      banner: false,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on("ready", () => {
      game.scene.start("PitchScene", { width, height, orientation });
    });

    return () => { game.destroy(true); gameRef.current = null; };
  }, [width, height, orientation]);

  useEffect(() => {
    if (gameRef.current?.canvas) {
      gameRef.current.canvas.style.width = `${displayWidth}px`;
      gameRef.current.canvas.style.height = `${displayHeight}px`;
      gameRef.current.canvas.style.imageRendering = "pixelated";
      gameRef.current.canvas.style.display = "block";
    }
  }, [displayWidth, displayHeight]);

  return (
    <div
      ref={containerRef}
      style={{ width: displayWidth, height: displayHeight }}
    />
  );
}
