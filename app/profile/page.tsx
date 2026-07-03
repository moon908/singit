import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserPlaylists } from "@/server/actions/playlists";
import { getUserFavorites } from "@/server/actions/favorites";
import { User, Calendar, Mail, ListMusic, Heart, Edit2, Music } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  // Protect route
  if (!session) {
    redirect("/login");
  }

  // Fetch db user details
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Fetch collections
  const [playlistsRes, favoritesRes] = await Promise.all([
    getUserPlaylists(),
    getUserFavorites(),
  ]);

  const playlists = playlistsRes.success ? playlistsRes.playlists || [] : [];
  const favorites = favoritesRes.success ? favoritesRes.favorites || [] : [];

  const likedTracks = favorites.filter((f) => f.type === "TRACK");
  const followedArtists = favorites.filter((f) => f.type === "ARTIST");

  return (
    <div className="space-y-10 select-none">
      
      {/* Profile Card Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/25 bg-card/60 p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
        {/* Backdrop color */}
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-primary/10 via-cyan-500/10 to-transparent blur-3xl opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-card/50 to-transparent" />

        {/* Profile Avatar */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl shrink-0 z-10 border-2 border-primary/20">
          <img
            src={dbUser.image || "https://avatars.githubusercontent.com/u/1012345?v=4"}
            alt={dbUser.name || "User Avatar"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Info details */}
        <div className="relative z-10 flex-1 text-center md:text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 inline-flex items-center gap-1">
            <User size={10} /> User Profile
          </span>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground truncate max-w-xl">
            {dbUser.name}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center md:justify-start text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-1.5">
              <Mail size={13} /> {dbUser.email}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> Joined {new Date(dbUser.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="pt-4 flex items-center justify-center md:justify-start">
            <Link href="/settings">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer">
                <Edit2 size={13} /> Edit Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Playlists & Favorite Artists */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Playlists Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ListMusic size={18} className="text-primary animate-pulse" /> My Custom Playlists ({playlists.length})
            </h3>
            <Link href="/playlists" className="text-xs text-primary hover:underline font-semibold">
              Manage All
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div className="glass border border-border/20 rounded-2xl p-8 text-center text-xs text-muted-foreground italic">
              No playlists created yet. Create one on the playlists dashboard.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {playlists.slice(0, 6).map((pl: any) => (
                <Link key={pl.id} href={`/playlist/${pl.id}`}>
                  <div className="group bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer">
                    <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0 bg-secondary flex items-center justify-center">
                      {pl.coverImage ? (
                        <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Music size={24} className="text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate text-foreground pr-1">
                        {pl.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {pl._count?.items || 0} songs
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Liked Artists Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Heart size={18} className="text-rose-500 animate-pulse" /> Followed Artists ({followedArtists.length})
            </h3>
            <Link href="/favorites" className="text-xs text-primary hover:underline font-semibold">
              Explore All
            </Link>
          </div>

          {followedArtists.length === 0 ? (
            <div className="glass border border-border/20 rounded-2xl p-8 text-center text-xs text-muted-foreground italic">
              You are not following any artists yet.
            </div>
          ) : (
            <div className="glass border border-border/20 rounded-2xl p-4 space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
              {followedArtists.slice(0, 5).map((artist: any) => (
                <Link key={artist.id} href={`/artist/${artist.itemId}`}>
                  <div className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/40">
                      <img src={artist.imageUrl || "https://img.jamendo.com/artists/s6/6122/covers/1.300.jpg"} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate text-foreground">
                        {artist.name}
                      </h4>
                      <p className="text-[9px] text-muted-foreground">Artist Profile</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
export const dynamic = "force-dynamic";
