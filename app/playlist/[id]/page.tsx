import React from "react";
import { notFound, redirect } from "next/navigation";
import { getPlaylistDetails } from "@/server/actions/playlists";
import PlaylistClient from "@/components/PlaylistClient";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const session = await auth();

  // Fetch playlist details
  const res = await getPlaylistDetails(id);
  
  if (!res.success || !res.playlist) {
    notFound();
  }

  // Resolve user id from session to check ownership on client
  let userId: string | null = null;
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (dbUser) userId = dbUser.id;
  }

  return (
    <PlaylistClient
      initialPlaylist={res.playlist}
      userId={userId}
    />
  );
}
