"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFavorite, isFavorite } from "@/server/actions/favorites";
import { Artist } from "@/types";

interface FollowArtistButtonProps {
  artist: Artist;
}

export default function FollowArtistButton({ artist }: FollowArtistButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial follow state
  useEffect(() => {
    if (session) {
      isFavorite("ARTIST", artist.id).then((res) => {
        setIsFollowing(!!res.favorited);
      });
    }
  }, [artist.id, session]);

  const handleFollow = async () => {
    if (!session) return;
    setLoading(true);
    
    // Optimistic toggle
    setIsFollowing(!isFollowing);

    try {
      const res = await toggleFavorite({
        type: "ARTIST",
        itemId: artist.id,
        name: artist.name,
        imageUrl: artist.coverUrl,
      });

      if (res.success) {
        setIsFollowing(!!res.favorited);
      }
    } catch (e) {
      // Revert on error
      setIsFollowing(!isFollowing);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
        isFollowing
          ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/20"
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck size={14} /> Following
        </>
      ) : (
        <>
          <UserPlus size={14} /> Follow
        </>
      )}
    </button>
  );
}
