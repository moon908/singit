"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sun, Moon, LogIn, LogOut, Settings, User } from "lucide-react";
import { useTheme } from "@/components/providers";
import Sidebar from "./Sidebar";
import Player from "./Player";
import MobileNav from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground select-none">
      {/* Sidebar Navigation */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Header */}
        <header className="h-[76px] px-6 shrink-0 flex items-center justify-between border-b border-border/20 glass bg-background/50 relative z-10">
          {/* History Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full bg-card hover:bg-secondary text-secondary-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="w-9 h-9 rounded-full bg-card hover:bg-secondary text-secondary-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex-1 sm:hidden">
            {/* Logo for mobile header */}
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">SingIt</span>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-card hover:bg-secondary text-secondary-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-full bg-card hover:bg-secondary border border-border/60 transition-colors cursor-pointer"
                >
                  <img
                    src={session.user?.image || "https://avatars.githubusercontent.com/u/1012345?v=4"}
                    alt={session.user?.name || "User Avatar"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="hidden sm:inline text-xs font-semibold px-1 max-w-[100px] truncate">
                    {session.user?.name}
                  </span>
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 glass border border-border rounded-2xl p-1.5 z-50 shadow-2xl flex flex-col">
                      <div className="px-3 py-2 border-b border-border/30 mb-1 select-none">
                        <p className="text-xs font-bold truncate">{session.user?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{session.user?.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setShowProfileMenu(false)}>
                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                          <User size={14} /> Profile
                        </div>
                      </Link>
                      <Link href="/settings" onClick={() => setShowProfileMenu(false)}>
                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                          <Settings size={14} /> Settings
                        </div>
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/login" });
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm cursor-pointer">
                  <LogIn size={14} /> Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-card/30 to-background p-6 pb-28 md:pb-32 no-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        
        {/* Sticky Player */}
        <Player />

        {/* Mobile Navigation Tabs */}
        <MobileNav />
      </div>
    </div>
  );
}
