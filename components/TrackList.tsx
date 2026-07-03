"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Play, Pause, Heart, MoreVertical, Plus, ListMusic, Trash2 } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { toggleFavorite, isFavorite } from "@/server/actions/favorites";
import { getUserPlaylists, addTrackToPlaylist } from "@/server/actions/playlists";
import { Track } from "@/types";

interface TrackListProps {
  tracks: Track[];
  playlistId?: string; // If provided, shows a delete/remove option
  onRemoveTrack?: (trackItemId: string) => void; // Callback if removing from playlist
  showAlbum?: boolean;
}

export default function TrackList({ tracks, playlistId, onRemoveTrack, showAlbum = true }: TrackListProps) {
  const { data: session } = useSession();
  const player = useAudioPlayer();
  const currentTrack = player.currentTrack;
  const isPlaying = player.isPlaying;

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);

  // Sync favorites state
  useEffect(() => {
    if (session && tracks.length > 0) {
      tracks.forEach(async (t) => {
        const res = await isFavorite("TRACK", t.id);
        setFavorites((prev) => ({ ...prev, [t.id]: !!res.favorited }));
      });
    }
  }, [tracks, session]);

  // Load playlists for adding
  useEffect(() => {
    if (session && showPlaylists) {
      getUserPlaylists().then((res) => {
        if (res.success && res.playlists) {
          setPlaylists(res.playlists);
        }
      });
    }
  }, [session, showPlaylists]);

  const handleRowClick = (index: number) => {
    player.playQueue(tracks, index);
  };

  const handleToggleLike = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    
    const wasLiked = !!favorites[track.id];
    setFavorites((prev) => ({ ...prev, [track.id]: !wasLiked }));
    
    try {
      const res = await toggleFavorite({
        type: "TRACK",
        itemId: track.id,
        name: track.title,
        imageUrl: track.coverUrl,
        subText: track.artistName,
        audioUrl: track.audioUrl,
        duration: track.duration,
      });
      if (res.success) {
        setFavorites((prev) => ({ ...prev, [track.id]: !!res.favorited }));
      }
    } catch (err) {
      setFavorites((prev) => ({ ...prev, [track.id]: wasLiked }));
    }
  };

  const handleAddToQueue = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    player.addToQueue(track);
    setActiveMenu(null);
  };

  const handleAddToPlaylist = async (playlistId: string, track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    await addTrackToPlaylist(playlistId, track);
    setActiveMenu(null);
    setShowPlaylists(false);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full space-y-1 select-none">
      {/* Table Headers */}
      <div className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 border-b border-border/10 mb-2">
        <span className="w-8 text-center shrink-0">#</span>
        <span className="flex-1 px-4 truncate">Title</span>
        {showAlbum && <span className="flex-1 hidden md:block truncate">Album</span>}
        <span className="w-16 text-right shrink-0">Duration</span>
        <span className="w-16 shrink-0" />
      </div>

      {/* Rows */}
      {tracks.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground italic">No tracks available</div>
      ) : (
        tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;
          const isLiked = !!favorites[track.id];

          return (
            <div
              key={track.id}
              onClick={() => handleRowClick(index)}
              className={`group flex items-center px-4 py-3 rounded-xl hover:bg-secondary/40 border border-transparent transition-all duration-300 cursor-pointer ${
                isCurrent ? "bg-primary/5 border-primary/10" : ""
              }`}
            >
              {/* Position / Play icon */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <span className="group-hover:hidden text-xs text-muted-foreground font-bold tabular-nums">
                  {isCurrentPlaying ? (
                    <span className="flex items-end gap-0.5 h-3">
                      <span className="w-[1.5px] h-2.5 bg-primary rounded-full animate-music-bar-1" />
                      <span className="w-[1.5px] h-3.5 bg-primary rounded-full animate-music-bar-2" />
                      <span className="w-[1.5px] h-1.5 bg-primary rounded-full animate-music-bar-3" />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden group-hover:block">
                  {isCurrentPlaying ? (
                    <Pause size={12} className="fill-primary stroke-primary text-primary" />
                  ) : (
                    <Play size={12} className="fill-primary stroke-primary text-primary ml-0.5" />
                  )}
                </span>
              </div>

              {/* Title & Artist details */}
              <div className="flex-1 min-w-0 px-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4
                    className={`text-xs font-bold truncate ${
                      isCurrent ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5 hover:underline">
                    {track.artistName}
                  </p>
                </div>
              </div>

              {/* Album name */}
              {showAlbum && (
                <div className="flex-1 hidden md:block min-w-0">
                  <span className="text-xs text-muted-foreground truncate hover:underline">
                    {track.albumName || "Single"}
                  </span>
                </div>
              )}

              {/* Duration */}
              <div className="w-16 text-right shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums font-semibold">
                  {formatDuration(track.duration)}
                </span>
              </div>

              {/* Actions */}
              <div className="w-16 flex items-center justify-end gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {session && (
                  <button
                    onClick={(e) => handleToggleLike(track, e)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isLiked ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Heart size={13} className={isLiked ? "fill-primary" : ""} />
                  </button>
                )}

                {/* More dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === track.id ? null : track.id);
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    <MoreVertical size={13} />
                  </button>

                  {activeMenu === track.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                      <div className="absolute right-0 bottom-6 w-44 glass border border-border rounded-xl p-1.5 z-50 shadow-2xl flex flex-col">
                        <button
                          onClick={(e) => handleAddToQueue(track, e)}
                          className="w-full text-left text-xs px-2 py-1 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <Plus size={12} /> Add to Queue
                        </button>
                        
                        {session && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPlaylists(!showPlaylists);
                              }}
                              className="w-full text-left text-xs px-2 py-1 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <ListMusic size={12} /> Add to Playlist
                              </span>
                              <span>&gt;</span>
                            </button>
                            {showPlaylists && (
                              <div className="absolute right-full bottom-0 mr-1 w-44 max-h-36 overflow-y-auto glass border border-border rounded-xl p-1 z-50 shadow-2xl flex flex-col">
                                {playlists.map((pl) => (
                                  <button
                                    key={pl.id}
                                    onClick={(e) => handleAddToPlaylist(pl.id, track, e)}
                                    className="w-full text-left text-[10px] px-2.5 py-1.5 rounded-lg text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors truncate"
                                  >
                                    {pl.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {playlistId && onRemoveTrack && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTrack(track.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left text-xs px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2 border-t border-border/20 mt-1 pt-1"
                          >
                            <Trash2 size={12} /> Remove Song
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
