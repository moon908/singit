"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Track } from "@/types";

// Helper helper function to verify user is authenticated
async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user.id;
}

export async function createPlaylist(name: string, description?: string, isPublic: boolean = true) {
  try {
    const userId = await getUserId();
    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        isPublic,
        userId,
      },
    });
    revalidatePath("/playlists");
    return { success: true, playlist };
  } catch (error: any) {
    console.error("Create playlist error:", error);
    return { success: false, error: error.message || "Failed to create playlist" };
  }
}

export async function deletePlaylist(playlistId: string) {
  try {
    const userId = await getUserId();
    
    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    
    if (!playlist) {
      throw new Error("Playlist not found or access denied");
    }
    
    await prisma.playlist.delete({
      where: { id: playlistId },
    });
    
    revalidatePath("/playlists");
    return { success: true };
  } catch (error: any) {
    console.error("Delete playlist error:", error);
    return { success: false, error: error.message || "Failed to delete playlist" };
  }
}

export async function addTrackToPlaylist(playlistId: string, track: Track) {
  try {
    const userId = await getUserId();
    
    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
      include: { items: true },
    });
    
    if (!playlist) {
      throw new Error("Playlist not found or access denied");
    }
    
    // Get next position index
    const position = playlist.items.length;
    
    const item = await prisma.playlistItem.create({
      data: {
        playlistId,
        trackId: track.id,
        title: track.title,
        artistName: track.artistName,
        albumName: track.albumName,
        coverUrl: track.coverUrl,
        duration: track.duration,
        audioUrl: track.audioUrl,
        position,
      },
    });
    
    revalidatePath(`/playlist/${playlistId}`);
    return { success: true, item };
  } catch (error: any) {
    console.error("Add track to playlist error:", error);
    return { success: false, error: error.message || "Failed to add track" };
  }
}

export async function removeTrackFromPlaylist(playlistId: string, trackItemId: string) {
  try {
    const userId = await getUserId();
    
    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    
    if (!playlist) {
      throw new Error("Playlist not found or access denied");
    }
    
    await prisma.playlistItem.delete({
      where: { id: trackItemId },
    });
    
    // Re-index remaining playlist items to keep clean sequential indexes
    const remainingItems = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
    });
    
    for (let i = 0; i < remainingItems.length; i++) {
      await prisma.playlistItem.update({
        where: { id: remainingItems[i].id },
        data: { position: i },
      });
    }
    
    revalidatePath(`/playlist/${playlistId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Remove track error:", error);
    return { success: false, error: error.message || "Failed to remove track" };
  }
}

export async function reorderPlaylist(playlistId: string, itemIdsOrdered: string[]) {
  try {
    const userId = await getUserId();
    
    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    
    if (!playlist) {
      throw new Error("Playlist not found or access denied");
    }
    
    // Perform updates sequentially
    const updatePromises = itemIdsOrdered.map((id, index) =>
      prisma.playlistItem.update({
        where: { id, playlistId },
        data: { position: index },
      })
    );
    
    await prisma.$transaction(updatePromises);
    
    revalidatePath(`/playlist/${playlistId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Reorder tracks error:", error);
    return { success: false, error: error.message || "Failed to reorder playlist" };
  }
}

export async function getUserPlaylists() {
  try {
    const userId = await getUserId();
    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, playlists };
  } catch (error: any) {
    return { success: false, playlists: [], error: error.message };
  }
}

export async function getPlaylistDetails(playlistId: string) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
        user: {
          select: { name: true, image: true },
        },
      },
    });
    
    if (!playlist) {
      return { success: false, error: "Playlist not found" };
    }
    
    // If private, verify current user is creator
    if (!playlist.isPublic) {
      const session = await auth();
      if (!session?.user?.email || playlist.user.name !== session.user.name) {
        // Find user id of session user to compare directly
        const dbUser = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
        if (playlist.userId !== dbUser?.id) {
          return { success: false, error: "Access denied to private playlist" };
        }
      }
    }
    
    return { success: true, playlist };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load playlist" };
  }
}
