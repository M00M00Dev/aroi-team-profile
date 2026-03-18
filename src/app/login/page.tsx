"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * AROI LOGIN - STAGE 3 (BRANDED NAVY & CUSTOM ORANGE)
 * Background: #061E30
 * Button: #ffa449
 */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const ADMIN_EMAIL = "aroi.pty.ltd@gmail.com";
  const ADMIN_PASS = "Lone2324!";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `aroi_session=true; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.push("/");
      router.refresh();
    } else {
      setError("Invalid credentials. Access denied.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#061E30] text-white px-4 selection:bg-[#ffa449]/30 font-sans">
      {/* Background Decorative Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-[400px] z-10">
        {/* Glassmorphic Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-black tracking-tighter text-white">
              AROI
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold mt-3 uppercase tracking-[0.4em] ml-1">
              Team Profile
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#ffa449]/50 transition-all shadow-inner"
                placeholder="aroi.pty.ltd@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#ffa449]/50 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-6 flex items-center justify-center gap-2 shadow-lg ${
                loading 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-[#ffa449] text-[#061E30] hover:bg-[#ffb469] hover:shadow-[0_0_25px_rgba(255,164,73,0.3)] active:scale-[0.97]"
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : "Enter Dashboard"}
            </button>
          </form>
        </div>

        {/* Branding Footer */}
        <div className="mt-12 text-center opacity-30">
          <p className="text-[9px] font-bold text-white uppercase tracking-[0.5em]">
            AROI PTY LTD • 2026
          </p>
        </div>
      </div>
    </div>
  );
}