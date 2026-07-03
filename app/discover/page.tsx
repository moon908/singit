import React from "react";
import Link from "next/link";
import { JamendoService } from "@/services/jamendo";
import SongCard from "@/components/SongCard";
import PlayQueueButton from "@/components/PlayQueueButton";
import { Track, Album } from "@/types";
import { Compass, Flame, Disc, Music, Shuffle } from "lucide-react";

export default async function DiscoverPage() {
  // Fetch trending tracks and albums in parallel
  const [trending, albums] = await Promise.all([
    JamendoService.getTrendingTracks(18),
    JamendoService.getPopularAlbums(12),
  ]);

  const moods = [
    { name: "Chillout", tag: "chillout", color: "from-blue-600 to-cyan-500" },
    { name: "Acoustic", tag: "acoustic", color: "from-amber-600 to-yellow-500" },
    { name: "Lofi Beats", tag: "lofi", color: "from-purple-600 to-pink-500" },
    { name: "Electronic", tag: "electronic", color: "from-emerald-600 to-teal-500" },
    { name: "Dark ambient", tag: "ambient", color: "from-zinc-800 to-zinc-600" },
    { name: "Energetic Rock", tag: "rock", color: "from-red-600 to-orange-500" },
  ];

  return (
    <div className="space-y-10 select-none">
      
      {/* Header Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Compass className="text-primary animate-spin-slow" /> Discover Radar
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Find new sounds, trending releases, and custom mixes</p>
      </div>

      {/* Moods / Vibes Quick Select */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground">Filter by Vibe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {moods.map((m) => (
            <Link key={m.tag} href={`/genres/${m.tag}`}>
              <div className={`group relative h-20 rounded-2xl overflow-hidden bg-gradient-to-tr ${m.color} p-4 flex flex-col justify-end shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 -translate-y-4 blur-md group-hover:scale-115 transition-transform duration-300" />
                <span className="text-xs font-extrabold text-white">{m.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Discover Tracks Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Trending Discoveries
          </h2>
          <PlayQueueButton tracks={trending} variant="secondary" shuffleInitially={true} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.map((track) => (
            <SongCard key={track.id} track={track} activeQueue={trending} />
          ))}
        </div>
      </section>

      {/* Discover Albums Row */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Disc size={18} className="text-primary animate-pulse" /> Popular Releases
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {albums.map((album) => (
            <Link key={album.id} href={`/album/${album.id}`}>
              <div className="group bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer">
                <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0">
                  <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate text-foreground pr-1" title={album.name}>
                    {album.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {album.artistName}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
export const revalidate = 1800; // Cache discover page for 30 minutes
