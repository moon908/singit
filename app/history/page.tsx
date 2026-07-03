import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayHistory } from "@/server/actions/history";
import TrackList from "@/components/TrackList";
import { Track } from "@/types";
import { History as HistoryIcon, Play, Calendar } from "lucide-react";
import PlayQueueButton from "@/components/PlayQueueButton";

export default async function HistoryPage() {
  const session = await auth();

  // Protect route
  if (!session) {
    redirect("/login");
  }

  const res = await getPlayHistory(100); // Fetch last 100 plays
  const historyList = res.success ? res.history || [] : [];

  // Group history by day
  const groupHistoryByDay = (list: any[]) => {
    const groups: Record<string, any[]> = {};
    
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    list.forEach((item) => {
      const itemDate = new Date(item.playedAt);
      const dateStr = itemDate.toDateString();
      
      let key = dateStr;
      if (dateStr === todayStr) key = "Today";
      else if (dateStr === yesterdayStr) key = "Yesterday";
      else {
        key = itemDate.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  };

  const grouped = groupHistoryByDay(historyList);

  // Convert history entries to standard Track shape
  const allTracks: Track[] = historyList.map((h: any) => ({
    id: h.trackId,
    title: h.title,
    artistId: "unknown",
    artistName: h.artistName,
    albumId: "unknown",
    albumName: h.albumName || "",
    coverUrl: h.coverUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
    duration: h.duration,
    audioUrl: h.audioUrl,
  }));

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <HistoryIcon className="text-primary animate-pulse" /> Listening History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your recently played tracks grouped by day</p>
        </div>
        
        {allTracks.length > 0 && (
          <div className="flex items-center gap-2">
            <PlayQueueButton tracks={allTracks} />
            <PlayQueueButton tracks={allTracks} variant="secondary" shuffleInitially={true} />
          </div>
        )}
      </div>

      {/* Grouped lists */}
      {historyList.length === 0 ? (
        <div className="border border-border/20 bg-card/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <HistoryIcon size={48} className="text-primary/40 mb-4 animate-spin-slow" />
          <h3 className="text-base font-bold text-foreground">No history logged yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
            Listen to songs and playlists, and your streaming activity logs will display here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dayLabel, items]) => {
            // Map day items to standard Track shapes
            const dayTracks: Track[] = items.map((h: any) => ({
              id: h.trackId,
              title: h.title,
              artistId: "unknown",
              artistName: h.artistName,
              albumId: "unknown",
              albumName: h.albumName || "",
              coverUrl: h.coverUrl || "https://img.jamendo.com/albums/s6/6122/covers/1.300.jpg",
              duration: h.duration,
              audioUrl: h.audioUrl,
            }));

            return (
              <div key={dayLabel} className="space-y-4">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-border/10 pb-2">
                  <Calendar size={14} /> {dayLabel}
                </h3>
                <div className="glass border border-border/20 rounded-2xl p-4 md:p-6">
                  <TrackList tracks={dayTracks} />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
export const dynamic = "force-dynamic";
