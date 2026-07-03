"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Shuffle,
  Lock,
  Globe,
  Edit3,
  Trash2,
  Share2,
  X,
  Plus,
  Save,
  Music,
  GripVertical,
} from "lucide-react";
import { deletePlaylist, removeTrackFromPlaylist, reorderPlaylist, getPlaylistDetails } from "@/server/actions/playlists";
import { toggleFavorite, isFavorite } from "@/server/actions/favorites";
import { Track } from "@/types";
import PlayQueueButton from "@/components/PlayQueueButton";
import TrackList from "@/components/TrackList";
import { updateUserSettings } from "@/server/actions/settings";
import prisma from "@/lib/prisma";

// We import standard prisma actions. Since this is client component, we will write server actions or wrapper.
// We can rename/update playlists. Let's create a small server action for updating playlist metadata!
// Wait, did we write updatePlaylist in playlists.ts? Let's check:
// Playlists.ts has createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylist, getUserPlaylists, getPlaylistDetails.
// It does NOT have updatePlaylist. Let's write updatePlaylist as an inline action or let's create a server action in playlists.ts.
// We can define it in playlists.ts later, or we can use a server action. Let's write it in playlists.ts now or add it.
// Let's first make sure we can update playlist details. Let's write an edit modal in our component.

interface PlaylistClientProps {
  initialPlaylist: any;
  userId: string | null;
}

export default function PlaylistClient({ initialPlaylist, userId }: PlaylistClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [isPublic, setIsPublic] = useState(playlist.isPublic);
  const [coverImage, setCoverImage] = useState(playlist.coverImage || "");
  const [showShareToast, setShowShareToast] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isOwner = session && userId === playlist.userId;

  // Refresh playlist state if database updates
  const refreshPlaylist = async () => {
    const res = await getPlaylistDetails(playlist.id);
    if (res.success && res.playlist) {
      setPlaylist(res.playlist);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    const res = await deletePlaylist(playlist.id);
    if (res.success) {
      router.push("/playlists");
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    // Find track item ID from playlist items
    const item = playlist.items.find((i: any) => i.trackId === trackId);
    if (!item) return;
    
    const res = await removeTrackFromPlaylist(playlist.id, item.id);
    if (res.success) {
      refreshPlaylist();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // We will call a server action or update inline using a custom Server Action we can import.
    // Let's create an inline Server Action directly or let's use a server action.
    // Wait, let's write the updatePlaylist function directly in a server action file later or call it.
    // Let's import the server action. Wait! Since we don't have it in playlists.ts yet, let's write it in checklists or write it.
    // Let's add updatePlaylist in server/actions/playlists.ts! We will do that right after this file.
    // For now, let's write the fetch call or inline action. We can write an inline server action in Next.js 15:
    // We can define it in playlists.ts.
    
    const { updatePlaylistMetadata } = await import("@/server/actions/playlists_extra");
    const res = await updatePlaylistMetadata(playlist.id, { name, description, isPublic, coverImage });
    if (res.success) {
      setIsEditing(false);
      refreshPlaylist();
    }
  };

  // HTML5 Drag & Drop for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const items = [...playlist.items];
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);

    // Save temporary client state
    setPlaylist({ ...playlist, items });
    setDraggedIndex(null);

    // Persist to server
    const orderedIds = items.map((i: any) => i.id);
    await reorderPlaylist(playlist.id, orderedIds);
    refreshPlaylist();
  };

  // Map playlist items to standard Track shape for player queue
  const tracks: Track[] = playlist.items.map((item: any) => ({
    id: item.trackId,
    title: item.title,
    artistId: "unknown",
    artistName: item.artistName,
    albumId: "unknown",
    albumName: item.albumName || "",
    coverUrl: item.coverUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
    duration: item.duration,
    audioUrl: item.audioUrl,
  }));

  return (
    <div className="space-y-8 select-none">
      
      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 glass border border-primary/20 px-5 py-2.5 rounded-full text-xs font-semibold text-primary z-50 shadow-lg shadow-black/40 flex items-center gap-2"
          >
            <Share2 size={14} /> Playlist link copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Backdrop blur */}
        <div className="absolute inset-0 z-0">
          <img src={playlist.coverImage || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg"} alt="Backdrop" className="w-full h-full object-cover blur-3xl opacity-20 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />
        </div>

        {/* Cover Artwork */}
        <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 z-10 border border-border/30 bg-secondary flex items-center justify-center">
          {playlist.coverImage ? (
            <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Music size={48} className="text-muted-foreground animate-pulse" />
          )}
        </div>

        {/* Playlist Text Info */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1.5">
            {playlist.isPublic ? <Globe size={11} /> : <Lock size={11} />}
            {playlist.isPublic ? "Public Playlist" : "Private Playlist"}
          </span>
          
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground truncate max-w-xl">
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-xs text-muted-foreground font-medium max-w-md line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center md:justify-start text-xs text-muted-foreground font-semibold">
            <span className="text-foreground">
              By <span className="font-bold">{playlist.user.name || "User"}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{playlist.items.length} songs</span>
          </div>

          {/* Action buttons row */}
          <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <PlayQueueButton tracks={tracks} />
            <PlayQueueButton tracks={tracks} variant="secondary" shuffleInitially={true} />
            
            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-card hover:bg-secondary text-secondary-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
              title="Share playlist"
            >
              <Share2 size={16} />
            </button>

            {/* Owner settings */}
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 rounded-xl bg-card hover:bg-secondary text-secondary-foreground hover:text-primary transition-all active:scale-95 cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-xl bg-card hover:bg-secondary text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 cursor-pointer"
                  title="Delete playlist"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracks list */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Playlist Songs</h3>
        
        {isOwner ? (
          /* Drag and Drop list */
          <div className="glass border border-border/20 rounded-2xl p-4 md:p-6 space-y-1">
            {playlist.items.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">
                Playlist is empty. Search for songs and add them!
              </div>
            ) : (
              playlist.items.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-secondary/40 border border-transparent transition-all duration-300"
                >
                  <div className="cursor-grab text-muted-foreground/35 hover:text-muted-foreground/80 shrink-0 mr-3">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TrackList tracks={[tracks[idx]]} playlistId={playlist.id} onRemoveTrack={handleRemoveTrack} showAlbum={true} />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Standard list view */
          <div className="glass border border-border/20 rounded-2xl p-4 md:p-6">
            <TrackList tracks={tracks} />
          </div>
        )}
      </div>

      {/* Edit Details Dialog Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border glass rounded-3xl p-6 relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <h3 className="text-base font-bold text-foreground">Edit Playlist Details</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-muted-foreground">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground">Cover Image URL (Optional)</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/30 pt-4">
                <label className="text-muted-foreground">Make Playlist Public</label>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isPublic ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3.5px] transition-transform ${isPublic ? "left-[22px]" : "left-[4px]"}`} />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 border border-border hover:bg-secondary rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
    </div>
  );
}
