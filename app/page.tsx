import React from "react";
import Link from "next/link";
import { JamendoService } from "@/services/jamendo";
import { getPlayHistory } from "@/server/actions/history";
import { auth } from "@/auth";
import SongCard from "@/components/SongCard";
import { Track, Album, Artist } from "@/types";
import { Play, Flame, Music, Disc, Radio, RefreshCw } from "lucide-react";

// Server-side Home Page Component
export default async function Home() {
  const session = await auth();
  
  // Parallelize server fetches
  let trending: Track[] = [];
  let albums: Album[] = [];
  let artists: Artist[] = [];
  let history: any[] = [];

  try {
    const [trendingRes, albumsRes, artistsRes] = await Promise.all([
      JamendoService.getTrendingTracks(12),
      JamendoService.getPopularAlbums(6),
      JamendoService.getFeaturedArtists(6),
    ]);
    
    trending = trendingRes;
    albums = albumsRes;
    artists = artistsRes;

    if (session) {
      const historyRes = await getPlayHistory(6);
      if (historyRes.success && historyRes.history) {
        history = historyRes.history;
      }
    }
  } catch (error) {
    console.error("Home page server-side fetch failed:", error);
  }

  // Choose the first trending song as the Hero Featured Song
  const heroTrack: Track | null = trending.length > 0 ? trending[0] : null;

  return (
    <div className="space-y-10">
      
      {/* Hero Featured Banner */}
      {heroTrack && (
        <section className="relative overflow-hidden rounded-3xl border border-border/25 bg-card shadow-lg select-none">
          {/* Blur background image */}
          <div className="absolute inset-0 z-0">
            <img src={heroTrack.coverUrl} alt="Hero blur" className="w-full h-full object-cover blur-3xl opacity-30 scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-card/50 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-10">
            {/* Cover art */}
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden shadow-2xl shrink-0 group relative">
              <img src={heroTrack.coverUrl} alt={heroTrack.title} className="w-full h-full object-cover" />
            </div>

            {/* Meta details */}
            <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 animate-pulse">
                Featured Track
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight truncate leading-tight mt-1 text-foreground">
                {heroTrack.title}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-semibold">
                By <span className="text-primary hover:underline cursor-pointer">{heroTrack.artistName}</span>
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block italic">
                Album: {heroTrack.albumName || "Single"}
              </p>
              
              {/* Play buttons */}
              <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
                {/* We can use standard Link to trigger play or custom wrapper but here a play icon button linking to search or detail is clean */}
                <Link href={`/search?q=${encodeURIComponent(heroTrack.title)}`}>
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:scale-105 transition-transform duration-300 shadow-md shadow-primary/30 cursor-pointer">
                    <Play size={16} className="fill-primary-foreground" /> Play Now
                  </button>
                </Link>
                <Link href="/discover">
                  <button className="px-5 py-3 border border-border hover:bg-secondary text-foreground text-xs font-bold rounded-full transition-colors cursor-pointer">
                    Discover More
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recently Played / Continue Listening (If history exists) */}
      {session && history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <RefreshCw size={18} className="text-primary animate-spin-slow" /> Continue Listening
            </h2>
            <Link href="/history" className="text-xs text-primary hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {history.map((h) => {
              // Map history format to standard Track shape for SongCard
              const trackShape: Track = {
                id: h.trackId,
                title: h.title,
                artistId: "unknown",
                artistName: h.artistName,
                albumId: "unknown",
                albumName: h.albumName || "",
                coverUrl: h.coverUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
                duration: h.duration,
                audioUrl: h.audioUrl,
              };
              return <SongCard key={h.id} track={trackShape} activeQueue={history.map(hist => ({
                id: hist.trackId,
                title: hist.title,
                artistId: "unknown",
                artistName: hist.artistName,
                albumId: "unknown",
                albumName: hist.albumName || "",
                coverUrl: hist.coverUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
                duration: hist.duration,
                audioUrl: hist.audioUrl,
              }))} />;
            })}
          </div>
        </section>
      )}

      {/* Trending Songs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Trending Songs
          </h2>
          <Link href="/discover" className="text-xs text-primary hover:underline font-semibold">
            Explore Mixes
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.slice(0, 12).map((track) => (
            <SongCard key={track.id} track={track} activeQueue={trending} />
          ))}
        </div>
      </section>

      {/* Row of Popular Albums & Featured Artists side by side or stacked */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Popular Albums */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Disc size={18} className="text-primary animate-pulse" /> Popular Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

        {/* Featured Artists */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Radio size={18} className="text-primary" /> Featured Artists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <Link key={artist.id} href={`/artist/${artist.id}`}>
                <div className="group bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-xl cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-md shrink-0 border border-border/40">
                    <img src={artist.coverUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="min-w-0 w-full">
                    <h4 className="text-xs font-bold truncate text-foreground">
                      {artist.name}
                    </h4>
                    <span className="text-[9px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                      Artist
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>

      {/* Quick Mix Cards (Daily Mix / Weekly Mix) */}
      <section className="space-y-4 select-none">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Music size={18} className="text-primary" /> Generated Mixes for You
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          
          {/* Daily Mix Card */}
          <Link href="/discover">
            <div className="group relative h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-primary to-emerald-400 p-6 flex flex-col justify-between shadow-lg shadow-emerald-950/20 cursor-pointer">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full translate-x-12 -translate-y-6 blur-lg group-hover:scale-110 transition-transform duration-500" />
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-foreground bg-white/10 px-2.5 py-1 rounded-full w-fit">
                  Daily Mix
                </span>
                <h3 className="text-lg font-extrabold text-white mt-2">Energetic & Chill Tracks</h3>
                <p className="text-[10px] text-white/80 font-medium">A customized daily selection of acoustic and electronic tracks.</p>
              </div>
              <span className="text-xs text-white font-bold underline flex items-center gap-1.5 mt-2">
                Listen Now
              </span>
            </div>
          </Link>

          {/* Weekly Mix Card */}
          <Link href="/discover">
            <div className="group relative h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 flex flex-col justify-between shadow-lg shadow-purple-950/20 cursor-pointer">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full translate-x-12 -translate-y-6 blur-lg group-hover:scale-110 transition-transform duration-500" />
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-white bg-white/10 px-2.5 py-1 rounded-full w-fit">
                  Weekly Mix
                </span>
                <h3 className="text-lg font-extrabold text-white mt-2">Weekly Discovery Radar</h3>
                <p className="text-[10px] text-white/80 font-medium">Explore new artists and trending albums matching your vibe.</p>
              </div>
              <span className="text-xs text-white font-bold underline flex items-center gap-1.5 mt-2">
                Listen Now
              </span>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
