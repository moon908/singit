"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FolderPlus } from "lucide-react";
import { createPlaylist } from "@/server/actions/playlists";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatePlaylistButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await createPlaylist(name.trim(), description.trim() || undefined, isPublic);
      if (res.success && res.playlist) {
        setIsOpen(false);
        setName("");
        setDescription("");
        router.push(`/playlist/${res.playlist.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <Plus size={16} /> Create Playlist
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border glass rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3 select-none">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FolderPlus size={18} className="text-primary animate-pulse" /> Create New Playlist
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground">Playlist Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter playlist description..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none resize-none"
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
                    <span
                      className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                        isPublic ? "left-[22px]" : "left-[4px]"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 border border-border hover:bg-secondary rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
