import { NextResponse } from "next/server";
import { JamendoService } from "@/services/jamendo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "all"; // "all" | "track" | "album" | "artist"
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (!query) {
    return NextResponse.json({ tracks: [], albums: [], artists: [] });
  }

  try {
    // Parallelize search requests to optimize performance
    const promises: Promise<any>[] = [];

    if (type === "all" || type === "track") {
      promises.push(JamendoService.searchTracks(query, limit));
    } else {
      promises.push(Promise.resolve([]));
    }

    if (type === "all" || type === "album") {
      promises.push(JamendoService.searchAlbums(query, limit));
    } else {
      promises.push(Promise.resolve([]));
    }

    if (type === "all" || type === "artist") {
      promises.push(JamendoService.searchArtists(query, limit));
    } else {
      promises.push(Promise.resolve([]));
    }

    const [tracks, albums, artists] = await Promise.all(promises);

    return NextResponse.json({ tracks, albums, artists });
  } catch (error) {
    console.error("Search API route failed:", error);
    return NextResponse.json({ error: "Failed to fetch music data" }, { status: 500 });
  }
}
