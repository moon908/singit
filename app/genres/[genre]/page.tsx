import React from "react";
import { JamendoService } from "@/services/jamendo";
import GenreClient from "@/components/GenreClient";

interface GenrePageProps {
  params: Promise<{ genre: string }>;
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = await params;

  // Fetch initial tracks list
  const initialTracks = await JamendoService.getTracksByGenre(genre, 18);

  return <GenreClient genre={genre} initialTracks={initialTracks} />;
}
export const revalidate = 3600; // Cache genre page lists for 1 hour
