import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getListeningStats } from "@/server/actions/history";
import { BarChart3, Clock, PlayCircle, Trophy, Disc, Radio, Calendar } from "lucide-react";

export default async function StatsPage() {
  const session = await auth();

  // Protect route
  if (!session) {
    redirect("/login");
  }

  const res = await getListeningStats();
  if (!res.success) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load listening statistics.
      </div>
    );
  }

  const { stats = [], topSongs = [], topArtists = [] } = res;

  // Calculate totals
  const totalSeconds = stats.reduce((acc: number, s: any) => acc + s.listeningTime, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalTracks = stats.reduce((acc: number, s: any) => acc + s.trackCount, 0);
  
  const dailyAverageMin = stats.length > 0 
    ? Math.round(totalMinutes / stats.length) 
    : 0;

  // Format date labels for chart, e.g. "Mon", "Tue"
  const getDayName = (dateStr: Date) => {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: "short" });
  };

  // Find max listening time to calculate relative bar heights in chart
  const maxListeningTime = stats.length > 0 
    ? Math.max(...stats.map((s: any) => s.listeningTime)) 
    : 1;

  return (
    <div className="space-y-10 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="text-primary animate-pulse" /> Listening Insights
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Explore your personalized streaming analytics and top charts</p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Play Time Card */}
        <div className="glass border border-border/20 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden bg-card/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-6 -translate-y-6 blur-md" />
          <div className="p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">Listening Time</span>
            <h3 className="text-2xl font-black text-foreground mt-0.5">{totalHours} hrs</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{totalMinutes} total minutes</p>
          </div>
        </div>

        {/* Songs Count Card */}
        <div className="glass border border-border/20 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden bg-card/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-6 -translate-y-6 blur-md" />
          <div className="p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl shrink-0">
            <PlayCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">Tracks Played</span>
            <h3 className="text-2xl font-black text-foreground mt-0.5">{totalTracks}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Across custom mixes & albums</p>
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="glass border border-border/20 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden bg-card/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-6 -translate-y-6 blur-md" />
          <div className="p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">Daily Average</span>
            <h3 className="text-2xl font-black text-foreground mt-0.5">{dailyAverageMin} min</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Average streaming time per day</p>
          </div>
        </div>

      </div>

      {/* Listening Time Bar Chart */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Calendar size={18} className="text-primary" /> Daily Activity (Last 7 Days)
        </h2>
        <div className="glass border border-border/20 rounded-3xl p-6 md:p-8 flex flex-col gap-6 bg-card/30">
          {stats.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No activity logs recorded. Stream music to generate charts.
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between w-full max-w-xl mx-auto px-4 border-b border-border/20">
              {stats.map((s, index) => {
                // Calculate height factor
                const pct = (s.listeningTime / maxListeningTime) * 100;
                const minutes = Math.floor(s.listeningTime / 60);

                return (
                  <div key={s.id} className="flex flex-col items-center flex-1 group gap-2">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-secondary border border-border px-2 py-1 rounded-lg text-[9px] font-bold absolute -translate-y-12 select-none pointer-events-none tabular-nums shadow-lg">
                      {minutes} min
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(pct, 5)}%` }}
                      className="w-8 sm:w-12 bg-gradient-to-t from-primary/75 to-primary rounded-t-xl group-hover:to-primary-hover hover:scale-x-105 transition-all duration-300 shadow-md shadow-primary/10"
                    />
                    {/* X Axis Label */}
                    <span className="text-[9px] text-muted-foreground font-extrabold tracking-wider uppercase mt-1">
                      {getDayName(s.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Leaderboards row */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Top Songs */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Disc size={18} className="text-primary animate-pulse" /> Top Tracks
          </h2>
          <div className="glass border border-border/20 rounded-3xl p-4 bg-card/30 space-y-2.5">
            {topSongs.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No songs streamed yet</div>
            ) : (
              topSongs.map((song, index) => (
                <div key={song.trackId} className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-secondary/40 transition-colors">
                  <span className={`w-6 text-center text-xs font-black ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-foreground pr-2">{song.title}</h4>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{song.artistName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {song.count} plays
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Artists */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Radio size={18} className="text-primary" /> Top Artists
          </h2>
          <div className="glass border border-border/20 rounded-3xl p-4 bg-card/30 space-y-2.5">
            {topArtists.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No artists streamed yet</div>
            ) : (
              topArtists.map((artist, index) => (
                <div key={artist.artistName} className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-secondary/40 transition-colors">
                  <span className={`w-6 text-center text-xs font-black ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-foreground pr-2">{artist.artistName}</h4>
                    <p className="text-[9px] text-muted-foreground">Artist Profile</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-bold">
                      {artist.count} plays
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
export const dynamic = "force-dynamic";
