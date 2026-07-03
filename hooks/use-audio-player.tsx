"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Track } from "@/types";
import { logPlayHistory } from "@/server/actions/history";

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: "none" | "all" | "one";
  isShuffle: boolean;
  queue: Track[];
  playbackSpeed: number;
  crossfade: number; // in seconds
  
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  changeVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: "none" | "all" | "one") => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  setQueue: (tracks: Track[]) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCrossfade: (seconds: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueueState] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatModeState] = useState<"none" | "all" | "one">("none");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1);
  const [crossfade, setCrossfadeState] = useState<number>(0); // 0 = off

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loggedTracksRef = useRef<Set<string>>(new Set());

  // Initialize HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Load settings from localStorage if on client
    if (typeof window !== "undefined") {
      try {
        const cachedVolume = localStorage.getItem("singit_volume");
        if (cachedVolume) setVolume(parseFloat(cachedVolume));
        
        const cachedMuted = localStorage.getItem("singit_muted");
        if (cachedMuted) setIsMuted(cachedMuted === "true");

        const cachedRepeat = localStorage.getItem("singit_repeat");
        if (cachedRepeat) setRepeatModeState(cachedRepeat as any);

        const cachedShuffle = localStorage.getItem("singit_shuffle");
        if (cachedShuffle) setIsShuffle(cachedShuffle === "true");

        const cachedCrossfade = localStorage.getItem("singit_crossfade");
        if (cachedCrossfade) setCrossfadeState(parseInt(cachedCrossfade, 10));

        const cachedQueue = localStorage.getItem("singit_queue");
        const cachedIndex = localStorage.getItem("singit_index");
        if (cachedQueue && cachedIndex) {
          const parsedQueue = JSON.parse(cachedQueue) as Track[];
          const parsedIndex = parseInt(cachedIndex, 10);
          if (parsedQueue.length > 0 && parsedIndex >= 0 && parsedIndex < parsedQueue.length) {
            setQueueState(parsedQueue);
            setOriginalQueue(parsedQueue);
            setCurrentIndex(parsedIndex);
            
            // Prime audio source without playing
            audio.src = parsedQueue[parsedIndex].audioUrl;
            audio.load();
          }
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Sync volume & mute to HTMLAudioElement
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    if (typeof window !== "undefined") {
      localStorage.setItem("singit_volume", String(volume));
      localStorage.setItem("singit_muted", String(isMuted));
    }
  }, [volume, isMuted]);

  // Sync playback speed to HTMLAudioElement
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, currentTrack]);

  // Sync queue & index to local storage
  useEffect(() => {
    if (typeof window !== "undefined" && queue.length > 0) {
      localStorage.setItem("singit_queue", JSON.stringify(queue));
      localStorage.setItem("singit_index", String(currentIndex));
    }
  }, [queue, currentIndex]);

  // Listen to audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Crossfade logic: trigger in the last few seconds of the track
      if (crossfade > 0 && audio.duration && !crossfadeIntervalRef.current) {
        const remaining = audio.duration - audio.currentTime;
        if (remaining <= crossfade && remaining > 0.5) {
          triggerCrossfade();
        }
      }
    };

    const onDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        nextTrack();
      }
    };

    const onError = () => {
      console.error("Audio playback error, attempting recovery...");
      // Auto-next track if current fails
      setTimeout(() => {
        nextTrack();
      }, 2000);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [queue, currentIndex, repeatMode, crossfade]);

  // Trigger history log after 5 seconds of active playback
  useEffect(() => {
    if (!currentTrack || !isPlaying) return;

    const trackKey = `${currentTrack.id}-${Date.now()}`;
    const timer = setTimeout(async () => {
      if (!loggedTracksRef.current.has(currentTrack.id)) {
        loggedTracksRef.current.add(currentTrack.id);
        try {
          await logPlayHistory(currentTrack);
        } catch (e) {
          console.error("Failed to log play history:", e);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentTrack, isPlaying]);

  // Sync Media Session metadata
  useEffect(() => {
    if (!currentTrack || typeof window === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || "Unknown Album",
      artwork: [
        {
          src: currentTrack.coverUrl,
          sizes: "300x300",
          type: "image/jpeg",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      }
    };
  }, [currentTrack, isPlaying]);

  // Handle crossfade volume ramp down/up
  const triggerCrossfade = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const fadeSteps = 10;
    const fadeTimeMs = (crossfade * 1000) / fadeSteps;
    let step = 0;
    const originalVol = volume;

    crossfadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) return;
      step++;
      const factor = (fadeSteps - step) / fadeSteps;
      audio.volume = originalVol * factor * (isMuted ? 0 : 1);

      if (step >= fadeSteps) {
        if (crossfadeIntervalRef.current) {
          clearInterval(crossfadeIntervalRef.current);
          crossfadeIntervalRef.current = null;
        }
        // Restore volume and play next song
        audio.volume = originalVol * (isMuted ? 0 : 1);
        nextTrack();
      }
    }, fadeTimeMs);
  };

  // Keyboard Shortcuts (Space to play/pause, media keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          if (e.ctrlKey && audioRef.current) {
            e.preventDefault();
            seek(Math.min(audioRef.current.currentTime + 10, duration));
          }
          break;
        case "ArrowLeft":
          if (e.ctrlKey && audioRef.current) {
            e.preventDefault();
            seek(Math.max(audioRef.current.currentTime - 10, 0));
          }
          break;
        case "ArrowUp":
          if (e.ctrlKey) {
            e.preventDefault();
            changeVolume(Math.min(volume + 0.1, 1));
          }
          break;
        case "ArrowDown":
          if (e.ctrlKey) {
            e.preventDefault();
            changeVolume(Math.max(volume - 0.1, 0));
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume, duration]);

  // Actions
  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return;

    if (newQueue && newQueue.length > 0) {
      setQueueState(newQueue);
      setOriginalQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      // If track is already in queue, play it. Otherwise, add to queue and play.
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
      } else {
        const updated = [...queue, track];
        setQueueState(updated);
        setOriginalQueue(updated);
        setCurrentIndex(updated.length - 1);
      }
    }

    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }

    audioRef.current.src = track.audioUrl;
    audioRef.current.load();
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error("Playback start error:", err));
  };

  const playQueue = (tracks: Track[], startIndex: number = 0) => {
    if (tracks.length === 0) return;
    setQueueState(tracks);
    setOriginalQueue(tracks);
    setCurrentIndex(startIndex);

    if (audioRef.current) {
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
        crossfadeIntervalRef.current = null;
      }
      audioRef.current.src = tracks[startIndex].audioUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Playback start error:", err));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || currentIndex === -1) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        })
        .catch(console.error);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;

    if (nextIdx >= queue.length) {
      if (repeatMode === "all") {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setCurrentIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = queue[nextIdx].audioUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const prevTrack = () => {
    if (!audioRef.current || queue.length === 0) return;
    
    // If song is past 3 seconds, restart it. Otherwise, skip back.
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === "all") {
        prevIdx = queue.length - 1;
      } else {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        return;
      }
    }

    setCurrentIndex(prevIdx);
    audioRef.current.src = queue[prevIdx].audioUrl;
    audioRef.current.load();
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(console.error);
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (val: number) => {
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setRepeatMode = (mode: "none" | "all" | "one") => {
    setRepeatModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("singit_repeat", mode);
    }
  };

  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("singit_shuffle", String(nextShuffle));
    }

    if (nextShuffle) {
      // Shuffle queue while keeping current playing track at position 0 or active index
      if (currentTrack) {
        const remaining = queue.filter((t) => t.id !== currentTrack.id);
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        const newQueue = [currentTrack, ...shuffled];
        setQueueState(newQueue);
        setCurrentIndex(0);
      }
    } else {
      // Restore original queue order and find correct active index
      if (currentTrack) {
        const originalIdx = originalQueue.findIndex((t) => t.id === currentTrack.id);
        setQueueState(originalQueue);
        if (originalIdx >= 0) {
          setCurrentIndex(originalIdx);
        }
      }
    }
  };

  const addToQueue = (track: Track) => {
    // Prevent duplicate track adding in immediate queue if needed, or allow it
    setQueueState((prev) => [...prev, track]);
    setOriginalQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (trackId: string) => {
    const updated = queue.filter((t) => t.id !== trackId);
    setQueueState(updated);
    setOriginalQueue((prev) => prev.filter((t) => t.id !== trackId));
    
    // Adjust current index if we removed the active track or preceding track
    const removedIdx = queue.findIndex((t) => t.id === trackId);
    if (removedIdx === currentIndex) {
      if (updated.length === 0) {
        setCurrentIndex(-1);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.src = "";
      } else {
        nextTrack();
      }
    } else if (removedIdx < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const setPlaybackSpeed = (speed: number) => {
    setPlaybackSpeedState(speed);
  };

  const setCrossfade = (seconds: number) => {
    setCrossfadeState(seconds);
    if (typeof window !== "undefined") {
      localStorage.setItem("singit_crossfade", String(seconds));
    }
  };

  const setQueue = (tracks: Track[]) => {
    setQueueState(tracks);
    setOriginalQueue(tracks);
    // Find active playing index in the new queue list
    if (currentTrack) {
      const idx = tracks.findIndex((t) => t.id === currentTrack.id);
      setCurrentIndex(idx);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        queue,
        playbackSpeed,
        crossfade,
        playTrack,
        playQueue,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        toggleMute,
        setRepeatMode,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        setQueue,
        setPlaybackSpeed,
        setCrossfade,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
};
