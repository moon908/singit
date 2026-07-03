"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function updatePlaylistMetadata(
  playlistId: string,
  data: {
    name: string;
    description?: string;
    isPublic: boolean;
    coverImage?: string;
  }
) {
  try {
    const userId = await getUserId();
    
    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    
    if (!playlist) {
      throw new Error("Playlist not found or access denied");
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        coverImage: data.coverImage || null,
      },
    });

    revalidatePath(`/playlist/${playlistId}`);
    revalidatePath("/playlists");
    return { success: true, playlist: updated };
  } catch (error: any) {
    console.error("Update playlist metadata error:", error);
    return { success: false, error: error.message };
  }
}
