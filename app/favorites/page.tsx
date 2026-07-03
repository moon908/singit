import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserFavorites } from "@/server/actions/favorites";
import FavoritesClient from "@/components/FavoritesClient";

export default async function FavoritesPage() {
  const session = await auth();

  // Protect route
  if (!session) {
    redirect("/login");
  }

  const res = await getUserFavorites();
  const favorites = res.success ? res.favorites || [] : [];

  return <FavoritesClient initialFavorites={favorites} />;
}
export const dynamic = "force-dynamic";
