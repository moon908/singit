"use client";

import React, { useEffect, useRef } from "react";

interface MusicVisualizerProps {
  isPlaying: boolean;
}

export default function MusicVisualizer({ isPlaying }: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize handler
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Wave parameters
    const waveCount = 5;
    const waveColors = [
      "rgba(29, 185, 84, 0.4)",  // Spotify green
      "rgba(30, 215, 96, 0.3)",  // Light green
      "rgba(16, 185, 129, 0.2)", // Emerald
      "rgba(52, 211, 153, 0.15)",// Light emerald
      "rgba(29, 185, 84, 0.1)",  // Soft green
    ];

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      // Increment phase for movement
      const speed = isPlaying ? 0.05 : 0.008;
      phaseRef.current += speed;

      // Draw waves
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        
        const amplitude = isPlaying 
          ? (h * 0.25) * (1 - i * 0.15) 
          : (h * 0.06) * (1 - i * 0.15); // Smaller amplitude when paused
          
        const frequency = 0.008 + i * 0.003;
        
        ctx.strokeStyle = waveColors[i];
        ctx.lineWidth = i === 0 ? 3 : 1.5;

        for (let x = 0; x < w; x++) {
          // Add organic distortion
          const y = h / 2 + 
            Math.sin(x * frequency + phaseRef.current + i) * amplitude * 
            Math.sin(x * 0.002 + phaseRef.current * 0.5);
            
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full bg-black/40 rounded-2xl border border-border/40 overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 animate-pulse">
          {isPlaying ? "Visualizer: Live" : "Visualizer: Paused"}
        </span>
      </div>
    </div>
  );
}
