"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, LogIn } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Authentication failed");
      return;
    }
    router.push(data.user.role === "MANAGER" ? "/manager" : "/planner");
    router.refresh();
  }

  async function demoLogin(demoEmail: string, demoPassword: string) {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(data.user.role === "MANAGER" ? "/manager" : "/planner");
      router.refresh();
    } else {
      setError(data.error || "Demo login failed");
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="glass-card rounded-3xl p-7 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {isRegister ? "Create Traveler Account" : "Sign In to Travel Assistant"}
          </h1>
          <p className="text-xs text-slate-500">
            Save itineraries, clone community plans, or access the Manager Operations Hub.
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div className="space-y-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
            Instant Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => demoLogin("traveler@demo.com", "demo123")}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              <User className="h-3.5 w-3.5" /> Demo User
            </button>
            <button
              type="button"
              onClick={() => demoLogin("manager@demo.com", "admin123")}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Demo Manager
            </button>
          </div>
        </div>

        {error && <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</div>}

        <form onSubmit={submitAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                placeholder="Nguyen Van A"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Authenticating..." : isRegister ? "Register Account" : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600">
          {isRegister ? "Already have an account?" : "New to Travel Assistant?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-semibold text-teal-700 hover:underline"
          >
            {isRegister ? "Sign In" : "Create Traveler Account"}
          </button>
        </div>
      </div>
    </div>
  );
}