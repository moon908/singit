"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, GripVertical, Trash2, Play, Save } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { createPlaylist, addTrackToPlaylist } from "@/server/actions/playlists";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const { queue, currentTrack, setQueue, playTrack, removeFromQueue } = useAudioPlayer();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Simple HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newQueue = [...queue];
    const [removed] = newQueue.splice(draggedIndex, 1);
    newQueue.splice(targetIndex, 0, removed);
    
    setQueue(newQueue);
    setDraggedIndex(null);
  };

  // Save current queue as a playlist
  const handleSaveQueue = async () => {
    if (queue.length === 0) return;
    setIsSaving(true);
    try {
      const playlistName = `Queue Mix - ${new Date().toLocaleDateString()}`;
      const res = await createPlaylist(playlistName, "Playlist generated from listening queue", true);
      
      if (res.success && res.playlist) {
        // Add all tracks
        for (const track of queue) {
          await addTrackToPlaylist(res.playlist.id, track);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-[92px] w-full md:w-[380px] bg-card/95 border-l border-border glass z-35 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
        <div>
          <h2 className="text-base font-bold text-foreground">Play Queue</h2>
          <p className="text-xs text-muted-foreground">{queue.length} songs</p>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={handleSaveQueue}
              disabled={isSaving}
              className={`p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50`}
              title="Save queue as playlist"
            >
              {saveSuccess ? (
                <span className="text-xs text-primary font-semibold">Saved!</span>
              ) : (
                <Save size={18} />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <ListMusic size={40} className="mb-3 opacity-40 animate-pulse text-primary" />
            <p className="text-sm font-semibold">Your queue is empty</p>
            <p className="text-xs mt-1 max-w-[200px]">Find songs and click play to build your list.</p>
          </div>
        ) : (
          queue.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            
            return (
              <div
                key={`${track.id}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 border border-transparent hover:border-border/30 hover:bg-secondary/40 select-none ${
                  isCurrent ? "bg-primary/10 border-primary/20" : ""
                }`}
              >
                {/* Drag handle */}
                <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>

                {/* Cover art */}
                <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => playTrack(track)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Play size={12} className="fill-primary stroke-primary" />
                  </button>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">{track.artistName}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                  <button
                    onClick={() => removeFromQueue(track.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// Inline fallback for ListMusic icon
function ListMusic(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15V6" />
      <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M12 12H3" />
      <path d="M16 6H3" />
      <path d="M12 18H3" />
    </svg>
  );
}
