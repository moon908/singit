"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Disc, Radio, Heart, Play } from "lucide-react";
import TrackList from "@/components/TrackList";
import PlayQueueButton from "@/components/PlayQueueButton";
import { Track, Album, Artist } from "@/types";
import { toggleFavorite } from "@/server/actions/favorites";

interface FavoritesClientProps {
  initialFavorites: any[];
}

export default function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [activeTab, setActiveTab] = useState<"songs" | "albums" | "artists">("songs");

  // Sync favorites when prop changes
  useEffect(() => {
    setFavorites(initialFavorites);
  }, [initialFavorites]);

  const songs = favorites.filter((f) => f.type === "TRACK");
  const albums = favorites.filter((f) => f.type === "ALBUM");
  const artists = favorites.filter((f) => f.type === "ARTIST");

  const handleUnfavorite = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Optimistic remove
    setFavorites((prev) => prev.filter((f) => f.id !== item.id));

    try {
      await toggleFavorite({
        type: item.type,
        itemId: item.itemId,
        name: item.name,
      });
    } catch (err) {
      // Restore on error
      setFavorites(favorites);
    }
  };

  // Convert favorite songs to standard Track model for PlayQueueButton & TrackList
  const tracksList: Track[] = songs.map((s) => ({
    id: s.itemId,
    title: s.name,
    artistId: "unknown",
    artistName: s.subText || "Unknown Artist",
    albumId: "unknown",
    albumName: "",
    coverUrl: s.imageUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
    duration: s.duration || 0,
    audioUrl: s.audioUrl || "",
  }));

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Backdrop blur */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-primary/20 blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />
        </div>

        {/* Large Heart Icon */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-2xl shrink-0 z-10 border border-rose-400/20">
          <Heart size={64} className="fill-white text-white animate-pulse" />
        </div>

        {/* Text Info */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1">
            <Heart size={10} className="fill-rose-500" /> Favorites
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Liked Collection
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            {songs.length} songs • {albums.length} albums • {artists.length} artists
          </p>

          {/* Quick Play for liked songs */}
          {tracksList.length > 0 && (
            <div className="pt-3 flex justify-center md:justify-start gap-3">
              <PlayQueueButton tracks={tracksList} />
              <PlayQueueButton tracks={tracksList} variant="secondary" shuffleInitially={true} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border/20 pb-2">
        <button
          onClick={() => setActiveTab("songs")}
          className={`px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer ${
            activeTab === "songs" ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Music size={13} /> Songs ({songs.length})
        </button>
        <button
          onClick={() => setActiveTab("albums")}
          className={`px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer ${
            activeTab === "albums" ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Disc size={13} /> Albums ({albums.length})
        </button>
        <button
          onClick={() => setActiveTab("artists")}
          className={`px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer ${
            activeTab === "artists" ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Radio size={13} /> Artists ({artists.length})
        </button>
      </div>

      {/* Lists Display */}
      <div className="glass border border-border/20 rounded-2xl p-4 md:p-6">
        
        {/* Songs Tab */}
        {activeTab === "songs" && (
          <div className="space-y-4">
            {tracksList.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No liked songs yet</div>
            ) : (
              <TrackList tracks={tracksList} />
            )}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === "albums" && (
          <div className="space-y-4">
            {albums.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No liked albums yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <div key={album.id} className="relative group">
                    <Link href={`/album/${album.itemId}`}>
                      <div className="bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer">
                        <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0">
                          <img src={album.imageUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg"} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate text-foreground pr-4" title={album.name}>
                            {album.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {album.subText}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleUnfavorite(album, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      title="Unlike album"
                    >
                      <Heart size={12} className="fill-primary text-primary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === "artists" && (
          <div className="space-y-4">
            {artists.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No followed artists yet</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <div key={artist.id} className="relative group">
                    <Link href={`/artist/${artist.itemId}`}>
                      <div className="bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-xl cursor-pointer">
                        <div className="w-20 h-20 rounded-full overflow-hidden shadow-md shrink-0 border border-border/40">
                          <img src={artist.imageUrl || "https://img.jamendo.com/artists/s6/6122/covers/1.300.jpg"} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h4 className="text-xs font-bold truncate text-foreground w-full">
                          {artist.name}
                        </h4>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleUnfavorite(artist, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      title="Unfollow artist"
                    >
                      <Heart size={12} className="fill-primary text-primary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
    </div>
  );
}
