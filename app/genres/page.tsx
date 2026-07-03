import React from "react";
import Link from "next/link";
import { Radio, Music } from "lucide-react";

export default function GenresPage() {
  const genres = [
    { name: "Acoustic", tag: "acoustic", color: "from-amber-600 to-yellow-500" },
    { name: "Ambient", tag: "ambient", color: "from-zinc-800 to-zinc-600" },
    { name: "Classical", tag: "classical", color: "from-teal-600 to-emerald-500" },
    { name: "Chillout", tag: "chillout", color: "from-blue-600 to-cyan-500" },
    { name: "Electronic", tag: "electronic", color: "from-purple-600 to-indigo-500" },
    { name: "Folk", tag: "folk", color: "from-orange-600 to-amber-500" },
    { name: "Hip Hop", tag: "hiphop", color: "from-rose-600 to-pink-500" },
    { name: "Jazz", tag: "jazz", color: "from-amber-800 to-orange-700" },
    { name: "Lofi Beats", tag: "lofi", color: "from-indigo-600 via-purple-600 to-pink-500" },
    { name: "Metal", tag: "metal", color: "from-slate-800 to-slate-600" },
    { name: "Pop", tag: "pop", color: "from-pink-500 to-rose-400" },
    { name: "Rock", tag: "rock", color: "from-red-600 to-orange-500" },
    { name: "Soul / R&B", tag: "soul", color: "from-emerald-700 to-teal-500" },
    { name: "Soundtracks", tag: "soundtrack", color: "from-violet-600 to-fuchsia-500" },
  ];

  return (
    <div className="space-y-8 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Radio className="text-primary animate-pulse" /> Music Genres
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Explore tracks sorted by musical styles and mood genres</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {genres.map((g) => (
          <Link key={g.tag} href={`/genres/${g.tag}`}>
            <div className={`group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${g.color} p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full translate-x-6 -translate-y-6 blur-md group-hover:scale-115 transition-transform duration-300" />
              <div className="p-1 rounded-xl bg-white/10 w-fit text-white shrink-0">
                <Music size={16} />
              </div>
              <span className="text-sm font-extrabold text-white leading-tight">{g.name}</span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
