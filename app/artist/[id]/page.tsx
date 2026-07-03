import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JamendoService } from "@/services/jamendo";
import PlayQueueButton from "@/components/PlayQueueButton";
import TrackList from "@/components/TrackList";
import FollowArtistButton from "@/components/FollowArtistButton";
import { User, Calendar, Disc, Music, Globe } from "lucide-react";

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;

  // Fetch artist data, top tracks, and albums in parallel
  const [artist, tracks, albums] = await Promise.all([
    JamendoService.getArtistById(id),
    JamendoService.getTracksByArtistId(id, 8),
    JamendoService.getAlbumsByArtistId(id, 6),
  ]);

  if (!artist) {
    notFound();
  }

  return (
    <div className="space-y-10 select-none">
      
      {/* Artist Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Blur art backdrop */}
        <div className="absolute inset-0 z-0">
          <img src={artist.coverUrl} alt="Artist Backdrop" className="w-full h-full object-cover blur-3xl opacity-20 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />
        </div>

        {/* Profile Image */}
        <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl shrink-0 z-10 border-2 border-primary/20">
          <img src={artist.coverUrl} alt={artist.name} className="w-full h-full object-cover" />
        </div>

        {/* Text Info */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1.5">
            <User size={10} /> Artist
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground truncate max-w-xl">
            {artist.name}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center md:justify-start text-xs text-muted-foreground font-semibold">
            {artist.joinDate && (
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Member since {new Date(artist.joinDate).getFullYear()}
              </span>
            )}
            {artist.website && (
              <>
                <span className="hidden sm:inline">•</span>
                <a href={artist.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-primary">
                  <Globe size={13} /> Official Website
                </a>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <PlayQueueButton tracks={tracks} />
            <PlayQueueButton tracks={tracks} variant="secondary" shuffleInitially={true} />
            <FollowArtistButton artist={artist} />
          </div>
        </div>
      </div>

      {/* Main Grid: Top Songs & Biography */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Popular Songs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-foreground">Popular Songs</h3>
          <div className="glass border border-border/20 rounded-2xl p-4 md:p-6">
            <TrackList tracks={tracks} />
          </div>
        </div>

        {/* Biography & Metadata */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Biography</h3>
          <div className="glass border border-border/20 rounded-2xl p-6 space-y-4 text-xs leading-relaxed text-muted-foreground">
            <p>
              {artist.name} is an independent artist sharing their creative music catalog under Creative Commons licensing.
            </p>
            <p>
              By utilizing platforms like Jamendo and SingIt, listeners are given direct access to high-fidelity, high-quality, and legally streamable catalogs spanning acoustic, alternative rock, lofi, ambient, and modern genres.
            </p>
            <div className="border-t border-border/30 pt-4 space-y-2 select-none">
              <div className="flex justify-between">
                <span className="text-secondary-foreground font-medium">Tracks Count:</span>
                <span className="text-foreground font-bold">{tracks.length}+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-foreground font-medium">Releases:</span>
                <span className="text-foreground font-bold">{albums.length}+</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Albums Grid */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Disc size={18} className="text-primary animate-pulse" /> Albums
          </h3>
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
                      {album.releaseDate ? new Date(album.releaseDate).getFullYear() : "Album"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
export const revalidate = 86400; // Cache 24 hours
