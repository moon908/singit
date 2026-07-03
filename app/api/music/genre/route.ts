import { NextResponse } from "next/server";
import { JamendoService } from "@/services/jamendo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!genre) {
    return NextResponse.json({ error: "Genre parameter is required" }, { status: 400 });
  }

  try {
    const tracks = await JamendoService.getTracksByGenre(genre, limit, offset);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Genre API route error:", error);
    return NextResponse.json({ error: "Failed to fetch genre music" }, { status: 500 });
  }
}
