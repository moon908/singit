"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Play, Pause, Heart, Share2, MoreVertical, Plus, ListMusic } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { toggleFavorite, isFavorite } from "@/server/actions/favorites";
import { getUserPlaylists, addTrackToPlaylist } from "@/server/actions/playlists";
import { Track } from "@/types";

interface SongCardProps {
  track: Track;
  activeQueue?: Track[];
}

export default function SongCard({ track, activeQueue }: SongCardProps) {
  const { data: session } = useSession();
  const player = useAudioPlayer();
  const isPlayingCurrent = player.isPlaying && player.currentTrack?.id === track.id;

  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Sync like state
  useEffect(() => {
    if (session) {
      isFavorite("TRACK", track.id).then((res) => {
        setIsLiked(!!res.favorited);
      });
    }
  }, [track.id, session]);

  // Load playlists when menu is active
  useEffect(() => {
    if (session && showPlaylists) {
      getUserPlaylists().then((res) => {
        if (res.success && res.playlists) {
          setPlaylists(res.playlists);
        }
      });
    }
  }, [session, showPlaylists]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowPlaylists(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMenu]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingCurrent) {
      player.togglePlay();
    } else {
      player.playTrack(track, activeQueue);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    setIsLiked(!isLiked); // optimistic update
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
        setIsLiked(!!res.favorited);
      }
    } catch (err) {
      setIsLiked(!isLiked); // revert
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    player.addToQueue(track);
    setShowMenu(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(track.title)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Small trigger alert or logs
      setShowMenu(false);
    });
  };

  const handleAddToPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await addTrackToPlaylist(playlistId, track);
    setShowMenu(false);
    setShowPlaylists(false);
  };

  return (
    <div className="group relative bg-card/40 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer overflow-visible">
      {/* Artwork container */}
      <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm shrink-0">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Hover overlay with big play button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-black/30 cursor-pointer"
          >
            {isPlayingCurrent ? (
              <Pause size={20} className="fill-primary-foreground text-primary-foreground" />
            ) : (
              <Play size={20} className="ml-1 fill-primary-foreground text-primary-foreground" />
            )}
          </button>
        </div>

        {/* Small animated waves when playing */}
        {isPlayingCurrent && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 px-2 py-1 rounded-md flex items-end gap-0.5 h-6">
            <span className="w-0.5 h-3 bg-primary rounded-full animate-music-bar-1" />
            <span className="w-0.5 h-4 bg-primary rounded-full animate-music-bar-2" />
            <span className="w-0.5 h-2 bg-primary rounded-full animate-music-bar-3" />
            <span className="w-0.5 h-3 bg-primary rounded-full animate-music-bar-4" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold truncate text-foreground pr-2" title={track.title}>
            {track.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5 hover:underline">
            {track.artistName}
          </p>
        </div>

        {/* Footer buttons row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground font-semibold">
            {Math.floor(track.duration / 60)}:
            {track.duration % 60 < 10 ? "0" : ""}
            {track.duration % 60}
          </span>
          <div className="flex items-center gap-1">
            {session && (
              <button
                onClick={handleLike}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLiked ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Heart size={14} className={isLiked ? "fill-primary" : ""} />
              </button>
            )}
            
            {/* Context menu trigger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>

              {/* Context menu box */}
              {showMenu && (
                <div className="absolute right-0 bottom-8 w-44 glass border border-border rounded-xl p-1.5 z-40 shadow-2xl flex flex-col">
                  <button
                    onClick={handleAddToQueue}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Plus size={13} /> Add to Queue
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Share2 size={13} /> Copy Share Link
                  </button>
                  
                  {session && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPlaylists(!showPlaylists);
                        }}
                        className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ListMusic size={13} /> Add to Playlist
                        </span>
                        <span>&gt;</span>
                      </button>
                      
                      {showPlaylists && (
                        <div className="absolute right-full bottom-0 mr-1 w-44 max-h-36 overflow-y-auto glass border border-border rounded-xl p-1 z-50 shadow-2xl flex flex-col">
                          {playlists.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground px-2 py-1 select-none italic">No playlists</span>
                          ) : (
                            playlists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={(e) => handleAddToPlaylist(pl.id, e)}
                                className="w-full text-left text-[11px] px-2 py-1 rounded-md text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors truncate"
                              >
                                {pl.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
