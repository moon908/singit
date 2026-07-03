import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserPlaylists } from "@/server/actions/playlists";
import CreatePlaylistButton from "@/components/CreatePlaylistButton";
import { ListMusic, Music, Lock, Globe } from "lucide-react";

export default async function PlaylistsPage() {
  const session = await auth();

  // Protect route
  if (!session) {
    redirect("/login");
  }

  const res = await getUserPlaylists();
  const playlists = res.success ? res.playlists || [] : [];

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ListMusic className="text-primary animate-pulse" /> My Playlists
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and organize your custom soundtrack mixes</p>
        </div>
        <CreatePlaylistButton />
      </div>

      {/* Grid of Playlists */}
      {playlists.length === 0 ? (
        <div className="border border-border/20 bg-card/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <ListMusic size={48} className="text-primary/45 mb-4 animate-bounce" />
          <h3 className="text-base font-bold text-foreground">Create your first playlist</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
            Organize your favorite songs by creating a custom mix. Add tracks directly from searches or albums.
          </p>
          <div className="mt-6">
            <CreatePlaylistButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist: any) => (
            <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
              <div className="group bg-card/30 hover:bg-card/90 border border-border/20 hover:border-border/60 rounded-2xl p-4 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer">
                {/* Cover art container */}
                <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0 bg-secondary flex items-center justify-center relative">
                  {playlist.coverImage ? (
                    <img
                      src={playlist.coverImage}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Music size={32} className="text-muted-foreground/60" />
                  )}
                  {/* Status Indicator */}
                  <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white">
                    {playlist.isPublic ? <Globe size={11} className="text-primary" /> : <Lock size={11} />}
                  </div>
                </div>
                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate text-foreground" title={playlist.name}>
                    {playlist.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {playlist._count?.items || 0} songs
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
export const dynamic = "force-dynamic";
