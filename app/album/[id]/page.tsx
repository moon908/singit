import React from "react";
import { notFound } from "next/navigation";
import { JamendoService } from "@/services/jamendo";
import PlayQueueButton from "@/components/PlayQueueButton";
import TrackList from "@/components/TrackList";
import { Music, Calendar, Disc, User } from "lucide-react";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  
  // Fetch album and track details in parallel
  const [album, tracks] = await Promise.all([
    JamendoService.getAlbumById(id),
    JamendoService.getTracksByAlbumId(id),
  ]);

  if (!album) {
    notFound();
  }

  // Calculate total duration in MM:SS shape
  const totalSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Blur art backdrop */}
        <div className="absolute inset-0 z-0">
          <img src={album.coverUrl} alt="Album Backdrop" className="w-full h-full object-cover blur-3xl opacity-20 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />
        </div>

        {/* Cover Art */}
        <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 z-10 border border-border/30">
          <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
        </div>

        {/* Text Info */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1.5">
            <Disc size={10} /> Album
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight text-foreground truncate max-w-xl">
            {album.name}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center md:justify-start text-xs text-muted-foreground font-semibold">
            <span className="text-foreground hover:underline cursor-pointer flex items-center gap-1">
              <User size={13} className="text-primary" /> {album.artistName}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {album.releaseDate ? new Date(album.releaseDate).getFullYear() : "Unknown"}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Music size={13} /> {tracks.length} songs, {totalMinutes} min
            </span>
          </div>

          {/* Action Row */}
          <div className="pt-4 flex items-center justify-center md:justify-start gap-3">
            <PlayQueueButton tracks={tracks} />
            <PlayQueueButton tracks={tracks} variant="secondary" shuffleInitially={true} />
          </div>
        </div>
      </div>

      {/* Tracks Listing */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Album Tracks</h3>
        <div className="glass border border-border/20 rounded-2xl p-4 md:p-6">
          <TrackList tracks={tracks} showAlbum={false} />
        </div>
      </div>
      
    </div>
  );
}
export const revalidate = 86400; // Cache album page static data for 24 hours
