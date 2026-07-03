import { JamendoTrack, JamendoAlbum, JamendoArtist, Track, Album, Artist } from "@/types";

const BASE_URL = "https://api.jamendo.com/v3.0";
const CLIENT_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID || "c18b767d";

// Helper helper function to map raw Jamendo Track to Clean Track
export function mapJamendoTrack(t: JamendoTrack): Track {
  return {
    id: t.id,
    title: t.name,
    artistId: t.artist_id,
    artistName: t.artist_name,
    albumId: t.album_id || "single",
    albumName: t.album_name || "Single",
    coverUrl: t.image || t.album_image || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
    duration: t.duration,
    audioUrl: t.audio || `https://mp3d.jamendo.com/download/track/${t.id}/mp32/`,
  };
}

// Helper to map raw Jamendo Album to Clean Album
export function mapJamendoAlbum(a: JamendoAlbum): Album {
  return {
    id: a.id,
    name: a.name,
    releaseDate: a.releasedate,
    artistId: a.artist_id,
    artistName: a.artist_name,
    coverUrl: a.image || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
  };
}

// Helper to map raw Jamendo Artist to Clean Artist
export function mapJamendoArtist(art: JamendoArtist): Artist {
  return {
    id: art.id,
    name: art.name,
    coverUrl: art.image || "https://img.jamendo.com/artists/s6/6122/covers/1.300.jpg",
    joinDate: art.joindate,
    website: art.website,
  };
}

// Generic fetching function with retry and caching logic
async function fetchFromJamendo<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  revalidate: number = 3600 // 1 hour cache by default
): Promise<T[]> {
  const urlParams = new URLSearchParams();
  urlParams.set("client_id", CLIENT_ID);
  urlParams.set("format", "json");

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      urlParams.set(key, String(val));
    }
  });

  const url = `${BASE_URL}${endpoint}?${urlParams.toString()}`;

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        next: { revalidate },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.headers?.status === "failed") {
        throw new Error(data.headers.error_message || "API request failed");
      }

      return (data.results as T[]) || [];
    } catch (error) {
      retries--;
      console.warn(`Jamendo API fetch failed. Retries remaining: ${retries}. Error: ${error}`);
      if (retries === 0) {
        console.error("Jamendo API failed after 3 attempts:", url);
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  return [];
}

// Service Methods
export const JamendoService = {
  /**
   * Get trending tracks based on weekly popularity
   */
  async getTrendingTracks(limit: number = 20, offset: number = 0): Promise<Track[]> {
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        limit,
        offset,
        order: "popularity_week_desc",
        audioformat: "mp32",
        imagesize: 300,
      },
      1800 // 30 minutes cache for trending
    );
    return raw.map(mapJamendoTrack);
  },

  /**
   * Get popular albums
   */
  async getPopularAlbums(limit: number = 20, offset: number = 0): Promise<Album[]> {
    const raw = await fetchFromJamendo<JamendoAlbum>(
      "/albums/",
      {
        limit,
        offset,
        order: "popularity_total_desc",
        imagesize: 300,
      },
      3600 // 1 hour cache
    );
    return raw.map(mapJamendoAlbum);
  },

  /**
   * Get featured/popular artists
   */
  async getFeaturedArtists(limit: number = 20, offset: number = 0): Promise<Artist[]> {
    const raw = await fetchFromJamendo<JamendoArtist>(
      "/artists/",
      {
        limit,
        offset,
        order: "popularity_total_desc",
        imagesize: 300,
      },
      3600 // 1 hour cache
    );
    return raw.map(mapJamendoArtist);
  },

  /**
   * Search tracks
   */
  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    if (!query) return [];
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        search: query,
        limit,
        audioformat: "mp32",
        imagesize: 300,
      },
      300 // 5 minutes cache for search
    );
    return raw.map(mapJamendoTrack);
  },

  /**
   * Search albums
   */
  async searchAlbums(query: string, limit: number = 20): Promise<Album[]> {
    if (!query) return [];
    const raw = await fetchFromJamendo<JamendoAlbum>(
      "/albums/",
      {
        namesearch: query,
        limit,
        imagesize: 300,
      },
      300
    );
    return raw.map(mapJamendoAlbum);
  },

  /**
   * Search artists
   */
  async searchArtists(query: string, limit: number = 20): Promise<Artist[]> {
    if (!query) return [];
    const raw = await fetchFromJamendo<JamendoArtist>(
      "/artists/",
      {
        namesearch: query,
        limit,
        imagesize: 300,
      },
      300
    );
    return raw.map(mapJamendoArtist);
  },

  /**
   * Get track details by ID
   */
  async getTrackById(id: string): Promise<Track | null> {
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        id,
        audioformat: "mp32",
        imagesize: 300,
      },
      86400 // 24 hours cache (static metadata)
    );
    return raw.length > 0 ? mapJamendoTrack(raw[0]) : null;
  },

  /**
   * Get tracks in an album
   */
  async getTracksByAlbumId(albumId: string): Promise<Track[]> {
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        album_id: albumId,
        audioformat: "mp32",
        imagesize: 300,
        order: "position_asc",
      },
      86400
    );
    return raw.map(mapJamendoTrack);
  },

  /**
   * Get tracks by an artist
   */
  async getTracksByArtistId(artistId: string, limit: number = 20): Promise<Track[]> {
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        artist_id: artistId,
        audioformat: "mp32",
        imagesize: 300,
        limit,
        order: "popularity_total_desc",
      },
      86400
    );
    return raw.map(mapJamendoTrack);
  },

  /**
   * Get artist details by ID
   */
  async getArtistById(artistId: string): Promise<Artist | null> {
    const raw = await fetchFromJamendo<JamendoArtist>(
      "/artists/",
      {
        id: artistId,
        imagesize: 300,
      },
      86400
    );
    return raw.length > 0 ? mapJamendoArtist(raw[0]) : null;
  },

  /**
   * Get albums by artist ID
   */
  async getAlbumsByArtistId(artistId: string, limit: number = 10): Promise<Album[]> {
    const raw = await fetchFromJamendo<JamendoAlbum>(
      "/albums/",
      {
        artist_id: artistId,
        limit,
        imagesize: 300,
      },
      86400
    );
    return raw.map(mapJamendoAlbum);
  },

  /**
   * Get album details by ID
   */
  async getAlbumById(albumId: string): Promise<Album | null> {
    const raw = await fetchFromJamendo<JamendoAlbum>(
      "/albums/",
      {
        id: albumId,
        imagesize: 300,
      },
      86400
    );
    return raw.length > 0 ? mapJamendoAlbum(raw[0]) : null;
  },

  /**
   * Get tracks by genre (tag)
   */
  async getTracksByGenre(genre: string, limit: number = 20, offset: number = 0): Promise<Track[]> {
    const raw = await fetchFromJamendo<JamendoTrack>(
      "/tracks/",
      {
        tags: genre,
        limit,
        offset,
        audioformat: "mp32",
        imagesize: 300,
        order: "popularity_week_desc",
      },
      1800
    );
    return raw.map(mapJamendoTrack);
  },
};
