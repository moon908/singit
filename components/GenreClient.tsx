"use client";

import React, { useState, useEffect, useRef } from "react";
import SongCard from "@/components/SongCard";
import PlayQueueButton from "@/components/PlayQueueButton";
import { Track } from "@/types";
import { Music, Radio } from "lucide-react";

interface GenreClientProps {
  genre: string;
  initialTracks: Track[];
}

export default function GenreClient({ genre, initialTracks }: GenreClientProps) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [offset, setOffset] = useState(initialTracks.length);
  const [hasMore, setHasMore] = useState(initialTracks.length > 0);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Capitalize genre name for title
  const genreTitle = genre.charAt(0).toUpperCase() + genre.slice(1);

  // Fetch next set of tracks
  const loadMoreTracks = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/music/genre?genre=${genre}&limit=18&offset=${offset}`);
      const data = await res.json();
      
      const newTracks = data.tracks || [];
      if (newTracks.length === 0) {
        setHasMore(false);
      } else {
        setTracks((prev) => [...prev, ...newTracks]);
        setOffset((prev) => prev + newTracks.length);
      }
    } catch (e) {
      console.error("Error fetching more genre tracks:", e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger load more when loader is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTracks();
        }
      },
      { threshold: 0.8 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [offset, hasMore, loading]);

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Backdrop color effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-cyan-500/20 to-transparent blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />
        </div>

        {/* Large Genre Radio Icon */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-2xl shrink-0 z-10 border border-primary/20">
          <Radio size={64} className="text-white animate-pulse" />
        </div>

        {/* Text Details */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1">
            <Music size={11} /> Genre Tag
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            {genreTitle} Mix
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            {tracks.length} songs loaded • Scroll down to load more songs automatically
          </p>

          {/* Action trigger row */}
          {tracks.length > 0 && (
            <div className="pt-3 flex justify-center md:justify-start gap-3">
              <PlayQueueButton tracks={tracks} />
              <PlayQueueButton tracks={tracks} variant="secondary" shuffleInitially={true} />
            </div>
          )}
        </div>
      </div>

      {/* Grid view of cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Browse {genreTitle}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tracks.map((track, idx) => (
            <SongCard key={`${track.id}-${idx}`} track={track} activeQueue={tracks} />
          ))}
        </div>
      </div>

      {/* Bottom loading trigger element */}
      {hasMore && (
        <div ref={loaderRef} className="py-12 flex justify-center items-center">
          <div className="flex gap-1.5 h-6 items-end select-none">
            <span className="w-1.5 h-3 bg-primary rounded-full animate-music-bar-1" />
            <span className="w-1.5 h-5 bg-primary rounded-full animate-music-bar-2" />
            <span className="w-1.5 h-2.5 bg-primary rounded-full animate-music-bar-3" />
            <span className="w-1.5 h-4 bg-primary rounded-full animate-music-bar-4" />
            <span className="text-xs text-muted-foreground font-semibold ml-2">Loading more tunes...</span>
          </div>
        </div>
      )}

      {!hasMore && tracks.length > 0 && (
        <div className="py-12 text-center text-xs text-muted-foreground select-none italic font-semibold">
          You&apos;ve reached the end of the {genreTitle} mix!
        </div>
      )}
      
    </div>
  );
}
