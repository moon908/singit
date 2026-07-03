export interface JamendoTrack {
  id: string;
  name: string;
  duration: number; // in seconds
  artist_id: string;
  artist_name: string;
  artist_idstr: string;
  album_name: string;
  album_id: string;
  license_ccurl: string;
  position: number;
  releasedate: string;
  album_image: string;
  image: string;
  audio: string;
  audiodownload: string;
  audiodownload_allowed: boolean;
  shorturl: string;
  shareurl: string;
  waveform: string;
  prourl: string;
}

export interface JamendoAlbum {
  id: string;
  name: string;
  releasedate: string;
  artist_id: string;
  artist_name: string;
  image: string;
  zip: string;
  zip_allowed: boolean;
}

export interface JamendoArtist {
  id: string;
  name: string;
  shorturl: string;
  shareurl: string;
  image: string;
  joindate: string;
  website: string;
}

// Client-friendly clean models
export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl: string;
}

export interface Album {
  id: string;
  name: string;
  releaseDate: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  coverUrl: string;
  joinDate?: string;
  website?: string;
}

export interface Genre {
  id: string;
  name: string;
  color: string; // Gradient color for UI cards
  imageUrl: string;
}
