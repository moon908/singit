"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, User, Sliders, Volume2, ShieldAlert, Check, RefreshCw, Trash2 } from "lucide-react";
import { getUserSettings, updateUserSettings, updateProfile, deleteAccount } from "@/server/actions/settings";
import { useTheme } from "@/components/providers";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Settings State
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [playbackQuality, setPlaybackQuality] = useState("high");
  const [autoplay, setAutoplay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (session) {
      setProfileName(session.user?.name || "");
      setProfileImage(session.user?.image || "");
      
      getUserSettings().then((res) => {
        if (res.success && res.settings) {
          setPlaybackQuality(res.settings.playbackQuality);
          setAutoplay(res.settings.autoplay);
          setNotifications(res.settings.notifications);
          setLanguage(res.settings.language);
        }
      });
    } else {
      router.push("/login");
    }
  }, [session]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Profile Metadata
      const profileRes = await updateProfile(profileName, profileImage || undefined);
      
      // 2. Update Database Settings
      const settingsRes = await updateUserSettings({
        playbackQuality,
        autoplay,
        notifications,
        language,
        theme, // sync current client theme
      });

      if (profileRes.success && settingsRes.success) {
        // Sync to client NextAuth session dynamically
        await updateSession({
          name: profileName,
          image: profileImage,
        });

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const res = await deleteAccount();
      if (res.success) {
        router.push("/login");
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-8 select-none max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="text-primary animate-pulse" /> Settings Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Customize your playback settings, theme, and profile details</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-semibold">
        
        {/* Profile Card */}
        <section className="glass border border-border/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/10 pb-2">
            <User size={16} className="text-primary" /> Profile Settings
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Display Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Avatar Image URL (Optional)</label>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2.5 bg-secondary/60 border border-border focus:border-primary rounded-xl outline-none"
              />
            </div>
          </div>
        </section>

        {/* Playback Settings */}
        <section className="glass border border-border/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/10 pb-2">
            <Volume2 size={16} className="text-primary" /> Playback Config
          </h3>
          
          <div className="space-y-4">
            {/* Playback Quality */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Audio Playback Quality</h4>
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">High quality uses high bitrate streams</p>
              </div>
              <select
                value={playbackQuality}
                onChange={(e) => setPlaybackQuality(e.target.value)}
                className="bg-card border border-border px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="high">High (128kbps)</option>
                <option value="low">Standard (96kbps)</option>
              </select>
            </div>

            {/* Autoplay */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Autoplay Next Track</h4>
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Automatically stream recommended tracks after queue ends</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoplay(!autoplay)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoplay ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-transform ${autoplay ? "left-[22px]" : "left-[4px]"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Interface Settings */}
        <section className="glass border border-border/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/10 pb-2">
            <Sliders size={16} className="text-primary" /> App Interface
          </h3>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Theme Skin</h4>
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Current theme skin mode</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 border border-border bg-card rounded-xl text-[10px] font-bold hover:bg-secondary cursor-pointer capitalize"
              >
                {theme} Mode
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Interface Language</h4>
                <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Select local dictionary strings</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-card border border-border px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save Footer Row */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-primary font-bold flex items-center gap-1">
              <Check size={14} /> Settings Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Delete Account Section */}
      <section className="glass border border-rose-500/20 bg-rose-500/5 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2 border-b border-rose-500/10 pb-2">
          <ShieldAlert size={16} /> Danger Zone
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground leading-relaxed max-w-md font-normal">
            <span className="font-bold text-foreground">Delete Account Permanently:</span> This action is irreversible and cascades all custom playlists, listening history logs, favorites, settings, and profile details off the servers.
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteWarning(true)}
            className="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-900/15 cursor-pointer shrink-0"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Confirm Delete Warning modal overlay */}
      {showDeleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteWarning(false)} />
          <div className="w-full max-w-sm bg-card border border-rose-500/30 glass rounded-3xl p-6 relative z-10 shadow-2xl flex flex-col items-center text-center">
            <ShieldAlert size={40} className="text-rose-500 mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-foreground">Permanently Delete Account?</h3>
            <p className="text-xs text-muted-foreground mt-2 font-normal leading-relaxed">
              Are you absolutely sure? This will delete all your custom playlists, favorites, and music stats forever. This cannot be undone.
            </p>
            <div className="flex items-center gap-3 w-full mt-6 text-xs font-bold">
              <button
                onClick={() => setShowDeleteWarning(false)}
                className="flex-1 py-2.5 border border-border hover:bg-secondary rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-md shadow-rose-900/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
