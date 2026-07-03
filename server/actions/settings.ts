"use server";

import prisma from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getUserSettings() {
  try {
    const userId = await getUserId();
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create defaults if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          theme: "dark",
          language: "en",
          playbackQuality: "high",
          autoplay: true,
          notifications: true,
        },
      });
    }

    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserSettings(data: {
  theme?: string;
  language?: string;
  playbackQuality?: string;
  autoplay?: boolean;
  notifications?: boolean;
  privacyPrivate?: boolean;
}) {
  try {
    const userId = await getUserId();
    
    // Ensure settings record exists first
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        theme: data.theme || "dark",
        language: data.language || "en",
        playbackQuality: data.playbackQuality || "high",
        autoplay: data.autoplay ?? true,
        notifications: data.notifications ?? true,
        privacyPrivate: data.privacyPrivate ?? false,
      },
    });

    revalidatePath("/settings");
    return { success: true, settings };
  } catch (error: any) {
    console.error("Update settings error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProfile(name: string, image?: string) {
  try {
    const userId = await getUserId();
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        ...(image ? { image } : {}),
      },
    });

    revalidatePath("/settings");
    revalidatePath("/profile");
    return { success: true, user };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccount() {
  try {
    const userId = await getUserId();
    
    // Cascading deletions are configured in schema via onDelete: Cascade
    // This will delete user, settings, history, playlists, favorites, sessions, accounts.
    await prisma.user.delete({
      where: { id: userId },
    });

    // Sign out user after deletion
    await signOut({ redirectTo: "/login" });
    return { success: true };
  } catch (error: any) {
    console.error("Delete account error:", error);
    return { success: false, error: error.message };
  }
}
