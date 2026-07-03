"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Compass, Heart, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass border-t border-border bg-card/75 flex items-center justify-around px-2 pb-safe z-40 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.name} href={item.href} className="flex-1 py-1">
            <div className="flex flex-col items-center justify-center gap-1 cursor-pointer">
              <div
                className={`p-1 rounded-xl transition-all duration-300 ${
                  isActive ? "text-primary scale-110" : "text-secondary-foreground"
                }`}
              >
                <Icon size={22} />
              </div>
              <span
                className={`text-[10px] tracking-wide font-medium transition-colors ${
                  isActive ? "text-primary font-semibold" : "text-secondary-foreground"
                }`}
              >
                {item.name}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
