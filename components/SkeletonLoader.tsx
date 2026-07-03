"use client";

import React from "react";

interface SkeletonLoaderProps {
  type: "card-grid" | "list" | "banner";
  count?: number;
}

export default function SkeletonLoader({ type, count = 5 }: SkeletonLoaderProps) {
  if (type === "card-grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-card/30 border border-border/20 rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="aspect-square w-full bg-secondary/80 rounded-xl animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-secondary/80 rounded-full animate-pulse w-3/4" />
              <div className="h-2.5 bg-secondary/60 rounded-full animate-pulse w-1/2" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="h-2.5 bg-secondary/60 rounded-full animate-pulse w-8" />
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-secondary animate-pulse" />
                <div className="w-5 h-5 rounded-lg bg-secondary animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-2 border-b border-border/10"
          >
            <div className="w-4 text-center animate-pulse text-secondary">#</div>
            <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 bg-secondary/80 rounded-full animate-pulse w-1/4" />
              <div className="h-2.5 bg-secondary/60 rounded-full animate-pulse w-1/6" />
            </div>
            <div className="h-3 bg-secondary/60 rounded-full animate-pulse w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "banner") {
    return (
      <div className="w-full h-48 md:h-64 rounded-3xl bg-secondary/40 border border-border/20 p-6 md:p-8 flex flex-col justify-end gap-3.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent z-0" />
        <div className="h-3.5 bg-secondary/80 rounded-full animate-pulse w-24 z-10" />
        <div className="h-8 bg-secondary/80 rounded-full animate-pulse w-1/2 max-w-sm z-10" />
        <div className="h-4 bg-secondary/60 rounded-full animate-pulse w-1/3 max-w-xs z-10" />
        <div className="h-10 bg-secondary rounded-xl animate-pulse w-28 z-10 mt-2" />
      </div>
    );
  }

  return null;
}
