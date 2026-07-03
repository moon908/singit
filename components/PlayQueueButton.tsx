"use client";

import React from "react";
import { Play, Shuffle } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { Track } from "@/types";

interface PlayQueueButtonProps {
  tracks: Track[];
  className?: string;
  variant?: "primary" | "secondary" | "icon";
  shuffleInitially?: boolean;
}

export default function PlayQueueButton({
  tracks,
  className = "",
  variant = "primary",
  shuffleInitially = false,
}: PlayQueueButtonProps) {
  const player = useAudioPlayer();

  const handlePlay = () => {
    if (tracks.length === 0) return;
    
    if (shuffleInitially) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      player.playQueue(shuffled, 0);
      if (!player.isShuffle) player.toggleShuffle();
    } else {
      player.playQueue(tracks, 0);
      if (player.isShuffle) player.toggleShuffle(); // reset shuffle
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handlePlay}
        disabled={tracks.length === 0}
        className={`w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 ${className}`}
      >
        <Play size={18} className="ml-0.5 fill-primary-foreground text-primary-foreground" />
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        onClick={handlePlay}
        disabled={tracks.length === 0}
        className={`flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-border text-foreground text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${className}`}
      >
        <Shuffle size={14} /> Shuffle
      </button>
    );
  }

  return (
    <button
      onClick={handlePlay}
      disabled={tracks.length === 0}
      className={`flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/25 active:scale-95 cursor-pointer disabled:opacity-50 ${className}`}
    >
      <Play size={15} className="fill-primary-foreground" /> Play
    </button>
  );
}
