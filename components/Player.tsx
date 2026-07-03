"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  RotateCcw,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  Gauge,
  Sliders,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { toggleFavorite, isFavorite } from "@/server/actions/favorites";
import { getUserPlaylists, addTrackToPlaylist } from "@/server/actions/playlists";
import QueueDrawer from "./QueueDrawer";
import MusicVisualizer from "./MusicVisualizer";

// Helper helper function to format seconds into MM:SS
function formatTime(secs: number) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function Player() {
  const { data: session } = useSession();
  const player = useAudioPlayer();
  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted, repeatMode, isShuffle, queue, playbackSpeed, crossfade } = player;

  const [isLiked, setIsLiked] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showShareToast, setShowShareToast] = useState(false);

  // Sync like state when track changes
  useEffect(() => {
    if (currentTrack && session) {
      isFavorite("TRACK", currentTrack.id).then((res) => {
        setIsLiked(!!res.favorited);
      });
    } else {
      setIsLiked(false);
    }
  }, [currentTrack, session]);

  // Load playlists for adding track
  useEffect(() => {
    if (session && showPlaylistMenu) {
      getUserPlaylists().then((res) => {
        if (res.success && res.playlists) {
          setPlaylists(res.playlists);
        }
      });
    }
  }, [session, showPlaylistMenu]);

  if (!currentTrack) return null;

  // Handlers
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    setIsLiked(!isLiked); // optimistic update
    try {
      const res = await toggleFavorite({
        type: "TRACK",
        itemId: currentTrack.id,
        name: currentTrack.title,
        imageUrl: currentTrack.coverUrl,
        subText: currentTrack.artistName,
        audioUrl: currentTrack.audioUrl,
        duration: currentTrack.duration,
      });
      if (res.success) {
        setIsLiked(!!res.favorited);
      }
    } catch (err) {
      setIsLiked(!isLiked); // revert on error
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentTrack.title)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  const handleAddToPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await addTrackToPlaylist(playlistId, currentTrack);
    setShowPlaylistMenu(false);
  };

  const cycleRepeatMode = () => {
    if (repeatMode === "none") player.setRepeatMode("all");
    else if (repeatMode === "all") player.setRepeatMode("one");
    else player.setRepeatMode("none");
  };

  return (
    <>
      {/* Dynamic Visualizer Drawer */}
      <AnimatePresence>
        {isVisualizerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 top-0 bottom-[92px] bg-background/95 z-20 p-6 flex flex-col md:flex-row gap-6 md:p-12"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="w-48 h-48 md:w-80 md:h-80 rounded-full border-4 border-primary/20 overflow-hidden shadow-2xl shrink-0"
              >
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              </motion.div>
              <h2 className="text-xl md:text-3xl font-extrabold mt-6 truncate max-w-lg">{currentTrack.title}</h2>
              <p className="text-sm md:text-lg text-primary font-medium mt-1">{currentTrack.artistName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{currentTrack.albumName}</p>
            </div>
            
            <div className="flex-1 h-1/2 md:h-full">
              <MusicVisualizer isPlaying={isPlaying} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 glass border border-primary/20 px-5 py-2.5 rounded-full text-xs font-semibold text-primary z-50 shadow-lg shadow-black/40 flex items-center gap-2"
          >
            <Share2 size={14} /> Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play Queue Drawer */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Desktop & Tablet Player (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 h-[92px] glass border-t border-border/80 bg-background/90 z-40 select-none hidden md:grid grid-cols-3 items-center px-6">
        
        {/* Track Details */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
            className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md shrink-0 cursor-pointer group"
          >
            <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <Maximize2 size={16} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold truncate pr-2 hover:underline cursor-pointer">{currentTrack.title}</h4>
            <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">{currentTrack.artistName}</p>
          </div>
          
          {/* Like & Share tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleLike}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLiked ? "text-primary bg-primary/10" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Heart size={16} className={isLiked ? "fill-primary" : ""} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <Share2 size={16} />
            </button>

            {/* Add to playlist wrapper */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                  className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  <ListMusic size={16} />
                </button>
                {showPlaylistMenu && (
                  <div className="absolute bottom-12 left-0 w-48 max-h-48 overflow-y-auto glass border border-border rounded-xl p-1.5 z-50 shadow-2xl flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 select-none">Add to Playlist</span>
                    {playlists.length === 0 ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 select-none italic">No playlists</span>
                    ) : (
                      playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={(e) => handleAddToPlaylist(pl.id, e)}
                          className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors truncate"
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
        </div>

        {/* Center Playback Controls */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-5">
            <button
              onClick={player.toggleShuffle}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isShuffle ? "text-primary bg-primary/10" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={player.prevTrack}
              className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={player.togglePlay}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-md shadow-primary/25 cursor-pointer shrink-0"
            >
              {isPlaying ? <Pause size={18} className="fill-primary-foreground" /> : <Play size={18} className="ml-0.5 fill-primary-foreground" />}
            </button>
            <button
              onClick={player.nextTrack}
              className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={cycleRepeatMode}
              className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                repeatMode !== "none" ? "text-primary bg-primary/10" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <RotateCcw size={16} />
              {repeatMode === "one" && (
                <span className="absolute top-1 right-1 text-[8px] bg-primary text-primary-foreground w-2.5 h-2.5 rounded-full flex items-center justify-center scale-90">1</span>
              )}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full max-w-md flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative group py-1.5 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => player.seek(parseFloat(e.target.value))}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer outline-none accent-primary [&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-thumb]:w-0 group-hover:[&::-webkit-slider-thumb]:w-2.5 group-hover:[&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none"
              />
              {/* Fake progress bar to highlight elapsed time cleanly */}
              <div
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                className="h-1 bg-primary rounded-lg pointer-events-none group-hover:bg-primary-hover transition-colors"
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Aux Controls */}
        <div className="flex items-center justify-end gap-3.5">
          {/* Visualizer Toggle */}
          <button
            onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isVisualizerOpen ? "text-primary bg-primary/10" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title="Music Visualizer"
          >
            <Sliders size={16} />
          </button>

          {/* Playback speed control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
              title="Playback Speed"
            >
              <Gauge size={16} />
              <span className="text-[10px] font-bold">{playbackSpeed}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-12 right-0 bg-card border border-border glass rounded-xl p-1 z-50 shadow-2xl flex flex-col w-20">
                {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      player.setPlaybackSpeed(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-center text-xs py-1.5 rounded-lg transition-colors ${
                      playbackSpeed === s ? "bg-primary text-primary-foreground font-semibold" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crossfade parameter config */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground font-bold" title="Crossfade timer">Fade</span>
            <input
              type="range"
              min={0}
              max={10}
              value={crossfade}
              onChange={(e) => player.setCrossfade(parseInt(e.target.value, 10))}
              className="w-12 h-1 bg-secondary rounded-lg appearance-none cursor-pointer outline-none accent-primary"
              title={`${crossfade}s crossfade`}
            />
            <span className="text-[9px] text-muted-foreground font-semibold tabular-nums w-4">{crossfade}s</span>
          </div>

          {/* Volume bars */}
          <div className="flex items-center gap-2">
            <button
              onClick={player.toggleMute}
              className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => player.changeVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-secondary rounded-lg appearance-none cursor-pointer outline-none accent-primary"
            />
          </div>

          {/* Queue side panel toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isQueueOpen ? "text-primary bg-primary/10" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title="Queue"
          >
            <ListMusic size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Sticky Player (Mini Player) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 h-14 bg-card/90 glass border-t border-border/60 z-40 flex items-center justify-between px-4 pb-safe select-none">
        <div onClick={() => setIsMobileExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 h-full cursor-pointer">
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
            <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold truncate">{currentTrack.title}</h5>
            <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artistName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleLike}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLiked ? "text-primary" : "text-secondary-foreground"
            }`}
          >
            <Heart size={16} className={isLiked ? "fill-primary" : ""} />
          </button>
          <button
            onClick={player.togglePlay}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause size={14} className="fill-primary-foreground" /> : <Play size={14} className="ml-0.5 fill-primary-foreground" />}
          </button>
          <button
            onClick={player.nextTrack}
            className="p-2 rounded-xl text-secondary-foreground cursor-pointer"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Small absolute timeline loading line under the mini player */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-secondary">
          <div
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      {/* Mobile Expanded Player Bottom Sheet */}
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-0 bg-background z-50 flex flex-col p-6 overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-6">
              <button
                onClick={() => setIsMobileExpanded(false)}
                className="p-2 rounded-xl bg-card hover:bg-secondary text-foreground transition-colors shrink-0"
              >
                <ChevronDown size={18} />
              </button>
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Now Playing</span>
              <button
                onClick={() => {
                  setIsMobileExpanded(false);
                  setIsQueueOpen(true);
                }}
                className="p-2 rounded-xl bg-card hover:bg-secondary text-foreground transition-colors shrink-0"
              >
                <ListMusic size={18} />
              </button>
            </div>

            {/* Album Artwork */}
            <div className="flex-1 flex flex-col items-center justify-center my-6">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border border-border/40 shrink-0"
              >
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              </motion.div>
            </div>

            {/* Song Meta Details */}
            <div className="mb-4 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
                  <p className="text-sm text-primary font-medium truncate mt-0.5">{currentTrack.artistName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{currentTrack.albumName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isLiked ? "bg-primary/15 text-primary" : "bg-card text-secondary-foreground"
                    }`}
                  >
                    <Heart size={18} className={isLiked ? "fill-primary" : ""} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl bg-card text-secondary-foreground transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Playback Seek Bar */}
            <div className="mb-6 shrink-0">
              <div className="relative group py-2.5 cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => player.seek(parseFloat(e.target.value))}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer outline-none accent-primary [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none"
                />
                <div
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  className="h-1 bg-primary rounded-lg pointer-events-none"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Expanded Controls */}
            <div className="flex flex-col items-center justify-center gap-6 shrink-0 pb-safe">
              <div className="flex items-center justify-between w-full max-w-sm px-4">
                <button
                  onClick={player.toggleShuffle}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isShuffle ? "text-primary" : "text-secondary-foreground"
                  }`}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  onClick={player.prevTrack}
                  className="p-3 rounded-xl text-foreground hover:bg-secondary cursor-pointer"
                >
                  <SkipBack size={24} />
                </button>
                <button
                  onClick={player.togglePlay}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-md shadow-primary/25 cursor-pointer"
                >
                  {isPlaying ? <Pause size={28} className="fill-primary-foreground" /> : <Play size={28} className="ml-1 fill-primary-foreground" />}
                </button>
                <button
                  onClick={player.nextTrack}
                  className="p-3 rounded-xl text-foreground hover:bg-secondary cursor-pointer"
                >
                  <SkipForward size={24} />
                </button>
                <button
                  onClick={cycleRepeatMode}
                  className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                    repeatMode !== "none" ? "text-primary" : "text-secondary-foreground"
                  }`}
                >
                  <RotateCcw size={18} />
                  {repeatMode === "one" && (
                    <span className="absolute top-1 right-1 text-[8px] bg-primary text-primary-foreground w-2.5 h-2.5 rounded-full flex items-center justify-center scale-90">1</span>
                  )}
                </button>
              </div>

              {/* Volume Slider for Mobile */}
              <div className="flex items-center gap-3 w-full max-w-sm px-4">
                <button onClick={player.toggleMute} className="text-secondary-foreground shrink-0">
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => player.changeVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-secondary rounded-lg appearance-none cursor-pointer outline-none accent-primary"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
