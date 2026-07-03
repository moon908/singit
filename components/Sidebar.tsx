"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Compass,
  Music,
  Radio,
  User,
  Heart,
  ListMusic,
  History,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { getUserPlaylists } from "@/server/actions/playlists";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      getUserPlaylists().then((res) => {
        if (res.success && res.playlists) {
          setPlaylists(res.playlists);
        }
      });
    }
  }, [session, pathname]); // reload on pathname change to catch new playlists

  const mainNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Discover", href: "/discover", icon: Compass },
  ];

  const libraryItems = [
    { name: "Genres", href: "/genres", icon: Radio },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "Playlists", href: "/playlists", icon: ListMusic },
    { name: "History", href: "/history", icon: History },
  ];

  const userItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const renderNavLinks = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;

      return (
        <Link key={item.name} href={item.href}>
          <div
            className={`group relative flex items-center gap-4 px-4 py-3.5 my-1 rounded-xl transition-all duration-300 cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm tracking-wide"
              >
                {item.name}
              </motion.span>
            )}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-16 px-3 py-1.5 rounded-lg bg-card text-foreground border border-border text-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg whitespace-nowrap">
                {item.name}
              </div>
            )}
          </div>
        </Link>
      );
    });
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-full glass border-r border-border bg-card/60 select-none shrink-0 overflow-y-auto no-scrollbar relative z-30"
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-5 h-[76px] shrink-0 border-b border-border/40">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/30 border border-primary/10 shrink-0">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-lg font-bold bg-gradient-to-r from-foreground to-secondary-foreground bg-clip-text text-transparent tracking-wide"
              >
                SingIt
              </motion.span>
            )}
          </div>
        </Link>

        {/* Collapse Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center my-3 shrink-0">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-xl text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <div className="px-3 py-4 shrink-0">
        <div className="space-y-1">{renderNavLinks(mainNavItems)}</div>
      </div>

      {/* Music Library */}
      <div className="px-3 py-2 shrink-0">
        {!isCollapsed && (
          <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Library
          </h3>
        )}
        <div className="space-y-1">{renderNavLinks(libraryItems)}</div>
      </div>

      {/* Custom Playlists List */}
      {!isCollapsed && session && (
        <div className="px-3 py-4 flex-1 flex flex-col min-h-[160px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 mb-1 shrink-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Playlists
            </h3>
            <Link href="/playlists">
              <PlusCircle size={16} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
            {playlists.length === 0 ? (
              <p className="px-4 py-2 text-xs text-muted-foreground italic">No playlists created</p>
            ) : (
              playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                  <div
                    className={`px-4 py-2 text-sm rounded-lg truncate cursor-pointer transition-colors ${
                      pathname === `/playlist/${playlist.id}`
                        ? "text-primary font-medium bg-primary/10"
                        : "text-secondary-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    {playlist.name}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* User Section (Profile, Settings) */}
      <div className="px-3 py-4 shrink-0 border-t border-border/40 mt-auto bg-card/10">
        {!isCollapsed && !session && (
          <div className="px-4 py-2 mb-2">
            <Link href="/login">
              <button className="w-full py-2 text-xs bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        )}
        <div className="space-y-1">{renderNavLinks(userItems)}</div>
      </div>
    </motion.aside>
  );
}
