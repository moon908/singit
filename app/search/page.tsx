"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Flame, History, Disc, Radio, Play } from "lucide-react";
import SongCard from "@/components/SongCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Track, Album, Artist } from "@/types";
import { useAudioPlayer } from "@/hooks/use-audio-player";

// Simple custom debounce hook inline to avoid file sprawl
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const player = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "songs" | "albums" | "artists">("all");
  const [loading, setLoading] = useState(false);
  
  const [results, setResults] = useState<{
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
  }>({ tracks: [], albums: [], artists: [] });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 500);

  const trendingSearches = ["Acoustic", "Chillout", "Lofi", "Electronic", "Rock", "Ambient", "Jazz"];

  // Load recent searches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("singit_recent_searches");
      if (cached) {
        setRecentSearches(JSON.parse(cached));
      }
    }
  }, []);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ tracks: [], albums: [], artists: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const searchType = activeTab === "all" ? "all" : activeTab.slice(0, -1); // "track", "album", "artist"
    
    fetch(`/api/music/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}`)
      .then((res) => res.json())
      .then((data) => {
        setResults({
          tracks: data.tracks || [],
          albums: data.albums || [],
          artists: data.artists || [],
        });
        
        // Save to recents
        saveRecentSearch(debouncedQuery.trim());
      })
      .catch((err) => console.error("Search fetch failed:", err))
      .finally(() => setLoading(false));
  }, [debouncedQuery, activeTab]);

  const saveRecentSearch = (search: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== search.toLowerCase());
      const updated = [search, ...filtered].slice(0, 8); // max 8 entries
      if (typeof window !== "undefined") {
        localStorage.setItem("singit_recent_searches", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== search);
      if (typeof window !== "undefined") {
        localStorage.setItem("singit_recent_searches", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("singit_recent_searches");
    }
  };

  // Helper helper function to highlight matched query text
  const highlightMatch = (text: string, match: string) => {
    if (!match.trim() || !text) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${match.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === match.toLowerCase() ? (
            <span key={i} className="text-primary font-bold">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Search Input Bar */}
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs, artists, or albums..."
          className="w-full pl-12 pr-12 py-3.5 bg-card/40 border border-border/40 focus:border-primary rounded-2xl outline-none text-sm transition-all duration-300 placeholder:text-muted-foreground glass"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
          {["all", "songs", "albums", "artists"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-full capitalize transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {!query.trim() ? (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History size={16} className="text-primary" /> Recent Searches
                </h3>
                <button
                  onClick={clearAllRecent}
                  className="text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <div
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 hover:bg-secondary text-xs text-secondary-foreground hover:text-foreground border border-border/30 transition-all duration-200 cursor-pointer"
                  >
                    <span>{s}</span>
                    <button
                      onClick={(e) => removeRecentSearch(s, e)}
                      className="p-0.5 rounded-full hover:bg-secondary-foreground/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Trending Moods
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="px-4 py-2 bg-card/40 border border-border/30 hover:border-primary/40 rounded-xl text-xs text-secondary-foreground hover:text-primary transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                >
                  <Search size={12} /> {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-8">
              {(activeTab === "all" || activeTab === "songs") && (
                <div className="space-y-4">
                  <div className="h-4 bg-secondary/80 rounded-full w-24 animate-pulse" />
                  <SkeletonLoader type="card-grid" count={6} />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tracks Section */}
              {(activeTab === "all" || activeTab === "songs") && results.tracks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Songs</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.tracks.map((track) => (
                      <div key={track.id} className="relative">
                        <SongCard track={track} activeQueue={results.tracks} />
                        {/* Overlay to show match highlights on text elements */}
                        <div className="absolute left-6 bottom-[48px] pointer-events-none text-xs font-semibold text-foreground bg-background/80 px-1 rounded truncate max-w-[120px]">
                          {highlightMatch(track.title, debouncedQuery)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section */}
              {(activeTab === "all" || activeTab === "albums") && results.albums.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Albums</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.albums.map((album) => (
                      <Link key={album.id} href={`/album/${album.id}`}>
                        <div className="group bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col gap-3 shadow-md hover:shadow-xl cursor-pointer">
                          <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0">
                            <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate text-foreground pr-1">
                              {highlightMatch(album.name, debouncedQuery)}
                            </h4>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {album.artistName}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Section */}
              {(activeTab === "all" || activeTab === "artists") && results.artists.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Artists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.artists.map((artist) => (
                      <Link key={artist.id} href={`/artist/${artist.id}`}>
                        <div className="group bg-card/30 hover:bg-card/90 rounded-2xl p-4 border border-border/20 hover:border-border/60 transition-all duration-300 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-xl cursor-pointer">
                          <div className="w-20 h-20 rounded-full overflow-hidden shadow-md shrink-0 border border-border/40">
                            <img src={artist.coverUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="min-w-0 w-full">
                            <h4 className="text-xs font-bold truncate text-foreground">
                              {highlightMatch(artist.name, debouncedQuery)}
                            </h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {results.tracks.length === 0 && results.albums.length === 0 && results.artists.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Search size={48} className="mb-4 opacity-30 text-primary" />
                  <p className="text-sm font-semibold">No results found for &quot;{query}&quot;</p>
                  <p className="text-xs mt-1 max-w-[280px]">Check spelling or try search tags like &quot;Lofi&quot; or &quot;Acoustic&quot;</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
