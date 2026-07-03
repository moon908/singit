"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Mail, Lock, User, LogIn, UserPlus, ShieldAlert, Check } from "lucide-react";
import { registerUser, loginUser } from "@/server/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSignupSuccess(false);

    if (activeTab === "signup") {
      // 1. Sign Up Flow
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const res = await registerUser(formData);
      if (res.success) {
        setSignupSuccess(true);
        setName("");
        // Automatically switch to login tab
        setTimeout(() => {
          setActiveTab("login");
          setSignupSuccess(false);
        }, 1500);
      } else {
        setError(res.error || "Failed to register account");
      }
      setLoading(false);
    } else {
      // 2. Sign In Flow
      try {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        const res = await loginUser(formData);

        if (!res.success) {
          setError(res.error || "Invalid email or password combination");
          setLoading(false);
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 select-none">
      
      {/* Centered Login Card */}
      <div className="w-full max-w-md glass border border-border/30 bg-card/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        
        {/* Soft Background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-8 z-10 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
            <Music size={24} className="animate-pulse" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground mt-2">Welcome to SingIt</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">Stream your favorite high-fidelity sounds freely</p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center w-full bg-secondary/40 p-1.5 rounded-2xl mb-6 z-10 text-[10px] font-bold uppercase tracking-wider shrink-0 select-none">
          <button
            onClick={() => { setActiveTab("login"); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === "login" ? "bg-card text-foreground shadow-md" : "text-secondary-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === "signup" ? "bg-card text-foreground shadow-md" : "text-secondary-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-semibold mb-4 z-10 shrink-0"
            >
              <ShieldAlert size={14} /> {error}
            </motion.div>
          )}
          {signupSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-semibold mb-4 z-10 shrink-0"
            >
              <Check size={14} /> Account created! Redirecting to login...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 text-xs font-semibold z-10 shrink-0">
          {activeTab === "signup" && (
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-6"
          >
            {activeTab === "login" ? (
              <>
                <LogIn size={15} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={15} /> Sign Up
              </>
            )}
          </button>
        </form>

        {/* OAuth Separator */}
        <div className="w-full flex items-center gap-3 my-6 shrink-0 z-10">
          <span className="h-[1px] bg-border/40 flex-1" />
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Or Connect With</span>
          <span className="h-[1px] bg-border/40 flex-1" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full shrink-0 z-10 text-xs font-bold">
          <button
            onClick={() => handleOAuth("google")}
            className="flex items-center justify-center gap-2 py-2.5 border border-border hover:bg-secondary rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {/* Inline mini Google G SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.39 3.65 1.56 7.56l3.86 3C6.34 7.6 9.03 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.6-.21-2.27H12v4.51h6.46c-.28 1.47-1.11 2.72-2.35 3.56l3.66 2.84c2.14-1.97 3.72-4.88 3.72-8.64z"/>
              <path fill="#FBBC05" d="M5.42 10.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.56 3C.56 5.02 0 7.33 0 9.75s.56 4.73 1.56 6.75l3.86-3.19z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-2.97 0-5.66-2.56-6.58-5.52L1.56 15.99C3.39 19.9 7.35 23 12 23z"/>
            </svg>
            Google
          </button>
          
          <button
            onClick={() => handleOAuth("github")}
            className="flex items-center justify-center gap-2 py-2.5 border border-border hover:bg-secondary rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </button>
        </div>

      </div>

    </div>
  );
}
