"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Track } from "@/types";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function logPlayHistory(track: Track) {
  try {
    const userId = await getUserId();
    
    // Log history entry
    const historyEntry = await prisma.history.create({
      data: {
        userId,
        trackId: track.id,
        title: track.title,
        artistName: track.artistName,
        albumName: track.albumName,
        coverUrl: track.coverUrl,
        duration: track.duration,
        audioUrl: track.audioUrl,
      },
    });

    // Update daily listening stats
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const existingStats = await prisma.listeningStats.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingStats) {
      await prisma.listeningStats.update({
        where: { id: existingStats.id },
        data: {
          listeningTime: existingStats.listeningTime + track.duration,
          trackCount: existingStats.trackCount + 1,
        },
      });
    } else {
      await prisma.listeningStats.create({
        data: {
          userId,
          date: today,
          listeningTime: track.duration,
          trackCount: 1,
        },
      });
    }

    revalidatePath("/history");
    revalidatePath("/stats");
    return { success: true, historyEntry };
  } catch (error: any) {
    console.error("Log history error:", error);
    return { success: false, error: error.message };
  }
}

export async function getPlayHistory(limit: number = 50) {
  try {
    const userId = await getUserId();
    const history = await prisma.history.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: limit,
    });
    return { success: true, history };
  } catch (error: any) {
    return { success: false, history: [], error: error.message };
  }
}

export async function getListeningStats() {
  try {
    const userId = await getUserId();
    
    // Get last 7 days of stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const stats = await prisma.listeningStats.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "asc" },
    });
    
    // Also aggregate top songs from history
    const history = await prisma.history.findMany({
      where: { userId },
      select: {
        trackId: true,
        title: true,
        artistName: true,
        coverUrl: true,
      },
    });
    
    // Calculate top songs count locally
    const trackCounts: Record<string, { count: number; title: string; artistName: string; coverUrl: string }> = {};
    history.forEach((h) => {
      if (trackCounts[h.trackId]) {
        trackCounts[h.trackId].count++;
      } else {
        trackCounts[h.trackId] = {
          count: 1,
          title: h.title,
          artistName: h.artistName,
          coverUrl: h.coverUrl || "",
        };
      }
    });
    
    const topSongs = Object.entries(trackCounts)
      .map(([trackId, info]) => ({ trackId, ...info }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top artists count locally
    const artistCounts: Record<string, { count: number; artistName: string }> = {};
    history.forEach((h) => {
      if (artistCounts[h.artistName]) {
        artistCounts[h.artistName].count++;
      } else {
        artistCounts[h.artistName] = {
          count: 1,
          artistName: h.artistName,
        };
      }
    });

    const topArtists = Object.values(artistCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      stats,
      topSongs,
      topArtists,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
