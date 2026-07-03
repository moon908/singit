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

export async function toggleFavorite(data: {
  type: "TRACK" | "ALBUM" | "ARTIST";
  itemId: string;
  name: string;
  imageUrl?: string;
  subText?: string;
  audioUrl?: string;
  duration?: number;
}) {
  try {
    const userId = await getUserId();
    
    // Check if it already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId,
          type: data.type,
          itemId: data.itemId,
        },
      },
    });

    if (existing) {
      // Remove it
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      revalidatePath("/favorites");
      return { success: true, favorited: false };
    } else {
      // Add it
      await prisma.favorite.create({
        data: {
          userId,
          type: data.type,
          itemId: data.itemId,
          name: data.name,
          imageUrl: data.imageUrl,
          subText: data.subText,
          audioUrl: data.audioUrl,
          duration: data.duration,
        },
      });
      revalidatePath("/favorites");
      return { success: true, favorited: true };
    }
  } catch (error: any) {
    console.error("Toggle favorite error:", error);
    return { success: false, error: error.message };
  }
}

export async function isFavorite(type: "TRACK" | "ALBUM" | "ARTIST", itemId: string) {
  try {
    const userId = await getUserId();
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId,
          type,
          itemId,
        },
      },
    });
    return { success: true, favorited: !!existing };
  } catch (error) {
    return { success: false, favorited: false };
  }
}

export async function getUserFavorites(type?: "TRACK" | "ALBUM" | "ARTIST") {
  try {
    const userId = await getUserId();
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, favorites };
  } catch (error: any) {
    return { success: false, favorites: [], error: error.message };
  }
}
