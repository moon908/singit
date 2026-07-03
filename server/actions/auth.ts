"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { signIn } from "@/auth";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function registerUser(formData: any) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "Email is already registered" };
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        settings: {
          create: {
            theme: "dark",
            language: "en",
            playbackQuality: "high",
            autoplay: true,
            notifications: true,
          },
        },
      },
    });

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Failed to register user" };
  }
}

export async function loginUser(formData: any) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error: any) {
    // Bubble up next.js redirection errors
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    const isCredentialsError = error.type === "CredentialsSignin" || 
                              error.message?.includes("CredentialsSignin") ||
                              error.code === "credentials";

    if (isCredentialsError) {
      return { success: false, error: "Invalid email or password combination" };
    }

    console.error("Login action error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
